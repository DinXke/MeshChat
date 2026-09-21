# MeshChat – bronbestanden

`../meshchat.html` is het enige bestand dat je nodig hebt (alles inline).
Deze map bevat de losse delen waaruit het is samengesteld, voor onderhoud:

- `design.html`  – layout/CSS-ontwerp (regels 1-311 = <head> + CSS; de body/demo-inhoud wordt niet gebruikt)
- `extra.css`    – aanvullende CSS (contextmenu, contactbeheer, MeshChat-specifiek)
- `body.html`    – de echte HTML-body (zijbalken, dialogen, instellingen)
- `core.js`      – companion-protocol: framing, Web Serial/Web Bluetooth, parsers, MeshCoreClient
- `core2.js`     – extra commando's (regio's/scopes, tuning, auto-add, pin, privésleutel, …)
- `app1.js`      – state, localStorage-persistentie, model, raw-pakketdecoder
- `app2.js`      – rendering (zijbalk, berichten, deelnemers, infopaneel, hint)
- `app3.js`      – verbinding, device-events, in-/uitgaande berichten, /commando's, kanalen
- `app4.js`      – dialogen, instellingen, config-export/import, contextmenu, wiring, init
- `mock.js`      – nep-companion voor testen zonder hardware (in de browserconsole plakken)
- `sw.js` / `manifest.json` / `head-extra.html` – PWA: service worker (netwerk eerst, cache als terugval), manifest (wordt `manifest.webmanifest`) en de extra <head>-regels
- `serve.js`     – mini-webserver: `node src/serve.js .` (vanuit de projectmap) en open http://localhost:8765/meshchat.html
- `build.sh`     – bouwt `../meshchat.html` uit deze delen: `bash src/build.sh`
- `tools/shots.js`  – maakt de schermafbeeldingen in `docs/screenshots/` met headless Chrome (DevTools-protocol): `node src/serve.js .` laten draaien en dan `node src/tools/shots.js [naam…]`
- `tools/pmtiles_sizes.py` – berekent per land de tile-groottes uit `basemap.pmtiles` op de MeshManager-server (→ `data/tile_sizes.json` → `map_data.js`)
- `map.js` / `map.css` / `map_style.js` / `map_data.js` / `vendor/` – kaart (MapLibre GL + pmtiles, stijl van MeshManager, groottetabel)

Ontwikkelparameters (alleen lokaal, de server heeft geen `src/`): `?mock=1` laadt de nep-companion, `&fresh=1` wist de lokale opslag, `&lang=en`, `&theme=dark`, `#view=channel|dm|repeater|room|map|contacts|settings:<tab>|about|path` opent een venster.
