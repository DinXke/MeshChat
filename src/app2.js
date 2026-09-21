/* ===================== Rendering ===================== */
const nickColor = (n) => { let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'nc' + (h % 8); };
const icon = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function toast(text, cls = '', ms = 4500) {
  const el = document.createElement('div'); el.className = 'toast ' + cls;
  el.innerHTML = `<span class="dot ${cls === 'err' ? 'err' : cls === 'ok' ? 'on' : cls === 'warn' ? 'busy' : ''}"></span><span>${esc(text)}</span><button class="btn icon ghost sm x" aria-label="Sluiten">${icon('x')}</button>`;
  el.querySelector('.x').onclick = () => el.remove(); $('#toasts').appendChild(el); if (ms) setTimeout(() => el.remove(), ms);
}
function confirmDlg(title, text, okLabel = 'OK', danger = false) {
  return new Promise(res => {
    const d = $('#dlg-confirm'); $('#confirm-t').textContent = title; $('#confirm-x').textContent = text;
    const ok = $('#confirm-ok'); ok.textContent = okLabel; ok.classList.toggle('danger', danger); ok.classList.toggle('primary', !danger);
    d.onclose = () => res(d.returnValue === 'ok'); d.showModal();
  });
}
function promptDlg(title, label, value = '', mono = true) {
  return new Promise(res => {
    const d = $('#dlg-prompt'); $('#prompt-t').textContent = title; $('#prompt-l').textContent = label; const inp = $('#prompt-v'); inp.value = value; inp.classList.toggle('mono', mono);
    d.onclose = () => res(d.returnValue === 'ok' ? inp.value : null); d.showModal(); setTimeout(() => inp.focus(), 30);
  });
}

// ---------- status bar ----------
function setStatus(cls, text) { const s = $('#status'); s.className = cls; s.textContent = text; const on = cls === 'st-on'; $('#btn-disconnect').disabled = !on; $('#btn-usb').disabled = on || S.connecting; $('#btn-bt').disabled = on || S.connecting; }
function renderBattery() {
  const b = $('#battery'); if (!S.batt) { b.hidden = true; return; } b.hidden = false;
  const v = S.batt.mv / 1000, pct = Math.max(0, Math.min(100, (v - 3.3) / (4.2 - 3.3) * 100));
  b.style.setProperty('--lvl', pct.toFixed(0) + '%'); b.classList.toggle('low', v < 3.55); $('#battery .v').textContent = v.toFixed(2) + ' V'; b.title = 'Batterij ' + v.toFixed(2) + ' V' + (S.batt.totalKb ? ' · opslag ' + S.batt.usedKb + '/' + S.batt.totalKb + ' kB' : '');
}
function renderNick() { $('#nick').textContent = myNick() || '—'; }

// ---------- sidebar tree ----------
function renderTree() {
  const tree = $('#tree');
  const item = (cv, iconName, extra = '') => {
    const badge = cv.unread ? `<span class="badge ${cv.hl ? 'hl' : ''}">${cv.unread > 99 ? '99+' : cv.unread}</span>` : '';
    return `<div class="item ${cv.key === S.active ? 'active' : ''} ${cv.unread ? 'unread' : ''}" data-target="${esc(cv.key)}" data-kind="${cv.kind}" ${cv.key === S.active ? 'aria-current="true"' : ''}>${iconName ? icon(iconName) : ''}<span class="name">${esc(cv.name)}</span>${badge}${extra}</div>`;
  };
  const stale = (c) => c.lastAdvert && nowSecs() - c.lastAdvert > S.settings.staleDays * 86400;
  const contacts = Array.from(S.contacts.values()).filter(c => !c.hidden).sort((a, b) => cname(a).localeCompare(cname(b), 'nl', { sensitivity: 'base' }));
  const statusCv = S.convs.get('status');
  let html = `<section class="sec" data-sec="server">${item(statusCv, 'usb')}</section>`;
  const isFav = (c) => !!((c.flags & 1) || S.extras[c.pub]?.fav);
  const show = (c) => { if (!S.settings.favOnly) return true; const cv = S.convs.get(convKeyFor(c)); return isFav(c) || c.loggedIn || (cv && (cv.unread || cv.key === S.active)); };
  const q = (S.sbQuery || "").trim().toLowerCase();
  const hit = (name) => !q || String(name).toLowerCase().includes(q);
  const showQ = (c) => q ? hit(cname(c)) || hit(c.name) : show(c);
  const favBtn = $("#btn-fav"); if (favBtn) { favBtn.classList.toggle("on", !!S.settings.favOnly); favBtn.title = S.settings.favOnly ? "Alleen favorieten (klik voor alles)" : "Alle contacten (klik voor alleen favorieten)"; }

  const chans = S.channels.filter(c => c && c.name);
  html += `<section class="sec" data-sec="channels"><div class="sec-h">Kanalen <span class="n">${chans.length}</span><span class="spacer"></span><button class="add" data-open="dlg-channel" aria-label="Kanaal toevoegen">${icon('plus')}</button></div>`;
  for (const ch of chans) { if (!hit(channelLabel(ch))) continue; const cv = convForChannel(ch); const isPublic = ch.secret === PUBLIC_KEY_HEX, isHash = ch.name.startsWith('#'); html += item(cv, isPublic || isHash ? 'hash' : 'lock'); }
  html += '</section>';

  const rooms = contacts.filter(c => c.type === 3 && showQ(c));
  html += `<section class="sec" data-sec="rooms"><div class="sec-h">Rooms <span class="n">${rooms.length}${S.settings.favOnly ? "★" : ""}</span><span class="spacer"></span></div>`;
  for (const c of rooms) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, null, '').replace('<span class="name">', `<span class="dot ${c.loggedIn ? 'on' : 'off'}" title="${c.loggedIn ? 'Ingelogd' : 'Niet ingelogd'}"></span><span class="name">`); }
  html += '</section>';

  const dms = contacts.filter(c => c.type === 1 && (q ? (hit(cname(c)) || hit(c.name)) : (S.convs.get(convKeyFor(c))?.open)));
  html += `<section class="sec" data-sec="dm"><div class="sec-h">Privé <span class="n">${dms.length}</span><span class="spacer"></span><button class="add" data-open="dlg-contacts" aria-label="Privégesprek starten">${icon('plus')}</button></div>`;
  for (const c of dms) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, 'user'); }
  html += '</section>';

  const rpts = contacts.filter(c => (c.type === 2 || c.type === 4) && showQ(c));
  html += `<section class="sec" data-sec="repeaters"><div class="sec-h">Repeaters &amp; sensoren <span class="n">${rpts.length}${S.settings.favOnly ? "★" : ""}</span><span class="spacer"></span></div>`;
  for (const c of rpts) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, c.type === 4 ? 'sensor' : 'ant', `<span class="dot ${c.loggedIn ? 'on' : stale(c) ? 'off' : 'busy'}" title="${c.loggedIn ? 'Ingelogd' : stale(c) ? 'Geen advert > ' + S.settings.staleDays + ' d' : 'Advert ' + fmtAgo(c.lastAdvert) + ' geleden'}"></span>`); }
  html += '</section>';
  if (q && !rooms.length && !dms.length && !rpts.length && !chans.some(ch => hit(channelLabel(ch)))) html += `<div class="empty">Niets gevonden voor "${esc(q)}".</div>`;
  tree.innerHTML = html;
  let longest = 0; for (const el of tree.querySelectorAll('.item .name')) longest = Math.max(longest, el.textContent.length); $('#app').style.setProperty('--sb-w', Math.min(340, Math.max(230, Math.round(longest * 7.6) + 96)) + 'px');
  updateTitle();
}
function updateTitle() { let n = 0, hl = false; for (const cv of S.convs.values()) { n += cv.unread; hl = hl || (cv.unread && cv.hl); } document.title = (n ? `(${n}${hl ? '!' : ''}) ` : '') + 'MeshChat'; }

// ---------- message rendering ----------
function linkify(text) {
  const nick = myNick();
  let out = esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  if (nick) { const re = new RegExp('(^|[^\\w])(@?' + nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![\\w])', 'gi'); out = out.replace(re, '$1<span class="mention">$2</span>'); }
  return out;
}
function metaText(m) {
  const parts = [];
  if (m.snr != null && !m.self) parts.push('SNR ' + m.snr.toFixed(1));
  if (m.rssi != null) parts.push(m.rssi + ' dBm');
  if (m.pathLen != null) parts.push(m.pathLen === 0xFF ? 'direct' : ((m.pathLen & 63) === 0 ? '0 hops' : (m.pathLen & 63) + ' hop' + ((m.pathLen & 63) > 1 ? 's' : '')));
  if (m.self && m.flood != null) parts.push(m.flood ? 'flood' : 'direct');
  if (m.self && m.scope) parts.push(m.scope);
  const sc = scopeLabelFor(m); if (sc && !m.self) parts.push(sc);
  if (m.trip) parts.push(m.trip + ' ms');
  return parts.join(' · ');
}
function renderMsg(m) {
  const cls = ['m', 'm-' + m.kind]; if (m.self) cls.push('m-self'); if (m.hl) cls.push('m-hl');
  if (m.ack === 'pending') cls.push('m-pending'); else if (m.ack === 'ok') cls.push('m-acked'); else if (m.ack === 'fail') cls.push('m-failed');
  const t = S.settings.ts ? `<span class="t">${fmtTime(m.t)}</span>` : '<span class="t" hidden></span>';
  const meta = S.settings.meta || m.self ? `<span class="meta">${esc(metaText(m))}${m.self ? `<span class="ack" aria-label="${m.ack === 'ok' ? 'Bevestigd' : m.ack === 'fail' ? 'Geen bevestiging' : m.ack === 'pending' ? 'Wacht op bevestiging' : ''}">${m.ack === 'ok' ? '✓' : m.ack === 'fail' ? '✗' : ''}</span>` : ''}</span>` : '';
  let body;
  switch (m.kind) {
    case 'notice': case 'error': body = `<span class="x">${linkify(m.text)}</span>`; break;
    case 'action': body = `<span class="x"><b class="${m.self ? '' : nickColor(m.nick)}">${esc(m.nick)}</b> ${linkify(m.text)}</span>`; break;
    case 'cli': body = `<span class="n">${esc(m.nick)}</span><span class="x">${m.cmd ? `<span class="cmd">${esc(m.cmd)}</span>` : ''}${m.text ? `<pre>${esc(m.text)}</pre>` : (m.ack === 'pending' ? '<span class="dim">wacht op antwoord…</span>' : '')}</span>`; break;
    default: body = `<span class="n ${m.self ? '' : nickColor(m.nick)}">${esc(m.nick)}</span><span class="x">${linkify(m.text)}</span>`;
  }
  return `<div class="${cls.join(' ')}" data-id="${m.id}">${t}${body}${meta}</div>`;
}
function updateNickWidth(cv) {
  // irssi-stijl: de nickkolom is zo breed als de langste naam in dit venster (met een plafond)
  let n = (myNick() || '').length;
  for (const m of cv.msgs.slice(-600)) if ((m.kind === 'msg' || m.kind === 'cli') && m.nick && m.nick.length > n) n = m.nick.length;
  $('#messages').style.setProperty('--nickw', (Math.min(28, Math.max(6, n)) + 3) + 'ch'); // +3: de <> rondom de nick en vet lettertype
}
function renderMessages(cv, keepScroll = false) {
  updateNickWidth(cv);
  const box = $('#messages'); const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  let html = '', lastDay = null, markerDone = false;
  const msgs = cv.msgs.slice(-600);
  for (const m of msgs) {
    const dk = dayKey(m.t); if (dk !== lastDay) { html += `<div class="day-sep" data-date="${dk}">— ${esc(fmtDate(m.t))} —</div>`; lastDay = dk; }
    if (!markerDone && cv.lastRead && m.t > cv.lastRead && !m.self && m.kind !== 'notice') { html += `<div id="new-marker" role="separator">nieuw</div>`; markerDone = true; }
    html += renderMsg(m);
  }
  box.innerHTML = html || '<div class="m m-notice" id="empty"><span class="t" hidden></span><span class="x">Nog geen berichten.</span></div>';
  if (!keepScroll || atBottom) box.scrollTop = box.scrollHeight;
  document.body.classList.remove('unread-below');
}
function appendMsgDom(cv, m) {
  if (cv.key !== S.active) return;
  const box = $('#messages'); const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  $('#empty')?.remove();
  const prev = cv.msgs[cv.msgs.length - 2]; if (!prev || dayKey(prev.t) !== dayKey(m.t)) box.insertAdjacentHTML('beforeend', `<div class="day-sep" data-date="${dayKey(m.t)}">— ${esc(fmtDate(m.t))} —</div>`);
  if (m.nick && m.nick.length > parseInt(box.style.getPropertyValue('--nickw') || '0')) updateNickWidth(cv);
  box.insertAdjacentHTML('beforeend', renderMsg(m));
  if (atBottom || m.self) box.scrollTop = box.scrollHeight; else document.body.classList.add('unread-below');
}
function updateMsgDom(m) { const el = $(`#messages .m[data-id="${m.id}"]`); if (el) el.outerHTML = renderMsg(m); }

// add a message to a conversation (and to the status window for notices when requested)
function addMsg(cv, m) {
  m.id = m.id || (Date.now().toString(36) + (S.msgSeq++).toString(36)); m.t = m.t || nowSecs();
  cv.msgs.push(m); if (cv.msgs.length > MAX_HIST + 100) cv.msgs.splice(0, cv.msgs.length - MAX_HIST);
  if (!m.self && m.kind !== 'notice' && m.kind !== 'error' && cv.key !== S.active) { cv.unread++; if (m.hl) cv.hl = true; }
  if (m.kind === 'msg' || m.kind === 'action') { const u = cv.users.get(m.nick) || { nick: m.nick }; u.last = m.t; u.snr = m.snr; u.pub = m.pub || u.pub; cv.users.set(m.nick, u); }
  appendMsgDom(cv, m); renderTree(); if (cv.key === S.active) renderUsers(cv); saveState();
  if (m.hl && !m.self && S.settings.notif && document.hidden && 'Notification' in window && Notification.permission === 'granted') { try { new Notification('MeshChat · ' + cv.name, { body: `<${m.nick}> ${m.text}` }); } catch (e) {} }
  return m;
}
function notice(text, cv = activeConv(), alsoStatus = true) { const m = { kind: 'notice', text }; addMsg(cv, m); if (alsoStatus && cv.key !== 'status') addMsg(S.convs.get('status'), { kind: 'notice', text: (cv.name ? '[' + cv.name + '] ' : '') + text }); }
function errorMsg(text, cv = activeConv()) { addMsg(cv, { kind: 'error', text }); if (cv.key !== 'status') addMsg(S.convs.get('status'), { kind: 'error', text }); toast(text, 'err'); }
function debugLog(text) { if (!S.settings.debug) return; addMsg(S.convs.get('status'), { kind: 'notice', text: 'dbg ' + text }); }

// ---------- switch conversation ----------
function openConv(key) {
  const cv = S.convs.get(key) || S.convs.get('status'); cv.open = true;
  if (S.active !== cv.key) { const prev = S.convs.get(S.active); if (prev) { prev.lastRead = nowSecs(); } }
  S.active = cv.key; cv.unread = 0; cv.hl = false;
  renderMessages(cv); cv.lastRead = nowSecs(); renderHead(cv); renderUsers(cv); renderTree(); renderCompose(cv);
  document.body.classList.remove('sidebar-open', 'users-open'); $('#input').focus(); saveState();
}
function renderHead(cv) {
  $('#chan-head').dataset.target = cv.key; $('#chan-name').textContent = cv.name;
  let topic = '';
  if (cv.kind === 'status') topic = S.client.connected ? `${S.dev?.model || 'MeshCore'} · fw ${S.dev?.version || '?'} · ${S.self?.freq} MHz · BW ${S.self?.bw} · SF${S.self?.sf} · CR${S.self?.cr}` : 'Niet verbonden. Kies USB of Bluetooth.';
  else if (cv.kind === 'channel') { const ch = channelByConv(cv); const kind = ch?.secret === PUBLIC_KEY_HEX ? 'Publiek kanaal' : ch?.name.startsWith('#') ? 'Hashtag-kanaal' : 'Privékanaal'; topic = `${kind} · sleutel <span class="key">${ch ? ch.secret.slice(0, 4) + '…' + ch.secret.slice(-4) : '?'}</span> · ${cv.users.size} deelnemer${cv.users.size === 1 ? '' : 's'} gezien${ch ? ' · slot ' + ch.idx : ''}`; }
  else { const c = S.contacts.get(cv.pub); if (c) { const p = pathInfo(c); topic = `${ADV_TYPE[c.type]} · ${c.pub.slice(0, 12)}… · advert ${fmtAgo(c.lastAdvert)} geleden · pad ${p.text}` + (c.type >= 2 ? (c.loggedIn ? ' · ingelogd' : ' · niet ingelogd') : ''); } }
  $('#chan-topic').innerHTML = topic;
  renderChanScope(cv);
  $('#btn-chan-leave').hidden = cv.kind === 'status'; $('#btn-chan-leave').textContent = cv.kind === 'channel' ? 'Verlaten' : 'Sluiten';
}
function renderChanScope(cv) {
  const wrap = $('#chan-scope-wrap'), sel = $('#chan-scope'); const ch = cv.kind === 'channel' ? channelByConv(cv) : null;
  wrap.hidden = !ch; if (!ch) return;
  const own = S.chanScope[ch.secret]; const cur = own ? (own.mode === 'unscoped' ? 'unscoped' : own.mode === 'default' ? 'default' : 'key:' + own.key) : 'global';
  const regions = S.settings.regions.slice(); if (S.defaultScope && !regions.some(r => r.key === S.defaultScope.key)) regions.unshift({ name: S.defaultScope.name, key: S.defaultScope.key });
  let html = `<option value="global">Regio: globaal (${esc(scopeText(S.sendScope))})</option><option value="default">Standaardregio node${S.defaultScope ? ' (' + esc(S.defaultScope.name) + ')' : ''}</option><option value="unscoped">Zonder scope (overal)</option>`;
  for (const r of regions) html += `<option value="key:${r.key}">${esc(r.name)}</option>`;
  html += `<option value="new">+ Andere regio…</option>`;
  sel.innerHTML = html; sel.value = cur; if (sel.value !== cur) { sel.insertAdjacentHTML('beforeend', `<option value="${cur}">${esc(scopeText(own))}</option>`); sel.value = cur; }
  wrap.classList.toggle('custom', !!own); wrap.title = 'Regio (flood-scope) voor berichten in dit kanaal: ' + (own ? scopeText(own) : 'globaal');
}
function renderCompose(cv) {
  const t = $('#target'); t.textContent = cv.kind === 'status' ? 'status' : cv.name; t.dataset.target = cv.key;
  const inp = $('#input');
  inp.placeholder = cv.kind === 'repeater' ? 'CLI-commando voor de repeater (bv. ver, get radio) of /commando…' : cv.kind === 'status' ? '/commando (typ /help)' : cv.kind === 'sensor' ? 'CLI-commando voor de sensor of /commando…' : 'Bericht of /commando…';
  $('.quick-cmds').hidden = !(cv.kind === 'repeater' || cv.kind === 'sensor' || cv.kind === 'room');
  const c = cv.pub ? S.contacts.get(cv.pub) : null;
  $('.quick-cmds').innerHTML = cv.kind === 'room' ? ['/login', '/status', '/logout'].map(x => `<button class="chip" data-cmd="${x}">${x}</button>`).join('') : ['ver', 'clock', 'get radio', 'get name', 'neighbors', 'advert', 'clock sync', 'get repeat', 'reboot'].map(x => `<button class="chip" data-cmd="${esc(x)}">${esc(x)}</button>`).join('') + (c && !c.loggedIn ? `<button class="chip" data-cmd="/login">/login</button>` : '');
  updateCounter();
}
function updateCounter() { const v = $('#input').value; const max = v.startsWith('/') ? 1000 : 160; const left = max - te.encode(v).length; const c = $('#counter'); c.textContent = left; c.className = left < 0 ? 'over' : left < 20 ? 'warn' : ''; }

// ---------- right sidebar ----------
function renderUsers(cv) {
  const list = $('#userlist'); let html = '';
  if (cv.kind === 'channel') {
    const users = Array.from(cv.users.values()).sort((a, b) => (b.last || 0) - (a.last || 0));
    const me = myNick(); html += me ? `<div class="user me" data-nick="${esc(me)}"><span class="dot on"></span>${icon('user')}<span class="nm">${esc(me)}</span></div>` : '';
    for (const u of users) { if (u.nick === me) continue; const c = contactByName(u.nick); const age = nowSecs() - (u.last || 0); html += `<div class="user" data-nick="${esc(u.nick)}" ${c ? `data-pub="${c.pub}"` : ''} title="laatst ${fmtAgo(u.last)} geleden${c ? '' : ' · geen contact'}"><span class="dot ${age < 3600 ? 'on' : age < 86400 ? 'busy' : 'off'}"></span>${icon(c ? TYPE_ICON[c.type] || 'user' : 'user')}<span class="nm ${nickColor(u.nick)}">${esc(u.nick)}</span>${u.snr != null ? `<span class="snr">${u.snr.toFixed(1)}</span>` : ''}</div>`; }
    $('#users-count').textContent = `(${users.length + (me ? 1 : 0)})`;
  } else if (cv.kind === 'status') {
    const cs = Array.from(S.contacts.values()).sort((a, b) => (b.lastAdvert || 0) - (a.lastAdvert || 0)).slice(0, 60);
    for (const c of cs) html += `<div class="user" data-pub="${c.pub}" data-type="${ADV_TYPE[c.type]}"><span class="dot ${nowSecs() - c.lastAdvert < 3600 ? 'on' : nowSecs() - c.lastAdvert < 86400 ? 'busy' : 'off'}"></span>${icon(TYPE_ICON[c.type] || 'user')}<span class="nm">${esc(displayName(c))}</span>${c.lastSnr != null ? `<span class="snr">${c.lastSnr.toFixed(1)}</span>` : ''}</div>`;
    $('#users-count').textContent = `(${S.contacts.size})`;
  } else {
    const c = S.contacts.get(cv.pub); if (c) html += `<div class="user" data-pub="${c.pub}"><span class="dot ${c.loggedIn ? 'on' : 'off'}"></span>${icon(TYPE_ICON[c.type] || 'user')}<span class="nm">${esc(displayName(c))}</span></div>`;
    if (cv.kind === 'room') { const users = Array.from(cv.users.values()).sort((a, b) => (b.last || 0) - (a.last || 0)); for (const u of users) html += `<div class="user" data-nick="${esc(u.nick)}" ${u.pub ? `data-pub="${u.pub}"` : ''}><span class="dot busy"></span>${icon('user')}<span class="nm ${nickColor(u.nick)}">${esc(u.nick)}</span></div>`; $('#users-count').textContent = `(${users.length})`; }
    else $('#users-count').textContent = '(1)';
  }
  list.innerHTML = html; renderInfo(cv);
  let longest = 0; for (const el of list.querySelectorAll('.nm')) longest = Math.max(longest, el.textContent.length); $('#app').style.setProperty('--users-w', Math.min(340, Math.max(200, Math.round(longest * 7.6) + 78)) + 'px');
}
function renderInfo(cv) {
  const info = $('#info'); const c = cv.pub ? S.contacts.get(cv.pub) : null;
  if (cv.kind === 'status') {
    if (!S.self) { info.innerHTML = '<h3>Node</h3><div class="dim">Niet verbonden.</div>'; return; }
    info.innerHTML = `<h3>Eigen node</h3><dl><dt>Naam</dt><dd>${esc(S.self.name)}</dd><dt>Sleutel</dt><dd>${S.self.pub.slice(0, 16)}…</dd><dt>Radio</dt><dd>${S.self.freq} MHz · BW${S.self.bw} · SF${S.self.sf} · CR${S.self.cr} · ${S.self.txPower} dBm</dd><dt>Regio</dt><dd>${S.defaultScope ? esc(S.defaultScope.name) : 'geen (standaard)'}</dd><dt>Verzendscope</dt><dd>${esc(sendScopeText())}</dd><dt>Contacten</dt><dd>${S.contacts.size}${S.dev?.maxContacts ? ' / ' + S.dev.maxContacts : ''}</dd></dl><div class="acts"><button class="btn sm" data-act="advert-flood">Advert (flood)</button><button class="btn sm ghost" data-act="advert-0">Advert (0-hop)</button><button class="btn sm ghost" data-act="contacts">Contacten</button>${/^https?:$/.test(location.protocol) ? '<button class="btn sm ghost" data-act="download" title="Deze pagina als los HTML-bestand bewaren">⬇ HTML</button>' : ''}</div>`;
    return;
  }
  if (cv.kind === 'channel') { const ch = channelByConv(cv); info.innerHTML = `<h3>Kanaal</h3><dl><dt>Naam</dt><dd>${esc(ch?.name || cv.name)}</dd><dt>Sleutel</dt><dd class="mono" style="font-size:10.5px">${ch?.secret || '?'}</dd><dt>Base64</dt><dd style="font-size:10.5px">${ch ? esc(b64(unhex(ch.secret))) : ''}</dd><dt>Slot</dt><dd>${ch?.idx ?? '?'}</dd></dl><div class="acts"><button class="btn sm" data-act="copy-key">Sleutel kopiëren</button><button class="btn sm ghost danger" data-act="leave">Verlaten</button></div>`; return; }
  if (!c) { info.innerHTML = ''; return; }
  const p = pathInfo(c); const dist = distanceKm(S.self, c); const x = S.extras[c.pub] || {};
  info.innerHTML = `<h3>Info · ${esc(displayName(c))}</h3><dl>
    <dt>Type</dt><dd><span class="type ${TYPE_CSS[c.type] || ''}">${ADV_TYPE[c.type]}</span>${c.flags & 1 ? ' ★' : ''}</dd>
    ${x.alias ? `<dt>Advert-naam</dt><dd>${esc(c.name)}</dd>` : ''}
    <dt>Sleutel</dt><dd title="${c.pub}">${c.pub.slice(0, 4)} ${c.pub.slice(4, 8)} … ${c.pub.slice(-4)}</dd>
    <dt>Advert</dt><dd>${c.lastAdvert ? fmtDateTime(c.lastAdvert) : 'nooit'}</dd>
    <dt>Pad</dt><dd>${esc(p.hashes.length ? p.hashes.map(hashLabel).join(', ') : p.text)}</dd>
    ${c.lastSnr != null ? `<dt>SNR</dt><dd>${c.lastSnr.toFixed(1)} dB</dd>` : ''}
    ${c.lat ? `<dt>Locatie</dt><dd>${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}${dist != null ? ' · ' + dist.toFixed(1) + ' km' : ''}</dd>` : ''}
    ${c.type >= 2 ? `<dt>Login</dt><dd>${c.loggedIn ? 'ingelogd' + (c.perms ? ' (admin)' : '') : 'niet ingelogd'}</dd>` : ''}
    ${x.note ? `<dt>Notitie</dt><dd>${esc(x.note)}</dd>` : ''}
  </dl><div class="acts">
    ${c.type >= 2 ? `<button class="btn sm" data-act="status">Status</button>` : ''}
    <button class="btn sm" data-act="telemetry">Telemetrie</button>
    ${p.hashes.length ? `<button class="btn sm" data-act="trace">Trace</button>` : ''}
    <button class="btn sm" data-act="discover">Pad zoeken</button>
    <button class="btn sm ghost" data-act="path-reset">Pad reset</button>
    ${c.type >= 2 ? (c.loggedIn ? `<button class="btn sm ghost" data-act="logout">Logout</button>` : `<button class="btn sm primary" data-act="login">Login</button>`) : ''}
    <button class="btn sm ghost" data-act="edit">Bewerken</button>
  </div>`;
}
function sendScopeText() { const s = S.sendScope; return s.mode === 'unscoped' ? 'zonder scope' : s.mode === 'custom' ? (s.name || s.key.slice(0, 8) + '…') : (S.defaultScope ? 'standaard (' + S.defaultScope.name + ')' : 'standaard'); }

// ---------- command hint ----------
const COMMANDS = [
  ['/help', '', 'Overzicht van commando\'s'], ['/about', '', 'Over MeshChat: versie, handleiding, maker'],
  ['/connect', 'usb|ble', 'Verbinden met de node'], ['/disconnect', '', 'Verbinding verbreken'],
  ['/join', '#kanaal [sleutel|wachtwoord]', 'Kanaal openen of toevoegen'], ['/part', '[kanaal]', 'Kanaal verwijderen van de node'],
  ['/msg', '<nick> <tekst>', 'Privébericht sturen'], ['/query', '<nick>', 'Privévenster openen'], ['/me', '<tekst>', 'Actie-bericht'],
  ['/nick', '<naam>', 'Eigen naam wijzigen'], ['/whois', '<nick>', 'Contactinfo tonen'], ['/names', '', 'Deelnemers tonen'], ['/list', '', 'Kanalen en contacten'], ['/contacts', '', 'Contactenlijst volledig herladen van de node'],
  ['/advert', '[flood]', 'Eigen advert versturen'], ['/login', '[wachtwoord]', 'Inloggen op room/repeater'], ['/logout', '', 'Uitloggen'],
  ['/cli', '<commando>', 'CLI-commando naar repeater'], ['/status', '', 'Statistieken opvragen'], ['/telemetry', '[nick]', 'Telemetrie opvragen'],
  ['/trace', '[nick]', 'Pad traceren met SNR per hop'], ['/path', '[nick]', 'Pad opnieuw ontdekken'], ['/resetpath', '[nick]', 'Pad wissen (terug naar flood)'],
  ['/scope', '<naam|hex|off|default>', 'Verzendscope (regio) kiezen'], ['/region', '<naam> [hex]', 'Standaardregio van de node instellen'],
  ['/export', '[nick]', 'Contact als meshcore:// URI'], ['/import', '<meshcore://…>', 'Contact importeren'], ['/share', '<nick>', 'Contact delen op het mesh'], ['/del', '<nick>', 'Contact verwijderen'],
  ['/time', '', 'Tijd van de node'], ['/settime', '', 'Tijd synchroniseren'], ['/battery', '', 'Batterij'], ['/stats', '', 'Statistieken van de node'],
  ['/raw', '<hex>', 'Ruw commando-frame sturen'], ['/debug', '', 'Debug-uitvoer aan/uit'], ['/clear', '', 'Venster leegmaken'], ['/theme', 'dark|light|auto', 'Thema'], ['/quit', '', 'Verbreken en venster sluiten'],
];
let hintSel = 0;
function renderHint() {
  const v = $('#input').value; const h = $('#hint');
  if (!v.startsWith('/') || v.includes(' ')) { h.hidden = true; return; }
  const q = v.toLowerCase(); const list = COMMANDS.filter(c => c[0].startsWith(q));
  if (!list.length) { h.hidden = true; return; }
  hintSel = Math.min(hintSel, list.length - 1);
  h.innerHTML = list.map((c, i) => `<div class="h ${i === hintSel ? 'sel' : ''}" role="option" data-cmd="${c[0]}"><code>${c[0]} ${esc(c[1])}</code><span>${esc(c[2])}</span></div>`).join('');
  h.hidden = false;
}
function hintPick() { const sel = $('#hint .h.sel'); if (!sel) return false; $('#input').value = sel.dataset.cmd + ' '; $('#hint').hidden = true; return true; }
