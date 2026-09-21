from pathlib import Path
def sub(path, old, new, count=1):
    p = Path(path); t = p.read_text(encoding="utf-8")
    assert old in t, f"anker niet gevonden in {path}: {old[:80]!r}"
    p.write_text(t.replace(old, new, count), encoding="utf-8")

# ---- core: transportcode = eerste 2 bytes (LE) van HMAC-SHA256(regiosleutel, payloadtype || payload) ----
sub("core.js", "// ---------- channel key derivation ----------", """// ---------- flood-scope: transportcode van een pakket voor een gegeven regiosleutel ----------
// firmware (TransportKey::calcTransportCode): HMAC-SHA256 met de 16-byte sleutel over payloadtype(1) + payload, eerste 2 bytes.
const _hmacKeys = new Map();
async function transportCodeFor(keyHex, ptype, payloadHex) {
  if (!globalThis.crypto || !crypto.subtle) return null;
  let k = _hmacKeys.get(keyHex); if (!k) { k = await crypto.subtle.importKey('raw', unhex(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); _hmacKeys.set(keyHex, k); }
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, cat([ptype & 15], unhex(payloadHex))));
  return mac[0] | (mac[1] << 8);
}
// ---------- channel key derivation ----------""")

# ---- app1: scopeLabelFor toont regionaam als die bekend is; anders hex ----
sub("app1.js", "function scopeLabelFor(m) {\n  if (m.rx) { if (m.rx.route === 0 || m.rx.route === 3) return 'scope ' + m.rx.codes.map(c => c.toString(16).padStart(4, '0')).join('/');",
    """// Bekende regio's (lijst in Instellingen + standaardregio van de node) → naam bij de transportcodes van een pakket
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
      return 'scope ' + m.rx.codes.filter(c => c).map(c => c.toString(16).padStart(4, '0')).join('/');
    }""")
# berichtinfo: naam bij de codes
sub("app4.js", "    if (p.codes) add(t('mi.scopeCodes'), p.codes.map(c => c.toString(16).padStart(4, '0')).join(' / ') + (S.defaultScope ? t('mi.nodeRegion', esc(S.defaultScope.name)) : ''));",
    "    if (p.codes) add(t('mi.scopeCodes'), (p.scopeNames && p.scopeNames.length ? `<b>${esc(p.scopeNames.join(', '))}</b> · ` : '') + p.codes.map(c => c.toString(16).padStart(4, '0')).join(' / ') + (S.defaultScope ? t('mi.nodeRegion', esc(S.defaultScope.name)) : ''));")

# ---- buren-knop in het infopaneel van repeaters: stuurt 'neighbors' en toont ze daarna op de kaart ----
sub("app2.js", "    ${c.type >= 2 ? `<button class=\"btn sm\" data-act=\"status\">", "    ${c.type === 2 ? `<button class=\"btn sm\" data-act=\"neighbors\">${esc(t('nb.discover'))}</button>` : ''}\n    ${c.type >= 2 ? `<button class=\"btn sm\" data-act=\"status\">")
sub("app4.js", "    if (act === 'path-set' && c) openPathDlg(c);", "    if (act === 'neighbors' && c) { S.autoNbFor = c.pub; sendCli(cv, c, 'neighbors'); }\n    else if (act === 'path-set' && c) openPathDlg(c);")
sub("app3.js", "      if (pending) { pending.text = (pending.text ? pending.text + '\\n' : '') + m.text; pending.ack = null; pending.snr = m.snr; pending.pathLen = m.pathLen; clearTimeout(pending._timer); updateMsgDom(pending); if (cv.key !== S.active) { cv.unread++; renderTree(); } saveState(); }",
    "      if (pending) { pending.text = (pending.text ? pending.text + '\\n' : '') + m.text; pending.ack = null; pending.snr = m.snr; pending.pathLen = m.pathLen; clearTimeout(pending._timer); updateMsgDom(pending); if (cv.key !== S.active) { cv.unread++; renderTree(); } saveState();\n        if (S.autoNbFor === c.pub && /^neighbou?rs\\b/i.test(pending.cmd || '')) { S.autoNbFor = null; const nb = parseNeighbors(pending.text); if (nb.length) mapShowNeighbors(c, nb); else toast(t('nb.none'), 'warn'); } }")

for lang, keys in (
    ("nl", "'scope.named': 'regio {0}', 'nb.discover': 'Buren', 'nb.none': 'De repeater meldt geen buren.',"),
    ("en", "'scope.named': 'region {0}', 'nb.discover': 'Neighbours', 'nb.none': 'The repeater reports no neighbours.',"),
    ("fr", "'scope.named': 'région {0}', 'nb.discover': 'Voisins', 'nb.none': 'Le répéteur ne signale aucun voisin.',")):
    sub("i18n.js", f"I18N.{lang} = {{\n", f"I18N.{lang} = {{\n  {keys}\n")
print("patched")
