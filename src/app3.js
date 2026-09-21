/* ===================== Connection, device events, messaging ===================== */
const C = S.client;

async function connect(kind) {
  if (C.connected || S.connecting) return;
  const Tr = kind === 'ble' ? BleTransport : SerialTransport;
  if (!Tr.supported()) { errorMsg(kind === 'ble' ? 'Web Bluetooth wordt niet ondersteund door deze browser (gebruik Chrome/Edge, of Bluefy op iOS).' : 'Web Serial wordt niet ondersteund door deze browser (gebruik Chrome/Edge op desktop of Android).', S.convs.get('status')); return; }
  S.connecting = true; setStatus('st-busy', 'Verbinden…');
  try {
    await C.connect(new Tr());
    setStatus('st-busy', 'Synchroniseren…');
    await afterConnect();
    setStatus('st-on', 'Verbonden · ' + C.kind);
  } catch (e) {
    if (e && (e.name === 'NotFoundError' || /cancel/i.test(e.message))) { notice('Verbinden geannuleerd.', S.convs.get('status'), false); }
    else errorMsg('Verbinden mislukt: ' + (e.message || e), S.convs.get('status'));
    try { await C.disconnect(); } catch (_) {}
    setStatus('st-off', 'Niet verbonden');
  } finally { S.connecting = false; setStatus($('#status').className, $('#status').textContent); }
}
async function afterConnect() {
  const st = S.convs.get('status');
  S.self = await C.appStart('MeshChat'); renderNick();
  S.dev = await C.deviceQuery();
  notice(`Verbonden via ${C.kind} met ${S.dev?.model || 'MeshCore-node'} (fw ${S.dev?.version || '?'}${S.dev?.build ? ', build ' + S.dev.build : ''}) · node "${S.self.name}"`, st, false);
  notice(`Radio ${S.self.freq} MHz · BW ${S.self.bw} kHz · SF${S.self.sf} · CR${S.self.cr} · ${S.self.txPower} dBm`, st, false);
  try { const t = await C.getTime(); S.devTimeOffset = t - nowSecs(); if (Math.abs(S.devTimeOffset) > 30 && t < nowSecs()) { await C.setTime(); notice(`Klok van de node gesynchroniseerd (stond ${-S.devTimeOffset} s achter).`, st, false); S.devTimeOffset = 0; } } catch (e) { debugLog('tijd: ' + e.message); }
  try { S.batt = await C.getBattery(); renderBattery(); } catch (e) {}
  try { S.defaultScope = await C.getDefaultScope(); } catch (e) { S.defaultScope = null; }
  await applySendScope(false);
  await refreshContacts(true);
  await refreshChannels();
  if (!S.convs.has(S.active) || S.active === 'status') { const pub = S.channels.find(c => c && c.secret === PUBLIC_KEY_HEX); if (pub) openConv(convKeyForChannel(pub)); }
  renderTree(); renderHead(activeConv()); renderUsers(activeConv());
  await drainMessages();
  autoLogin();
  if (S.settings.notif && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
  clearInterval(S.battTimer); S.battTimer = setInterval(async () => { if (C.connected) { try { S.batt = await C.getBattery(); renderBattery(); } catch (e) {} } }, 60000);
}
async function refreshContacts(full) {
  const list = await C.getContacts(0);
  const seen = new Set();
  for (const c of list) { seen.add(c.pub); const old = S.contacts.get(c.pub) || {}; S.contacts.set(c.pub, { ...old, ...c, hidden: false }); }
  if (full) for (const [pub, c] of S.contacts) if (!seen.has(pub)) c.hidden = true; // not on device (anymore)
  for (const c of S.contacts.values()) if (!c.hidden && c.type >= 2) convForContact(c);
  notice(`${list.length} contacten geladen van de node.`, S.convs.get('status'), false);
  renderTree(); saveState();
}
async function refreshContact(pub) {
  try { const c = await C.getContact(pub); if (c) { const old = S.contacts.get(pub) || {}; S.contacts.set(pub, { ...old, ...c, hidden: false }); } } catch (e) { debugLog('contact ' + pub.slice(0, 8) + ': ' + e.message); }
  renderTree(); const cv = activeConv(); if (cv.pub === pub) { renderHead(cv); renderUsers(cv); } saveState();
}
async function refreshChannels() {
  const max = S.dev?.maxChannels || 8; const chans = [];
  for (let i = 0; i < max; i++) { try { const ch = await C.getChannel(i); chans[i] = ch; } catch (e) { if (i > 0) break; } }
  S.channels = chans;
  for (const ch of chans) if (ch && ch.name) convForChannel(ch);
  renderTree(); saveState();
}
async function drainMessages() {
  if (S.syncing || !C.connected) return; S.syncing = true;
  try { for (let n = 0; n < 200; n++) { const m = await C.syncNext(); if (!m) break; handleIncoming(m); } }
  catch (e) { debugLog('sync: ' + e.message); }
  finally { S.syncing = false; }
}
function autoLogin() { for (const [pub, r] of Object.entries(S.roomPw)) { const c = S.contacts.get(pub); if (c && !c.hidden && r.auto && r.pw != null) doLogin(c, r.pw, true); } }

C.addEventListener('disconnected', () => { setStatus('st-off', 'Niet verbonden'); notice('Verbinding met de node verbroken.', S.convs.get('status'), false); for (const c of S.contacts.values()) c.loggedIn = false; S.batt = null; renderBattery(); renderTree(); renderHead(activeConv()); toast('Verbinding verbroken', 'warn'); });
C.addEventListener('msgWaiting', () => drainMessages());
C.addEventListener('rx', (e) => { if (S.settings.debug) debugLog('← ' + hex(e.detail).slice(0, 120)); });
C.addEventListener('tx', (e) => { if (S.settings.debug) debugLog('→ ' + hex(e.detail).slice(0, 120)); });
C.addEventListener('advert', (e) => { const c = S.contacts.get(e.detail.pub); refreshContact(e.detail.pub).then(() => { const c2 = S.contacts.get(e.detail.pub); if (c2) { notice(`Advert van ${displayName(c2)}${c ? '' : ' (nieuw)'}`, S.convs.get('status'), false); const cv = S.convs.get(convKeyFor(c2)); if (cv && cv.key === S.active) renderHead(cv); } }); });
C.addEventListener('pathUpdated', (e) => { refreshContact(e.detail.pub).then(() => { const c = S.contacts.get(e.detail.pub); if (c) { const cv = convForContact(c); notice(`Pad naar ${displayName(c)} bijgewerkt: ${pathInfo(c).text}`, cv, true); } }); });
C.addEventListener('newAdvert', (e) => { const c = e.detail; if (!c) return; S.pendingAdverts.set(c.pub, c); notice(`Nieuwe node gezien: ${c.name} (${ADV_TYPE[c.type]}). Voeg toe via Contacten › Wachtende adverts.`, S.convs.get('status'), false); toast(`Nieuwe node: ${c.name} (${ADV_TYPE[c.type]})`, '', 6000); if ($('#dlg-contacts').open) renderContactsDlg(); });
C.addEventListener('contactDeleted', (e) => { const c = S.contacts.get(e.detail.pub); if (c) { c.hidden = true; notice(`Contact ${displayName(c)} is van de node verwijderd.`, S.convs.get('status'), false); renderTree(); } });
C.addEventListener('contactsFull', () => toast('Contactenlijst van de node is vol', 'warn'));
C.addEventListener('ack', (e) => {
  const { ack, tripMs } = e.detail;
  for (const cv of S.convs.values()) for (let i = cv.msgs.length - 1; i >= Math.max(0, cv.msgs.length - 50); i--) { const m = cv.msgs[i]; if (m.self && m.ackCode === ack) { m.ack = 'ok'; m.trip = tripMs; clearTimeout(m._timer); updateMsgDom(m); saveState(); return; } }
  debugLog('ack ' + ack + ' onbekend');
});
C.addEventListener('login', (e) => {
  const { ok, prefix, perms } = e.detail; const c = contactByPrefix(prefix); if (!c) return;
  const cv = convForContact(c); c.loggedIn = ok; c.perms = perms; c._loginPending = false;
  if (ok) { notice(`Ingelogd op ${displayName(c)}${perms ? ' als admin' : ''}.`, cv, true); toast('Ingelogd op ' + displayName(c), 'ok'); }
  else { errorMsg(`Login op ${displayName(c)} geweigerd (verkeerd wachtwoord?).`, cv); delete S.roomPw[c.pub]?.auto; }
  renderTree(); if (cv.key === S.active) { renderHead(cv); renderUsers(cv); renderCompose(cv); } saveState();
});
C.addEventListener('status', (e) => {
  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status'); const s = e.detail.stats;
  if (!s) { addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: 'status', text: 'ruw: ' + hex(e.detail.raw.subarray(8)) }); return; }
  const lines = [`batterij ${(s.batt / 1000).toFixed(2)} V · uptime ${fmtDur(s.uptime)} · tx-wachtrij ${s.txQueue}`, `ruisvloer ${s.noise} dBm · laatste RSSI ${s.rssi} dBm${s.snr != null ? ' · laatste SNR ' + s.snr.toFixed(1) + ' dB' : ''}`, `ontvangen ${s.recv} (flood ${s.recvFlood ?? '?'}, direct ${s.recvDirect ?? '?'}) · verzonden ${s.sent} (flood ${s.sentFlood}, direct ${s.sentDirect})`, `airtime tx ${fmtDur(s.airtime)}${s.rxAirtime != null ? ' · rx ' + fmtDur(s.rxAirtime) : ''}${s.fullEvents != null ? ' · wachtrij-vol ' + s.fullEvents : ''}${s.directDups != null ? ' · dups direct/flood ' + s.directDups + '/' + s.floodDups : ''}`];
  addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: 'status', text: lines.join('\n') });
});
C.addEventListener('telemetry', (e) => {
  const c = contactByPrefix(e.detail.prefix); const self = isSelfPub(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status');
  const txt = e.detail.lpp.length ? e.detail.lpp.map(r => `${r.name}${r.ch ? ' [' + r.ch + ']' : ''}: ${Array.isArray(r.val) ? r.val.join(', ') : r.val}${r.unit ? ' ' + r.unit : ''}`).join('\n') : '(geen gegevens)';
  addMsg(cv, { kind: 'cli', nick: self ? myNick() : c ? displayName(c) : '?', cmd: 'telemetrie', text: txt });
});
C.addEventListener('trace', (e) => {
  const { hashes, snrs } = e.detail; const cv = S.traceConv || activeConv();
  const lines = hashes.map((h, i) => `hop ${i + 1}: ${hashLabel(h)}  SNR ${snrs[i] != null ? snrs[i].toFixed(1) : '?'} dB`); lines.push(`terug bij mij: SNR ${snrs[hashes.length] != null ? snrs[hashes.length].toFixed(1) : '?'} dB`);
  addMsg(cv, { kind: 'cli', nick: 'trace', cmd: 'trace ' + hashes.join(','), text: lines.join('\n') }); S.traceConv = null;
});
C.addEventListener('pathDiscovery', (e) => {
  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status'); const sz = 1 << (S.dev?.pathHashMode || 0);
  const split = (h) => { const r = []; for (let i = 0; i < h.length; i += sz * 2) r.push(h.slice(i, i + sz * 2)); return r; };
  addMsg(cv, { kind: 'cli', nick: c ? displayName(c) : '?', cmd: 'pad zoeken', text: `heen (${e.detail.outLen} hops): ${split(e.detail.outPath).map(hashLabel).join(' → ') || 'direct'}\nterug (${e.detail.inLen} hops): ${split(e.detail.inPath).map(hashLabel).join(' → ') || 'direct'}` });
  if (c) refreshContact(c.pub);
});
C.addEventListener('rxLog', (e) => {
  const pkt = decodePacket(e.detail.raw); S.rxLog.push({ at: Date.now(), snr: e.detail.snr, rssi: e.detail.rssi, pkt }); if (S.rxLog.length > 300) S.rxLog.shift();
  if (S.settings.debug) debugLog(`rx ${pkt.ptypeName} ${pkt.routeName} ${pkt.hashCount} hops SNR ${e.detail.snr} RSSI ${e.detail.rssi}`);
});
C.addEventListener('push', (e) => debugLog('push 0x' + e.detail.code.toString(16) + ' ' + hex(e.detail.raw)));
C.addEventListener('unsolicited', (e) => debugLog('onverwacht frame ' + hex(e.detail).slice(0, 80)));

// ---------- incoming messages ----------
function handleIncoming(m) {
  if (m.kind === 'channel') {
    const ch = S.channels[m.idx]; if (!ch) { debugLog('bericht voor onbekend kanaal ' + m.idx); return; }
    const cv = convForChannel(ch); const mt = /^([^:]{1,40}): ([\s\S]*)$/.exec(m.text); const nick = mt ? mt[1] : '?', text = mt ? mt[2] : m.text;
    const msg = { kind: text.startsWith('* ') ? 'action' : 'msg', nick, text: text.startsWith('* ') ? text.slice(2) : text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, chan: m.idx, hl: mentionsMe(text), rawHex: hex(m.raw || new Uint8Array()) };
    correlateRx(msg); const c = contactByName(nick); if (c) { msg.pub = c.pub; if (m.snr != null && (msg.pathLen === 0 || msg.pathLen === 0xFF)) c.lastSnr = m.snr; }
    addMsg(cv, msg); return;
  }
  if (m.kind === 'contact') {
    const c = contactByPrefix(m.prefix);
    if (!c) { addMsg(S.convs.get('status'), { kind: 'msg', nick: '?' + m.prefix.slice(0, 6), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen }); return; }
    const cv = convForContact(c); cv.open = true; if (m.snr != null && (m.pathLen === 0xFF || (m.pathLen & 63) === 0)) c.lastSnr = m.snr; c.lastSeen = nowSecs();
    if (m.txtType === TXT.CLI) { // CLI reply from repeater/sensor
      const pending = cv.msgs.slice(-20).reverse().find(x => x.kind === 'cli' && x.ack === 'pending');
      if (pending) { pending.text = (pending.text ? pending.text + '\n' : '') + m.text; pending.ack = null; pending.snr = m.snr; pending.pathLen = m.pathLen; clearTimeout(pending._timer); updateMsgDom(pending); if (cv.key !== S.active) { cv.unread++; renderTree(); } saveState(); }
      else addMsg(cv, { kind: 'cli', nick: displayName(c), cmd: '', text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen });
      return;
    }
    if (m.txtType === TXT.SIGNED && c.type === 3) { // room post: 4-byte author prefix
      const author = contactByPrefix(m.sig); const mine = isSelfPub(m.sig);
      if (mine) { const echo = cv.msgs.slice(-30).reverse().find(x => x.self && x.text === m.text && nowSecs() - x.t < 900 && !x.echoed); if (echo) { echo.ack = 'ok'; echo.echoed = true; clearTimeout(echo._timer); updateMsgDom(echo); saveState(); return; } }
      const nick = mine ? myNick() : author ? cname(author) : '?' + m.sig; c.loggedIn = true;
      const msg = { kind: 'msg', nick, text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, self: mine, pub: author?.pub, hl: !mine && mentionsMe(m.text), sig: m.sig }; correlateRx(msg); addMsg(cv, msg); renderTree(); return;
    }
    const msg = { kind: 'msg', nick: displayName(c), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, pub: c.pub, hl: mentionsMe(m.text), txtType: m.txtType }; correlateRx(msg); addMsg(cv, msg);
    if (!S.convs.get(cv.key) || cv.kind === 'dm') renderTree();
    return;
  }
  debugLog('onbekend berichttype ' + JSON.stringify(m));
}
function saneTs(ts) { const n = nowSecs(); return (ts > n + 3600 || ts < n - 30 * 86400) ? n : ts; }
function mentionsMe(text) { const n = myNick(); if (!n) return false; return new RegExp('(^|[^\\w])@?' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w])', 'i').test(text); }

// ---------- outgoing ----------
function requireConn(cv) { if (!C.connected) { errorMsg('Niet verbonden met een node.', cv); return false; } return true; }
async function sendToConv(cv, text, asAction = false) {
  if (!requireConn(cv)) return;
  text = text.trim(); if (!text) return;
  if (cv.kind === 'channel') {
    const ch = channelByConv(cv); if (!ch) { errorMsg('Kanaal staat niet (meer) op de node.', cv); return; }
    const body = asAction ? '* ' + text : text;
    const m = addMsg(cv, { kind: asAction ? 'action' : 'msg', nick: myNick(), text, self: true, scope: S.sendScope.mode === 'unscoped' ? 'zonder scope' : S.sendScope.mode === 'custom' ? (S.sendScope.name || 'scope') : null });
    try { const r = await C.sendChannelText(ch.idx, body); m.t = r.ts; m.flood = true; updateMsgDom(m); } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg('Verzenden mislukt: ' + e.message, cv); }
    return;
  }
  const c = S.contacts.get(cv.pub); if (!c) { errorMsg('Contact niet gevonden.', cv); return; }
  if (cv.kind === 'repeater' || cv.kind === 'sensor') return sendCli(cv, c, text);
  if (cv.kind === 'room' && !c.loggedIn) { notice('Je bent niet ingelogd op deze room. Gebruik /login <wachtwoord>.', cv, false); openLoginDlg(c); return; }
  const m = addMsg(cv, { kind: asAction ? 'action' : 'msg', nick: myNick(), text, self: true, ack: 'pending' });
  try {
    const r = await C.sendText(c.pub, asAction ? '* ' + text : text, TXT.PLAIN, 0); m.t = r.ts; m.ackCode = r.ack; m.flood = r.flood; updateMsgDom(m);
    m._timer = setTimeout(() => { if (m.ack === 'pending') { m.ack = 'fail'; updateMsgDom(m); saveState(); } }, Math.max(5000, r.timeoutMs) + 2000);
  } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg('Verzenden mislukt: ' + e.message, cv); }
}
async function sendCli(cv, c, cmdText) {
  if (!requireConn(cv)) return;
  if (!c.loggedIn && !/^(ver|clock|board)$/.test(cmdText)) notice('Niet ingelogd: het antwoord kan uitblijven. Gebruik /login <wachtwoord>.', cv, false);
  const m = addMsg(cv, { kind: 'cli', nick: displayName(c), cmd: cmdText, text: '', self: false, ack: 'pending' });
  try { const r = await C.sendText(c.pub, cmdText, TXT.CLI, 0); m.flood = r.flood; m.pathLen = null; m._timer = setTimeout(() => { if (m.ack === 'pending') { m.ack = 'fail'; m.text = m.text || '(geen antwoord)'; updateMsgDom(m); } }, Math.max(8000, r.timeoutMs) + 4000); }
  catch (e) { m.ack = 'fail'; m.text = 'fout: ' + e.message; updateMsgDom(m); }
}
async function doLogin(c, pw, silent) {
  const cv = convForContact(c); if (!requireConn(cv)) return;
  try { c._loginPending = true; const r = await C.login(c.pub, pw); if (!silent) notice(`Login verstuurd naar ${displayName(c)} (${r.flood ? 'flood' : 'direct'})…`, cv, false); setTimeout(() => { if (c._loginPending && !c.loggedIn) { c._loginPending = false; notice(`Geen antwoord op login van ${displayName(c)}.`, cv, false); } }, Math.max(8000, r.timeoutMs) + 3000); }
  catch (e) { c._loginPending = false; errorMsg('Login mislukt: ' + e.message, cv); }
}
async function applySendScope(announce = true) {
  if (!C.connected) return;
  const s = S.sendScope;
  try {
    if (s.mode === 'unscoped') await C.setSendScope(null);
    else if (s.mode === 'custom' && s.key) await C.setSendScope(s.key);
    else if (S.defaultScope) await C.setSendScope(S.defaultScope.key); else await C.setSendScope(null);
    if (announce) notice('Verzendscope: ' + sendScopeText(), S.convs.get('status'), false);
  } catch (e) { if (e.errCode === 1) { if (s.mode !== 'default') notice('Deze firmware ondersteunt geen flood-scopes (regio\'s).', S.convs.get('status'), false); } else debugLog('scope: ' + e.message); }
  const cv = activeConv(); if (cv.kind === 'status') renderInfo(cv);
}

// ---------- slash commands ----------
async function handleInput(raw) {
  const cv = activeConv(); const text = raw.replace(/\s+$/, ''); if (!text) return;
  if (!text.startsWith('/') || text.startsWith('//')) return sendToConv(cv, text.startsWith('//') ? text.slice(1) : text);
  const sp = text.indexOf(' '); const cmd = (sp < 0 ? text : text.slice(0, sp)).toLowerCase(); const arg = sp < 0 ? '' : text.slice(sp + 1).trim();
  const argv = arg ? arg.split(/\s+/) : [];
  const targetContact = (name) => { const c = name ? contactByName(name) : activeContact(); if (!c) errorMsg(name ? `Contact "${name}" niet gevonden.` : 'Geen contact geselecteerd. Geef een naam op.', cv); return c; };
  try {
    switch (cmd) {
      case '/help': notice('Commando\'s: ' + COMMANDS.map(c => c[0]).join(' '), cv, false); notice('Typ /about voor de handleiding. Typ / om de lijst met uitleg te zien. In een repeater-venster gaat gewone tekst als CLI-commando naar de repeater; in een room als post; in een kanaal of privévenster als bericht.', cv, false); break;
      case '/about': case '/version': $('#dlg-about').showModal(); break;
      case '/connect': connect(/bl|bt/i.test(arg) ? 'ble' : 'usb'); break;
      case '/disconnect': case '/quit': await C.disconnect(); break;
      case '/join': await joinChannel(argv[0], argv.slice(1).join(' ')); break;
      case '/part': case '/leave': await leaveChannel(arg ? S.channels.find(c => c && (c.name.toLowerCase() === arg.toLowerCase() || (arg.toLowerCase() === '#public' && c.secret === PUBLIC_KEY_HEX))) : channelByConv(cv)); break;
      case '/msg': { const c = targetContact(argv[0]); if (!c) break; const t = argv.slice(1).join(' '); const cv2 = convForContact(c); cv2.open = true; openConv(cv2.key); if (t) await sendToConv(cv2, t); break; }
      case '/query': { const c = targetContact(argv[0]); if (!c) break; const cv2 = convForContact(c); cv2.open = true; openConv(cv2.key); break; }
      case '/me': await sendToConv(cv, arg, true); break;
      case '/nick': if (!arg) { notice('Huidige naam: ' + myNick(), cv, false); break; } if (!requireConn(cv)) break; await C.setName(arg.slice(0, 31)); S.self.name = arg.slice(0, 31); renderNick(); notice('Naam gewijzigd in ' + S.self.name + '. Verstuur een advert zodat anderen het zien (/advert flood).', cv, true); break;
      case '/whois': { const c = targetContact(argv[0]); if (!c) break; const p = pathInfo(c); notice(`${displayName(c)} · ${ADV_TYPE[c.type]} · sleutel ${c.pub} · advert ${c.lastAdvert ? fmtDateTime(c.lastAdvert) : 'nooit'} · pad ${p.hashes.length ? p.hashes.map(hashLabel).join(', ') : p.text}${c.lat ? ` · locatie ${c.lat.toFixed(4)},${c.lon.toFixed(4)}` : ''}${c.lastSnr != null ? ' · SNR ' + c.lastSnr.toFixed(1) : ''}`, cv, false); break; }
      case '/names': notice(cv.kind === 'channel' ? 'Gezien: ' + Array.from(cv.users.keys()).join(', ') : 'Contacten: ' + Array.from(S.contacts.values()).filter(c => !c.hidden).map(displayName).join(', '), cv, false); break;
      case '/list': notice('Kanalen: ' + S.channels.filter(c => c && c.name).map(c => `${c.idx}:${channelLabel(c)}`).join(', '), cv, false); notice('Rooms: ' + Array.from(S.contacts.values()).filter(c => c.type === 3 && !c.hidden).map(displayName).join(', ') + ' · Repeaters: ' + Array.from(S.contacts.values()).filter(c => c.type === 2 && !c.hidden).map(displayName).join(', '), cv, false); break;
      case '/advert': case '/flood': if (!requireConn(cv)) break; { const flood = cmd === '/flood' || /flood/i.test(arg); await C.sendAdvert(flood); notice(`Advert verstuurd (${flood ? 'flood' : 'zero-hop'}).`, cv, true); toast('Advert verstuurd', 'ok'); } break;
      case '/login': { const c = activeContact(); if (!c || c.type < 2) { errorMsg('Open eerst een room of repeater.', cv); break; } if (!arg) { openLoginDlg(c); break; } S.roomPw[c.pub] = { pw: arg, auto: S.roomPw[c.pub]?.auto || false }; saveState(); await doLogin(c, arg); break; }
      case '/logout': { const c = activeContact(); if (!c) break; if (!requireConn(cv)) break; await C.logout(c.pub); c.loggedIn = false; if (S.roomPw[c.pub]) S.roomPw[c.pub].auto = false; notice('Uitgelogd van ' + displayName(c), cv, true); renderTree(); renderHead(cv); renderUsers(cv); renderCompose(cv); break; }
      case '/cli': { const c = activeContact(); if (!c) { errorMsg('Open eerst een repeater/room.', cv); break; } await sendCli(cv, c, arg); break; }
      case '/status': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.statusReq(c.pub); notice('Statusverzoek verstuurd naar ' + displayName(c) + '…', convForContact(c), false); break; }
      case '/telemetry': case '/telemetrie': { if (!requireConn(cv)) break; if (argv[0] === 'self' || (!argv[0] && !activeContact())) { await C.selfTelemetry(); break; } const c = targetContact(argv[0]); if (!c) break; await C.telemetryReq(c.pub); notice('Telemetrieverzoek verstuurd naar ' + displayName(c) + '…', convForContact(c), false); break; }
      case '/trace': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; const p = pathInfo(c); if (!p.hashes.length) { errorMsg('Geen bekend pad naar ' + displayName(c) + ' (flood). Probeer /path.', cv); break; } S.traceConv = convForContact(c); await C.tracePath(c.outPath.slice(0, c.outPathLen * 2)); notice('Trace verstuurd via ' + p.hashes.join(',') + '…', S.traceConv, false); break; }
      case '/path': case '/discover': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.pathDiscovery(c.pub); notice('Padzoekopdracht verstuurd naar ' + displayName(c) + '…', convForContact(c), false); break; }
      case '/resetpath': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.resetPath(c.pub); await refreshContact(c.pub); notice('Pad naar ' + displayName(c) + ' gewist (flood).', convForContact(c), true); break; }
      case '/scope': await setSendScopeCmd(argv); break;
      case '/region': case '/regio': await setRegionCmd(argv); break;
      case '/export': { if (!requireConn(cv)) break; const c = argv[0] ? contactByName(argv[0]) : null; const uri = await C.exportContact(c ? c.pub : null); notice((c ? displayName(c) : 'Eigen node') + ': ' + uri, cv, false); copyText(uri); break; }
      case '/import': if (!requireConn(cv)) break; await C.importContact(arg); await refreshContacts(); notice('Contact geïmporteerd.', cv, true); break;
      case '/share': { const c = targetContact(argv[0]); if (!c) break; if (!requireConn(cv)) break; await C.shareContact(c.pub); notice('Contact ' + displayName(c) + ' gedeeld op het mesh.', cv, true); break; }
      case '/del': case '/delete': { const c = targetContact(argv[0]); if (!c) break; await deleteContact(c); break; }
      case '/time': if (!requireConn(cv)) break; { const t = await C.getTime(); notice(`Tijd van de node: ${fmtDateTime(t)} (verschil ${t - nowSecs()} s)`, cv, false); } break;
      case '/settime': if (!requireConn(cv)) break; await C.setTime(); notice('Tijd gesynchroniseerd.', cv, false); break;
      case '/battery': case '/batt': if (!requireConn(cv)) break; S.batt = await C.getBattery(); renderBattery(); notice(`Batterij ${(S.batt.mv / 1000).toFixed(2)} V${S.batt.totalKb ? ` · opslag ${S.batt.usedKb}/${S.batt.totalKb} kB` : ''}`, cv, false); break;
      case '/stats': if (!requireConn(cv)) break; await showNodeStats(cv); break;
      case '/raw': if (!requireConn(cv)) break; { const f = await C.raw(unhex(arg)); notice('antwoord: ' + hex(f), cv, false); } break;
      case '/debug': S.settings.debug = !S.settings.debug; notice('Debug ' + (S.settings.debug ? 'aan' : 'uit'), cv, false); saveState(); break;
      case '/clear': cv.msgs = []; renderMessages(cv); saveState(true); break;
      case '/theme': setTheme(argv[0] || 'auto'); break;
      case '/close': closeConv(cv); break;
      default: errorMsg('Onbekend commando: ' + cmd + ' (typ /help)', cv);
    }
  } catch (e) { errorMsg((cmd + ': ' + (e.message || e)), cv); }
}
async function showNodeStats(cv) {
  try {
    const core = await C.getStats(0), radio = await C.getStats(1), pk = await C.getStats(2);
    const lines = [`batterij ${(rdU16(core, 2) / 1000).toFixed(2)} V · uptime ${fmtDur(rdU32(core, 4))} · fouten 0x${rdU16(core, 8).toString(16)} · wachtrij ${core[10]}`, `ruisvloer ${rdI16(radio, 2)} dBm · laatste RSSI ${rdI8(radio[4])} dBm · laatste SNR ${(rdI8(radio[5]) / 4).toFixed(1)} dB · airtime tx ${fmtDur(rdU32(radio, 6))} rx ${fmtDur(rdU32(radio, 10))}`, `pakketten: ontvangen ${rdU32(pk, 2)} · verzonden ${rdU32(pk, 6)} · flood tx/rx ${rdU32(pk, 10)}/${rdU32(pk, 18)} · direct tx/rx ${rdU32(pk, 14)}/${rdU32(pk, 22)} · rx-fouten ${rdU32(pk, 26)}`];
    addMsg(cv, { kind: 'cli', nick: myNick(), cmd: 'stats', text: lines.join('\n') });
  } catch (e) { errorMsg('Statistieken niet beschikbaar (oudere firmware?): ' + e.message, cv); }
}
async function setSendScopeCmd(argv) {
  const a = (argv[0] || '').toLowerCase(); const st = S.convs.get('status');
  if (!a) { notice('Verzendscope: ' + sendScopeText() + (S.defaultScope ? ` · standaardregio van de node: ${S.defaultScope.name} (${S.defaultScope.key})` : ' · geen standaardregio op de node'), activeConv(), false); return; }
  if (a === 'off' || a === 'none' || a === 'uit') S.sendScope = { mode: 'unscoped', name: '', key: '' };
  else if (a === 'default' || a === 'standaard') S.sendScope = { mode: 'default', name: '', key: '' };
  else if (/^[0-9a-f]{32}$/i.test(a)) S.sendScope = { mode: 'custom', name: argv[1] || '', key: a.toLowerCase() };
  else S.sendScope = { mode: 'custom', name: argv[0], key: await scopeKeyFromName(argv[0]) };
  saveState(); await applySendScope(true); notice('Verzendscope ingesteld: ' + sendScopeText(), activeConv(), false);
}
async function setRegionCmd(argv) {
  if (!requireConn(activeConv())) return;
  if (!argv[0] || argv[0] === 'off') { await C.setDefaultScope('', ''); S.defaultScope = null; notice('Standaardregio van de node gewist.', activeConv(), true); }
  else { const key = argv[1] && /^[0-9a-f]{32}$/i.test(argv[1]) ? argv[1].toLowerCase() : await scopeKeyFromName(argv[0]); await C.setDefaultScope(argv[0].replace(/^#/, ''), key); S.defaultScope = { name: argv[0].replace(/^#/, ''), key }; notice(`Standaardregio ingesteld: ${S.defaultScope.name} (${key}).`, activeConv(), true); }
  await applySendScope(false); saveState();
}
function copyText(t) { try { navigator.clipboard.writeText(t); toast('Gekopieerd naar klembord', 'ok', 2000); } catch (e) { toast('Kopiëren mislukt', 'err'); } }

// ---------- channels ----------
function freeChannelSlot() { const max = S.dev?.maxChannels || 8; for (let i = 0; i < max; i++) { const c = S.channels[i]; if (!c || !c.name) return i; } return -1; }
async function joinChannel(name, secretArg, forcedKind) {
  const cv = activeConv(); if (!requireConn(cv)) return;
  if (!name) { $('#dlg-channel').showModal(); return; }
  let key, label = name.trim();
  if (label.toLowerCase() === '#public' || label.toLowerCase() === 'public') { key = PUBLIC_KEY_HEX; label = 'Public'; }
  else if (forcedKind === 'key' || (secretArg && parseKeyInput(secretArg))) { key = parseKeyInput(secretArg); if (!key) { errorMsg('Ongeldige sleutel: 32 hex-tekens of 24 base64-tekens verwacht.', cv); return; } }
  else if (forcedKind === 'password' || (secretArg && !label.startsWith('#'))) { key = await passwordKey(secretArg); }
  else if (label.startsWith('#')) { label = label.toLowerCase(); key = await hashtagKey(label); }
  else { errorMsg('Geef een #hashtag, of een naam met sleutel/wachtwoord: /join naam <sleutel|wachtwoord>', cv); return; }
  const existing = S.channels.find(c => c && c.secret === key && c.name);
  if (existing) { openConv(convKeyForChannel(existing)); notice('Kanaal al aanwezig.', S.convs.get(convKeyForChannel(existing)), false); return; }
  const slot = freeChannelSlot(); if (slot < 0) { errorMsg(`Alle ${S.channels.length} kanaalslots op de node zijn bezet. Verlaat eerst een kanaal.`, cv); return; }
  await C.setChannel(slot, label.slice(0, 31), key);
  S.channels[slot] = { idx: slot, name: label.slice(0, 31), secret: key };
  const ncv = convForChannel(S.channels[slot]); ncv.name = channelLabel(S.channels[slot]); openConv(ncv.key);
  notice(`Kanaal ${label} toegevoegd in slot ${slot} · sleutel ${key}`, ncv, true); saveState();
}
async function leaveChannel(ch) {
  const cv = activeConv(); if (!ch) { errorMsg('Kanaal niet gevonden.', cv); return; } if (!requireConn(cv)) return;
  if (!await confirmDlg('Kanaal verlaten', `"${channelLabel(ch)}" wordt van de node verwijderd (slot ${ch.idx}). De lokale geschiedenis blijft bewaard. Sleutel: ${ch.secret}`, 'Verlaten', true)) return;
  await C.setChannel(ch.idx, '', '00000000000000000000000000000000');
  S.channels[ch.idx] = { idx: ch.idx, name: '', secret: '00000000000000000000000000000000' };
  const key = convKeyForChannel(ch); if (S.active === key) openConv('status'); renderTree(); notice(`Kanaal ${channelLabel(ch)} verwijderd.`, S.convs.get('status'), false); saveState();
}
function closeConv(cv) { if (cv.kind === 'dm') { cv.open = false; openConv('status'); } else if (cv.kind === 'channel') leaveChannel(channelByConv(cv)); else openConv('status'); }
async function deleteContact(c) {
  if (!await confirmDlg('Contact verwijderen', `${displayName(c)} (${ADV_TYPE[c.type]}) van de node verwijderen? De lokale geschiedenis blijft bewaard.`, 'Verwijderen', true)) return;
  if (C.connected) { try { await C.removeContact(c.pub); } catch (e) { errorMsg('Verwijderen mislukt: ' + e.message); return; } }
  c.hidden = true; const key = convKeyFor(c); if (S.active === key) openConv('status'); renderTree(); saveState(); toast(displayName(c) + ' verwijderd', 'ok'); if ($('#dlg-contacts').open) renderContactsDlg();
}
