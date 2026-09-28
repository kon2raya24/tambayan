// games.json is the only thing you edit to add a game, so it's checked here: every entry complete,
// every thumbnail present, ids unique.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { sortGames, isNew } from '../src/portal.mjs';

const { games } = JSON.parse(readFileSync(new URL('../games.json', import.meta.url), 'utf8'));

test('every game entry is complete and its thumbnail exists', () => {
  assert.ok(games.length >= 1);
  const ids = new Set();
  for (const g of games) {
    for (const k of ['id', 'title', 'tagline', 'description', 'genre', 'url', 'thumb', 'controls', 'status', 'added']) assert.ok(typeof g[k] === 'string' && g[k].length, `${g.id || '?'}: ${k}`);
    assert.ok(!ids.has(g.id), `duplicate id ${g.id}`); ids.add(g.id);
    assert.match(g.id, /^[a-z0-9-]+$/);
    assert.ok(Array.isArray(g.tags));
    assert.match(g.url, /^https:\/\//, `${g.id}: url`);
    if (g.mirror) assert.match(g.mirror, /^https:\/\//);
    if (g.repo) assert.match(g.repo, /^https:\/\//);
    assert.ok(['live', 'prototype'].includes(g.status), `${g.id}: status`);
    assert.match(g.added, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(existsSync(new URL(`../${g.thumb}`, import.meta.url)), `${g.id}: ${g.thumb} missing`);
  }
});

test('live games come first, newest first; new games get a badge for two weeks', () => {
  const s = sortGames([
    { id: 'a', status: 'prototype', added: '2026-09-30' },
    { id: 'b', status: 'live', added: '2026-09-01' },
    { id: 'c', status: 'live', added: '2026-09-20' },
  ]);
  assert.deepEqual(s.map((g) => g.id), ['c', 'b', 'a']);
  assert.equal(isNew({ added: '2026-09-28' }, new Date('2026-10-05')), true);
  assert.equal(isNew({ added: '2026-09-01' }, new Date('2026-10-05')), false);
});
