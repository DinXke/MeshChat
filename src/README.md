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
- `serve.js`     – mini-webserver: `node src/serve.js .` (vanuit de projectmap) en open http://localhost:8765/meshchat.html
- `build.sh`     – bouwt `../meshchat.html` uit deze delen: `bash src/build.sh`

