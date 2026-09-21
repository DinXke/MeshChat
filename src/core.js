/* ===================== MeshCore companion protocol core ===================== */
'use strict';

// ---------- byte helpers ----------
const te = new TextEncoder(), td = new TextDecoder('utf-8', { fatal: false });
const hex = (u8) => Array.from(u8, b => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => { s = (s || '').replace(/[^0-9a-f]/gi, ''); const o = new Uint8Array(s.length >> 1); for (let i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; };
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0));
const u32le = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
const i32le = (v) => u32le(v >>> 0);
const rdU32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216;
const rdI32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24));
const rdU16 = (b, o) => b[o] | (b[o + 1] << 8);
const rdI16 = (b, o) => (rdU16(b, o) << 16) >> 16;
const rdI8 = (v) => (v << 24) >> 24;
const cstr = (b, o, n) => { let e = o; const end = n == null ? b.length : Math.min(b.length, o + n); while (e < end && b[e] !== 0) e++; return td.decode(b.subarray(o, e)); };
const padBytes = (u8, n) => { const o = new Uint8Array(n); o.set(u8.subarray(0, n)); return o; };
const cat = (...parts) => { const arrs = parts.map(p => p instanceof Uint8Array ? p : Uint8Array.from(p)); const o = new Uint8Array(arrs.reduce((s, a) => s + a.length, 0)); let i = 0; for (const a of arrs) { o.set(a, i); i += a.length; } return o; };
const nowSecs = () => Math.floor(Date.now() / 1000);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- SHA-256 (WebCrypto with pure-JS fallback for non-secure contexts) ----------
async function sha256(u8) {
  if (globalThis.crypto && crypto.subtle) { try { return new Uint8Array(await crypto.subtle.digest('SHA-256', u8)); } catch (e) { /* fall through */ } }
  return sha256js(u8);
}
function sha256js(msg) {
  const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const l = msg.length, padLen = (((l + 9) + 63) >> 6) << 6; const m = new Uint8Array(padLen); m.set(msg); m[l] = 0x80;
  const dv = new DataView(m.buffer); dv.setUint32(padLen - 4, (l * 8) >>> 0); dv.setUint32(padLen - 8, Math.floor(l * 8 / 4294967296));
  const W = new Uint32Array(64); const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padLen; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = rotr(W[i-15],7) ^ rotr(W[i-15],18) ^ (W[i-15] >>> 3), s1 = rotr(W[i-2],17) ^ rotr(W[i-2],19) ^ (W[i-2] >>> 10); W[i] = (W[i-16] + s0 + W[i-7] + s1) >>> 0; }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (let i = 0; i < 64; i++) { const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + W[i]) >>> 0, S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0; }
    H[0]+=a; H[1]+=b; H[2]+=c; H[3]+=d; H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h;
  }
  const out = new Uint8Array(32); const ov = new DataView(out.buffer); for (let i = 0; i < 8; i++) ov.setUint32(i * 4, H[i]); return out;
}

// ---------- protocol constants ----------
const CMD = { APP_START:1, SEND_TXT_MSG:2, SEND_CHANNEL_TXT_MSG:3, GET_CONTACTS:4, GET_DEVICE_TIME:5, SET_DEVICE_TIME:6, SEND_SELF_ADVERT:7, SET_ADVERT_NAME:8, ADD_UPDATE_CONTACT:9, SYNC_NEXT_MESSAGE:10, SET_RADIO_PARAMS:11, SET_RADIO_TX_POWER:12, RESET_PATH:13, SET_ADVERT_LATLON:14, REMOVE_CONTACT:15, SHARE_CONTACT:16, EXPORT_CONTACT:17, IMPORT_CONTACT:18, REBOOT:19, GET_BATT_AND_STORAGE:20, SET_TUNING_PARAMS:21, DEVICE_QUERY:22, EXPORT_PRIVATE_KEY:23, IMPORT_PRIVATE_KEY:24, SEND_RAW_DATA:25, SEND_LOGIN:26, SEND_STATUS_REQ:27, HAS_CONNECTION:28, LOGOUT:29, GET_CONTACT_BY_KEY:30, GET_CHANNEL:31, SET_CHANNEL:32, SEND_TRACE_PATH:36, SET_DEVICE_PIN:37, SET_OTHER_PARAMS:38, SEND_TELEMETRY_REQ:39, GET_CUSTOM_VARS:40, SET_CUSTOM_VAR:41, GET_ADVERT_PATH:42, GET_TUNING_PARAMS:43, SEND_BINARY_REQ:50, FACTORY_RESET:51, SEND_PATH_DISCOVERY_REQ:52, GET_STATS:56, SET_AUTOADD_CONFIG:58, GET_AUTOADD_CONFIG:59 };
const RESP = { OK:0, ERR:1, CONTACTS_START:2, CONTACT:3, END_OF_CONTACTS:4, SELF_INFO:5, SENT:6, CONTACT_MSG_RECV:7, CHANNEL_MSG_RECV:8, CURR_TIME:9, NO_MORE_MESSAGES:10, EXPORT_CONTACT:11, BATT_AND_STORAGE:12, DEVICE_INFO:13, PRIVATE_KEY:14, DISABLED:15, CONTACT_MSG_RECV_V3:16, CHANNEL_MSG_RECV_V3:17, CHANNEL_INFO:18, SIGN_START:19, SIGNATURE:20, CUSTOM_VARS:21, ADVERT_PATH:22, TUNING_PARAMS:23, STATS:24, AUTOADD_CONFIG:25, ALLOWED_REPEAT_FREQ:26, CHANNEL_DATA_RECV:27, DEFAULT_FLOOD_SCOPE:28 };
const PUSH = { ADVERT:0x80, PATH_UPDATED:0x81, SEND_CONFIRMED:0x82, MSG_WAITING:0x83, RAW_DATA:0x84, LOGIN_SUCCESS:0x85, LOGIN_FAIL:0x86, STATUS_RESPONSE:0x87, LOG_RX_DATA:0x88, TRACE_DATA:0x89, NEW_ADVERT:0x8A, TELEMETRY_RESPONSE:0x8B, BINARY_RESPONSE:0x8C, PATH_DISCOVERY_RESPONSE:0x8D, CONTROL_DATA:0x8E, CONTACT_DELETED:0x8F, CONTACTS_FULL:0x90 };
const ERR_TEXT = { 1:'commando niet ondersteund', 2:'niet gevonden', 3:'tabel/wachtrij vol', 4:'ongeldige toestand', 5:'opslagfout', 6:'ongeldig argument' };
const ADV_TYPE = { 0:'onbekend', 1:'chat', 2:'repeater', 3:'room', 4:'sensor' };
const TXT = { PLAIN:0, CLI:1, SIGNED:2 };
const PUBLIC_KEY_HEX = '8b3387e9c5cdea6ac9e5edbaa115cd72'; // "izOH6cXN6mrJ5e26oRXNcg=="
const MSG_TERMINALS = new Set([RESP.CONTACT_MSG_RECV, RESP.CHANNEL_MSG_RECV, RESP.CONTACT_MSG_RECV_V3, RESP.CHANNEL_MSG_RECV_V3, RESP.NO_MORE_MESSAGES, RESP.CHANNEL_DATA_RECV, RESP.ERR]);

// ---------- transports ----------
const UART_SVC = '6e400001-b5a3-f393-e0a9-e50e24dcca9e', UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e', UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

class SerialTransport {
  constructor() { this.kind = 'USB'; this.onFrame = null; this.onClose = null; this.port = null; this._reading = false; }
  static supported() { return 'serial' in navigator; }
  async connect(baud = 115200) {
    this.port = await navigator.serial.requestPort();
    await this.port.open({ baudRate: baud });
    this.writer = this.port.writable.getWriter();
    this._reading = true; this._readLoop();
    this.port.addEventListener('disconnect', () => this._closed());
  }
  async _readLoop() {
    const reader = this.port.readable.getReader(); this.reader = reader;
    let state = 0, len = 0, frame = null, fi = 0;
    try {
      while (this._reading) {
        const { value, done } = await reader.read(); if (done) break;
        for (const b of value) {
          if (state === 0) { if (b === 0x3C) state = 1; }
          else if (state === 1) { len = b; state = 2; }
          else if (state === 2) { len |= b << 8; if (len === 0 || len > 4096) { state = 0; continue; } frame = new Uint8Array(len); fi = 0; state = 3; }
          else { frame[fi++] = b; if (fi >= len) { state = 0; try { this.onFrame && this.onFrame(frame); } catch (e) { console.error(e); } } }
        }
      }
    } catch (e) { console.warn('serial read', e); }
    finally { try { reader.releaseLock(); } catch (e) {} this._closed(); }
  }
  async send(payload) {
    if (!this.writer) throw new Error('niet verbonden');
    await this.writer.write(cat([0x3E, payload.length & 255, payload.length >> 8], payload));
  }
  async close() {
    this._reading = false;
    try { await this.reader?.cancel(); } catch (e) {}
    try { this.writer?.releaseLock(); } catch (e) {}
    try { await this.port?.close(); } catch (e) {}
    this._closed();
  }
  _closed() { if (this.port) { this.port = null; this.writer = null; this.onClose && this.onClose(); } }
}

class BleTransport {
  constructor() { this.kind = 'Bluetooth'; this.onFrame = null; this.onClose = null; this.device = null; this._q = Promise.resolve(); }
  static supported() { return 'bluetooth' in navigator; }
  async connect() {
    this.device = await navigator.bluetooth.requestDevice({ filters: [{ services: [UART_SVC] }, { namePrefix: 'MeshCore' }], optionalServices: [UART_SVC] });
    // Windows drops the GATT link once during pairing/bonding; retry service discovery a few times.
    let svc = null, lastErr = null;
    for (let attempt = 0; attempt < 4 && !svc; attempt++) {
      try {
        if (attempt) await sleep(600 * attempt);
        const server = this.device.gatt.connected ? this.device.gatt : await this.device.gatt.connect();
        svc = await server.getPrimaryService(UART_SVC);
      } catch (e) { lastErr = e; try { this.device.gatt.disconnect(); } catch (_) {} }
    }
    if (!svc) { this.device = null; throw new Error((lastErr && lastErr.message) + ' — controleer of de node niet nog met de telefoon-app verbonden is, en koppel hem eerst in Windows (Instellingen › Bluetooth › Apparaat toevoegen, pincode standaard 123456).'); }
    this.device.addEventListener('gattserverdisconnected', () => this._closed());
    const step = async (name, fn) => {
      let err; for (let i = 0; i < 3; i++) { try { return await fn(); } catch (e) { err = e; await sleep(400 * (i + 1)); } }
      throw new Error(`${err.message} (stap: ${name}). Op Windows: koppel de node eerst via Instellingen › Bluetooth met de pincode (standaard 123456), of zet de BLE-pincode van de node op 0 via een USB-verbinding (Instellingen › Apparaat). Zorg dat de telefoon-app niet verbonden is.`);
    };
    this.rx = await step('RX-karakteristiek', () => svc.getCharacteristic(UART_RX));
    this.tx = await step('TX-karakteristiek', () => svc.getCharacteristic(UART_TX));
    this.tx.addEventListener('characteristicvaluechanged', (ev) => {
      const v = ev.target.value; const u8 = new Uint8Array(v.buffer, v.byteOffset, v.byteLength).slice();
      try { this.onFrame && this.onFrame(u8); } catch (e) { console.error(e); }
    });
    await step('notificaties', () => this.tx.startNotifications());
  }
  send(payload) {
    // serialise writes; the BLE stack rejects overlapping GATT operations
    this._q = this._q.then(async () => {
      if (!this.rx) throw new Error('niet verbonden');
      await this.rx.writeValue(payload);
    });
    return this._q;
  }
  async close() { try { this.device?.gatt?.disconnect(); } catch (e) {} this._closed(); }
  _closed() { if (this.device) { this.device = null; this.rx = this.tx = null; this.onClose && this.onClose(); } }
}

// ---------- parsers ----------
function parseContact(b, o = 1) {
  if (b.length < o + 32 + 3 + 64 + 32 + 4) return null;
  const c = { pub: hex(b.subarray(o, o + 32)), type: b[o + 32], flags: b[o + 33], outPathLen: rdI8(b[o + 34]), outPath: hex(b.subarray(o + 35, o + 99)), name: cstr(b, o + 99, 32), lastAdvert: rdU32(b, o + 131) };
  if (b.length >= o + 143) { c.lat = rdI32(b, o + 135) / 1e6; c.lon = rdI32(b, o + 139) / 1e6; }
  if (b.length >= o + 147) c.lastmod = rdU32(b, o + 143);
  return c;
}
function parseSelfInfo(b) {
  return { advType: b[1], txPower: rdI8(b[2]), maxTxPower: b[3], pub: hex(b.subarray(4, 36)), lat: rdI32(b, 36) / 1e6, lon: rdI32(b, 40) / 1e6, multiAcks: b[44], locPolicy: b[45], telemetryMode: b[46], manualAdd: b[47], freq: rdU32(b, 48) / 1000, bw: rdU32(b, 52) / 1000, sf: b[56], cr: b[57], name: td.decode(b.subarray(58)) };
}
function parseDeviceInfo(b) {
  const d = { fwVer: b[1] };
  if (b.length >= 80) { d.maxContacts = b[2] * 2; d.maxChannels = b[3]; d.blePin = rdU32(b, 4); d.build = cstr(b, 8, 12); d.model = cstr(b, 20, 40); d.version = cstr(b, 60, 20); }
  if (b.length >= 81) d.repeatEn = b[80]; if (b.length >= 82) d.pathHashMode = b[81];
  return d;
}
function parseMsgFrame(b) {
  const code = b[0];
  if (code === RESP.CONTACT_MSG_RECV_V3 || code === RESP.CONTACT_MSG_RECV) {
    const v3 = code === RESP.CONTACT_MSG_RECV_V3, o = v3 ? 4 : 1;
    const m = { kind: 'contact', snr: v3 ? rdI8(b[1]) / 4 : null, prefix: hex(b.subarray(o, o + 6)), pathLen: b[o + 6], txtType: b[o + 7], ts: rdU32(b, o + 8) };
    let t = o + 12; if (m.txtType === TXT.SIGNED) { m.sig = hex(b.subarray(t, t + 4)); t += 4; }
    m.text = td.decode(b.subarray(t)); return m;
  }
  if (code === RESP.CHANNEL_MSG_RECV_V3 || code === RESP.CHANNEL_MSG_RECV) {
    const v3 = code === RESP.CHANNEL_MSG_RECV_V3, o = v3 ? 4 : 1;
    return { kind: 'channel', snr: v3 ? rdI8(b[1]) / 4 : null, idx: b[o], pathLen: b[o + 1], txtType: b[o + 2], ts: rdU32(b, o + 3), text: td.decode(b.subarray(o + 7)) };
  }
  return null;
}
function parseStatus(b) { // repeater/room stats, payload starts at offset 8
  const o = 8; if (b.length < o + 32) return null;
  const s = { batt: rdU16(b, o), txQueue: rdU16(b, o + 2), noise: rdI16(b, o + 4), rssi: rdI16(b, o + 6), recv: rdU32(b, o + 8), sent: rdU32(b, o + 12), airtime: rdU32(b, o + 16), uptime: rdU32(b, o + 20), sentFlood: rdU32(b, o + 24), sentDirect: rdU32(b, o + 28) };
  if (b.length >= o + 52) { s.recvFlood = rdU32(b, o + 32); s.recvDirect = rdU32(b, o + 36); s.fullEvents = rdU16(b, o + 40); s.snr = rdI16(b, o + 42) / 4; s.directDups = rdU16(b, o + 44); s.floodDups = rdU16(b, o + 46); s.rxAirtime = rdU32(b, o + 48); }
  return s;
}
// CayenneLPP (big-endian)
function parseLPP(b) {
  const out = []; let i = 0;
  const be16 = () => { const v = (b[i] << 8) | b[i + 1]; i += 2; return v; }, sbe16 = () => (be16() << 16) >> 16;
  const be24 = () => { const v = (b[i] << 16) | (b[i + 1] << 8) | b[i + 2]; i += 3; return v; }, sbe24 = () => (be24() << 8) >> 8;
  const be32 = () => { const v = ((b[i] << 24) | (b[i+1] << 16) | (b[i+2] << 8) | b[i+3]) >>> 0; i += 4; return v; };
  while (i + 2 <= b.length) {
    const ch = b[i++], t = b[i++]; let r = { ch, type: t };
    try {
      switch (t) {
        case 0x00: r.name = 'digitaal in'; r.val = b[i++]; break;
        case 0x01: r.name = 'digitaal uit'; r.val = b[i++]; break;
        case 0x02: r.name = 'analoog in'; r.val = sbe16() / 100; break;
        case 0x03: r.name = 'analoog uit'; r.val = sbe16() / 100; break;
        case 0x65: r.name = 'lichtsterkte'; r.val = be16(); r.unit = 'lux'; break;
        case 0x66: r.name = 'aanwezigheid'; r.val = b[i++]; break;
        case 0x67: r.name = 'temperatuur'; r.val = sbe16() / 10; r.unit = '°C'; break;
        case 0x68: r.name = 'luchtvochtigheid'; r.val = b[i++] / 2; r.unit = '%'; break;
        case 0x71: r.name = 'accelerometer'; r.val = [sbe16() / 1000, sbe16() / 1000, sbe16() / 1000]; r.unit = 'g'; break;
        case 0x73: r.name = 'luchtdruk'; r.val = be16() / 10; r.unit = 'hPa'; break;
        case 0x74: r.name = 'spanning'; r.val = be16() / 100; r.unit = 'V'; break;
        case 0x75: r.name = 'stroom'; r.val = be16() / 1000; r.unit = 'A'; break;
        case 0x76: r.name = 'frequentie'; r.val = be32(); r.unit = 'Hz'; break;
        case 0x77: r.name = 'percentage'; r.val = b[i++]; r.unit = '%'; break;
        case 0x78: r.name = 'hoogte'; r.val = sbe16(); r.unit = 'm'; break;
        case 0x7d: r.name = 'vermogen'; r.val = be16(); r.unit = 'W'; break;
        case 0x7f: r.name = 'afstand'; r.val = be32(); r.unit = 'mm'; break;
        case 0x83: r.name = 'energie'; r.val = be32(); r.unit = 'Wh'; break;
        case 0x85: r.name = 'richting'; r.val = be16(); r.unit = '°'; break;
        case 0x86: r.name = 'gyro'; r.val = [sbe16() / 100, sbe16() / 100, sbe16() / 100]; r.unit = '°/s'; break;
        case 0x88: r.name = 'gps'; r.val = [sbe24() / 10000, sbe24() / 10000, sbe24() / 100]; break;
        default: r.name = 'type 0x' + t.toString(16); r.val = '?'; i = b.length;
      }
    } catch (e) { i = b.length; }
    out.push(r);
  }
  return out;
}

// ---------- client ----------
class MeshCoreClient extends EventTarget {
  constructor() { super(); this.tr = null; this.pending = null; this.queue = []; this.connected = false; }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
  get kind() { return this.tr ? this.tr.kind : null; }
  async connect(transport) {
    this.tr = transport;
    transport.onFrame = (f) => this._onFrame(f);
    transport.onClose = () => { const was = this.connected; this.connected = false; this.tr = null; this._failAll('verbinding verbroken'); if (was) this.emit('disconnected'); };
    await transport.connect();
    this.connected = true;
  }
  async disconnect() { if (this.tr) await this.tr.close(); }
  _failAll(reason) { if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(new Error(reason)); this.pending = null; } for (const q of this.queue) q.reject(new Error(reason)); this.queue = []; }

  // Send one command; resolves with the terminal response frame(s). Commands are strictly sequential.
  cmd(payload, opts = {}) {
    payload = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
    return new Promise((resolve, reject) => { this.queue.push({ payload, opts, resolve, reject }); this._pump(); });
  }
  async _pump() {
    if (this.pending || !this.queue.length) return;
    if (!this.tr) { this._failAll('niet verbonden'); return; }
    const job = this.queue.shift(); this.pending = { ...job, frames: [] };
    this.pending.timer = setTimeout(() => { const p = this.pending; this.pending = null; p && p.reject(new Error('timeout (cmd ' + job.payload[0] + ')')); this._pump(); }, job.opts.timeout || 8000);
    this.emit('tx', job.payload);
    try { await this.tr.send(job.payload); }
    catch (e) { if (this.pending) clearTimeout(this.pending.timer); this.pending = null; job.reject(e); this._pump(); }
  }
  _onFrame(f) {
    if (!f.length) return;
    this.emit('rx', f);
    const code = f[0];
    if (code >= 0x80) { this._onPush(code, f); return; }
    const p = this.pending;
    if (!p) { this.emit('unsolicited', f); return; }
    const { opts } = p;
    if (opts.collect) { // multi-frame response (contact list)
      if (code === RESP.ERR) { this._finish(p); p.reject(new Error('fout: ' + (ERR_TEXT[f[1]] || f[1]))); return; }
      p.frames.push(f);
      if (opts.collect(code, f)) { this._finish(p); p.resolve(p.frames); }
      return;
    }
    if (opts.terminals && !opts.terminals.has(code)) { this.emit('unsolicited', f); return; }
    this._finish(p);
    if (code === RESP.ERR && !opts.allowErr) p.reject(Object.assign(new Error('fout: ' + (ERR_TEXT[f[1]] || ('code ' + f[1]))), { errCode: f[1] }));
    else p.resolve(f);
  }
  _finish(p) { clearTimeout(p.timer); this.pending = null; setTimeout(() => this._pump(), 0); }
  _onPush(code, f) {
    switch (code) {
      case PUSH.ADVERT: this.emit('advert', { pub: hex(f.subarray(1, 33)) }); break;
      case PUSH.PATH_UPDATED: this.emit('pathUpdated', { pub: hex(f.subarray(1, 33)) }); break;
      case PUSH.SEND_CONFIRMED: this.emit('ack', { ack: hex(f.subarray(1, 5)), tripMs: rdU32(f, 5) }); break;
      case PUSH.MSG_WAITING: this.emit('msgWaiting'); break;
      case PUSH.LOGIN_SUCCESS: this.emit('login', { ok: true, prefix: hex(f.subarray(2, 8)), perms: f[1], acl: f.length > 12 ? f[12] : null }); break;
      case PUSH.LOGIN_FAIL: this.emit('login', { ok: false, prefix: hex(f.subarray(2, 8)) }); break;
      case PUSH.STATUS_RESPONSE: this.emit('status', { prefix: hex(f.subarray(2, 8)), stats: parseStatus(f), raw: f }); break;
      case PUSH.TELEMETRY_RESPONSE: this.emit('telemetry', { prefix: hex(f.subarray(2, 8)), lpp: parseLPP(f.subarray(8)) }); break;
      case PUSH.TRACE_DATA: {
        const pathLen = f[2], flags = f[3], sz = flags & 3, n = pathLen >> sz;
        const hashes = []; for (let i = 0; i < n; i++) hashes.push(hex(f.subarray(12 + i * (1 << sz), 12 + (i + 1) * (1 << sz))));
        const snrs = []; for (let i = 0; i < n + 1 && 12 + pathLen + i < f.length; i++) snrs.push(rdI8(f[12 + pathLen + i]) / 4);
        this.emit('trace', { tag: rdU32(f, 4), auth: rdU32(f, 8), hashes, snrs }); break;
      }
      case PUSH.NEW_ADVERT: this.emit('newAdvert', parseContact(f, 1)); break;
      case PUSH.PATH_DISCOVERY_RESPONSE: {
        const prefix = hex(f.subarray(2, 8)); const ol = f[8]; const out = hex(f.subarray(9, 9 + ol)); const il = f[9 + ol]; const inp = hex(f.subarray(10 + ol, 10 + ol + il));
        this.emit('pathDiscovery', { prefix, outLen: ol, outPath: out, inLen: il, inPath: inp }); break;
      }
      case PUSH.LOG_RX_DATA: this.emit('rxLog', { snr: rdI8(f[1]) / 4, rssi: rdI8(f[2]), raw: f.subarray(3) }); break;
      case PUSH.CONTACT_DELETED: this.emit('contactDeleted', { pub: hex(f.subarray(1, 33)) }); break;
      case PUSH.CONTACTS_FULL: this.emit('contactsFull'); break;
      default: this.emit('push', { code, raw: f });
    }
  }

  // ---- high-level commands ----
  async appStart(appName = 'MeshCoreIRC') { const f = await this.cmd(cat([CMD.APP_START, 3], new Uint8Array(6), te.encode(appName))); return parseSelfInfo(f); }
  async deviceQuery() { try { const f = await this.cmd([CMD.DEVICE_QUERY, 3]); return parseDeviceInfo(f); } catch (e) { return null; } }
  async getTime() { const f = await this.cmd([CMD.GET_DEVICE_TIME]); return rdU32(f, 1); }
  setTime(secs = nowSecs()) { return this.cmd([CMD.SET_DEVICE_TIME, ...u32le(secs)]); }
  async getBattery() { const f = await this.cmd([CMD.GET_BATT_AND_STORAGE]); return { mv: rdU16(f, 1), usedKb: f.length >= 11 ? rdU32(f, 3) : null, totalKb: f.length >= 11 ? rdU32(f, 7) : null }; }
  async getContacts(since = 0) {
    const frames = await this.cmd(since ? [CMD.GET_CONTACTS, ...u32le(since)] : [CMD.GET_CONTACTS], { collect: (code) => code === RESP.END_OF_CONTACTS, timeout: 30000 });
    return frames.filter(f => f[0] === RESP.CONTACT).map(f => parseContact(f, 1)).filter(Boolean);
  }
  async getChannel(idx) { const f = await this.cmd([CMD.GET_CHANNEL, idx]); return { idx: f[1], name: cstr(f, 2, 32), secret: hex(f.subarray(34, 50)) }; }
  setChannel(idx, name, secretHex) { return this.cmd(cat([CMD.SET_CHANNEL, idx], padBytes(te.encode(name), 32), padBytes(unhex(secretHex), 16))); }
  async syncNext() { const f = await this.cmd([CMD.SYNC_NEXT_MESSAGE], { terminals: MSG_TERMINALS, allowErr: true }); if (f[0] === RESP.NO_MORE_MESSAGES || f[0] === RESP.ERR) return null; return parseMsgFrame(f) || { kind: 'other', raw: f }; }
  async sendText(pubHex, text, txtType = TXT.PLAIN, attempt = 0) {
    const ts = nowSecs();
    const f = await this.cmd(cat([CMD.SEND_TXT_MSG, txtType, attempt, ...u32le(ts)], unhex(pubHex).subarray(0, 6), te.encode(text)));
    return { ts, flood: f[1] === 1, ack: hex(f.subarray(2, 6)), timeoutMs: rdU32(f, 6) };
  }
  async sendChannelText(idx, text) { const ts = nowSecs(); await this.cmd(cat([CMD.SEND_CHANNEL_TXT_MSG, 0, idx, ...u32le(ts)], te.encode(text))); return { ts }; }
  sendAdvert(flood) { return this.cmd([CMD.SEND_SELF_ADVERT, flood ? 1 : 0]); }
  setName(name) { return this.cmd(cat([CMD.SET_ADVERT_NAME], te.encode(name))); }
  setLatLon(lat, lon) { return this.cmd([CMD.SET_ADVERT_LATLON, ...i32le(Math.round(lat * 1e6)), ...i32le(Math.round(lon * 1e6))]); }
  setRadio(freqMHz, bwKHz, sf, cr) { return this.cmd([CMD.SET_RADIO_PARAMS, ...u32le(Math.round(freqMHz * 1000)), ...u32le(Math.round(bwKHz * 1000)), sf, cr]); }
  setTxPower(dbm) { return this.cmd([CMD.SET_RADIO_TX_POWER, dbm & 255]); }
  setOtherParams(manualAdd, telemetryMode, locPolicy, multiAcks) { return this.cmd([CMD.SET_OTHER_PARAMS, manualAdd & 1, telemetryMode & 255, locPolicy & 255, multiAcks & 255]); }
  resetPath(pubHex) { return this.cmd(cat([CMD.RESET_PATH], unhex(pubHex))); }
  removeContact(pubHex) { return this.cmd(cat([CMD.REMOVE_CONTACT], unhex(pubHex))); }
  shareContact(pubHex) { return this.cmd(cat([CMD.SHARE_CONTACT], unhex(pubHex))); }
  addUpdateContact(c) {
    return this.cmd(cat([CMD.ADD_UPDATE_CONTACT], unhex(c.pub), [c.type & 255, c.flags & 255, c.outPathLen & 255], padBytes(unhex(c.outPath || ''), 64), padBytes(te.encode(c.name || ''), 32), u32le(c.lastAdvert || 0), i32le(Math.round((c.lat || 0) * 1e6)), i32le(Math.round((c.lon || 0) * 1e6))));
  }
  async exportContact(pubHex) { const f = await this.cmd(pubHex ? cat([CMD.EXPORT_CONTACT], unhex(pubHex)) : [CMD.EXPORT_CONTACT]); return 'meshcore://' + hex(f.subarray(1)); }
  importContact(uri) { const h = uri.trim().replace(/^meshcore:\/\//i, ''); return this.cmd(cat([CMD.IMPORT_CONTACT], unhex(h))); }
  reboot() { return this.cmd(cat([CMD.REBOOT], te.encode('reboot')), { timeout: 1500 }).catch(() => {}); }
  async login(pubHex, password) { const f = await this.cmd(cat([CMD.SEND_LOGIN], unhex(pubHex), te.encode(password))); return { flood: f[1] === 1, timeoutMs: rdU32(f, 6) }; }
  logout(pubHex) { return this.cmd(cat([CMD.LOGOUT], unhex(pubHex))); }
  async statusReq(pubHex) { const f = await this.cmd(cat([CMD.SEND_STATUS_REQ], unhex(pubHex))); return { timeoutMs: rdU32(f, 6) }; }
  async telemetryReq(pubHex) { const f = await this.cmd(cat([CMD.SEND_TELEMETRY_REQ, 0, 0, 0], unhex(pubHex))); return { timeoutMs: rdU32(f, 6) }; }
  async pathDiscovery(pubHex) { const f = await this.cmd(cat([CMD.SEND_PATH_DISCOVERY_REQ, 0], unhex(pubHex))); return { timeoutMs: rdU32(f, 6) }; }
  async tracePath(pathHex) { const tag = (Math.random() * 0xFFFFFFFF) >>> 0, auth = (Math.random() * 0xFFFFFFFF) >>> 0; const f = await this.cmd(cat([CMD.SEND_TRACE_PATH, ...u32le(tag), ...u32le(auth), 0], unhex(pathHex))); return { tag, auth, timeoutMs: rdU32(f, 6) }; }
  async getStats(type) { return this.cmd([CMD.GET_STATS, type]); }
  async getAdvertPath(pubHex) { const f = await this.cmd(cat([CMD.GET_ADVERT_PATH, 0], unhex(pubHex))); return { ts: rdU32(f, 1), len: f[5], path: hex(f.subarray(6)) }; }
  async exportPrivateKey() { const f = await this.cmd([CMD.EXPORT_PRIVATE_KEY], { allowErr: true }); if (f[0] !== RESP.PRIVATE_KEY) throw new Error('uitgeschakeld in firmware'); return hex(f.subarray(1)); }
  raw(bytes) { return this.cmd(bytes, { allowErr: true }); }
}

// ---------- channel key derivation ----------
async function hashtagKey(name) { const n = name.startsWith('#') ? name : '#' + name; return hex((await sha256(te.encode(n.toLowerCase()))).subarray(0, 16)); }
async function passwordKey(pw) { return hex((await sha256(te.encode(pw))).subarray(0, 16)); }
function randomKey() { const k = new Uint8Array(16); crypto.getRandomValues(k); return hex(k); }
function parseKeyInput(s) { // hex (32 chars) or base64 (24 chars)
  s = (s || '').trim(); if (/^[0-9a-f]{32}$/i.test(s)) return s.toLowerCase();
  try { const u = unb64(s); if (u.length === 16) return hex(u); } catch (e) {}
  return null;
}
