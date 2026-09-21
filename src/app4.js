/* ===================== Dialogs, settings, context menu, wiring ===================== */
const on = (sel, ev, fn) => { const el = typeof sel === 'string' ? $(sel) : sel; if (el) el.addEventListener(ev, fn); };
const val = (sel) => ($(sel)?.value ?? '').trim();
const num = (sel) => parseFloat(String(val(sel)).replace(',', '.'));

// ---------- theme ----------
function setTheme(t) { S.settings.theme = t; if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; if (typeof mapSetTheme === 'function') setTimeout(mapSetTheme, 0); $('#s-theme').value = t; saveState(); }
function applyView() { document.body.classList.toggle('compact', !!S.settings.compact); document.body.classList.toggle('no-ts', !S.settings.ts); }

// ---------- channel dialog ----------
function channelDlgUpdate() {
  const ty = $('input[name=ctype]:checked').value; const sec = $('#ch-secret'), gen = $('#ch-gen'), name = $('#ch-name');
  sec.closest('.field').hidden = ty === 'public' || ty === 'hashtag'; name.closest('.field').hidden = ty === 'public'; gen.hidden = ty !== 'key';
  sec.type = ty === 'password' ? 'password' : 'text'; sec.placeholder = ty === 'password' ? t('ch.phPassword') : t('ch.phKey');
  $('#ch-help').textContent = t({ public: 'ch.helpPublic', hashtag: 'ch.helpHashtag', key: 'ch.helpKey', password: 'ch.helpPassword' }[ty]);
  if (ty === 'hashtag' && name.value && !name.value.startsWith('#')) name.value = '#' + name.value;
}
async function channelDlgSubmit() {
  const ty = $('input[name=ctype]:checked').value; const name = val('#ch-name'), sec = $('#ch-secret').value;
  if (ty === 'public') return joinChannel('#public');
  if (!name) { toast(t('ch.needName'), 'err'); return; }
  if (ty === 'hashtag') return joinChannel(name.startsWith('#') ? name : '#' + name);
  if (!sec) { toast(t('ch.needSecret'), 'err'); return; }
  return joinChannel(name, sec, ty);
}

// ---------- login dialog ----------
function openLoginDlg(c) { S.loginTarget = c; $('#login-room').textContent = displayName(c); $('#login-pw').value = S.roomPw[c.pub]?.pw || ''; $('#login-auto').checked = !!S.roomPw[c.pub]?.auto; $('#dlg-login').showModal(); setTimeout(() => $('#login-pw').focus(), 30); }

// ---------- contacts dialog ----------
function renderContactsDlg() {
  const q = val('#contacts-search').toLowerCase(), type = val('#contacts-type'), sort = val('#contacts-sort'), showStale = $('#contacts-stale').checked;
  let list = Array.from(S.contacts.values()).filter(c => !c.hidden);
  const total = list.length;
  if (type) list = list.filter(c => String(c.type) === type);
  if (q) list = list.filter(c => cname(c).toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || c.pub.startsWith(q) || (S.extras[c.pub]?.note || '').toLowerCase().includes(q));
  const staleT = nowSecs() - S.settings.staleDays * 86400; const staleCount = list.filter(c => (c.lastAdvert || 0) < staleT).length;
  if (!showStale) list = list.filter(c => (c.lastAdvert || 0) >= staleT);
  const fav = (c) => (c.flags & 1) || S.extras[c.pub]?.fav ? 0 : 1;
  list.sort((a, b) => fav(a) - fav(b) || (sort === 'name' ? cname(a).localeCompare(cname(b), LANG, { sensitivity: 'base' }) : sort === 'type' ? (a.type - b.type || cname(a).localeCompare(cname(b))) : sort === 'dist' ? ((distanceKm(S.self, a) ?? 1e9) - (distanceKm(S.self, b) ?? 1e9)) : ((b.lastAdvert || 0) - (a.lastAdvert || 0))));
  $('#contacts-count').textContent = `(${list.length}${list.length !== total ? t('ct.of', total) : ''}${S.dev?.maxContacts ? t('ct.max', S.dev.maxContacts) : ''})`;
  $('#ct-prune').textContent = t('ct.prune', staleCount); $('#ct-prune').disabled = !staleCount;
  $('#contacts-table tbody').innerHTML = list.map(c => { const p = pathInfo(c); const d = distanceKm(S.self, c); const x = S.extras[c.pub] || {}; return `<tr data-key="${c.pub}">
    <td><span class="fav ${(c.flags & 1) || x.fav ? 'on' : ''}" data-act="fav" title="${esc(t('ct.fav'))}">★</span></td>
    <td class="mono"><div>${esc(cname(c))}</div>${x.alias ? `<div class="mute" style="font-size:10.5px">${esc(c.name)}</div>` : ''}${x.note ? `<div class="mute" style="font-size:10.5px;font-family:var(--sans)">${esc(x.note)}</div>` : ''}</td>
    <td><span class="type ${TYPE_CSS[c.type] || ''}">${esc(advType(c.type))}</span>${c.loggedIn ? ` <span class="dot on" title="${esc(t('ct.loggedIn'))}"></span>` : ''}</td>
    <td class="hide-m dim" title="${c.lastAdvert ? fmtDateTime(c.lastAdvert) : ''}">${c.lastAdvert ? fmtAgo(c.lastAdvert) : '—'}${c.lastSnr != null ? ` · ${c.lastSnr.toFixed(1)} dB` : ''}</td>
    <td class="hide-m mono dim" title="${esc(p.hashes.map(hashLabel).join(', '))}">${p.hashes.length ? p.hashes.join(',') : p.text}${d != null ? `<div class="mute" style="font-size:10.5px">${d.toFixed(1)} km</div>` : ''}</td>
    <td><div class="acts"><button class="btn sm" data-act="chat">${esc(c.type === 2 || c.type === 4 ? t('ct.console') : t('ct.chat'))}</button><button class="btn sm ghost" data-act="edit">${esc(t('ct.info'))}</button><button class="btn sm ghost danger" data-act="del" aria-label="${esc(t('ui.delete'))}">${icon('x')}</button></div></td></tr>`; }).join('') || `<tr><td colspan="6" class="dim" style="padding:14px">${esc(t('ct.none'))}</td></tr>`;
  const pend = Array.from(S.pendingAdverts.values()); const pb = $('#pending-adverts'); pb.hidden = !pend.length;
  $('#pending-list').innerHTML = pend.map(c => `<div class="row pend" data-key="${c.pub}"><span class="type ${TYPE_CSS[c.type] || ''}">${esc(advType(c.type))}</span><span class="mono grow">${esc(c.name)}</span><span class="dim">${fmtAgo(c.lastAdvert)}</span><button class="btn sm primary" data-act="accept">${esc(t('ct.accept'))}</button><button class="btn sm ghost" data-act="ignore">${esc(t('ct.ignore'))}</button></div>`).join('');
}
async function contactsDlgAction(pub, act) {
  const c = S.contacts.get(pub); if (!c) return;
  if (act === 'chat') { const cv = convForContact(c); cv.open = true; $('#dlg-contacts').close(); openConv(cv.key); }
  else if (act === 'edit') openContactDlg(c);
  else if (act === 'del') await deleteContact(c);
  else if (act === 'fav') { const x = S.extras[pub] = S.extras[pub] || {}; const newFav = !((c.flags & 1) || x.fav); x.fav = newFav; if (C.connected) { try { c.flags = newFav ? (c.flags | 1) : (c.flags & ~1); await C.addUpdateContact(c); } catch (e) { debugLog('fav: ' + e.message); } } renderContactsDlg(); renderTree(); saveState(); }
}
function openContactDlg(c) {
  S.editContact = c; const x = S.extras[c.pub] || {}; const p = pathInfo(c);
  $('#ce-title').textContent = displayName(c); $('#ce-name').value = c.name; $('#ce-alias').value = x.alias || ''; $('#ce-note').value = x.note || ''; $('#ce-fav').checked = !!((c.flags & 1) || x.fav);
  $('#ce-type').value = c.type; $('#ce-pub').value = c.pub; $('#ce-path').value = p.hashes.length ? p.hashes.map(hashLabel).join(' → ') : p.text;
  $('#ce-advert').value = c.lastAdvert ? fmtDateTime(c.lastAdvert) : t('ago.never'); $('#ce-loc').value = c.lat ? `${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}` + (distanceKm(S.self, c) != null ? ` (${distanceKm(S.self, c).toFixed(1)} km)` : '') : '—';
  $('#ce-perm').value = c.flags >> 1; $('#dlg-contact').showModal();
}
async function saveContactDlg() {
  const c = S.editContact; if (!c) return; const x = S.extras[c.pub] = S.extras[c.pub] || {};
  x.alias = val('#ce-alias') || undefined; x.note = val('#ce-note') || undefined; x.fav = $('#ce-fav').checked || undefined;
  const newType = parseInt(val('#ce-type')), perm = Math.max(0, Math.min(127, parseInt(val('#ce-perm')) || 0)); const newFlags = (perm << 1) | ($('#ce-fav').checked ? 1 : 0);
  if (C.connected && (newType !== c.type || newFlags !== c.flags)) { try { c.type = newType; c.flags = newFlags; await C.addUpdateContact(c); } catch (e) { errorMsg(t('ct.updateFailed', e.message)); } }
  const cv = S.convs.get(convKeyFor(c)); if (cv) { cv.name = displayName(c); cv.kind = TYPE_KIND[c.type] || 'dm'; }
  saveState(); renderTree(); if ($('#dlg-contacts').open) renderContactsDlg(); const acv = activeConv(); if (acv.pub === c.pub) { renderHead(acv); renderUsers(acv); }
}
async function addContactManual() {
  const pub = val('#ac-pub').toLowerCase().replace(/[^0-9a-f]/g, ''), name = val('#ac-name'), type = parseInt(val('#ac-type'));
  if (pub.length !== 64) { toast(t('ct.pubLen'), 'err'); return; }
  if (!requireConn(activeConv())) return;
  await C.addUpdateContact({ pub, type, flags: 0, outPathLen: -1, outPath: '', name: name || pub.slice(0, 8), lastAdvert: 0, lat: 0, lon: 0 });
  await refreshContacts(); toast(t('ct.added'), 'ok'); renderContactsDlg();
}
async function acceptPending(pub) { const c = S.pendingAdverts.get(pub); if (!c || !requireConn(activeConv())) return; try { await C.addUpdateContact(c); S.pendingAdverts.delete(pub); await refreshContacts(); toast(t('ct.addedName', c.name), 'ok'); } catch (e) { errorMsg(t('ct.addFailed', e.message)); } renderContactsDlg(); }
async function pruneStale() {
  const staleT = nowSecs() - S.settings.staleDays * 86400; const list = Array.from(S.contacts.values()).filter(c => !c.hidden && (c.lastAdvert || 0) < staleT && !((c.flags & 1) || S.extras[c.pub]?.fav));
  if (!list.length) return; if (!await confirmDlg(t('prune.title'), t('prune.text', list.length, S.settings.staleDays), t('ui.delete'), true)) return;
  let n = 0; for (const c of list) { try { if (C.connected) await C.removeContact(c.pub); c.hidden = true; n++; } catch (e) { debugLog('prune ' + cname(c) + ': ' + e.message); } }
  renderTree(); renderContactsDlg(); saveState(); toast(t('prune.done', n), 'ok');
}

// ---------- settings dialog ----------
const RADIO_PRESETS = { 'eu-869': [869.618, 250, 11, 5, 'EU/UK 869.618 · BW250 · SF11 · CR5 (standaard)'], 'eu-868n': [869.618, 62.5, 8, 8, 'EU narrow 869.618 · BW62.5 · SF8 · CR8'], 'eu-433': [433.650, 250, 10, 5, 'EU 433.650 · BW250 · SF10 · CR5'], 'us-910': [910.525, 62.5, 7, 5, 'USA/Canada 910.525 · BW62.5 · SF7 · CR5'], 'au-915': [915.800, 250, 11, 5, 'AU/NZ 915.800 · BW250 · SF11 · CR5'], 'anz-9': [917.5, 250, 10, 5, 'ANZ 917.500 · BW250 · SF10 · CR5'] };
// ---------- handmatig pad ----------
function openPathDlg(c) {
  S.pathTarget = c; const p = pathInfo(c); S.pathList = p.hashes.map(h => { const m = resolveHash(h); return { hash: h, pub: m.length ? m[0].pub : null, name: m.length ? cname(m[0]) : null }; });
  S.pathSize = p.hashes.length ? p.size : (1 << (S.dev?.pathHashMode || 0));
  $('#pd-title').textContent = t('path.dlgTitle', displayName(c)); $('#pd-size').value = S.pathSize;
  const rpts = Array.from(S.contacts.values()).filter(x => !x.hidden && x.pub !== c.pub).sort((a, b) => (a.type === 2 ? 0 : 1) - (b.type === 2 ? 0 : 1) || cname(a).localeCompare(cname(b)));
  $('#pd-add').innerHTML = rpts.map(x => `<option value="${x.pub}">${esc(cname(x))} (${esc(advType(x.type))})</option>`).join('');
  renderPathDlg(); $('#dlg-path').showModal();
}
function renderPathDlg() {
  const sz = S.pathSize; const list = S.pathList;
  $('#pd-chips').innerHTML = list.length ? list.map((h, i) => `<span class="chip pd-chip" data-i="${i}"><span class="mono">${i + 1}. ${esc(h.pub ? h.pub.slice(0, sz * 2) : h.hash)}</span>&nbsp;${esc(h.name || '?')}&nbsp;<button class="x" data-act="up" title="↑" ${i === 0 ? 'disabled' : ''}>↑</button><button class="x" data-act="del" aria-label="×">×</button></span>`).join('') : `<span class="dim">${esc(t('path.flood'))}</span>`;
  $('#pd-info').textContent = t('path.dlgInfo', list.length, list.length * sz, 64);
}
async function savePathDlg() {
  const c = S.pathTarget; if (!c) return; const pubs = S.pathList.map(h => h.pub || null); if (pubs.some(p => !p)) { toast(t('path.unknownHop'), 'err'); return; }
  const ok = await setManualPath(c, pubs, S.pathSize); if (ok) { $('#dlg-path').close(); const cv = activeConv(); if (cv.pub === c.pub) { renderHead(cv); renderUsers(cv); } }
}
function openMapSettings() { fillSettings().then(() => { $('#dlg-settings').showModal(); $$('.tab').find(x => x.dataset.tab === 'map')?.click(); }); }
async function renderMapSettings() {
  if (!$('#map-countries')) return;
  const ovz = S.settings.mapOvz || 7, detz = S.settings.mapDetz || 12, sel = new Set(S.settings.mapCountries || []);
  $('#map-ovz').value = ovz; $('#map-detz').value = detz;
  const codes = Object.keys(MAP_SIZES.countries).filter(code => mapEstimate(code, 14) > 2e6).sort((a, b) => MAP_SIZES.countries[a].name.localeCompare(MAP_SIZES.countries[b].name, i18nLocale()));
  $('#map-countries').innerHTML = codes.map(code => { const c = MAP_SIZES.countries[code]; const extra = Math.max(0, mapEstimate(code, detz) - mapEstimate(code, ovz)); return `<label><input type="checkbox" value="${code}" ${sel.has(code) ? 'checked' : ''}> ${esc(c.name)}<span class="sz">${fmtBytes(extra)}</span></label>`; }).join('');
  const ov = mapEstimateOverview(ovz); let cs = 0; for (const code of sel) cs += Math.max(0, mapEstimate(code, detz) - mapEstimate(code, ovz));
  $('#map-total').textContent = t('map.total', fmtBytes(ov + cs), fmtBytes(ov), fmtBytes(cs));
  try { const st = await mapCacheStats(); $('#map-cache-stats').textContent = t('map.cacheStats', fmtBytes(st.bytes), st.count, st.quota ? fmtBytes(st.quota.usage) : '?', st.quota ? fmtBytes(st.quota.quota) : '?', st.persisted ? t('map.persisted') : t('map.notPersisted')); $('#map-persist').hidden = !!st.persisted; } catch (e) {}
}
async function startMapPrefetch() {
  if (!(await mapAvailable()) || mapAvailReason.startsWith('offline')) { toast(t('map.needOnline'), 'err'); return; }
  const btn = $('#map-download'), bar = $('#map-progress'), txt = $('#map-progress-txt'); btn.disabled = true; $('#map-cancel').hidden = false; bar.hidden = false;
  const plan = { overviewZ: S.settings.mapOvz || 7, countries: (S.settings.mapCountries || []).map(code => ({ code, zmax: S.settings.mapDetz || 12 })) };
  try {
    const r = await mapPrefetch(plan, (p) => { bar.querySelector('i').style.width = Math.round(100 * p.done / Math.max(1, p.total)) + '%'; txt.textContent = t('map.progress', p.done, p.total, fmtBytes(p.bytes), p.failed); });
    toast(t('map.done', r.done, fmtBytes(r.bytes)), 'ok', 6000);
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; $('#map-cancel').hidden = true; renderMapSettings(); }
}
async function fillSettings() {
  renderMapSettings();
  const conn = C.connected; $$('#dlg-settings [data-needs-conn]').forEach(el => el.disabled = !conn);
  if (S.self) {
    $('#s-name').value = S.self.name; $('#s-pub').value = S.self.pub; $('#s-lat').value = S.self.lat || ''; $('#s-lon').value = S.self.lon || '';
    $('#s-freq').value = S.self.freq; $('#s-bw').value = S.self.bw; $('#s-sf').value = S.self.sf; $('#s-cr').value = S.self.cr; $('#s-tx').value = S.self.txPower; $('#s-tx').max = S.self.maxTxPower || 30;
    $('#s-manual-add').checked = !!S.self.manualAdd; $('#s-multiacks').checked = !!S.self.multiAcks; $('#s-locpolicy').value = S.self.locPolicy;
    $('#s-telem-base').value = S.self.telemetryMode & 3; $('#s-telem-loc').value = (S.self.telemetryMode >> 2) & 3; $('#s-telem-env').value = (S.self.telemetryMode >> 4) & 3;
  }
  if (S.dev) { $('#s-model').value = S.dev.model || '?'; $('#s-fw').value = (S.dev.version || '?') + t('set.protocol', S.dev.fwVer); $('#s-build').value = S.dev.build || '?'; $('#s-pin').value = S.dev.blePin || ''; $('#s-repeat').checked = !!S.dev.repeatEn; $('#s-hashmode').value = S.dev.pathHashMode ?? 0; $('#s-limits').value = t('set.limits', S.dev.maxContacts || '?', S.dev.maxChannels || '?'); }
  $('#s-region-name').value = S.defaultScope?.name || ''; $('#s-region-key').value = S.defaultScope?.key || '';
  renderRegions();
  $('#s-scope-mode').value = S.sendScope.mode; $('#s-scope-name').value = S.sendScope.name || ''; $('#s-scope-key').value = S.sendScope.key || ''; scopeModeUpdate();
  $('#s-retries').value = S.settings.retries ?? 3;
  $('#s-theme').value = S.settings.theme; $('#s-lang').value = LANG; $('#s-ts').checked = S.settings.ts; $('#s-meta').checked = S.settings.meta; $('#s-compact').checked = !!S.settings.compact; $('#s-notif').checked = S.settings.notif; $('#s-debug').checked = !!S.settings.debug; $('#s-stale').value = S.settings.staleDays; $('#s-favonly').checked = !!S.settings.favOnly;
  try { $('#s-storage').textContent = t('set.storage', ((localStorage.getItem(LS_KEY) || '').length / 1024).toFixed(0), Array.from(S.convs.values()).reduce((n, c) => n + c.msgs.length, 0)); } catch (e) {}
  if (conn) {
    try { const tm = await C.getTime(); $('#s-devtime').value = fmtDateTime(tm) + ` (${tm - nowSecs() >= 0 ? '+' : ''}${tm - nowSecs()} s)`; } catch (e) {}
    try { const a = await C.getAutoAdd(); $('#s-aa-overwrite').checked = !!(a.mask & 1); $('#s-aa-chat').checked = !!(a.mask & 2); $('#s-aa-rpt').checked = !!(a.mask & 4); $('#s-aa-room').checked = !!(a.mask & 8); $('#s-aa-sensor').checked = !!(a.mask & 16); $('#s-aa-hops').value = a.maxHops ?? ''; $('#s-autoadd-box').hidden = false; } catch (e) { $('#s-autoadd-box').hidden = true; }
    try { const tu = await C.getTuning(); $('#s-tuning-rx').value = tu.rxDelayBase; $('#s-tuning-af').value = tu.airtimeFactor; } catch (e) {}
    try { const r = await C.getAllowedRepeatFreq(); $('#s-repeat-help').textContent = r.length ? t('set.repeatAllowed', r.map(x => x[0] === x[1] ? x[0] + ' MHz' : x[0] + '–' + x[1] + ' MHz').join(', ')) : ''; } catch (e) {}
    try { S.batt = await C.getBattery(); renderBattery(); $('#s-battery').value = (S.batt.mv / 1000).toFixed(2) + ' V' + (S.batt.totalKb ? t('batt.storage', S.batt.usedKb, S.batt.totalKb) : ''); } catch (e) {}
  }
}
function renderRegions() {
  const regions = S.settings.regions; const tb = $('#regions-table tbody'); if (!tb) return;
  tb.innerHTML = regions.map((r, i) => `<tr data-i="${i}"><td class="mono">${esc(r.name)}${S.defaultScope && S.defaultScope.key === r.key ? ` <span class="type room" title="${esc(t('rg.nodeTag'))}">${esc(t('rg.node'))}</span>` : ''}${S.sendScope.mode === 'custom' && S.sendScope.key === r.key ? ` <span class="type chat" title="${esc(t('rg.globalTag'))}">${esc(t('rg.global'))}</span>` : ''}</td><td class="hide-m mono dim" style="font-size:10.5px">${r.key}</td><td><div class="acts"><button class="btn sm" data-act="global" title="${esc(t('rg.useGlobal'))}">${esc(t('rg.globalBtn'))}</button><button class="btn sm" data-act="node" data-needs-conn title="${esc(t('rg.useNode'))}">${esc(t('rg.nodeBtn'))}</button><button class="btn sm ghost danger" data-act="del" aria-label="${esc(t('ui.delete'))}">${icon('x')}</button></div></td></tr>`).join('') || `<tr><td colspan="3" class="dim" style="padding:10px">${esc(t('rg.none'))}</td></tr>`;
  const sel = $('#rg-rpt'); if (sel) { const rpts = Array.from(S.contacts.values()).filter(c => !c.hidden && c.type === 2).sort((a, b) => (b.loggedIn ? 1 : 0) - (a.loggedIn ? 1 : 0) || cname(a).localeCompare(cname(b))); sel.innerHTML = rpts.map(c => `<option value="${c.pub}">${esc(cname(c))}${c.loggedIn ? esc(t('rg.loggedIn')) : ''}</option>`).join('') || `<option value="">${esc(t('rg.noRepeaters'))}</option>`; }
  $$('#dlg-settings [data-needs-conn]').forEach(el => el.disabled = !C.connected);
}
async function addRegion(name, key) {
  name = (name || '').trim().replace(/^#/, ''); if (!name) { toast(t('rg.needName'), 'err'); return null; }
  key = (key || '').trim().toLowerCase(); if (!/^[0-9a-f]{32}$/.test(key)) key = await scopeKeyFromName(name);
  const r = S.settings.regions; const ex = r.find(x => x.key === key); if (ex) { ex.name = name; } else r.push({ name, key });
  saveState(); renderRegions(); return { name, key };
}
async function discoverRegions() {
  const c = S.contacts.get(val('#rg-rpt')); if (!c) { toast(t('rg.pickRepeater'), 'err'); return; }
  if (!requireConn(activeConv())) return;
  if (!c.loggedIn) { toast(t('rg.loginFirst', cname(c)), 'warn', 6000); openConv(convKeyFor(c)); openLoginDlg(c); $('#dlg-settings').close(); return; }
  const btn = $('#rg-discover'); btn.disabled = true; btn.textContent = t('rg.waiting');
  try {
    const text = await askCli(c, 'region');
    const { names, home } = parseRegionReply(text);
    if (!names.length) { toast(t('rg.noneRecognized', text.slice(0, 80)), 'warn', 8000); return; }
    S.rgCandidates = []; for (const n of names) { const key = await scopeKeyFromName(n); S.rgCandidates.push({ name: n, key, known: S.settings.regions.some(r => r.key === key) }); }
    $('#rg-src').textContent = cname(c); $('#rg-raw').textContent = text;
    const nodeKey = S.defaultScope?.key; const pre = home || null;
    $('#rg-pick tbody').innerHTML = S.rgCandidates.map((r, i) => `<tr><td><input type="checkbox" data-i="${i}" ${r.known ? '' : 'checked'}></td><td class="mono">${esc(r.name)}${r.known ? ` <span class="dim">${esc(t('rg.known'))}</span>` : ''}${r.name === home ? ` <span class="type room">${esc(t('rg.home'))}</span>` : ''}</td><td class="hide-m mono dim" style="font-size:10.5px">${r.key}</td><td><input type="radio" name="rg-node" value="${i}" ${(pre ? r.name === pre : r.key === nodeKey) ? 'checked' : ''}></td></tr>`).join('');
    $('#dlg-regions').showModal();
  } catch (e) { toast(e.message, 'err', 7000); }
  finally { btn.disabled = false; btn.textContent = t('rg.discoverBtn'); }
}
async function applyDiscovered() {
  const picks = $$('#rg-pick input[type=checkbox]:checked').map(i => S.rgCandidates[+i.dataset.i]); const nodeSel = $('#rg-pick input[name=rg-node]:checked');
  for (const p of picks) await addRegion(p.name, p.key);
  if (nodeSel) { const r = S.rgCandidates[+nodeSel.value]; await addRegion(r.name, r.key);
    if (C.connected) { try { await C.setDefaultScope(r.name, r.key); S.defaultScope = { name: r.name, key: r.key }; $('#s-region-name').value = r.name; $('#s-region-key').value = r.key; } catch (e) { toast(t('rg.setNodeFailed', e.message), 'err'); } }
    if ($('#rg-set-global').checked) { S.sendScope = { mode: 'custom', name: r.name, key: r.key }; $('#s-scope-mode').value = 'custom'; $('#s-scope-name').value = r.name; $('#s-scope-key').value = r.key; scopeModeUpdate(); await applySendScope(true); }
  }
  saveState(); renderRegions(); $('#dlg-regions').close(); toast(t('rg.applied', picks.length), 'ok'); renderHead(activeConv());
}
function scopeModeUpdate() { const m = $('#s-scope-mode').value; $('#s-scope-custom').hidden = m !== 'custom'; }
async function saveNode() {
  if (!requireConn(activeConv())) return;
  const name = val('#s-name').slice(0, 31); if (name && name !== S.self.name) { await C.setName(name); S.self.name = name; renderNick(); }
  const tm = (parseInt(val('#s-telem-base')) & 3) | ((parseInt(val('#s-telem-loc')) & 3) << 2) | ((parseInt(val('#s-telem-env')) & 3) << 4);
  await C.setOtherParams($('#s-manual-add').checked ? 1 : 0, tm, parseInt(val('#s-locpolicy')), $('#s-multiacks').checked ? 1 : 0);
  S.self.manualAdd = $('#s-manual-add').checked ? 1 : 0; S.self.telemetryMode = tm; S.self.locPolicy = parseInt(val('#s-locpolicy')); S.self.multiAcks = $('#s-multiacks').checked ? 1 : 0;
  if (!$('#s-autoadd-box').hidden) { const mask = ($('#s-aa-overwrite').checked ? 1 : 0) | ($('#s-aa-chat').checked ? 2 : 0) | ($('#s-aa-rpt').checked ? 4 : 0) | ($('#s-aa-room').checked ? 8 : 0) | ($('#s-aa-sensor').checked ? 16 : 0); const hops = val('#s-aa-hops'); try { await C.setAutoAdd(mask, hops === '' ? null : parseInt(hops)); } catch (e) { debugLog('autoadd: ' + e.message); } }
  toast(t('node.saved'), 'ok'); notice(t('node.savedNotice'), S.convs.get('status'), false); renderHead(activeConv());
}
async function saveLocation() {
  if (!requireConn(activeConv())) return; const lat = num('#s-lat') || 0, lon = num('#s-lon') || 0;
  await C.setLatLon(lat, lon); S.self.lat = lat; S.self.lon = lon; await C.setOtherParams(S.self.manualAdd, S.self.telemetryMode, parseInt(val('#s-locpolicy')), S.self.multiAcks); S.self.locPolicy = parseInt(val('#s-locpolicy'));
  toast(t('loc.saved'), 'ok');
}
async function saveRadio() {
  if (!requireConn(activeConv())) return; const f = num('#s-freq'), bw = num('#s-bw'), sf = parseInt(val('#s-sf')), cr = parseInt(val('#s-cr')), tx = parseInt(val('#s-tx'));
  if (!(f >= 150 && f <= 2500) || !(sf >= 5 && sf <= 12) || !(cr >= 5 && cr <= 8) || !(bw >= 7 && bw <= 500)) { toast(t('radio.invalid'), 'err'); return; }
  if (!await confirmDlg(t('radio.title'), t('radio.confirm', f, bw, sf, cr, tx), t('ui.save'))) return;
  try { await C.setRadioFull(f, bw, sf, cr, $('#s-repeat').checked); } catch (e) { if (e.errCode === 6 && $('#s-repeat').checked) { toast(t('radio.repeatNotAllowed'), 'err'); return; } await C.setRadio(f, bw, sf, cr); }
  if (tx !== S.self.txPower) await C.setTxPower(tx);
  Object.assign(S.self, { freq: f, bw, sf, cr, txPower: tx }); if (S.dev) S.dev.repeatEn = $('#s-repeat').checked ? 1 : 0;
  const hm = parseInt(val('#s-hashmode')); if (S.dev && hm !== (S.dev.pathHashMode ?? 0)) { try { await C.setPathHashMode(hm); S.dev.pathHashMode = hm; } catch (e) { toast(t('radio.hashUnsupported'), 'warn'); } }
  toast(t('radio.saved'), 'ok'); notice(t('radio.setNotice', f, bw, sf, cr, tx), S.convs.get('status'), false); renderHead(activeConv());
}
async function saveTuning() { if (!requireConn(activeConv())) return; await C.setTuning(num('#s-tuning-rx') || 0, num('#s-tuning-af') || 0); toast(t('tuning.saved'), 'ok'); }
async function saveRegion() {
  if (!requireConn(activeConv())) return; const name = val('#s-region-name').replace(/^#/, ''); let key = val('#s-region-key').toLowerCase();
  if (!name) { await C.setDefaultScope('', ''); S.defaultScope = null; toast(t('region.clearedToast'), 'ok'); }
  else { if (!/^[0-9a-f]{32}$/.test(key)) { key = await scopeKeyFromName(name); $('#s-region-key').value = key; } await C.setDefaultScope(name, key); S.defaultScope = { name, key }; rememberRegion(name, key); renderRegions(); toast(t('region.saved'), 'ok'); }
  await applySendScope(false); saveState(); renderInfo(activeConv());
}
async function applyScopeDlg() {
  const mode = val('#s-scope-mode'); let name = val('#s-scope-name'), key = val('#s-scope-key').toLowerCase();
  if (mode === 'custom') { if (!/^[0-9a-f]{32}$/.test(key)) { if (!name) { toast(t('scope.needNameOrKey'), 'err'); return; } key = await scopeKeyFromName(name); $('#s-scope-key').value = key; } }
  S.sendScope = { mode, name, key: mode === 'custom' ? key : '' }; saveState(); await applySendScope(true); toast(t('scope.sendScope', sendScopeText()), 'ok');
}
async function savePin() { if (!requireConn(activeConv())) return; const p = parseInt(val('#s-pin')) || 0; if (p !== 0 && (p < 100000 || p > 999999)) { toast(t('pin.invalid'), 'err'); return; } await C.setDevicePin(p); toast(t('pin.saved'), 'ok'); }
async function exportPrivKey() { if (!requireConn(activeConv())) return; if (!await confirmDlg(t('pk.exportTitle'), t('pk.exportWarn'), t('pk.show'), true)) return; try { const k = await C.exportPrivateKey(); await promptDlg(t('pk.hexTitle'), t('pk.copyKeep'), k); } catch (e) { toast(t('pk.exportFailed', e.message), 'err'); } }
async function importPrivKey() { if (!requireConn(activeConv())) return; const k = await promptDlg(t('pk.importTitle'), t('pk.hex128'), ''); if (!k) return; if (k.replace(/[^0-9a-f]/gi, '').length !== 128) { toast(t('pk.expect128'), 'err'); return; } if (!await confirmDlg(t('pk.replaceTitle'), t('pk.replaceText'), t('ui.import'), true)) return; await C.importPrivateKey(k); toast(t('pk.imported'), 'ok'); }

// ---------- config export / import ----------
async function exportConfig(includeKey) {
  const cfg = { app: 'MeshChat', format: 1, exportedAt: new Date().toISOString(), node: null, channels: S.channels.filter(c => c && c.name).map(c => ({ name: c.name, secret: c.secret })), contacts: Array.from(S.contacts.values()).filter(c => !c.hidden).map(({ loggedIn, perms, hidden, lastSnr, _loginPending, ...c }) => c), local: { extras: S.extras, roomPw: S.roomPw, settings: S.settings, sendScope: S.sendScope } };
  if (S.self) { cfg.node = { name: S.self.name, pub: S.self.pub, lat: S.self.lat, lon: S.self.lon, radio: { freq: S.self.freq, bw: S.self.bw, sf: S.self.sf, cr: S.self.cr, tx: S.self.txPower, repeat: S.dev?.repeatEn || 0 }, manualAdd: S.self.manualAdd, telemetryMode: S.self.telemetryMode, locPolicy: S.self.locPolicy, multiAcks: S.self.multiAcks, defaultScope: S.defaultScope, pathHashMode: S.dev?.pathHashMode ?? 0, blePin: S.dev?.blePin };
    if (C.connected) { try { cfg.node.autoAdd = await C.getAutoAdd(); } catch (e) {} try { cfg.node.tuning = await C.getTuning(); } catch (e) {} if (includeKey) { try { cfg.node.privateKey = await C.exportPrivateKey(); } catch (e) { toast(t('cfg.pkNotExportable', e.message), 'warn'); } } }
  }
  downloadJson(cfg, `meshchat-config-${(S.self?.name || 'node').replace(/[^\w-]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`);
}
function exportHistory() { const h = {}; for (const [k, cv] of S.convs) h[k] = { name: cv.name, kind: cv.kind, msgs: cv.msgs }; downloadJson({ app: 'MeshChat', history: h }, t('cfg.historyFile')); }
function downloadJson(obj, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
async function importConfig(file) {
  let cfg; try { cfg = JSON.parse(await file.text()); } catch (e) { toast(t('cfg.badJson'), 'err'); return; }
  if (cfg.app !== 'MeshChat') { toast(t('cfg.notMeshchat'), 'err'); return; }
  const parts = []; if (cfg.node) parts.push(t('cfg.partNode')); if (cfg.channels?.length) parts.push(t('cfg.partChannels', cfg.channels.length)); if (cfg.contacts?.length) parts.push(t('cfg.partContacts', cfg.contacts.length)); if (cfg.node?.privateKey) parts.push(t('cfg.partPk')); if (cfg.local) parts.push(t('cfg.partLocal'));
  if (!await confirmDlg(t('cfg.importTitle'), t('cfg.apply', parts.join(', ')) + (C.connected ? t('cfg.applyConn') : t('cfg.applyOffline')), t('ui.import'), !!cfg.node?.privateKey)) return;
  if (cfg.local) { Object.assign(S.settings, cfg.local.settings || {}); S.extras = { ...S.extras, ...(cfg.local.extras || {}) }; S.roomPw = { ...S.roomPw, ...(cfg.local.roomPw || {}) }; if (cfg.local.sendScope) S.sendScope = cfg.local.sendScope; setTheme(S.settings.theme); applyView(); }
  if (C.connected) {
    const n = cfg.node; let errs = 0; const tryDo = async (f, label) => { try { await f(); } catch (e) { errs++; debugLog('import ' + label + ': ' + e.message); } };
    if (n) {
      if (n.privateKey) await tryDo(() => C.importPrivateKey(n.privateKey), 'privésleutel');
      if (n.name) await tryDo(() => C.setName(n.name), 'naam');
      if (n.radio) { await tryDo(() => C.setRadioFull(n.radio.freq, n.radio.bw, n.radio.sf, n.radio.cr, n.radio.repeat), 'radio'); if (n.radio.tx != null) await tryDo(() => C.setTxPower(n.radio.tx), 'tx'); }
      if (n.lat != null) await tryDo(() => C.setLatLon(n.lat, n.lon), 'locatie');
      await tryDo(() => C.setOtherParams(n.manualAdd || 0, n.telemetryMode || 0, n.locPolicy || 0, n.multiAcks || 0), 'opties');
      if (n.defaultScope) await tryDo(() => C.setDefaultScope(n.defaultScope.name, n.defaultScope.key), 'regio');
      if (n.autoAdd) await tryDo(() => C.setAutoAdd(n.autoAdd.mask, n.autoAdd.maxHops), 'autoadd');
      if (n.tuning) await tryDo(() => C.setTuning(n.tuning.rxDelayBase, n.tuning.airtimeFactor), 'tuning');
      if (n.pathHashMode != null) await tryDo(() => C.setPathHashMode(n.pathHashMode), 'hashmode');
    }
    for (const ch of (cfg.channels || [])) { if (S.channels.some(c => c && c.secret === ch.secret && c.name)) continue; const slot = freeChannelSlot(); if (slot < 0) { errs++; break; } await tryDo(async () => { await C.setChannel(slot, ch.name, ch.secret); S.channels[slot] = { idx: slot, ...ch }; }, 'kanaal ' + ch.name); }
    for (const c of (cfg.contacts || [])) if (!S.contacts.has(c.pub) || S.contacts.get(c.pub).hidden) await tryDo(() => C.addUpdateContact(c), 'contact ' + c.name);
    S.self = await C.appStart('MeshChat'); renderNick(); await refreshContacts(true); await refreshChannels(); S.defaultScope = await C.getDefaultScope().catch(() => null); await applySendScope(false);
    toast(errs ? t('cfg.doneErr', errs) : t('cfg.done'), errs ? 'warn' : 'ok'); if (n?.privateKey) notice(t('cfg.pkImportedNotice'), S.convs.get('status'), false);
  } else { for (const c of (cfg.contacts || [])) if (!S.contacts.has(c.pub)) S.contacts.set(c.pub, { ...c, hidden: true }); toast(t('cfg.localDone'), 'ok'); }
  if (S.settings.lang && S.settings.lang !== LANG) setLang(S.settings.lang);
  saveState(true); renderTree(); fillSettings();
}

// ---------- message context menu & info ----------
function msgFromEl(el) { const id = el?.dataset.id; const cv = activeConv(); return cv.msgs.find(m => m.id === id); }
function showCtx(x, y, items) {
  const ctx = $('#ctx'); ctx.innerHTML = items.filter(Boolean).map((it, i) => it === '-' ? '<div class="sep"></div>' : `<button class="ci ${it.danger ? 'danger' : ''}" data-i="${i}">${esc(it.label)}</button>`).join('');
  ctx.hidden = false; const r = ctx.getBoundingClientRect(); ctx.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; ctx.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  ctx.onclick = (e) => { const b = e.target.closest('.ci'); if (!b) return; ctx.hidden = true; const it = items.filter(Boolean)[b.dataset.i]; it.run && it.run(); };
}
document.addEventListener('click', (e) => { if (!e.target.closest('#ctx')) $('#ctx').hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#ctx').hidden = true; });
function msgContextItems(m, cv) {
  const c = m.pub ? S.contacts.get(m.pub) : contactByName(m.nick);
  return [
    { label: t('ctx.msgInfo'), run: () => showMsgInfo(m, cv) },
    { label: t('ctx.reply', m.nick), run: () => { const inp = $('#input'); inp.value = (cv.kind === 'channel' ? '@' + m.nick + ' ' : '') + inp.value; inp.focus(); } },
    c && !m.self ? { label: t('ctx.dm', cname(c)), run: () => { const cv2 = convForContact(c); cv2.open = true; openConv(cv2.key); } } : null,
    c ? { label: t('ctx.contactInfo', cname(c)), run: () => openContactDlg(c) } : null,
    c && c.lat ? { label: t('ctx.onMap', cname(c)), run: () => mapFocus(c.pub) } : null,
    '-',
    { label: t('ctx.copyText'), run: () => copyText(m.text) },
    m.rawHex || m.rx ? { label: t('ctx.copyRaw'), run: () => copyText(m.rx ? m.rx.rawHex : m.rawHex) } : null,
    m.self && m.ack === 'fail' && cv.kind !== 'channel' ? { label: t('ctx.resend'), run: () => sendToConv(cv, m.text) } : null,
    m.self && cv.kind === 'channel' && (m.heard === 'no' || m.heard === null || m.heard === undefined) && !m.heardVia ? { label: t('ctx.resendSame'), run: () => resendChannelMsg(cv, m) } : null,
    '-',
    { label: t('ctx.deleteLocal'), danger: true, run: () => { cv.msgs = cv.msgs.filter(x => x.id !== m.id); renderMessages(cv, true); saveState(); } },
  ];
}
function showMsgInfo(m, cv) {
  const rows = []; const add = (k, v) => v != null && v !== '' && rows.push(`<dt>${esc(k)}</dt><dd>${v}</dd>`);
  add(t('mi.time'), fmtDateTime(m.t) + (m.recvT ? esc(t('mi.received', fmtTime(m.recvT))) : ''));
  add(t('mi.from'), esc(m.nick) + (m.pub ? ` <span class="mute">${m.pub}</span>` : m.sig ? ` <span class="mute">${esc(t('mi.authorPrefix', m.sig))}</span>` : ''));
  add(t('mi.window'), esc(cv.name) + ' (' + cv.kind + ')');
  if (m.self) { add(t('mi.delivery'), esc(m.ack === 'ok' ? t('mi.confirmed') + (m.trip ? t('mi.after', m.trip) : '') : m.ack === 'fail' ? t('mi.noAck') : m.ack === 'pending' ? t('mi.pending') : (cv.kind === 'channel' ? t('mi.chanNoAck') : '—'))); add(t('mi.route'), m.flood == null ? null : m.flood ? 'flood' : 'direct'); add(t('mi.ackCode'), m.ackCode); add(t('mi.sendScope'), esc(m.scope || (S.defaultScope ? t('scope.defaultNamed', S.defaultScope.name) : t('scope.default')))); }
  else { add('SNR', m.snr != null ? m.snr.toFixed(1) + ' dB' : null); add('RSSI', m.rssi != null ? m.rssi + ' dBm' : null); add(t('mi.hops'), m.pathLen == null ? null : m.pathLen === 0xFF ? 'direct (0xFF)' : (m.pathLen & 63) + (m.pathLen >> 6 ? esc(t('mi.hashSize', (m.pathLen >> 6) + 1)) : '')); }
  add(t('mi.type'), m.txtType != null ? esc({ 0: t('mi.typeText'), 1: 'CLI', 2: t('mi.typeSigned') }[m.txtType] || m.txtType) : null);
  if (m.rx) {
    const p = m.rx; add(t('mi.rawRoute'), esc(routeName(p.route)) + esc(t('mi.payload', p.ptypeName, p.ver)));
    if (p.codes) add(t('mi.scopeCodes'), p.codes.map(c => c.toString(16).padStart(4, '0')).join(' / ') + (S.defaultScope ? t('mi.nodeRegion', esc(S.defaultScope.name)) : ''));
    add(t('mi.path'), p.hashes.length ? p.hashes.map((h, i) => `<div>${i + 1}. <b>${h}</b> ${resolveHash(h).map(c => esc(cname(c)) + ' <span class="mute">(' + esc(advType(c.type)) + (c.lat ? ', ' + c.lat.toFixed(3) + ',' + c.lon.toFixed(3) : '') + ')</span>').join(', ') || `<span class="mute">${esc(t('mi.unknownNode'))}</span>`}</div>`).join('') : `<span class="mute">${esc(t('mi.noRepeaters'))}</span>`);
    add(t('mi.rawPacket'), `<div class="raw">${p.rawHex}</div>`);
  } else if (!m.self) add(t('mi.rawPacket'), `<span class="mute">${esc(t('mi.rawUnavailable'))}</span>`);
  if (m.pathLen != null && m.pathLen !== 0xFF && !m.rx && !m.self) add(t('mi.path'), `<span class="mute">${esc(t('mi.pathHidden', m.pathLen & 63))}</span>`);
  $('#msg-info').innerHTML = `<dl>${rows.join('')}</dl>`; $('#dlg-msg').showModal();
}

// ---------- wiring ----------
function wire() {
  on('#btn-usb', 'click', () => connect('usb')); on('#btn-bt', 'click', () => connect('ble')); on('#btn-disconnect', 'click', () => C.disconnect());
  on('#lang-sel', 'change', (e) => setLang(e.target.value)); on('#s-lang', 'change', (e) => setLang(e.target.value));
  on('#btn-theme', 'click', () => { const dark = matchMedia('(prefers-color-scheme:dark)').matches; const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light'); setTheme(cur === 'dark' ? 'light' : 'dark'); });
  on('#btn-sidebar', 'click', () => document.body.classList.toggle('sidebar-open')); on('#btn-users', 'click', () => document.body.classList.toggle('users-open')); on('#backdrop', 'click', () => document.body.classList.remove('sidebar-open', 'users-open'));
  document.addEventListener('click', (e) => { const o = e.target.closest('[data-open]'); if (o) { const d = $('#' + o.dataset.open); if (d.id === 'dlg-settings') fillSettings(); if (d.id === 'dlg-contacts') renderContactsDlg(); if (d.id === 'dlg-channel') channelDlgUpdate(); d.showModal(); } const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close(); });
  $$('.tab').forEach(t => t.onclick = () => { const d = t.closest('dialog'); $$('.tab,.pane', d).forEach(e => e.classList.remove('active')); t.classList.add('active'); $(`[data-pane="${t.dataset.tab}"]`, d).classList.add('active'); });
  // tree
  on('#tree', 'click', (e) => { const it = e.target.closest('.item'); if (it && !e.target.closest('.add')) openConv(it.dataset.target); });
  on('#tree', 'contextmenu', (e) => { const it = e.target.closest('.item'); if (!it) return; e.preventDefault(); const cv = S.convs.get(it.dataset.target); if (!cv) return; const c = cv.pub ? S.contacts.get(cv.pub) : null; showCtx(e.clientX, e.clientY, [{ label: t('ctx.open'), run: () => openConv(cv.key) }, { label: t('ctx.markRead'), run: () => { cv.unread = 0; cv.hl = false; renderTree(); } }, c ? { label: t('ctx.contactInfoDots'), run: () => openContactDlg(c) } : null, c && c.lat ? { label: t('ctx.onMapShort'), run: () => mapFocus(c.pub) } : null, c && c.type >= 2 ? { label: c.loggedIn ? t('ctx.logout') : t('ctx.login'), run: () => c.loggedIn ? handleInput('/logout') : openLoginDlg(c) } : null, c && c.type === 3 ? { label: t('info.resync'), run: () => resyncRoom(c) } : null, c ? { label: t('path.setBtn') + '…', run: () => openPathDlg(c) } : null, '-', cv.kind === 'channel' ? { label: t('ctx.leaveChannel'), danger: true, run: () => leaveChannel(channelByConv(cv)) } : cv.kind === 'dm' ? { label: t('ctx.closeWindow'), run: () => closeConv(cv) } : null, { label: t('ctx.clearHistory'), danger: true, run: () => { cv.msgs = []; if (cv.key === S.active) renderMessages(cv); saveState(true); } }]); });
  on('#btn-chan-leave', 'click', () => closeConv(activeConv()));
  on('#btn-sync', 'click', () => handleInput('/sync'));
  // handmatig pad
  on('#pd-add-btn', 'click', () => { const pub = val('#pd-add'); const c = S.contacts.get(pub); if (!c) return; if ((S.pathList.length + 1) * S.pathSize > 64) { toast(t('path.tooLong'), 'err'); return; } S.pathList.push({ hash: c.pub.slice(0, S.pathSize * 2), pub: c.pub, name: cname(c) }); renderPathDlg(); });
  on('#pd-chips', 'click', (e) => { const b = e.target.closest('[data-act]'); const ch = e.target.closest('.pd-chip'); if (!b || !ch) return; const i = +ch.dataset.i; if (b.dataset.act === 'del') S.pathList.splice(i, 1); else if (b.dataset.act === 'up' && i > 0) { const x = S.pathList.splice(i, 1)[0]; S.pathList.splice(i - 1, 0, x); } renderPathDlg(); });
  on('#pd-size', 'change', () => { S.pathSize = +val('#pd-size'); renderPathDlg(); });
  on('#pd-flood', 'click', () => { S.pathList = []; renderPathDlg(); });
  on('#pd-save', 'click', () => savePathDlg().catch(e => toast(e.message, 'err')));
  on('#s-retries', 'change', (e) => { S.settings.retries = Math.max(0, Math.min(9, parseInt(e.target.value) || 0)); saveState(); });
  // kaart
  on('#map-fit', 'click', () => mapFitAll()); on('#map-me', 'click', () => { if (S.self && S.self.lat) mapFocus(S.self.pub, 11); else toast(t('map_no_location'), 'warn'); });
  on('#map-settings', 'click', openMapSettings);
  on('#map-persist', 'click', async () => { const ok = await mapRequestPersist(); toast(ok ? t('map.persistOk') : t('map.persistNo'), ok ? 'ok' : 'warn', 6000); renderMapSettings(); });
  on('#map-clear', 'click', async () => { const st = await mapCacheStats(); if (!await confirmDlg(t('h.mapClear'), t('map.clearConfirm', fmtBytes(st.bytes)), t('h.mapClear'), true)) return; await mapClearCache(); toast(t('map.cleared'), 'ok'); renderMapSettings(); });
  on('#map-ovz', 'change', () => { S.settings.mapOvz = +val('#map-ovz'); saveState(); renderMapSettings(); }); on('#map-detz', 'change', () => { S.settings.mapDetz = +val('#map-detz'); saveState(); renderMapSettings(); });
  on('#map-countries', 'change', (e) => { const cb = e.target.closest('input[type=checkbox]'); if (!cb) return; const set = new Set(S.settings.mapCountries || []); cb.checked ? set.add(cb.value) : set.delete(cb.value); S.settings.mapCountries = Array.from(set); saveState(); renderMapSettings(); });
  on('#map-download', 'click', startMapPrefetch); on('#map-cancel', 'click', () => mapPrefetchCancel());
  on('#chan-scope', 'change', async (e) => {
    const cv = activeConv(); const ch = cv.kind === 'channel' ? channelByConv(cv) : null; if (!ch) return; const v = e.target.value;
    if (v === 'global') await setChannelScope(ch, null);
    else if (v === 'default') await setChannelScope(ch, { mode: 'default', name: '', key: '' });
    else if (v === 'unscoped') await setChannelScope(ch, { mode: 'unscoped', name: '', key: '' });
    else if (v.startsWith('key:')) { const key = v.slice(4); const r = S.settings.regions.find(x => x.key === key) || (S.defaultScope && S.defaultScope.key === key ? S.defaultScope : null); await setChannelScope(ch, { mode: 'custom', name: r ? r.name : '', key }); }
    else if (v === 'new') { const name = await promptDlg(t('scope.otherTitle'), t('scope.otherLabel'), ''); if (name) await setChannelScope(ch, await parseScopeArgs(name.trim().split(/\s+/))); else renderChanScope(cv); }
  });
  on('#btn-chan-info', 'click', () => { const cv = activeConv(); const c = cv.pub ? S.contacts.get(cv.pub) : null; if (c) openContactDlg(c); else if (cv.kind === 'channel') { const ch = channelByConv(cv); if (ch) promptDlg(t('chkey.title', cv.name), t('chkey.label', b64(unhex(ch.secret))), ch.secret); } else fillSettings().then(() => $('#dlg-settings').showModal()); });
  // messages
  on('#messages', 'contextmenu', (e) => { const el = e.target.closest('.m'); if (!el) return; const m = msgFromEl(el); if (!m) return; e.preventDefault(); showCtx(e.clientX, e.clientY, msgContextItems(m, activeConv())); });
  on('#messages', 'dblclick', (e) => { const el = e.target.closest('.m'); const m = el && msgFromEl(el); if (m) showMsgInfo(m, activeConv()); });
  let pressTimer; on('#messages', 'touchstart', (e) => { const el = e.target.closest('.m'); if (!el) return; pressTimer = setTimeout(() => { const m = msgFromEl(el); if (m) { const t = e.touches[0]; showCtx(t.clientX, t.clientY, msgContextItems(m, activeConv())); } }, 550); }, { passive: true }); on('#messages', 'touchend', () => clearTimeout(pressTimer)); on('#messages', 'touchmove', () => clearTimeout(pressTimer));
  on('#messages', 'scroll', () => { const box = $('#messages'); if (box.scrollHeight - box.scrollTop - box.clientHeight < 40) document.body.classList.remove('unread-below'); });
  on('#scroll-bottom', 'click', () => { const box = $('#messages'); box.scrollTop = box.scrollHeight; document.body.classList.remove('unread-below'); });
  // users
  on('#userlist', 'click', (e) => { const u = e.target.closest('.user'); if (!u) return; const c = u.dataset.pub ? S.contacts.get(u.dataset.pub) : contactByName(u.dataset.nick); if (c) { const cv = convForContact(c); cv.open = true; openConv(cv.key); } else if (u.dataset.nick) { const inp = $('#input'); inp.value = '@' + u.dataset.nick + ' ' + inp.value; inp.focus(); } });
  on('#userlist', 'contextmenu', (e) => { const u = e.target.closest('.user'); if (!u) return; e.preventDefault(); const c = u.dataset.pub ? S.contacts.get(u.dataset.pub) : contactByName(u.dataset.nick); showCtx(e.clientX, e.clientY, [c ? { label: t('ctx.dmShort'), run: () => { const cv = convForContact(c); cv.open = true; openConv(cv.key); } } : null, c ? { label: t('ctx.contactInfoDots'), run: () => openContactDlg(c) } : null, c ? { label: t('ctx.whois'), run: () => handleInput('/whois ' + cname(c)) } : null, c && c.lat ? { label: t('ctx.onMapShort'), run: () => mapFocus(c.pub) } : null, { label: t('ctx.mention'), run: () => { const inp = $('#input'); inp.value = '@' + (u.dataset.nick || (c && cname(c))) + ' ' + inp.value; inp.focus(); } }]); });
  on('#info', 'click', async (e) => { const b = e.target.closest('[data-act]'); if (!b) return; const cv = activeConv(); const c = cv.pub ? S.contacts.get(cv.pub) : null; const act = b.dataset.act;
    const map = { status: '/status', telemetry: '/telemetry', trace: '/trace', discover: '/path', 'path-reset': '/resetpath', logout: '/logout', 'advert-flood': '/advert flood', 'advert-0': '/advert' };
    if (act === 'path-set' && c) openPathDlg(c); else if (act === 'map' && c) mapFocus(c.pub); else if (act === 'resync' && c) resyncRoom(c); else if (act === 'sync') handleInput('/sync'); else if (act === 'map-fit') mapFitAll(); else if (act === 'map-settings') openMapSettings();
    else if (act === 'login' && c) openLoginDlg(c); else if (act === 'edit' && c) openContactDlg(c); else if (act === 'contacts') { renderContactsDlg(); $('#dlg-contacts').showModal(); } else if (act === 'download') downloadSelf(); else if (act === 'copy-key') { const ch = channelByConv(cv); if (ch) copyText(ch.secret); } else if (act === 'leave') closeConv(cv); else if (map[act]) handleInput(map[act]); });
  // composer
  const inp = $('#input');
  on('#composer', 'submit', (e) => { e.preventDefault(); if (!inp.value.trim()) return; if (!$('#hint').hidden && hintPick()) return; const v = inp.value; inp.value = ''; updateCounter(); $('#hint').hidden = true; S.histIdx = -1; (S.inputHist = S.inputHist || []).unshift(v); if (S.inputHist.length > 50) S.inputHist.pop(); handleInput(v); });
  on(inp, 'input', () => { hintSel = 0; renderHint(); updateCounter(); });
  on(inp, 'keydown', (e) => {
    const h = $('#hint');
    if (!h.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const n = $$('#hint .h').length; hintSel = (hintSel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; renderHint(); return; }
    if (!h.hidden && e.key === 'Tab') { e.preventDefault(); hintPick(); updateCounter(); return; }
    if (e.key === 'Tab') { e.preventDefault(); tabComplete(inp); return; }
    if (e.key === 'Escape') { h.hidden = true; return; }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && h.hidden && (inp.value === '' || S.histIdx >= 0)) { const hist = S.inputHist || []; if (!hist.length) return; e.preventDefault(); S.histIdx = e.key === 'ArrowUp' ? Math.min(hist.length - 1, (S.histIdx ?? -1) + 1) : Math.max(-1, S.histIdx - 1); inp.value = S.histIdx < 0 ? '' : hist[S.histIdx]; updateCounter(); }
  });
  on('#hint', 'click', (e) => { const h = e.target.closest('.h'); if (h) { inp.value = h.dataset.cmd + ' '; $('#hint').hidden = true; inp.focus(); } });
  on('.quick-cmds', 'click', (e) => { const ch = e.target.closest('.chip'); if (!ch) return; const cmd = ch.dataset.cmd; if (cmd.startsWith('/')) { inp.value = cmd + ' '; inp.focus(); if (cmd === '/login') { const c = activeContact(); if (c) openLoginDlg(c); } else if (cmd !== '/login') handleInput(cmd); inp.value = ''; } else handleInput(cmd); });
  // channel dialog
  $$('input[name=ctype]').forEach(r => r.onchange = channelDlgUpdate); on('#ch-name', 'input', () => { const t = $('input[name=ctype]:checked').value; if (t === 'hashtag') $('#ch-name').value = $('#ch-name').value.toLowerCase(); });
  on('#ch-gen', 'click', () => { $('#ch-secret').value = randomKey(); });
  on('#dlg-channel form', 'submit', (e) => { if (e.submitter?.value === 'ok') { e.preventDefault(); channelDlgSubmit().then(() => $('#dlg-channel').close()).catch(err => toast(err.message, 'err')); } });
  // login dialog
  on('#dlg-login form', 'submit', (e) => { if (e.submitter?.value !== 'ok') return; const c = S.loginTarget; if (!c) return; const pw = $('#login-pw').value; S.roomPw[c.pub] = { pw: $('#login-auto').checked ? pw : null, auto: $('#login-auto').checked }; if (!$('#login-auto').checked) S.roomPw[c.pub].pw = pw; saveState(); doLogin(c, pw); });
  // contacts dialog
  ['#contacts-search', '#contacts-type', '#contacts-sort', '#contacts-stale'].forEach(s => { on(s, 'input', renderContactsDlg); on(s, 'change', renderContactsDlg); });
  on('#contacts-table', 'click', (e) => { const b = e.target.closest('[data-act]'); const tr = e.target.closest('tr[data-key]'); if (b && tr) contactsDlgAction(tr.dataset.key, b.dataset.act); else if (tr && !e.target.closest('button')) openContactDlg(S.contacts.get(tr.dataset.key)); });
  on('#pending-list', 'click', (e) => { const b = e.target.closest('[data-act]'); const row = e.target.closest('.pend'); if (!b || !row) return; if (b.dataset.act === 'accept') acceptPending(row.dataset.key); else { S.pendingAdverts.delete(row.dataset.key); renderContactsDlg(); } });
  on('#ct-advert-flood', 'click', () => handleInput('/advert flood')); on('#ct-advert-0', 'click', () => handleInput('/advert'));
  on('#ct-import', 'click', async () => { const uri = await promptDlg(t('ct.importTitle'), t('ct.importLabel'), ''); if (uri) handleInput('/import ' + uri); });
  on('#ct-add', 'click', () => { $('#ac-pub').value = ''; $('#ac-name').value = ''; $('#dlg-addcontact').showModal(); });
  on('#dlg-addcontact form', 'submit', (e) => { if (e.submitter?.value === 'ok') addContactManual().catch(err => toast(err.message, 'err')); });
  on('#ct-prune', 'click', pruneStale);
  on('#ct-refresh', 'click', async () => { if (!requireConn(activeConv())) return; await refreshContacts(true); renderContactsDlg(); toast(t('ct.reloaded'), 'ok'); });
  on('#ct-export', 'click', () => downloadJson({ app: 'MeshChat', contacts: Array.from(S.contacts.values()).filter(c => !c.hidden), extras: S.extras }, t('ct.contactsFile')));
  // contact edit dialog
  on('#ce-save', 'click', () => saveContactDlg().then(() => $('#dlg-contact').close()));
  on('#ce-chat', 'click', () => { const c = S.editContact; const cv = convForContact(c); cv.open = true; $('#dlg-contact').close(); $('#dlg-contacts').close(); openConv(cv.key); });
  on('#ce-copy-pub', 'click', () => copyText(S.editContact.pub));
  on('#ce-export', 'click', async () => { if (!requireConn(activeConv())) return; try { const uri = await C.exportContact(S.editContact.pub); await promptDlg(t('ct.uriTitle', cname(S.editContact)), t('ct.uriLabel'), uri); } catch (e) { toast(e.message, 'err'); } });
  on('#ce-share', 'click', () => handleInput('/share ' + cname(S.editContact)));
  on('#ce-resetpath', 'click', () => handleInput('/resetpath ' + cname(S.editContact)).then(() => openContactDlg(S.editContact)));
  on('#ce-path-set', 'click', () => { const c = S.editContact; $('#dlg-contact').close(); openPathDlg(c); });
  on('#ce-discover', 'click', () => { handleInput('/path ' + cname(S.editContact)); $('#dlg-contact').close(); });
  on('#ce-delete', 'click', async () => { $('#dlg-contact').close(); await deleteContact(S.editContact); });
  // settings
  on('#s-node-save', 'click', () => saveNode().catch(e => toast(e.message, 'err'))); on('#s-advert', 'click', () => handleInput('/advert flood'));
  on('#s-loc-save', 'click', () => saveLocation().catch(e => toast(e.message, 'err')));
  on('#s-geo', 'click', () => { if (!navigator.geolocation) { toast(t('geo.unavailable'), 'err'); return; } navigator.geolocation.getCurrentPosition(p => { $('#s-lat').value = p.coords.latitude.toFixed(5); $('#s-lon').value = p.coords.longitude.toFixed(5); toast(t('geo.taken'), 'ok'); }, e => toast(t('geo.failed', e.message), 'err')); });
  on('#s-radio-save', 'click', () => saveRadio().catch(e => toast(e.message, 'err')));
  on('#s-radio-preset', 'change', (e) => { const p = RADIO_PRESETS[e.target.value]; if (p) { $('#s-freq').value = p[0]; $('#s-bw').value = p[1]; $('#s-sf').value = p[2]; $('#s-cr').value = p[3]; } });
  on('#s-tuning-save', 'click', () => saveTuning().catch(e => toast(e.message, 'err')));
  on('#s-region-derive', 'click', async () => { $('#s-region-key').value = await scopeKeyFromName(val('#s-region-name')); });
  on('#s-region-save', 'click', () => saveRegion().catch(e => toast(e.message, 'err'))); on('#s-region-clear', 'click', () => { $('#s-region-name').value = ''; $('#s-region-key').value = ''; saveRegion().catch(e => toast(e.message, 'err')); });
  on('#rg-add', 'click', async () => { const r = await addRegion(val('#rg-name'), val('#rg-key')); if (r) { $('#rg-name').value = ''; $('#rg-key').value = ''; toast(t('rg.added', r.name), 'ok'); } });
  on('#rg-discover', 'click', () => discoverRegions().catch(e => toast(e.message, 'err')));
  on('#rg-apply', 'click', () => applyDiscovered().catch(e => toast(e.message, 'err')));
  on('#regions-table', 'click', async (e) => { const b = e.target.closest('[data-act]'); const tr = e.target.closest('tr[data-i]'); if (!b || !tr) return; const r = S.settings.regions[+tr.dataset.i]; if (!r) return;
    if (b.dataset.act === 'del') { S.settings.regions.splice(+tr.dataset.i, 1); saveState(); renderRegions(); }
    else if (b.dataset.act === 'global') { S.sendScope = { mode: 'custom', name: r.name, key: r.key }; $('#s-scope-mode').value = 'custom'; $('#s-scope-name').value = r.name; $('#s-scope-key').value = r.key; scopeModeUpdate(); await applySendScope(true); renderRegions(); }
    else if (b.dataset.act === 'node') { if (!requireConn(activeConv())) return; try { await C.setDefaultScope(r.name, r.key); S.defaultScope = { name: r.name, key: r.key }; $('#s-region-name').value = r.name; $('#s-region-key').value = r.key; await applySendScope(false); renderRegions(); toast(t('rg.nodeSet', r.name), 'ok'); } catch (err) { toast(err.message, 'err'); } } });
  on('#s-scope-mode', 'change', scopeModeUpdate); on('#s-scope-derive', 'click', async () => { $('#s-scope-key').value = await scopeKeyFromName(val('#s-scope-name')); }); on('#s-scope-apply', 'click', () => applyScopeDlg().catch(e => toast(e.message, 'err')));
  on('#s-sync-time', 'click', async () => { if (!requireConn(activeConv())) return; await C.setTime(); toast(t('time.syncedToast'), 'ok'); fillSettings(); });
  on('#s-reboot', 'click', async () => { if (!requireConn(activeConv())) return; if (await confirmDlg(t('reboot.title'), t('reboot.text'), t('reboot.btn'), true)) { await C.reboot(); toast(t('reboot.sent'), 'ok'); } });
  on('#s-factory', 'click', async () => { if (!requireConn(activeConv())) return; if (await confirmDlg(t('factory.title'), t('factory.text'), t('ui.wipe'), true)) { try { await C.factoryReset(); toast(t('factory.done'), 'ok'); } catch (e) { toast(e.message, 'err'); } } });
  on('#s-pin-save', 'click', () => savePin().catch(e => toast(e.message, 'err'))); on('#s-privkey-export', 'click', exportPrivKey); on('#s-privkey-import', 'click', () => importPrivKey().catch(e => toast(e.message, 'err')));
  on('#s-theme', 'change', (e) => setTheme(e.target.value));
  ['#s-ts:ts', '#s-meta:meta', '#s-compact:compact', '#s-notif:notif', '#s-debug:debug'].forEach(x => { const [sel, k] = x.split(':'); on(sel, 'change', (e) => { S.settings[k] = e.target.checked; saveState(); applyView(); renderMessages(activeConv(), true); if (k === 'notif' && e.target.checked && 'Notification' in window) Notification.requestPermission().catch(() => {}); }); });
  on('#s-favonly', 'change', (e) => { S.settings.favOnly = e.target.checked; saveState(); renderTree(); });
  on('#sb-search', 'input', (e) => { S.sbQuery = e.target.value; renderTree(); });
  on('#sb-search', 'keydown', (e) => { if (e.key === 'Escape') { e.target.value = ''; S.sbQuery = ''; renderTree(); } else if (e.key === 'Enter') { const first = $('#tree .sec:not([data-sec=server]) .item'); if (first) { openConv(first.dataset.target); e.target.value = ''; S.sbQuery = ''; renderTree(); } } });
  on('#btn-fav', 'click', () => { S.settings.favOnly = !S.settings.favOnly; saveState(); renderTree(); toast(S.settings.favOnly ? t('sb.favToastOn') : t('sb.favToastOff'), '', 2000); });
  on('#s-stale', 'change', (e) => { S.settings.staleDays = Math.max(1, parseInt(e.target.value) || 7); saveState(); renderTree(); });
  on('#s-export-config', 'click', () => exportConfig($('#s-export-key').checked)); on('#s-export-history', 'click', exportHistory);
  on('#s-import-config', 'click', () => $('#s-import-file').click()); on('#s-import-file', 'change', (e) => { const f = e.target.files[0]; if (f) importConfig(f).catch(err => toast(err.message, 'err')); e.target.value = ''; });
  on('#s-clear', 'click', async () => { if (await confirmDlg(t('hist.clearTitle'), t('hist.clearText'), t('ui.wipe'), true)) { for (const cv of S.convs.values()) { cv.msgs = []; cv.unread = 0; } renderMessages(activeConv()); renderTree(); saveState(true); } });
  on('#s-forget', 'click', async () => { if (await confirmDlg(t('forget.title'), t('forget.text'), t('ui.wipe'), true)) { localStorage.removeItem(LS_KEY); location.reload(); } });
  window.addEventListener('beforeunload', () => saveState(true));
  if ('serial' in navigator) navigator.serial.addEventListener?.('disconnect', () => {});
}
function tabComplete(inp) {
  const v = inp.value, pos = inp.selectionStart; const before = v.slice(0, pos); const m = /(\S+)$/.exec(before); if (!m) return; const part = m[1].replace(/^@/, '').toLowerCase(); if (!part) return;
  const cv = activeConv(); const names = new Set(); for (const u of cv.users.keys()) names.add(u); for (const c of S.contacts.values()) if (!c.hidden) names.add(cname(c)); for (const ch of S.channels) if (ch && ch.name) names.add(channelLabel(ch));
  const hits = Array.from(names).filter(n => n.toLowerCase().startsWith(part)); if (!hits.length) return;
  S.tabHits = S.tabHits && S.tabHits.part === part ? S.tabHits : { part, i: -1, hits }; S.tabHits.i = (S.tabHits.i + 1) % hits.length;
  const pick = hits[S.tabHits.i] + (before.trim() === m[1] && cv.kind === 'channel' ? ': ' : ' ');
  inp.value = before.slice(0, m.index) + (m[1].startsWith('@') ? '@' : '') + pick + v.slice(pos); inp.selectionStart = inp.selectionEnd = m.index + pick.length + (m[1].startsWith('@') ? 1 : 0);
}

// ---------- init ----------
function init() {
  if (/[?&]fresh=1/.test(location.search)) { try { localStorage.removeItem(LS_KEY); } catch (e) {} } // ontwikkelhulp: schone start voor schermafbeeldingen
  COMMANDS.push(['/setpath', '[naam]', 'cmd.setpath'], ['/sync', '', 'cmd.sync'], ['/resync', '', 'cmd.resync'], ['/map', '[naam]', 'cmd.map']);
  loadState(); initLang(); mkConv('status', 'status', 'MeshChat', null, null); S.convs.get('status').open = true; mkConv('map', 'map', t('map.title'), null, null).open = true;
  for (const c of S.contacts.values()) { c.loggedIn = false; if (c.type >= 2 && !c.hidden) convForContact(c); }
  for (const ch of S.channels) if (ch && ch.name) convForChannel(ch);
  $$('.app-version').forEach(e => e.textContent = 'v' + APP_VERSION); $$('a.app-repo').forEach(a => { a.href = APP_REPO; a.textContent = APP_REPO.replace(/^https?:\/\//, ''); }); $$('.app-author').forEach(e => e.textContent = APP_AUTHOR);
  setTheme(S.settings.theme); applyView(); wire(); renderNick(); renderBattery(); setStatusKey('st-off', 'status.off');
  const st = S.convs.get('status');
  if (!st.msgs.length) { addMsg(st, { kind: 'notice', text: t('init.welcome') }); if (!SerialTransport.supported() && !BleTransport.supported()) addMsg(st, { kind: 'error', text: t('init.noSupport') }); if (location.protocol === 'file:') addMsg(st, { kind: 'notice', text: t('init.fileTip') }); }
  openConv(S.convs.has(S.active) ? S.active : 'status');
  if (!S.self && !S.client.connected) { const lastNick = localStorage.getItem('mcirc.nick'); if (lastNick) $('#nick').textContent = lastNick; }
  if (!S.settings.compact) document.body.classList.remove('compact');
  setInterval(() => { if (S.client.connected) renderTree(); }, 60000);
  initPwa();
  devHooks();
}
// Ontwikkelhulp (alleen lokaal): ?mock=1 laadt de nep-companion uit src/mock.js (bestaat niet op de server), ?lang=xx zet de taal,
// #view=... opent een venster voor schermafbeeldingen (channel | dm | repeater | room | map | contacts | settings:<tab> | about).
async function devHooks() {
  const q = new URLSearchParams(location.search); if (!q.has('mock')) return; S.devMode = true;
  if (q.get('lang')) setLang(q.get('lang')); if (q.get('theme')) setTheme(q.get('theme'));
  try { const r = await fetch('src/mock.js', { cache: 'no-store' }); if (!r.ok) return; await eval(await r.text()); } catch (e) { console.warn('mock', e); return; }
  await new Promise(r => setTimeout(r, 1500));
  const v = (location.hash.match(/view=([\w:-]+)/) || [])[1] || '';
  const cs = Array.from(S.contacts.values()); const byType = (ty) => cs.find(c => c.type === ty);
  if (v === 'channel') openConv('ch:' + S.channels[1].secret);
  else if (v === 'dm') { const c = cs.find(c => c.name === 'Sofie'); if (c) { const cv = convForContact(c); cv.open = true; openConv(cv.key); } }
  else if (v === 'repeater') { const c = byType(2); if (c) { openConv(convKeyFor(c)); await handleInput('/login password'); await new Promise(r => setTimeout(r, 1500)); await handleInput('ver'); await handleInput('/status'); await new Promise(r => setTimeout(r, 1500)); } }
  else if (v === 'room') { const c = byType(3); if (c) { openConv(convKeyFor(c)); await handleInput('/login password'); await new Promise(r => setTimeout(r, 1500)); await handleInput('hello room!'); await new Promise(r => setTimeout(r, 2500)); } }
  else if (v === 'map') { openConv('map'); }
  else if (v === 'contacts') { openConv('ch:' + S.channels[1].secret); renderContactsDlg(); $('#dlg-contacts').showModal(); }
  else if (v.startsWith('settings')) { openConv('ch:' + S.channels[1].secret); await fillSettings(); $('#dlg-settings').showModal(); const tab = v.split(':')[1]; if (tab) $$('.tab').find(x => x.dataset.tab === tab)?.click(); }
  else if (v === 'about') { openConv('ch:' + S.channels[1].secret); $('#dlg-about').showModal(); }
  else if (v === 'path') { const c = cs.find(c => c.name === 'Sofie'); if (c) { openConv(convKeyFor(c)); openPathDlg(c); } }
  document.documentElement.classList.add('shots-ready');
}

// ---------- PWA: service worker + versiecheck ----------
// De service worker maakt de pagina installeerbaar en offline bruikbaar, maar haalt altijd
// eerst het netwerk (zie sw.js). De versiecheck haalt de pagina zelf vers op en vergelijkt
// APP_VERSION; verschilt die, dan verschijnt een melding met een herlaadknop.
async function downloadSelf() {
  try {
    const res = await fetch(location.pathname, { cache: 'no-store' }); if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = 'meshchat.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(t('dl.done'), 'ok', 7000);
  } catch (e) { toast(t('dl.failed', e.message), 'err'); }
}
function initPwa() {
  if (!/^https?:$/.test(location.protocol)) return;
  $$('.only-online').forEach(el => el.hidden = false); on('#btn-download', 'click', downloadSelf);
  if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(e => console.warn('sw', e)); }
  const check = async () => {
    try {
      const res = await fetch(location.pathname, { cache: 'no-store' }); if (!res.ok) return;
      const m = /APP_VERSION = '([^']+)'/.exec(await res.text()); if (!m || m[1] === APP_VERSION) return;
      if ($('#toast-update')) return;
      const el = document.createElement('div'); el.className = 'toast ok'; el.id = 'toast-update';
      el.innerHTML = `<span class="dot on"></span><span>${esc(t('update.available', m[1], APP_VERSION))}</span><button class="btn sm primary" id="btn-reload">${esc(t('update.reload'))}</button><button class="btn icon ghost sm x" aria-label="${esc(t('ui.close'))}">${icon('x')}</button>`;
      el.querySelector('.x').onclick = () => el.remove(); el.querySelector('#btn-reload').onclick = () => { saveState(true); location.reload(); };
      $('#toasts').appendChild(el);
    } catch (e) { /* offline of geen server: stil */ }
  };
  setTimeout(check, 4000); setInterval(check, 6 * 3600 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
}
init();
