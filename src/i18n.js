/* ===================== i18n: Nederlands / English / Français ===================== */
// t(key, ...args) vervangt {0}, {1}, … en valt terug op nl en daarna op de key zelf.
// Statische HTML wordt vertaald via data-i18n / data-i18n-html / data-i18n-ph / data-i18n-title / data-i18n-aria.
const I18N_LOCALES = { nl: 'nl-BE', en: 'en-GB', fr: 'fr-BE' };
let LANG = 'nl';

const I18N = {};

I18N.nl = {
  'nb.btn': 'Buren op kaart', 'nb.summary': 'Buren van {0}: {1} met locatie, {2} zonder.', 'nb.unknown': 'Zonder locatie: {0}', 'map.tools.clearNb': 'Buren wissen',
  'move.text': 'MeshChat is verhuisd naar een eigen adres. Exporteer je configuratie, open het nieuwe adres en importeer ze daar; installeer de app daarna opnieuw:', 'move.export': 'Configuratie exporteren', 'map.searchPh': 'Zoek node…', 'map.searchNone': 'Geen node met locatie gevonden voor "{0}".', 'h.showOnMap': 'Toon op kaart',
  'heard.via': 'gehoord via {0}', 'heard.ok': 'gehoord', 'heard.no': 'niet gehoord', 'heard.wait': 'wacht op herhaling…', 'ctx.resendSame': 'Opnieuw verzenden (zelfde regel)',
  'map.legend.pending': 'wachtend advert', 'map_pending': 'Wachtend advert (nog geen contact op de node).', 'map_accept': 'Toevoegen', 'map_ignore': 'Negeren',
  // ---- pad / retries ----
  'path.flood': 'flood', 'path.direct': 'direct (0 hops)', 'path.hops': '{0} hop(s) via {1}', 'path.tooLong': 'Pad te lang (max. 64 bytes).', 'path.set': 'Pad naar {0} ingesteld: {1}', 'path.cleared': 'Pad naar {0} gewist (flood).', 'path.setBtn': 'Pad instellen', 'path.dlgTitle': 'Pad naar {0}', 'path.dlgInfo': '{0} hop(s) · {1} van {2} bytes', 'path.unknownHop': 'Een hop in het pad is geen bekend contact; verwijder die eerst.',
  'cmd.setpath': 'Pad naar contact handmatig instellen', 'cmd.sync': 'Wachtrij van de node nu ophalen', 'cmd.resync': 'Room: geschiedenis opnieuw ophalen', 'cmd.map': 'Kaart openen of contact op de kaart tonen',
  'h.pathSet': 'Pad instellen…', 'h.pathHelp': 'Kies in volgorde de repeaters waarlangs berichten naar dit contact moeten gaan (van jou naar het contact). Een leeg pad betekent flood.', 'h.add': 'Toevoegen', 'h.pathFlood': 'Leegmaken (flood)', 'h.pathHashSize': 'Hash-grootte', 'h.cancel': 'Annuleren', 'h.save': 'Opslaan',
  'h.retries': 'Automatisch opnieuw verzenden (pogingen, 0 = uit)', 'h.retriesHelp': 'Bij geen bevestiging opnieuw proberen; vanaf de tweede poging wordt het pad gewist en gaat het bericht als flood.', 'retry.attempt': 'poging {0}/{1}', 'retry.pathReset': 'Pad naar {0} gewist; volgende poging als flood.',
  // ---- kaart / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Wachtrij van de node nu leeghalen', 'h.tabMap': 'Kaart', 'map.title': 'Kaart', 'map.topic': '{0} nodes met bekende locatie · klik op een marker voor het gesprek',
  'map.tools.fit': 'Alles tonen', 'map.tools.me': 'Mijn node', 'map.tools.live': 'Live pakketten', 'map.tools.settings': 'Offline kaarten…', 'map.legend.you': 'jij', 'map.legend.repeater': 'repeater', 'map.legend.sensor': 'sensor',
  'map_unavailable': 'Kaart niet beschikbaar: geen verbinding met de tile-server (meshmanager.net) en geen kaartcache in deze browser.', 'map_offline_nocache': 'Je bent offline en er zijn nog geen kaarttiles in de cache.\nOpen de kaart één keer met verbinding, of laad landen voor via Instellingen › Kaart.', 'map_offline_missing': 'Sommige kaartdelen zijn niet in de cache; ze verschijnen zodra er weer verbinding is.',
  'map_you': 'jij', 'map_last_advert': 'advert {0} geleden', 'map_open_chat': 'Openen', 'map_info': 'Info', 'map_no_location': 'Geen locatie bekend voor dit contact.',
  'ctx.onMap': 'Locatie van {0} op kaart', 'ctx.onMapShort': 'Locatie op kaart', 'info.onMap': 'Op kaart', 'info.sync': 'Sync', 'info.resync': 'Geschiedenis opnieuw ophalen', 'info.mapCache': 'Kaartcache', 'info.mapOffline': 'Offline kaarten…',
  'sync.done': '{0} berichten opgehaald van de node.', 'sync.none': 'Geen nieuwe berichten op de node.',
  'resync.title': 'Geschiedenis opnieuw ophalen', 'resync.text': 'De room {0} wordt van de node verwijderd en meteen opnieuw toegevoegd, zodat het synchronisatiepunt op nul staat. Daarna logt MeshChat opnieuw in en pusht de room zijn bewaarde posts. Het pad naar de room moet opnieuw ontdekt worden; dubbele berichten worden ontdubbeld.', 'resync.btn': 'Opnieuw ophalen', 'resync.started': 'Room opnieuw toegevoegd; login verstuurd, de room pusht nu zijn geschiedenis…', 'resync.needLogin': 'Room opnieuw toegevoegd. Log in om de geschiedenis te ontvangen.', 'resync.onlyRoom': 'Alleen voor rooms.',
  'h.mapCallout': 'De kaart gebruikt de zelf-gehoste OpenStreetMap-tiles van meshmanager.net. Alles wat je bekijkt of hier voorlaadt, wordt in deze browser bewaard en werkt daarna offline.', 'h.mapPersist': 'Opslag vastzetten', 'h.mapClear': 'Cache wissen', 'h.mapOverview': 'Overzicht heel West-Europa tot zoom', 'h.mapDetail': 'Detail per gekozen land tot zoom', 'h.mapCountries': 'Landen in hoge resolutie', 'h.mapDownload': 'Voorladen', 'h.mapCancel': 'Stoppen',
  'map.cacheStats': 'In cache: {0} ({1} delen) · opslag {2} van {3} gebruikt · {4}', 'map.persisted': 'vastgezet', 'map.notPersisted': 'niet vastgezet (browser mag opruimen)', 'map.persistOk': 'Opslag vastgezet: de browser ruimt de kaartcache niet meer zelf op.', 'map.persistNo': 'De browser weigerde vastzetten (installeer als app of bezoek de site vaker).', 'map.clearConfirm': 'Alle gecachte kaarttiles ({0}) uit deze browser verwijderen?', 'map.cleared': 'Kaartcache gewist.',
  'map.total': 'Selectie: ongeveer {0} (overzicht {1} + landen {2})', 'map.progress': '{0} van {1} tiles · {2} in cache · {3} fouten', 'map.done': 'Voorladen klaar: {0} tiles, {1} in cache.', 'map.cancelled': 'Voorladen gestopt.', 'map.needOnline': 'Voorladen vraagt een verbinding met meshmanager.net.',
  // ---- core / protocol ----
  'core.notConnected': 'niet verbonden', 'core.connLost': 'verbinding verbroken', 'core.timeout': 'timeout (cmd {0})', 'core.err': 'fout: {0}', 'core.errCode': 'code {0}', 'core.disabledFw': 'uitgeschakeld in firmware',
  'err.1': 'commando niet ondersteund', 'err.2': 'niet gevonden', 'err.3': 'tabel/wachtrij vol', 'err.4': 'ongeldige toestand', 'err.5': 'opslagfout', 'err.6': 'ongeldig argument',
  'ble.hintConnect': '{0} — controleer of de node niet nog met de telefoon-app verbonden is, en koppel hem eerst in Windows (Instellingen › Bluetooth › Apparaat toevoegen, pincode standaard 123456).',
  'ble.hintStep': '{0} (stap: {1}). Op Windows: koppel de node eerst via Instellingen › Bluetooth met de pincode (standaard 123456), of zet de BLE-pincode van de node op 0 via een USB-verbinding (Instellingen › Apparaat). Zorg dat de telefoon-app niet verbonden is.',
  'ble.stepRx': 'RX-karakteristiek', 'ble.stepTx': 'TX-karakteristiek', 'ble.stepNotify': 'notificaties',
  'adv.0': 'onbekend', 'adv.1': 'chat', 'adv.2': 'repeater', 'adv.3': 'room', 'adv.4': 'sensor',
  'lpp.digIn': 'digitaal in', 'lpp.digOut': 'digitaal uit', 'lpp.anIn': 'analoog in', 'lpp.anOut': 'analoog uit', 'lpp.lux': 'lichtsterkte', 'lpp.presence': 'aanwezigheid', 'lpp.temp': 'temperatuur', 'lpp.hum': 'luchtvochtigheid', 'lpp.accel': 'accelerometer', 'lpp.press': 'luchtdruk', 'lpp.volt': 'spanning', 'lpp.curr': 'stroom', 'lpp.freq': 'frequentie', 'lpp.pct': 'percentage', 'lpp.alt': 'hoogte', 'lpp.power': 'vermogen', 'lpp.dist': 'afstand', 'lpp.energy': 'energie', 'lpp.dir': 'richting', 'lpp.gyro': 'gyro', 'lpp.gps': 'gps', 'lpp.unknown': 'type 0x{0}',
  // ---- state / formatting ----
  'state.saveFail': 'Opslaan in browser mislukt: {0}',
  'path.hop1': '1 hop via {0}', 'path.hopN': '{0} hops via {1}', 'path.direct0': 'direct (0 hops)',
  'ago.never': 'nooit', 'ago.future': 'toekomst', 'ago.s': '{0} s', 'ago.min': '{0} min', 'ago.h': '{0} u', 'ago.d': '{0} d',
  'route.0': 'transport-flood (scoped)', 'route.1': 'flood', 'route.2': 'direct', 'route.3': 'transport-direct (scoped)',
  'scope.codes': 'scope {0}', 'scope.none': 'zonder scope', 'scope.default': 'standaard', 'scope.defaultNamed': 'standaard ({0})', 'scope.global': 'globaal', 'scope.globalNamed': 'globaal ({0})', 'scope.custom': 'scope',
  // ---- generic UI ----
  'ui.close': 'Sluiten', 'ui.leave': 'Verlaten', 'ui.delete': 'Verwijderen', 'ui.save': 'Opslaan', 'ui.import': 'Importeren', 'ui.wipe': 'Wissen', 'ui.ok': 'OK',
  'batt.title': 'Batterij {0} V', 'batt.storage': ' · opslag {0}/{1} kB',
  // ---- sidebar ----
  'sb.favOnlyTitle': 'Alleen favorieten (klik voor alles)', 'sb.allTitle': 'Alle contacten (klik voor alleen favorieten)',
  'sb.channels': 'Kanalen', 'sb.addChannel': 'Kanaal toevoegen', 'sb.rooms': 'Rooms', 'sb.loggedIn': 'Ingelogd', 'sb.notLoggedIn': 'Niet ingelogd', 'sb.dm': 'Privé', 'sb.startDm': 'Privégesprek starten', 'sb.repeaters': 'Repeaters &amp; sensoren',
  'sb.noAdvert': 'Geen advert > {0} d', 'sb.advertAgo': 'Advert {0} geleden', 'sb.nothingFound': 'Niets gevonden voor "{0}".', 'sb.favToastOn': 'Zijbalk: alleen favorieten', 'sb.favToastOff': 'Zijbalk: alle contacten',
  // ---- messages ----
  'msg.waitingReply': 'wacht op antwoord…', 'ack.ok': 'Bevestigd', 'ack.fail': 'Geen bevestiging', 'ack.pending': 'Wacht op bevestiging', 'msg.new': 'nieuw', 'msg.none': 'Nog geen berichten.',
  // ---- channel head ----
  'head.notConnected': 'Niet verbonden. Kies USB of Bluetooth.', 'head.chPublic': 'Publiek kanaal', 'head.chHashtag': 'Hashtag-kanaal', 'head.chPrivate': 'Privékanaal', 'head.key': 'sleutel', 'head.seen1': '1 deelnemer gezien', 'head.seenN': '{0} deelnemers gezien', 'head.slot': 'slot {0}',
  'head.advertAgo': 'advert {0} geleden', 'head.path': 'pad {0}', 'head.loggedIn': 'ingelogd', 'head.notLoggedIn': 'niet ingelogd',
  'scope.optGlobal': 'Regio: globaal ({0})', 'scope.optDefault': 'Standaardregio node', 'scope.optUnscoped': 'Zonder scope (overal)', 'scope.optNew': '+ Andere regio…', 'scope.chanTitle': 'Regio (flood-scope) voor berichten in dit kanaal: {0}',
  // ---- composer ----
  'compose.phRepeater': 'CLI-commando voor de repeater (bv. ver, get radio) of /commando…', 'compose.phStatus': '/commando (typ /help)', 'compose.phSensor': 'CLI-commando voor de sensor of /commando…', 'compose.phMsg': 'Bericht of /commando…',
  // ---- users / info panel ----
  'users.lastAgo': 'laatst {0} geleden', 'users.noContact': 'geen contact',
  'info.node': 'Node', 'info.notConnected': 'Niet verbonden.', 'info.ownNode': 'Eigen node', 'info.name': 'Naam', 'info.key': 'Sleutel', 'info.radio': 'Radio', 'info.region': 'Regio', 'info.regionNone': 'geen (standaard)', 'info.sendScope': 'Verzendscope', 'info.contacts': 'Contacten',
  'info.advertFlood': 'Advert (flood)', 'info.advert0': 'Advert (0-hop)', 'info.downloadTitle': 'Deze pagina als los HTML-bestand bewaren', 'info.channel': 'Kanaal', 'info.slot': 'Slot', 'info.copyKey': 'Sleutel kopiëren',
  'info.title': 'Info · {0}', 'info.type': 'Type', 'info.advertName': 'Advert-naam', 'info.advert': 'Advert', 'info.path': 'Pad', 'info.location': 'Locatie', 'info.login': 'Login', 'info.loggedIn': 'ingelogd', 'info.admin': ' (admin)', 'info.notLoggedIn': 'niet ingelogd', 'info.note': 'Notitie',
  'info.status': 'Status', 'info.telemetry': 'Telemetrie', 'info.trace': 'Trace', 'info.discover': 'Pad zoeken', 'info.pathReset': 'Pad reset', 'info.logout': 'Logout', 'info.loginBtn': 'Login', 'info.edit': 'Bewerken',
  // ---- commands (uitleg; de commando's zelf blijven Engels) ----
  'cmd.help': "Overzicht van commando's", 'cmd.about': 'Over MeshChat: versie, handleiding, maker', 'cmd.connect': 'Verbinden met de node', 'cmd.connect.arg': 'usb|ble', 'cmd.disconnect': 'Verbinding verbreken',
  'cmd.join': 'Kanaal openen of toevoegen', 'cmd.join.arg': '#kanaal [sleutel|wachtwoord]', 'cmd.part': 'Kanaal verwijderen van de node', 'cmd.part.arg': '[kanaal]',
  'cmd.msg': 'Privébericht sturen', 'cmd.msg.arg': '<nick> <tekst>', 'cmd.query': 'Privévenster openen', 'cmd.query.arg': '<nick>', 'cmd.me': 'Actie-bericht', 'cmd.me.arg': '<tekst>',
  'cmd.nick': 'Eigen naam wijzigen', 'cmd.nick.arg': '<naam>', 'cmd.whois': 'Contactinfo tonen', 'cmd.whois.arg': '<nick>', 'cmd.names': 'Deelnemers tonen', 'cmd.list': 'Kanalen en contacten', 'cmd.contacts': 'Contactenlijst volledig herladen van de node',
  'cmd.advert': 'Eigen advert versturen', 'cmd.advert.arg': '[flood]', 'cmd.login': 'Inloggen op room/repeater', 'cmd.login.arg': '[wachtwoord]', 'cmd.logout': 'Uitloggen',
  'cmd.cli': 'CLI-commando naar repeater', 'cmd.cli.arg': '<commando>', 'cmd.status': 'Statistieken opvragen', 'cmd.telemetry': 'Telemetrie opvragen', 'cmd.telemetry.arg': '[nick]',
  'cmd.trace': 'Pad traceren met SNR per hop', 'cmd.trace.arg': '[nick]', 'cmd.path': 'Pad opnieuw ontdekken', 'cmd.path.arg': '[nick]', 'cmd.resetpath': 'Pad wissen (terug naar flood)', 'cmd.resetpath.arg': '[nick]',
  'cmd.scope': 'Verzendscope (regio) kiezen', 'cmd.scope.arg': '<naam|hex|off|default>', 'cmd.region': 'Standaardregio van de node instellen', 'cmd.region.arg': '<naam> [hex]', 'cmd.regions': "Regio's ophalen van een repeater en kiezen", 'cmd.regions.arg': '[repeater]',
  'cmd.export': 'Contact als meshcore:// URI', 'cmd.export.arg': '[nick]', 'cmd.import': 'Contact importeren', 'cmd.import.arg': '<meshcore://…>', 'cmd.share': 'Contact delen op het mesh', 'cmd.share.arg': '<nick>', 'cmd.del': 'Contact verwijderen', 'cmd.del.arg': '<nick>',
  'cmd.time': 'Tijd van de node', 'cmd.settime': 'Tijd synchroniseren', 'cmd.battery': 'Batterij', 'cmd.stats': 'Statistieken van de node',
  'cmd.raw': 'Ruw commando-frame sturen', 'cmd.raw.arg': '<hex>', 'cmd.debug': 'Debug-uitvoer aan/uit', 'cmd.clear': 'Venster leegmaken', 'cmd.theme': 'Thema', 'cmd.theme.arg': 'dark|light|auto', 'cmd.quit': 'Verbreken en venster sluiten',
  // ---- connection ----
  'conn.noBle': 'Web Bluetooth wordt niet ondersteund door deze browser (gebruik Chrome/Edge, of Bluefy op iOS).', 'conn.noSerial': 'Web Serial wordt niet ondersteund door deze browser (gebruik Chrome/Edge op desktop of Android).',
  'status.connecting': 'Verbinden…', 'status.syncing': 'Synchroniseren…', 'status.connected': 'Verbonden · {0}', 'status.off': 'Niet verbonden',
  'conn.cancelled': 'Verbinden geannuleerd.', 'conn.failed': 'Verbinden mislukt: {0}', 'conn.defaultModel': 'MeshCore-node', 'conn.build': ', build {0}',
  'conn.connectedVia': 'Verbonden via {0} met {1} (fw {2}{3}) · node "{4}"', 'conn.radio': 'Radio {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm', 'conn.clockSynced': 'Klok van de node gesynchroniseerd (stond {0} s achter).',
  'contacts.syncedIncr': '{0} gewijzigde contacten gesynchroniseerd ({1} totaal, uit cache).', 'contacts.loaded': '{0} contacten geladen van de node.', 'contacts.reloaded': 'Contactenlijst volledig opnieuw geladen.',
  'conn.lost': 'Verbinding met de node verbroken.', 'conn.lostToast': 'Verbinding verbroken',
  // ---- device events ----
  'ev.advertFrom': 'Advert van {0}{1}', 'ev.new': ' (nieuw)', 'ev.pathUpdated': 'Pad naar {0} bijgewerkt: {1}', 'ev.newNode': 'Nieuwe node gezien: {0} ({1}). Voeg toe via Contacten › Wachtende adverts.', 'ev.newNodeToast': 'Nieuwe node: {0} ({1})',
  'ev.contactDeleted': 'Contact {0} is van de node verwijderd.', 'ev.contactsFull': 'Contactenlijst van de node is vol',
  'login.ok': 'Ingelogd op {0}{1}.', 'login.asAdmin': ' als admin', 'login.okToast': 'Ingelogd op {0}', 'login.denied': 'Login op {0} geweigerd (verkeerd wachtwoord?).',
  'stats.raw': 'ruw: {0}', 'stats.line1': 'batterij {0} V · uptime {1} · tx-wachtrij {2}', 'stats.line2': 'ruisvloer {0} dBm · laatste RSSI {1} dBm{2}', 'stats.lastSnr': ' · laatste SNR {0} dB',
  'stats.line3': 'ontvangen {0} (flood {1}, direct {2}) · verzonden {3} (flood {4}, direct {5})', 'stats.line4': 'airtime tx {0}{1}{2}{3}', 'stats.rx': ' · rx {0}', 'stats.fullEvents': ' · wachtrij-vol {0}', 'stats.dups': ' · dups direct/flood {0}/{1}',
  'telem.noData': '(geen gegevens)', 'telem.cmd': 'telemetrie',
  'trace.hop': 'hop {0}: {1}  SNR {2} dB', 'trace.back': 'terug bij mij: SNR {0} dB',
  'disc.cmd': 'pad zoeken', 'disc.text': 'heen ({0} hops): {1}\nterug ({2} hops): {3}', 'disc.direct': 'direct',
  // ---- sending ----
  'send.notConnected': 'Niet verbonden met een node.', 'send.chanGone': 'Kanaal staat niet (meer) op de node.', 'send.failed': 'Verzenden mislukt: {0}', 'send.noContact': 'Contact niet gevonden.', 'send.roomNotLoggedIn': 'Je bent niet ingelogd op deze room. Gebruik /login <wachtwoord>.',
  'cli.noReply': 'geen antwoord van {0} binnen {1} s', 'cli.notLoggedIn': 'Niet ingelogd: het antwoord kan uitblijven. Gebruik /login <wachtwoord>.', 'cli.noAnswer': '(geen antwoord)', 'cli.err': 'fout: {0}',
  'login.sent': 'Login verstuurd naar {0} ({1})…', 'login.noReply': 'Geen antwoord op login van {0}.', 'login.failed': 'Login mislukt: {0}',
  'scope.noFwSupport2': "Deze firmware ondersteunt geen flood-scopes (regio's); bericht gaat zonder scope-wissel.", 'scope.noFwSupport': "Deze firmware ondersteunt geen flood-scopes (regio's).",
  'scope.chanSet': 'Regio voor dit kanaal: {0}', 'scope.followsGlobal': 'volgt de globale verzendscope ({0})', 'scope.sendScope': 'Verzendscope: {0}',
  // ---- slash commands ----
  'cmd.contactNotFound': 'Contact "{0}" niet gevonden.', 'cmd.noContactSel': 'Geen contact geselecteerd. Geef een naam op.',
  'help.list': "Commando's: {0}", 'help.hint': 'Typ /about voor de handleiding. Typ / om de lijst met uitleg te zien. In een repeater-venster gaat gewone tekst als CLI-commando naar de repeater; in een room als post; in een kanaal of privévenster als bericht.',
  'nick.current': 'Huidige naam: {0}', 'nick.changed': 'Naam gewijzigd in {0}. Verstuur een advert zodat anderen het zien (/advert flood).',
  'whois.text': '{0} · {1} · sleutel {2} · advert {3} · pad {4}{5}{6}', 'whois.loc': ' · locatie {0},{1}', 'whois.snr': ' · SNR {0}',
  'names.seen': 'Gezien: {0}', 'names.contacts': 'Contacten: {0}', 'list.channels': 'Kanalen: {0}', 'list.rooms': 'Rooms: {0} · Repeaters: {1}',
  'advert.sent': 'Advert verstuurd ({0}).', 'advert.zeroHop': 'zero-hop', 'advert.sentToast': 'Advert verstuurd',
  'login.openFirst': 'Open eerst een room of repeater.', 'logout.done': 'Uitgelogd van {0}', 'cli.openFirst': 'Open eerst een repeater/room.',
  'status.sent': 'Statusverzoek verstuurd naar {0}…', 'telem.sent': 'Telemetrieverzoek verstuurd naar {0}…', 'trace.noPath': 'Geen bekend pad naar {0} (flood). Probeer /path.', 'trace.sent': 'Trace verstuurd via {0}…', 'disc.sent': 'Padzoekopdracht verstuurd naar {0}…', 'path.reset': 'Pad naar {0} gewist (flood).',
  'export.self': 'Eigen node', 'import.done': 'Contact geïmporteerd.', 'share.done': 'Contact {0} gedeeld op het mesh.',
  'time.node': 'Tijd van de node: {0} (verschil {1} s)', 'time.synced': 'Tijd gesynchroniseerd.', 'batt.notice': 'Batterij {0} V{1}',
  'raw.reply': 'antwoord: {0}', 'debug.toggle': 'Debug {0}', 'debug.on': 'aan', 'debug.off': 'uit', 'cmd.unknown': 'Onbekend commando: {0} (typ /help)',
  'nodestats.line1': 'batterij {0} V · uptime {1} · fouten 0x{2} · wachtrij {3}', 'nodestats.line2': 'ruisvloer {0} dBm · laatste RSSI {1} dBm · laatste SNR {2} dB · airtime tx {3} rx {4}',
  'nodestats.line3': 'pakketten: ontvangen {0} · verzonden {1} · flood tx/rx {2}/{3} · direct tx/rx {4}/{5} · rx-fouten {6}', 'nodestats.unavailable': 'Statistieken niet beschikbaar (oudere firmware?): {0}',
  'scope.chanCurrent': 'Regio van dit kanaal: {0}. Gebruik /scope <naam|off|default|global>.', 'scope.current': 'Verzendscope: {0}{1}', 'scope.nodeDefault': ' · standaardregio van de node: {0} ({1})', 'scope.noNodeDefault': ' · geen standaardregio op de node', 'scope.set': 'Verzendscope ingesteld: {0}',
  'region.cleared': 'Standaardregio van de node gewist.', 'region.set': 'Standaardregio ingesteld: {0} ({1}).',
  'clip.copied': 'Gekopieerd naar klembord', 'clip.failed': 'Kopiëren mislukt',
  // ---- channels ----
  'join.badKey': 'Ongeldige sleutel: 32 hex-tekens of 24 base64-tekens verwacht.', 'join.usage': 'Geef een #hashtag, of een naam met sleutel/wachtwoord: /join naam <sleutel|wachtwoord>', 'join.exists': 'Kanaal al aanwezig.',
  'join.full': 'Alle {0} kanaalslots op de node zijn bezet. Verlaat eerst een kanaal.', 'join.added': 'Kanaal {0} toegevoegd in slot {1} · sleutel {2}',
  'leave.notFound': 'Kanaal niet gevonden.', 'leave.title': 'Kanaal verlaten', 'leave.text': '"{0}" wordt van de node verwijderd (slot {1}). De lokale geschiedenis blijft bewaard. Sleutel: {2}', 'leave.done': 'Kanaal {0} verwijderd.',
  'del.title': 'Contact verwijderen', 'del.text': '{0} ({1}) van de node verwijderen? De lokale geschiedenis blijft bewaard.', 'del.failed': 'Verwijderen mislukt: {0}', 'del.done': '{0} verwijderd',
  // ---- channel dialog ----
  'ch.phPassword': 'wachtwoord', 'ch.phKey': '32 hex-tekens of base64',
  'ch.helpPublic': 'Het standaard publieke kanaal (vaste sleutel izOH6cXN6mrJ5e26oRXNcg==).', 'ch.helpHashtag': 'Sleutel = eerste 16 bytes van SHA-256 van de naam incl. #, in kleine letters. Compatibel met de officiële app.',
  'ch.helpKey': 'Gedeelde 128-bit sleutel, zoals de officiële app die toont/deelt (base64 of hex). Naam is vrij te kiezen.', 'ch.helpPassword': 'Sleutel = eerste 16 bytes van SHA-256 van het wachtwoord. Alleen compatibel met andere MeshChat-gebruikers met hetzelfde wachtwoord; deel anders de sleutel (te vinden in het infopaneel).',
  'ch.needName': 'Geef een naam op', 'ch.needSecret': 'Geef een sleutel of wachtwoord op',
  // ---- contacts dialog ----
  'ct.of': ' van {0}', 'ct.max': ' · max {0}', 'ct.prune': 'Oude verwijderen ({0})', 'ct.fav': 'Favoriet', 'ct.loggedIn': 'ingelogd', 'ct.console': 'Console', 'ct.chat': 'Chat', 'ct.info': 'Info', 'ct.none': 'Geen contacten.', 'ct.accept': 'Toevoegen', 'ct.ignore': 'Negeren',
  'ct.pubLen': 'Publieke sleutel moet 64 hex-tekens zijn', 'ct.added': 'Contact toegevoegd', 'ct.addedName': '{0} toegevoegd', 'ct.addFailed': 'Toevoegen mislukt: {0}', 'ct.updateFailed': 'Bijwerken op node mislukt: {0}',
  'prune.title': 'Oude contacten verwijderen', 'prune.text': '{0} contacten zonder advert in de laatste {1} dagen van de node verwijderen? Favorieten blijven staan.', 'prune.done': '{0} contacten verwijderd',
  'ct.importTitle': 'Contact importeren', 'ct.importLabel': 'meshcore://… URI (van "Deel contact" in de app)', 'ct.reloaded': 'Contacten volledig herladen', 'ct.contactsFile': 'meshchat-contacten.json', 'ct.uriTitle': 'Contact-URI · {0}', 'ct.uriLabel': 'Deel deze meshcore:// link',
  // ---- settings ----
  'set.limits': '{0} contacten · {1} kanalen', 'set.protocol': ' (protocol v{0})', 'set.storage': 'Opslag in browser: {0} kB · {1} berichten', 'set.repeatAllowed': 'Client-repeat toegestaan op: {0}',
  'rg.nodeTag': 'standaardregio van de node', 'rg.node': 'node', 'rg.globalTag': 'globale verzendscope', 'rg.global': 'globaal', 'rg.useGlobal': 'Als globale verzendscope gebruiken', 'rg.globalBtn': 'Globaal', 'rg.useNode': 'Als standaardregio op de node zetten', 'rg.nodeBtn': 'Node',
  'rg.none': "Nog geen regio's. Voeg er een toe of haal ze op van een repeater.", 'rg.loggedIn': ' (ingelogd)', 'rg.noRepeaters': '— geen repeaters —',
  'rg.needName': 'Geef een regionaam', 'rg.pickRepeater': 'Kies een repeater', 'rg.loginFirst': 'Log eerst in op {0} (admin) — het venster wordt geopend', 'rg.waiting': 'Wachten op antwoord…', 'rg.noneRecognized': 'Geen regionamen herkend in het antwoord: {0}',
  'rg.known': '(al bekend)', 'rg.home': 'home', 'rg.discoverBtn': "Regio's ophalen van repeater", 'rg.setNodeFailed': 'Standaardregio op node zetten mislukt: {0}', 'rg.applied': "{0} regio's overgenomen", 'rg.added': 'Regio toegevoegd: {0}', 'rg.nodeSet': 'Standaardregio van de node: {0}',
  'node.saved': 'Node-instellingen opgeslagen', 'node.savedNotice': 'Node-instellingen bijgewerkt. Verstuur een advert om de nieuwe naam bekend te maken.', 'loc.saved': 'Locatie opgeslagen',
  'radio.invalid': 'Ongeldige radiowaarden', 'radio.title': 'Radio-instellingen', 'radio.confirm': 'Frequentie {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm. Alle nodes in je netwerk moeten dezelfde waarden gebruiken; anders hoor je niemand meer.',
  'radio.repeatNotAllowed': 'Client-repeat is niet toegestaan op deze frequentie', 'radio.hashUnsupported': 'Pad-hashmodus niet ondersteund', 'radio.saved': 'Radio opgeslagen', 'radio.setNotice': 'Radio ingesteld: {0} MHz · BW {1} · SF{2} · CR{3} · {4} dBm',
  'tuning.saved': 'Tuning opgeslagen', 'region.clearedToast': 'Regio gewist', 'region.saved': 'Regio opgeslagen', 'scope.needNameOrKey': 'Geef een regionaam of sleutel',
  'pin.invalid': 'PIN: 6 cijfers of 0 om uit te schakelen', 'pin.saved': 'BLE-pincode opgeslagen (na herstart actief)',
  'pk.exportTitle': 'Privésleutel exporteren', 'pk.exportWarn': 'Wie deze sleutel heeft, kan zich als jouw node voordoen en je privéberichten lezen. Alleen bewaren op een veilige plek.', 'pk.show': 'Tonen', 'pk.hexTitle': 'Privésleutel (hex, 64 bytes)', 'pk.copyKeep': 'Kopieer en bewaar veilig', 'pk.exportFailed': 'Export niet mogelijk: {0}',
  'pk.importTitle': 'Privésleutel importeren', 'pk.hex128': '128 hex-tekens', 'pk.expect128': 'Verwacht 128 hex-tekens', 'pk.replaceTitle': 'Identiteit vervangen', 'pk.replaceText': 'De node krijgt een andere identiteit (publieke sleutel). Contacten zien je als een nieuwe node. Herstart daarna.', 'pk.imported': 'Privésleutel geïmporteerd; herstart de node',
  // ---- config export / import ----
  'cfg.pkNotExportable': 'Privésleutel niet exporteerbaar: {0}', 'cfg.historyFile': 'meshchat-geschiedenis.json', 'cfg.badJson': 'Ongeldig JSON-bestand', 'cfg.notMeshchat': 'Geen MeshChat-configuratie',
  'cfg.partNode': 'node-instellingen (naam, radio, locatie, regio, opties)', 'cfg.partChannels': '{0} kanalen', 'cfg.partContacts': '{0} contacten', 'cfg.partPk': 'PRIVÉSLEUTEL (identiteit)', 'cfg.partLocal': 'lokale voorkeuren, aliassen en room-wachtwoorden',
  'cfg.importTitle': 'Configuratie importeren', 'cfg.apply': 'Toepassen: {0}.', 'cfg.applyConn': ' Node-instellingen worden direct naar de node geschreven.', 'cfg.applyOffline': ' Niet verbonden: alleen lokale gegevens worden overgenomen.',
  'cfg.doneErr': 'Import klaar met {0} fout(en); zie status-venster met /debug', 'cfg.done': 'Configuratie geïmporteerd', 'cfg.pkImportedNotice': 'Privésleutel geïmporteerd: herstart de node (Instellingen › Apparaat).', 'cfg.localDone': 'Lokale gegevens geïmporteerd (niet verbonden)',
  // ---- context menus / message info ----
  'ctx.msgInfo': 'Berichtinfo (pad, scope, raw)…', 'ctx.reply': 'Antwoorden aan {0}', 'ctx.dm': 'Privébericht aan {0}', 'ctx.contactInfo': 'Contactinfo {0}', 'ctx.copyText': 'Tekst kopiëren', 'ctx.copyRaw': 'Raw pakket kopiëren (hex)', 'ctx.resend': 'Opnieuw verzenden', 'ctx.deleteLocal': 'Bericht verwijderen (lokaal)',
  'ctx.open': 'Openen', 'ctx.markRead': 'Als gelezen markeren', 'ctx.contactInfoDots': 'Contactinfo…', 'ctx.logout': 'Uitloggen', 'ctx.login': 'Inloggen…', 'ctx.leaveChannel': 'Kanaal verlaten', 'ctx.closeWindow': 'Venster sluiten', 'ctx.clearHistory': 'Geschiedenis wissen',
  'ctx.dmShort': 'Privébericht', 'ctx.whois': 'Whois in venster', 'ctx.mention': 'Vermelden',
  'mi.time': 'Tijd', 'mi.received': ' · ontvangen {0}', 'mi.from': 'Van', 'mi.authorPrefix': 'auteur-prefix {0}', 'mi.window': 'Venster', 'mi.delivery': 'Bezorging', 'mi.confirmed': '✓ bevestigd', 'mi.after': ' na {0} ms', 'mi.noAck': '✗ geen bevestiging', 'mi.pending': 'wacht op bevestiging', 'mi.chanNoAck': 'kanaalbericht (geen ACK mogelijk)',
  'mi.route': 'Route', 'mi.ackCode': 'ACK-code', 'mi.sendScope': 'Verzendscope', 'mi.hops': 'Hops', 'mi.hashSize': ' · hashgrootte {0} B', 'mi.type': 'Type', 'mi.typeText': 'tekst', 'mi.typeSigned': 'ondertekend (room)',
  'mi.rawRoute': 'Raw route', 'mi.payload': ' · payload {0} · v{1}', 'mi.scopeCodes': 'Scope (transportcodes)', 'mi.nodeRegion': ' <span class="mute">(node-regio: {0})</span>', 'mi.path': 'Pad', 'mi.unknownNode': 'onbekende node', 'mi.noRepeaters': 'geen tussenliggende repeaters', 'mi.rawPacket': 'Raw pakket',
  'mi.rawUnavailable': 'niet beschikbaar: de node stuurt alleen ruwe pakketten door als rx-logging in de firmware actief is (bericht ontvangen vóór de verbinding of firmware zonder LOG_RX).', 'mi.pathHidden': '{0} hop(s); de tussenliggende repeaters zijn alleen zichtbaar via het ruwe pakket.',
  'scope.otherTitle': 'Andere regio', 'scope.otherLabel': 'Regionaam (bv. Antwerpen) of 32-tekens hex-sleutel', 'chkey.title': 'Kanaalsleutel · {0}', 'chkey.label': 'Hex (deel dit met wie mee mag lezen) · base64: {0}',
  // ---- misc wiring ----
  'geo.unavailable': 'Geolocatie niet beschikbaar', 'geo.taken': 'Locatie overgenomen van de browser', 'geo.failed': 'Geolocatie mislukt: {0}',
  'time.syncedToast': 'Tijd gesynchroniseerd', 'reboot.title': 'Node herstarten', 'reboot.text': 'De verbinding valt weg en moet opnieuw gemaakt worden.', 'reboot.btn': 'Herstarten', 'reboot.sent': 'Herstart verstuurd',
  'factory.title': 'Fabrieksinstellingen', 'factory.text': 'ALLE instellingen, contacten, kanalen en de identiteit van de node worden gewist. Exporteer eerst je configuratie (tab Gegevens). Doorgaan?', 'factory.done': 'Fabrieksreset uitgevoerd',
  'hist.clearTitle': 'Geschiedenis wissen', 'hist.clearText': 'Alle lokaal opgeslagen berichten verwijderen? Contacten en instellingen blijven.', 'forget.title': 'Alles vergeten', 'forget.text': 'Alle lokale gegevens van MeshChat (geschiedenis, aliassen, room-wachtwoorden, instellingen) uit deze browser wissen? De node zelf wordt niet aangepast.',
  'init.welcome': "Welkom bij MeshChat. Verbind je MeshCore-companion via USB (Web Serial) of Bluetooth (Web Bluetooth) met de knoppen bovenaan. Typ /help voor de commando's.",
  'init.noSupport': 'Deze browser ondersteunt Web Serial noch Web Bluetooth. Gebruik Chrome of Edge (desktop of Android). Op iOS werkt alleen Bluetooth via de Bluefy-browser.',
  'init.fileTip': "Tip: sommige browsers blokkeren Web Serial/Bluetooth op file://-pagina's. Werkt het niet, host het bestand dan via https of localhost.",
  'dl.done': 'meshchat.html gedownload. Open het in Chrome of Edge; voor USB/Bluetooth via https of localhost hosten.', 'dl.failed': 'Downloaden mislukt: {0}',
  'update.available': 'Nieuwe versie beschikbaar: v{0} (nu v{1})', 'update.reload': 'Herladen',
  // ---- static HTML (body.html) ----
  'h.showChannels': 'Kanalen tonen', 'h.usbTitle': 'Verbinden via USB (Web Serial)', 'h.btTitle': 'Verbinden via Bluetooth (Web Bluetooth)', 'h.disconnect': 'Verbreken', 'h.battTitle': 'Batterijspanning', 'h.nickTitle': 'Eigen naam (nick)',
  'h.lang': 'Taal', 'h.theme': 'Thema wisselen', 'h.aboutAria': 'Over MeshChat en handleiding', 'h.aboutTitle': 'Handleiding', 'h.settings': 'Instellingen', 'h.showUsers': 'Deelnemers tonen',
  'h.sidebarAria': 'Kanalen en contacten', 'h.searchPh': 'Zoek kanaal of contact…', 'h.searchAria': 'Zoeken in zijbalk', 'h.favOnly': 'Alleen favorieten tonen', 'h.contacts': 'Contacten',
  'h.chanScopeTitle': 'Regio (flood-scope) voor berichten in dit kanaal', 'h.chanScopeAria': 'Regio voor dit kanaal', 'h.info': 'Info', 'h.leave': 'Verlaten', 'h.messages': 'Berichten', 'h.toNewest': 'Naar nieuwste berichten', 'h.newMessages': 'Nieuwe berichten',
  'h.commands': "Commando's", 'h.message': 'Bericht', 'h.send': 'Verzenden', 'h.sendBtn': 'Verzend', 'h.users': 'Deelnemers',
  'h.addChannel': 'Kanaal toevoegen', 'h.close': 'Sluiten', 'h.ctHashtag': 'Hashtag <code>#naam</code><small>Sleutel afgeleid van de naam · open voor iedereen die de naam kent</small>', 'h.ctKey': 'Privé met sleutel<small>Gedeelde 128-bit sleutel (hex of base64), naam vrij</small>',
  'h.ctPassword': 'Privé met wachtwoord<small>Sleutel afgeleid van een wachtwoord</small>', 'h.ctPublic': 'Publiek<small>Het standaardkanaal, vaste sleutel</small>', 'h.name': 'Naam', 'h.max31': 'Max. 31 tekens.', 'h.keyOrPw': 'Sleutel of wachtwoord', 'h.keyPh': '32 hex-tekens of base64', 'h.generate': 'Genereer', 'h.cancel': 'Annuleren', 'h.add': 'Toevoegen',
  'h.ctSearchPh': 'Zoeken op naam, sleutel, notitie…', 'h.ctSearchAria': 'Contacten zoeken', 'h.type': 'Type', 'h.allTypes': 'Alle types', 'h.sort': 'Sorteren', 'h.sortRecent': 'Recentste advert', 'h.sortName': 'Naam', 'h.sortType': 'Type', 'h.sortDist': 'Afstand', 'h.showStale': ' Ook oude tonen',
  'h.pendingAdverts': 'Wachtende adverts (handmatig toevoegen staat aan)', 'h.lastAdvert': 'Laatste advert', 'h.path': 'Pad', 'h.advertFlood': 'Advert (flood)', 'h.advert0': 'Advert (0-hop)', 'h.pruneOld': 'Oude verwijderen', 'h.refreshTitle': 'Volledige lijst opnieuw van de node halen (normaal worden alleen wijzigingen gesynchroniseerd)', 'h.refresh': 'Vernieuwen',
  'h.addManual': 'Handmatig toevoegen', 'h.importUri': 'Importeren (meshcore://)', 'h.export': 'Exporteren',
  'h.contact': 'Contact', 'h.nameFromAdvert': 'Naam uit advert', 'h.aliasLocal': 'Alias (lokaal)', 'h.aliasPh': 'eigen naam voor dit contact', 'h.noteLocal': 'Notitie (lokaal)', 'h.notePh': 'bv. dak van de watertoren, admin = Wim', 'h.typeOnNode': 'Type (op de node)',
  'h.telemPerm': 'Telemetrie-rechten (0–127)', 'h.telemPermHelp': 'Gebruikt als telemetrie op "per contact" staat.', 'h.favLabel': ' Favoriet (wordt niet automatisch overschreven als de node vol is)', 'h.pubKey': 'Publieke sleutel', 'h.copy': 'Kopiëren', 'h.location': 'Locatie', 'h.pathOut': 'Pad (uitgaand)',
  'h.discover': 'Pad zoeken', 'h.pathReset': 'Pad reset', 'h.shareUri': 'Deel-URI', 'h.shareMesh': 'Delen op mesh', 'h.delete': 'Verwijderen', 'h.open': 'Openen', 'h.save': 'Opslaan',
  'h.addContactManual': 'Contact handmatig toevoegen', 'h.pubKey64': 'Publieke sleutel (64 hex)', 'h.manualCallout': 'Heb je een <span class="mono">meshcore://</span>-link? Gebruik dan "Importeren" in het contactenvenster; die bevat ook de handtekening en locatie.',
  'h.tabNode': 'Node', 'h.tabRadio': 'Radio', 'h.tabRegion': "Regio's", 'h.tabLocation': 'Locatie', 'h.tabDevice': 'Apparaat', 'h.tabView': 'Weergave', 'h.tabData': 'Gegevens',
  'h.nameNick': 'Naam (nick)', 'h.nameHelp': 'Zichtbaar in adverts en kanaalberichten. Verstuur na wijziging een advert.', 'h.manualAdd': ' Contacten handmatig toevoegen (nieuwe adverts eerst goedkeuren)',
  'h.aaChat': ' Chat auto-toevoegen', 'h.aaRpt': ' Repeaters', 'h.aaRoom': ' Rooms', 'h.aaSensor': ' Sensoren', 'h.aaOverwrite': ' Oudste (niet-favoriet) overschrijven als vol', 'h.aaHops': 'Max. hops voor auto-toevoegen (leeg = geen limiet)',
  'h.telemShare': 'Telemetrie delen', 'h.telemBase': 'Basis (batterij, temp.)', 'h.never': 'Nooit', 'h.perContactPerm': 'Per contact (rechten)', 'h.everyone': 'Iedereen', 'h.perContact': 'Per contact', 'h.telemEnv': 'Omgeving (sensoren)',
  'h.multiAcks': " Meerdere ACK's sturen (betrouwbaarder, meer airtime)", 'h.sendAdvert': 'Advert versturen',
  'h.radioCallout': 'Alle nodes in het netwerk moeten dezelfde frequentie, bandbreedte, SF en CR gebruiken. Wijzigingen gelden direct na opslaan.', 'h.preset': 'Voorinstelling', 'h.choose': '— kies —', 'h.presetEu869': 'EU/UK 869.618 · BW250 · SF11 · CR5 (standaard)',
  'h.freq': 'Frequentie (MHz)', 'h.bw': 'Bandbreedte (kHz)', 'h.txPower': 'TX-vermogen (dBm)', 'h.hashSize': 'Pad-hashgrootte', 'h.hash1': '1 byte (standaard)', 'h.hash2': '2 bytes', 'h.hash3': '3 bytes',
  'h.clientRepeat': ' Client-repeat: deze node herhaalt ook pakketten (alleen op toegestane frequenties)', 'h.saveRadio': 'Radio opslaan', 'h.tuning': 'Tuning (geavanceerd)', 'h.rxDelay': 'RX-vertraging basis', 'h.airtimeFactor': 'Airtime-factor', 'h.saveTuning': 'Tuning opslaan',
  'h.regionCallout': 'Regio\'s (flood-scopes, firmware ≥ 1.10) beperken hoe ver floods reizen: repeaters herhalen alleen pakketten van hun eigen regio. De sleutel van een regio volgt uit de naam (SHA-256 van "#naam", 16 bytes), tenzij de beheerder een eigen sleutel deelt.',
  'h.nodeDefaultRegion': 'Standaardregio van de node', 'h.regionNamePh': 'bv. Limburg', 'h.keyHex32': 'Sleutel (hex, 32)', 'h.deriveFromNamePh': 'leeg = afleiden uit naam', 'h.derive': 'Afleiden', 'h.clearRegion': 'Regio wissen', 'h.saveRegion': 'Regio opslaan',
  'h.myRegions': "Mijn regio's", 'h.key': 'Sleutel', 'h.rgNamePh': 'naam, bv. be-vlg', 'h.rgKeyPh': 'sleutel (leeg = afleiden)', 'h.repeater': 'Repeater', 'h.discoverRegions': "Regio's ophalen van repeater", 'h.discoverHelp': 'Stuurt het CLI-commando <span class="mono">region</span>; login als admin is nodig.',
  'h.sessionScope': 'Verzendscope voor deze sessie', 'h.scopeOnSend': 'Scope bij het verzenden', 'h.scopeDefault': 'Standaardregio van de node', 'h.scopeUnscoped': 'Zonder scope (overal heen floods)', 'h.scopeCustom': 'Andere regio…', 'h.regionName': 'Regionaam', 'h.regionNamePh2': 'bv. Antwerpen', 'h.keyHex': 'Sleutel (hex)', 'h.derivePh': 'leeg = afleiden', 'h.apply': 'Toepassen',
  'h.scopeHelp': 'Ook via <span class="mono">/scope &lt;naam|hex|off|default&gt;</span> en <span class="mono">/region &lt;naam&gt;</span>. Eigen berichten tonen de gebruikte scope in de meta-badge; bij ontvangen berichten is de scope zichtbaar in Berichtinfo zodra de node ruwe pakketten doorstuurt.',
  'h.lat': 'Breedtegraad', 'h.lon': 'Lengtegraad', 'h.locInAdverts': 'Locatie in adverts', 'h.locNo': 'Niet meedelen', 'h.locYes': 'Meedelen in adverts', 'h.locHelp': 'Anderen zien je positie en afstand alleen als je dit aanzet.', 'h.locFromBrowser': 'Locatie van browser',
  'h.model': 'Model', 'h.firmware': 'Firmware', 'h.build': 'Build', 'h.limits': 'Limieten', 'h.deviceTime': 'Apparaattijd', 'h.battStorage': 'Batterij / opslag', 'h.syncTime': 'Tijd synchroniseren', 'h.rebootNode': 'Herstart node', 'h.blePin': 'Bluetooth-pincode (6 cijfers, 0 = uit)',
  'h.identity': 'Identiteit', 'h.showPrivKey': 'Privésleutel tonen', 'h.importPrivKey': 'Privésleutel importeren', 'h.factory': 'Fabrieksinstellingen',
  'h.language': 'Taal', 'h.themeLabel': 'Thema', 'h.themeSystem': 'Systeem', 'h.themeDark': 'Donker', 'h.themeLight': 'Licht', 'h.showTs': ' Tijdstempels tonen', 'h.showMeta': ' SNR/hops/scope-badge per bericht tonen', 'h.compact': ' Compacte weergave',
  'h.notif': ' Systeemmelding bij vermelding van mijn naam', 'h.debug': ' Debug: ruwe frames in het statusvenster', 'h.favOnlySetting': ' Zijbalk: alleen favoriete rooms, repeaters en sensoren tonen (favorieten van de node, ★ in Contacten)', 'h.staleDays': 'Contact geldt als "oud" na (dagen zonder advert)',
  'h.dataCallout': 'Berichten, aliassen en voorkeuren staan alleen in deze browser (localStorage). Er gaat niets naar een server. Room-wachtwoorden worden alleen bewaard als "automatisch inloggen" aanstaat.', 'h.fullConfig': 'Volledige configuratie',
  'h.fullConfigHelp': 'Node-instellingen (naam, radio, locatie, regio, opties, tuning), kanalen met sleutels, contacten en lokale voorkeuren. Importeren schrijft alles terug naar een (nieuwe) node.', 'h.exportKey': ' Privésleutel meenemen (identiteit overzetten; bewaar het bestand veilig)',
  'h.exportConfig': 'Configuratie exporteren', 'h.importConfig': 'Configuratie importeren', 'h.exportHistory': 'Geschiedenis exporteren', 'h.clearHistory': 'Geschiedenis wissen', 'h.forgetAll': 'Alles lokaal vergeten',
  'h.loginTo': 'Inloggen op ', 'h.password': 'Wachtwoord', 'h.pwHelp': "Room: gast- of adminwachtwoord. Repeater: adminwachtwoord (nodig voor CLI-commando's). Wordt versleuteld over het mesh verstuurd.", 'h.autoLogin': ' Automatisch inloggen bij verbinden (wachtwoord lokaal bewaren)', 'h.login': 'Inloggen',
  'h.regionsOf': "Regio's van ", 'h.repeaterReply': 'Antwoord van de repeater: ', 'h.region': 'Regio', 'h.nodeStdTitle': 'Als standaardregio van mijn node instellen', 'h.nodeStd': 'Node-std.', 'h.alsoGlobal': ' Gekozen node-standaard ook als globale verzendscope gebruiken', 'h.takeOver': 'Overnemen',
  'h.msgInfo': 'Berichtinfo', 'h.confirm': 'Bevestigen', 'h.input': 'Invoer',
  'h.author': 'Maker', 'h.source': 'Broncode', 'h.version': 'Versie', 'h.license': 'Licentie', 'h.independent': 'MeshChat is een onafhankelijk project, niet verbonden aan het MeshCore-team.', 'h.downloadTitle': 'Bewaar deze pagina als los HTML-bestand om hem offline of op je eigen server te gebruiken', 'h.download': '⬇ Download meshchat.html',
  'about.intro': 'IRC-achtige webclient voor <b>MeshCore</b>-companion-radio\'s. Eén HTML-bestand, geen server, geen installatie. Werkt in Chrome of Edge (desktop en Android); op iOS alleen Bluetooth via de Bluefy-browser.',
  'about.body': `<h4 class="sub">Verbinden</h4>
    <ol>
      <li><b>USB</b>: sluit de node aan, klik op USB en kies de COM-poort.</li>
      <li><b>Bluetooth</b>: klik op Bluetooth en kies de node. Op Windows verschijnt de eerste keer een pincode-vraag (standaard 123456); mislukt de eerste poging, klik dan gewoon nog een keer. De node mag niet tegelijk met de telefoon-app verbonden zijn.</li>
      <li>Werkt de knop niet vanaf een lokaal bestand, host het bestand dan via https of localhost.</li>
    </ol>
    <h4 class="sub">Vensters</h4>
    <ul>
      <li><b>MeshChat</b> (statusvenster): verbindingsinfo, systeemmeldingen, /commando's.</li>
      <li><b>Kanalen</b>: #public, hashtag-kanalen (sleutel volgt uit de naam) en privékanalen met gedeelde sleutel of wachtwoord. Toevoegen met + of <code>/join</code>.</li>
      <li><b>Rooms</b> (&amp;naam): log in met <code>/login wachtwoord</code>, daarna is gewone tekst een post.</li>
      <li><b>Privé</b>: directe berichten met bevestiging (✓). Openen via Contacten, de deelnemerslijst of <code>/msg naam tekst</code>.</li>
      <li><b>Repeaters &amp; sensoren</b>: gewone tekst gaat als CLI-commando (bv. <code>ver</code>, <code>get radio</code>, <code>neighbors</code>); log eerst in met het adminwachtwoord. Knoppen rechts: Status, Telemetrie, Trace, Pad zoeken, Pad reset.</li>
    </ul>
    <h4 class="sub">Zijbalk</h4>
    <p>Het zoekveld filtert tijdens het typen over alle kanalen en contacten (Enter opent het eerste resultaat). De ★-knop toont alleen de favorieten die op de node staan; favorieten zet je aan of uit met de ster in Contacten. Rechtsklik op een item voor meer acties.</p>
    <h4 class="sub">Berichten</h4>
    <p>Rechts van elk bericht staan SNR, RSSI, hops en scope. Rechtsklik, dubbelklik of lang indrukken opent <b>Berichtinfo</b> met het volledige pad (repeaters), transportcodes en het ruwe pakket, voor zover de firmware ruwe pakketten doorstuurt. Tab vult namen aan, pijl omhoog haalt eerdere invoer terug, @naam markeert iemand.</p>
    <h4 class="sub">Veelgebruikte commando's</h4>
    <table class="tbl cmds"><tbody>
      <tr><td><code>/join #naam</code> · <code>/join naam sleutel</code></td><td>kanaal toevoegen (hashtag, of privé met sleutel/wachtwoord)</td></tr>
      <tr><td><code>/part</code></td><td>kanaal van de node verwijderen</td></tr>
      <tr><td><code>/msg naam tekst</code> · <code>/query naam</code></td><td>privébericht / privévenster</td></tr>
      <tr><td><code>/login ww</code> · <code>/logout</code></td><td>in- en uitloggen op room of repeater</td></tr>
      <tr><td><code>/status</code> · <code>/telemetry</code> · <code>/trace</code> · <code>/path</code> · <code>/resetpath</code></td><td>node-diagnose voor het geopende contact</td></tr>
      <tr><td><code>/advert</code> · <code>/advert flood</code></td><td>eigen advert versturen</td></tr>
      <tr><td><code>/scope naam|off|default</code> · <code>/region naam</code></td><td>verzendscope en standaardregio (flood-scopes)</td></tr>
      <tr><td><code>/nick naam</code> · <code>/whois naam</code> · <code>/names</code> · <code>/list</code></td><td>naam wijzigen, contactinfo, deelnemers, overzicht</td></tr>
      <tr><td><code>/export</code> · <code>/import meshcore://…</code> · <code>/share naam</code> · <code>/del naam</code></td><td>contacten delen, importeren, verwijderen</td></tr>
      <tr><td><code>/time</code> · <code>/settime</code> · <code>/battery</code> · <code>/stats</code> · <code>/debug</code> · <code>/clear</code></td><td>node-informatie en onderhoud</td></tr>
    </tbody></table>
    <h4 class="sub">Instellingen</h4>
    <p>Via het tandwiel: taal, naam, telemetrie-rechten, auto-add, radio (met voorinstellingen), regio's, locatie, apparaat (tijd, BLE-pincode, herstart, privésleutel, fabrieksreset), weergave en gegevens. Onder Gegevens exporteer je de volledige configuratie als JSON en zet je die op een andere node terug.</p>
    <p class="mute">Alles wordt alleen lokaal in de browser opgeslagen. De sleutel van een wachtwoordkanaal is een MeshChat-conventie; deel voor andere apps de sleutel uit het infopaneel.</p>`,
};

I18N.en = {
  'nb.btn': 'Neighbours on map', 'nb.summary': 'Neighbours of {0}: {1} with a location, {2} without.', 'nb.unknown': 'Without location: {0}', 'map.tools.clearNb': 'Clear neighbours',
  'move.text': 'MeshChat has moved to its own address. Export your configuration, open the new address and import it there; then reinstall the app:', 'move.export': 'Export configuration', 'map.searchPh': 'Find node…', 'map.searchNone': 'No node with a location found for "{0}".', 'h.showOnMap': 'Show on map',
  'heard.via': 'heard via {0}', 'heard.ok': 'heard', 'heard.no': 'not heard', 'heard.wait': 'waiting for repeat…', 'ctx.resendSame': 'Resend (same line)',
  'map.legend.pending': 'pending advert', 'map_pending': 'Pending advert (not yet a contact on the node).', 'map_accept': 'Add', 'map_ignore': 'Ignore',
  // ---- path / retries ----
  'path.flood': 'flood', 'path.direct': 'direct (0 hops)', 'path.hops': '{0} hop(s) via {1}', 'path.tooLong': 'Path too long (max. 64 bytes).', 'path.set': 'Path to {0} set: {1}', 'path.cleared': 'Path to {0} cleared (flood).', 'path.setBtn': 'Set path', 'path.dlgTitle': 'Path to {0}', 'path.dlgInfo': '{0} hop(s) · {1} of {2} bytes', 'path.unknownHop': 'A hop in the path is not a known contact; remove it first.',
  'cmd.setpath': 'Set the path to a contact manually', 'cmd.sync': 'Fetch the node\'s queue now', 'cmd.resync': 'Room: fetch history again', 'cmd.map': 'Open the map or show a contact on it',
  'h.pathSet': 'Set path…', 'h.pathHelp': 'Choose, in order, the repeaters that messages to this contact should travel through (from you to the contact). An empty path means flood.', 'h.add': 'Add', 'h.pathFlood': 'Clear (flood)', 'h.pathHashSize': 'Hash size', 'h.cancel': 'Cancel', 'h.save': 'Save',
  'h.retries': 'Automatic resend (attempts, 0 = off)', 'h.retriesHelp': 'Retry when no acknowledgement arrives; from the second attempt the path is cleared and the message goes as flood.', 'retry.attempt': 'attempt {0}/{1}', 'retry.pathReset': 'Path to {0} cleared; next attempt as flood.',
  // ---- map / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Drain the node\'s message queue now', 'h.tabMap': 'Map', 'map.title': 'Map', 'map.topic': '{0} nodes with a known location · click a marker to open the conversation',
  'map.tools.fit': 'Show all', 'map.tools.me': 'My node', 'map.tools.live': 'Live packets', 'map.tools.settings': 'Offline maps…', 'map.legend.you': 'you', 'map.legend.repeater': 'repeater', 'map.legend.sensor': 'sensor',
  'map_unavailable': 'Map unavailable: no connection to the tile server (meshmanager.net) and no map cache in this browser.', 'map_offline_nocache': 'You are offline and no map tiles are cached yet.\nOpen the map once while connected, or preload countries in Settings › Map.', 'map_offline_missing': 'Some map parts are not cached; they will appear once you are back online.',
  'map_you': 'you', 'map_last_advert': 'advert {0} ago', 'map_open_chat': 'Open', 'map_info': 'Info', 'map_no_location': 'No location known for this contact.',
  'ctx.onMap': 'Show {0} on the map', 'ctx.onMapShort': 'Show on map', 'info.onMap': 'On map', 'info.sync': 'Sync', 'info.resync': 'Fetch history again', 'info.mapCache': 'Map cache', 'info.mapOffline': 'Offline maps…',
  'sync.done': '{0} messages fetched from the node.', 'sync.none': 'No new messages on the node.',
  'resync.title': 'Fetch history again', 'resync.text': 'The room {0} is removed from the node and re-added immediately so its sync point resets to zero. MeshChat then logs in again and the room pushes its stored posts. The path to the room has to be rediscovered; duplicate messages are filtered.', 'resync.btn': 'Fetch again', 'resync.started': 'Room re-added; login sent, the room is now pushing its history…', 'resync.needLogin': 'Room re-added. Log in to receive the history.', 'resync.onlyRoom': 'Rooms only.',
  'h.mapCallout': 'The map uses the self-hosted OpenStreetMap tiles of meshmanager.net. Everything you view or preload here is stored in this browser and works offline afterwards.', 'h.mapPersist': 'Pin storage', 'h.mapClear': 'Clear cache', 'h.mapOverview': 'Overview of all of Western Europe up to zoom', 'h.mapDetail': 'Detail per selected country up to zoom', 'h.mapCountries': 'Countries in high resolution', 'h.mapDownload': 'Preload', 'h.mapCancel': 'Stop',
  'map.cacheStats': 'Cached: {0} ({1} parts) · storage {2} of {3} used · {4}', 'map.persisted': 'pinned', 'map.notPersisted': 'not pinned (browser may evict)', 'map.persistOk': 'Storage pinned: the browser will no longer evict the map cache.', 'map.persistNo': 'The browser refused to pin storage (install as app or visit the site more often).', 'map.clearConfirm': 'Remove all cached map tiles ({0}) from this browser?', 'map.cleared': 'Map cache cleared.',
  'map.total': 'Selection: about {0} (overview {1} + countries {2})', 'map.progress': '{0} of {1} tiles · {2} cached · {3} errors', 'map.done': 'Preload finished: {0} tiles, {1} cached.', 'map.cancelled': 'Preload stopped.', 'map.needOnline': 'Preloading needs a connection to meshmanager.net.',
  'core.notConnected': 'not connected', 'core.connLost': 'connection lost', 'core.timeout': 'timeout (cmd {0})', 'core.err': 'error: {0}', 'core.errCode': 'code {0}', 'core.disabledFw': 'disabled in firmware',
  'err.1': 'command not supported', 'err.2': 'not found', 'err.3': 'table/queue full', 'err.4': 'invalid state', 'err.5': 'storage error', 'err.6': 'invalid argument',
  'ble.hintConnect': '{0} — make sure the node is not still connected to the phone app, and pair it in Windows first (Settings › Bluetooth › Add device, default PIN 123456).',
  'ble.hintStep': '{0} (step: {1}). On Windows: pair the node first via Settings › Bluetooth using the PIN (default 123456), or set the node\'s BLE PIN to 0 over a USB connection (Settings › Device). Make sure the phone app is not connected.',
  'ble.stepRx': 'RX characteristic', 'ble.stepTx': 'TX characteristic', 'ble.stepNotify': 'notifications',
  'adv.0': 'unknown', 'adv.1': 'chat', 'adv.2': 'repeater', 'adv.3': 'room', 'adv.4': 'sensor',
  'lpp.digIn': 'digital in', 'lpp.digOut': 'digital out', 'lpp.anIn': 'analog in', 'lpp.anOut': 'analog out', 'lpp.lux': 'illuminance', 'lpp.presence': 'presence', 'lpp.temp': 'temperature', 'lpp.hum': 'humidity', 'lpp.accel': 'accelerometer', 'lpp.press': 'barometric pressure', 'lpp.volt': 'voltage', 'lpp.curr': 'current', 'lpp.freq': 'frequency', 'lpp.pct': 'percentage', 'lpp.alt': 'altitude', 'lpp.power': 'power', 'lpp.dist': 'distance', 'lpp.energy': 'energy', 'lpp.dir': 'direction', 'lpp.gyro': 'gyro', 'lpp.gps': 'gps', 'lpp.unknown': 'type 0x{0}',
  'state.saveFail': 'Saving in browser failed: {0}',
  'path.hop1': '1 hop via {0}', 'path.hopN': '{0} hops via {1}', 'path.direct0': 'direct (0 hops)',
  'ago.never': 'never', 'ago.future': 'future', 'ago.s': '{0} s', 'ago.min': '{0} min', 'ago.h': '{0} h', 'ago.d': '{0} d',
  'route.0': 'transport flood (scoped)', 'route.1': 'flood', 'route.2': 'direct', 'route.3': 'transport direct (scoped)',
  'scope.codes': 'scope {0}', 'scope.none': 'unscoped', 'scope.default': 'default', 'scope.defaultNamed': 'default ({0})', 'scope.global': 'global', 'scope.globalNamed': 'global ({0})', 'scope.custom': 'scope',
  'ui.close': 'Close', 'ui.leave': 'Leave', 'ui.delete': 'Delete', 'ui.save': 'Save', 'ui.import': 'Import', 'ui.wipe': 'Wipe', 'ui.ok': 'OK',
  'batt.title': 'Battery {0} V', 'batt.storage': ' · storage {0}/{1} kB',
  'sb.favOnlyTitle': 'Favourites only (click for all)', 'sb.allTitle': 'All contacts (click for favourites only)',
  'sb.channels': 'Channels', 'sb.addChannel': 'Add channel', 'sb.rooms': 'Rooms', 'sb.loggedIn': 'Logged in', 'sb.notLoggedIn': 'Not logged in', 'sb.dm': 'Private', 'sb.startDm': 'Start private chat', 'sb.repeaters': 'Repeaters &amp; sensors',
  'sb.noAdvert': 'No advert > {0} d', 'sb.advertAgo': 'Advert {0} ago', 'sb.nothingFound': 'Nothing found for "{0}".', 'sb.favToastOn': 'Sidebar: favourites only', 'sb.favToastOff': 'Sidebar: all contacts',
  'msg.waitingReply': 'waiting for reply…', 'ack.ok': 'Confirmed', 'ack.fail': 'No confirmation', 'ack.pending': 'Waiting for confirmation', 'msg.new': 'new', 'msg.none': 'No messages yet.',
  'head.notConnected': 'Not connected. Choose USB or Bluetooth.', 'head.chPublic': 'Public channel', 'head.chHashtag': 'Hashtag channel', 'head.chPrivate': 'Private channel', 'head.key': 'key', 'head.seen1': '1 participant seen', 'head.seenN': '{0} participants seen', 'head.slot': 'slot {0}',
  'head.advertAgo': 'advert {0} ago', 'head.path': 'path {0}', 'head.loggedIn': 'logged in', 'head.notLoggedIn': 'not logged in',
  'scope.optGlobal': 'Region: global ({0})', 'scope.optDefault': 'Node default region', 'scope.optUnscoped': 'Unscoped (everywhere)', 'scope.optNew': '+ Other region…', 'scope.chanTitle': 'Region (flood scope) for messages in this channel: {0}',
  'compose.phRepeater': 'CLI command for the repeater (e.g. ver, get radio) or /command…', 'compose.phStatus': '/command (type /help)', 'compose.phSensor': 'CLI command for the sensor or /command…', 'compose.phMsg': 'Message or /command…',
  'users.lastAgo': 'last seen {0} ago', 'users.noContact': 'no contact',
  'info.node': 'Node', 'info.notConnected': 'Not connected.', 'info.ownNode': 'Own node', 'info.name': 'Name', 'info.key': 'Key', 'info.radio': 'Radio', 'info.region': 'Region', 'info.regionNone': 'none (default)', 'info.sendScope': 'Send scope', 'info.contacts': 'Contacts',
  'info.advertFlood': 'Advert (flood)', 'info.advert0': 'Advert (0-hop)', 'info.downloadTitle': 'Save this page as a standalone HTML file', 'info.channel': 'Channel', 'info.slot': 'Slot', 'info.copyKey': 'Copy key',
  'info.title': 'Info · {0}', 'info.type': 'Type', 'info.advertName': 'Advert name', 'info.advert': 'Advert', 'info.path': 'Path', 'info.location': 'Location', 'info.login': 'Login', 'info.loggedIn': 'logged in', 'info.admin': ' (admin)', 'info.notLoggedIn': 'not logged in', 'info.note': 'Note',
  'info.status': 'Status', 'info.telemetry': 'Telemetry', 'info.trace': 'Trace', 'info.discover': 'Find path', 'info.pathReset': 'Reset path', 'info.logout': 'Logout', 'info.loginBtn': 'Login', 'info.edit': 'Edit',
  'cmd.help': 'List of commands', 'cmd.about': 'About MeshChat: version, manual, author', 'cmd.connect': 'Connect to the node', 'cmd.connect.arg': 'usb|ble', 'cmd.disconnect': 'Disconnect',
  'cmd.join': 'Open or add a channel', 'cmd.join.arg': '#channel [key|password]', 'cmd.part': 'Remove channel from the node', 'cmd.part.arg': '[channel]',
  'cmd.msg': 'Send a private message', 'cmd.msg.arg': '<nick> <text>', 'cmd.query': 'Open a private window', 'cmd.query.arg': '<nick>', 'cmd.me': 'Action message', 'cmd.me.arg': '<text>',
  'cmd.nick': 'Change your name', 'cmd.nick.arg': '<name>', 'cmd.whois': 'Show contact info', 'cmd.whois.arg': '<nick>', 'cmd.names': 'Show participants', 'cmd.list': 'Channels and contacts', 'cmd.contacts': 'Fully reload the contact list from the node',
  'cmd.advert': 'Send your own advert', 'cmd.advert.arg': '[flood]', 'cmd.login': 'Log in to room/repeater', 'cmd.login.arg': '[password]', 'cmd.logout': 'Log out',
  'cmd.cli': 'CLI command to repeater', 'cmd.cli.arg': '<command>', 'cmd.status': 'Request statistics', 'cmd.telemetry': 'Request telemetry', 'cmd.telemetry.arg': '[nick]',
  'cmd.trace': 'Trace the path with SNR per hop', 'cmd.trace.arg': '[nick]', 'cmd.path': 'Rediscover the path', 'cmd.path.arg': '[nick]', 'cmd.resetpath': 'Clear the path (back to flood)', 'cmd.resetpath.arg': '[nick]',
  'cmd.scope': 'Choose send scope (region)', 'cmd.scope.arg': '<name|hex|off|default>', 'cmd.region': 'Set the node\'s default region', 'cmd.region.arg': '<name> [hex]', 'cmd.regions': 'Fetch regions from a repeater and pick', 'cmd.regions.arg': '[repeater]',
  'cmd.export': 'Contact as meshcore:// URI', 'cmd.export.arg': '[nick]', 'cmd.import': 'Import a contact', 'cmd.import.arg': '<meshcore://…>', 'cmd.share': 'Share contact on the mesh', 'cmd.share.arg': '<nick>', 'cmd.del': 'Delete a contact', 'cmd.del.arg': '<nick>',
  'cmd.time': 'Node time', 'cmd.settime': 'Synchronise time', 'cmd.battery': 'Battery', 'cmd.stats': 'Node statistics',
  'cmd.raw': 'Send a raw command frame', 'cmd.raw.arg': '<hex>', 'cmd.debug': 'Debug output on/off', 'cmd.clear': 'Clear window', 'cmd.theme': 'Theme', 'cmd.theme.arg': 'dark|light|auto', 'cmd.quit': 'Disconnect and close window',
  'conn.noBle': 'Web Bluetooth is not supported by this browser (use Chrome/Edge, or Bluefy on iOS).', 'conn.noSerial': 'Web Serial is not supported by this browser (use Chrome/Edge on desktop or Android).',
  'status.connecting': 'Connecting…', 'status.syncing': 'Synchronising…', 'status.connected': 'Connected · {0}', 'status.off': 'Not connected',
  'conn.cancelled': 'Connection cancelled.', 'conn.failed': 'Connection failed: {0}', 'conn.defaultModel': 'MeshCore node', 'conn.build': ', build {0}',
  'conn.connectedVia': 'Connected via {0} to {1} (fw {2}{3}) · node "{4}"', 'conn.radio': 'Radio {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm', 'conn.clockSynced': 'Node clock synchronised (was {0} s behind).',
  'contacts.syncedIncr': '{0} changed contacts synchronised ({1} total, from cache).', 'contacts.loaded': '{0} contacts loaded from the node.', 'contacts.reloaded': 'Contact list fully reloaded.',
  'conn.lost': 'Connection to the node lost.', 'conn.lostToast': 'Connection lost',
  'ev.advertFrom': 'Advert from {0}{1}', 'ev.new': ' (new)', 'ev.pathUpdated': 'Path to {0} updated: {1}', 'ev.newNode': 'New node seen: {0} ({1}). Add it via Contacts › Pending adverts.', 'ev.newNodeToast': 'New node: {0} ({1})',
  'ev.contactDeleted': 'Contact {0} was removed from the node.', 'ev.contactsFull': 'The node\'s contact list is full',
  'login.ok': 'Logged in to {0}{1}.', 'login.asAdmin': ' as admin', 'login.okToast': 'Logged in to {0}', 'login.denied': 'Login to {0} denied (wrong password?).',
  'stats.raw': 'raw: {0}', 'stats.line1': 'battery {0} V · uptime {1} · tx queue {2}', 'stats.line2': 'noise floor {0} dBm · last RSSI {1} dBm{2}', 'stats.lastSnr': ' · last SNR {0} dB',
  'stats.line3': 'received {0} (flood {1}, direct {2}) · sent {3} (flood {4}, direct {5})', 'stats.line4': 'airtime tx {0}{1}{2}{3}', 'stats.rx': ' · rx {0}', 'stats.fullEvents': ' · queue-full {0}', 'stats.dups': ' · dups direct/flood {0}/{1}',
  'telem.noData': '(no data)', 'telem.cmd': 'telemetry',
  'trace.hop': 'hop {0}: {1}  SNR {2} dB', 'trace.back': 'back at me: SNR {0} dB',
  'disc.cmd': 'find path', 'disc.text': 'out ({0} hops): {1}\nback ({2} hops): {3}', 'disc.direct': 'direct',
  'send.notConnected': 'Not connected to a node.', 'send.chanGone': 'Channel is no longer on the node.', 'send.failed': 'Sending failed: {0}', 'send.noContact': 'Contact not found.', 'send.roomNotLoggedIn': 'You are not logged in to this room. Use /login <password>.',
  'cli.noReply': 'no reply from {0} within {1} s', 'cli.notLoggedIn': 'Not logged in: there may be no reply. Use /login <password>.', 'cli.noAnswer': '(no reply)', 'cli.err': 'error: {0}',
  'login.sent': 'Login sent to {0} ({1})…', 'login.noReply': 'No reply to login from {0}.', 'login.failed': 'Login failed: {0}',
  'scope.noFwSupport2': 'This firmware does not support flood scopes (regions); message goes without a scope change.', 'scope.noFwSupport': 'This firmware does not support flood scopes (regions).',
  'scope.chanSet': 'Region for this channel: {0}', 'scope.followsGlobal': 'follows the global send scope ({0})', 'scope.sendScope': 'Send scope: {0}',
  'cmd.contactNotFound': 'Contact "{0}" not found.', 'cmd.noContactSel': 'No contact selected. Give a name.',
  'help.list': 'Commands: {0}', 'help.hint': 'Type /about for the manual. Type / to see the list with explanations. In a repeater window plain text is sent as a CLI command to the repeater; in a room as a post; in a channel or private window as a message.',
  'nick.current': 'Current name: {0}', 'nick.changed': 'Name changed to {0}. Send an advert so others see it (/advert flood).',
  'whois.text': '{0} · {1} · key {2} · advert {3} · path {4}{5}{6}', 'whois.loc': ' · location {0},{1}', 'whois.snr': ' · SNR {0}',
  'names.seen': 'Seen: {0}', 'names.contacts': 'Contacts: {0}', 'list.channels': 'Channels: {0}', 'list.rooms': 'Rooms: {0} · Repeaters: {1}',
  'advert.sent': 'Advert sent ({0}).', 'advert.zeroHop': 'zero-hop', 'advert.sentToast': 'Advert sent',
  'login.openFirst': 'Open a room or repeater first.', 'logout.done': 'Logged out from {0}', 'cli.openFirst': 'Open a repeater/room first.',
  'status.sent': 'Status request sent to {0}…', 'telem.sent': 'Telemetry request sent to {0}…', 'trace.noPath': 'No known path to {0} (flood). Try /path.', 'trace.sent': 'Trace sent via {0}…', 'disc.sent': 'Path discovery sent to {0}…', 'path.reset': 'Path to {0} cleared (flood).',
  'export.self': 'Own node', 'import.done': 'Contact imported.', 'share.done': 'Contact {0} shared on the mesh.',
  'time.node': 'Node time: {0} (offset {1} s)', 'time.synced': 'Time synchronised.', 'batt.notice': 'Battery {0} V{1}',
  'raw.reply': 'reply: {0}', 'debug.toggle': 'Debug {0}', 'debug.on': 'on', 'debug.off': 'off', 'cmd.unknown': 'Unknown command: {0} (type /help)',
  'nodestats.line1': 'battery {0} V · uptime {1} · errors 0x{2} · queue {3}', 'nodestats.line2': 'noise floor {0} dBm · last RSSI {1} dBm · last SNR {2} dB · airtime tx {3} rx {4}',
  'nodestats.line3': 'packets: received {0} · sent {1} · flood tx/rx {2}/{3} · direct tx/rx {4}/{5} · rx errors {6}', 'nodestats.unavailable': 'Statistics unavailable (older firmware?): {0}',
  'scope.chanCurrent': 'Region of this channel: {0}. Use /scope <name|off|default|global>.', 'scope.current': 'Send scope: {0}{1}', 'scope.nodeDefault': ' · node default region: {0} ({1})', 'scope.noNodeDefault': ' · no default region on the node', 'scope.set': 'Send scope set: {0}',
  'region.cleared': 'Node default region cleared.', 'region.set': 'Default region set: {0} ({1}).',
  'clip.copied': 'Copied to clipboard', 'clip.failed': 'Copy failed',
  'join.badKey': 'Invalid key: 32 hex characters or 24 base64 characters expected.', 'join.usage': 'Give a #hashtag, or a name with key/password: /join name <key|password>', 'join.exists': 'Channel already present.',
  'join.full': 'All {0} channel slots on the node are in use. Leave a channel first.', 'join.added': 'Channel {0} added in slot {1} · key {2}',
  'leave.notFound': 'Channel not found.', 'leave.title': 'Leave channel', 'leave.text': '"{0}" will be removed from the node (slot {1}). Local history is kept. Key: {2}', 'leave.done': 'Channel {0} removed.',
  'del.title': 'Delete contact', 'del.text': 'Remove {0} ({1}) from the node? Local history is kept.', 'del.failed': 'Delete failed: {0}', 'del.done': '{0} deleted',
  'ch.phPassword': 'password', 'ch.phKey': '32 hex characters or base64',
  'ch.helpPublic': 'The default public channel (fixed key izOH6cXN6mrJ5e26oRXNcg==).', 'ch.helpHashtag': 'Key = first 16 bytes of SHA-256 of the name incl. #, in lower case. Compatible with the official app.',
  'ch.helpKey': 'Shared 128-bit key, as shown/shared by the official app (base64 or hex). Name is free to choose.', 'ch.helpPassword': 'Key = first 16 bytes of SHA-256 of the password. Only compatible with other MeshChat users with the same password; otherwise share the key (shown in the info panel).',
  'ch.needName': 'Enter a name', 'ch.needSecret': 'Enter a key or password',
  'ct.of': ' of {0}', 'ct.max': ' · max {0}', 'ct.prune': 'Remove stale ({0})', 'ct.fav': 'Favourite', 'ct.loggedIn': 'logged in', 'ct.console': 'Console', 'ct.chat': 'Chat', 'ct.info': 'Info', 'ct.none': 'No contacts.', 'ct.accept': 'Add', 'ct.ignore': 'Ignore',
  'ct.pubLen': 'Public key must be 64 hex characters', 'ct.added': 'Contact added', 'ct.addedName': '{0} added', 'ct.addFailed': 'Adding failed: {0}', 'ct.updateFailed': 'Update on node failed: {0}',
  'prune.title': 'Remove stale contacts', 'prune.text': 'Remove {0} contacts without an advert in the last {1} days from the node? Favourites are kept.', 'prune.done': '{0} contacts removed',
  'ct.importTitle': 'Import contact', 'ct.importLabel': 'meshcore://… URI (from "Share contact" in the app)', 'ct.reloaded': 'Contacts fully reloaded', 'ct.contactsFile': 'meshchat-contacts.json', 'ct.uriTitle': 'Contact URI · {0}', 'ct.uriLabel': 'Share this meshcore:// link',
  'set.limits': '{0} contacts · {1} channels', 'set.protocol': ' (protocol v{0})', 'set.storage': 'Browser storage: {0} kB · {1} messages', 'set.repeatAllowed': 'Client repeat allowed on: {0}',
  'rg.nodeTag': 'node default region', 'rg.node': 'node', 'rg.globalTag': 'global send scope', 'rg.global': 'global', 'rg.useGlobal': 'Use as global send scope', 'rg.globalBtn': 'Global', 'rg.useNode': 'Set as default region on the node', 'rg.nodeBtn': 'Node',
  'rg.none': 'No regions yet. Add one or fetch them from a repeater.', 'rg.loggedIn': ' (logged in)', 'rg.noRepeaters': '— no repeaters —',
  'rg.needName': 'Enter a region name', 'rg.pickRepeater': 'Choose a repeater', 'rg.loginFirst': 'Log in to {0} first (admin) — the window is being opened', 'rg.waiting': 'Waiting for reply…', 'rg.noneRecognized': 'No region names recognised in the reply: {0}',
  'rg.known': '(already known)', 'rg.home': 'home', 'rg.discoverBtn': 'Fetch regions from repeater', 'rg.setNodeFailed': 'Setting default region on node failed: {0}', 'rg.applied': '{0} regions applied', 'rg.added': 'Region added: {0}', 'rg.nodeSet': 'Node default region: {0}',
  'node.saved': 'Node settings saved', 'node.savedNotice': 'Node settings updated. Send an advert to announce the new name.', 'loc.saved': 'Location saved',
  'radio.invalid': 'Invalid radio values', 'radio.title': 'Radio settings', 'radio.confirm': 'Frequency {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm. All nodes in your network must use the same values; otherwise you will not hear anyone.',
  'radio.repeatNotAllowed': 'Client repeat is not allowed on this frequency', 'radio.hashUnsupported': 'Path hash mode not supported', 'radio.saved': 'Radio saved', 'radio.setNotice': 'Radio set: {0} MHz · BW {1} · SF{2} · CR{3} · {4} dBm',
  'tuning.saved': 'Tuning saved', 'region.clearedToast': 'Region cleared', 'region.saved': 'Region saved', 'scope.needNameOrKey': 'Enter a region name or key',
  'pin.invalid': 'PIN: 6 digits or 0 to disable', 'pin.saved': 'BLE PIN saved (active after restart)',
  'pk.exportTitle': 'Export private key', 'pk.exportWarn': 'Anyone with this key can impersonate your node and read your private messages. Keep it in a safe place only.', 'pk.show': 'Show', 'pk.hexTitle': 'Private key (hex, 64 bytes)', 'pk.copyKeep': 'Copy and keep safe', 'pk.exportFailed': 'Export not possible: {0}',
  'pk.importTitle': 'Import private key', 'pk.hex128': '128 hex characters', 'pk.expect128': 'Expected 128 hex characters', 'pk.replaceTitle': 'Replace identity', 'pk.replaceText': 'The node gets a different identity (public key). Contacts will see you as a new node. Restart afterwards.', 'pk.imported': 'Private key imported; restart the node',
  'cfg.pkNotExportable': 'Private key not exportable: {0}', 'cfg.historyFile': 'meshchat-history.json', 'cfg.badJson': 'Invalid JSON file', 'cfg.notMeshchat': 'Not a MeshChat configuration',
  'cfg.partNode': 'node settings (name, radio, location, region, options)', 'cfg.partChannels': '{0} channels', 'cfg.partContacts': '{0} contacts', 'cfg.partPk': 'PRIVATE KEY (identity)', 'cfg.partLocal': 'local preferences, aliases and room passwords',
  'cfg.importTitle': 'Import configuration', 'cfg.apply': 'Apply: {0}.', 'cfg.applyConn': ' Node settings are written to the node immediately.', 'cfg.applyOffline': ' Not connected: only local data is applied.',
  'cfg.doneErr': 'Import finished with {0} error(s); see the status window with /debug', 'cfg.done': 'Configuration imported', 'cfg.pkImportedNotice': 'Private key imported: restart the node (Settings › Device).', 'cfg.localDone': 'Local data imported (not connected)',
  'ctx.msgInfo': 'Message info (path, scope, raw)…', 'ctx.reply': 'Reply to {0}', 'ctx.dm': 'Private message to {0}', 'ctx.contactInfo': 'Contact info {0}', 'ctx.copyText': 'Copy text', 'ctx.copyRaw': 'Copy raw packet (hex)', 'ctx.resend': 'Resend', 'ctx.deleteLocal': 'Delete message (locally)',
  'ctx.open': 'Open', 'ctx.markRead': 'Mark as read', 'ctx.contactInfoDots': 'Contact info…', 'ctx.logout': 'Log out', 'ctx.login': 'Log in…', 'ctx.leaveChannel': 'Leave channel', 'ctx.closeWindow': 'Close window', 'ctx.clearHistory': 'Clear history',
  'ctx.dmShort': 'Private message', 'ctx.whois': 'Whois in window', 'ctx.mention': 'Mention',
  'mi.time': 'Time', 'mi.received': ' · received {0}', 'mi.from': 'From', 'mi.authorPrefix': 'author prefix {0}', 'mi.window': 'Window', 'mi.delivery': 'Delivery', 'mi.confirmed': '✓ confirmed', 'mi.after': ' after {0} ms', 'mi.noAck': '✗ no confirmation', 'mi.pending': 'waiting for confirmation', 'mi.chanNoAck': 'channel message (no ACK possible)',
  'mi.route': 'Route', 'mi.ackCode': 'ACK code', 'mi.sendScope': 'Send scope', 'mi.hops': 'Hops', 'mi.hashSize': ' · hash size {0} B', 'mi.type': 'Type', 'mi.typeText': 'text', 'mi.typeSigned': 'signed (room)',
  'mi.rawRoute': 'Raw route', 'mi.payload': ' · payload {0} · v{1}', 'mi.scopeCodes': 'Scope (transport codes)', 'mi.nodeRegion': ' <span class="mute">(node region: {0})</span>', 'mi.path': 'Path', 'mi.unknownNode': 'unknown node', 'mi.noRepeaters': 'no intermediate repeaters', 'mi.rawPacket': 'Raw packet',
  'mi.rawUnavailable': 'not available: the node only forwards raw packets when rx logging is active in the firmware (message received before connecting, or firmware without LOG_RX).', 'mi.pathHidden': '{0} hop(s); the intermediate repeaters are only visible via the raw packet.',
  'scope.otherTitle': 'Other region', 'scope.otherLabel': 'Region name (e.g. Antwerp) or 32-character hex key', 'chkey.title': 'Channel key · {0}', 'chkey.label': 'Hex (share this with whoever may read along) · base64: {0}',
  'geo.unavailable': 'Geolocation not available', 'geo.taken': 'Location taken from the browser', 'geo.failed': 'Geolocation failed: {0}',
  'time.syncedToast': 'Time synchronised', 'reboot.title': 'Restart node', 'reboot.text': 'The connection will drop and must be re-established.', 'reboot.btn': 'Restart', 'reboot.sent': 'Restart sent',
  'factory.title': 'Factory reset', 'factory.text': 'ALL settings, contacts, channels and the node\'s identity will be erased. Export your configuration first (Data tab). Continue?', 'factory.done': 'Factory reset done',
  'hist.clearTitle': 'Clear history', 'hist.clearText': 'Delete all locally stored messages? Contacts and settings are kept.', 'forget.title': 'Forget everything', 'forget.text': 'Erase all local MeshChat data (history, aliases, room passwords, settings) from this browser? The node itself is not changed.',
  'init.welcome': 'Welcome to MeshChat. Connect your MeshCore companion via USB (Web Serial) or Bluetooth (Web Bluetooth) with the buttons at the top. Type /help for the commands.',
  'init.noSupport': 'This browser supports neither Web Serial nor Web Bluetooth. Use Chrome or Edge (desktop or Android). On iOS only Bluetooth works, via the Bluefy browser.',
  'init.fileTip': 'Tip: some browsers block Web Serial/Bluetooth on file:// pages. If it does not work, host the file via https or localhost.',
  'dl.done': 'meshchat.html downloaded. Open it in Chrome or Edge; for USB/Bluetooth host it via https or localhost.', 'dl.failed': 'Download failed: {0}',
  'update.available': 'New version available: v{0} (now v{1})', 'update.reload': 'Reload',
  'h.showChannels': 'Show channels', 'h.usbTitle': 'Connect via USB (Web Serial)', 'h.btTitle': 'Connect via Bluetooth (Web Bluetooth)', 'h.disconnect': 'Disconnect', 'h.battTitle': 'Battery voltage', 'h.nickTitle': 'Own name (nick)',
  'h.lang': 'Language', 'h.theme': 'Toggle theme', 'h.aboutAria': 'About MeshChat and manual', 'h.aboutTitle': 'Manual', 'h.settings': 'Settings', 'h.showUsers': 'Show participants',
  'h.sidebarAria': 'Channels and contacts', 'h.searchPh': 'Search channel or contact…', 'h.searchAria': 'Search sidebar', 'h.favOnly': 'Show favourites only', 'h.contacts': 'Contacts',
  'h.chanScopeTitle': 'Region (flood scope) for messages in this channel', 'h.chanScopeAria': 'Region for this channel', 'h.info': 'Info', 'h.leave': 'Leave', 'h.messages': 'Messages', 'h.toNewest': 'Go to newest messages', 'h.newMessages': 'New messages',
  'h.commands': 'Commands', 'h.message': 'Message', 'h.send': 'Send', 'h.sendBtn': 'Send', 'h.users': 'Participants',
  'h.addChannel': 'Add channel', 'h.close': 'Close', 'h.ctHashtag': 'Hashtag <code>#name</code><small>Key derived from the name · open to anyone who knows the name</small>', 'h.ctKey': 'Private with key<small>Shared 128-bit key (hex or base64), any name</small>',
  'h.ctPassword': 'Private with password<small>Key derived from a password</small>', 'h.ctPublic': 'Public<small>The default channel, fixed key</small>', 'h.name': 'Name', 'h.max31': 'Max. 31 characters.', 'h.keyOrPw': 'Key or password', 'h.keyPh': '32 hex characters or base64', 'h.generate': 'Generate', 'h.cancel': 'Cancel', 'h.add': 'Add',
  'h.ctSearchPh': 'Search by name, key, note…', 'h.ctSearchAria': 'Search contacts', 'h.type': 'Type', 'h.allTypes': 'All types', 'h.sort': 'Sort', 'h.sortRecent': 'Most recent advert', 'h.sortName': 'Name', 'h.sortType': 'Type', 'h.sortDist': 'Distance', 'h.showStale': ' Also show stale',
  'h.pendingAdverts': 'Pending adverts (manual add is on)', 'h.lastAdvert': 'Last advert', 'h.path': 'Path', 'h.advertFlood': 'Advert (flood)', 'h.advert0': 'Advert (0-hop)', 'h.pruneOld': 'Remove stale', 'h.refreshTitle': 'Fetch the full list from the node again (normally only changes are synchronised)', 'h.refresh': 'Refresh',
  'h.addManual': 'Add manually', 'h.importUri': 'Import (meshcore://)', 'h.export': 'Export',
  'h.contact': 'Contact', 'h.nameFromAdvert': 'Name from advert', 'h.aliasLocal': 'Alias (local)', 'h.aliasPh': 'your own name for this contact', 'h.noteLocal': 'Note (local)', 'h.notePh': 'e.g. roof of the water tower, admin = Wim', 'h.typeOnNode': 'Type (on the node)',
  'h.telemPerm': 'Telemetry permissions (0–127)', 'h.telemPermHelp': 'Used when telemetry is set to "per contact".', 'h.favLabel': ' Favourite (not overwritten automatically when the node is full)', 'h.pubKey': 'Public key', 'h.copy': 'Copy', 'h.location': 'Location', 'h.pathOut': 'Path (outgoing)',
  'h.discover': 'Find path', 'h.pathReset': 'Reset path', 'h.shareUri': 'Share URI', 'h.shareMesh': 'Share on mesh', 'h.delete': 'Delete', 'h.open': 'Open', 'h.save': 'Save',
  'h.addContactManual': 'Add contact manually', 'h.pubKey64': 'Public key (64 hex)', 'h.manualCallout': 'Got a <span class="mono">meshcore://</span> link? Use "Import" in the contacts window instead; it also contains the signature and location.',
  'h.tabNode': 'Node', 'h.tabRadio': 'Radio', 'h.tabRegion': 'Regions', 'h.tabLocation': 'Location', 'h.tabDevice': 'Device', 'h.tabView': 'Display', 'h.tabData': 'Data',
  'h.nameNick': 'Name (nick)', 'h.nameHelp': 'Visible in adverts and channel messages. Send an advert after changing it.', 'h.manualAdd': ' Add contacts manually (approve new adverts first)',
  'h.aaChat': ' Auto-add chat', 'h.aaRpt': ' Repeaters', 'h.aaRoom': ' Rooms', 'h.aaSensor': ' Sensors', 'h.aaOverwrite': ' Overwrite oldest (non-favourite) when full', 'h.aaHops': 'Max. hops for auto-add (empty = no limit)',
  'h.telemShare': 'Share telemetry', 'h.telemBase': 'Basic (battery, temp.)', 'h.never': 'Never', 'h.perContactPerm': 'Per contact (permissions)', 'h.everyone': 'Everyone', 'h.perContact': 'Per contact', 'h.telemEnv': 'Environment (sensors)',
  'h.multiAcks': ' Send multiple ACKs (more reliable, more airtime)', 'h.sendAdvert': 'Send advert',
  'h.radioCallout': 'All nodes in the network must use the same frequency, bandwidth, SF and CR. Changes take effect immediately after saving.', 'h.preset': 'Preset', 'h.choose': '— choose —', 'h.presetEu869': 'EU/UK 869.618 · BW250 · SF11 · CR5 (default)',
  'h.freq': 'Frequency (MHz)', 'h.bw': 'Bandwidth (kHz)', 'h.txPower': 'TX power (dBm)', 'h.hashSize': 'Path hash size', 'h.hash1': '1 byte (default)', 'h.hash2': '2 bytes', 'h.hash3': '3 bytes',
  'h.clientRepeat': ' Client repeat: this node also repeats packets (only on allowed frequencies)', 'h.saveRadio': 'Save radio', 'h.tuning': 'Tuning (advanced)', 'h.rxDelay': 'RX delay base', 'h.airtimeFactor': 'Airtime factor', 'h.saveTuning': 'Save tuning',
  'h.regionCallout': 'Regions (flood scopes, firmware ≥ 1.10) limit how far floods travel: repeaters only repeat packets of their own region. A region\'s key follows from its name (SHA-256 of "#name", 16 bytes), unless the administrator shares a custom key.',
  'h.nodeDefaultRegion': 'Node default region', 'h.regionNamePh': 'e.g. Limburg', 'h.keyHex32': 'Key (hex, 32)', 'h.deriveFromNamePh': 'empty = derive from name', 'h.derive': 'Derive', 'h.clearRegion': 'Clear region', 'h.saveRegion': 'Save region',
  'h.myRegions': 'My regions', 'h.key': 'Key', 'h.rgNamePh': 'name, e.g. be-vlg', 'h.rgKeyPh': 'key (empty = derive)', 'h.repeater': 'Repeater', 'h.discoverRegions': 'Fetch regions from repeater', 'h.discoverHelp': 'Sends the CLI command <span class="mono">region</span>; admin login is required.',
  'h.sessionScope': 'Send scope for this session', 'h.scopeOnSend': 'Scope when sending', 'h.scopeDefault': 'Node default region', 'h.scopeUnscoped': 'Unscoped (floods go everywhere)', 'h.scopeCustom': 'Other region…', 'h.regionName': 'Region name', 'h.regionNamePh2': 'e.g. Antwerp', 'h.keyHex': 'Key (hex)', 'h.derivePh': 'empty = derive', 'h.apply': 'Apply',
  'h.scopeHelp': 'Also via <span class="mono">/scope &lt;name|hex|off|default&gt;</span> and <span class="mono">/region &lt;name&gt;</span>. Your own messages show the scope used in the meta badge; for received messages the scope is visible in Message info once the node forwards raw packets.',
  'h.lat': 'Latitude', 'h.lon': 'Longitude', 'h.locInAdverts': 'Location in adverts', 'h.locNo': 'Do not share', 'h.locYes': 'Share in adverts', 'h.locHelp': 'Others only see your position and distance if you enable this.', 'h.locFromBrowser': 'Location from browser',
  'h.model': 'Model', 'h.firmware': 'Firmware', 'h.build': 'Build', 'h.limits': 'Limits', 'h.deviceTime': 'Device time', 'h.battStorage': 'Battery / storage', 'h.syncTime': 'Synchronise time', 'h.rebootNode': 'Restart node', 'h.blePin': 'Bluetooth PIN (6 digits, 0 = off)',
  'h.identity': 'Identity', 'h.showPrivKey': 'Show private key', 'h.importPrivKey': 'Import private key', 'h.factory': 'Factory reset',
  'h.language': 'Language', 'h.themeLabel': 'Theme', 'h.themeSystem': 'System', 'h.themeDark': 'Dark', 'h.themeLight': 'Light', 'h.showTs': ' Show timestamps', 'h.showMeta': ' Show SNR/hops/scope badge per message', 'h.compact': ' Compact view',
  'h.notif': ' System notification when my name is mentioned', 'h.debug': ' Debug: raw frames in the status window', 'h.favOnlySetting': ' Sidebar: only show favourite rooms, repeaters and sensors (node favourites, ★ in Contacts)', 'h.staleDays': 'Contact counts as "stale" after (days without advert)',
  'h.dataCallout': 'Messages, aliases and preferences live only in this browser (localStorage). Nothing is sent to a server. Room passwords are only kept when "log in automatically" is on.', 'h.fullConfig': 'Full configuration',
  'h.fullConfigHelp': 'Node settings (name, radio, location, region, options, tuning), channels with keys, contacts and local preferences. Importing writes everything back to a (new) node.', 'h.exportKey': ' Include private key (transfer identity; keep the file safe)',
  'h.exportConfig': 'Export configuration', 'h.importConfig': 'Import configuration', 'h.exportHistory': 'Export history', 'h.clearHistory': 'Clear history', 'h.forgetAll': 'Forget everything locally',
  'h.loginTo': 'Log in to ', 'h.password': 'Password', 'h.pwHelp': 'Room: guest or admin password. Repeater: admin password (needed for CLI commands). Sent encrypted over the mesh.', 'h.autoLogin': ' Log in automatically when connecting (store password locally)', 'h.login': 'Log in',
  'h.regionsOf': 'Regions from ', 'h.repeaterReply': 'Reply from the repeater: ', 'h.region': 'Region', 'h.nodeStdTitle': 'Set as my node\'s default region', 'h.nodeStd': 'Node default', 'h.alsoGlobal': ' Also use the chosen node default as global send scope', 'h.takeOver': 'Apply',
  'h.msgInfo': 'Message info', 'h.confirm': 'Confirm', 'h.input': 'Input',
  'h.author': 'Author', 'h.source': 'Source code', 'h.version': 'Version', 'h.license': 'Licence', 'h.independent': 'MeshChat is an independent project, not affiliated with the MeshCore team.', 'h.downloadTitle': 'Save this page as a standalone HTML file to use it offline or on your own server', 'h.download': '⬇ Download meshchat.html',
  'about.intro': 'IRC-like web client for <b>MeshCore</b> companion radios. One HTML file, no server, no installation. Works in Chrome or Edge (desktop and Android); on iOS only Bluetooth via the Bluefy browser.',
  'about.body': `<h4 class="sub">Connecting</h4>
    <ol>
      <li><b>USB</b>: plug in the node, click USB and choose the COM port.</li>
      <li><b>Bluetooth</b>: click Bluetooth and choose the node. On Windows a PIN prompt appears the first time (default 123456); if the first attempt fails, simply click once more. The node must not be connected to the phone app at the same time.</li>
      <li>If the button does not work from a local file, host the file via https or localhost.</li>
    </ol>
    <h4 class="sub">Windows</h4>
    <ul>
      <li><b>MeshChat</b> (status window): connection info, system notices, /commands.</li>
      <li><b>Channels</b>: #public, hashtag channels (key follows from the name) and private channels with a shared key or password. Add with + or <code>/join</code>.</li>
      <li><b>Rooms</b> (&amp;name): log in with <code>/login password</code>, after that plain text is a post.</li>
      <li><b>Private</b>: direct messages with confirmation (✓). Open via Contacts, the participant list or <code>/msg name text</code>.</li>
      <li><b>Repeaters &amp; sensors</b>: plain text is sent as a CLI command (e.g. <code>ver</code>, <code>get radio</code>, <code>neighbors</code>); log in first with the admin password. Buttons on the right: Status, Telemetry, Trace, Find path, Reset path.</li>
    </ul>
    <h4 class="sub">Sidebar</h4>
    <p>The search box filters all channels and contacts as you type (Enter opens the first result). The ★ button shows only the favourites stored on the node; toggle favourites with the star in Contacts. Right-click an item for more actions.</p>
    <h4 class="sub">Messages</h4>
    <p>To the right of each message are SNR, RSSI, hops and scope. Right-click, double-click or long-press opens <b>Message info</b> with the full path (repeaters), transport codes and the raw packet, as far as the firmware forwards raw packets. Tab completes names, arrow up recalls earlier input, @name highlights someone.</p>
    <h4 class="sub">Common commands</h4>
    <table class="tbl cmds"><tbody>
      <tr><td><code>/join #name</code> · <code>/join name key</code></td><td>add a channel (hashtag, or private with key/password)</td></tr>
      <tr><td><code>/part</code></td><td>remove channel from the node</td></tr>
      <tr><td><code>/msg name text</code> · <code>/query name</code></td><td>private message / private window</td></tr>
      <tr><td><code>/login pw</code> · <code>/logout</code></td><td>log in and out of a room or repeater</td></tr>
      <tr><td><code>/status</code> · <code>/telemetry</code> · <code>/trace</code> · <code>/path</code> · <code>/resetpath</code></td><td>node diagnostics for the open contact</td></tr>
      <tr><td><code>/advert</code> · <code>/advert flood</code></td><td>send your own advert</td></tr>
      <tr><td><code>/scope name|off|default</code> · <code>/region name</code></td><td>send scope and default region (flood scopes)</td></tr>
      <tr><td><code>/nick name</code> · <code>/whois name</code> · <code>/names</code> · <code>/list</code></td><td>change name, contact info, participants, overview</td></tr>
      <tr><td><code>/export</code> · <code>/import meshcore://…</code> · <code>/share name</code> · <code>/del name</code></td><td>share, import, delete contacts</td></tr>
      <tr><td><code>/time</code> · <code>/settime</code> · <code>/battery</code> · <code>/stats</code> · <code>/debug</code> · <code>/clear</code></td><td>node information and maintenance</td></tr>
    </tbody></table>
    <h4 class="sub">Settings</h4>
    <p>Via the gear: language, name, telemetry permissions, auto-add, radio (with presets), regions, location, device (time, BLE PIN, restart, private key, factory reset), display and data. Under Data you export the full configuration as JSON and restore it on another node.</p>
    <p class="mute">Everything is stored locally in the browser only. The key of a password channel is a MeshChat convention; for other apps share the key from the info panel.</p>`,
};

I18N.fr = {
  'nb.btn': 'Voisins sur la carte', 'nb.summary': 'Voisins de {0} : {1} avec position, {2} sans.', 'nb.unknown': 'Sans position : {0}', 'map.tools.clearNb': 'Effacer les voisins',
  'move.text': 'MeshChat a déménagé vers sa propre adresse. Exportez votre configuration, ouvrez la nouvelle adresse et importez-la ; réinstallez ensuite l\'app :', 'move.export': 'Exporter la configuration', 'map.searchPh': 'Chercher un nœud…', 'map.searchNone': 'Aucun nœud avec position trouvé pour "{0}".', 'h.showOnMap': 'Afficher sur la carte',
  'heard.via': 'entendu via {0}', 'heard.ok': 'entendu', 'heard.no': 'pas entendu', 'heard.wait': 'en attente de répétition…', 'ctx.resendSame': 'Renvoyer (même ligne)',
  'map.legend.pending': 'advert en attente', 'map_pending': 'Advert en attente (pas encore un contact sur le nœud).', 'map_accept': 'Ajouter', 'map_ignore': 'Ignorer',
  // ---- chemin / renvois ----
  'path.flood': 'flood', 'path.direct': 'direct (0 saut)', 'path.hops': '{0} saut(s) via {1}', 'path.tooLong': 'Chemin trop long (max. 64 octets).', 'path.set': 'Chemin vers {0} défini : {1}', 'path.cleared': 'Chemin vers {0} effacé (flood).', 'path.setBtn': 'Définir le chemin', 'path.dlgTitle': 'Chemin vers {0}', 'path.dlgInfo': '{0} saut(s) · {1} sur {2} octets', 'path.unknownHop': 'Un saut du chemin n\'est pas un contact connu ; retirez-le d\'abord.',
  'cmd.setpath': 'Définir manuellement le chemin vers un contact', 'cmd.sync': 'Récupérer maintenant la file du nœud', 'cmd.resync': 'Room : récupérer à nouveau l\'historique', 'cmd.map': 'Ouvrir la carte ou y montrer un contact',
  'h.pathSet': 'Définir le chemin…', 'h.pathHelp': 'Choisissez, dans l\'ordre, les répéteurs par lesquels les messages vers ce contact doivent passer (de vous vers le contact). Un chemin vide signifie flood.', 'h.add': 'Ajouter', 'h.pathFlood': 'Vider (flood)', 'h.pathHashSize': 'Taille du hash', 'h.cancel': 'Annuler', 'h.save': 'Enregistrer',
  'h.retries': 'Renvoi automatique (tentatives, 0 = désactivé)', 'h.retriesHelp': 'Réessaie sans accusé de réception ; à partir de la deuxième tentative le chemin est effacé et le message part en flood.', 'retry.attempt': 'tentative {0}/{1}', 'retry.pathReset': 'Chemin vers {0} effacé ; prochaine tentative en flood.',
  // ---- carte / sync ----
  'h.sync': 'Sync', 'h.syncTitle': 'Vider maintenant la file de messages du nœud', 'h.tabMap': 'Carte', 'map.title': 'Carte', 'map.topic': '{0} nœuds avec position connue · cliquez un marqueur pour ouvrir la conversation',
  'map.tools.fit': 'Tout afficher', 'map.tools.me': 'Mon nœud', 'map.tools.live': 'Paquets en direct', 'map.tools.settings': 'Cartes hors ligne…', 'map.legend.you': 'vous', 'map.legend.repeater': 'répéteur', 'map.legend.sensor': 'capteur',
  'map_unavailable': 'Carte indisponible : pas de connexion au serveur de tuiles (meshmanager.net) et aucun cache de carte dans ce navigateur.', 'map_offline_nocache': 'Vous êtes hors ligne et aucune tuile n\'est encore en cache.\nOuvrez la carte une fois en ligne, ou préchargez des pays dans Paramètres › Carte.', 'map_offline_missing': 'Certaines parties de la carte ne sont pas en cache ; elles apparaîtront dès le retour de la connexion.',
  'map_you': 'vous', 'map_last_advert': 'advert il y a {0}', 'map_open_chat': 'Ouvrir', 'map_info': 'Info', 'map_no_location': 'Aucune position connue pour ce contact.',
  'ctx.onMap': 'Position de {0} sur la carte', 'ctx.onMapShort': 'Position sur la carte', 'info.onMap': 'Sur la carte', 'info.sync': 'Sync', 'info.resync': 'Récupérer à nouveau l\'historique', 'info.mapCache': 'Cache de carte', 'info.mapOffline': 'Cartes hors ligne…',
  'sync.done': '{0} messages récupérés du nœud.', 'sync.none': 'Aucun nouveau message sur le nœud.',
  'resync.title': 'Récupérer à nouveau l\'historique', 'resync.text': 'La room {0} est retirée du nœud puis rajoutée aussitôt, ce qui remet son point de synchronisation à zéro. MeshChat se reconnecte ensuite et la room renvoie ses messages conservés. Le chemin vers la room devra être redécouvert ; les doublons sont filtrés.', 'resync.btn': 'Récupérer', 'resync.started': 'Room rajoutée ; login envoyé, la room renvoie maintenant son historique…', 'resync.needLogin': 'Room rajoutée. Connectez-vous pour recevoir l\'historique.', 'resync.onlyRoom': 'Uniquement pour les rooms.',
  'h.mapCallout': 'La carte utilise les tuiles OpenStreetMap auto-hébergées de meshmanager.net. Tout ce que vous consultez ou préchargez ici est conservé dans ce navigateur et fonctionne ensuite hors ligne.', 'h.mapPersist': 'Fixer le stockage', 'h.mapClear': 'Vider le cache', 'h.mapOverview': 'Vue d\'ensemble de toute l\'Europe de l\'Ouest jusqu\'au zoom', 'h.mapDetail': 'Détail par pays choisi jusqu\'au zoom', 'h.mapCountries': 'Pays en haute résolution', 'h.mapDownload': 'Précharger', 'h.mapCancel': 'Arrêter',
  'map.cacheStats': 'En cache : {0} ({1} éléments) · stockage {2} sur {3} utilisé · {4}', 'map.persisted': 'fixé', 'map.notPersisted': 'non fixé (le navigateur peut purger)', 'map.persistOk': 'Stockage fixé : le navigateur ne purgera plus le cache de carte.', 'map.persistNo': 'Le navigateur a refusé (installez l\'app ou visitez le site plus souvent).', 'map.clearConfirm': 'Supprimer toutes les tuiles en cache ({0}) de ce navigateur ?', 'map.cleared': 'Cache de carte vidé.',
  'map.total': 'Sélection : environ {0} (vue d\'ensemble {1} + pays {2})', 'map.progress': '{0} sur {1} tuiles · {2} en cache · {3} erreurs', 'map.done': 'Préchargement terminé : {0} tuiles, {1} en cache.', 'map.cancelled': 'Préchargement arrêté.', 'map.needOnline': 'Le préchargement nécessite une connexion à meshmanager.net.',
  'core.notConnected': 'non connecté', 'core.connLost': 'connexion perdue', 'core.timeout': 'délai dépassé (cmd {0})', 'core.err': 'erreur : {0}', 'core.errCode': 'code {0}', 'core.disabledFw': 'désactivé dans le firmware',
  'err.1': 'commande non prise en charge', 'err.2': 'introuvable', 'err.3': 'table/file d\'attente pleine', 'err.4': 'état invalide', 'err.5': 'erreur de stockage', 'err.6': 'argument invalide',
  'ble.hintConnect': '{0} — vérifiez que le nœud n\'est pas encore connecté à l\'application mobile, et appairez-le d\'abord dans Windows (Paramètres › Bluetooth › Ajouter un appareil, code PIN par défaut 123456).',
  'ble.hintStep': '{0} (étape : {1}). Sous Windows : appairez d\'abord le nœud via Paramètres › Bluetooth avec le code PIN (123456 par défaut), ou mettez le PIN BLE du nœud à 0 via une connexion USB (Paramètres › Appareil). Assurez-vous que l\'application mobile n\'est pas connectée.',
  'ble.stepRx': 'caractéristique RX', 'ble.stepTx': 'caractéristique TX', 'ble.stepNotify': 'notifications',
  'adv.0': 'inconnu', 'adv.1': 'chat', 'adv.2': 'répéteur', 'adv.3': 'room', 'adv.4': 'capteur',
  'lpp.digIn': 'entrée numérique', 'lpp.digOut': 'sortie numérique', 'lpp.anIn': 'entrée analogique', 'lpp.anOut': 'sortie analogique', 'lpp.lux': 'luminosité', 'lpp.presence': 'présence', 'lpp.temp': 'température', 'lpp.hum': 'humidité', 'lpp.accel': 'accéléromètre', 'lpp.press': 'pression atmosphérique', 'lpp.volt': 'tension', 'lpp.curr': 'courant', 'lpp.freq': 'fréquence', 'lpp.pct': 'pourcentage', 'lpp.alt': 'altitude', 'lpp.power': 'puissance', 'lpp.dist': 'distance', 'lpp.energy': 'énergie', 'lpp.dir': 'direction', 'lpp.gyro': 'gyroscope', 'lpp.gps': 'gps', 'lpp.unknown': 'type 0x{0}',
  'state.saveFail': 'Échec de l\'enregistrement dans le navigateur : {0}',
  'path.hop1': '1 hop via {0}', 'path.hopN': '{0} hops via {1}', 'path.direct0': 'direct (0 hop)',
  'ago.never': 'jamais', 'ago.future': 'futur', 'ago.s': '{0} s', 'ago.min': '{0} min', 'ago.h': '{0} h', 'ago.d': '{0} j',
  'route.0': 'flood transport (avec portée)', 'route.1': 'flood', 'route.2': 'direct', 'route.3': 'direct transport (avec portée)',
  'scope.codes': 'portée {0}', 'scope.none': 'sans portée', 'scope.default': 'par défaut', 'scope.defaultNamed': 'par défaut ({0})', 'scope.global': 'globale', 'scope.globalNamed': 'globale ({0})', 'scope.custom': 'portée',
  'ui.close': 'Fermer', 'ui.leave': 'Quitter', 'ui.delete': 'Supprimer', 'ui.save': 'Enregistrer', 'ui.import': 'Importer', 'ui.wipe': 'Effacer', 'ui.ok': 'OK',
  'batt.title': 'Batterie {0} V', 'batt.storage': ' · stockage {0}/{1} ko',
  'sb.favOnlyTitle': 'Favoris uniquement (cliquer pour tout afficher)', 'sb.allTitle': 'Tous les contacts (cliquer pour les favoris uniquement)',
  'sb.channels': 'Canaux', 'sb.addChannel': 'Ajouter un canal', 'sb.rooms': 'Rooms', 'sb.loggedIn': 'Connecté', 'sb.notLoggedIn': 'Non connecté', 'sb.dm': 'Privé', 'sb.startDm': 'Démarrer une conversation privée', 'sb.repeaters': 'Répéteurs &amp; capteurs',
  'sb.noAdvert': 'Aucun advert > {0} j', 'sb.advertAgo': 'Advert il y a {0}', 'sb.nothingFound': 'Aucun résultat pour « {0} ».', 'sb.favToastOn': 'Barre latérale : favoris uniquement', 'sb.favToastOff': 'Barre latérale : tous les contacts',
  'msg.waitingReply': 'en attente de réponse…', 'ack.ok': 'Confirmé', 'ack.fail': 'Pas de confirmation', 'ack.pending': 'En attente de confirmation', 'msg.new': 'nouveau', 'msg.none': 'Pas encore de messages.',
  'head.notConnected': 'Non connecté. Choisissez USB ou Bluetooth.', 'head.chPublic': 'Canal public', 'head.chHashtag': 'Canal hashtag', 'head.chPrivate': 'Canal privé', 'head.key': 'clé', 'head.seen1': '1 participant vu', 'head.seenN': '{0} participants vus', 'head.slot': 'emplacement {0}',
  'head.advertAgo': 'advert il y a {0}', 'head.path': 'chemin {0}', 'head.loggedIn': 'connecté', 'head.notLoggedIn': 'non connecté',
  'scope.optGlobal': 'Région : globale ({0})', 'scope.optDefault': 'Région par défaut du nœud', 'scope.optUnscoped': 'Sans portée (partout)', 'scope.optNew': '+ Autre région…', 'scope.chanTitle': 'Région (portée d\'inondation) pour les messages de ce canal : {0}',
  'compose.phRepeater': 'Commande CLI pour le répéteur (p. ex. ver, get radio) ou /commande…', 'compose.phStatus': '/commande (tapez /help)', 'compose.phSensor': 'Commande CLI pour le capteur ou /commande…', 'compose.phMsg': 'Message ou /commande…',
  'users.lastAgo': 'vu il y a {0}', 'users.noContact': 'pas de contact',
  'info.node': 'Nœud', 'info.notConnected': 'Non connecté.', 'info.ownNode': 'Mon nœud', 'info.name': 'Nom', 'info.key': 'Clé', 'info.radio': 'Radio', 'info.region': 'Région', 'info.regionNone': 'aucune (par défaut)', 'info.sendScope': 'Portée d\'envoi', 'info.contacts': 'Contacts',
  'info.advertFlood': 'Advert (flood)', 'info.advert0': 'Advert (0 hop)', 'info.downloadTitle': 'Enregistrer cette page comme fichier HTML autonome', 'info.channel': 'Canal', 'info.slot': 'Emplacement', 'info.copyKey': 'Copier la clé',
  'info.title': 'Info · {0}', 'info.type': 'Type', 'info.advertName': 'Nom d\'advert', 'info.advert': 'Advert', 'info.path': 'Chemin', 'info.location': 'Position', 'info.login': 'Connexion', 'info.loggedIn': 'connecté', 'info.admin': ' (admin)', 'info.notLoggedIn': 'non connecté', 'info.note': 'Note',
  'info.status': 'Statut', 'info.telemetry': 'Télémétrie', 'info.trace': 'Trace', 'info.discover': 'Chercher le chemin', 'info.pathReset': 'Réinit. chemin', 'info.logout': 'Déconnexion', 'info.loginBtn': 'Connexion', 'info.edit': 'Modifier',
  'cmd.help': 'Liste des commandes', 'cmd.about': 'À propos de MeshChat : version, manuel, auteur', 'cmd.connect': 'Se connecter au nœud', 'cmd.connect.arg': 'usb|ble', 'cmd.disconnect': 'Couper la connexion',
  'cmd.join': 'Ouvrir ou ajouter un canal', 'cmd.join.arg': '#canal [clé|mot de passe]', 'cmd.part': 'Supprimer le canal du nœud', 'cmd.part.arg': '[canal]',
  'cmd.msg': 'Envoyer un message privé', 'cmd.msg.arg': '<pseudo> <texte>', 'cmd.query': 'Ouvrir une fenêtre privée', 'cmd.query.arg': '<pseudo>', 'cmd.me': 'Message d\'action', 'cmd.me.arg': '<texte>',
  'cmd.nick': 'Changer mon nom', 'cmd.nick.arg': '<nom>', 'cmd.whois': 'Afficher les infos du contact', 'cmd.whois.arg': '<pseudo>', 'cmd.names': 'Afficher les participants', 'cmd.list': 'Canaux et contacts', 'cmd.contacts': 'Recharger entièrement la liste des contacts depuis le nœud',
  'cmd.advert': 'Envoyer mon advert', 'cmd.advert.arg': '[flood]', 'cmd.login': 'Se connecter à une room/un répéteur', 'cmd.login.arg': '[mot de passe]', 'cmd.logout': 'Se déconnecter',
  'cmd.cli': 'Commande CLI vers le répéteur', 'cmd.cli.arg': '<commande>', 'cmd.status': 'Demander les statistiques', 'cmd.telemetry': 'Demander la télémétrie', 'cmd.telemetry.arg': '[pseudo]',
  'cmd.trace': 'Tracer le chemin avec le SNR par hop', 'cmd.trace.arg': '[pseudo]', 'cmd.path': 'Redécouvrir le chemin', 'cmd.path.arg': '[pseudo]', 'cmd.resetpath': 'Effacer le chemin (retour au flood)', 'cmd.resetpath.arg': '[pseudo]',
  'cmd.scope': 'Choisir la portée d\'envoi (région)', 'cmd.scope.arg': '<nom|hex|off|default>', 'cmd.region': 'Définir la région par défaut du nœud', 'cmd.region.arg': '<nom> [hex]', 'cmd.regions': 'Récupérer les régions d\'un répéteur et choisir', 'cmd.regions.arg': '[répéteur]',
  'cmd.export': 'Contact en URI meshcore://', 'cmd.export.arg': '[pseudo]', 'cmd.import': 'Importer un contact', 'cmd.import.arg': '<meshcore://…>', 'cmd.share': 'Partager le contact sur le mesh', 'cmd.share.arg': '<pseudo>', 'cmd.del': 'Supprimer un contact', 'cmd.del.arg': '<pseudo>',
  'cmd.time': 'Heure du nœud', 'cmd.settime': 'Synchroniser l\'heure', 'cmd.battery': 'Batterie', 'cmd.stats': 'Statistiques du nœud',
  'cmd.raw': 'Envoyer une trame de commande brute', 'cmd.raw.arg': '<hex>', 'cmd.debug': 'Sortie de débogage on/off', 'cmd.clear': 'Vider la fenêtre', 'cmd.theme': 'Thème', 'cmd.theme.arg': 'dark|light|auto', 'cmd.quit': 'Déconnecter et fermer la fenêtre',
  'conn.noBle': 'Web Bluetooth n\'est pas pris en charge par ce navigateur (utilisez Chrome/Edge, ou Bluefy sur iOS).', 'conn.noSerial': 'Web Serial n\'est pas pris en charge par ce navigateur (utilisez Chrome/Edge sur ordinateur ou Android).',
  'status.connecting': 'Connexion…', 'status.syncing': 'Synchronisation…', 'status.connected': 'Connecté · {0}', 'status.off': 'Non connecté',
  'conn.cancelled': 'Connexion annulée.', 'conn.failed': 'Échec de la connexion : {0}', 'conn.defaultModel': 'nœud MeshCore', 'conn.build': ', build {0}',
  'conn.connectedVia': 'Connecté via {0} à {1} (fw {2}{3}) · nœud « {4} »', 'conn.radio': 'Radio {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm', 'conn.clockSynced': 'Horloge du nœud synchronisée (retard de {0} s).',
  'contacts.syncedIncr': '{0} contacts modifiés synchronisés ({1} au total, depuis le cache).', 'contacts.loaded': '{0} contacts chargés depuis le nœud.', 'contacts.reloaded': 'Liste des contacts entièrement rechargée.',
  'conn.lost': 'Connexion au nœud perdue.', 'conn.lostToast': 'Connexion perdue',
  'ev.advertFrom': 'Advert de {0}{1}', 'ev.new': ' (nouveau)', 'ev.pathUpdated': 'Chemin vers {0} mis à jour : {1}', 'ev.newNode': 'Nouveau nœud vu : {0} ({1}). Ajoutez-le via Contacts › Adverts en attente.', 'ev.newNodeToast': 'Nouveau nœud : {0} ({1})',
  'ev.contactDeleted': 'Le contact {0} a été supprimé du nœud.', 'ev.contactsFull': 'La liste des contacts du nœud est pleine',
  'login.ok': 'Connecté à {0}{1}.', 'login.asAdmin': ' en tant qu\'admin', 'login.okToast': 'Connecté à {0}', 'login.denied': 'Connexion à {0} refusée (mauvais mot de passe ?).',
  'stats.raw': 'brut : {0}', 'stats.line1': 'batterie {0} V · uptime {1} · file tx {2}', 'stats.line2': 'bruit de fond {0} dBm · dernier RSSI {1} dBm{2}', 'stats.lastSnr': ' · dernier SNR {0} dB',
  'stats.line3': 'reçus {0} (flood {1}, direct {2}) · envoyés {3} (flood {4}, direct {5})', 'stats.line4': 'airtime tx {0}{1}{2}{3}', 'stats.rx': ' · rx {0}', 'stats.fullEvents': ' · file pleine {0}', 'stats.dups': ' · doublons direct/flood {0}/{1}',
  'telem.noData': '(aucune donnée)', 'telem.cmd': 'télémétrie',
  'trace.hop': 'hop {0} : {1}  SNR {2} dB', 'trace.back': 'retour chez moi : SNR {0} dB',
  'disc.cmd': 'recherche de chemin', 'disc.text': 'aller ({0} hops) : {1}\nretour ({2} hops) : {3}', 'disc.direct': 'direct',
  'send.notConnected': 'Non connecté à un nœud.', 'send.chanGone': 'Le canal n\'est plus sur le nœud.', 'send.failed': 'Échec de l\'envoi : {0}', 'send.noContact': 'Contact introuvable.', 'send.roomNotLoggedIn': 'Vous n\'êtes pas connecté à cette room. Utilisez /login <mot de passe>.',
  'cli.noReply': 'pas de réponse de {0} dans les {1} s', 'cli.notLoggedIn': 'Non connecté : la réponse peut ne pas arriver. Utilisez /login <mot de passe>.', 'cli.noAnswer': '(pas de réponse)', 'cli.err': 'erreur : {0}',
  'login.sent': 'Connexion envoyée à {0} ({1})…', 'login.noReply': 'Pas de réponse à la connexion de {0}.', 'login.failed': 'Échec de la connexion : {0}',
  'scope.noFwSupport2': 'Ce firmware ne prend pas en charge les portées d\'inondation (régions) ; le message part sans changement de portée.', 'scope.noFwSupport': 'Ce firmware ne prend pas en charge les portées d\'inondation (régions).',
  'scope.chanSet': 'Région pour ce canal : {0}', 'scope.followsGlobal': 'suit la portée d\'envoi globale ({0})', 'scope.sendScope': 'Portée d\'envoi : {0}',
  'cmd.contactNotFound': 'Contact « {0} » introuvable.', 'cmd.noContactSel': 'Aucun contact sélectionné. Indiquez un nom.',
  'help.list': 'Commandes : {0}', 'help.hint': 'Tapez /about pour le manuel. Tapez / pour voir la liste avec explications. Dans une fenêtre de répéteur, le texte ordinaire est envoyé comme commande CLI au répéteur ; dans une room comme post ; dans un canal ou une fenêtre privée comme message.',
  'nick.current': 'Nom actuel : {0}', 'nick.changed': 'Nom changé en {0}. Envoyez un advert pour que les autres le voient (/advert flood).',
  'whois.text': '{0} · {1} · clé {2} · advert {3} · chemin {4}{5}{6}', 'whois.loc': ' · position {0},{1}', 'whois.snr': ' · SNR {0}',
  'names.seen': 'Vus : {0}', 'names.contacts': 'Contacts : {0}', 'list.channels': 'Canaux : {0}', 'list.rooms': 'Rooms : {0} · Répéteurs : {1}',
  'advert.sent': 'Advert envoyé ({0}).', 'advert.zeroHop': 'zéro hop', 'advert.sentToast': 'Advert envoyé',
  'login.openFirst': 'Ouvrez d\'abord une room ou un répéteur.', 'logout.done': 'Déconnecté de {0}', 'cli.openFirst': 'Ouvrez d\'abord un répéteur/une room.',
  'status.sent': 'Demande de statut envoyée à {0}…', 'telem.sent': 'Demande de télémétrie envoyée à {0}…', 'trace.noPath': 'Aucun chemin connu vers {0} (flood). Essayez /path.', 'trace.sent': 'Trace envoyée via {0}…', 'disc.sent': 'Recherche de chemin envoyée à {0}…', 'path.reset': 'Chemin vers {0} effacé (flood).',
  'export.self': 'Mon nœud', 'import.done': 'Contact importé.', 'share.done': 'Contact {0} partagé sur le mesh.',
  'time.node': 'Heure du nœud : {0} (écart {1} s)', 'time.synced': 'Heure synchronisée.', 'batt.notice': 'Batterie {0} V{1}',
  'raw.reply': 'réponse : {0}', 'debug.toggle': 'Débogage {0}', 'debug.on': 'activé', 'debug.off': 'désactivé', 'cmd.unknown': 'Commande inconnue : {0} (tapez /help)',
  'nodestats.line1': 'batterie {0} V · uptime {1} · erreurs 0x{2} · file {3}', 'nodestats.line2': 'bruit de fond {0} dBm · dernier RSSI {1} dBm · dernier SNR {2} dB · airtime tx {3} rx {4}',
  'nodestats.line3': 'paquets : reçus {0} · envoyés {1} · flood tx/rx {2}/{3} · direct tx/rx {4}/{5} · erreurs rx {6}', 'nodestats.unavailable': 'Statistiques indisponibles (firmware plus ancien ?) : {0}',
  'scope.chanCurrent': 'Région de ce canal : {0}. Utilisez /scope <nom|off|default|global>.', 'scope.current': 'Portée d\'envoi : {0}{1}', 'scope.nodeDefault': ' · région par défaut du nœud : {0} ({1})', 'scope.noNodeDefault': ' · pas de région par défaut sur le nœud', 'scope.set': 'Portée d\'envoi définie : {0}',
  'region.cleared': 'Région par défaut du nœud effacée.', 'region.set': 'Région par défaut définie : {0} ({1}).',
  'clip.copied': 'Copié dans le presse-papiers', 'clip.failed': 'Échec de la copie',
  'join.badKey': 'Clé invalide : 32 caractères hex ou 24 caractères base64 attendus.', 'join.usage': 'Indiquez un #hashtag, ou un nom avec clé/mot de passe : /join nom <clé|mot de passe>', 'join.exists': 'Canal déjà présent.',
  'join.full': 'Les {0} emplacements de canaux du nœud sont tous occupés. Quittez d\'abord un canal.', 'join.added': 'Canal {0} ajouté à l\'emplacement {1} · clé {2}',
  'leave.notFound': 'Canal introuvable.', 'leave.title': 'Quitter le canal', 'leave.text': '« {0} » sera supprimé du nœud (emplacement {1}). L\'historique local est conservé. Clé : {2}', 'leave.done': 'Canal {0} supprimé.',
  'del.title': 'Supprimer le contact', 'del.text': 'Supprimer {0} ({1}) du nœud ? L\'historique local est conservé.', 'del.failed': 'Échec de la suppression : {0}', 'del.done': '{0} supprimé',
  'ch.phPassword': 'mot de passe', 'ch.phKey': '32 caractères hex ou base64',
  'ch.helpPublic': 'Le canal public par défaut (clé fixe izOH6cXN6mrJ5e26oRXNcg==).', 'ch.helpHashtag': 'Clé = 16 premiers octets du SHA-256 du nom avec le #, en minuscules. Compatible avec l\'application officielle.',
  'ch.helpKey': 'Clé partagée de 128 bits, telle que l\'application officielle l\'affiche/la partage (base64 ou hex). Le nom est libre.', 'ch.helpPassword': 'Clé = 16 premiers octets du SHA-256 du mot de passe. Compatible uniquement avec d\'autres utilisateurs MeshChat ayant le même mot de passe ; sinon partagez la clé (visible dans le panneau d\'infos).',
  'ch.needName': 'Indiquez un nom', 'ch.needSecret': 'Indiquez une clé ou un mot de passe',
  'ct.of': ' sur {0}', 'ct.max': ' · max {0}', 'ct.prune': 'Supprimer les anciens ({0})', 'ct.fav': 'Favori', 'ct.loggedIn': 'connecté', 'ct.console': 'Console', 'ct.chat': 'Chat', 'ct.info': 'Info', 'ct.none': 'Aucun contact.', 'ct.accept': 'Ajouter', 'ct.ignore': 'Ignorer',
  'ct.pubLen': 'La clé publique doit faire 64 caractères hex', 'ct.added': 'Contact ajouté', 'ct.addedName': '{0} ajouté', 'ct.addFailed': 'Échec de l\'ajout : {0}', 'ct.updateFailed': 'Échec de la mise à jour sur le nœud : {0}',
  'prune.title': 'Supprimer les anciens contacts', 'prune.text': 'Supprimer du nœud {0} contacts sans advert depuis {1} jours ? Les favoris sont conservés.', 'prune.done': '{0} contacts supprimés',
  'ct.importTitle': 'Importer un contact', 'ct.importLabel': 'URI meshcore://… (depuis « Partager le contact » dans l\'application)', 'ct.reloaded': 'Contacts entièrement rechargés', 'ct.contactsFile': 'meshchat-contacts.json', 'ct.uriTitle': 'URI du contact · {0}', 'ct.uriLabel': 'Partagez ce lien meshcore://',
  'set.limits': '{0} contacts · {1} canaux', 'set.protocol': ' (protocole v{0})', 'set.storage': 'Stockage navigateur : {0} ko · {1} messages', 'set.repeatAllowed': 'Répétition client autorisée sur : {0}',
  'rg.nodeTag': 'région par défaut du nœud', 'rg.node': 'nœud', 'rg.globalTag': 'portée d\'envoi globale', 'rg.global': 'globale', 'rg.useGlobal': 'Utiliser comme portée d\'envoi globale', 'rg.globalBtn': 'Globale', 'rg.useNode': 'Définir comme région par défaut sur le nœud', 'rg.nodeBtn': 'Nœud',
  'rg.none': 'Pas encore de régions. Ajoutez-en une ou récupérez-les depuis un répéteur.', 'rg.loggedIn': ' (connecté)', 'rg.noRepeaters': '— aucun répéteur —',
  'rg.needName': 'Indiquez un nom de région', 'rg.pickRepeater': 'Choisissez un répéteur', 'rg.loginFirst': 'Connectez-vous d\'abord à {0} (admin) — la fenêtre s\'ouvre', 'rg.waiting': 'En attente de réponse…', 'rg.noneRecognized': 'Aucun nom de région reconnu dans la réponse : {0}',
  'rg.known': '(déjà connue)', 'rg.home': 'home', 'rg.discoverBtn': 'Récupérer les régions du répéteur', 'rg.setNodeFailed': 'Échec de la définition de la région par défaut sur le nœud : {0}', 'rg.applied': '{0} régions reprises', 'rg.added': 'Région ajoutée : {0}', 'rg.nodeSet': 'Région par défaut du nœud : {0}',
  'node.saved': 'Paramètres du nœud enregistrés', 'node.savedNotice': 'Paramètres du nœud mis à jour. Envoyez un advert pour annoncer le nouveau nom.', 'loc.saved': 'Position enregistrée',
  'radio.invalid': 'Valeurs radio invalides', 'radio.title': 'Paramètres radio', 'radio.confirm': 'Fréquence {0} MHz · BW {1} kHz · SF{2} · CR{3} · {4} dBm. Tous les nœuds de votre réseau doivent utiliser les mêmes valeurs ; sinon vous n\'entendrez plus personne.',
  'radio.repeatNotAllowed': 'La répétition client n\'est pas autorisée sur cette fréquence', 'radio.hashUnsupported': 'Mode de hachage du chemin non pris en charge', 'radio.saved': 'Radio enregistrée', 'radio.setNotice': 'Radio configurée : {0} MHz · BW {1} · SF{2} · CR{3} · {4} dBm',
  'tuning.saved': 'Réglages enregistrés', 'region.clearedToast': 'Région effacée', 'region.saved': 'Région enregistrée', 'scope.needNameOrKey': 'Indiquez un nom de région ou une clé',
  'pin.invalid': 'PIN : 6 chiffres ou 0 pour désactiver', 'pin.saved': 'PIN BLE enregistré (actif après redémarrage)',
  'pk.exportTitle': 'Exporter la clé privée', 'pk.exportWarn': 'Quiconque possède cette clé peut se faire passer pour votre nœud et lire vos messages privés. À conserver uniquement en lieu sûr.', 'pk.show': 'Afficher', 'pk.hexTitle': 'Clé privée (hex, 64 octets)', 'pk.copyKeep': 'Copiez et conservez en lieu sûr', 'pk.exportFailed': 'Export impossible : {0}',
  'pk.importTitle': 'Importer la clé privée', 'pk.hex128': '128 caractères hex', 'pk.expect128': '128 caractères hex attendus', 'pk.replaceTitle': 'Remplacer l\'identité', 'pk.replaceText': 'Le nœud reçoit une autre identité (clé publique). Les contacts vous verront comme un nouveau nœud. Redémarrez ensuite.', 'pk.imported': 'Clé privée importée ; redémarrez le nœud',
  'cfg.pkNotExportable': 'Clé privée non exportable : {0}', 'cfg.historyFile': 'meshchat-historique.json', 'cfg.badJson': 'Fichier JSON invalide', 'cfg.notMeshchat': 'Ce n\'est pas une configuration MeshChat',
  'cfg.partNode': 'paramètres du nœud (nom, radio, position, région, options)', 'cfg.partChannels': '{0} canaux', 'cfg.partContacts': '{0} contacts', 'cfg.partPk': 'CLÉ PRIVÉE (identité)', 'cfg.partLocal': 'préférences locales, alias et mots de passe des rooms',
  'cfg.importTitle': 'Importer la configuration', 'cfg.apply': 'Appliquer : {0}.', 'cfg.applyConn': ' Les paramètres du nœud sont écrits directement sur le nœud.', 'cfg.applyOffline': ' Non connecté : seules les données locales sont reprises.',
  'cfg.doneErr': 'Import terminé avec {0} erreur(s) ; voir la fenêtre de statut avec /debug', 'cfg.done': 'Configuration importée', 'cfg.pkImportedNotice': 'Clé privée importée : redémarrez le nœud (Paramètres › Appareil).', 'cfg.localDone': 'Données locales importées (non connecté)',
  'ctx.msgInfo': 'Infos du message (chemin, portée, brut)…', 'ctx.reply': 'Répondre à {0}', 'ctx.dm': 'Message privé à {0}', 'ctx.contactInfo': 'Infos du contact {0}', 'ctx.copyText': 'Copier le texte', 'ctx.copyRaw': 'Copier le paquet brut (hex)', 'ctx.resend': 'Renvoyer', 'ctx.deleteLocal': 'Supprimer le message (localement)',
  'ctx.open': 'Ouvrir', 'ctx.markRead': 'Marquer comme lu', 'ctx.contactInfoDots': 'Infos du contact…', 'ctx.logout': 'Se déconnecter', 'ctx.login': 'Se connecter…', 'ctx.leaveChannel': 'Quitter le canal', 'ctx.closeWindow': 'Fermer la fenêtre', 'ctx.clearHistory': 'Effacer l\'historique',
  'ctx.dmShort': 'Message privé', 'ctx.whois': 'Whois dans la fenêtre', 'ctx.mention': 'Mentionner',
  'mi.time': 'Heure', 'mi.received': ' · reçu {0}', 'mi.from': 'De', 'mi.authorPrefix': 'préfixe auteur {0}', 'mi.window': 'Fenêtre', 'mi.delivery': 'Remise', 'mi.confirmed': '✓ confirmé', 'mi.after': ' après {0} ms', 'mi.noAck': '✗ pas de confirmation', 'mi.pending': 'en attente de confirmation', 'mi.chanNoAck': 'message de canal (pas d\'ACK possible)',
  'mi.route': 'Route', 'mi.ackCode': 'Code ACK', 'mi.sendScope': 'Portée d\'envoi', 'mi.hops': 'Hops', 'mi.hashSize': ' · taille de hachage {0} o', 'mi.type': 'Type', 'mi.typeText': 'texte', 'mi.typeSigned': 'signé (room)',
  'mi.rawRoute': 'Route brute', 'mi.payload': ' · payload {0} · v{1}', 'mi.scopeCodes': 'Portée (codes de transport)', 'mi.nodeRegion': ' <span class="mute">(région du nœud : {0})</span>', 'mi.path': 'Chemin', 'mi.unknownNode': 'nœud inconnu', 'mi.noRepeaters': 'aucun répéteur intermédiaire', 'mi.rawPacket': 'Paquet brut',
  'mi.rawUnavailable': 'indisponible : le nœud ne transmet les paquets bruts que si la journalisation rx est active dans le firmware (message reçu avant la connexion, ou firmware sans LOG_RX).', 'mi.pathHidden': '{0} hop(s) ; les répéteurs intermédiaires ne sont visibles que via le paquet brut.',
  'scope.otherTitle': 'Autre région', 'scope.otherLabel': 'Nom de région (p. ex. Anvers) ou clé hex de 32 caractères', 'chkey.title': 'Clé du canal · {0}', 'chkey.label': 'Hex (à partager avec ceux qui peuvent lire) · base64 : {0}',
  'geo.unavailable': 'Géolocalisation indisponible', 'geo.taken': 'Position reprise du navigateur', 'geo.failed': 'Échec de la géolocalisation : {0}',
  'time.syncedToast': 'Heure synchronisée', 'reboot.title': 'Redémarrer le nœud', 'reboot.text': 'La connexion sera coupée et devra être rétablie.', 'reboot.btn': 'Redémarrer', 'reboot.sent': 'Redémarrage envoyé',
  'factory.title': 'Réinitialisation d\'usine', 'factory.text': 'TOUS les paramètres, contacts, canaux et l\'identité du nœud seront effacés. Exportez d\'abord votre configuration (onglet Données). Continuer ?', 'factory.done': 'Réinitialisation d\'usine effectuée',
  'hist.clearTitle': 'Effacer l\'historique', 'hist.clearText': 'Supprimer tous les messages enregistrés localement ? Les contacts et paramètres sont conservés.', 'forget.title': 'Tout oublier', 'forget.text': 'Effacer toutes les données locales de MeshChat (historique, alias, mots de passe des rooms, paramètres) de ce navigateur ? Le nœud lui-même n\'est pas modifié.',
  'init.welcome': 'Bienvenue dans MeshChat. Connectez votre companion MeshCore via USB (Web Serial) ou Bluetooth (Web Bluetooth) avec les boutons en haut. Tapez /help pour les commandes.',
  'init.noSupport': 'Ce navigateur ne prend en charge ni Web Serial ni Web Bluetooth. Utilisez Chrome ou Edge (ordinateur ou Android). Sur iOS, seul le Bluetooth fonctionne, via le navigateur Bluefy.',
  'init.fileTip': 'Astuce : certains navigateurs bloquent Web Serial/Bluetooth sur les pages file://. Si cela ne fonctionne pas, hébergez le fichier via https ou localhost.',
  'dl.done': 'meshchat.html téléchargé. Ouvrez-le dans Chrome ou Edge ; pour USB/Bluetooth, hébergez-le via https ou localhost.', 'dl.failed': 'Échec du téléchargement : {0}',
  'update.available': 'Nouvelle version disponible : v{0} (actuelle v{1})', 'update.reload': 'Recharger',
  'h.showChannels': 'Afficher les canaux', 'h.usbTitle': 'Connecter via USB (Web Serial)', 'h.btTitle': 'Connecter via Bluetooth (Web Bluetooth)', 'h.disconnect': 'Déconnecter', 'h.battTitle': 'Tension de la batterie', 'h.nickTitle': 'Mon nom (pseudo)',
  'h.lang': 'Langue', 'h.theme': 'Changer de thème', 'h.aboutAria': 'À propos de MeshChat et manuel', 'h.aboutTitle': 'Manuel', 'h.settings': 'Paramètres', 'h.showUsers': 'Afficher les participants',
  'h.sidebarAria': 'Canaux et contacts', 'h.searchPh': 'Chercher un canal ou un contact…', 'h.searchAria': 'Rechercher dans la barre latérale', 'h.favOnly': 'Afficher les favoris uniquement', 'h.contacts': 'Contacts',
  'h.chanScopeTitle': 'Région (portée d\'inondation) pour les messages de ce canal', 'h.chanScopeAria': 'Région pour ce canal', 'h.info': 'Info', 'h.leave': 'Quitter', 'h.messages': 'Messages', 'h.toNewest': 'Aller aux messages les plus récents', 'h.newMessages': 'Nouveaux messages',
  'h.commands': 'Commandes', 'h.message': 'Message', 'h.send': 'Envoyer', 'h.sendBtn': 'Envoyer', 'h.users': 'Participants',
  'h.addChannel': 'Ajouter un canal', 'h.close': 'Fermer', 'h.ctHashtag': 'Hashtag <code>#nom</code><small>Clé dérivée du nom · ouvert à tous ceux qui connaissent le nom</small>', 'h.ctKey': 'Privé avec clé<small>Clé partagée de 128 bits (hex ou base64), nom libre</small>',
  'h.ctPassword': 'Privé avec mot de passe<small>Clé dérivée d\'un mot de passe</small>', 'h.ctPublic': 'Public<small>Le canal par défaut, clé fixe</small>', 'h.name': 'Nom', 'h.max31': 'Max. 31 caractères.', 'h.keyOrPw': 'Clé ou mot de passe', 'h.keyPh': '32 caractères hex ou base64', 'h.generate': 'Générer', 'h.cancel': 'Annuler', 'h.add': 'Ajouter',
  'h.ctSearchPh': 'Chercher par nom, clé, note…', 'h.ctSearchAria': 'Rechercher des contacts', 'h.type': 'Type', 'h.allTypes': 'Tous les types', 'h.sort': 'Trier', 'h.sortRecent': 'Advert le plus récent', 'h.sortName': 'Nom', 'h.sortType': 'Type', 'h.sortDist': 'Distance', 'h.showStale': ' Afficher aussi les anciens',
  'h.pendingAdverts': 'Adverts en attente (ajout manuel activé)', 'h.lastAdvert': 'Dernier advert', 'h.path': 'Chemin', 'h.advertFlood': 'Advert (flood)', 'h.advert0': 'Advert (0 hop)', 'h.pruneOld': 'Supprimer les anciens', 'h.refreshTitle': 'Récupérer à nouveau la liste complète depuis le nœud (normalement seules les modifications sont synchronisées)', 'h.refresh': 'Actualiser',
  'h.addManual': 'Ajouter manuellement', 'h.importUri': 'Importer (meshcore://)', 'h.export': 'Exporter',
  'h.contact': 'Contact', 'h.nameFromAdvert': 'Nom d\'après l\'advert', 'h.aliasLocal': 'Alias (local)', 'h.aliasPh': 'votre propre nom pour ce contact', 'h.noteLocal': 'Note (locale)', 'h.notePh': 'p. ex. toit du château d\'eau, admin = Wim', 'h.typeOnNode': 'Type (sur le nœud)',
  'h.telemPerm': 'Droits de télémétrie (0–127)', 'h.telemPermHelp': 'Utilisé quand la télémétrie est sur « par contact ».', 'h.favLabel': ' Favori (non écrasé automatiquement quand le nœud est plein)', 'h.pubKey': 'Clé publique', 'h.copy': 'Copier', 'h.location': 'Position', 'h.pathOut': 'Chemin (sortant)',
  'h.discover': 'Chercher le chemin', 'h.pathReset': 'Réinit. chemin', 'h.shareUri': 'URI de partage', 'h.shareMesh': 'Partager sur le mesh', 'h.delete': 'Supprimer', 'h.open': 'Ouvrir', 'h.save': 'Enregistrer',
  'h.addContactManual': 'Ajouter un contact manuellement', 'h.pubKey64': 'Clé publique (64 hex)', 'h.manualCallout': 'Vous avez un lien <span class="mono">meshcore://</span> ? Utilisez plutôt « Importer » dans la fenêtre des contacts ; il contient aussi la signature et la position.',
  'h.tabNode': 'Nœud', 'h.tabRadio': 'Radio', 'h.tabRegion': 'Régions', 'h.tabLocation': 'Position', 'h.tabDevice': 'Appareil', 'h.tabView': 'Affichage', 'h.tabData': 'Données',
  'h.nameNick': 'Nom (pseudo)', 'h.nameHelp': 'Visible dans les adverts et les messages de canal. Envoyez un advert après modification.', 'h.manualAdd': ' Ajouter les contacts manuellement (approuver d\'abord les nouveaux adverts)',
  'h.aaChat': ' Ajout auto des chats', 'h.aaRpt': ' Répéteurs', 'h.aaRoom': ' Rooms', 'h.aaSensor': ' Capteurs', 'h.aaOverwrite': ' Écraser le plus ancien (non favori) quand plein', 'h.aaHops': 'Hops max. pour l\'ajout auto (vide = sans limite)',
  'h.telemShare': 'Partage de la télémétrie', 'h.telemBase': 'Base (batterie, temp.)', 'h.never': 'Jamais', 'h.perContactPerm': 'Par contact (droits)', 'h.everyone': 'Tout le monde', 'h.perContact': 'Par contact', 'h.telemEnv': 'Environnement (capteurs)',
  'h.multiAcks': ' Envoyer plusieurs ACK (plus fiable, plus d\'airtime)', 'h.sendAdvert': 'Envoyer un advert',
  'h.radioCallout': 'Tous les nœuds du réseau doivent utiliser la même fréquence, bande passante, SF et CR. Les modifications prennent effet dès l\'enregistrement.', 'h.preset': 'Préréglage', 'h.choose': '— choisir —', 'h.presetEu869': 'EU/UK 869.618 · BW250 · SF11 · CR5 (par défaut)',
  'h.freq': 'Fréquence (MHz)', 'h.bw': 'Bande passante (kHz)', 'h.txPower': 'Puissance TX (dBm)', 'h.hashSize': 'Taille du hachage de chemin', 'h.hash1': '1 octet (par défaut)', 'h.hash2': '2 octets', 'h.hash3': '3 octets',
  'h.clientRepeat': ' Répétition client : ce nœud répète aussi les paquets (uniquement sur les fréquences autorisées)', 'h.saveRadio': 'Enregistrer la radio', 'h.tuning': 'Réglages fins (avancé)', 'h.rxDelay': 'Base du délai RX', 'h.airtimeFactor': 'Facteur d\'airtime', 'h.saveTuning': 'Enregistrer les réglages',
  'h.regionCallout': 'Les régions (portées d\'inondation, firmware ≥ 1.10) limitent la distance parcourue par les floods : les répéteurs ne répètent que les paquets de leur propre région. La clé d\'une région découle de son nom (SHA-256 de « #nom », 16 octets), sauf si l\'administrateur partage une clé propre.',
  'h.nodeDefaultRegion': 'Région par défaut du nœud', 'h.regionNamePh': 'p. ex. Limbourg', 'h.keyHex32': 'Clé (hex, 32)', 'h.deriveFromNamePh': 'vide = dériver du nom', 'h.derive': 'Dériver', 'h.clearRegion': 'Effacer la région', 'h.saveRegion': 'Enregistrer la région',
  'h.myRegions': 'Mes régions', 'h.key': 'Clé', 'h.rgNamePh': 'nom, p. ex. be-vlg', 'h.rgKeyPh': 'clé (vide = dériver)', 'h.repeater': 'Répéteur', 'h.discoverRegions': 'Récupérer les régions du répéteur', 'h.discoverHelp': 'Envoie la commande CLI <span class="mono">region</span> ; une connexion admin est nécessaire.',
  'h.sessionScope': 'Portée d\'envoi pour cette session', 'h.scopeOnSend': 'Portée à l\'envoi', 'h.scopeDefault': 'Région par défaut du nœud', 'h.scopeUnscoped': 'Sans portée (les floods vont partout)', 'h.scopeCustom': 'Autre région…', 'h.regionName': 'Nom de région', 'h.regionNamePh2': 'p. ex. Anvers', 'h.keyHex': 'Clé (hex)', 'h.derivePh': 'vide = dériver', 'h.apply': 'Appliquer',
  'h.scopeHelp': 'Aussi via <span class="mono">/scope &lt;nom|hex|off|default&gt;</span> et <span class="mono">/region &lt;nom&gt;</span>. Vos propres messages affichent la portée utilisée dans le badge méta ; pour les messages reçus, la portée est visible dans Infos du message dès que le nœud transmet les paquets bruts.',
  'h.lat': 'Latitude', 'h.lon': 'Longitude', 'h.locInAdverts': 'Position dans les adverts', 'h.locNo': 'Ne pas partager', 'h.locYes': 'Partager dans les adverts', 'h.locHelp': 'Les autres ne voient votre position et la distance que si vous activez ceci.', 'h.locFromBrowser': 'Position du navigateur',
  'h.model': 'Modèle', 'h.firmware': 'Firmware', 'h.build': 'Build', 'h.limits': 'Limites', 'h.deviceTime': 'Heure de l\'appareil', 'h.battStorage': 'Batterie / stockage', 'h.syncTime': 'Synchroniser l\'heure', 'h.rebootNode': 'Redémarrer le nœud', 'h.blePin': 'Code PIN Bluetooth (6 chiffres, 0 = désactivé)',
  'h.identity': 'Identité', 'h.showPrivKey': 'Afficher la clé privée', 'h.importPrivKey': 'Importer la clé privée', 'h.factory': 'Réinitialisation d\'usine',
  'h.language': 'Langue', 'h.themeLabel': 'Thème', 'h.themeSystem': 'Système', 'h.themeDark': 'Sombre', 'h.themeLight': 'Clair', 'h.showTs': ' Afficher les horodatages', 'h.showMeta': ' Afficher le badge SNR/hops/portée par message', 'h.compact': ' Affichage compact',
  'h.notif': ' Notification système quand mon nom est mentionné', 'h.debug': ' Débogage : trames brutes dans la fenêtre de statut', 'h.favOnlySetting': ' Barre latérale : n\'afficher que les rooms, répéteurs et capteurs favoris (favoris du nœud, ★ dans Contacts)', 'h.staleDays': 'Un contact est « ancien » après (jours sans advert)',
  'h.dataCallout': 'Les messages, alias et préférences ne sont stockés que dans ce navigateur (localStorage). Rien n\'est envoyé à un serveur. Les mots de passe des rooms ne sont conservés que si « connexion automatique » est activé.', 'h.fullConfig': 'Configuration complète',
  'h.fullConfigHelp': 'Paramètres du nœud (nom, radio, position, région, options, réglages), canaux avec clés, contacts et préférences locales. L\'import réécrit tout sur un (nouveau) nœud.', 'h.exportKey': ' Inclure la clé privée (transférer l\'identité ; conservez le fichier en lieu sûr)',
  'h.exportConfig': 'Exporter la configuration', 'h.importConfig': 'Importer la configuration', 'h.exportHistory': 'Exporter l\'historique', 'h.clearHistory': 'Effacer l\'historique', 'h.forgetAll': 'Tout oublier localement',
  'h.loginTo': 'Connexion à ', 'h.password': 'Mot de passe', 'h.pwHelp': 'Room : mot de passe invité ou admin. Répéteur : mot de passe admin (nécessaire pour les commandes CLI). Envoyé chiffré sur le mesh.', 'h.autoLogin': ' Connexion automatique à la connexion (conserver le mot de passe localement)', 'h.login': 'Se connecter',
  'h.regionsOf': 'Régions de ', 'h.repeaterReply': 'Réponse du répéteur : ', 'h.region': 'Région', 'h.nodeStdTitle': 'Définir comme région par défaut de mon nœud', 'h.nodeStd': 'Défaut nœud', 'h.alsoGlobal': ' Utiliser aussi la valeur par défaut choisie comme portée d\'envoi globale', 'h.takeOver': 'Reprendre',
  'h.msgInfo': 'Infos du message', 'h.confirm': 'Confirmer', 'h.input': 'Saisie',
  'h.author': 'Auteur', 'h.source': 'Code source', 'h.version': 'Version', 'h.license': 'Licence', 'h.independent': 'MeshChat est un projet indépendant, sans lien avec l\'équipe MeshCore.', 'h.downloadTitle': 'Enregistrer cette page comme fichier HTML autonome pour l\'utiliser hors ligne ou sur votre propre serveur', 'h.download': '⬇ Télécharger meshchat.html',
  'about.intro': 'Client web de type IRC pour les radios companion <b>MeshCore</b>. Un seul fichier HTML, pas de serveur, pas d\'installation. Fonctionne dans Chrome ou Edge (ordinateur et Android) ; sur iOS uniquement en Bluetooth via le navigateur Bluefy.',
  'about.body': `<h4 class="sub">Connexion</h4>
    <ol>
      <li><b>USB</b> : branchez le nœud, cliquez sur USB et choisissez le port COM.</li>
      <li><b>Bluetooth</b> : cliquez sur Bluetooth et choisissez le nœud. Sous Windows, une demande de code PIN apparaît la première fois (123456 par défaut) ; si la première tentative échoue, cliquez simplement une fois de plus. Le nœud ne doit pas être connecté en même temps à l'application mobile.</li>
      <li>Si le bouton ne fonctionne pas depuis un fichier local, hébergez le fichier via https ou localhost.</li>
    </ol>
    <h4 class="sub">Fenêtres</h4>
    <ul>
      <li><b>MeshChat</b> (fenêtre de statut) : infos de connexion, messages système, /commandes.</li>
      <li><b>Canaux</b> : #public, canaux hashtag (la clé découle du nom) et canaux privés avec clé partagée ou mot de passe. Ajouter avec + ou <code>/join</code>.</li>
      <li><b>Rooms</b> (&amp;nom) : connectez-vous avec <code>/login motdepasse</code>, ensuite le texte ordinaire est un post.</li>
      <li><b>Privé</b> : messages directs avec confirmation (✓). Ouvrir via Contacts, la liste des participants ou <code>/msg nom texte</code>.</li>
      <li><b>Répéteurs &amp; capteurs</b> : le texte ordinaire est envoyé comme commande CLI (p. ex. <code>ver</code>, <code>get radio</code>, <code>neighbors</code>) ; connectez-vous d'abord avec le mot de passe admin. Boutons à droite : Statut, Télémétrie, Trace, Chercher le chemin, Réinit. chemin.</li>
    </ul>
    <h4 class="sub">Barre latérale</h4>
    <p>Le champ de recherche filtre tous les canaux et contacts pendant la saisie (Entrée ouvre le premier résultat). Le bouton ★ n'affiche que les favoris enregistrés sur le nœud ; activez ou désactivez les favoris avec l'étoile dans Contacts. Clic droit sur un élément pour plus d'actions.</p>
    <h4 class="sub">Messages</h4>
    <p>À droite de chaque message figurent SNR, RSSI, hops et portée. Un clic droit, un double clic ou un appui long ouvre <b>Infos du message</b> avec le chemin complet (répéteurs), les codes de transport et le paquet brut, pour autant que le firmware transmette les paquets bruts. Tab complète les noms, la flèche haut rappelle les saisies précédentes, @nom met quelqu'un en évidence.</p>
    <h4 class="sub">Commandes courantes</h4>
    <table class="tbl cmds"><tbody>
      <tr><td><code>/join #nom</code> · <code>/join nom clé</code></td><td>ajouter un canal (hashtag, ou privé avec clé/mot de passe)</td></tr>
      <tr><td><code>/part</code></td><td>supprimer le canal du nœud</td></tr>
      <tr><td><code>/msg nom texte</code> · <code>/query nom</code></td><td>message privé / fenêtre privée</td></tr>
      <tr><td><code>/login mdp</code> · <code>/logout</code></td><td>se connecter et se déconnecter d'une room ou d'un répéteur</td></tr>
      <tr><td><code>/status</code> · <code>/telemetry</code> · <code>/trace</code> · <code>/path</code> · <code>/resetpath</code></td><td>diagnostic du nœud pour le contact ouvert</td></tr>
      <tr><td><code>/advert</code> · <code>/advert flood</code></td><td>envoyer mon advert</td></tr>
      <tr><td><code>/scope nom|off|default</code> · <code>/region nom</code></td><td>portée d'envoi et région par défaut (portées d'inondation)</td></tr>
      <tr><td><code>/nick nom</code> · <code>/whois nom</code> · <code>/names</code> · <code>/list</code></td><td>changer de nom, infos du contact, participants, aperçu</td></tr>
      <tr><td><code>/export</code> · <code>/import meshcore://…</code> · <code>/share nom</code> · <code>/del nom</code></td><td>partager, importer, supprimer des contacts</td></tr>
      <tr><td><code>/time</code> · <code>/settime</code> · <code>/battery</code> · <code>/stats</code> · <code>/debug</code> · <code>/clear</code></td><td>informations sur le nœud et maintenance</td></tr>
    </tbody></table>
    <h4 class="sub">Paramètres</h4>
    <p>Via l'engrenage : langue, nom, droits de télémétrie, ajout auto, radio (avec préréglages), régions, position, appareil (heure, PIN BLE, redémarrage, clé privée, réinitialisation d'usine), affichage et données. Sous Données, vous exportez la configuration complète en JSON et la restaurez sur un autre nœud.</p>
    <p class="mute">Tout est stocké uniquement en local dans le navigateur. La clé d'un canal à mot de passe est une convention MeshChat ; pour d'autres applications, partagez la clé du panneau d'infos.</p>`,
};

// ---------- API ----------
function t(key, ...args) {
  let s = I18N[LANG] && I18N[LANG][key];
  if (s === undefined) s = I18N.nl[key];
  if (s === undefined) return key;
  return args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined ? m : String(args[i]))) : s;
}
function i18nLocale() { return I18N_LOCALES[LANG] || 'nl-BE'; }
function detectLang() {
  const l = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
  if (l.startsWith('nl')) return 'nl'; if (l.startsWith('fr')) return 'fr'; return 'en';
}
function setLang(lang) {
  if (!I18N[lang]) lang = 'nl';
  LANG = lang; document.documentElement.lang = lang;
  if (typeof S !== 'undefined' && S.settings) { S.settings.lang = lang; if (typeof saveState === 'function') saveState(); }
  applyLang();
}
// Kies de starttaal (bewaarde instelling, anders browsertaal) zonder op te slaan of te herrenderen.
function initLang() {
  const saved = (typeof S !== 'undefined' && S.settings && S.settings.lang) || null;
  LANG = I18N[saved] ? saved : detectLang(); document.documentElement.lang = LANG;
  applyLang(false);
}
function applyLangStatic() {
  const all = (sel) => Array.from(document.querySelectorAll(sel));
  for (const el of all('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of all('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of all('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const el of all('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of all('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  for (const sel of all('#lang-sel, #s-lang')) sel.value = LANG;
}
function applyLang(rerender = true) {
  applyLangStatic();
  if (typeof S === 'undefined') return;
  // statusbalk: afleiden uit de huidige toestand
  if (typeof setStatus === 'function' && document.querySelector('#status')) {
    if (S.client && S.client.connected) setStatus('st-on', t('status.connected', S.client.kind));
    else if (S.connecting) setStatus('st-busy', t(S.statusKey === 'status.syncing' ? 'status.syncing' : 'status.connecting'));
    else setStatus('st-off', t('status.off'));
  }
  if (!rerender || !S.convs || !S.convs.size) return;
  const cv = activeConv();
  renderTree(); renderHead(cv); renderUsers(cv); renderCompose(cv); renderNick(); renderBattery(); renderMessages(cv, true);
  if (typeof renderHint === 'function' && document.querySelector('#hint') && !document.querySelector('#hint').hidden) renderHint();
  if (document.querySelector('#dlg-settings')?.open && typeof fillSettings === 'function') fillSettings();
  if (document.querySelector('#dlg-contacts')?.open && typeof renderContactsDlg === 'function') renderContactsDlg();
  if (document.querySelector('#dlg-channel')?.open && typeof channelDlgUpdate === 'function') channelDlgUpdate();
}
