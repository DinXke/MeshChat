/* ===================== Connection, device events, messaging ===================== */
const C = S.client;

async function connect(kind) {
  if (C.connected || S.connecting) return;
  const Tr = kind === 'ble' ? BleTransport : SerialTransport;
  if (!Tr.supported()) { errorMsg(kind === 'ble' ? t('conn.noBle') : t('conn.noSerial'), S.convs.get('status')); return; }
  S.connecting = true; setStatusKey('st-busy', 'status.connecting');
  try {
    await C.connect(new Tr());
    setStatusKey('st-busy', 'status.syncing');
    await afterConnect();
    setStatusKey('st-on', 'status.connected', C.kind);
  } catch (e) {
    if (e && (e.name === 'NotFoundError' || /cancel/i.test(e.message))) { notice(t('conn.cancelled'), S.convs.get('status'), false); }
    else errorMsg(t('conn.failed', e.message || e), S.convs.get('status'));
    try { await C.disconnect(); } catch (_) {}
    setStatusKey('st-off', 'status.off');
  } finally { S.connecting = false; setStatus($('#status').className, $('#status').textContent); }
}
async function afterConnect() {
  const st = S.convs.get('status');
  S.self = await C.appStart('MeshChat'); renderNick();
  S.dev = await C.deviceQuery();
  notice(t('conn.connectedVia', C.kind, S.dev?.model || t('conn.defaultModel'), S.dev?.version || '?', S.dev?.build ? t('conn.build', S.dev.build) : '', S.self.name), st, false);
  notice(t('conn.radio', S.self.freq, S.self.bw, S.self.sf, S.self.cr, S.self.txPower), st, false);
  try { const tm = await C.getTime(); S.devTimeOffset = tm - nowSecs(); if (Math.abs(S.devTimeOffset) > 30 && tm < nowSecs()) { await C.setTime(); notice(t('conn.clockSynced', -S.devTimeOffset), st, false); S.devTimeOffset = 0; } } catch (e) { debugLog('tijd: ' + e.message); }
  try { S.batt = await C.getBattery(); renderBattery(); } catch (e) {}
  try { S.defaultScope = await C.getDefaultScope(); } catch (e) { S.defaultScope = null; }
  await applySendScope(false);
  await refreshContacts(false);
  await refreshChannels();
  if (!S.convs.has(S.active) || S.active === 'status') { const pub = S.channels.find(c => c && c.secret === PUBLIC_KEY_HEX); if (pub) openConv(convKeyForChannel(pub)); }
  renderTree(); renderHead(activeConv()); renderUsers(activeConv());
  await drainMessages();
  if (C.tr && C.tr.dups) notice(t('ble.dups', C.tr.dups), st, false);
  autoLogin();
  if (S.pendingUri) { const u = S.pendingUri; S.pendingUri = null; setTimeout(() => handleIncomingUri(u), 500); }
  if (S.settings.notif && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  clearInterval(S.battTimer); S.battTimer = setInterval(async () => { if (C.connected) { try { S.batt = await C.getBattery(); renderBattery(); } catch (e) {} } }, 60000);
}
async function refreshContacts(full) {
  // Incrementeel: de node geeft met 'since' alleen contacten die sinds de vorige sync gewijzigd zijn.
  // Volledig (full) bij de eerste keer, een andere node, of op verzoek (Contacten › Vernieuwen).
  const cached = S.contactsSync && S.self && S.contactsSync.pub === S.self.pub && S.contacts.size > 0;
  const since = (!full && cached) ? S.contactsSync.lastmod : 0;
  const list = await C.getContacts(since);
  if (since) { for (const c of S.contacts.values()) if (c.hidden === undefined) c.hidden = false; }
  const seen = new Set();
  for (const c of list) { if (/�/.test(c.name) || !/^[0-9a-f]{64}$/.test(c.pub)) { debugLog('contact overgeslagen (onleesbaar): ' + c.pub.slice(0, 8)); continue; } seen.add(c.pub); const old = S.contacts.get(c.pub) || {}; S.contacts.set(c.pub, { ...old, ...c, hidden: false }); }
  if (!since) for (const [pub, c] of S.contacts) if (!seen.has(pub)) c.hidden = true; // not on device (anymore)
  if (list.lastmod) S.contactsSync = { pub: S.self.pub, lastmod: Math.max(list.lastmod, since || 0) };
  for (const c of S.contacts.values()) if (!c.hidden && c.type >= 2) convForContact(c);
  notice(since ? t('contacts.syncedIncr', list.length, Array.from(S.contacts.values()).filter(c => !c.hidden).length) : t('contacts.loaded', list.length), S.convs.get('status'), false);
  renderTree(); saveState();
}
async function refreshContact(pub) {
  try { const c = await C.getContact(pub); if (c) { const old = S.contacts.get(pub) || {}; S.contacts.set(pub, { ...old, ...c, hidden: false }); } } catch (e) { debugLog('contact ' + pub.slice(0, 8) + ': ' + e.message); }
  renderTree(); const cv = activeConv(); if (cv.pub === pub) { renderHead(cv); renderUsers(cv); } saveState();
}
async function refreshChannels() {
  const max = S.dev?.maxChannels || 8; const chans = [];
  for (let i = 0; i < max; i++) { try { const ch = await C.getChannel(i); if (ch.idx !== i || /�/.test(ch.name)) { debugLog('kanaal ' + i + ': onleesbaar antwoord, overgeslagen'); continue; } chans[i] = ch; } catch (e) { if (i > 0) break; } }
  S.channels = chans;
  for (const ch of chans) if (ch && ch.name) convForChannel(ch);
  renderTree(); saveState();
}
async function drainMessages() {
  if (!C.connected) return 0; if (S.syncing) { S.syncAgain = true; return 0; } S.syncing = true; let n = 0;
  try { for (; n < 200; n++) { const m = await C.syncNext(); if (!m) break; handleIncoming(m); } }
  catch (e) { debugLog('sync: ' + e.message); }
  finally { S.syncing = false; }
  if (S.syncAgain) { S.syncAgain = false; n += await drainMessages(); }
  return n;
}
// Room: synchronisatiepunt op de node resetten door het contact te verwijderen en opnieuw toe te voegen, daarna inloggen.
// Handmatig pad naar een contact op de node zetten: hashes = eerste `size` bytes van elke repeater-sleutel, in volgorde.
async function setManualPath(c, repeaterPubs, size) {
  const cv = convForContact(c); if (!requireConn(cv)) return false;
  const n = repeaterPubs.length; if (n * size > 64) { errorMsg(t('path.tooLong'), cv); return false; }
  const outPath = repeaterPubs.map(pk => pk.slice(0, size * 2)).join('');
  const outPathLen = n === 0 ? -1 : (size > 1 ? encodePathLen(n, size) : n);
  await C.addUpdateContact({ ...c, outPathLen, outPath }); await refreshContact(c.pub);
  const c2 = S.contacts.get(c.pub) || c; notice(n ? t('path.set', displayName(c2), pathInfo(c2).hashes.map(hashLabel).join(' → ')) : t('path.cleared', displayName(c2)), cv, true); return true;
}
// Automatisch opnieuw verzenden: attempt 1..max; vanaf de 2e mislukking eerst het pad resetten (volgende poging als flood).
function scheduleRetry(cv, c, m, text, txtType, r) {
  const max = S.settings.retries ?? 3;
  m._timer = setTimeout(async () => {
    if (m.ack !== 'pending' || !C.connected) return;
    const attempt = (m.attempt || 0) + 1;
    if (attempt > max) { m.ack = 'fail'; if (m.kind === 'cli' && !m.text) m.text = t('cli.noAnswer'); updateMsgDom(m); saveState(); return; }
    m.attempt = attempt; updateMsgDom(m);
    try {
      if (attempt >= 2 && c.outPathLen >= 0) { try { await C.resetPath(c.pub); c.outPathLen = -1; c.outPath = ''; notice(t('retry.pathReset', displayName(c)), cv, false); } catch (e) { debugLog('resetPath: ' + e.message); } }
      const r2 = await C.sendText(c.pub, text, txtType, attempt); m.ackCode = r2.ack; m.flood = r2.flood; updateMsgDom(m); scheduleRetry(cv, c, m, text, txtType, r2);
    } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg(t('send.failed', e.message), cv); }
  }, Math.max(m.kind === 'cli' ? 8000 : 5000, r.timeoutMs) + 2000);
}
async function resendChannelMsg(cv, m) {
  const ch = channelByConv(cv); if (!ch || !requireConn(cv)) return;
  m.attempt = (m.attempt || 0) + 1; m.heard = null; updateMsgDom(m);
  try { await ensureDeviceScope(scopeFor(cv)); const body = m.chText || (m.kind === 'action' ? '* ' + m.text : m.text); const r = await C.sendChannelText(ch.idx, body); m.t = r.ts; armHeard(m, cv); updateMsgDom(m); saveState(); }
  catch (e) { errorMsg(t('send.failed', e.message), cv); }
}
// meshcore://-link uit de URL (?uri=, web+meshcore-handler, Android share target) → importvraag
function pickUriFromUrl() {
  const q = new URLSearchParams(location.search); const cand = [q.get('uri'), q.get('text'), q.get('url'), q.get('title')].filter(Boolean).join(' ');
  const m = /(?:web\+)?meshcore:\/\/[0-9a-f]+/i.exec(cand); if (!m) return null;
  if (q.has('uri') || q.has('text') || q.has('url') || q.has('title')) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
  return m[0].replace(/^web\+/i, '');
}
async function handleIncomingUri(uri) {
  const a = parseAdvertUri(uri); const label = a ? `${a.name || '?'} (${advType(a.type)}${a.lat ? ', ' + a.lat.toFixed(3) + ', ' + a.lon.toFixed(3) : ''}) · ${a.pub.slice(0, 12)}…` : uri.slice(0, 60) + '…';
  if (a && S.contacts.has(a.pub) && !S.contacts.get(a.pub).hidden) { const c = S.contacts.get(a.pub); notice(t('uri.known', displayName(c)), S.convs.get('status'), false); const cv = convForContact(c); cv.open = true; openConv(cv.key); return; }
  if (!C.connected) { S.pendingUri = uri; notice(t('uri.waitConnect', label), S.convs.get('status'), false); toast(t('uri.waitConnect', label), 'warn', 8000); return; }
  if (!await confirmDlg(t('uri.title'), t('uri.text', label), t('uri.import'))) return;
  try { await C.importContact(uri); await refreshContacts(true); const c = a ? S.contacts.get(a.pub) : null; notice(t('uri.done', c ? displayName(c) : label), S.convs.get('status'), false); toast(t('uri.done', c ? displayName(c) : label), 'ok'); if (c) { const cv = convForContact(c); cv.open = true; openConv(cv.key); } }
  catch (e) { errorMsg(t('uri.failed', e.message), S.convs.get('status')); }
}
function webLinkFor(uri) { return 'https://chat.meshmanager.net/?uri=' + encodeURIComponent(uri); }
async function resyncRoom(c) {
  const cv = convForContact(c); if (!requireConn(cv)) return; if (c.type !== 3) { errorMsg(t('resync.onlyRoom'), cv); return; }
  if (!await confirmDlg(t('resync.title'), t('resync.text', displayName(c)), t('resync.btn'), true)) return;
  const uri = await C.exportContact(c.pub); await C.removeContact(c.pub); await C.importContact(uri); await refreshContacts(true);
  const c2 = S.contacts.get(c.pub); if (!c2) { errorMsg(t('err.2'), cv); return; }
  const pw = S.roomPw[c.pub]?.pw; if (pw) { await doLogin(c2, pw, true); notice(t('resync.started'), cv, true); } else { notice(t('resync.needLogin'), cv, true); openLoginDlg(c2); }
}
function autoLogin() { for (const [pub, r] of Object.entries(S.roomPw)) { const c = S.contacts.get(pub); if (c && !c.hidden && r.auto && r.pw != null) doLogin(c, r.pw, true); } }

C.addEventListener('disconnected', () => { setStatusKey('st-off', 'status.off'); notice(t('conn.lost'), S.convs.get('status'), false); for (const c of S.contacts.values()) c.loggedIn = false; S.batt = null; renderBattery(); renderTree(); renderHead(activeConv()); toast(t('conn.lostToast'), 'warn'); });
C.addEventListener('msgWaiting', () => drainMessages());
C.addEventListener('rx', (e) => { if (S.settings.debug) debugLog('← ' + hex(e.detail).slice(0, 120)); });
C.addEventListener('tx', (e) => { if (S.settings.debug) debugLog('→ ' + hex(e.detail).slice(0, 120)); });
C.addEventListener('advert', (e) => { const c = S.contacts.get(e.detail.pub); refreshContact(e.detail.pub).then(() => { const c2 = S.contacts.get(e.detail.pub); if (c2) { notice(t('ev.advertFrom', displayName(c2), c ? '' : t('ev.new')), S.convs.get('status'), false); const cv = S.convs.get(convKeyFor(c2)); if (cv && cv.key === S.active) renderHead(cv); } }); });
C.addEventListener('pathUpdated', (e) => { refreshContact(e.detail.pub).then(() => { const c = S.contacts.get(e.detail.pub); if (c) { const cv = convForContact(c); notice(t('ev.pathUpdated', displayName(c), pathInfo(c).text), cv, true); } }); });
C.addEventListener('newAdvert', (e) => { const c = e.detail; if (!c) return; S.pendingAdverts.set(c.pub, c); notice(t('ev.newNode', c.name, advType(c.type)), S.convs.get('status'), false); toast(t('ev.newNodeToast', c.name, advType(c.type)), '', 6000); if ($('#dlg-contacts').open) renderContactsDlg(); if (typeof mapObj !== 'undefined' && mapObj) mapRefreshNodes(); });
C.addEventListener('contactDeleted', (e) => { const c = S.contacts.get(e.detail.pub); if (c) { c.hidden = true; notice(t('ev.contactDeleted', displayName(c)), S.convs.get('status'), false); renderTree(); } });
C.addEventListener('contactsFull', () => toast(t('ev.contactsFull'), 'warn'));
C.addEventListener('ack', (e) => {
  const { ack, tripMs } = e.detail;
  for (const cv of S.convs.values()) for (let i = cv.msgs.length - 1; i >= Math.max(0, cv.msgs.length - 50); i--) { const m = cv.msgs[i]; if (m.self && m.ackCode === ack) { m.ack = 'ok'; m.trip = tripMs; clearTimeout(m._timer); updateMsgDom(m); saveState(); return; } }
  debugLog('ack ' + ack + ' onbekend');
});
C.addEventListener('login', (e) => {
  const { ok, prefix, perms } = e.detail; const c = contactByPrefix(prefix); if (!c) return;
  const cv = convForContact(c); c.loggedIn = ok; c.perms = perms; c._loginPending = false;
  if (ok) { notice(t('login.ok', displayName(c), perms ? t('login.asAdmin') : ''), cv, true); toast(t('login.okToast', displayName(c)), 'ok'); }
  else { errorMsg(t('login.denied', displayName(c)), cv); delete S.roomPw[c.pub]?.auto; }
  renderTree(); if (cv.key === S.active) { renderHead(cv); renderUsers(cv); renderCompose(cv); } saveState();
});
C.addEventListener('status', (e) => {
  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status'); const s = e.detail.stats;
  if (!s) { addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: 'status', text: t('stats.raw', hex(e.detail.raw.subarray(8))) }); return; }
  const lines = [t('stats.line1', (s.batt / 1000).toFixed(2), fmtDur(s.uptime), s.txQueue), t('stats.line2', s.noise, s.rssi, s.snr != null ? t('stats.lastSnr', s.snr.toFixed(1)) : ''), t('stats.line3', s.recv, s.recvFlood ?? '?', s.recvDirect ?? '?', s.sent, s.sentFlood, s.sentDirect), t('stats.line4', fmtDur(s.airtime), s.rxAirtime != null ? t('stats.rx', fmtDur(s.rxAirtime)) : '', s.fullEvents != null ? t('stats.fullEvents', s.fullEvents) : '', s.directDups != null ? t('stats.dups', s.directDups, s.floodDups) : '')];
  addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: 'status', text: lines.join('\n'), stats: c ? s : null });
  if (c) { S.extras[c.pub] = { ...(S.extras[c.pub] || {}), stats: s, statsT: nowSecs() }; saveState(); if (S.statusDlgPub === c.pub && $('#dlg-rstat').open) renderStatusDlg(); else if (S.settings.statusPopup === 'auto') openStatusDlg(c); }
});
C.addEventListener('telemetry', (e) => {
  const c = contactByPrefix(e.detail.prefix); const self = isSelfPub(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status');
  const txt = e.detail.lpp.length ? e.detail.lpp.map(r => `${r.name}${r.ch ? ' [' + r.ch + ']' : ''}: ${Array.isArray(r.val) ? r.val.join(', ') : r.val}${r.unit ? ' ' + r.unit : ''}`).join('\n') : t('telem.noData');
  addMsg(cv, { kind: 'cli', nick: self ? myNick() : c ? displayName(c) : '?', cmd: t('telem.cmd'), text: txt });
});
C.addEventListener('trace', (e) => {
  const { hashes, snrs } = e.detail; const cv = S.traceConv || activeConv();
  const lines = hashes.map((h, i) => t('trace.hop', i + 1, hashLabel(h), snrs[i] != null ? snrs[i].toFixed(1) : '?')); lines.push(t('trace.back', snrs[hashes.length] != null ? snrs[hashes.length].toFixed(1) : '?'));
  addMsg(cv, { kind: 'cli', nick: 'trace', cmd: 'trace ' + hashes.join(','), text: lines.join('\n') }); S.traceConv = null;
});
C.addEventListener('pathDiscovery', (e) => {
  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status');
  const split = (h, sz) => splitPath(h, sz || 1);
  addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: t('disc.cmd'), text: t('disc.text', e.detail.outLen, split(e.detail.outPath, e.detail.outSize).map(hashLabel).join(' → ') || t('disc.direct'), e.detail.inLen, split(e.detail.inPath, e.detail.inSize).map(hashLabel).join(' → ') || t('disc.direct')) });
  if (c) refreshContact(c.pub);
});
C.addEventListener('rxLog', (e) => {
  const pkt = decodePacket(e.detail.raw); S.rxLog.push({ at: Date.now(), snr: e.detail.snr, rssi: e.detail.rssi, pkt }); if (S.rxLog.length > 300) S.rxLog.shift();
  if (S.settings.debug) debugLog(`rx ${pkt.ptypeName} ${routeName(pkt.route)} ${pkt.hashCount} hops SNR ${e.detail.snr} RSSI ${e.detail.rssi}`);
  heardCheck(pkt); mapAnimateRx(pkt);
});
// "Gehoord": een repeater herhaalde ons pakket en onze node hoorde die herhaling (ruw pakket 0x88).
// Matching op pakkettype, kanaalhash / bestemmings- en bronhash en de verwachte payloadlengte, binnen 20 s na verzenden.
function expectedPayloadLen(textBytes, extra) { return extra + 16 * Math.ceil((5 + textBytes) / 16); } // 4 timestamp + 1 vlaggen, AES-blokken, + hash/MAC-bytes
function heardCheck(pkt) {
  S.rxLogSeen = true; if (!pkt || pkt.hashCount < 1 || !pkt.payloadHex) return;
  const plen = pkt.payloadHex.length / 2, now = Date.now();
  for (const cv of S.convs.values()) {
    for (let i = cv.msgs.length - 1; i >= Math.max(0, cv.msgs.length - 15); i--) {
      const m = cv.msgs[i]; if (!m.self || m.heard !== 'pending' || !m.sentAt || now - m.sentAt > 20000) continue;
      let hit = false;
      if (cv.kind === 'channel' && pkt.ptype === 5 && m.chanHash && pkt.payloadHex.slice(0, 2) === m.chanHash && plen === m.expLen) hit = true;
      else if (cv.kind !== 'channel' && pkt.ptype === 2 && m.dstHash && pkt.payloadHex.slice(0, 2) === m.dstHash && pkt.payloadHex.slice(2, 4) === m.srcHash && plen === m.expLen) hit = true;
      if (hit) { m.heard = 'ok'; m.heardVia = pkt.hashes[0]; clearTimeout(m._heardTimer); updateMsgDom(m); saveState(); return; }
    }
  }
}
function armHeard(m, cv) {
  if (!S.rxLogSeen) { m.heard = null; return; } // firmware stuurt geen ruwe pakketten: geen uitspraak doen
  m.heard = 'pending'; m.sentAt = Date.now(); clearTimeout(m._heardTimer);
  m._heardTimer = setTimeout(() => { if (m.heard === 'pending') { m.heard = 'no'; updateMsgDom(m); saveState(); } }, 15000);
}
// Ontvangen pakket op de kaart tekenen (alleen als de kaart open staat en 'Live pakketten' aanstaat)
const PKT_COLORS = { 2: '#5cc8ff', 5: '#4ea1ff', 4: '#f7b955', 3: '#3ccf83', 0: '#c4a3ff', 1: '#c4a3ff', 7: '#c4a3ff', 9: '#ff8fab' };
function mapAnimateRx(pkt) {
  if (typeof mapObj === 'undefined' || !mapObj || $('#mapwrap').hidden || !$('#map-live')?.checked || !pkt || !pkt.hashes) return;
  const pts = mapPacketPath(pkt.advertPub || null, pkt.hashes); if (pts.length >= 2) mapAnimatePacket(pts, PKT_COLORS[pkt.ptype] || '#8e9baa');
}
function mapAnimateMsg(msg, c) {
  if (typeof mapObj === 'undefined' || !mapObj || $('#mapwrap').hidden || !$('#map-live')?.checked || msg.rx || !c || !c.lat) return;
  const pts = mapPacketPath(c.pub, []); if (pts.length >= 2) mapAnimatePacket(pts, '#5cc8ff');
}
C.addEventListener('push', (e) => debugLog('push 0x' + e.detail.code.toString(16) + ' ' + hex(e.detail.raw)));
C.addEventListener('unsolicited', (e) => debugLog('onverwacht frame ' + hex(e.detail).slice(0, 80)));

// ---------- incoming messages ----------
function handleIncoming(m) {
  if (m.kind === 'channel') {
    const ch = S.channels[m.idx]; if (!ch) { debugLog('bericht voor onbekend kanaal ' + m.idx); return; }
    const cv = convForChannel(ch); const mt = /^([^:]{1,40}): ([\s\S]*)$/.exec(m.text); const nick = mt ? mt[1] : '?', text = mt ? mt[2] : m.text;
    const msg = { kind: text.startsWith('* ') ? 'action' : 'msg', nick, text: text.startsWith('* ') ? text.slice(2) : text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, chan: m.idx, hl: mentionsMe(text), rawHex: hex(m.raw || new Uint8Array()) };
    correlateRx(msg); const c = contactByName(nick); if (c) { msg.pub = c.pub; if (m.snr != null && (msg.pathLen === 0 || msg.pathLen === 0xFF)) c.lastSnr = m.snr; }
    addMsg(cv, msg); mapAnimateMsg(msg, c); return;
  }
  if (m.kind === 'contact') {
    const c = contactByPrefix(m.prefix);
    if (!c) { addMsg(S.convs.get('status'), { kind: 'msg', nick: '?' + m.prefix.slice(0, 6), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen }); return; }
    const cv = convForContact(c); cv.open = true; if (m.snr != null && (m.pathLen === 0xFF || (m.pathLen & 63) === 0)) c.lastSnr = m.snr; c.lastSeen = nowSecs();
    if (m.txtType === TXT.CLI) { // CLI reply from repeater/sensor
      for (const w of (S.cliWaiters || []).filter(w => w.pub === c.pub)) { clearTimeout(w.timer); w.resolve(m.text); } S.cliWaiters = (S.cliWaiters || []).filter(w => w.pub !== c.pub);
      const pending = cv.msgs.slice(-20).reverse().find(x => x.kind === 'cli' && x.ack === 'pending');
      if (pending) { pending.text = (pending.text ? pending.text + '\n' : '') + m.text; pending.ack = null; pending.snr = m.snr; pending.pathLen = m.pathLen; clearTimeout(pending._timer); updateMsgDom(pending); if (cv.key !== S.active) { cv.unread++; renderTree(); } saveState();
        if (/^neighbou?rs\b/i.test(pending.cmd || '')) { const nb = parseNeighbors(pending.text); if (nb.length) { const merged = nbMerge(c, nb); if (merged.length > nb.length) notice(t('nb.cliMerged', nb.length, merged.length), cv, false); } }
        if (S.autoNbFor === c.pub && /^neighbou?rs\b/i.test(pending.cmd || '')) { S.autoNbFor = null; const nb = nbMerged(c); if (nb.length) mapShowNeighbors(c, nb); else toast(t('nb.none'), 'warn'); } }
      else addMsg(cv, { kind: 'cli', nick: displayName(c), cmd: '', text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen });
      return;
    }
    if (m.txtType === TXT.SIGNED && c.type === 3) { // room post: 4-byte author prefix
      const author = contactByPrefix(m.sig); const mine = isSelfPub(m.sig);
      if (mine) { const echo = cv.msgs.slice(-30).reverse().find(x => x.self && x.text === m.text && nowSecs() - x.t < 900 && !x.echoed); if (echo) { echo.ack = 'ok'; echo.echoed = true; clearTimeout(echo._timer); updateMsgDom(echo); saveState(); return; } }
      const nick = mine ? myNick() : author ? cname(author) : '?' + m.sig; c.loggedIn = true;
      const ts0 = saneTs(m.ts); if (cv.msgs.some(x => x.kind === 'msg' && x.text === m.text && x.nick === nick && Math.abs((x.t || 0) - ts0) < 3)) return; // dubbel (bv. na opnieuw ophalen)
      const msg = { kind: 'msg', nick, text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, self: mine, pub: author?.pub, hl: !mine && mentionsMe(m.text), sig: m.sig }; correlateRx(msg); addMsg(cv, msg); renderTree(); return;
    }
    const msg = { kind: 'msg', nick: displayName(c), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, pub: c.pub, hl: mentionsMe(m.text), txtType: m.txtType }; correlateRx(msg); addMsg(cv, msg); mapAnimateMsg(msg, c);
    if (!S.convs.get(cv.key) || cv.kind === 'dm') renderTree();
    return;
  }
  debugLog('onbekend berichttype ' + JSON.stringify(m));
}
function saneTs(ts) { const n = nowSecs(); return (ts > n + 3600 || ts < n - 30 * 86400) ? n : ts; }
function mentionsMe(text) { const n = myNick(); if (!n) return false; return new RegExp('(^|[^\\w])@?' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w])', 'i').test(text); }

// ---------- outgoing ----------
function requireConn(cv) { if (!C.connected) { errorMsg(t('send.notConnected'), cv); return false; } return true; }
async function sendToConv(cv, text, asAction = false) {
  if (!requireConn(cv)) return;
  text = text.trim(); if (!text) return;
  if (cv.kind === 'channel') {
    const ch = channelByConv(cv); if (!ch) { errorMsg(t('send.chanGone'), cv); return; }
    const body = asAction ? '* ' + text : text; const sc = scopeFor(cv);
    const m = addMsg(cv, { kind: asAction ? 'action' : 'msg', nick: myNick(), text, self: true, scope: sc.mode === 'unscoped' ? t('scope.none') : sc.mode === 'custom' ? (sc.name || t('scope.custom')) : (S.chanScope[ch.secret] ? scopeText(sc) : null) });
    try { m.chanHash = hex((await sha256(unhex(ch.secret))).subarray(0, 1)); m.expLen = expectedPayloadLen(te.encode(myNick() + ': ' + body).length, 3); m.chText = body; m.chIdx = ch.idx; await ensureDeviceScope(sc); const r = await C.sendChannelText(ch.idx, body); m.t = r.ts; m.flood = true; armHeard(m, cv); updateMsgDom(m); } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg(t('send.failed', e.message), cv); }
    return;
  }
  const c = S.contacts.get(cv.pub); if (!c) { errorMsg(t('send.noContact'), cv); return; }
  if (cv.kind === 'repeater' || cv.kind === 'sensor') return sendCli(cv, c, text);
  if (cv.kind === 'room' && !c.loggedIn) { notice(t('send.roomNotLoggedIn'), cv, false); openLoginDlg(c); return; }
  const m = addMsg(cv, { kind: asAction ? 'action' : 'msg', nick: myNick(), text, self: true, ack: 'pending' });
  try {
    await ensureDeviceScope(S.sendScope); const body = asAction ? '* ' + text : text; const r = await C.sendText(c.pub, body, TXT.PLAIN, 0); m.t = r.ts; m.ackCode = r.ack; m.flood = r.flood; m.attempt = 0; m.dstHash = c.pub.slice(0, 2); m.srcHash = S.self ? S.self.pub.slice(0, 2) : null; m.expLen = expectedPayloadLen(te.encode(body).length, 4); if (r.flood) armHeard(m, cv); updateMsgDom(m);
    scheduleRetry(cv, c, m, body, TXT.PLAIN, r);
  } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg(t('send.failed', e.message), cv); }
}
// Stuur een CLI-commando en wacht op het (eerste) antwoord van deze repeater.
function askCli(c, cmdText, timeoutMs = 20000) {
  const cv = convForContact(c);
  return new Promise((resolve, reject) => {
    const w = { pub: c.pub, resolve, timer: setTimeout(() => { S.cliWaiters = (S.cliWaiters || []).filter(x => x !== w); reject(new Error(t('cli.noReply', displayName(c), Math.round(timeoutMs / 1000)))); }, timeoutMs) };
    (S.cliWaiters = S.cliWaiters || []).push(w); sendCli(cv, c, cmdText).catch(e => { clearTimeout(w.timer); reject(e); });
  });
}
// ---------- buren: volledige lijst via REQ_TYPE_GET_NEIGHBOURS (0x06), gepagineerd zoals de officiële app ----------
// Verzoek: [6, versie 0, aantal, offset LE16, volgorde (0 = nieuwste eerst), prefixlengte, 4 willekeurige bytes].
// Antwoord (na de tag): [totaal LE16][aantal LE16] dan per buur [prefix][seconden geleden LE32][snr×4 i8].
// De repeater past hoogstens 130 bytes in één antwoord: met een prefix van 6 bytes zijn dat 11 buren per pagina.
const NB_PREFIX = 6, NB_PER_PAGE = 10; // 10 per pagina, zoals de officiële app ("10 van 27")
function waitBinaryResp(tag, ms) {
  return new Promise((res, rej) => {
    const w = { tag, res, timer: setTimeout(() => { S.binWaiters = (S.binWaiters || []).filter(x => x !== w); rej(new Error(t('nb.timeout'))); }, ms) };
    (S.binWaiters = S.binWaiters || []).push(w);
  });
}
C.addEventListener('binaryResp', (e) => {
  const ws = S.binWaiters || []; const w = ws.find(x => x.tag === e.detail.tag);
  if (w) { clearTimeout(w.timer); S.binWaiters = ws.filter(x => x !== w); w.res(e.detail.data); } else debugLog('binair antwoord zonder wachter, tag ' + e.detail.tag);
});
// Burengeheugen per repeater (S.extras[pub].nb): elk antwoord, via knop of CLI, wordt samengevoegd met wat eerder binnenkwam.
// Sleutel = eerste 4 bytes van de prefix (het CLI-antwoord geeft er 4, het binaire verzoek 6); ouder dan 7 dagen valt weg.
function nbCache(c) { const x = S.extras[c.pub] || (S.extras[c.pub] = {}); if (!x.nb || typeof x.nb !== 'object') x.nb = {}; return x.nb; }
function nbMerge(c, list) {
  const nb = nbCache(c); const now = nowSecs();
  for (const n of list || []) {
    if (!n || !n.hex) continue; const k = n.hex.slice(0, 8).toLowerCase(); const heardAt = now - (n.age || 0); const old = nb[k];
    if (!old || heardAt >= old.heardAt - 5) nb[k] = { heardAt, snr: n.snr, hex: (old && old.hex && old.hex.length > n.hex.length) ? old.hex : n.hex.toLowerCase() };
  }
  for (const k of Object.keys(nb)) if (now - nb[k].heardAt > 7 * 86400) delete nb[k];
  saveState(); return nbMerged(c);
}
function nbMerged(c) {
  const nb = nbCache(c); const now = nowSecs();
  return Object.values(nb).map(v => ({ hex: v.hex, snr: v.snr, age: Math.max(0, now - v.heardAt), contact: contactByPrefix(v.hex) })).sort((a, b) => a.age - b.age);
}
async function fetchAllNeighbours(c) {
  const cv = convForContact(c); if (!requireConn(cv)) return null;
  const m = { kind: 'cli', nick: displayName(c), cmd: 'neighbours', text: '', ack: 'pending' }; addMsg(cv, m);
  const all = []; let total = null, offset = 0;
  try {
    for (let page = 0; page < 60; page++) {
      // per pagina tot 3 pogingen: een repeater die druk is of via flood bereikt wordt, laat weleens één antwoord vallen
      let d = null, lastErr = null;
      for (let attempt = 0; attempt < 3 && !d; attempt++) {
        const blob = new Uint8Array(4); crypto.getRandomValues(blob);
        const req = Uint8Array.from([6, 0, NB_PER_PAGE, offset & 255, offset >> 8, 0, NB_PREFIX, ...blob]);
        try { const r = await C.binaryReq(c.pub, req); d = await waitBinaryResp(r.tag, Math.max(r.timeoutMs || 0, 8000) + 4000); }
        catch (e) { lastErr = e; debugLog(`buren ${displayName(c)}: pagina offset ${offset} poging ${attempt + 1} mislukt: ${e.message || e}`); }
      }
      if (!d) throw lastErr || new Error(t('nb.timeout'));
      debugLog(`buren ${displayName(c)}: offset ${offset} → ${d.length} bytes: ${hex(d.subarray(0, Math.min(d.length, 24)))}${d.length > 24 ? '…' : ''}`);
      if (d.length < 4) break;
      total = rdU16(d, 0); const n = rdU16(d, 2); let o = 4;
      for (let i = 0; i < n && o + NB_PREFIX + 5 <= d.length; i++) {
        const hx = hex(d.subarray(o, o + NB_PREFIX)); o += NB_PREFIX; const age = rdU32(d, o); o += 4; const snr = rdI8(d[o]) / 4; o += 1;
        if (!all.some(x => x.hex === hx)) all.push({ hex: hx, age, snr, contact: contactByPrefix(hx) });
      }
      offset += n; debugLog(`buren ${displayName(c)}: ${all.length} van ${total} na deze pagina (${n} in antwoord)`); if (n === 0 || offset >= total) break;
      m.text = t('nb.progress', all.length, total); updateMsgDom(m);
    }
  } catch (e) { if (!all.length) { m.ack = 'fail'; m.text = t('nb.err', e.message || e); updateMsgDom(m); saveState(); return null; } toast(t('nb.partial', all.length, total ?? '?', e.message || e), 'warn'); }
  m.ack = null; m.nbTotal = total;
  const merged = nbMerge(c, all);
  // Zelfde regelvorm als het CLI-antwoord (prefix:seconden:snr×4), zodat namen, kleuren en de kaartknop gewoon werken.
  m.text = t('nb.header', all.length, total ?? all.length, merged.length) + '\n' + merged.map(x => `${x.hex}:${x.age}:${Math.round(x.snr * 4)}`).join('\n');
  updateMsgDom(m); saveState();
  return merged;
}
async function neighboursToMap(c) { const list = await fetchAllNeighbours(c); if (!list) return; if (list.length) mapShowNeighbors(c, list); else toast(t('nb.none'), 'warn'); }
// Buren uit het CLI-antwoord van 'neighbors': per regel een sleutelprefix, daarna SNR en ouderdom (seconden).
function parseNeighbors(text) {
  const out = [];
  for (const line of String(text).split(/\r?\n/)) {
    const m = /\b([0-9a-f]{6,64})\b/i.exec(line); if (!m) continue;
    const hex = m[1].toLowerCase(); const rest = line.slice(m.index + m[1].length);
    // MeshCore-repeater: "<hex>:<seconden geleden>:<snr×4>" (formatNeighborsReply); anders: eerste getal SNR, tweede ouderdom
    const fw = /^:(-?\d+):(-?\d+)/.exec(rest); let snr = null, age = null;
    if (fw) { age = +fw[1]; snr = +fw[2] / 4; }
    else { const nums = (rest.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); snr = nums.length ? nums[0] : null; age = nums.length > 1 ? nums[1] : null; }
    out.push({ hex, snr, age, contact: contactByPrefix(hex) });
  }
  return out;
}
// Regionamen uit de uitvoer van 'region' halen. Markeringen: '*' wildcard, '^' home, 'F' flood-vlag, '$naam' = privésleutel (niet af te leiden).
function parseRegionReply(text) {
  const out = []; let home = null;
  for (const raw of text.split(/[\s\/,;|()]+/)) {
    let tok = raw.trim(); if (!tok) continue;
    const isHome = tok.includes('^'); tok = tok.replace(/[\^*]/g, '');
    if (!tok || tok === 'F' || /^F+$/.test(tok) || tok.startsWith('$')) continue;
    tok = tok.replace(/^#/, '').replace(/[^\w.\-]/g, ''); if (!tok || /^\d+$/.test(tok)) continue;
    if (!out.includes(tok)) out.push(tok); if (isHome) home = tok;
  }
  return { names: out, home };
}
async function sendCli(cv, c, cmdText) {
  if (!requireConn(cv)) return;
  if (!c.loggedIn && !/^(ver|clock|board)$/.test(cmdText)) notice(t('cli.notLoggedIn'), cv, false);
  const m = addMsg(cv, { kind: 'cli', nick: displayName(c), cmd: cmdText, text: '', self: false, ack: 'pending' });
  try { await ensureDeviceScope(S.sendScope); const r = await C.sendText(c.pub, cmdText, TXT.CLI, 0); m.flood = r.flood; m.pathLen = null; m.attempt = 0; scheduleRetry(cv, c, m, cmdText, TXT.CLI, r); }
  catch (e) { m.ack = 'fail'; m.text = t('cli.err', e.message); updateMsgDom(m); }
}
async function doLogin(c, pw, silent) {
  const cv = convForContact(c); if (!requireConn(cv)) return;
  try { c._loginPending = true; const r = await C.login(c.pub, pw); if (!silent) notice(t('login.sent', displayName(c), r.flood ? 'flood' : 'direct'), cv, false); setTimeout(() => { if (c._loginPending && !c.loggedIn) { c._loginPending = false; notice(t('login.noReply', displayName(c)), cv, false); } }, Math.max(8000, r.timeoutMs) + 3000); }
  catch (e) { c._loginPending = false; errorMsg(t('login.failed', e.message), cv); }
}
// Effectieve scope voor een venster: kanaal-eigen keuze, anders de globale verzendscope.
function scopeFor(cv) { const ch = cv && cv.kind === 'channel' ? channelByConv(cv) : null; const s = ch && S.chanScope[ch.secret]; return s && s.mode ? s : S.sendScope; }
function scopeKeyOf(s) { if (s.mode === 'unscoped') return null; if (s.mode === 'custom' && s.key) return s.key; return S.defaultScope ? S.defaultScope.key : null; }
function scopeText(s) { return s.mode === 'unscoped' ? t('scope.none') : s.mode === 'custom' ? (s.name || s.key.slice(0, 8) + '…') : (S.defaultScope ? t('scope.defaultNamed', S.defaultScope.name) : t('scope.default')); }
function rememberRegion(name, key) { if (!name || !key) return; const r = S.settings.regions; if (!r.some(x => x.key === key)) { r.push({ name, key }); saveState(); } }
// Zet de verzendscope op de node om als die afwijkt van wat dit venster nodig heeft (één commando, alleen bij wissel).
async function ensureDeviceScope(s) {
  const want = scopeKeyOf(s); if (S.deviceScopeKey !== undefined && S.deviceScopeKey === want) return;
  try { await C.setSendScope(want); S.deviceScopeKey = want; }
  catch (e) { if (e.errCode === 1) { S.deviceScopeKey = want; if (s.mode !== 'default') notice(t('scope.noFwSupport2'), activeConv(), false); } else throw e; }
}
async function setChannelScope(ch, s) {
  if (!ch) return; if (!s || s.mode === 'global') delete S.chanScope[ch.secret]; else S.chanScope[ch.secret] = s;
  if (s && s.mode === 'custom') rememberRegion(s.name, s.key); saveState();
  const cv = S.convs.get(convKeyForChannel(ch)); if (cv) { renderHead(cv); notice(t('scope.chanSet', s && s.mode !== 'global' ? scopeText(s) : t('scope.followsGlobal', scopeText(S.sendScope))), cv, false); }
}
async function applySendScope(announce = true) {
  if (!C.connected) return;
  const s = S.sendScope;
  try {
    const k = scopeKeyOf(s); await C.setSendScope(k); S.deviceScopeKey = k; if (s.mode === 'custom') rememberRegion(s.name, s.key);
    if (announce) notice(t('scope.sendScope', sendScopeText()), S.convs.get('status'), false);
  } catch (e) { if (e.errCode === 1) { if (s.mode !== 'default') notice(t('scope.noFwSupport'), S.convs.get('status'), false); } else debugLog('scope: ' + e.message); }
  const cv = activeConv(); if (cv.kind === 'status') renderInfo(cv);
}

// ---------- slash commands ----------
async function handleInput(raw) {
  const cv = activeConv(); const text = raw.replace(/\s+$/, ''); if (!text) return;
  if (!text.startsWith('/') || text.startsWith('//')) return sendToConv(cv, text.startsWith('//') ? text.slice(1) : text);
  const sp = text.indexOf(' '); const cmd = (sp < 0 ? text : text.slice(0, sp)).toLowerCase(); const arg = sp < 0 ? '' : text.slice(sp + 1).trim();
  const argv = arg ? arg.split(/\s+/) : [];
  const targetContact = (name) => { const c = name ? contactByName(name) : activeContact(); if (!c) errorMsg(name ? t('cmd.contactNotFound', name) : t('cmd.noContactSel'), cv); return c; };
  try {
    switch (cmd) {
      case '/help': notice(t('help.list', COMMANDS.map(c => c[0]).join(' ')), cv, false); notice(t('help.hint'), cv, false); break;
      case '/about': case '/version': $('#dlg-about').showModal(); break;
      case '/sync': { if (!requireConn(cv)) break; const n = await drainMessages(); notice(n ? t('sync.done', n) : t('sync.none'), cv, false); break; }
      case '/setpath': { const c = targetContact(argv[0]); if (!c) break; openPathDlg(c); break; }
      case '/resync': { const c = activeContact(); if (!c) { errorMsg(t('resync.onlyRoom'), cv); break; } await resyncRoom(c); break; }
      case '/map': { if (argv[0]) { const c = contactByName(argv[0]); if (c) { mapFocus(c.pub); break; } } openConv('map'); break; }
      case '/contacts': case '/refresh': if (!requireConn(cv)) break; await refreshContacts(true); notice(t('contacts.reloaded'), cv, false); break;
      case '/connect': connect(/bl|bt/i.test(arg) ? 'ble' : 'usb'); break;
      case '/disconnect': case '/quit': await C.disconnect(); break;
      case '/join': await joinChannel(argv[0], argv.slice(1).join(' ')); break;
      case '/neighbours': case '/neighbors': case '/buren': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; neighboursToMap(c); break; }
      case '/part': case '/leave': await leaveChannel(arg ? S.channels.find(c => c && (c.name.toLowerCase() === arg.toLowerCase() || (arg.toLowerCase() === '#public' && c.secret === PUBLIC_KEY_HEX))) : channelByConv(cv)); break;
      case '/msg': { const c = targetContact(argv[0]); if (!c) break; const t = argv.slice(1).join(' '); const cv2 = convForContact(c); cv2.open = true; openConv(cv2.key); if (t) await sendToConv(cv2, t); break; }
      case '/query': { const c = targetContact(argv[0]); if (!c) break; const cv2 = convForContact(c); cv2.open = true; openConv(cv2.key); break; }
      case '/me': await sendToConv(cv, arg, true); break;
      case '/nick': if (!arg) { notice(t('nick.current', myNick()), cv, false); break; } if (!requireConn(cv)) break; await C.setName(arg.slice(0, 31)); S.self.name = arg.slice(0, 31); renderNick(); notice(t('nick.changed', S.self.name), cv, true); break;
      case '/whois': { const c = targetContact(argv[0]); if (!c) break; const p = pathInfo(c); notice(t('whois.text', displayName(c), advType(c.type), c.pub, c.lastAdvert ? fmtDateTime(c.lastAdvert) : t('ago.never'), p.hashes.length ? p.hashes.map(hashLabel).join(', ') : p.text, c.lat ? t('whois.loc', c.lat.toFixed(4), c.lon.toFixed(4)) : '', c.lastSnr != null ? t('whois.snr', c.lastSnr.toFixed(1)) : ''), cv, false); break; }
      case '/names': notice(cv.kind === 'channel' ? t('names.seen', Array.from(cv.users.keys()).join(', ')) : t('names.contacts', Array.from(S.contacts.values()).filter(c => !c.hidden).map(displayName).join(', ')), cv, false); break;
      case '/list': notice(t('list.channels', S.channels.filter(c => c && c.name).map(c => `${c.idx}:${channelLabel(c)}`).join(', ')), cv, false); notice(t('list.rooms', Array.from(S.contacts.values()).filter(c => c.type === 3 && !c.hidden).map(displayName).join(', '), Array.from(S.contacts.values()).filter(c => c.type === 2 && !c.hidden).map(displayName).join(', ')), cv, false); break;
      case '/advert': case '/flood': if (!requireConn(cv)) break; { const flood = cmd === '/flood' || /flood/i.test(arg); await C.sendAdvert(flood); notice(t('advert.sent', flood ? 'flood' : t('advert.zeroHop')), cv, true); toast(t('advert.sentToast'), 'ok'); } break;
      case '/login': { const c = activeContact(); if (!c || c.type < 2) { errorMsg(t('login.openFirst'), cv); break; } if (!arg) { openLoginDlg(c); break; } S.roomPw[c.pub] = { pw: arg, auto: S.roomPw[c.pub]?.auto || false }; saveState(); await doLogin(c, arg); break; }
      case '/logout': { const c = activeContact(); if (!c) break; if (!requireConn(cv)) break; await C.logout(c.pub); c.loggedIn = false; if (S.roomPw[c.pub]) S.roomPw[c.pub].auto = false; notice(t('logout.done', displayName(c)), cv, true); renderTree(); renderHead(cv); renderUsers(cv); renderCompose(cv); break; }
      case '/cli': { const c = activeContact(); if (!c) { errorMsg(t('cli.openFirst'), cv); break; } await sendCli(cv, c, arg); break; }
      case '/status': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.statusReq(c.pub); notice(t('status.sent', displayName(c)), convForContact(c), false); break; }
      case '/telemetry': case '/telemetrie': { if (!requireConn(cv)) break; if (argv[0] === 'self' || (!argv[0] && !activeContact())) { await C.selfTelemetry(); break; } const c = targetContact(argv[0]); if (!c) break; await C.telemetryReq(c.pub); notice(t('telem.sent', displayName(c)), convForContact(c), false); break; }
      case '/trace': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; const p = pathInfo(c); if (!p.hashes.length) { errorMsg(t('trace.noPath', displayName(c)), cv); break; } S.traceConv = convForContact(c); await C.tracePath(p.hashes.join(''), p.size); notice(t('trace.sent', p.hashes.join(',')), S.traceConv, false); break; }
      case '/path': case '/discover': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.pathDiscovery(c.pub); notice(t('disc.sent', displayName(c)), convForContact(c), false); break; }
      case '/resetpath': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.resetPath(c.pub); await refreshContact(c.pub); notice(t('path.reset', displayName(c)), convForContact(c), true); break; }
      case '/scope': await setSendScopeCmd(argv); break;
      case '/region': case '/regio': await setRegionCmd(argv); break;
      case '/regions': { const c = argv[0] ? contactByName(argv[0]) : (activeContact()?.type === 2 ? activeContact() : null); await fillSettings(); $('#dlg-settings').showModal(); $$('.tab').find(x => x.dataset.tab === 'region').click(); if (c) { $('#rg-rpt').value = c.pub; discoverRegions().catch(e => toast(e.message, 'err')); } break; }
      case '/export': { if (!requireConn(cv)) break; const c = argv[0] ? contactByName(argv[0]) : null; const uri = await C.exportContact(c ? c.pub : null); notice((c ? displayName(c) : t('export.self')) + ': ' + uri, cv, false); notice(t('uri.weblink') + ' ' + webLinkFor(uri), cv, false); copyText(uri); break; }
      case '/import': if (!requireConn(cv)) break; await C.importContact(arg); await refreshContacts(); notice(t('import.done'), cv, true); break;
      case '/share': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.shareContact(c.pub); notice(t('share.done', displayName(c)), cv, true); break; }
      case '/del': case '/delete': { const c = targetContact(argv[0]); if (!c) break; await deleteContact(c); break; }
      case '/time': if (!requireConn(cv)) break; { const tm = await C.getTime(); notice(t('time.node', fmtDateTime(tm), tm - nowSecs()), cv, false); } break;
      case '/settime': if (!requireConn(cv)) break; await C.setTime(); notice(t('time.synced'), cv, false); break;
      case '/battery': case '/batt': if (!requireConn(cv)) break; S.batt = await C.getBattery(); renderBattery(); notice(t('batt.notice', (S.batt.mv / 1000).toFixed(2), S.batt.totalKb ? t('batt.storage', S.batt.usedKb, S.batt.totalKb) : ''), cv, false); break;
      case '/stats': if (!requireConn(cv)) break; await showNodeStats(cv); break;
      case '/raw': if (!requireConn(cv)) break; { const f = await C.raw(unhex(arg)); notice(t('raw.reply', hex(f)), cv, false); } break;
      case '/debug': S.settings.debug = !S.settings.debug; notice(t('debug.toggle', S.settings.debug ? t('debug.on') : t('debug.off')), cv, false); saveState(); break;
      case '/clear': cv.msgs = []; renderMessages(cv); saveState(true); break;
      case '/theme': setTheme(argv[0] || 'auto'); break;
      case '/close': closeConv(cv); break;
      default: errorMsg(t('cmd.unknown', cmd), cv);
    }
  } catch (e) { errorMsg((cmd + ': ' + (e.message || e)), cv); }
}
async function showNodeStats(cv) {
  try {
    const core = await C.getStats(0), radio = await C.getStats(1), pk = await C.getStats(2);
    const lines = [t('nodestats.line1', (rdU16(core, 2) / 1000).toFixed(2), fmtDur(rdU32(core, 4)), rdU16(core, 8).toString(16), core[10]), t('nodestats.line2', rdI16(radio, 2), rdI8(radio[4]), (rdI8(radio[5]) / 4).toFixed(1), fmtDur(rdU32(radio, 6)), fmtDur(rdU32(radio, 10))), t('nodestats.line3', rdU32(pk, 2), rdU32(pk, 6), rdU32(pk, 10), rdU32(pk, 18), rdU32(pk, 14), rdU32(pk, 22), rdU32(pk, 26))];
    addMsg(cv, { kind: 'cli', nick: myNick(), cmd: 'stats', text: lines.join('\n') });
  } catch (e) { errorMsg(t('nodestats.unavailable', e.message), cv); }
}
async function parseScopeArgs(argv) {
  const a = (argv[0] || '').toLowerCase();
  if (a === 'off' || a === 'none' || a === 'uit') return { mode: 'unscoped', name: '', key: '' };
  if (a === 'default' || a === 'standaard') return { mode: 'default', name: '', key: '' };
  if (a === 'global' || a === 'globaal') return { mode: 'global' };
  if (/^[0-9a-f]{32}$/i.test(a)) return { mode: 'custom', name: argv[1] || '', key: a.toLowerCase() };
  const known = S.settings.regions.find(r => r.name.toLowerCase() === argv[0].toLowerCase().replace(/^#/, ''));
  return { mode: 'custom', name: argv[0].replace(/^#/, ''), key: known ? known.key : await scopeKeyFromName(argv[0]) };
}
async function setSendScopeCmd(argv) {
  const cv0 = activeConv(); const ch0 = cv0.kind === 'channel' ? channelByConv(cv0) : null;
  if (ch0) { if (!argv[0]) { notice(t('scope.chanCurrent', S.chanScope[ch0.secret] ? scopeText(S.chanScope[ch0.secret]) : t('scope.globalNamed', scopeText(S.sendScope))), cv0, false); return; } await setChannelScope(ch0, await parseScopeArgs(argv)); return; }
  const a = (argv[0] || '').toLowerCase(); const st = S.convs.get('status');
  if (!a) { notice(t('scope.current', sendScopeText(), S.defaultScope ? t('scope.nodeDefault', S.defaultScope.name, S.defaultScope.key) : t('scope.noNodeDefault')), activeConv(), false); return; }
  if (a === 'off' || a === 'none' || a === 'uit') S.sendScope = { mode: 'unscoped', name: '', key: '' };
  else if (a === 'default' || a === 'standaard') S.sendScope = { mode: 'default', name: '', key: '' };
  else if (/^[0-9a-f]{32}$/i.test(a)) S.sendScope = { mode: 'custom', name: argv[1] || '', key: a.toLowerCase() };
  else S.sendScope = { mode: 'custom', name: argv[0], key: await scopeKeyFromName(argv[0]) };
  saveState(); await applySendScope(true); notice(t('scope.set', sendScopeText()), activeConv(), false);
}
async function setRegionCmd(argv) {
  if (!requireConn(activeConv())) return;
  if (!argv[0] || argv[0] === 'off') { await C.setDefaultScope('', ''); S.defaultScope = null; notice(t('region.cleared'), activeConv(), true); }
  else { const key = argv[1] && /^[0-9a-f]{32}$/i.test(argv[1]) ? argv[1].toLowerCase() : await scopeKeyFromName(argv[0]); await C.setDefaultScope(argv[0].replace(/^#/, ''), key); S.defaultScope = { name: argv[0].replace(/^#/, ''), key }; notice(t('region.set', S.defaultScope.name, key), activeConv(), true); }
  await applySendScope(false); saveState();
}
function copyText(txt) { try { navigator.clipboard.writeText(txt); toast(t('clip.copied'), 'ok', 2000); } catch (e) { toast(t('clip.failed'), 'err'); } }

// ---------- channels ----------
function freeChannelSlot() { const max = S.dev?.maxChannels || 8; for (let i = 0; i < max; i++) { const c = S.channels[i]; if (!c || !c.name) return i; } return -1; }
async function joinChannel(name, secretArg, forcedKind) {
  const cv = activeConv(); if (!requireConn(cv)) return;
  if (!name) { $('#dlg-channel').showModal(); return; }
  let key, label = name.trim();
  if (label.toLowerCase() === '#public' || label.toLowerCase() === 'public') { key = PUBLIC_KEY_HEX; label = 'Public'; }
  else if (forcedKind === 'key' || (secretArg && parseKeyInput(secretArg))) { key = parseKeyInput(secretArg); if (!key) { errorMsg(t('join.badKey'), cv); return; } }
  else if (forcedKind === 'password' || (secretArg && !label.startsWith('#'))) { key = await passwordKey(secretArg); }
  else if (label.startsWith('#')) { label = label.toLowerCase(); key = await hashtagKey(label); }
  else { errorMsg(t('join.usage'), cv); return; }
  const existing = S.channels.find(c => c && c.secret === key && c.name);
  if (existing) { openConv(convKeyForChannel(existing)); notice(t('join.exists'), S.convs.get(convKeyForChannel(existing)), false); return; }
  const slot = freeChannelSlot(); if (slot < 0) { errorMsg(t('join.full', S.channels.length), cv); return; }
  await C.setChannel(slot, label.slice(0, 31), key);
  S.channels[slot] = { idx: slot, name: label.slice(0, 31), secret: key };
  const ncv = convForChannel(S.channels[slot]); ncv.name = channelLabel(S.channels[slot]); openConv(ncv.key);
  notice(t('join.added', label, slot, key), ncv, true); saveState();
}
async function leaveChannel(ch) {
  const cv = activeConv(); if (!ch) { errorMsg(t('leave.notFound'), cv); return; } if (!requireConn(cv)) return;
  if (!await confirmDlg(t('leave.title'), t('leave.text', channelLabel(ch), ch.idx, ch.secret), t('ui.leave'), true)) return;
  await C.setChannel(ch.idx, '', '00000000000000000000000000000000');
  S.channels[ch.idx] = { idx: ch.idx, name: '', secret: '00000000000000000000000000000000' };
  const key = convKeyForChannel(ch); if (S.active === key) openConv('status'); renderTree(); notice(t('leave.done', channelLabel(ch)), S.convs.get('status'), false); saveState();
}
function closeConv(cv) { if (cv.kind === 'dm') { cv.open = false; openConv('status'); } else if (cv.kind === 'channel') leaveChannel(channelByConv(cv)); else openConv('status'); }
async function deleteContact(c) {
  if (!await confirmDlg(t('del.title'), t('del.text', displayName(c), advType(c.type)), t('ui.delete'), true)) return;
  if (C.connected) { try { await C.removeContact(c.pub); } catch (e) { errorMsg(t('del.failed', e.message)); return; } }
  c.hidden = true; const key = convKeyFor(c); if (S.active === key) openConv('status'); renderTree(); saveState(); toast(t('del.done', displayName(c)), 'ok'); if ($('#dlg-contacts').open) renderContactsDlg();
}
