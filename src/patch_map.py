# Integratie van kaart, "Nu synchroniseren" en "Geschiedenis opnieuw ophalen" (room) + vertaalsleutels.
from pathlib import Path
def sub(path, old, new, count=1):
    p = Path(path); t = p.read_text(encoding="utf-8")
    assert old in t, f"anker niet gevonden in {path}: {old[:70]!r}"
    p.write_text(t.replace(old, new, count), encoding="utf-8")

# ---------------- body.html ----------------
sub("body.html", '<button class="btn sm ghost no-mobile" id="btn-disconnect" disabled data-i18n="h.disconnect">Verbreken</button>',
    '<button class="btn sm ghost no-mobile" id="btn-disconnect" disabled data-i18n="h.disconnect">Verbreken</button>\n  <button class="btn sm ghost no-mobile" id="btn-sync" disabled data-i18n="h.sync" data-i18n-title="h.syncTitle" title="Wachtrij van de node nu leeghalen">Sync</button>')
sub("body.html", '<div id="messages" role="log" aria-live="polite" aria-label="Berichten" data-i18n-aria="h.messages"></div>',
    '''<div id="messages" role="log" aria-live="polite" aria-label="Berichten" data-i18n-aria="h.messages"></div>
  <div id="mapwrap" hidden>
    <div id="map"></div>
    <div id="map-notice" hidden></div>
    <div id="map-tools"><button class="btn sm" id="map-fit" data-i18n="map.tools.fit">Alles tonen</button><button class="btn sm" id="map-me" data-i18n="map.tools.me">Mijn node</button><label class="btn sm" style="gap:6px"><input type="checkbox" id="map-live" checked> <span data-i18n="map.tools.live">Live pakketten</span></label><button class="btn sm ghost" id="map-settings" data-i18n="map.tools.settings">Offline kaarten…</button></div>
    <div id="map-legend"><span><i style="background:#3ccf83"></i><span data-i18n="map.legend.you">jij</span></span><span><i style="background:#f7b955"></i><span data-i18n="map.legend.repeater">repeater</span></span><span><i style="background:#c4a3ff"></i>room</span><span><i style="background:#5cc8ff"></i>chat</span><span><i style="background:#5fd6c5"></i><span data-i18n="map.legend.sensor">sensor</span></span></div>
  </div>''')
sub("body.html", '<button class="tab" role="tab" data-tab="location" data-i18n="h.tabLocation">Locatie</button>',
    '<button class="tab" role="tab" data-tab="location" data-i18n="h.tabLocation">Locatie</button><button class="tab" role="tab" data-tab="map" data-i18n="h.tabMap">Kaart</button>')
sub("body.html", '    <section class="pane" data-pane="data">',
    '''    <section class="pane" data-pane="map">
      <div class="callout" style="margin-bottom:12px" data-i18n="h.mapCallout">De kaart gebruikt de zelf-gehoste OpenStreetMap-tiles van meshmanager.net. Alles wat je bekijkt of hier voorlaadt, wordt in deze browser bewaard en werkt daarna offline.</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:8px"><span id="map-cache-stats" class="dim" style="font-size:12px"></span><span class="grow"></span><button class="btn sm" id="map-persist" data-i18n="h.mapPersist">Opslag vastzetten</button><button class="btn sm ghost danger" id="map-clear" data-i18n="h.mapClear">Cache wissen</button></div>
      <div class="grid2">
        <div class="field"><label for="map-ovz" data-i18n="h.mapOverview">Overzicht heel West-Europa tot zoom</label><select id="map-ovz"><option value="6">6</option><option value="7" selected>7</option><option value="8">8</option><option value="9">9</option></select></div>
        <div class="field"><label for="map-detz" data-i18n="h.mapDetail">Detail per gekozen land tot zoom</label><select id="map-detz"><option value="10">10</option><option value="11">11</option><option value="12" selected>12</option><option value="13">13</option><option value="14">14</option></select></div>
      </div>
      <h4 class="sub" data-i18n="h.mapCountries">Landen in hoge resolutie</h4>
      <div class="map-countries" id="map-countries"></div>
      <div class="row" style="flex-wrap:wrap;gap:8px"><b id="map-total"></b><span class="grow"></span><button class="btn primary" id="map-download" data-i18n="h.mapDownload">Voorladen</button><button class="btn ghost" id="map-cancel" hidden data-i18n="h.mapCancel">Stoppen</button></div>
      <div id="map-progress" hidden><i></i></div><div id="map-progress-txt" class="dim" style="font-size:11.5px"></div>
    </section>
    <section class="pane" data-pane="data">''')

# ---------------- i18n.js ----------------
NL = '''  // ---- kaart / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Wachtrij van de node nu leeghalen', 'h.tabMap': 'Kaart', 'map.title': 'Kaart', 'map.topic': '{0} nodes met bekende locatie · klik op een marker voor het gesprek',
  'map.tools.fit': 'Alles tonen', 'map.tools.me': 'Mijn node', 'map.tools.live': 'Live pakketten', 'map.tools.settings': 'Offline kaarten…', 'map.legend.you': 'jij', 'map.legend.repeater': 'repeater', 'map.legend.sensor': 'sensor',
  'map_unavailable': 'Kaart niet beschikbaar: geen verbinding met de tile-server (meshmanager.net) en geen kaartcache in deze browser.', 'map_offline_nocache': 'Je bent offline en er zijn nog geen kaarttiles in de cache.\\nOpen de kaart één keer met verbinding, of laad landen voor via Instellingen › Kaart.', 'map_offline_missing': 'Sommige kaartdelen zijn niet in de cache; ze verschijnen zodra er weer verbinding is.',
  'map_you': 'jij', 'map_last_advert': 'advert {0} geleden', 'map_open_chat': 'Openen', 'map_info': 'Info', 'map_no_location': 'Geen locatie bekend voor dit contact.',
  'ctx.onMap': 'Locatie van {0} op kaart', 'ctx.onMapShort': 'Locatie op kaart', 'info.onMap': 'Op kaart', 'info.sync': 'Sync', 'info.resync': 'Geschiedenis opnieuw ophalen', 'info.mapCache': 'Kaartcache', 'info.mapOffline': 'Offline kaarten…',
  'sync.done': '{0} berichten opgehaald van de node.', 'sync.none': 'Geen nieuwe berichten op de node.',
  'resync.title': 'Geschiedenis opnieuw ophalen', 'resync.text': 'De room {0} wordt van de node verwijderd en meteen opnieuw toegevoegd, zodat het synchronisatiepunt op nul staat. Daarna logt MeshChat opnieuw in en pusht de room zijn bewaarde posts. Het pad naar de room moet opnieuw ontdekt worden; dubbele berichten worden ontdubbeld.', 'resync.btn': 'Opnieuw ophalen', 'resync.started': 'Room opnieuw toegevoegd; login verstuurd, de room pusht nu zijn geschiedenis…', 'resync.needLogin': 'Room opnieuw toegevoegd. Log in om de geschiedenis te ontvangen.', 'resync.onlyRoom': 'Alleen voor rooms.',
  'h.mapCallout': 'De kaart gebruikt de zelf-gehoste OpenStreetMap-tiles van meshmanager.net. Alles wat je bekijkt of hier voorlaadt, wordt in deze browser bewaard en werkt daarna offline.', 'h.mapPersist': 'Opslag vastzetten', 'h.mapClear': 'Cache wissen', 'h.mapOverview': 'Overzicht heel West-Europa tot zoom', 'h.mapDetail': 'Detail per gekozen land tot zoom', 'h.mapCountries': 'Landen in hoge resolutie', 'h.mapDownload': 'Voorladen', 'h.mapCancel': 'Stoppen',
  'map.cacheStats': 'In cache: {0} ({1} delen) · opslag {2} van {3} gebruikt · {4}', 'map.persisted': 'vastgezet', 'map.notPersisted': 'niet vastgezet (browser mag opruimen)', 'map.persistOk': 'Opslag vastgezet: de browser ruimt de kaartcache niet meer zelf op.', 'map.persistNo': 'De browser weigerde vastzetten (installeer als app of bezoek de site vaker).', 'map.clearConfirm': 'Alle gecachte kaarttiles ({0}) uit deze browser verwijderen?', 'map.cleared': 'Kaartcache gewist.',
  'map.total': 'Selectie: ongeveer {0} (overzicht {1} + landen {2})', 'map.progress': '{0} van {1} tiles · {2} in cache · {3} fouten', 'map.done': 'Voorladen klaar: {0} tiles, {1} in cache.', 'map.cancelled': 'Voorladen gestopt.', 'map.needOnline': 'Voorladen vraagt een verbinding met meshmanager.net.',
'''
EN = '''  // ---- map / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Drain the node\\'s message queue now', 'h.tabMap': 'Map', 'map.title': 'Map', 'map.topic': '{0} nodes with a known location · click a marker to open the conversation',
  'map.tools.fit': 'Show all', 'map.tools.me': 'My node', 'map.tools.live': 'Live packets', 'map.tools.settings': 'Offline maps…', 'map.legend.you': 'you', 'map.legend.repeater': 'repeater', 'map.legend.sensor': 'sensor',
  'map_unavailable': 'Map unavailable: no connection to the tile server (meshmanager.net) and no map cache in this browser.', 'map_offline_nocache': 'You are offline and no map tiles are cached yet.\\nOpen the map once while connected, or preload countries in Settings › Map.', 'map_offline_missing': 'Some map parts are not cached; they will appear once you are back online.',
  'map_you': 'you', 'map_last_advert': 'advert {0} ago', 'map_open_chat': 'Open', 'map_info': 'Info', 'map_no_location': 'No location known for this contact.',
  'ctx.onMap': 'Show {0} on the map', 'ctx.onMapShort': 'Show on map', 'info.onMap': 'On map', 'info.sync': 'Sync', 'info.resync': 'Fetch history again', 'info.mapCache': 'Map cache', 'info.mapOffline': 'Offline maps…',
  'sync.done': '{0} messages fetched from the node.', 'sync.none': 'No new messages on the node.',
  'resync.title': 'Fetch history again', 'resync.text': 'The room {0} is removed from the node and re-added immediately so its sync point resets to zero. MeshChat then logs in again and the room pushes its stored posts. The path to the room has to be rediscovered; duplicate messages are filtered.', 'resync.btn': 'Fetch again', 'resync.started': 'Room re-added; login sent, the room is now pushing its history…', 'resync.needLogin': 'Room re-added. Log in to receive the history.', 'resync.onlyRoom': 'Rooms only.',
  'h.mapCallout': 'The map uses the self-hosted OpenStreetMap tiles of meshmanager.net. Everything you view or preload here is stored in this browser and works offline afterwards.', 'h.mapPersist': 'Pin storage', 'h.mapClear': 'Clear cache', 'h.mapOverview': 'Overview of all of Western Europe up to zoom', 'h.mapDetail': 'Detail per selected country up to zoom', 'h.mapCountries': 'Countries in high resolution', 'h.mapDownload': 'Preload', 'h.mapCancel': 'Stop',
  'map.cacheStats': 'Cached: {0} ({1} parts) · storage {2} of {3} used · {4}', 'map.persisted': 'pinned', 'map.notPersisted': 'not pinned (browser may evict)', 'map.persistOk': 'Storage pinned: the browser will no longer evict the map cache.', 'map.persistNo': 'The browser refused to pin storage (install as app or visit the site more often).', 'map.clearConfirm': 'Remove all cached map tiles ({0}) from this browser?', 'map.cleared': 'Map cache cleared.',
  'map.total': 'Selection: about {0} (overview {1} + countries {2})', 'map.progress': '{0} of {1} tiles · {2} cached · {3} errors', 'map.done': 'Preload finished: {0} tiles, {1} cached.', 'map.cancelled': 'Preload stopped.', 'map.needOnline': 'Preloading needs a connection to meshmanager.net.',
'''
FR = '''  // ---- carte / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Vider maintenant la file de messages du nœud', 'h.tabMap': 'Carte', 'map.title': 'Carte', 'map.topic': '{0} nœuds avec position connue · cliquez un marqueur pour ouvrir la conversation',
  'map.tools.fit': 'Tout afficher', 'map.tools.me': 'Mon nœud', 'map.tools.live': 'Paquets en direct', 'map.tools.settings': 'Cartes hors ligne…', 'map.legend.you': 'vous', 'map.legend.repeater': 'répéteur', 'map.legend.sensor': 'capteur',
  'map_unavailable': 'Carte indisponible : pas de connexion au serveur de tuiles (meshmanager.net) et aucun cache de carte dans ce navigateur.', 'map_offline_nocache': 'Vous êtes hors ligne et aucune tuile n\\'est encore en cache.\\nOuvrez la carte une fois en ligne, ou préchargez des pays dans Paramètres › Carte.', 'map_offline_missing': 'Certaines parties de la carte ne sont pas en cache ; elles apparaîtront dès le retour de la connexion.',
  'map_you': 'vous', 'map_last_advert': 'advert il y a {0}', 'map_open_chat': 'Ouvrir', 'map_info': 'Info', 'map_no_location': 'Aucune position connue pour ce contact.',
  'ctx.onMap': 'Position de {0} sur la carte', 'ctx.onMapShort': 'Position sur la carte', 'info.onMap': 'Sur la carte', 'info.sync': 'Sync', 'info.resync': 'Récupérer à nouveau l\\'historique', 'info.mapCache': 'Cache de carte', 'info.mapOffline': 'Cartes hors ligne…',
  'sync.done': '{0} messages récupérés du nœud.', 'sync.none': 'Aucun nouveau message sur le nœud.',
  'resync.title': 'Récupérer à nouveau l\\'historique', 'resync.text': 'La room {0} est retirée du nœud puis rajoutée aussitôt, ce qui remet son point de synchronisation à zéro. MeshChat se reconnecte ensuite et la room renvoie ses messages conservés. Le chemin vers la room devra être redécouvert ; les doublons sont filtrés.', 'resync.btn': 'Récupérer', 'resync.started': 'Room rajoutée ; login envoyé, la room renvoie maintenant son historique…', 'resync.needLogin': 'Room rajoutée. Connectez-vous pour recevoir l\\'historique.', 'resync.onlyRoom': 'Uniquement pour les rooms.',
  'h.mapCallout': 'La carte utilise les tuiles OpenStreetMap auto-hébergées de meshmanager.net. Tout ce que vous consultez ou préchargez ici est conservé dans ce navigateur et fonctionne ensuite hors ligne.', 'h.mapPersist': 'Fixer le stockage', 'h.mapClear': 'Vider le cache', 'h.mapOverview': 'Vue d\\'ensemble de toute l\\'Europe de l\\'Ouest jusqu\\'au zoom', 'h.mapDetail': 'Détail par pays choisi jusqu\\'au zoom', 'h.mapCountries': 'Pays en haute résolution', 'h.mapDownload': 'Précharger', 'h.mapCancel': 'Arrêter',
  'map.cacheStats': 'En cache : {0} ({1} éléments) · stockage {2} sur {3} utilisé · {4}', 'map.persisted': 'fixé', 'map.notPersisted': 'non fixé (le navigateur peut purger)', 'map.persistOk': 'Stockage fixé : le navigateur ne purgera plus le cache de carte.', 'map.persistNo': 'Le navigateur a refusé (installez l\\'app ou visitez le site plus souvent).', 'map.clearConfirm': 'Supprimer toutes les tuiles en cache ({0}) de ce navigateur ?', 'map.cleared': 'Cache de carte vidé.',
  'map.total': 'Sélection : environ {0} (vue d\\'ensemble {1} + pays {2})', 'map.progress': '{0} sur {1} tuiles · {2} en cache · {3} erreurs', 'map.done': 'Préchargement terminé : {0} tuiles, {1} en cache.', 'map.cancelled': 'Préchargement arrêté.', 'map.needOnline': 'Le préchargement nécessite une connexion à meshmanager.net.',
'''
sub("i18n.js", "I18N.nl = {\n", "I18N.nl = {\n" + NL)
sub("i18n.js", "I18N.en = {\n", "I18N.en = {\n" + EN)
sub("i18n.js", "I18N.fr = {\n", "I18N.fr = {\n" + FR)

# ---------------- app2.js ----------------
sub("app2.js", "$('#btn-disconnect').disabled = !on;", "$('#btn-disconnect').disabled = !on; const bs = $('#btn-sync'); if (bs) bs.disabled = !on;")
sub("app2.js", "  let html = `<section class=\"sec\" data-sec=\"server\">${item(statusCv, 'usb')}</section>`;",
    "  const mapCv = S.convs.get('map'); if (mapCv) mapCv.name = t('map.title');\n  let html = `<section class=\"sec\" data-sec=\"server\">${item(statusCv, 'usb')}${mapCv ? item(mapCv, 'globe') : ''}</section>`;")
sub("app2.js", "  tree.innerHTML = html;\n", "  tree.innerHTML = html;\n  if (typeof mapRefreshNodes === 'function' && typeof mapObj !== 'undefined' && mapObj) mapRefreshNodes();\n")
sub("app2.js", "  renderMessages(cv); cv.lastRead = nowSecs(); renderHead(cv); renderUsers(cv); renderTree(); renderCompose(cv);\n",
    "  renderMessages(cv); cv.lastRead = nowSecs(); renderHead(cv); renderUsers(cv); renderTree(); renderCompose(cv);\n  if (cv.kind === 'map') mapShow(); else mapHide();\n")
sub("app2.js", "  if (cv.kind === 'status') topic = S.client.connected ?", "  if (cv.kind === 'map') topic = esc(t('map.topic', typeof mapNodeFeatures === 'function' ? mapNodeFeatures().features.length : 0));\n  else if (cv.kind === 'status') topic = S.client.connected ?")
sub("app2.js", "  $('#btn-chan-leave').hidden = cv.kind === 'status';", "  $('#btn-chan-leave').hidden = cv.kind === 'status' || cv.kind === 'map';")
sub("app2.js", "  } else if (cv.kind === 'status') {\n    const cs = Array.from(S.contacts.values())", "  } else if (cv.kind === 'status' || cv.kind === 'map') {\n    const cs = Array.from(S.contacts.values())")
sub("app2.js", "  if (cv.kind === 'status') {\n    if (!S.self) { info.innerHTML =",
    "  if (cv.kind === 'map') { const n = typeof mapNodeFeatures === 'function' ? mapNodeFeatures().features.length : 0; info.innerHTML = `<h3>${esc(t('map.title'))}</h3><dl><dt>${esc(t('info.contacts'))}</dt><dd>${n}</dd><dt>${esc(t('info.mapCache'))}</dt><dd id=\"info-map-cache\">${typeof mapCacheBytes !== 'undefined' && mapCacheBytes != null ? fmtBytes(mapCacheBytes) : '…'}</dd></dl><div class=\"acts\"><button class=\"btn sm\" data-act=\"map-fit\">${esc(t('map.tools.fit'))}</button><button class=\"btn sm ghost\" data-act=\"map-settings\">${esc(t('info.mapOffline'))}</button></div>`; if (typeof mapCacheStats === 'function') mapCacheStats().then(s => { const el = $('#info-map-cache'); if (el) el.textContent = fmtBytes(s.bytes); }); return; }\n  if (cv.kind === 'status') {\n    if (!S.self) { info.innerHTML =")
sub("app2.js", "<button class=\"btn sm ghost\" data-act=\"contacts\">${esc(t('info.contacts'))}</button>",
    "<button class=\"btn sm ghost\" data-act=\"contacts\">${esc(t('info.contacts'))}</button><button class=\"btn sm ghost\" data-act=\"sync\" title=\"${esc(t('h.syncTitle'))}\">${esc(t('info.sync'))}</button>")
# contact-infopaneel: knop "Op kaart" en (room) "Geschiedenis opnieuw ophalen"
p = Path("app2.js"); s = p.read_text(encoding="utf-8")
anchor = "<button class=\"btn sm ghost\" data-act=\"edit\">"
assert anchor in s
s = s.replace(anchor, "${c.lat && c.lon ? `<button class=\"btn sm ghost\" data-act=\"map\">${esc(t('info.onMap'))}</button>` : ''}${c.type === 3 ? `<button class=\"btn sm ghost\" data-act=\"resync\" title=\"${esc(t('resync.title'))}\">${esc(t('info.resync'))}</button>` : ''}" + anchor, 1)
p.write_text(s, encoding="utf-8")

# ---------------- app3.js ----------------
sub("app3.js", "  if (S.settings.debug) debugLog(`rx ${pkt.ptypeName} ${routeName(pkt.route)} ${pkt.hashCount} hops SNR ${e.detail.snr} RSSI ${e.detail.rssi}`);\n});",
    "  if (S.settings.debug) debugLog(`rx ${pkt.ptypeName} ${routeName(pkt.route)} ${pkt.hashCount} hops SNR ${e.detail.snr} RSSI ${e.detail.rssi}`);\n  mapAnimateRx(pkt);\n});\n// Ontvangen pakket op de kaart tekenen (alleen als de kaart open staat en 'Live pakketten' aanstaat)\nconst PKT_COLORS = { 2: '#5cc8ff', 5: '#4ea1ff', 4: '#f7b955', 3: '#3ccf83', 0: '#c4a3ff', 1: '#c4a3ff', 7: '#c4a3ff', 9: '#ff8fab' };\nfunction mapAnimateRx(pkt) {\n  if (typeof mapObj === 'undefined' || !mapObj || $('#mapwrap').hidden || !$('#map-live')?.checked || !pkt || !pkt.hashes) return;\n  const pts = mapPacketPath(pkt.advertPub || null, pkt.hashes); if (pts.length >= 2) mapAnimatePacket(pts, PKT_COLORS[pkt.ptype] || '#8e9baa');\n}\nfunction mapAnimateMsg(msg, c) {\n  if (typeof mapObj === 'undefined' || !mapObj || $('#mapwrap').hidden || !$('#map-live')?.checked || msg.rx || !c || !c.lat) return;\n  const pts = mapPacketPath(c.pub, []); if (pts.length >= 2) mapAnimatePacket(pts, '#5cc8ff');\n}")
sub("app3.js", "    correlateRx(msg); const c = contactByName(nick); if (c) { msg.pub = c.pub; if (m.snr != null && (msg.pathLen === 0 || msg.pathLen === 0xFF)) c.lastSnr = m.snr; }\n    addMsg(cv, msg); return;",
    "    correlateRx(msg); const c = contactByName(nick); if (c) { msg.pub = c.pub; if (m.snr != null && (msg.pathLen === 0 || msg.pathLen === 0xFF)) c.lastSnr = m.snr; }\n    addMsg(cv, msg); mapAnimateMsg(msg, c); return;")
sub("app3.js", "      const nick = mine ? myNick() : author ? cname(author) : '?' + m.sig; c.loggedIn = true;\n",
    "      const nick = mine ? myNick() : author ? cname(author) : '?' + m.sig; c.loggedIn = true;\n      const ts0 = saneTs(m.ts); if (cv.msgs.some(x => x.kind === 'msg' && x.text === m.text && x.nick === nick && Math.abs((x.t || 0) - ts0) < 3)) return; // dubbel (bv. na opnieuw ophalen)\n")
sub("app3.js", "    const msg = { kind: 'msg', nick: displayName(c), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, pub: c.pub, hl: mentionsMe(m.text), txtType: m.txtType }; correlateRx(msg); addMsg(cv, msg);\n",
    "    const msg = { kind: 'msg', nick: displayName(c), text: m.text, t: saneTs(m.ts), snr: m.snr, pathLen: m.pathLen, pub: c.pub, hl: mentionsMe(m.text), txtType: m.txtType }; correlateRx(msg); addMsg(cv, msg); mapAnimateMsg(msg, c);\n")
# drainMessages: aantal teruggeven
sub("app3.js", "async function drainMessages() {\n  if (S.syncing || !C.connected) return; S.syncing = true;\n  try { for (let n = 0; n < 200; n++) { const m = await C.syncNext(); if (!m) break; handleIncoming(m); } }\n  catch (e) { debugLog('sync: ' + e.message); }\n  finally { S.syncing = false; }\n}",
    "async function drainMessages() {\n  if (S.syncing || !C.connected) return 0; S.syncing = true; let n = 0;\n  try { for (; n < 200; n++) { const m = await C.syncNext(); if (!m) break; handleIncoming(m); } }\n  catch (e) { debugLog('sync: ' + e.message); }\n  finally { S.syncing = false; }\n  return n;\n}\n// Room: synchronisatiepunt op de node resetten door het contact te verwijderen en opnieuw toe te voegen, daarna inloggen.\nasync function resyncRoom(c) {\n  const cv = convForContact(c); if (!requireConn(cv)) return; if (c.type !== 3) { errorMsg(t('resync.onlyRoom'), cv); return; }\n  if (!await confirmDlg(t('resync.title'), t('resync.text', displayName(c)), t('resync.btn'), true)) return;\n  const uri = await C.exportContact(c.pub); await C.removeContact(c.pub); await C.importContact(uri); await refreshContacts(true);\n  const c2 = S.contacts.get(c.pub); if (!c2) { errorMsg(t('err.2'), cv); return; }\n  const pw = S.roomPw[c.pub]?.pw; if (pw) { await doLogin(c2, pw, true); notice(t('resync.started'), cv, true); } else { notice(t('resync.needLogin'), cv, true); openLoginDlg(c2); }\n}")
sub("app3.js", "      case '/contacts': case '/refresh':",
    "      case '/sync': { if (!requireConn(cv)) break; const n = await drainMessages(); notice(n ? t('sync.done', n) : t('sync.none'), cv, false); break; }\n      case '/resync': { const c = activeContact(); if (!c) { errorMsg(t('resync.onlyRoom'), cv); break; } await resyncRoom(c); break; }\n      case '/map': { if (argv[0]) { const c = contactByName(argv[0]); if (c) { mapFocus(c.pub); break; } } openConv('map'); break; }\n      case '/contacts': case '/refresh':")

# ---------------- app4.js ----------------
sub("app4.js", "function setTheme(t) { S.settings.theme = t; if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;",
    "function setTheme(t) { S.settings.theme = t; if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; if (typeof mapSetTheme === 'function') setTimeout(mapSetTheme, 0);")
sub("app4.js", "    c ? { label: t('ctx.contactInfo', cname(c)), run: () => openContactDlg(c) } : null,\n    '-',",
    "    c ? { label: t('ctx.contactInfo', cname(c)), run: () => openContactDlg(c) } : null,\n    c && c.lat ? { label: t('ctx.onMap', cname(c)), run: () => mapFocus(c.pub) } : null,\n    '-',")
sub("app4.js", "c ? { label: t('ctx.contactInfoDots'), run: () => openContactDlg(c) } : null, c && c.type >= 2 ? { label: c.loggedIn ? t('ctx.logout') : t('ctx.login'), run: () => c.loggedIn ? handleInput('/logout') : openLoginDlg(c) } : null, '-',",
    "c ? { label: t('ctx.contactInfoDots'), run: () => openContactDlg(c) } : null, c && c.lat ? { label: t('ctx.onMapShort'), run: () => mapFocus(c.pub) } : null, c && c.type >= 2 ? { label: c.loggedIn ? t('ctx.logout') : t('ctx.login'), run: () => c.loggedIn ? handleInput('/logout') : openLoginDlg(c) } : null, c && c.type === 3 ? { label: t('info.resync'), run: () => resyncRoom(c) } : null, '-',")
sub("app4.js", "c ? { label: t('ctx.whois'), run: () => handleInput('/whois ' + cname(c)) } : null,",
    "c ? { label: t('ctx.whois'), run: () => handleInput('/whois ' + cname(c)) } : null, c && c.lat ? { label: t('ctx.onMapShort'), run: () => mapFocus(c.pub) } : null,")
sub("app4.js", "    if (act === 'login' && c) openLoginDlg(c); else if (act === 'edit' && c) openContactDlg(c);",
    "    if (act === 'map' && c) mapFocus(c.pub); else if (act === 'resync' && c) resyncRoom(c); else if (act === 'sync') handleInput('/sync'); else if (act === 'map-fit') mapFitAll(); else if (act === 'map-settings') openMapSettings();\n    else if (act === 'login' && c) openLoginDlg(c); else if (act === 'edit' && c) openContactDlg(c);")
sub("app4.js", "  on('#btn-chan-leave', 'click', () => closeConv(activeConv()));",
    """  on('#btn-chan-leave', 'click', () => closeConv(activeConv()));
  on('#btn-sync', 'click', () => handleInput('/sync'));
  // kaart
  on('#map-fit', 'click', () => mapFitAll()); on('#map-me', 'click', () => { if (S.self && S.self.lat) mapFocus(S.self.pub, 11); else toast(t('map_no_location'), 'warn'); });
  on('#map-settings', 'click', openMapSettings);
  on('#map-persist', 'click', async () => { const ok = await mapRequestPersist(); toast(ok ? t('map.persistOk') : t('map.persistNo'), ok ? 'ok' : 'warn', 6000); renderMapSettings(); });
  on('#map-clear', 'click', async () => { const st = await mapCacheStats(); if (!await confirmDlg(t('h.mapClear'), t('map.clearConfirm', fmtBytes(st.bytes)), t('h.mapClear'), true)) return; await mapClearCache(); toast(t('map.cleared'), 'ok'); renderMapSettings(); });
  on('#map-ovz', 'change', () => { S.settings.mapOvz = +val('#map-ovz'); saveState(); renderMapSettings(); }); on('#map-detz', 'change', () => { S.settings.mapDetz = +val('#map-detz'); saveState(); renderMapSettings(); });
  on('#map-countries', 'change', (e) => { const cb = e.target.closest('input[type=checkbox]'); if (!cb) return; const set = new Set(S.settings.mapCountries || []); cb.checked ? set.add(cb.value) : set.delete(cb.value); S.settings.mapCountries = Array.from(set); saveState(); renderMapSettings(); });
  on('#map-download', 'click', startMapPrefetch); on('#map-cancel', 'click', () => mapPrefetchCancel());""")
sub("app4.js", "async function fillSettings() {", """function openMapSettings() { fillSettings().then(() => { $('#dlg-settings').showModal(); $$('.tab').find(x => x.dataset.tab === 'map')?.click(); }); }
async function renderMapSettings() {
  if (!$('#map-countries')) return;
  const ovz = S.settings.mapOvz || 7, detz = S.settings.mapDetz || 12, sel = new Set(S.settings.mapCountries || []);
  $('#map-ovz').value = ovz; $('#map-detz').value = detz;
  const codes = Object.keys(MAP_SIZES.countries).sort((a, b) => MAP_SIZES.countries[a].name.localeCompare(MAP_SIZES.countries[b].name, i18nLocale()));
  $('#map-countries').innerHTML = codes.map(code => { const c = MAP_SIZES.countries[code]; const extra = Math.max(0, mapEstimate(code, detz) - mapEstimate(code, ovz)); return `<label><input type="checkbox" value="${code}" ${sel.has(code) ? 'checked' : ''}> ${esc(c.name)}<span class="sz">${fmtBytes(extra)}</span></label>`; }).join('');
  const ov = mapEstimateOverview(ovz); let cs = 0; for (const code of sel) cs += Math.max(0, mapEstimate(code, detz) - mapEstimate(code, ovz));
  $('#map-total').textContent = t('map.total', fmtBytes(ov + cs), fmtBytes(ov), fmtBytes(cs));
  try { const st = await mapCacheStats(); $('#map-cache-stats').textContent = t('map.cacheStats', fmtBytes(st.bytes), st.count, st.quota ? fmtBytes(st.quota.usage) : '?', st.quota ? fmtBytes(st.quota.quota) : '?', st.persisted ? t('map.persisted') : t('map.notPersisted')); $('#map-persist').hidden = !!st.persisted; } catch (e) {}
}
async function startMapPrefetch() {
  if (!(await mapAvailable()) || mapAvailReason.startsWith('offline')) { toast(t('map.needOnline'), 'err'); return; }
  const btn = $('#map-download'), bar = $('#map-progress'), txt = $('#map-progress-txt'); btn.disabled = true; $('#map-cancel').hidden = false; bar.hidden = false;
  const plan = { overviewZ: S.settings.mapOvz || 7, countries: (S.settings.mapCountries || []).map(code => ({ code, zmax: S.settings.mapDetz || 12 })) };
  try {
    const r = await mapPrefetch(plan, (p) => { bar.querySelector('i').style.width = Math.round(100 * p.done / Math.max(1, p.total)) + '%'; txt.textContent = t('map.progress', p.done, p.total, fmtBytes(p.bytes), p.failed); });
    toast(t('map.done', r.done, fmtBytes(r.bytes)), 'ok', 6000);
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; $('#map-cancel').hidden = true; renderMapSettings(); }
}
async function fillSettings() {
  renderMapSettings();""")
sub("app4.js", "  loadState(); initLang(); mkConv('status', 'status', 'MeshChat', null, null); S.convs.get('status').open = true;",
    "  loadState(); initLang(); mkConv('status', 'status', 'MeshChat', null, null); S.convs.get('status').open = true; mkConv('map', 'map', t('map.title'), null, null).open = true;")

# ---------------- build.sh ----------------
sub("build.sh", "cat core.js core2.js i18n.js app1.js app2.js app3.js app4.js > .all.js",
    "cat vendor/pmtiles.js vendor/maplibre-gl.js core.js core2.js i18n.js app1.js map_style.js map_data.js map.js app2.js app3.js app4.js > .all.js")
sub("build.sh", "  cat extra.css\n", "  cat extra.css\n  cat vendor/maplibre-gl.css\n  cat map.css\n")
print("patched")
