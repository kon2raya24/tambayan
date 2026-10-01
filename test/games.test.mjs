// games.json is the only thing you edit to add a game, so it's checked here: every entry complete,
// every thumbnail present, ids unique.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { sortGames, isNew, isUpdated, featured } from '../src/portal.mjs';

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
    if (g.updated) assert.match(g.updated, /^\d{4}-\d{2}-\d{2}$/);
    if (g.feature !== undefined) assert.ok(Number.isInteger(g.feature) && g.feature > 0, `${g.id}: feature`);
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

test('the carousel features live games, the most recently added or remade first; a new look is news for two weeks', () => {
  const list = [
    { id: 'old', status: 'live', added: '2026-08-01' },
    { id: 'remade', status: 'live', added: '2026-08-02', updated: '2026-09-30' },
    { id: 'fresh', status: 'live', added: '2026-09-20' },
    { id: 'proto', status: 'prototype', added: '2026-10-01' },
  ];
  assert.deepEqual(featured(list, 3).map((g) => g.id), ['remade', 'fresh', 'old']);
  assert.deepEqual(featured([...list, { id: 'star', status: 'live', added: '2026-01-01', feature: 1 }], 2).map((g) => g.id), ['star', 'remade'], 'a feature rank comes first');
  const today = new Date('2026-10-05');
  assert.equal(isUpdated(list[1], today), true);
  assert.equal(isUpdated(list[0], today), false);
  assert.equal(isUpdated({ added: '2026-09-30', updated: '2026-10-01' }, today), false, 'still just new');
  assert.equal(isUpdated(list[1], new Date('2026-11-01')), false);
});
