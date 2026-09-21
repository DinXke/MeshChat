/* ===================== Kaart: MapLibre + PMTiles van de MeshManager-server, met offline tile-cache ===================== */
// Werkt alleen als de pagina van een webserver komt die /tiles/ aanbiedt (meshmanager.net/chat en de PWA daarvan).
// Tiles worden per byte-bereik in IndexedDB bewaard; voorladen per land gebeurt via mapPrefetch().

// Tiles komen van de MeshManager-server; op meshmanager.net zelf same-origin, elders (los bestand, andere host) via CORS.
const MAP_TILES_HOST = 'https://meshmanager.net';
const MAP_TILES_BASE = () => (/^https?:$/.test(location.protocol) && S.mapSameOrigin ? location.origin : MAP_TILES_HOST) + '/tiles';
const MAP_TILES_URL = () => MAP_TILES_BASE() + '/basemap.pmtiles';
const MAP_FONTS = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'];
const MAP_DB = 'meshchat-map', MAP_STORE = 'ranges';
let mapAvail = null, mapObj = null, mapPm = null, mapProtoAdded = false, mapReady = false, mapAnims = [], mapCacheBytes = null;

let mapAvailReason = '';
async function mapAvailable() {
  if (mapAvail !== null) return mapAvail;
  if (typeof maplibregl === 'undefined' || typeof pmtiles === 'undefined' || !('indexedDB' in window)) { mapAvailReason = 'nolib'; return (mapAvail = false); }
  // same-origin /tiles beschikbaar? (meshmanager.net/chat) anders het vaste adres
  if (/^https?:$/.test(location.protocol) && S.mapSameOrigin === undefined) { try { const r = await fetch(location.origin + '/tiles/basemap.pmtiles', { method: 'HEAD', cache: 'no-store' }); S.mapSameOrigin = r.ok; } catch (e) { S.mapSameOrigin = false; } }
  try { const r = await fetch(MAP_TILES_URL(), { method: 'HEAD', cache: 'no-store', mode: 'cors' }); mapAvail = r.ok; mapAvailReason = r.ok ? '' : 'http' + r.status; }
  catch (e) { const st = await mapCacheStats(); mapAvail = st.bytes > 0; mapAvailReason = mapAvail ? 'offline-cache' : 'offline'; }
  return mapAvail;
}
// Glyphs en sprites via dezelfde IndexedDB-cache (protocol mcc:// → https://), zodat ook het losse bestand offline labels heeft.
async function mapCachedFetch(url, type) {
  const key = 'u:' + url;
  try { const hit = await idb(MAP_STORE, 'readonly', s => s.get(key)); if (hit) return type === 'json' ? JSON.parse(new TextDecoder().decode(hit)) : hit; } catch (e) {}
  const r = await fetch(url, { mode: 'cors', cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  const data = await r.arrayBuffer();
  idb(MAP_STORE, 'readwrite', s => { s.put(data, key); }).then(() => idb('meta', 'readwrite', s => { const g = s.get('bytes'); g.onsuccess = () => s.put((g.result || 0) + data.byteLength, 'bytes'); })).catch(() => {});
  return type === 'json' ? JSON.parse(new TextDecoder().decode(data)) : data;
}

// ---------- IndexedDB-cache voor byte-bereiken ----------
function mapDb() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(MAP_DB, 1);
    rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains(MAP_STORE)) db.createObjectStore(MAP_STORE); if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta'); };
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  });
}
function idb(store, mode, fn) { return mapDb().then(db => new Promise((res, rej) => { const tx = db.transaction(store, mode); const r = fn(tx.objectStore(store)); tx.oncomplete = () => { db.close(); res(r && 'result' in r ? r.result : r); }; tx.onerror = () => { db.close(); rej(tx.error); }; })); }
async function mapCacheStats() {
  try { const bytes = (await idb('meta', 'readonly', s => s.get('bytes'))) || 0; const count = await idb(MAP_STORE, 'readonly', s => s.count()); let quota = null, persisted = null; if (navigator.storage?.estimate) { const e = await navigator.storage.estimate(); quota = e; } if (navigator.storage?.persisted) persisted = await navigator.storage.persisted(); mapCacheBytes = bytes; return { bytes, count, quota, persisted }; }
  catch (e) { return { bytes: 0, count: 0, quota: null, persisted: null }; }
}
async function mapClearCache() { await idb(MAP_STORE, 'readwrite', s => s.clear()); await idb('meta', 'readwrite', s => s.put(0, 'bytes')); mapCacheBytes = 0; }
async function mapRequestPersist() { try { return navigator.storage?.persist ? await navigator.storage.persist() : false; } catch (e) { return false; } }

class CachedRangeSource { // pmtiles-Source: eerst IndexedDB, dan het netwerk (Range-request); alles wat binnenkomt wordt bewaard
  constructor(url) { this.url = url; this.pending = 0; this.stats = { hits: 0, misses: 0 }; }
  getKey() { return this.url; }
  async getBytes(offset, length, signal) {
    const key = offset + ':' + length;
    try { const hit = await idb(MAP_STORE, 'readonly', s => s.get(key)); if (hit) { this.stats.hits++; return { data: hit }; } } catch (e) { /* geen IDB: gewoon netwerk */ }
    this.stats.misses++;
    const r = await fetch(this.url, { headers: { Range: `bytes=${offset}-${offset + length - 1}` }, signal, cache: 'no-store' });
    if (r.status !== 206 && r.status !== 200) throw new Error('tiles: HTTP ' + r.status);
    let data = await r.arrayBuffer(); if (r.status === 200) data = data.slice(offset, offset + length);
    idb(MAP_STORE, 'readwrite', s => { s.put(data, key); }).then(() => idb('meta', 'readwrite', s => { const g = s.get('bytes'); g.onsuccess = () => s.put((g.result || 0) + data.byteLength, 'bytes'); })).then(() => { mapCacheBytes = (mapCacheBytes || 0) + data.byteLength; }).catch(() => {});
    return { data };
  }
}
function mapPmtiles() { if (!mapPm) { mapPm = new pmtiles.PMTiles(new CachedRangeSource(MAP_TILES_URL())); } return mapPm; }

// ---------- stijl ----------
function mapIsDark() { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function mapStyle() {
  const dark = mapIsDark(); const base = MAP_TILES_BASE().replace(/^https?:\/\//, 'mcc://');
  return { version: 8, glyphs: base + '/fonts/{fontstack}/{range}.pbf', sprite: base + '/sprites/v4/' + (dark ? 'dark' : 'light'),
    sources: { protomaps: { type: 'vector', url: 'pmtiles://' + MAP_TILES_URL(), attribution: '© <a href="https://openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' } },
    layers: dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT };
}

// ---------- kaart maken ----------
const TYPE_COLORS = { 0: '#8e9baa', 1: '#5cc8ff', 2: '#f7b955', 3: '#c4a3ff', 4: '#5fd6c5', self: '#3ccf83' };
function mapInit(container) {
  if (mapObj) return mapObj;
  if (!mapProtoAdded) {
    const proto = new pmtiles.Protocol(); proto.add(mapPmtiles()); maplibregl.addProtocol('pmtiles', proto.tile);
    maplibregl.addProtocol('mcc', async (params) => { const url = params.url.replace(/^mcc:\/\//, 'https://'); const data = await mapCachedFetch(url, params.type === 'json' ? 'json' : 'bin'); return { data }; });
    mapProtoAdded = true;
  }
  const center = (S.self && S.self.lat) ? [S.self.lon, S.self.lat] : [4.5, 50.9];
  mapObj = new maplibregl.Map({ container, style: mapStyle(), center, zoom: S.self && S.self.lat ? 9 : 7, attributionControl: { compact: true }, maxZoom: 16, minZoom: 3, preserveDrawingBuffer: !!S.devMode });
  if ('ResizeObserver' in window) new ResizeObserver(() => { try { mapObj && mapObj.resize(); } catch (e) {} }).observe(container);
  mapObj.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  if (typeof tropoBind === 'function') tropoBind();
  mapObj.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  // overlays (nodes/pakketten) toevoegen zodra de stijl er is; 'styledata' vuurt ook na setStyle (themawissel)
  const ensureOverlays = () => { try { if (mapObj.isStyleLoaded() && !mapObj.getLayer('nodes-circle')) { mapAddOverlays(); mapRefreshNodes(); } } catch (e) { /* stijl nog niet klaar */ } };
  mapObj.on('style.load', ensureOverlays); mapObj.on('styledata', ensureOverlays); mapObj.on('idle', ensureOverlays);
  mapObj.on('load', () => { mapReady = true; ensureOverlays(); });
  // klikken: op de (ruime, onzichtbare) klikcirkel of het label; bij meerdere treffers de dichtstbijzijnde
  const pick = (e) => { const fs = mapObj.queryRenderedFeatures([[e.point.x - 16, e.point.y - 16], [e.point.x + 16, e.point.y + 16]], { layers: ['nodes-hit', 'nodes-label'] }); if (!fs.length) return null; let best = fs[0], bd = 1e9; for (const f of fs) { const p = mapObj.project(f.geometry.coordinates); const d = Math.hypot(p.x - e.point.x, p.y - e.point.y); if (d < bd) { bd = d; best = f; } } return best; };
  mapObj.on('click', (e) => { const f = pick(e); if (!f) return; e.preventDefault && e.preventDefault(); mapPopup(f, { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }); });
  mapObj.on('mousemove', (e) => { mapObj.getCanvas().style.cursor = pick(e) ? 'pointer' : ''; });
  mapObj.on('error', (e) => { const msg = e && e.error && e.error.message || ''; if (/pmtiles|tiles|Failed to fetch/i.test(msg)) mapSetNotice(t('map_offline_missing')); });
  return mapObj;
}
function mapSetTheme() { if (!mapObj) return; mapObj.setStyle(mapStyle()); /* style.load voegt overlays opnieuw toe */ }
function mapAddOverlays() {
  if (!mapObj.getSource('nodes')) mapObj.addSource('nodes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  if (!mapObj.getSource('packets')) mapObj.addSource('packets', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  if (!mapObj.getSource('packet-dots')) mapObj.addSource('packet-dots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  if (!mapObj.getLayer('packets-line')) mapObj.addLayer({ id: 'packets-line', type: 'line', source: 'packets', paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': ['get', 'opacity'], 'line-dasharray': [2, 1.5] } });
  if (!mapObj.getLayer('nodes-hit')) mapObj.addLayer({ id: 'nodes-hit', type: 'circle', source: 'nodes', paint: { 'circle-radius': 16, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 0 } });
  if (!mapObj.getLayer('nodes-circle')) mapObj.addLayer({ id: 'nodes-circle', type: 'circle', source: 'nodes', paint: { 'circle-radius': ['case', ['get', 'self'], 8, ['get', 'fav'], 7, 5.5], 'circle-color': ['case', ['get', 'pending'], 'rgba(0,0,0,0)', ['get', 'color']], 'circle-stroke-width': ['case', ['get', 'self'], 3, ['get', 'pending'], 2, 1.5], 'circle-stroke-color': ['case', ['get', 'pending'], ['get', 'color'], ['get', 'stale'], 'rgba(255,255,255,.35)', '#ffffff'], 'circle-opacity': ['case', ['get', 'stale'], 0.55, 0.95], 'circle-stroke-opacity': ['case', ['get', 'pending'], 0.9, 1] } });
  if (!mapObj.getLayer('nodes-label')) mapObj.addLayer({ id: 'nodes-label', type: 'symbol', source: 'nodes', layout: { 'text-field': ['case', ['get', 'pending'], ['concat', ['get', 'name'], ' ?'], ['get', 'name']], 'text-font': ['case', ['get', 'pending'], ['literal', ['Noto Sans Italic']], ['literal', ['Noto Sans Medium']]], 'text-size': 11.5, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true, 'text-max-width': 12 }, paint: { 'text-color': mapIsDark() ? '#e6ebf0' : '#1c2530', 'text-halo-color': mapIsDark() ? 'rgba(14,17,22,.9)' : 'rgba(255,255,255,.9)', 'text-halo-width': 1.4 } });
  if (S.nbActive) { try { mapAddNbLayers(); } catch (e) {} }
  if (!mapObj.getLayer('packet-dots')) mapObj.addLayer({ id: 'packet-dots', type: 'circle', source: 'packet-dots', paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-opacity': ['get', 'opacity'] } });
}
function mapNodeFeatures() {
  const feats = []; const staleT = nowSecs() - (S.settings.staleDays || 7) * 86400;
  for (const c of S.contacts.values()) { if (c.hidden || !c.lat || !c.lon) continue; feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties: { pub: c.pub, name: cname(c), type: c.type, color: TYPE_COLORS[c.type] || TYPE_COLORS[0], self: false, fav: !!((c.flags & 1) || S.extras[c.pub]?.fav), stale: (c.lastAdvert || 0) < staleT, pending: false, lastAdvert: c.lastAdvert || 0 } }); }
  for (const c of S.pendingAdverts.values()) { if (!c.lat || !c.lon || S.contacts.has(c.pub)) continue; feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties: { pub: c.pub, name: c.name, type: c.type, color: TYPE_COLORS[c.type] || TYPE_COLORS[0], self: false, fav: false, stale: false, pending: true, lastAdvert: c.lastAdvert || 0 } }); }
  if (S.self && S.self.lat && S.self.lon) feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [S.self.lon, S.self.lat] }, properties: { pub: S.self.pub, name: S.self.name, type: 'self', color: TYPE_COLORS.self, self: true, fav: false, stale: false, pending: false, lastAdvert: nowSecs() } });
  return { type: 'FeatureCollection', features: feats };
}
function mapRefreshNodes() { if (!mapObj || !mapObj.getSource('nodes')) return; mapObj.getSource('nodes').setData(mapNodeFeatures()); }
function mapPopup(f, lngLat) {
  const p = f.properties; const c = S.contacts.get(p.pub); const typeName = p.self ? t('map_you') : (advType(p.type) || '?'); const pend = p.pending && S.pendingAdverts.get(p.pub);
  const html = `<div class="map-pop"><b>${esc(p.name)}</b> <span class="type ${TYPE_CSS[p.type] || ''}">${esc(typeName)}</span><div class="dim">${p.self ? '' : esc(t('map_last_advert', fmtAgo(p.lastAdvert)))}</div><div class="dim mono" style="font-size:10.5px">${(+lngLat.lat).toFixed(4)}, ${(+lngLat.lng).toFixed(4)}</div>${c ? `<div class="row" style="margin-top:6px;gap:4px"><button class="btn sm primary" data-pub="${c.pub}" data-act="open">${esc(t('map_open_chat'))}</button><button class="btn sm ghost" data-pub="${c.pub}" data-act="info">${esc(t('map_info'))}</button></div>` : pend ? `<div class="dim" style="margin-top:4px">${esc(t('map_pending'))}</div><div class="row" style="margin-top:6px;gap:4px"><button class="btn sm primary" data-pub="${p.pub}" data-act="accept">${esc(t('map_accept'))}</button><button class="btn sm ghost" data-pub="${p.pub}" data-act="ignore">${esc(t('map_ignore'))}</button></div>` : ''}</div>`;
  const pop = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' }).setLngLat(lngLat).setHTML(html).addTo(mapObj);
  pop.getElement().addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; pop.remove(); if (b.dataset.act === 'accept') { acceptPending(b.dataset.pub).then(() => mapRefreshNodes()); return; } if (b.dataset.act === 'ignore') { S.pendingAdverts.delete(b.dataset.pub); mapRefreshNodes(); return; } const cc = S.contacts.get(b.dataset.pub); if (!cc) return; if (b.dataset.act === 'open') { const cv = convForContact(cc); cv.open = true; openConv(cv.key); } else openContactDlg(cc); });
}
function mapFocus(pub, zoom = 12) {
  const c = pub === S.self?.pub ? S.self : S.contacts.get(pub); if (!c || !c.lat) { toast(t('map_no_location'), 'warn'); return false; }
  openConv('map'); const go = () => setTimeout(() => { mapObj.resize(); mapObj.flyTo({ center: [c.lon, c.lat], zoom, duration: 900 }); mapObj.once('moveend', () => { const f = mapNodeFeatures().features.find(x => x.properties.pub === (c.pub || S.self.pub)); if (f) mapPopup(f, { lng: c.lon, lat: c.lat }); }); }, 80);
  if (!mapObj) { setTimeout(() => mapObj && go(), 600); return true; }
  if (mapReady) go(); else mapObj.once('load', go); return true;
}
function mapFitAll() { if (!mapObj) return; mapObj.resize(); const fs = mapNodeFeatures().features; if (!fs.length) return; const b = new maplibregl.LngLatBounds(); for (const f of fs) b.extend(f.geometry.coordinates); mapObj.fitBounds(b, { padding: 60, maxZoom: 12, duration: 700 }); }

// ---------- pakketanimatie ----------
// points: [[lon,lat], ...] van bron naar bestemming; kleur per pakkettype
function mapAnimatePacket(points, color = '#4ea1ff', durationMs = 1600) {
  if (!mapObj || !mapObj.getSource('packets') || points.length < 2) return;
  const id = Date.now() + Math.random(); mapAnims.push({ id, points, color, t0: performance.now(), dur: durationMs }); if (mapAnims.length > 30) mapAnims.shift();
  if (!mapAnims.running) { mapAnims.running = true; requestAnimationFrame(mapAnimFrame); }
}
function mapAnimFrame(now) {
  if (!mapObj || !mapObj.getSource('packets')) { mapAnims.running = false; return; }
  const lines = [], dots = []; const alive = [];
  for (const a of mapAnims) {
    const p = Math.min(1, (now - a.t0) / a.dur); const fade = p < 1 ? 1 : Math.max(0, 1 - (now - a.t0 - a.dur) / 2500); if (fade <= 0) continue; alive.push(a);
    lines.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: a.points }, properties: { color: a.color, opacity: 0.7 * fade } });
    if (p < 1) { // positie langs de polyline
      const segs = []; let total = 0; for (let i = 1; i < a.points.length; i++) { const d = Math.hypot(a.points[i][0] - a.points[i - 1][0], a.points[i][1] - a.points[i - 1][1]); segs.push(d); total += d; }
      let dist = p * total, pos = a.points[0]; for (let i = 0; i < segs.length; i++) { if (dist <= segs[i] || i === segs.length - 1) { const f = segs[i] ? Math.min(1, dist / segs[i]) : 1; pos = [a.points[i][0] + (a.points[i + 1][0] - a.points[i][0]) * f, a.points[i][1] + (a.points[i + 1][1] - a.points[i][1]) * f]; break; } dist -= segs[i]; }
      dots.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pos }, properties: { color: a.color, opacity: 1 } });
    }
  }
  mapAnims.length = 0; mapAnims.push(...alive);
  mapObj.getSource('packets').setData({ type: 'FeatureCollection', features: lines }); mapObj.getSource('packet-dots').setData({ type: 'FeatureCollection', features: dots });
  if (alive.length) requestAnimationFrame(mapAnimFrame); else mapAnims.running = false;
}
// Pad van een ontvangen pakket omzetten in coördinaten: bron (indien bekend) → repeaters (via hash) → ik.
function mapPacketPath(originPub, hashes) {
  const pts = []; const coord = (c) => c && c.lat && c.lon ? [c.lon, c.lat] : null;
  const o = originPub ? (S.contacts.get(originPub) || contactByPrefix(originPub)) : null; if (coord(o)) pts.push(coord(o));
  for (const h of (hashes || [])) { const m = resolveHash(h).find(c => c.lat && c.lon); if (m && coord(m)) pts.push(coord(m)); }
  if (S.self && S.self.lat) pts.push([S.self.lon, S.self.lat]);
  return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
}

// ---------- buren van een repeater (uit het CLI-antwoord 'neighbors') ----------
function mapAddNbLayers() {
  if (!mapObj.getSource('nb')) mapObj.addSource('nb', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  if (!mapObj.getLayer('nb-line')) mapObj.addLayer({ id: 'nb-line', type: 'line', source: 'nb', filter: ['==', '$type', 'LineString'], paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.85 } }, 'nodes-hit');
  if (!mapObj.getLayer('nb-label')) mapObj.addLayer({ id: 'nb-label', type: 'symbol', source: 'nb', filter: ['==', '$type', 'Point'], layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Medium'], 'text-size': 11, 'text-anchor': 'center', 'text-allow-overlap': true }, paint: { 'text-color': ['get', 'color'], 'text-halo-color': mapIsDark() ? 'rgba(14,17,22,.95)' : 'rgba(255,255,255,.95)', 'text-halo-width': 1.6 } });
}
function snrColor(snr) { return snr == null ? '#8e9baa' : snr >= 5 ? '#3ccf83' : snr >= 0 ? '#f2a93b' : '#ff5f6f'; }
// list: [{ hex, snr, age, contact }]
function mapShowNeighbors(rpt, list) {
  if (!rpt || !rpt.lat) { toast(t('map_no_location'), 'warn'); return; }
  openConv('map'); S.nbActive = { pub: rpt.pub, list };
  const draw = () => {
    mapObj.resize(); mapAddNbLayers(); const feats = []; const from = [rpt.lon, rpt.lat]; const b = new maplibregl.LngLatBounds(from, from); let placed = 0;
    for (const n of list) { const c = n.contact; if (!c || !c.lat || !c.lon) continue; const to = [c.lon, c.lat]; const col = snrColor(n.snr); b.extend(to); placed++;
      feats.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [from, to] }, properties: { color: col } });
      feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] }, properties: { color: col, label: (n.snr != null ? n.snr.toFixed(1) + ' dB' : '?') + (n.age != null ? ' · ' + fmtAgo(nowSecs() - n.age) : '') } }); }
    mapObj.getSource('nb').setData({ type: 'FeatureCollection', features: feats });
    if (placed) mapObj.fitBounds(b, { padding: 80, maxZoom: 13, duration: 800 }); else mapObj.flyTo({ center: from, zoom: 11 });
    $('#map-nb-clear').hidden = false;
    const unknown = list.filter(n => !n.contact || !n.contact.lat); const known = list.length - unknown.length;
    toast(t('nb.summary', cname(rpt), known, unknown.length) + (unknown.length ? ' ' + t('nb.unknown', unknown.map(n => n.contact ? cname(n.contact) : n.hex.slice(0, 8)).join(', ')) : ''), 'ok', 9000);
  };
  const go = () => { if (mapObj.isStyleLoaded()) draw(); else mapObj.once('idle', draw); };
  if (mapObj) go(); else setTimeout(() => mapObj && go(), 800);
}
function mapClearNeighbors() { S.nbActive = null; if (mapObj && mapObj.getSource('nb')) mapObj.getSource('nb').setData({ type: 'FeatureCollection', features: [] }); const b = $('#map-nb-clear'); if (b) b.hidden = true; }
// ---------- venster ----------
function mapShow() {
  const wrap = $('#mapwrap'); wrap.hidden = false; $('#messages').hidden = true; $('#compose').hidden = true;
  mapAvailable().then(ok => { if (!ok) { mapSetNotice(mapAvailReason === 'offline' ? t('map_offline_nocache') : t('map_unavailable')); return; } mapSetNotice(''); mapInit($('#map')); mapObj.resize(); setTimeout(() => mapObj && mapObj.resize(), 60); mapRefreshNodes(); });
}
function mapHide() { const wrap = $('#mapwrap'); if (wrap) wrap.hidden = true; $('#messages').hidden = false; $('#compose').hidden = false; }
function mapSetNotice(text) { const n = $('#map-notice'); if (!n) return; n.hidden = !text; n.textContent = text; }

// ---------- voorladen (offline) ----------
function lon2tile(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
function lat2tile(lat, z) { lat = Math.max(-85.05, Math.min(85.05, lat)); const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z)); }
function mapTilesFor(bbox, zmin, zmax) { const list = []; for (let z = zmin; z <= zmax; z++) { const x0 = lon2tile(bbox[0], z), x1 = lon2tile(bbox[2], z), y0 = lat2tile(bbox[3], z), y1 = lat2tile(bbox[1], z); for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) list.push([z, x, y]); } return list; }
// Geschatte bytes voor een land tot zoom zmax (uit de vooraf berekende tabel MAP_SIZES)
function mapEstimate(code, zmax) { const c = MAP_SIZES.countries[code]; if (!c) return 0; return c.bytes_per_zoom.slice(0, zmax + 1).reduce((a, b) => a + b, 0); }
function mapEstimateOverview(zmax) { return MAP_SIZES.total.bytes_per_zoom.slice(0, zmax + 1).reduce((a, b) => a + b, 0); }
let mapPrefetchAbort = null;
async function mapPrefetch(plan, onProgress) {
  // plan: { overviewZ: 8, countries: [{code, zmax}] }
  if (!(await mapAvailable())) throw new Error(t('map_unavailable'));
  const p = mapPmtiles(); const ctl = new AbortController(); mapPrefetchAbort = ctl;
  const tiles = new Map(); const b = MAP_SIZES.archive.bounds;
  for (const tl of mapTilesFor(b, 0, plan.overviewZ)) tiles.set(tl.join('/'), tl);
  for (const c of plan.countries) { const cc = MAP_SIZES.countries[c.code]; if (!cc) continue; for (const tl of mapTilesFor(cc.bbox, plan.overviewZ + 1, c.zmax)) tiles.set(tl.join('/'), tl); }
  const list = Array.from(tiles.values()); let done = 0, failed = 0; const total = list.length; const src = p.source;
  const worker = async () => { while (list.length && !ctl.signal.aborted) { const [z, x, y] = list.pop(); try { await p.getZxy(z, x, y); } catch (e) { failed++; } done++; if (done % 25 === 0 || done === total) onProgress && onProgress({ done, total, failed, bytes: mapCacheBytes || 0, hits: src.stats.hits, misses: src.stats.misses }); } };
  // fonts en sprites één keer ophalen zodat de service worker ze in zijn cache heeft
  const base = MAP_TILES_BASE(); const extra = []; for (const f of MAP_FONTS) for (const r of ['0-255', '256-511', '512-767']) extra.push([`${base}/fonts/${encodeURIComponent(f)}/${r}.pbf`, 'bin']); for (const th of ['light', 'dark']) { extra.push([`${base}/sprites/v4/${th}.json`, 'json'], [`${base}/sprites/v4/${th}.png`, 'bin'], [`${base}/sprites/v4/${th}@2x.json`, 'json'], [`${base}/sprites/v4/${th}@2x.png`, 'bin']); }
  await Promise.all(extra.map(([u, ty]) => mapCachedFetch(u, ty).catch(() => {})));
  await Promise.all(Array.from({ length: 6 }, worker));
  mapPrefetchAbort = null; const st = await mapCacheStats(); onProgress && onProgress({ done, total, failed, bytes: st.bytes, finished: true });
  return { done, total, failed, bytes: st.bytes };
}
function mapPrefetchCancel() { if (mapPrefetchAbort) mapPrefetchAbort.abort(); }
function fmtBytes(b) { if (b == null) return '—'; if (b < 1e6) return (b / 1e3).toFixed(0) + ' kB'; if (b < 1e9) return (b / 1e6).toFixed(b < 1e7 ? 1 : 0) + ' MB'; return (b / 1e9).toFixed(2) + ' GB'; }
