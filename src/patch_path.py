# Padlengte-decodering (hash-grootte in bovenste 2 bits), handmatige padkeuze, automatisch opnieuw verzenden.
from pathlib import Path
def sub(path, old, new, count=1):
    p = Path(path); t = p.read_text(encoding="utf-8")
    assert old in t, f"anker niet gevonden in {path}: {old[:80]!r}"
    p.write_text(t.replace(old, new, count), encoding="utf-8")

# ---------- core.js: pad-decodering ----------
sub("core.js", """      case PUSH.PATH_DISCOVERY_RESPONSE: {
        const prefix = hex(f.subarray(2, 8)); const ol = f[8]; const out = hex(f.subarray(9, 9 + ol)); const il = f[9 + ol]; const inp = hex(f.subarray(10 + ol, 10 + ol + il));
        this.emit('pathDiscovery', { prefix, outLen: ol, outPath: out, inLen: il, inPath: inp }); break;
      }""", """      case PUSH.PATH_DISCOVERY_RESPONSE: {
        // padlengte-byte: bovenste 2 bits = hash-grootte-1, onderste 6 bits = aantal hops
        const prefix = hex(f.subarray(2, 8)); const o = decodePathLen(f[8]); const ob = o.count * o.size; const out = hex(f.subarray(9, 9 + ob));
        const i = decodePathLen(f[9 + ob]); const ib = i.count * i.size; const inp = hex(f.subarray(10 + ob, 10 + ob + ib));
        this.emit('pathDiscovery', { prefix, outLen: o.count, outSize: o.size, outPath: out, inLen: i.count, inSize: i.size, inPath: inp }); break;
      }""")
sub("core.js", "// ---------- parsers ----------", """// ---------- parsers ----------
// Padlengte-byte zoals in Packet.path_len (v1.11+): count = laagste 6 bits, hash-grootte = (byte>>6)+1 bytes.
function decodePathLen(b) { return { count: b & 63, size: (b >> 6) + 1 }; }
function encodePathLen(count, size) { return ((size - 1) << 6) | (count & 63); }
function splitPath(hexStr, size) { const r = []; for (let i = 0; i + size * 2 <= hexStr.length; i += size * 2) r.push(hexStr.slice(i, i + size * 2)); return r; }""")
sub("core.js", "  async tracePath(pathHex) { const tag = (Math.random() * 0xFFFFFFFF) >>> 0, auth = (Math.random() * 0xFFFFFFFF) >>> 0; const f = await this.cmd(cat([CMD.SEND_TRACE_PATH, ...u32le(tag), ...u32le(auth), 0], unhex(pathHex)));",
    "  async tracePath(pathHex, hashSize = 1) { const tag = (Math.random() * 0xFFFFFFFF) >>> 0, auth = (Math.random() * 0xFFFFFFFF) >>> 0; const f = await this.cmd(cat([CMD.SEND_TRACE_PATH, ...u32le(tag), ...u32le(auth), (hashSize - 1) & 3], unhex(pathHex)));")

# ---------- app1.js: pathInfo met grootte uit het lengtebyte ----------
p = Path("app1.js"); t = p.read_text(encoding="utf-8")
i0 = t.index("function pathInfo(c, hashMode) {"); i1 = t.index("\n}\n", i0) + 3
t = t[:i0] + """function pathInfo(c, hashMode) {
  // out_path_len: -1 = onbekend (flood). Anders: bovenste 2 bits = hash-grootte-1, onderste 6 bits = aantal hops.
  // Oudere firmware zonder hash-modus schrijft gewoon het aantal bytes (= hops bij 1-byte hashes); dat valt samen.
  if (c.outPathLen < 0) return { text: t('path.flood'), hops: null, hashes: [], size: 1 };
  const v = c.outPathLen & 255; let size = (v >> 6) + 1, count = v & 63;
  if (size === 1 && (hashMode ?? S.dev?.pathHashMode)) { const sz = 1 << (hashMode ?? S.dev?.pathHashMode); if (count % sz === 0) { size = sz; count = count / sz; } }
  const hashes = splitPath((c.outPath || '').slice(0, count * size * 2), size);
  return { text: hashes.length ? t('path.hops', hashes.length, hashes.join(',')) : t('path.direct'), hops: hashes.length, hashes, size };
}
""" + t[i1:]
p.write_text(t, encoding="utf-8")

# ---------- app3.js: pathDiscovery-handler, /trace met grootte, handmatig pad, retries ----------
sub("app3.js", "  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status'); const sz = 1 << (S.dev?.pathHashMode || 0);\n  const split = (h) => { const r = []; for (let i = 0; i < h.length; i += sz * 2) r.push(h.slice(i, i + sz * 2)); return r; };",
    "  const c = contactByPrefix(e.detail.prefix); const cv = c ? convForContact(c) : S.convs.get('status');\n  const split = (h, sz) => splitPath(h, sz || 1);")
p = Path("app3.js"); t = p.read_text(encoding="utf-8")
assert "split(e.detail.outPath).map(hashLabel)" in t and "split(e.detail.inPath).map(hashLabel)" in t
t = t.replace("split(e.detail.outPath).map(hashLabel)", "split(e.detail.outPath, e.detail.outSize).map(hashLabel)").replace("split(e.detail.inPath).map(hashLabel)", "split(e.detail.inPath, e.detail.inSize).map(hashLabel)")
p.write_text(t, encoding="utf-8")
sub("app3.js", "S.traceConv = convForContact(c); await C.tracePath(c.outPath.slice(0, c.outPathLen * 2));",
    "S.traceConv = convForContact(c); await C.tracePath(p.hashes.join(''), p.size);")
# handmatig pad schrijven
sub("app3.js", "async function resyncRoom(c) {", """// Handmatig pad naar een contact op de node zetten: hashes = eerste `size` bytes van elke repeater-sleutel, in volgorde.
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
    if (attempt > max) { m.ack = 'fail'; if (m.kind === 'cli' && !m.text) m.text = t('cli.noReply'); updateMsgDom(m); saveState(); return; }
    m.attempt = attempt; updateMsgDom(m);
    try {
      if (attempt >= 2 && c.outPathLen >= 0) { try { await C.resetPath(c.pub); c.outPathLen = -1; c.outPath = ''; notice(t('retry.pathReset', displayName(c)), cv, false); } catch (e) { debugLog('resetPath: ' + e.message); } }
      const r2 = await C.sendText(c.pub, text, txtType, attempt); m.ackCode = r2.ack; m.flood = r2.flood; updateMsgDom(m); scheduleRetry(cv, c, m, text, txtType, r2);
    } catch (e) { m.ack = 'fail'; updateMsgDom(m); errorMsg(t('send.failed', e.message), cv); }
  }, Math.max(m.kind === 'cli' ? 8000 : 5000, r.timeoutMs) + 2000);
}
async function resyncRoom(c) {""")
sub("app3.js", "    const r = await C.sendText(c.pub, asAction ? '* ' + text : text, TXT.PLAIN, 0); m.t = r.ts; m.ackCode = r.ack; m.flood = r.flood; updateMsgDom(m);\n    m._timer = setTimeout(() => { if (m.ack === 'pending') { m.ack = 'fail'; updateMsgDom(m); saveState(); } }, Math.max(5000, r.timeoutMs) + 2000);",
    "    const body = asAction ? '* ' + text : text; const r = await C.sendText(c.pub, body, TXT.PLAIN, 0); m.t = r.ts; m.ackCode = r.ack; m.flood = r.flood; m.attempt = 0; updateMsgDom(m);\n    scheduleRetry(cv, c, m, body, TXT.PLAIN, r);")
sub("app3.js", "  try { await ensureDeviceScope(S.sendScope); const r = await C.sendText(c.pub, cmdText, TXT.CLI, 0); m.flood = r.flood; m.pathLen = null; m._timer = setTimeout(() => { if (m.ack === 'pending') { m.ack = 'fail'; m.text = m.text || t('cli.noReply'); updateMsgDom(m); } }, Math.max(8000, r.timeoutMs) + 4000); }",
    "  try { await ensureDeviceScope(S.sendScope); const r = await C.sendText(c.pub, cmdText, TXT.CLI, 0); m.flood = r.flood; m.pathLen = null; m.attempt = 0; scheduleRetry(cv, c, m, cmdText, TXT.CLI, r); }")
sub("app3.js", "      case '/resync':", "      case '/path' + 'set': case '/setpath': { const c = targetContact(argv[0]); if (!c) break; openPathDlg(c); break; }\n      case '/resync':")

# ---------- app2.js: meta toont poging ----------
sub("app2.js", "  if (m.trip) parts.push(m.trip + ' ms');", "  if (m.self && m.attempt) parts.push(t('retry.attempt', m.attempt, S.settings.retries ?? 3));\n  if (m.trip) parts.push(m.trip + ' ms');")
# infopaneel: knop pad instellen
sub("app2.js", "<button class=\"btn sm ghost\" data-act=\"path-reset\">", "<button class=\"btn sm ghost\" data-act=\"path-set\">${esc(t('path.setBtn'))}</button><button class=\"btn sm ghost\" data-act=\"path-reset\">")
sub("app2.js", "['/resync', '', ", "['/setpath', '[naam]', 'cmd.setpath'], ['/resync', '', ") if "['/resync', '', " in Path("app2.js").read_text(encoding="utf-8") else None

# ---------- app4.js: paddialoog, retries-instelling, contextmenu ----------
sub("app4.js", "function openMapSettings() {", """// ---------- handmatig pad ----------
function openPathDlg(c) {
  S.pathTarget = c; const p = pathInfo(c); S.pathList = p.hashes.map(h => { const m = resolveHash(h); return { hash: h, pub: m.length ? m[0].pub : null, name: m.length ? cname(m[0]) : null }; });
  S.pathSize = p.size || (1 << (S.dev?.pathHashMode || 0));
  $('#pd-title').textContent = t('path.dlgTitle', displayName(c)); $('#pd-size').value = S.pathSize;
  const rpts = Array.from(S.contacts.values()).filter(x => !x.hidden && x.pub !== c.pub).sort((a, b) => (a.type === 2 ? 0 : 1) - (b.type === 2 ? 0 : 1) || cname(a).localeCompare(cname(b)));
  $('#pd-add').innerHTML = rpts.map(x => `<option value="${x.pub}">${esc(cname(x))} (${esc(advType(x.type))})</option>`).join('');
  renderPathDlg(); $('#dlg-path').showModal();
}
function renderPathDlg() {
  const sz = S.pathSize; const list = S.pathList;
  $('#pd-chips').innerHTML = list.length ? list.map((h, i) => `<span class="chip pd-chip" data-i="${i}"><span class="mono">${i + 1}. ${esc((h.pub ? h.pub.slice(0, sz * 2) : h.hash))}</span> ${esc(h.name || '?')} <button class="x" data-act="up" title="↑" ${i === 0 ? 'disabled' : ''}>↑</button><button class="x" data-act="del" aria-label="×">×</button></span>`).join('') : `<span class="dim">${esc(t('path.flood'))}</span>`;
  $('#pd-info').textContent = t('path.dlgInfo', list.length, list.length * sz, 64);
}
async function savePathDlg() {
  const c = S.pathTarget; if (!c) return; const pubs = S.pathList.map(h => h.pub || null); if (pubs.some(p => !p)) { toast(t('path.unknownHop'), 'err'); return; }
  const ok = await setManualPath(c, pubs, S.pathSize); if (ok) { $('#dlg-path').close(); const cv = activeConv(); if (cv.pub === c.pub) { renderHead(cv); renderUsers(cv); } }
}
function openMapSettings() {""")
sub("app4.js", "  on('#btn-sync', 'click', () => handleInput('/sync'));", """  on('#btn-sync', 'click', () => handleInput('/sync'));
  // handmatig pad
  on('#pd-add-btn', 'click', () => { const pub = val('#pd-add'); const c = S.contacts.get(pub); if (!c) return; if (S.pathList.length * S.pathSize >= 64) { toast(t('path.tooLong'), 'err'); return; } S.pathList.push({ hash: c.pub.slice(0, S.pathSize * 2), pub: c.pub, name: cname(c) }); renderPathDlg(); });
  on('#pd-chips', 'click', (e) => { const b = e.target.closest('[data-act]'); const ch = e.target.closest('.pd-chip'); if (!b || !ch) return; const i = +ch.dataset.i; if (b.dataset.act === 'del') S.pathList.splice(i, 1); else if (b.dataset.act === 'up' && i > 0) { const x = S.pathList.splice(i, 1)[0]; S.pathList.splice(i - 1, 0, x); } renderPathDlg(); });
  on('#pd-size', 'change', () => { S.pathSize = +val('#pd-size'); renderPathDlg(); });
  on('#pd-flood', 'click', () => { S.pathList = []; renderPathDlg(); });
  on('#pd-save', 'click', () => savePathDlg().catch(e => toast(e.message, 'err')));
  on('#s-retries', 'change', (e) => { S.settings.retries = Math.max(0, Math.min(9, parseInt(e.target.value) || 0)); saveState(); });""")
sub("app4.js", "    if (act === 'map' && c) mapFocus(c.pub);", "    if (act === 'path-set' && c) openPathDlg(c); else if (act === 'map' && c) mapFocus(c.pub);")
sub("app4.js", "c && c.type === 3 ? { label: t('info.resync'), run: () => resyncRoom(c) } : null, '-',", "c && c.type === 3 ? { label: t('info.resync'), run: () => resyncRoom(c) } : null, c ? { label: t('path.setBtn') + '…', run: () => openPathDlg(c) } : null, '-',")
sub("app4.js", "  $('#s-theme').value = S.settings.theme;", "  $('#s-retries').value = S.settings.retries ?? 3;\n  $('#s-theme').value = S.settings.theme;")
# contact-dialoog: knop pad instellen
sub("app4.js", "  on('#ce-discover', 'click',", "  on('#ce-path-set', 'click', () => { const c = S.editContact; $('#dlg-contact').close(); openPathDlg(c); });\n  on('#ce-discover', 'click',")

# ---------- body.html ----------
sub("body.html", '<button class="btn sm ghost" id="ce-resetpath" type="button" data-needs-conn data-i18n="h.pathReset">Pad reset</button>',
    '<button class="btn sm ghost" id="ce-resetpath" type="button" data-needs-conn data-i18n="h.pathReset">Pad reset</button>\n      <button class="btn sm" id="ce-path-set" type="button" data-needs-conn data-i18n="h.pathSet">Pad instellen…</button>')
sub("body.html", '<label class="check"><input type="checkbox" id="s-multiacks" data-needs-conn>',
    '<div class="field" style="max-width:320px"><label for="s-retries" data-i18n="h.retries">Automatisch opnieuw verzenden (pogingen, 0 = uit)</label><input id="s-retries" class="mono" type="number" min="0" max="9"><span class="help" data-i18n="h.retriesHelp">Bij geen bevestiging opnieuw proberen; vanaf de tweede poging wordt het pad gewist en gaat het bericht als flood.</span></div>\n      <label class="check"><input type="checkbox" id="s-multiacks" data-needs-conn>')
sub("body.html", "<!-- Berichtinfo -->", """<!-- Handmatig pad -->
<dialog class="dlg" id="dlg-path" aria-labelledby="pd-title">
  <div class="dlg-head"><h2 id="pd-title">Pad</h2><button class="btn icon ghost" data-close aria-label="Sluiten" data-i18n-aria="h.close"><svg class="i"><use href="#i-x"/></svg></button></div>
  <div class="dlg-body">
    <p class="help" style="margin:0 0 8px;font-size:12px;color:var(--fg-dim)" data-i18n="h.pathHelp">Kies in volgorde de repeaters waarlangs berichten naar dit contact moeten gaan (van jou naar het contact). Een leeg pad betekent flood.</p>
    <div id="pd-chips" class="row" style="flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:8px"></div>
    <div class="row" style="flex-wrap:wrap;gap:6px"><select id="pd-add" class="grow" aria-label="Repeater"></select><button class="btn" id="pd-add-btn" type="button" data-i18n="h.add">Toevoegen</button><button class="btn ghost" id="pd-flood" type="button" data-i18n="h.pathFlood">Leegmaken (flood)</button></div>
    <div class="row" style="margin-top:10px;gap:8px"><label for="pd-size" class="dim" style="font-size:12px" data-i18n="h.pathHashSize">Hash-grootte</label><select id="pd-size"><option value="1">1 byte</option><option value="2">2 bytes</option><option value="3">3 bytes</option></select><span id="pd-info" class="dim" style="font-size:11.5px"></span></div>
  </div>
  <div class="dlg-foot"><button class="btn" data-close data-i18n="h.cancel">Annuleren</button><button class="btn primary" id="pd-save" data-i18n="h.save">Opslaan</button></div>
</dialog>

<!-- Berichtinfo -->""")

# ---------- i18n ----------
NL = """  // ---- pad / retries ----
  'path.flood': 'flood', 'path.direct': 'direct (0 hops)', 'path.hops': '{0} hop(s) via {1}', 'path.tooLong': 'Pad te lang (max. 64 bytes).', 'path.set': 'Pad naar {0} ingesteld: {1}', 'path.cleared': 'Pad naar {0} gewist (flood).', 'path.setBtn': 'Pad instellen', 'path.dlgTitle': 'Pad naar {0}', 'path.dlgInfo': '{0} hop(s) · {1} van {2} bytes', 'path.unknownHop': 'Een hop in het pad is geen bekend contact; verwijder die eerst.', 'cmd.setpath': 'Pad naar contact handmatig instellen',
  'h.pathSet': 'Pad instellen…', 'h.pathHelp': 'Kies in volgorde de repeaters waarlangs berichten naar dit contact moeten gaan (van jou naar het contact). Een leeg pad betekent flood.', 'h.add': 'Toevoegen', 'h.pathFlood': 'Leegmaken (flood)', 'h.pathHashSize': 'Hash-grootte', 'h.cancel': 'Annuleren', 'h.save': 'Opslaan',
  'h.retries': 'Automatisch opnieuw verzenden (pogingen, 0 = uit)', 'h.retriesHelp': 'Bij geen bevestiging opnieuw proberen; vanaf de tweede poging wordt het pad gewist en gaat het bericht als flood.', 'retry.attempt': 'poging {0}/{1}', 'retry.pathReset': 'Pad naar {0} gewist; volgende poging als flood.',
"""
EN = """  // ---- path / retries ----
  'path.flood': 'flood', 'path.direct': 'direct (0 hops)', 'path.hops': '{0} hop(s) via {1}', 'path.tooLong': 'Path too long (max. 64 bytes).', 'path.set': 'Path to {0} set: {1}', 'path.cleared': 'Path to {0} cleared (flood).', 'path.setBtn': 'Set path', 'path.dlgTitle': 'Path to {0}', 'path.dlgInfo': '{0} hop(s) · {1} of {2} bytes', 'path.unknownHop': 'A hop in the path is not a known contact; remove it first.', 'cmd.setpath': 'Set the path to a contact manually',
  'h.pathSet': 'Set path…', 'h.pathHelp': 'Choose, in order, the repeaters that messages to this contact should travel through (from you to the contact). An empty path means flood.', 'h.add': 'Add', 'h.pathFlood': 'Clear (flood)', 'h.pathHashSize': 'Hash size', 'h.cancel': 'Cancel', 'h.save': 'Save',
  'h.retries': 'Automatic resend (attempts, 0 = off)', 'h.retriesHelp': 'Retry when no acknowledgement arrives; from the second attempt the path is cleared and the message goes as flood.', 'retry.attempt': 'attempt {0}/{1}', 'retry.pathReset': 'Path to {0} cleared; next attempt as flood.',
"""
FR = """  // ---- chemin / renvois ----
  'path.flood': 'flood', 'path.direct': 'direct (0 saut)', 'path.hops': '{0} saut(s) via {1}', 'path.tooLong': 'Chemin trop long (max. 64 octets).', 'path.set': 'Chemin vers {0} défini : {1}', 'path.cleared': 'Chemin vers {0} effacé (flood).', 'path.setBtn': 'Définir le chemin', 'path.dlgTitle': 'Chemin vers {0}', 'path.dlgInfo': '{0} saut(s) · {1} sur {2} octets', 'path.unknownHop': 'Un saut du chemin n\\'est pas un contact connu ; retirez-le d\\'abord.', 'cmd.setpath': 'Définir manuellement le chemin vers un contact',
  'h.pathSet': 'Définir le chemin…', 'h.pathHelp': 'Choisissez, dans l\\'ordre, les répéteurs par lesquels les messages vers ce contact doivent passer (de vous vers le contact). Un chemin vide signifie flood.', 'h.add': 'Ajouter', 'h.pathFlood': 'Vider (flood)', 'h.pathHashSize': 'Taille du hash', 'h.cancel': 'Annuler', 'h.save': 'Enregistrer',
  'h.retries': 'Renvoi automatique (tentatives, 0 = désactivé)', 'h.retriesHelp': 'Réessaie sans accusé de réception ; à partir de la deuxième tentative le chemin est effacé et le message part en flood.', 'retry.attempt': 'tentative {0}/{1}', 'retry.pathReset': 'Chemin vers {0} effacé ; prochaine tentative en flood.',
"""
sub("i18n.js", "I18N.nl = {\n", "I18N.nl = {\n" + NL)
sub("i18n.js", "I18N.en = {\n", "I18N.en = {\n" + EN)
sub("i18n.js", "I18N.fr = {\n", "I18N.fr = {\n" + FR)
print("patched")
