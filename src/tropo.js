/* ===================== Tropo-ducting-overlay (alleen online) ===================== */
// Bron: Open-Meteo (gratis, CORS, geen sleutel). Per drukniveau: refractiviteit N = 77.6·P/T + 3.73e5·e/T²;
// verticale gradiënt dN/dh (N-eenheden per km) tussen opeenvolgende niveaus onder ~1,5 km. Normaal ≈ -40 N/km,
// -79..-157 = superrefractie (verlengd bereik), < -157 = ducting (het signaal blijft in een laag gevangen).
// Bemonstering op een VAST geografisch raster (veelvouden van de stap), met cache per punt: dezelfde plek houdt
// dezelfde kleur bij pannen en zoomen; alleen ontbrekende punten worden opgehaald.
// 3 niveaus x 3 variabelen = 9 variabelen: telt bij Open-Meteo als 1 aanvraag per punt (tot 10 variabelen).
const TROPO_LEVELS = [1000, 925, 850];
const TROPO_MAX_POINTS = 220, TROPO_CHUNK = 110;
// Kleurschaal zoals de Hepburn-kaarten (dxinfocentre.com): 0 = niets (doorzichtig), 1 marginaal … 8 zeer intens, 9-10 extreem.
const TROPO_SCALE = [[0, 0, 0], [134, 3, 241], [1, 180, 239], [2, 208, 131], [165, 235, 1], [239, 222, 5], [233, 177, 12], [255, 128, 0], [255, 0, 0], [255, 128, 192], [255, 180, 220]];
const TROPO_LEVEL_KEYS = ['nil', 'marginal', 'fair', 'moderate', 'high', 'strong', 'vstrong', 'intense', 'vintense', 'extreme', 'extreme'];
const tropoSt = { key: null, busy: false, again: false, timer: null, canvas: null, modelTime: {}, cache: new Map(), retryAt: 0, pending: null };
function tropoEnabled() { return !!(S.settings && S.settings.tropo); }
// doorzichtigheid 0..40 %: de laag mag de kaart nooit overstemmen
function tropoOpacity() { const v = +(S.settings.tropoOp ?? 30); return Math.min(40, Math.max(0, Number.isFinite(v) ? v : 30)) / 100; }
function tropoN(T, RH, P) { const Tk = T + 273.15; const es = 6.112 * Math.exp(17.67 * T / (T + 243.5)); const e = Math.max(0, Math.min(100, RH)) / 100 * es; return 77.6 * P / Tk + 3.73e5 * e / (Tk * Tk); }
function tropoGradient(h, ti) {
  let best = null;
  for (let i = 0; i + 1 < TROPO_LEVELS.length; i++) {
    const a = TROPO_LEVELS[i], b = TROPO_LEVELS[i + 1];
    const T1 = h['temperature_' + a + 'hPa']?.[ti], T2 = h['temperature_' + b + 'hPa']?.[ti];
    const R1 = h['relative_humidity_' + a + 'hPa']?.[ti], R2 = h['relative_humidity_' + b + 'hPa']?.[ti];
    const Z1 = h['geopotential_height_' + a + 'hPa']?.[ti], Z2 = h['geopotential_height_' + b + 'hPa']?.[ti];
    if ([T1, T2, R1, R2, Z1, Z2].some(v => v == null)) continue;
    const dz = (Z2 - Z1) / 1000; if (dz < 0.05) continue;
    const g = (tropoN(T2, R2, b) - tropoN(T1, R1, a)) / dz;
    if (best === null || g < best) best = g;
  }
  return best;
}
// gradiënt → niveau 0..10: vanaf -60 N/km (1, marginaal; -40 is normaal) in stappen van ~13,9 tot -157 (8, ducting); -200 → 9, daaronder 10
function tropoLevel(g) {
  if (g == null || g > -60) return 0;
  if (g > -157) return Math.min(8, 1 + Math.floor((-60 - g) / 13.9));
  return g > -200 ? 9 : 10;
}
function tropoRGBA(g) { const lv = tropoLevel(g); if (!lv) return [0, 0, 0, 0]; const c = TROPO_SCALE[lv]; return [c[0], c[1], c[2], 230]; }
// rasterstap naar kaartbreedte; ruim rondom het beeld (35 %) en uitgelijnd op veelvouden van de stap
function tropoGrid() {
  const b = mapObj.getBounds(); const w = b.getWest(), e = b.getEast(), s = Math.max(-80, b.getSouth()), n = Math.min(80, b.getNorth());
  const span = e - w; let step = span <= 2.5 ? 0.25 : span <= 5 ? 0.5 : span <= 10 ? 1 : 2;
  const pw = Math.max(0.2, span * 0.35), ph = Math.max(0.2, (n - s) * 0.35);
  for (;;) {
    const g = { step, w: Math.floor((w - pw) / step) * step, e: Math.ceil((e + pw) / step) * step, s: Math.max(-80, Math.floor((s - ph) / step) * step), n: Math.min(80, Math.ceil((n + ph) / step) * step) };
    g.nx = Math.round((g.e - g.w) / step) + 1; g.ny = Math.round((g.n - g.s) / step) + 1;
    if (g.nx * g.ny <= TROPO_MAX_POINTS || step >= 4) return g;
    step *= 2;
  }
}
function tropoHourIndex(times, hoursAhead) {
  const target = new Date(); target.setUTCMinutes(0, 0, 0); target.setUTCHours(target.getUTCHours() + hoursAhead);
  const iso = target.toISOString().slice(0, 13); let idx = times.findIndex(x => x.slice(0, 13) === iso);
  if (idx < 0) idx = Math.max(0, Math.min(times.length - 1, hoursAhead)); return idx;
}
const tropoPtKey = (stamp, hours, lat, lon) => stamp + '|' + hours + '|' + lat.toFixed(2) + '|' + lon.toFixed(2);
// Veld van de MeshManager-server: die haalt het raster één keer per uur op voor heel West-Europa en serveert het
// als één JSON (GET /api/tropo?h=). Zo doet elke client één aanvraag per uur en loopt niemand tegen de limiet van
// Open-Meteo per IP. Het losse HTML-bestand haalt het cross-origin (CORS); lukt dat niet, dan rekent de client zelf.
const TROPO_FIELD_LS = 'mcirc.tropo.field.v1';
function tropoFieldUrl() { return /(^|\.)meshmanager\.net$/i.test(location.hostname) ? '/api/tropo' : 'https://meshmanager.net/api/tropo'; }
async function tropoFieldFetch(hours, stamp) {
  const ck = stamp + '|' + hours; if (tropoSt.field && tropoSt.field.ck === ck) return tropoSt.field.f;
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(tropoFieldUrl() + '?h=' + hours, { signal: ctl.signal }); if (!res.ok) throw new Error('HTTP ' + res.status);
    const f = await res.json(); if (!f || !Array.isArray(f.grad) || f.grad.length !== f.nx * f.ny) throw new Error('bad field');
    tropoSt.field = { ck, f }; try { localStorage.setItem(TROPO_FIELD_LS, JSON.stringify({ ck, f })); } catch (e) {}
    return f;
  } finally { clearTimeout(tm); }
}
function tropoFieldStale() {
  if (tropoSt.field) return tropoSt.field.f;
  try { const o = JSON.parse(localStorage.getItem(TROPO_FIELD_LS) || 'null'); if (o && o.f) { tropoSt.field = o; return o.f; } } catch (e) {}
  return null;
}
function tropoDrawField(f, stale) {
  const g = { step: f.step, w: f.w, e: f.e, s: f.s, n: f.n, nx: f.nx, ny: f.ny };
  tropoDraw(f.grad, g);
  let minG = Infinity; for (const v of f.grad) if (v != null && v < minG) minG = v;
  const mt = String(f.model_time || '').replace('T', ' ');
  tropoSetLegend((stale ? t('tropo.stale', mt) : t('tropo.data', mt)) + (f.source ? ' · ' + f.source : '') + (minG < Infinity ? ' · max ' + tropoLevel(minG) + ' (' + Math.round(minG) + ' N/km)' : ''));
}
// Laatst opgehaalde punten lokaal bewaren, zodat de overlay offline de laatst bekende situatie kan tonen (met modeluur).
const TROPO_LS = 'mcirc.tropo.v1';
function tropoPersist() {
  try { const o = { modelTime: tropoSt.modelTime, pts: Array.from(tropoSt.cache.entries()).slice(-2500) }; localStorage.setItem(TROPO_LS, JSON.stringify(o)); } catch (e) {}
}
function tropoRestore() {
  if (tropoSt.restored) return; tropoSt.restored = true;
  try { const o = JSON.parse(localStorage.getItem(TROPO_LS) || 'null'); if (o && o.pts) { for (const [k, v] of o.pts) tropoSt.cache.set(k, v); Object.assign(tropoSt.modelTime, o.modelTime || {}); } } catch (e) {}
}
// offline: laatst bekende punten (meest recente modeluur in de cache) voor dit raster tekenen
function tropoDrawStale(g, hours) {
  const stamps = new Set(); for (const k of tropoSt.cache.keys()) if (k.split('|')[1] === String(hours)) stamps.add(k.split('|')[0]);
  const stamp = Array.from(stamps).sort().pop(); if (!stamp) return false;
  const grad = []; for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) grad.push(tropoSt.cache.get(tropoPtKey(stamp, hours, g.n - j * g.step, g.w + i * g.step)) ?? null);
  if (!grad.some(v => v != null)) return false;
  tropoDraw(grad, g); tropoSt.key = null; const mt = tropoSt.modelTime[stamp + '|' + hours] || stamp;
  tropoSetLegend(t('tropo.stale', mt.replace('T', ' '))); return true;
}
async function tropoRefresh(force) {
  if (!mapObj || !tropoEnabled()) return;
  tropoRestore();
  const g = tropoGrid(); const hours = +(S.settings.tropoH || 0); const stamp = new Date().toISOString().slice(0, 13);
  if (!navigator.onLine) { const sf = tropoFieldStale(); if (sf) tropoDrawField(sf, true); else if (!tropoDrawStale(g, hours)) { tropoSetLegend(t('tropo.offline')); if (force) toast(t('tropo.offline'), 'warn'); } return; }
  if (tropoSt.busy) { tropoSt.again = true; return; }
  // 1) het veld van de server: dekt heel West-Europa, dus alleen bij een nieuw uur of andere uurkeuze opnieuw ophalen
  const fkey = 'field|' + stamp + '|' + hours;
  if (!force && fkey === tropoSt.key) return;
  if (!tropoSt.fieldDown || Date.now() > tropoSt.fieldDown) {
    tropoSt.busy = true;
    try { const f = await tropoFieldFetch(hours, stamp); tropoDrawField(f, false); tropoSt.key = fkey; return; }
    catch (e) { tropoSt.fieldDown = Date.now() + (String(e.message).includes('503') ? 120000 : 600000); debugLog('tropo veld: ' + e.message); }
    finally { tropoSt.busy = false; }
  }
  // 2) terugval: zelf rekenen op een raster rond het kaartbeeld (Open-Meteo rechtstreeks)
  const key = [g.step, g.w, g.s, g.e, g.n, hours, stamp].join('|');
  if (!force && key === tropoSt.key) return;
  const pts = []; for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) pts.push({ lat: g.n - j * g.step, lon: g.w + i * g.step });
  const missing = pts.filter(p => !tropoSt.cache.has(tropoPtKey(stamp, hours, p.lat, p.lon)));
  if (missing.length && Date.now() < tropoSt.retryAt) { tropoSetLegend(t('tropo.rateLimited', Math.ceil((tropoSt.retryAt - Date.now()) / 1000))); clearTimeout(tropoSt.timer); tropoSt.timer = setTimeout(() => tropoRefresh(false), tropoSt.retryAt - Date.now() + 200); return; }
  tropoSt.busy = true; if (missing.length) tropoSetLegend(t('tropo.loading'));
  try {
    const vars = TROPO_LEVELS.flatMap(p => ['temperature_' + p + 'hPa', 'relative_humidity_' + p + 'hPa', 'geopotential_height_' + p + 'hPa']).join(',');
    for (let o = 0; o < missing.length; o += TROPO_CHUNK) {
      const chunk = missing.slice(o, o + TROPO_CHUNK);
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + chunk.map(p => p.lat.toFixed(2)).join(',') + '&longitude=' + chunk.map(p => p.lon.toFixed(2)).join(',') + '&hourly=' + vars + '&forecast_days=2&timezone=UTC';
      const res = await fetch(url);
      if (res.status === 429) { tropoSt.retryAt = Date.now() + 60000; tropoSetLegend(t('tropo.rateLimited', 60)); clearTimeout(tropoSt.timer); tropoSt.timer = setTimeout(() => tropoRefresh(true), 60200); break; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let data = await res.json(); if (!Array.isArray(data)) data = [data];
      if (data.length !== chunk.length || !data[0].hourly) throw new Error(data.reason || 'unexpected reply');
      const ti = tropoHourIndex(data[0].hourly.time, hours); tropoSt.modelTime[stamp + '|' + hours] = data[0].hourly.time[ti];
      chunk.forEach((p, i) => tropoSt.cache.set(tropoPtKey(stamp, hours, p.lat, p.lon), tropoGradient(data[i].hourly, ti)));
    }
    if (missing.length && tropoSt.cache.size) tropoPersist();
    if (tropoSt.cache.size > 4000) for (const k of tropoSt.cache.keys()) if (!k.startsWith(stamp)) tropoSt.cache.delete(k); // oude modeluren opruimen
    const grad = pts.map(p => tropoSt.cache.get(tropoPtKey(stamp, hours, p.lat, p.lon)) ?? null);
    if (grad.some(v => v != null)) {
      tropoDraw(grad, g); tropoSt.key = key;
      let minG = Infinity; for (const v of grad) if (v != null && v < minG) minG = v;
      const mt = tropoSt.modelTime[stamp + '|' + hours] || '';
      tropoSetLegend(t('tropo.data', mt.replace('T', ' ')) + (minG < Infinity ? ' · max ' + tropoLevel(minG) + ' (' + Math.round(minG) + ' N/km)' : ''));
    }
  } catch (e) { const sf = tropoFieldStale(); if (sf) tropoDrawField(sf, true); else if (!tropoDrawStale(g, hours)) { tropoSetLegend(''); toast(t('tropo.err', e.message || e), 'warn'); } }
  finally { tropoSt.busy = false; if (tropoSt.again) { tropoSt.again = false; tropoRefresh(false); } }
}
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const mercLat = (y) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
function tropoDraw(grad, g) {
  // pixelrijen lopen lineair in Mercator-y (zo plaatst MapLibre de afbeelding), kolommen lineair in lengtegraad
  const W = g.nx > 200 ? 2048 : g.nx > 30 ? 1024 : 512, H = g.ny > 120 ? 1024 : g.ny > 24 ? 768 : 384; // groot veld (heel ICON-EU): fijner canvas const cv = tropoSt.canvas || (tropoSt.canvas = document.createElement('canvas')); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(W, H); const px = img.data;
  const yN = mercY(g.n), yS = mercY(g.s);
  const at = (i, j) => grad[Math.min(g.ny - 1, Math.max(0, j)) * g.nx + Math.min(g.nx - 1, Math.max(0, i))];
  for (let y = 0; y < H; y++) {
    const lat = mercLat(yN + (yS - yN) * y / (H - 1)); const fy = (g.n - lat) / g.step, j0 = Math.floor(fy), ty = fy - j0;
    for (let x = 0; x < W; x++) {
      const fx = x / (W - 1) * (g.nx - 1), i0 = Math.floor(fx), tx = fx - i0;
      const a = at(i0, j0), b = at(i0 + 1, j0), c = at(i0, j0 + 1), d = at(i0 + 1, j0 + 1);
      let v; if (a != null && b != null && c != null && d != null) v = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty; else v = a ?? b ?? c ?? d;
      const rgba = tropoRGBA(v); const o = (y * W + x) * 4; px[o] = rgba[0]; px[o + 1] = rgba[1]; px[o + 2] = rgba[2]; px[o + 3] = rgba[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  tropoApply([[g.w, g.n], [g.e, g.n], [g.e, g.s], [g.w, g.s]]);
}
// Canvas-bron (geen fetch, dus geen CSP- of offline-probleem); bij elke verversing bron en laag opnieuw zetten,
// want een niet-geanimeerde canvas-bron leest het canvas maar één keer.
function tropoApply(coords) {
  // isStyleLoaded() wacht ook op alle tegels; hier is alleen de stijl zelf nodig (anders gooit addSource)
  const defer = (ev) => { tropoSt.pending = coords; mapObj.once(ev, () => { const p = tropoSt.pending; if (p) { tropoSt.pending = null; tropoApply(p); } }); };
  if (!(mapObj.style && mapObj.style._loaded)) { defer('style.load'); return; }
  try {
    if (mapObj.getLayer('tropo')) mapObj.removeLayer('tropo');
    if (mapObj.getSource('tropo')) mapObj.removeSource('tropo');
    mapObj.addSource('tropo', { type: 'canvas', canvas: tropoSt.canvas, coordinates: coords, animate: false });
    tropoEnsureLayer();
  } catch (e) { defer('idle'); }
}
function tropoEnsureLayer() {
  if (!mapObj || !mapObj.getSource('tropo')) return;
  if (mapObj.getLayer('tropo')) { mapObj.setLayoutProperty('tropo', 'visibility', tropoEnabled() ? 'visible' : 'none'); mapObj.setPaintProperty('tropo', 'raster-opacity', tropoOpacity()); return; }
  const before = mapObj.getLayer('packets-line') ? 'packets-line' : undefined;
  mapObj.addLayer({ id: 'tropo', type: 'raster', source: 'tropo', paint: { 'raster-opacity': tropoOpacity(), 'raster-resampling': 'linear', 'raster-fade-duration': 0 }, layout: { visibility: tropoEnabled() ? 'visible' : 'none' } }, before);
}
function tropoSetOpacity(pct) { const v = +pct; S.settings.tropoOp = Math.min(40, Math.max(0, Number.isFinite(v) ? v : 30)); saveState(); const sl = $('#map-tropo-op'); if (sl) sl.value = String(S.settings.tropoOp); if (mapObj && mapObj.getLayer('tropo')) mapObj.setPaintProperty('tropo', 'raster-opacity', tropoOpacity()); }
// legenda: kleurbalk 1..10+ (tooltip met uitleg) + modeluur/max-niveau
function tropoSetLegend(txt) {
  const el = $('#map-tropo-legend'); if (!el) return; el.hidden = !tropoEnabled();
  const bar = $('#map-tropo-bar'); if (bar && !bar.childElementCount) bar.innerHTML = TROPO_SCALE.map((c, i) => i ? `<i style="background:rgb(${c.join(',')})" title="${i === 10 ? '10+' : i} · ${esc(t('tropo.lv.' + TROPO_LEVEL_KEYS[i]))}"></i>` : '').join('');
  const ts = $('#map-tropo-ts'); if (ts) ts.textContent = txt || '';
}
function tropoSetEnabled(on) {
  S.settings.tropo = !!on; saveState(); for (const id of ['#map-tropo-h', '#map-tropo-op']) { const x = $(id); if (x) x.hidden = !on; } const cb = $('#map-tropo'); if (cb) cb.checked = !!on;
  if (!on) { if (mapObj && mapObj.getLayer('tropo')) mapObj.setLayoutProperty('tropo', 'visibility', 'none'); tropoSetLegend(''); return; }
  if (mapObj && mapObj.getLayer('tropo')) mapObj.setLayoutProperty('tropo', 'visibility', 'visible');
  tropoSetLegend(''); if (mapObj) tropoRefresh(true);
}
function tropoBind() {
  if (!mapObj) return;
  mapObj.on('moveend', () => { if (!tropoEnabled() || (tropoSt.key || '').startsWith('field|')) return; clearTimeout(tropoSt.timer); tropoSt.timer = setTimeout(() => tropoRefresh(false), 1500); });
  mapObj.on('style.load', () => { tropoSt.key = null; if (tropoEnabled()) setTimeout(() => tropoRefresh(true), 600); }); // bij themawissel gaan bron en laag verloren
  if (tropoEnabled()) mapObj.once('load', () => tropoRefresh(true));
}
