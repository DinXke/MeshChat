# MeshChat

IRC-achtige webclient voor [MeshCore](https://meshcore.co.uk)-companion-radio's, in **één zelfstandig HTML-bestand**.
Geen server, geen installatie, geen externe bronnen: open `meshchat.html` in Chrome of Edge en verbind je node via USB (Web Serial) of Bluetooth (Web Bluetooth).

> Onafhankelijk hobbyproject van DinX. Niet verbonden aan het MeshCore-team.

**[User manual (English) with screenshots →](docs/MANUAL.md)**

![Channel window](docs/screenshots/channel.png)

| Map with live packets | Repeater console |
|---|---|
| ![Map](docs/screenshots/map.png) | ![Repeater console](docs/screenshots/repeater.png) |

| Contacts | Offline maps |
|---|---|
| ![Contacts](docs/screenshots/contacts.png) | ![Offline maps](docs/screenshots/settings-map.png) |

## Functies

- **Verbinding** via USB of Bluetooth met het companion-protocol (frames `>`/`<` + lengte, v3-berichtformaten, alle push-codes).
- **IRC-gevoel**: statusvenster, kanalen, rooms (`&naam`), privévensters en repeater-consoles; regels als `[tijd] <nick> tekst`, nick-kleuren, highlight bij vermelding, ongelezen-tellers, Tab-aanvulling, invoergeschiedenis, `/commando`'s met autocomplete.
- **Kanalen**: `#public`, hashtag-kanalen (sleutel = SHA-256 van `#naam`, compatibel met de officiële app), privékanalen met gedeelde sleutel (hex/base64) of met wachtwoord.
- **Rooms en repeaters**: login, posts met auteur-herkenning, CLI-commando's met snelknoppen, status, telemetrie (CayenneLPP), trace met SNR per hop, pad zoeken, pad reset.
- **Regio's (flood-scopes)**: standaardregio van de node instellen, verzendscope per sessie, `/scope` en `/region`.
- **Berichtinfo** (rechtsklik / dubbelklik / lang indrukken): SNR, RSSI, hops, bezorgstatus, transportcodes, volledig pad met repeaternamen en het ruwe pakket in hex (als de firmware rx-logging doorstuurt).
- **Contactbeheer**: zoeken, filteren, sorteren (ook op afstand), favorieten (gesynchroniseerd met de node), alias en notitie, type/rechten aanpassen, deel-URI, delen op het mesh, handmatig toevoegen, `meshcore://`-import, wachtende adverts goedkeuren, oude contacten opruimen.
- **Zijbalk**: zoekveld dat tijdens het typen filtert, ★-filter voor favorieten.
- **Instellingen** zoals in de officiële Android-app: naam, telemetrie-rechten, multi-ACK, auto-add, radio met voorinstellingen en client-repeat, tuning, pad-hashgrootte, locatie, BLE-pincode, tijd, herstart, fabrieksreset, privésleutel, **volledige configuratie exporteren en importeren** (JSON).
- Donker en licht thema, werkt op smartphonebreedte, alles wordt alleen lokaal in de browser bewaard.

## Gebruik

1. Download `meshchat.html` en open het in Chrome of Edge (desktop of Android). Op iOS werkt alleen Bluetooth via de Bluefy-browser.
2. Klik op **USB** en kies de COM-poort, of op **Bluetooth** en kies de node.
   Windows vraagt bij Bluetooth de eerste keer een pincode (standaard `123456`); mislukt de eerste poging, klik dan nog een keer. De node mag niet tegelijk met de telefoon-app verbonden zijn.
3. Blokkeert de browser Web Serial/Bluetooth vanaf `file://`, host het bestand dan via https of `localhost`.

De volledige handleiding staat in de app onder **?** (of typ `/about`).

## Online en als app

De actuele versie staat op <https://chat.meshmanager.net>. Daar is MeshChat ook **installeerbaar als PWA** (Chrome/Edge: adresbalk › Installeren; Android: menu › Toevoegen aan startscherm). De geïnstalleerde app haalt bij elke start de nieuwste versie op; is die nieuwer, dan verschijnt een melding met een herlaadknop. Offline start de laatst geladen versie.


Hosting: (gehost via de MeshManager-site, repo DinXke/MeshStats; het bestand `server/app/static/chat/index.html` daar is een kopie van `meshchat.html` en wordt bij elke release met de hand bijgewerkt).

## Ontwikkelen

`meshchat.html` wordt samengesteld uit de delen in [`src/`](src/README.md):

```bash
bash src/build.sh
```

Testen zonder radio: `node src/serve.js .` en open <http://localhost:8765/meshchat.html>; plak daarna de inhoud van `src/mock.js` in de browserconsole voor een gesimuleerde companion.

Protocolreferenties: [MeshCore-firmware](https://github.com/meshcore-dev/MeshCore) (`examples/companion_radio/MyMesh.cpp`) en [docs.meshcore.io/companion_protocol](https://docs.meshcore.io/companion_protocol/).

## Versies

Actuele versie: **0.2.0**. Zie [CHANGELOG.md](CHANGELOG.md) en de [releases](https://github.com/DinXke/MeshChat/releases) (met `meshchat.html` als bijlage). De app toont versie en bouwstempel in het Over-venster en meldt zelf wanneer er een nieuwe versie op de server staat.

## Licentie

[MIT](LICENSE)
