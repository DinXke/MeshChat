/* ===================== Rendering ===================== */
const nickColor = (n) => { let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'nc' + (h % 8); };
const icon = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;

function toast(text, cls = '', ms = 4500) {
  const el = document.createElement('div'); el.className = 'toast ' + cls;
  el.innerHTML = `<span class="dot ${cls === 'err' ? 'err' : cls === 'ok' ? 'on' : cls === 'warn' ? 'busy' : ''}"></span><span>${esc(text)}</span><button class="btn icon ghost sm x" aria-label="${esc(t('ui.close'))}">${icon('x')}</button>`;
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
function setStatusKey(cls, key, ...args) { S.statusKey = key; setStatus(cls, t(key, ...args)); }
function setStatus(cls, text) { const s = $('#status'); s.className = cls; s.textContent = text; const on = cls === 'st-on'; $('#btn-disconnect').disabled = !on; $('#btn-usb').disabled = on || S.connecting; $('#btn-bt').disabled = on || S.connecting; }
function renderBattery() {
  const b = $('#battery'); if (!S.batt) { b.hidden = true; return; } b.hidden = false;
  const v = S.batt.mv / 1000, pct = Math.max(0, Math.min(100, (v - 3.3) / (4.2 - 3.3) * 100));
  b.style.setProperty('--lvl', pct.toFixed(0) + '%'); b.classList.toggle('low', v < 3.55); $('#battery .v').textContent = v.toFixed(2) + ' V'; b.title = t('batt.title', v.toFixed(2)) + (S.batt.totalKb ? t('batt.storage', S.batt.usedKb, S.batt.totalKb) : '');
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
  const contacts = Array.from(S.contacts.values()).filter(c => !c.hidden).sort((a, b) => cname(a).localeCompare(cname(b), LANG, { sensitivity: 'base' }));
  const statusCv = S.convs.get('status');
  let html = `<section class="sec" data-sec="server">${item(statusCv, 'usb')}</section>`;
  const isFav = (c) => !!((c.flags & 1) || S.extras[c.pub]?.fav);
  const show = (c) => { if (!S.settings.favOnly) return true; const cv = S.convs.get(convKeyFor(c)); return isFav(c) || c.loggedIn || (cv && (cv.unread || cv.key === S.active)); };
  const q = (S.sbQuery || "").trim().toLowerCase();
  const hit = (name) => !q || String(name).toLowerCase().includes(q);
  const showQ = (c) => q ? hit(cname(c)) || hit(c.name) : show(c);
  const favBtn = $("#btn-fav"); if (favBtn) { favBtn.classList.toggle("on", !!S.settings.favOnly); favBtn.title = S.settings.favOnly ? t('sb.favOnlyTitle') : t('sb.allTitle'); }

  const chans = S.channels.filter(c => c && c.name);
  html += `<section class="sec" data-sec="channels"><div class="sec-h">${esc(t('sb.channels'))} <span class="n">${chans.length}</span><span class="spacer"></span><button class="add" data-open="dlg-channel" aria-label="${esc(t('sb.addChannel'))}">${icon('plus')}</button></div>`;
  for (const ch of chans) { if (!hit(channelLabel(ch))) continue; const cv = convForChannel(ch); const isPublic = ch.secret === PUBLIC_KEY_HEX, isHash = ch.name.startsWith('#'); html += item(cv, isPublic || isHash ? 'hash' : 'lock'); }
  html += '</section>';

  const rooms = contacts.filter(c => c.type === 3 && showQ(c));
  html += `<section class="sec" data-sec="rooms"><div class="sec-h">${esc(t('sb.rooms'))} <span class="n">${rooms.length}${S.settings.favOnly ? "★" : ""}</span><span class="spacer"></span></div>`;
  for (const c of rooms) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, null, '').replace('<span class="name">', `<span class="dot ${c.loggedIn ? 'on' : 'off'}" title="${esc(c.loggedIn ? t('sb.loggedIn') : t('sb.notLoggedIn'))}"></span><span class="name">`); }
  html += '</section>';

  const dms = contacts.filter(c => c.type === 1 && (q ? (hit(cname(c)) || hit(c.name)) : (S.convs.get(convKeyFor(c))?.open)));
  html += `<section class="sec" data-sec="dm"><div class="sec-h">${esc(t('sb.dm'))} <span class="n">${dms.length}</span><span class="spacer"></span><button class="add" data-open="dlg-contacts" aria-label="${esc(t('sb.startDm'))}">${icon('plus')}</button></div>`;
  for (const c of dms) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, 'user'); }
  html += '</section>';

  const rpts = contacts.filter(c => (c.type === 2 || c.type === 4) && showQ(c));
  html += `<section class="sec" data-sec="repeaters"><div class="sec-h">${t('sb.repeaters')} <span class="n">${rpts.length}${S.settings.favOnly ? "★" : ""}</span><span class="spacer"></span></div>`;
  for (const c of rpts) { const cv = convForContact(c); cv.name = displayName(c); html += item(cv, c.type === 4 ? 'sensor' : 'ant', `<span class="dot ${c.loggedIn ? 'on' : stale(c) ? 'off' : 'busy'}" title="${esc(c.loggedIn ? t('sb.loggedIn') : stale(c) ? t('sb.noAdvert', S.settings.staleDays) : t('sb.advertAgo', fmtAgo(c.lastAdvert)))}"></span>`); }
  html += '</section>';
  if (q && !rooms.length && !dms.length && !rpts.length && !chans.some(ch => hit(channelLabel(ch)))) html += `<div class="empty">${t('sb.nothingFound', esc(q))}</div>`;
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
  const ts = S.settings.ts ? `<span class="t">${fmtTime(m.t)}</span>` : '<span class="t" hidden></span>';
  const meta = S.settings.meta || m.self ? `<span class="meta">${esc(metaText(m))}${m.self ? `<span class="ack" aria-label="${esc(m.ack === 'ok' ? t('ack.ok') : m.ack === 'fail' ? t('ack.fail') : m.ack === 'pending' ? t('ack.pending') : '')}">${m.ack === 'ok' ? '✓' : m.ack === 'fail' ? '✗' : ''}</span>` : ''}</span>` : '';
  let body;
  switch (m.kind) {
    case 'notice': case 'error': body = `<span class="x">${linkify(m.text)}</span>`; break;
    case 'action': body = `<span class="x"><b class="${m.self ? '' : nickColor(m.nick)}">${esc(m.nick)}</b> ${linkify(m.text)}</span>`; break;
    case 'cli': body = `<span class="n">${esc(m.nick)}</span><span class="x">${m.cmd ? `<span class="cmd">${esc(m.cmd)}</span>` : ''}${m.text ? `<pre>${esc(m.text)}</pre>` : (m.ack === 'pending' ? `<span class="dim">${esc(t('msg.waitingReply'))}</span>` : '')}</span>`; break;
    default: body = `<span class="n ${m.self ? '' : nickColor(m.nick)}">${esc(m.nick)}</span><span class="x">${linkify(m.text)}</span>`;
  }
  return `<div class="${cls.join(' ')}" data-id="${m.id}">${ts}${body}${meta}</div>`;
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
    if (!markerDone && cv.lastRead && m.t > cv.lastRead && !m.self && m.kind !== 'notice') { html += `<div id="new-marker" role="separator">${esc(t('msg.new'))}</div>`; markerDone = true; }
    html += renderMsg(m);
  }
  box.innerHTML = html || `<div class="m m-notice" id="empty"><span class="t" hidden></span><span class="x">${esc(t('msg.none'))}</span></div>`;
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
  if (cv.kind === 'status') topic = S.client.connected ? `${S.dev?.model || 'MeshCore'} · fw ${S.dev?.version || '?'} · ${S.self?.freq} MHz · BW ${S.self?.bw} · SF${S.self?.sf} · CR${S.self?.cr}` : esc(t('head.notConnected'));
  else if (cv.kind === 'channel') { const ch = channelByConv(cv); const kind = ch?.secret === PUBLIC_KEY_HEX ? t('head.chPublic') : ch?.name.startsWith('#') ? t('head.chHashtag') : t('head.chPrivate'); topic = `${esc(kind)} · ${esc(t('head.key'))} <span class="key">${ch ? ch.secret.slice(0, 4) + '…' + ch.secret.slice(-4) : '?'}</span> · ${esc(cv.users.size === 1 ? t('head.seen1') : t('head.seenN', cv.users.size))}${ch ? ' · ' + esc(t('head.slot', ch.idx)) : ''}`; }
  else { const c = S.contacts.get(cv.pub); if (c) { const p = pathInfo(c); topic = esc(`${advType(c.type)} · ${c.pub.slice(0, 12)}… · ${t('head.advertAgo', fmtAgo(c.lastAdvert))} · ${t('head.path', p.text)}` + (c.type >= 2 ? (c.loggedIn ? ' · ' + t('head.loggedIn') : ' · ' + t('head.notLoggedIn')) : '')); } }
  $('#chan-topic').innerHTML = topic;
  renderChanScope(cv);
  $('#btn-chan-leave').hidden = cv.kind === 'status'; $('#btn-chan-leave').textContent = cv.kind === 'channel' ? t('ui.leave') : t('ui.close');
}
function renderChanScope(cv) {
  const wrap = $('#chan-scope-wrap'), sel = $('#chan-scope'); const ch = cv.kind === 'channel' ? channelByConv(cv) : null;
  wrap.hidden = !ch; if (!ch) return;
  const own = S.chanScope[ch.secret]; const cur = own ? (own.mode === 'unscoped' ? 'unscoped' : own.mode === 'default' ? 'default' : 'key:' + own.key) : 'global';
  const regions = S.settings.regions.slice(); if (S.defaultScope && !regions.some(r => r.key === S.defaultScope.key)) regions.unshift({ name: S.defaultScope.name, key: S.defaultScope.key });
  let html = `<option value="global">${esc(t('scope.optGlobal', scopeText(S.sendScope)))}</option><option value="default">${esc(t('scope.optDefault'))}${S.defaultScope ? ' (' + esc(S.defaultScope.name) + ')' : ''}</option><option value="unscoped">${esc(t('scope.optUnscoped'))}</option>`;
  for (const r of regions) html += `<option value="key:${r.key}">${esc(r.name)}</option>`;
  html += `<option value="new">${esc(t('scope.optNew'))}</option>`;
  sel.innerHTML = html; sel.value = cur; if (sel.value !== cur) { sel.insertAdjacentHTML('beforeend', `<option value="${cur}">${esc(scopeText(own))}</option>`); sel.value = cur; }
  wrap.classList.toggle('custom', !!own); wrap.title = t('scope.chanTitle', own ? scopeText(own) : t('scope.global'));
}
function renderCompose(cv) {
  const tg = $('#target'); tg.textContent = cv.kind === 'status' ? 'status' : cv.name; tg.dataset.target = cv.key;
  const inp = $('#input');
  inp.placeholder = cv.kind === 'repeater' ? t('compose.phRepeater') : cv.kind === 'status' ? t('compose.phStatus') : cv.kind === 'sensor' ? t('compose.phSensor') : t('compose.phMsg');
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
    for (const u of users) { if (u.nick === me) continue; const c = contactByName(u.nick); const age = nowSecs() - (u.last || 0); html += `<div class="user" data-nick="${esc(u.nick)}" ${c ? `data-pub="${c.pub}"` : ''} title="${esc(t('users.lastAgo', fmtAgo(u.last)))}${c ? '' : ' · ' + esc(t('users.noContact'))}"><span class="dot ${age < 3600 ? 'on' : age < 86400 ? 'busy' : 'off'}"></span>${icon(c ? TYPE_ICON[c.type] || 'user' : 'user')}<span class="nm ${nickColor(u.nick)}">${esc(u.nick)}</span>${u.snr != null ? `<span class="snr">${u.snr.toFixed(1)}</span>` : ''}</div>`; }
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
    if (!S.self) { info.innerHTML = `<h3>${esc(t('info.node'))}</h3><div class="dim">${esc(t('info.notConnected'))}</div>`; return; }
    info.innerHTML = `<h3>${esc(t('info.ownNode'))}</h3><dl><dt>${esc(t('info.name'))}</dt><dd>${esc(S.self.name)}</dd><dt>${esc(t('info.key'))}</dt><dd>${S.self.pub.slice(0, 16)}…</dd><dt>${esc(t('info.radio'))}</dt><dd>${S.self.freq} MHz · BW${S.self.bw} · SF${S.self.sf} · CR${S.self.cr} · ${S.self.txPower} dBm</dd><dt>${esc(t('info.region'))}</dt><dd>${S.defaultScope ? esc(S.defaultScope.name) : esc(t('info.regionNone'))}</dd><dt>${esc(t('info.sendScope'))}</dt><dd>${esc(sendScopeText())}</dd><dt>${esc(t('info.contacts'))}</dt><dd>${S.contacts.size}${S.dev?.maxContacts ? ' / ' + S.dev.maxContacts : ''}</dd></dl><div class="acts"><button class="btn sm" data-act="advert-flood">${esc(t('info.advertFlood'))}</button><button class="btn sm ghost" data-act="advert-0">${esc(t('info.advert0'))}</button><button class="btn sm ghost" data-act="contacts">${esc(t('info.contacts'))}</button>${/^https?:$/.test(location.protocol) ? `<button class="btn sm ghost" data-act="download" title="${esc(t('info.downloadTitle'))}">⬇ HTML</button>` : ''}</div>`;
    return;
  }
  if (cv.kind === 'channel') { const ch = channelByConv(cv); info.innerHTML = `<h3>${esc(t('info.channel'))}</h3><dl><dt>${esc(t('info.name'))}</dt><dd>${esc(ch?.name || cv.name)}</dd><dt>${esc(t('info.key'))}</dt><dd class="mono" style="font-size:10.5px">${ch?.secret || '?'}</dd><dt>Base64</dt><dd style="font-size:10.5px">${ch ? esc(b64(unhex(ch.secret))) : ''}</dd><dt>${esc(t('info.slot'))}</dt><dd>${ch?.idx ?? '?'}</dd></dl><div class="acts"><button class="btn sm" data-act="copy-key">${esc(t('info.copyKey'))}</button><button class="btn sm ghost danger" data-act="leave">${esc(t('ui.leave'))}</button></div>`; return; }
  if (!c) { info.innerHTML = ''; return; }
  const p = pathInfo(c); const dist = distanceKm(S.self, c); const x = S.extras[c.pub] || {};
  info.innerHTML = `<h3>${esc(t('info.title', displayName(c)))}</h3><dl>
    <dt>${esc(t('info.type'))}</dt><dd><span class="type ${TYPE_CSS[c.type] || ''}">${esc(advType(c.type))}</span>${c.flags & 1 ? ' ★' : ''}</dd>
    ${x.alias ? `<dt>${esc(t('info.advertName'))}</dt><dd>${esc(c.name)}</dd>` : ''}
    <dt>${esc(t('info.key'))}</dt><dd title="${c.pub}">${c.pub.slice(0, 4)} ${c.pub.slice(4, 8)} … ${c.pub.slice(-4)}</dd>
    <dt>${esc(t('info.advert'))}</dt><dd>${c.lastAdvert ? fmtDateTime(c.lastAdvert) : esc(t('ago.never'))}</dd>
    <dt>${esc(t('info.path'))}</dt><dd>${esc(p.hashes.length ? p.hashes.map(hashLabel).join(', ') : p.text)}</dd>
    ${c.lastSnr != null ? `<dt>SNR</dt><dd>${c.lastSnr.toFixed(1)} dB</dd>` : ''}
    ${c.lat ? `<dt>${esc(t('info.location'))}</dt><dd>${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}${dist != null ? ' · ' + dist.toFixed(1) + ' km' : ''}</dd>` : ''}
    ${c.type >= 2 ? `<dt>${esc(t('info.login'))}</dt><dd>${esc(c.loggedIn ? t('info.loggedIn') + (c.perms ? t('info.admin') : '') : t('info.notLoggedIn'))}</dd>` : ''}
    ${x.note ? `<dt>${esc(t('info.note'))}</dt><dd>${esc(x.note)}</dd>` : ''}
  </dl><div class="acts">
    ${c.type >= 2 ? `<button class="btn sm" data-act="status">${esc(t('info.status'))}</button>` : ''}
    <button class="btn sm" data-act="telemetry">${esc(t('info.telemetry'))}</button>
    ${p.hashes.length ? `<button class="btn sm" data-act="trace">${esc(t('info.trace'))}</button>` : ''}
    <button class="btn sm" data-act="discover">${esc(t('info.discover'))}</button>
    <button class="btn sm ghost" data-act="path-reset">${esc(t('info.pathReset'))}</button>
    ${c.type >= 2 ? (c.loggedIn ? `<button class="btn sm ghost" data-act="logout">${esc(t('info.logout'))}</button>` : `<button class="btn sm primary" data-act="login">${esc(t('info.loginBtn'))}</button>`) : ''}
    <button class="btn sm ghost" data-act="edit">${esc(t('info.edit'))}</button>
  </div>`;
}
function sendScopeText() { return scopeText(S.sendScope); }

// ---------- command hint ----------
// [commando, i18n-key van de argumenten ('' = geen), i18n-key van de uitleg]; commando's zelf blijven Engels
const COMMANDS = [
  ['/help', '', 'cmd.help'], ['/about', '', 'cmd.about'],
  ['/connect', 'cmd.connect.arg', 'cmd.connect'], ['/disconnect', '', 'cmd.disconnect'],
  ['/join', 'cmd.join.arg', 'cmd.join'], ['/part', 'cmd.part.arg', 'cmd.part'],
  ['/msg', 'cmd.msg.arg', 'cmd.msg'], ['/query', 'cmd.query.arg', 'cmd.query'], ['/me', 'cmd.me.arg', 'cmd.me'],
  ['/nick', 'cmd.nick.arg', 'cmd.nick'], ['/whois', 'cmd.whois.arg', 'cmd.whois'], ['/names', '', 'cmd.names'], ['/list', '', 'cmd.list'], ['/contacts', '', 'cmd.contacts'],
  ['/advert', 'cmd.advert.arg', 'cmd.advert'], ['/login', 'cmd.login.arg', 'cmd.login'], ['/logout', '', 'cmd.logout'],
  ['/cli', 'cmd.cli.arg', 'cmd.cli'], ['/status', '', 'cmd.status'], ['/telemetry', 'cmd.telemetry.arg', 'cmd.telemetry'],
  ['/trace', 'cmd.trace.arg', 'cmd.trace'], ['/path', 'cmd.path.arg', 'cmd.path'], ['/resetpath', 'cmd.resetpath.arg', 'cmd.resetpath'],
  ['/scope', 'cmd.scope.arg', 'cmd.scope'], ['/region', 'cmd.region.arg', 'cmd.region'], ['/regions', 'cmd.regions.arg', 'cmd.regions'],
  ['/export', 'cmd.export.arg', 'cmd.export'], ['/import', 'cmd.import.arg', 'cmd.import'], ['/share', 'cmd.share.arg', 'cmd.share'], ['/del', 'cmd.del.arg', 'cmd.del'],
  ['/time', '', 'cmd.time'], ['/settime', '', 'cmd.settime'], ['/battery', '', 'cmd.battery'], ['/stats', '', 'cmd.stats'],
  ['/raw', 'cmd.raw.arg', 'cmd.raw'], ['/debug', '', 'cmd.debug'], ['/clear', '', 'cmd.clear'], ['/theme', 'cmd.theme.arg', 'cmd.theme'], ['/quit', '', 'cmd.quit'],
];
let hintSel = 0;
function renderHint() {
  const v = $('#input').value; const h = $('#hint');
  if (!v.startsWith('/') || v.includes(' ')) { h.hidden = true; return; }
  const q = v.toLowerCase(); const list = COMMANDS.filter(c => c[0].startsWith(q));
  if (!list.length) { h.hidden = true; return; }
  hintSel = Math.min(hintSel, list.length - 1);
  h.innerHTML = list.map((c, i) => `<div class="h ${i === hintSel ? 'sel' : ''}" role="option" data-cmd="${c[0]}"><code>${c[0]} ${esc(c[1] ? t(c[1]) : '')}</code><span>${esc(t(c[2]))}</span></div>`).join('');
  h.hidden = false;
}
function hintPick() { const sel = $('#hint .h.sel'); if (!sel) return false; $('#input').value = sel.dataset.cmd + ' '; $('#hint').hidden = true; return true; }
