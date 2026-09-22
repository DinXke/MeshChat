/* ===================== Tropo-ducting-overlay (alleen online) ===================== */
// Bron: Open-Meteo (gratis, CORS, geen sleutel). Per drukniveau: refractiviteit N = 77.6·P/T + 3.73e5·e/T²;
// verticale gradiënt dN/dh (N-eenheden per km) tussen opeenvolgende niveaus onder ~1,5 km. Normaal ≈ -40 N/km,
// -79..-157 = superrefractie (verlengd bereik), < -157 = ducting (het signaal blijft in een laag gevangen).
const TROPO_LEVELS = [1000, 975, 950, 925, 900, 850];
const TROPO_NX = 10, TROPO_NY = 8;
const tropoSt = { key: null, busy: false, again: false, timer: null, canvas: null, modelTime: null };
function tropoEnabled() { return !!(S.settings && S.settings.tropo); }
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
// kleur: doorzichtig tot ca. -60, geel → oranje tot -157, rood daaronder
function tropoRGBA(g) {
  if (g == null || g > -60) return [0, 0, 0, 0];
  if (g > -79) { const f = (-60 - g) / 19; return [255, 230, 90, Math.round(55 * f)]; }
  if (g > -157) { const f = (-79 - g) / 78; return [255, Math.round(215 - 120 * f), 60, Math.round(95 + 70 * f)]; }
  const f = Math.min(1, (-157 - g) / 100); return [Math.round(255 - 60 * f), 50, 50, Math.round(175 + 50 * f)];
}
function tropoGrid() {
  const b = mapObj.getBounds(); const w = b.getWest(), e = b.getEast(), s = b.getSouth(), n = b.getNorth();
  // ruim rondom het beeld (15 %, minstens 0,1°) en naar buiten afronden op 0,25°, zodat de laag altijd het hele beeld dekt
  const pw = Math.max(0.1, (e - w) * 0.15), ph = Math.max(0.1, (n - s) * 0.15); const fl = (v) => Math.floor(v * 4) / 4, ce = (v) => Math.ceil(v * 4) / 4;
  return { w: fl(w - pw), e: ce(e + pw), s: Math.max(-85, fl(s - ph)), n: Math.min(85, ce(n + ph)) };
}
function tropoHourIndex(times, hoursAhead) {
  const target = new Date(); target.setUTCMinutes(0, 0, 0); target.setUTCHours(target.getUTCHours() + hoursAhead);
  const iso = target.toISOString().slice(0, 13); let idx = times.findIndex(x => x.slice(0, 13) === iso);
  if (idx < 0) idx = Math.max(0, Math.min(times.length - 1, hoursAhead)); return idx;
}
async function tropoRefresh(force) {
  if (!mapObj || !tropoEnabled()) return;
  if (!navigator.onLine) { tropoSetLegend(t('tropo.offline')); toast(t('tropo.offline'), 'warn'); return; }
  const g = tropoGrid(); const hours = +(S.settings.tropoH || 0); const stamp = new Date().toISOString().slice(0, 13);
  const key = [g.w, g.s, g.e, g.n, hours, stamp].join('|');
  if (!force && key === tropoSt.key) return;
  if (tropoSt.busy) { tropoSt.again = true; return; }
  tropoSt.busy = true; tropoSetLegend(t('tropo.loading'));
  try {
    const lats = [], lons = [];
    for (let j = 0; j < TROPO_NY; j++) for (let i = 0; i < TROPO_NX; i++) { lats.push((g.n - (g.n - g.s) * j / (TROPO_NY - 1)).toFixed(3)); lons.push((g.w + (g.e - g.w) * i / (TROPO_NX - 1)).toFixed(3)); }
    const vars = TROPO_LEVELS.flatMap(p => ['temperature_' + p + 'hPa', 'relative_humidity_' + p + 'hPa', 'geopotential_height_' + p + 'hPa']).join(',');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lats.join(',') + '&longitude=' + lons.join(',') + '&hourly=' + vars + '&forecast_days=2&timezone=UTC';
    const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status);
    let data = await res.json(); if (!Array.isArray(data)) data = [data];
    if (data.length !== lats.length || !data[0].hourly) throw new Error(data.reason || 'unexpected reply');
    const ti = tropoHourIndex(data[0].hourly.time, hours);
    const grad = data.map(d => tropoGradient(d.hourly, ti));
    tropoDraw(grad, g); tropoSt.key = key; tropoSt.modelTime = data[0].hourly.time[ti];
    let minG = Infinity; for (const v of grad) if (v != null && v < minG) minG = v;
    tropoSetLegend(t('tropo.data', tropoSt.modelTime.replace('T', ' ')) + (minG < Infinity ? ' · min ' + Math.round(minG) + ' N/km' : ''));
  } catch (e) { tropoSetLegend(''); toast(t('tropo.err', e.message || e), 'warn'); }
  finally { tropoSt.busy = false; if (tropoSt.again) { tropoSt.again = false; tropoRefresh(false); } }
}
function tropoDraw(grad, g) {
  const W = 320, H = 256; const cv = tropoSt.canvas || (tropoSt.canvas = document.createElement('canvas')); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(W, H); const px = img.data;
  const at = (i, j) => grad[Math.min(TROPO_NY - 1, Math.max(0, j)) * TROPO_NX + Math.min(TROPO_NX - 1, Math.max(0, i))];
  for (let y = 0; y < H; y++) {
    const fy = y / (H - 1) * (TROPO_NY - 1), j0 = Math.floor(fy), ty = fy - j0;
    for (let x = 0; x < W; x++) {
      const fx = x / (W - 1) * (TROPO_NX - 1), i0 = Math.floor(fx), tx = fx - i0;
      const a = at(i0, j0), b = at(i0 + 1, j0), c = at(i0, j0 + 1), d = at(i0 + 1, j0 + 1);
      let v; if (a != null && b != null && c != null && d != null) v = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty; else v = a ?? b ?? c ?? d;
      const rgba = tropoRGBA(v); const o = (y * W + x) * 4; px[o] = rgba[0]; px[o + 1] = rgba[1]; px[o + 2] = rgba[2]; px[o + 3] = rgba[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  tropoApply([[g.w, g.n], [g.e, g.n], [g.e, g.s], [g.w, g.s]]);
}
// Canvas-bron (geen fetch, dus geen CSP- of offline-probleem); bij elke verversing bron en laag opnieuw zetten,
// want een niet-geanimeerde canvas-bron leest het canvas maar één keer. Pas als de stijl geladen is.
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
  if (mapObj.getLayer('tropo')) { mapObj.setLayoutProperty('tropo', 'visibility', tropoEnabled() ? 'visible' : 'none'); return; }
  const before = mapObj.getLayer('packets-line') ? 'packets-line' : undefined;
  mapObj.addLayer({ id: 'tropo', type: 'raster', source: 'tropo', paint: { 'raster-opacity': 0.8, 'raster-resampling': 'linear', 'raster-fade-duration': 0 }, layout: { visibility: tropoEnabled() ? 'visible' : 'none' } }, before);
}
function tropoSetLegend(txt) { const el = $('#map-tropo-legend'); if (!el) return; el.hidden = !tropoEnabled(); const ts = $('#map-tropo-ts'); if (ts) ts.textContent = txt || ''; }
function tropoSetEnabled(on) {
  S.settings.tropo = !!on; saveState(); const sel = $('#map-tropo-h'); if (sel) sel.hidden = !on; const cb = $('#map-tropo'); if (cb) cb.checked = !!on;
  if (!on) { if (mapObj && mapObj.getLayer('tropo')) mapObj.setLayoutProperty('tropo', 'visibility', 'none'); tropoSetLegend(''); return; }
  if (mapObj && mapObj.getLayer('tropo')) mapObj.setLayoutProperty('tropo', 'visibility', 'visible');
  tropoSetLegend(''); if (mapObj) tropoRefresh(true);
}
function tropoBind() {
  if (!mapObj) return;
  mapObj.on('moveend', () => { if (!tropoEnabled()) return; clearTimeout(tropoSt.timer); tropoSt.timer = setTimeout(() => tropoRefresh(false), 1200); });
  mapObj.on('style.load', () => { tropoSt.key = null; if (tropoEnabled()) setTimeout(() => tropoRefresh(true), 600); }); // bij themawissel gaan bron en laag verloren
  if (tropoEnabled()) mapObj.once('load', () => tropoRefresh(true));
}
