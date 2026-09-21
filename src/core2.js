/* ===================== Extra device commands (settings parity with the official app) ===================== */
Object.assign(MeshCoreClient.prototype, {
  async getContact(pubHex) { const f = await this.cmd(cat([CMD.GET_CONTACT_BY_KEY], unhex(pubHex))); return parseContact(f, 1); },
  setDevicePin(pin) { return this.cmd([CMD.SET_DEVICE_PIN, ...u32le(pin >>> 0)]); },
  setPathHashMode(mode) { return this.cmd([61, 0, mode & 3]); },
  factoryReset() { return this.cmd(cat([CMD.FACTORY_RESET], te.encode('reset')), { timeout: 4000 }); },
  importPrivateKey(hex64) { return this.cmd(cat([CMD.IMPORT_PRIVATE_KEY], unhex(hex64))); },
  async getTuning() { const f = await this.cmd([CMD.GET_TUNING_PARAMS]); return { rxDelayBase: rdU32(f, 1) / 1000, airtimeFactor: rdU32(f, 5) / 1000 }; },
  setTuning(rxDelayBase, airtimeFactor) { return this.cmd([CMD.SET_TUNING_PARAMS, ...u32le(Math.round(rxDelayBase * 1000)), ...u32le(Math.round(airtimeFactor * 1000))]); },
  async getAutoAdd() { const f = await this.cmd([CMD.GET_AUTOADD_CONFIG]); return { mask: f[1], maxHops: f.length > 2 ? f[2] : null }; },
  setAutoAdd(mask, maxHops) { return this.cmd(maxHops == null ? [CMD.SET_AUTOADD_CONFIG, mask & 255] : [CMD.SET_AUTOADD_CONFIG, mask & 255, maxHops & 255]); },
  setRadioFull(freqMHz, bwKHz, sf, cr, repeat) { return this.cmd([CMD.SET_RADIO_PARAMS, ...u32le(Math.round(freqMHz * 1000)), ...u32le(Math.round(bwKHz * 1000)), sf, cr, repeat ? 1 : 0]); },
  // flood scopes ("regio's")
  setSendScope(keyHex) { return keyHex == null ? this.cmd([54, 1]) : this.cmd(cat([54, 0], padBytes(unhex(keyHex), 16))); },
  async getDefaultScope() { const f = await this.cmd([64]); if (f.length < 48) return null; return { name: cstr(f, 1, 31), key: hex(f.subarray(32, 48)) }; },
  setDefaultScope(name, keyHex) { return name ? this.cmd(cat([63], padBytes(te.encode(name), 31), padBytes(unhex(keyHex), 16))) : this.cmd([63]); },
  async getAllowedRepeatFreq() { const f = await this.cmd([60]); const r = []; for (let i = 1; i + 8 <= f.length; i += 8) r.push([rdU32(f, i) / 1000, rdU32(f, i + 4) / 1000]); return r; },
  selfTelemetry() { return this.cmd([CMD.SEND_TELEMETRY_REQ, 0, 0, 0], { terminals: new Set([RESP.OK, RESP.ERR]), allowErr: true, timeout: 3000 }).catch(() => null); },
  async getCustomVars() { const f = await this.cmd([CMD.GET_CUSTOM_VARS], { allowErr: true }); return f[0] === RESP.CUSTOM_VARS ? td.decode(f.subarray(1)) : ''; },
  setCustomVar(k, v) { return this.cmd(cat([CMD.SET_CUSTOM_VAR], te.encode(k + ':' + v))); },
});
async function scopeKeyFromName(name) { const n = name.trim().replace(/^#/, ''); return hex((await sha256(te.encode('#' + n))).subarray(0, 16)); }
