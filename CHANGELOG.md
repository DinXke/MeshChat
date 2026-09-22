# Changelog

De versie staat in `src/app1.js` (`APP_VERSION`) en in het Over-venster van de app, samen met de bouwstempel (datum + commit) die `build.sh` invult. De geïnstalleerde PWA meldt een nieuwe versie zodra de bouwstempel op de server verschilt van de eigen stempel.

Elke release krijgt een git-tag `vX.Y.Z` en een GitHub-release met `meshchat.html` als bijlage. Schema: MINOR bij nieuwe functies, PATCH bij correcties, MAJOR bij een breuk in opslagformaat of protocol.

## 0.3.7 - 2026-09-22

- **Tropo**: doorzichtigheidsslider loopt nu van 0 tot 40 % (standaard 30); fijner canvas voor het grote veld van MeshManager 2.27.2 (heel ICON-EU, 23° W tot 62° O).

## 0.3.6 - 2026-09-22

- **Tropo**: uitleg in de tooltip over de bron (ICON-EU via meshmanager.net), de kalibratie op de Hepburn-kaarten en de weging voor 868 MHz (grondinversie boven land telt voor de helft mee).

## 0.3.5 - 2026-09-22

- **Tropo**: de legenda toont de bron van het veld (bv. "ICON-EU 2026-09-22 00 UTC"); het veld van meshmanager.net komt vanaf MeshManager 2.27.0 uit ICON-EU (DWD) op 0,25° met vijf drukniveaus.

## 0.3.4 - 2026-09-22

- **Tropo via de server**: MeshChat haalt het tropo-veld nu als één JSON van meshmanager.net (`/api/tropo`, MeshManager 2.26.0), dat de server één keer per uur voor heel West-Europa berekent. Eén aanvraag per client per uur, geen 429 meer, en pannen of zoomen haalt niets meer op. Het losse HTML-bestand haalt het cross-origin; is de server onbereikbaar, dan rekent de client zelf via Open-Meteo zoals voorheen. Het laatste veld wordt lokaal bewaard voor offline gebruik.
- **Tropo**: niveau 1 (marginaal) begint nu bij -60 N/km in plaats van -50, zodat een gewone nacht (-40 tot -55) niet bijna overal paars kleurt.

## 0.3.3 - 2026-09-22

- **Tropo offline**: de laatst opgehaalde rasterpunten worden lokaal bewaard; zonder internet (of bij een netwerkfout) toont de overlay de laatst bekende situatie met in de legenda "offline · laatst bekend: model … UTC". Zonder eerdere gegevens blijft de melding dat internet nodig is.
- **Tropo**: standaard-doorzichtigheid 30 %.

## 0.3.2 - 2026-09-22

- **Tropo-overlay**: kleurschaal zoals de Hepburn-kaarten (dxinfocentre.com) met 11 niveaus, van paars (marginaal) via blauw, groen, geel en oranje naar rood (zeer intens, ducting) en roze (extreem); kleurbalk in de legenda met uitleg als tooltip; opacity-slider in de kaartbalk (lokaal bewaard).
- **Tropo-overlay**: vast geografisch raster (0,25°–2° naargelang de zoom) met cache per punt en uur, zodat dezelfde plek dezelfde kleur houdt bij pannen en zoomen en er alleen ontbrekende punten worden opgehaald; drie drukniveaus (1000/925/850 hPa) zodat een aanvraag bij Open-Meteo licht blijft; bij HTTP 429 een minuut wachten en automatisch opnieuw proberen; afbeelding in Mercator-projectie getekend.

## 0.3.1 - 2026-09-22

- **Tropo-overlay**: tekent nu via een canvas-bron in plaats van een data-URL (die werd op de gehoste versie door de CSP geblokkeerd en gaf de melding "kaartdelen niet in de cache"); raster wordt naar buiten afgerond zodat de laag altijd het hele beeld dekt; laag verschijnt zodra de stijl er is, zonder op alle tegels te wachten; uren-kiezer compact in de kaartbalk, ook op smartphones.
- **Docs**: schermafbeeldingen van de tropo-overlay en het statusvenster in de handleiding.

## 0.3.0 - 2026-09-22

- **Tropo-overlay** op de kaart (aan/uit in de kaartbalk, standaard uit, alleen online): schatting van tropo-ducting uit het Open-Meteo-weermodel (refractiviteitsgradiënt onder 1,5 km); geel = superrefractie, rood = ducting; keuze nu / +6 / +12 / +24 uur; volgt het kaartbeeld.
- **Statusvenster** voor repeaters en rooms: overzichtelijke weergave van de status (batterij, uptime, ruisvloer, tellers, airtime, duplicaten) en de radio-instellingen (`get radio`, `get tx`, `get af`, `get repeat`, intervallen, vertragingen, positie, `ver`, `clock`); knop "Statusvenster" in het infopaneel, knop "Details" onder elk status-antwoord, en een keuze om het venster automatisch te openen bij een status-antwoord.
- **Emoji en vlaggen in de node-naam**: vlaggenstrip bij het naamveld, bytes-teller (firmware: max. 31 UTF-8-bytes, een vlag telt 8), afkappen op tekengrens; groep "Vlaggen" in de emoji-kiezer.
- **Hops**: bij paden met 2- of 3-byte hashes staat de hash-grootte achter het aantal hops (bv. `4 hops (2 B)`).

## 0.2.1 - 2026-09-22

- **Bluetooth**: na een mislukte of verbroken verbinding bleef een oude notificatielistener hangen, waardoor elk frame dubbel binnenkwam (dubbele kanalen en meldingen, onleesbare kanaalnamen, verschoven antwoorden). Listeners worden nu netjes opgeruimd en frames van een oud transport genegeerd; onleesbare kanalen/contacten worden overgeslagen.
- **Scopes**: bij berichten staat nu de regionaam (bv. "regio be") in plaats van de hex-transportcode, voor alle regio's uit Instellingen en de standaardregio van de node; de codes blijven zichtbaar in de berichtinfo.
- **Repeaters**: knop "Buren" in het infopaneel stuurt `neighbors` en zet de buren meteen op de kaart.
- **Fix**: contactnamen achter sleutelprefixen in CLI-antwoorden (en de knop "Buren op kaart") werkten door een verkeerd teken in de regex niet.

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
