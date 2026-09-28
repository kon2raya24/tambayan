// Tambayan: reads games.json and builds the page. Adding a game means adding one entry there (and a
// thumbnail); nothing in this file changes.
const $ = (sel, el = document) => el.querySelector(sel);
const NEW_DAYS = 14; // a game is "Bago!" for two weeks after it's added

export function sortGames(games) {
  return [...games].sort((a, b) => (a.status === b.status ? 0 : a.status === 'live' ? -1 : 1) || b.added.localeCompare(a.added));
}

export const isNew = (game, today = new Date()) => (today - new Date(`${game.added}T00:00:00`)) / 86400000 < NEW_DAYS;

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
  for (const t of game.tags) { const s = document.createElement('span'); s.textContent = t; tags.appendChild(s); }
  const badge = $('.badge', tpl);
  if (game.status === 'prototype') { badge.textContent = 'Prototype'; badge.classList.add('proto'); }
  else if (isNew(game, today)) badge.textContent = 'Bago!';
  else badge.remove();
  const play = $('.play', tpl);
  play.href = game.url;
  play.setAttribute('aria-label', `Play ${game.title}`);
  $('.cover', tpl).href = game.url;
  const mirror = $('.mirror', tpl);
  if (game.mirror) mirror.href = game.mirror; else mirror.remove();
  const repo = $('.repo', tpl);
  if (game.repo) repo.href = game.repo; else repo.remove();
  return tpl;
}

function hero(game) {
  const h = $('#hero');
  $('#hero-img').src = game.thumb;
  $('#hero-img').alt = `${game.title} gameplay`;
  $('#hero-title').textContent = game.title;
  $('#hero-tag').textContent = game.tagline;
  $('#hero-desc').textContent = game.description;
  $('#hero-play').href = game.url;
  h.hidden = false;
}

export async function boot() {
  const list = $('#games');
  let games;
  try {
    const res = await fetch('games.json', { cache: 'no-cache' });
    games = sortGames((await res.json()).games);
  } catch {
    list.textContent = 'Hindi ma-load ang mga laro. The game list could not load; try again in a moment.';
    return;
  }
  const today = new Date();
  hero(games.find((g) => g.status === 'live') || games[0]);
  for (const g of games) list.appendChild(card(g, today));
  $('#count').textContent = `${games.length} laro`;

  // genre filters, built from whatever genres the list has
  const genres = ['Lahat', ...new Set(games.map((g) => g.genre))];
  const bar = $('#filters');
  for (const genre of genres) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = genre; b.setAttribute('aria-pressed', String(genre === 'Lahat'));
    b.onclick = () => {
      for (const x of bar.children) x.setAttribute('aria-pressed', String(x === b));
      for (const el of list.children) el.hidden = genre !== 'Lahat' && el.dataset.genre !== genre;
    };
    bar.appendChild(b);
  }

  $('#random').onclick = () => {
    const live = games.filter((g) => g.status === 'live');
    location.href = live[Math.floor(Math.random() * live.length)].url;
  };
  const dlg = $('#support');
  for (const b of document.querySelectorAll('[data-support]')) b.onclick = () => dlg.showModal();
  $('#support-close').onclick = () => dlg.close();
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

if (typeof document !== 'undefined') boot();
