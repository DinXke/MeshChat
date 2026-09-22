/* ===================== Application: state, persistence, model ===================== */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const APP_BUILD = '__BUILD__'; // wordt door build.sh vervangen door datum+commit; basis van de updatecheck
const APP_VERSION = '0.3.7', APP_REPO = 'https://github.com/DinXke/MeshChat', APP_AUTHOR = 'DinX';
const LS_KEY = 'mcirc.v1';
const MAX_HIST = 400;

const S = {
  client: new MeshCoreClient(),
  self: null, dev: null, batt: null, devTimeOffset: 0,
  contacts: new Map(),         // pub -> contact (+ local extras: alias, note, fav, lastSnr, lastSeen, loggedIn, perms)
  channels: [],                // idx -> {idx, name, secret}
  convs: new Map(),            // key -> conversation
  active: 'status',
  pendingAdverts: new Map(),   // pub -> contact (manual-add mode)
  rxLog: [],                   // decoded raw packets from PUSH_CODE_LOG_RX_DATA
  defaultScope: null,          // {name, key} from device
  sendScope: { mode: 'default', name: '', key: '' }, // default | unscoped | custom
  chanScope: {},               // channel secret -> { mode, name, key } (per kanaal; leeg = globale verzendscope)
  deviceScopeKey: undefined,   // wat er nu op de node als verzendscope staat (null = zonder scope)
  extras: {},                  // pub -> {alias, note, fav}
  roomPw: {},                  // pub -> {pw, auto}
  settings: { theme: 'auto', ts: true, compact: false, meta: true, notif: true, debug: false, showSensorsAsRepeaters: true, staleDays: 7, favOnly: true, regions: [], tropo: false, tropoH: 0, tropoOp: 30, statusPopup: 'manual' },
  connecting: false, syncing: false, msgSeq: 0,
};

// ---------- persistence ----------
function loadState() {
  try {
    const st = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    Object.assign(S.settings, st.settings || {});
    S.extras = st.extras || {}; S.roomPw = st.roomPw || {}; S.sendScope = st.sendScope || S.sendScope; S.contactsSync = st.contactsSync || null; S.chanScope = st.chanScope || {}; if (!Array.isArray(S.settings.regions)) S.settings.regions = [];
    for (const c of (st.contacts || [])) S.contacts.set(c.pub, c);
    S.channels = st.channels || [];
    for (const [key, meta] of Object.entries(st.convs || {})) { const cv = mkConv(key, meta.kind, meta.name, meta.pub, meta.secret); cv.msgs = (st.history || {})[key] || []; cv.lastRead = meta.lastRead || 0; for (const m of cv.msgs) if ((m.kind === 'msg' || m.kind === 'action') && m.nick && !m.self) cv.users.set(m.nick, { nick: m.nick, last: m.t, snr: m.snr, pub: m.pub }); }
  } catch (e) { console.warn('state load', e); }
}
let saveTimer = null;
function saveState(now) {
  clearTimeout(saveTimer);
  const doSave = () => {
    try {
      const convs = {}, history = {};
      for (const [k, cv] of S.convs) { if (k === 'status') continue; convs[k] = { kind: cv.kind, name: cv.name, pub: cv.pub, secret: cv.secret, lastRead: cv.lastRead }; history[k] = cv.msgs.slice(-MAX_HIST).map(m => { const { _timer, ...rest } = m; return rest; }); }
      const contacts = Array.from(S.contacts.values()).map(c => ({ ...c, loggedIn: false }));
      localStorage.setItem(LS_KEY, JSON.stringify({ settings: S.settings, extras: S.extras, roomPw: S.roomPw, sendScope: S.sendScope, contactsSync: S.contactsSync, chanScope: S.chanScope, contacts, channels: S.channels, convs, history }));
    } catch (e) { console.warn('state save', e); toast(t('state.saveFail', e.message), 'err'); }
  };
  if (now) doSave(); else saveTimer = setTimeout(doSave, 800);
}

// ---------- model helpers ----------
const TYPE_KIND = { 1: 'dm', 2: 'repeater', 3: 'room', 4: 'sensor' };
const TYPE_CSS = { 1: 'chat', 2: 'rpt', 3: 'room', 4: 'sensor' };
const TYPE_ICON = { 1: 'user', 2: 'ant', 3: 'room', 4: 'sensor' };
function cname(c) { return (S.extras[c.pub]?.alias) || c.name || ('?' + c.pub.slice(0, 6)); }
function displayName(c) { return c.type === 3 ? '&' + cname(c) : cname(c); }
function convKeyFor(c) { return 'dm:' + c.pub; }
function convKeyForChannel(ch) { return 'ch:' + ch.secret; }
function mkConv(key, kind, name, pub, secret) {
  let cv = S.convs.get(key);
  if (!cv) { cv = { key, kind, name, pub, secret, msgs: [], unread: 0, hl: false, users: new Map(), lastRead: 0, open: true }; S.convs.set(key, cv); }
  else { cv.kind = kind || cv.kind; cv.name = name || cv.name; if (pub) cv.pub = pub; if (secret) cv.secret = secret; }
  return cv;
}
function convForContact(c) { return mkConv(convKeyFor(c), TYPE_KIND[c.type] || 'dm', displayName(c), c.pub); }
function convForChannel(ch) { return mkConv(convKeyForChannel(ch), 'channel', channelLabel(ch), null, ch.secret); }
function channelLabel(ch) { if (ch.secret === PUBLIC_KEY_HEX) return ch.name || 'Public'; return ch.name; }
function channelByConv(cv) { return S.channels.find(c => c && c.secret === cv.secret && c.name); }
// UTF-8-lengte en afkappen op grafeemgrens (node-naam: max. 31 bytes; een vlag telt 8 bytes)
function utf8Len(s) { return te.encode(s || '').length; }
function utf8Trunc(s, max) {
  if (utf8Len(s) <= max) return s;
  const parts = (typeof Intl !== 'undefined' && Intl.Segmenter) ? Array.from(new Intl.Segmenter().segment(s), x => x.segment) : Array.from(s);
  let out = ''; for (const p of parts) { if (utf8Len(out + p) > max) break; out += p; } return out;
}
function contactByPrefix(prefixHex) { for (const c of S.contacts.values()) if (c.pub.startsWith(prefixHex)) return c; return null; }
function contactByName(name) {
  if (!name) return null; const n = name.replace(/^[&@]/, '').toLowerCase();
  for (const c of S.contacts.values()) if (cname(c).toLowerCase() === n || (c.name || '').toLowerCase() === n) return c;
  for (const c of S.contacts.values()) if (cname(c).toLowerCase().startsWith(n)) return c;
  return null;
}
function activeConv() { return S.convs.get(S.active) || S.convs.get('status'); }
function activeContact() { const cv = activeConv(); return cv && cv.pub ? S.contacts.get(cv.pub) : null; }
function isSelfPub(prefixHex) { return S.self && S.self.pub.startsWith(prefixHex); }
function myNick() { return S.self ? S.self.name : ''; }

function pathInfo(c, hashMode) {
  // out_path_len: -1 = onbekend (flood). Anders: bovenste 2 bits = hash-grootte-1, onderste 6 bits = aantal hops.
  // Oudere firmware zonder hash-modus schrijft gewoon het aantal bytes (= hops bij 1-byte hashes); dat valt samen.
  if (c.outPathLen < 0) return { text: t('path.flood'), hops: null, hashes: [], size: 1 };
  const v = c.outPathLen & 255; let size = (v >> 6) + 1, count = v & 63;
  if (size === 1 && (hashMode ?? S.dev?.pathHashMode)) { const sz = 1 << (hashMode ?? S.dev?.pathHashMode); if (count % sz === 0) { size = sz; count = count / sz; } }
  const hashes = splitPath((c.outPath || '').slice(0, count * size * 2), size);
  return { text: hashes.length ? t('path.hops', hashes.length, hashes.join(',')) : t('path.direct'), hops: hashes.length, hashes, size };
}
function resolveHash(h) { // path hash -> contact names (repeaters first)
  const m = []; for (const c of S.contacts.values()) if (c.pub.startsWith(h)) m.push(c);
  m.sort((a, b) => (a.type === 2 ? 0 : 1) - (b.type === 2 ? 0 : 1));
  return m;
}
function hashLabel(h) { const m = resolveHash(h); return m.length ? h + ' (' + m.map(cname).join('/') + ')' : h; }
function distanceKm(a, b) {
  if (!a || !b || !a.lat || !a.lon || !b.lat || !b.lon) return null;
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ---------- time formatting ----------
const pad2 = (n) => String(n).padStart(2, '0');
function fmtTime(secs, withSecs = true) { const d = new Date(secs * 1000); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + (withSecs ? ':' + pad2(d.getSeconds()) : ''); }
function fmtDate(secs) { return new Date(secs * 1000).toLocaleDateString(i18nLocale(), { weekday: 'long', day: 'numeric', month: 'long' }); }
function fmtDateTime(secs) { const d = new Date(secs * 1000); return d.toLocaleDateString(i18nLocale()) + ' ' + fmtTime(secs); }
function fmtAgo(secs) {
  if (!secs) return t('ago.never'); const d = nowSecs() - secs;
  if (d < 0) return t('ago.future'); if (d < 60) return t('ago.s', d); if (d < 3600) return t('ago.min', Math.floor(d / 60)); if (d < 86400) return t('ago.h', Math.floor(d / 3600)); return t('ago.d', Math.floor(d / 86400));
}
function fmtDur(secs) { const d = Math.floor(secs / 86400), h = Math.floor(secs % 86400 / 3600), m = Math.floor(secs % 3600 / 60); return (d ? d + 'd ' : '') + pad2(h) + ':' + pad2(m); }
function dayKey(secs) { const d = new Date(secs * 1000); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

// ---------- raw packet decoding (from rx log) ----------
const routeName = (r) => t('route.' + r); // 0..3, vertaald
const PAYLOAD_NAMES = { 0: 'REQ', 1: 'RESPONSE', 2: 'TXT_MSG', 3: 'ACK', 4: 'ADVERT', 5: 'GRP_TXT', 6: 'GRP_DATA', 7: 'ANON_REQ', 8: 'PATH', 9: 'TRACE', 10: 'MULTIPART', 11: 'CONTROL', 15: 'RAW_CUSTOM' };
function decodePacket(raw) {
  try {
    let i = 0; const header = raw[i++]; const route = header & 3, ptype = (header >> 2) & 15, ver = (header >> 6) & 3;
    const p = { header, route, ptype, ptypeName: PAYLOAD_NAMES[ptype] || ('0x' + ptype.toString(16)), ver, codes: null, hashes: [], hashSize: 1 };
    if (route === 0 || route === 3) { p.codes = [rdU16(raw, i), rdU16(raw, i + 2)]; i += 4; }
    const pl = raw[i++]; p.hashCount = pl & 63; p.hashSize = (pl >> 6) + 1; p.pathLenByte = pl;
    for (let k = 0; k < p.hashCount; k++) { p.hashes.push(hex(raw.subarray(i, i + p.hashSize))); i += p.hashSize; }
    const payload = raw.subarray(i); p.payloadHex = hex(payload); p.rawHex = hex(raw);
    if (ptype === 4 && payload.length >= 32 + 4 + 64) { p.advertPub = hex(payload.subarray(0, 32)); p.advertTs = rdU32(payload, 32); }
    return p;
  } catch (e) { return { rawHex: hex(raw), error: String(e) }; }
}
function correlateRx(m) { // attach the most recent, unclaimed raw packet that fits this message
  const wantType = m.chan ? 5 : 2; const now = Date.now();
  for (let i = S.rxLog.length - 1; i >= 0; i--) {
    const r = S.rxLog[i]; if (now - r.at > 15000) break; if (r.claimed || !r.pkt || r.pkt.ptype !== wantType) continue;
    if (m.pathLen !== 0xFF && r.pkt.hashCount !== (m.pathLen & 63)) continue;
    if (m.pathLen === 0xFF && !(r.pkt.route === 2 || r.pkt.route === 3)) continue;
    r.claimed = true; m.rx = r.pkt; m.rssi = r.rssi; return;
  }
}
// Bekende regio's (lijst in Instellingen + standaardregio van de node) -> naam bij de transportcodes van een pakket
function knownRegions() { const r = (S.settings.regions || []).slice(); if (S.defaultScope && !r.some(x => x.key === S.defaultScope.key)) r.push(S.defaultScope); return r; }
async function resolveScopeNames(rx) {
  if (!rx || !rx.codes || !rx.payloadHex) return null; const names = [];
  for (const r of knownRegions()) { try { const code = await transportCodeFor(r.key, rx.ptype, rx.payloadHex); if (rx.codes.includes(code)) names.push(r.name); } catch (e) {} }
  return names;
}
function scopeLabelFor(m) {
  if (m.rx) {
    if (m.rx.route === 0 || m.rx.route === 3) {
      if (m.rx.scopeNames === undefined) { m.rx.scopeNames = null; resolveScopeNames(m.rx).then(n => { m.rx.scopeNames = n || []; if (n && n.length) updateMsgDom(m); }); }
      if (m.rx.scopeNames && m.rx.scopeNames.length) return t('scope.named', m.rx.scopeNames.join('+'));
      return t('scope.codes', m.rx.codes.filter(c => c).map(c => c.toString(16).padStart(4, '0')).join('/'));
    }
    return m.rx.route === 1 ? t('scope.none') : 'direct';
  }
  return null;
}
