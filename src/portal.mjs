// Tambayan: reads games.json and builds the page. Adding a game means adding one entry there (and a
// thumbnail); nothing in this file changes.
const $ = (sel, el = document) => el.querySelector(sel);
const NEW_DAYS = 14; // a game is "Bago!" for two weeks after it's added, and a new look is news for as long
const FEATURED = 6; // how many games the carousel at the top shows
const DWELL = 7000; // ms on each before it moves on

export function sortGames(games) {
  return [...games].sort((a, b) => (a.status === b.status ? 0 : a.status === 'live' ? -1 : 1) || b.added.localeCompare(a.added));
}

const days = (date, today) => (today - new Date(`${date}T00:00:00`)) / 86400000;
export const isNew = (game, today = new Date()) => days(game.added, today) < NEW_DAYS;
export const isUpdated = (game, today = new Date()) => !!game.updated && !isNew(game, today) && days(game.updated, today) < NEW_DAYS;

// The carousel: live games, those given a `feature` rank first (in that order), then the most recently
// added or remade.
export function featured(games, n = FEATURED) {
  const when = (g) => (g.updated && g.updated > g.added ? g.updated : g.added);
  const rank = (g) => (Number.isFinite(g.feature) ? g.feature : Infinity);
  const order = new Map(games.map((g, i) => [g, i])); // ties keep the list's own order
  return games.filter((g) => g.status === 'live').sort((a, b) => rank(a) - rank(b) || when(b).localeCompare(when(a)) || order.get(a) - order.get(b)).slice(0, n);
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

function badges(game, today, box) {
  if (game.status === 'prototype') box.appendChild(el('span', 'proto', 'Prototype'));
  else if (isNew(game, today)) box.appendChild(el('span', '', 'Bago!'));
  else if (isUpdated(game, today)) box.appendChild(el('span', '', 'Bagong look'));
  if (game.tags.includes('3D')) box.appendChild(el('span', 'd3', '3D'));
}

function card(game, today) {
  const tpl = $('#card').content.cloneNode(true);
  const root = $('.game', tpl);
  root.dataset.genre = game.genre;
  const img = $('img', tpl);
  img.src = game.thumb; img.alt = `${game.title} gameplay`;
  $('.title', tpl).textContent = game.title;
  $('.tagline', tpl).textContent = game.tagline;
  $('.desc', tpl).textContent = game.description;
  $('.genre', tpl).textContent = game.genre;
  $('.controls', tpl).textContent = game.controls;
  const tags = $('.tags', tpl);
  for (const t of game.tags) if (t !== '3D') tags.appendChild(el('span', '', t));
  badges(game, today, $('.badges', tpl));
  const play = $('.play', tpl);
  play.href = game.url;
  play.setAttribute('aria-label', `Play ${game.title}`);
  $('.cover', tpl).href = game.url;
  $('.cover', tpl).setAttribute('aria-label', `Play ${game.title}`);
  const mirror = $('.mirror', tpl);
  if (game.mirror) mirror.href = game.mirror; else mirror.remove();
  const repo = $('.repo', tpl);
  if (game.repo) repo.href = game.repo; else repo.remove();
  return tpl;
}

// ---------- the featured carousel ----------
function carousel(list, today) {
  const hero = $('#top'), slides = $('#slides'), copy = $('#hero-copy'), picker = $('#picker');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  hero.style.setProperty('--dwell', `${DWELL / 1000}s`);
  const shots = list.map((g, i) => {
    const s = el('div', 'slide');
    const img = el('img'); img.src = g.thumb; img.alt = ''; img.width = 1600; img.height = 900;
    if (i > 0) img.loading = 'lazy';
    s.appendChild(img); slides.appendChild(s);
    return s;
  });
  const picks = list.map((g, i) => {
    const b = el('button'); b.type = 'button'; b.setAttribute('aria-label', g.title);
    const img = el('img'); img.src = g.thumb; img.alt = ''; img.loading = 'lazy';
    b.append(img, el('i'));
    b.onclick = () => { go(i); restart(); };
    picker.appendChild(b);
    return b;
  });
  let at = -1, timer = null;
  function go(i) {
    if (i === at) return;
    at = i;
    const g = list[i];
    shots.forEach((s, k) => s.classList.toggle('on', k === i));
    picks.forEach((b, k) => { b.setAttribute('aria-current', String(k === i)); b.replaceChild(el('i'), b.querySelector('i')); });
    // the copy is built fresh so its rise-in plays again
    copy.replaceChildren();
    copy.appendChild(el('p', 'kicker', i === 0 ? 'Tampok · Featured' : `${g.genre}`));
    copy.appendChild(el('h2', '', g.title));
    copy.appendChild(el('p', 'tagline', g.tagline));
    copy.appendChild(el('p', 'desc', g.description));
    const chips = el('div', 'chips');
    if (isNew(g, today)) chips.appendChild(el('span', 'hl', 'Bago!'));
    else if (isUpdated(g, today)) chips.appendChild(el('span', 'hl', 'Bagong look'));
    for (const t of [g.genre, ...g.tags.filter((x) => !g.controls.includes(x)).slice(0, 3), g.controls]) chips.appendChild(el('span', '', t));
    copy.appendChild(chips);
    const cta = el('div', 'cta');
    const play = el('a', 'btn gold', 'Laro na!'); play.href = g.url; play.setAttribute('aria-label', `Play ${g.title}`);
    const more = el('a', 'btn', 'Lahat ng laro'); more.href = '#laro';
    cta.append(play, more);
    copy.appendChild(cta);
  }
  const next = () => go((at + 1) % list.length);
  function restart() { clearInterval(timer); if (!calm && list.length > 1) timer = setInterval(() => { if (!hero.classList.contains('paused') && !document.hidden) next(); }, DWELL); }
  const pause = (on) => hero.classList.toggle('paused', on);
  hero.addEventListener('pointerenter', () => pause(true));
  hero.addEventListener('pointerleave', () => pause(false));
  hero.addEventListener('focusin', () => pause(true));
  hero.addEventListener('focusout', () => pause(false));
  // swipe on phones
  let sx = null;
  hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) { go((at + (dx < 0 ? 1 : list.length - 1)) % list.length); restart(); } });
  go(0); restart();
}

export async function boot() {
  const list = $('#games');
  let games, raw;
  try {
    const res = await fetch('games.json', { cache: 'no-cache' });
    raw = (await res.json()).games;
    games = sortGames(raw);
  } catch {
    list.textContent = 'Hindi ma-load ang mga laro. The game list could not load; try again in a moment.';
    return;
  }
  const today = new Date();
  carousel(featured(raw), today);
  for (const g of games) list.appendChild(card(g, today));
  list.appendChild($('#soon').content.cloneNode(true)); // the coming-soon tile closes the grid
  $('#n-games').textContent = String(games.length);

  // genre filters, built from whatever genres the list has
  const genres = ['Lahat', ...new Set(games.map((g) => g.genre))];
  const bar = $('#filters');
  for (const genre of genres) {
    const b = el('button', '', genre);
    const n = genre === 'Lahat' ? games.length : games.filter((g) => g.genre === genre).length;
    b.appendChild(el('sup', '', String(n)));
    b.type = 'button'; b.setAttribute('aria-pressed', String(genre === 'Lahat'));
    b.onclick = () => {
      for (const x of bar.children) x.setAttribute('aria-pressed', String(x === b));
      for (const c of list.children) if (c.dataset.genre) c.hidden = genre !== 'Lahat' && c.dataset.genre !== genre;
    };
    bar.appendChild(b);
  }

  // cards rise in as they come into view
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -8% 0px' }) : null;
  for (const r of document.querySelectorAll('.reveal')) { if (io) io.observe(r); else r.classList.add('in'); }
  // the top bar turns solid once you scroll
  const nav = $('#nav');
  const solid = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', solid, { passive: true }); solid();

  $('#random').onclick = () => {
    const live = games.filter((g) => g.status === 'live');
    location.href = live[Math.floor(Math.random() * live.length)].url;
  };
  const dlg = $('#support');
  for (const b of document.querySelectorAll('[data-support]')) b.onclick = () => dlg.showModal();
  $('#support-close').onclick = () => dlg.close();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  // the games link here with #support to open the QR straight away
  if (location.hash === '#support') dlg.showModal();
}

if (typeof document !== 'undefined') boot();
