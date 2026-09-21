# Changelog

De versie staat in `src/app1.js` (`APP_VERSION`) en in het Over-venster van de app, samen met de bouwstempel (datum + commit) die `build.sh` invult. De geïnstalleerde PWA meldt een nieuwe versie zodra de bouwstempel op de server verschilt van de eigen stempel.

Elke release krijgt een git-tag `vX.Y.Z` en een GitHub-release met `meshchat.html` als bijlage. Schema: MINOR bij nieuwe functies, PATCH bij correcties, MAJOR bij een breuk in opslagformaat of protocol.

## 0.2.0 - 2026-09-21

- **Kaart**: MapLibre GL ingebouwd met de vector-tiles van meshmanager.net; markers per type, wachtende adverts, klik voor gesprek, "Toon op kaart" overal, zoekveld, live pakketten over het pad, buren van een repeater met SNR-lijnen, offline tiles per land met exacte groottes.
- **Drie talen** (NL/EN/FR) met taalkeuze naast de themaknop en in Instellingen.
- **Regio's**: per kanaal een eigen flood-scope, regiobeheer in Instellingen, regio's ophalen van een repeater (`region`).
- **Paden**: padlengte correct gedecodeerd (hash-grootte in de bovenste 2 bits), handmatig pad instellen, hash-grootte 1–3 bytes.
- **Betrouwbaarheid**: automatisch opnieuw verzenden met pogingenteller, "gehoord via <repeater>" op eigen berichten, Sync-knop, room-geschiedenis opnieuw ophalen, sync-vangnet.
- **Contacten**: favorietenfilter, zoekveld in zijbalk en deelnemerspaneel, contactnamen achter sleutelprefixen in CLI-antwoorden.
- **Links**: `web+meshcore://`-handler, Android-deelmenu, `?uri=meshcore://…` opent een importvraag, weblinks bij Deel-URI.
- **PWA**: manifest, service worker (netwerk eerst), downloadknop, updatecheck op bouwstempel, eigen adres chat.meshmanager.net met verhuismelding op de oude plek.
- **UI**: emoji-kiezer, echt tandwiel-icoon, compacte topbar en aangepaste regelopmaak op telefoons, ondoorzichtige kaartgereedschapsbalk.
- **Docs**: Engelse handleiding met automatisch gegenereerde schermafbeeldingen (`src/tools/shots.js`).

## 0.1.0 - 2026-09-21

- Eerste versie: IRC-achtige client voor MeshCore-companions via USB en Bluetooth; kanalen (publiek, hashtag, sleutel, wachtwoord), rooms, privéberichten met ACK, repeater-CLI, status/telemetrie/trace/pad zoeken, berichtinfo met raw pakket, contactbeheer, alle node-instellingen met config-export/-import, licht en donker thema.
