# MeshChat user manual

MeshChat is an IRC-style web client for [MeshCore](https://meshcore.co.uk) companion radios. It is a single HTML file: no server, no installation, no external resources. Open it in Chrome or Edge and connect your node over USB (Web Serial) or Bluetooth (Web Bluetooth). Everything you see (messages, contacts, settings, map tiles) is stored in your browser only.

The hosted version, installable as an app, lives at **<https://chat.meshmanager.net>**. The same file can be downloaded from there ("Download meshchat.html" in the About dialog) and used standalone.

![Channel window](screenshots/channel.png)

## 1. Connecting

| Button | What it does |
|---|---|
| **USB** | Opens the browser's serial-port picker. Choose the COM port of your node. |
| **Bluetooth** | Opens the Bluetooth picker. Choose your node. On Windows the first attempt asks for the pairing PIN (default `123456`); if that first attempt fails, simply click Bluetooth again. The node must not be connected to the phone app at the same time. |
| **Disconnect** | Closes the link. |
| **Sync** | Drains the node's message queue immediately (normally this happens automatically). |

After connecting, the status window shows the node model, firmware and radio settings. Contacts and channels are loaded (incrementally after the first time), the clock is synchronised if needed, and rooms with "auto login" are logged in.

If the browser blocks Web Serial/Bluetooth on a local file, host the file over https or `localhost`. Chrome and Edge work on desktop and Android; on iOS only Bluetooth works, through the Bluefy browser.

## 2. Windows

The left sidebar lists your windows, IRC style:

- **MeshChat** (status window): connection info, system notices, and a place for slash commands.
- **Map**: see section 6.
- **Channels**: `#public`, hashtag channels and private channels. `+` adds one.
- **Rooms** (`&name`): MeshCore room servers. The dot shows whether you are logged in.
- **Private**: direct conversations you opened or received.
- **Repeaters & sensors**: each one is a console window.

The search field above the tree filters everything while you type (Enter opens the first hit). The ★ button toggles between *favourites only* (the favourites flag stored on your node, same as the official app) and *all contacts*. Right-click any item for more actions.

### Channels

![Adding a channel](screenshots/settings-region.png)

Channel types:

- **Hashtag** (`#name`): the key is derived from the name, so anyone who knows the name can join. Compatible with the official app.
- **Private with key**: a shared 128-bit key (hex or base64) as shown by the official app; the name is free.
- **Private with password**: the key is derived from a password (MeshChat convention; share the key from the info panel with users of other apps).
- **Public**: the default channel with the fixed key.

Each channel header has a **region selector** (globe icon): send this channel's messages with the node's default region, without a scope, or with any other region. MeshChat switches the node's send scope automatically right before each message.

### Rooms

Log in with `/login password` (or the Login button). Plain text is then a post. Room posts show the author's name. **Fetch history again** (info panel or right-click) removes and re-adds the room contact so its sync point resets, then logs in again; the room server pushes its stored posts and duplicates are filtered.

### Private messages

![Direct message](screenshots/dm.png)

Direct messages are acknowledged (✓). Delivery is retried automatically: "attempt 2/3" appears in the line, and from the second attempt the path is cleared so the message goes as flood. The number of attempts is in Settings › Node (0 = off). ✗ appears only after the last attempt; right-click gives **Resend**.

### Repeaters and sensors

![Repeater console](screenshots/repeater.png)

Plain text in a repeater window is sent as a CLI command (`ver`, `get radio`, `neighbors`, `advert`, …). Log in first with the admin password. Quick-command chips sit above the input. The info panel offers **Status** (statistics), **Neighbours** (sends `neighbors` and draws them on the map), **Status window**, **Telemetry**, **Trace** (SNR per hop), **Find path**, **Set path** and **Reset path**.

![Status window](screenshots/status.png)

The **status window** shows the last status reply as a table (battery, uptime, noise floor, counters, airtime, duplicates) and, after *Fetch radio settings*, the radio configuration (`get radio`, `get tx`, `get af`, `get repeat`, advert intervals, delays, position, `ver`, `clock`; some values need an admin login). A **Details** button appears under every status reply in the window; tick *Open automatically on a status reply* inside the window if you prefer it to pop up by itself. Key prefixes in CLI replies (for example in `neighbors`) are annotated with the contact name when known.

## 3. Messages

Each line shows the time, the sender and the message. To the right: SNR, RSSI, hop count and scope where known. Your own messages show:

- **heard via <repeater>** as soon as your node hears a repeater rebroadcast your packet; **not heard** after 15 s (right-click › *Resend (same line)*).
- **attempt n/m**, ✓ or ✗ for acknowledged messages.

Right-click, double-click or long-press a line for **Message info**: delivery state, raw route, transport codes (region), the full path with repeater names and the raw packet in hex. Tab completes names, ↑ recalls earlier input, `@name` highlights someone.

## 4. Paths

![Manual path](screenshots/path.png)

Every contact has an outgoing path (the repeaters a direct message travels through) or *flood*. **Find path** asks the node to discover it; **Set path** lets you compose it by hand: pick repeaters from your contacts in order, move them up, remove them, or clear to flood. The hash size (1–3 bytes) follows the node's path-hash mode (Settings › Radio).

## 5. Contacts

![Contacts](screenshots/contacts.png)

The Contacts dialog supports searching, filtering by type, sorting (recent, name, type, distance), favourites (synchronised with the node), a local alias and note per contact, changing the type and telemetry permissions, share-URI export, sharing on the mesh, manual adding by public key, `meshcore://` import, approving pending adverts when *manual add* is on, and pruning stale contacts.

## 6. Map

![Map](screenshots/map.png)

The map shows every contact with a known position (from its advert) plus your own node, coloured by type. Pending adverts appear as hollow markers with a "?". Click a marker for a popup with *Open* and *Info*; right-click a contact anywhere for *Show on map*. With **Live packets** enabled, packets your node hears are animated along the path of repeaters towards you.

![Tropo overlay](screenshots/map-tropo.png)

**Tropo** (off by default, needs internet) overlays an estimate of tropospheric ducting from the Open-Meteo weather model: for every grid point the refractivity gradient dN/dh is computed between the 1000 and 850 hPa levels; yellow marks super-refraction (below -79 N/km, extended range), red marks ducting (below -157 N/km). Pick *now* or +6/+12/+24 hours. The overlay follows the map view and the legend shows the model hour and the steepest gradient in view. It is a coarse model estimate, not a measurement.

Tiles come from the self-hosted OpenStreetMap vector tiles of meshmanager.net and are cached in the browser. **Settings › Map** lets you preload the whole of Western Europe at overview zoom plus selected countries in high resolution; the size is shown next to each country, with a total and a progress bar. Pin the storage so the browser never evicts it. Offline without a cache, the map shows a notice; the rest of the app keeps working.

![Offline maps](screenshots/settings-map.png)

## 7. Settings

- **Node**: name (emoji and flags allowed, max. 31 UTF-8 bytes, a flag counts 8), manual/auto add of contacts, telemetry sharing, multi-ACK, automatic resend attempts.
- **Radio**: frequency, bandwidth, spreading factor, coding rate, TX power, presets, client repeat, path-hash size, tuning.
- **Regions**: the node's default region (flood scope), your list of regions with keys, *fetch regions from a repeater* (CLI `region`), and the send scope for this session.
- **Location**: your position (also from the browser) and whether adverts include it.
- **Device**: firmware, time sync, reboot, Bluetooth PIN, private key export/import, factory reset.
- **Display**: language (NL/EN/FR), theme, timestamps, meta badges, notifications, debug frames.
- **Data**: export and import the complete configuration as JSON (node settings, channels with keys, contacts, local preferences; optionally the private key), export or clear the history.

## 8. Commands

Type `/` to see the list with explanations. The most used:

| Command | Purpose |
|---|---|
| `/join #name` · `/join name key` | add a channel |
| `/part` | remove the channel from the node |
| `/msg name text` · `/query name` | private message / window |
| `/login pw` · `/logout` | room or repeater login |
| `/status` · `/telemetry` · `/trace` · `/path` · `/setpath` · `/resetpath` | node diagnostics for the open contact |
| `/advert` · `/advert flood` | send your advert |
| `/scope name\|off\|default` · `/region name` · `/regions` | send scope, default region, fetch regions |
| `/sync` · `/resync` | drain the queue / fetch room history again |
| `/map [name]` | open the map or show a contact on it |
| `/nick` · `/whois` · `/names` · `/list` · `/time` · `/battery` · `/stats` · `/debug` · `/clear` | misc |

## 9. Offline and updates

Nothing in MeshChat needs the network to function: the node link is local, history and settings live in the browser, and map tiles are served from the cache once loaded. The network is only used to fetch updates and new tiles.

The hosted version is a PWA: install it from the browser's address bar. It fetches the newest version on every start and shows a *reload* notice when an update arrives while it is open.

## 10. Small screens

![Phone](screenshots/mobile-channel.png)

Below 900 px the sidebars become slide-in panels (☰ and 👥 buttons), message lines wrap into two rows and dialogs use the full width. Everything, including the map and the settings, works on a phone.
