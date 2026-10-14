// Community scoring: fakers lose, proof and verified roles win, locks hold,
// scores do not go backwards on thin evidence. Run: npx tsx tools/consensus.test.ts
import assert from 'node:assert/strict';
import { consensus, gameWindow, sourceLine, updateTrust, weight, type Report } from '../lib/consensus';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

const KICK = Date.UTC(2026, 9, 16, 0, 0); // 7 pm CT kickoff
const win = gameWindow(KICK);
const min = 60_000;
let n = 0;
const rep = (over: Partial<Report>): Report => ({ id: `r${++n}`, reporter: `u${n}`, role: 'fan', trust: 0.5, home: 0, away: 0, at: KICK + 30 * min, ...over });

test('no reports, no score', () => {
  const b = consensus([], KICK, win);
  assert.equal(b.status, 'none');
  assert.equal(sourceLine(b), 'No reports yet');
});

test('three fans agree, one faker disagrees: the three win and it is confirmed', () => {
  const now = KICK + 31 * min;
  const b = consensus([rep({ home: 14, away: 7 }), rep({ home: 14, away: 7 }), rep({ home: 14, away: 7 }), rep({ home: 70, away: 0 })], now, win);
  assert.deepEqual([b.home, b.away, b.status, b.reporters], [14, 7, 'confirmed', 3]);
  assert.ok(b.confidence > 0.7);
});

test('a verified reporter with a scoreboard photo beats several anonymous fakes', () => {
  const now = KICK + 31 * min;
  const fakes = Array.from({ length: 6 }, () => rep({ role: 'anonymous', home: 0, away: 35 }));
  const b = consensus([...fakes, rep({ role: 'reporter', trust: 0.8, photo: true, photoVerified: true, home: 21, away: 14 })], now, win);
  assert.deepEqual([b.home, b.away], [21, 14]);
});

test('a coach lock wins outright, and a newer lock replaces it', () => {
  const now = KICK + 60 * min;
  const fans = Array.from({ length: 5 }, () => rep({ home: 28, away: 21, at: KICK + 59 * min }));
  const b1 = consensus([...fans, rep({ role: 'coach', lock: true, home: 28, away: 24, at: KICK + 50 * min })], now, win);
  assert.deepEqual([b1.home, b1.away, b1.status], [28, 24, 'locked']);
  const b2 = consensus([...fans, rep({ role: 'coach', lock: true, home: 28, away: 24, at: KICK + 50 * min }), rep({ role: 'official', lock: true, final: true, home: 35, away: 24, at: KICK + 55 * min })], now, win);
  assert.deepEqual([b2.home, b2.away, b2.final, sourceLine(b2)], [35, 24, true, 'Official score']);
});

test('a fan cannot lock', () => {
  const b = consensus([rep({ lock: true, home: 99, away: 0 }), rep({ home: 7, away: 0 }), rep({ home: 7, away: 0 })], KICK + 31 * min, win);
  assert.notEqual(b.status, 'locked');
  assert.deepEqual([b.home, b.away], [7, 0]);
});

test('reports outside the game window count for nothing', () => {
  assert.equal(weight(rep({ at: KICK - 3 * 60 * min }), KICK, win), 0);
  const b = consensus([rep({ at: KICK + 10 * 60 * min, home: 50, away: 0 })], KICK + 10 * 60 * min, win);
  assert.equal(b.status, 'none');
});

test('one person reporting five times is one vote', () => {
  const spam = Array.from({ length: 5 }, (_, i) => rep({ reporter: 'troll', home: 3, away: 0, at: KICK + (20 + i) * min }));
  const b = consensus([...spam, rep({ home: 7, away: 0, at: KICK + 24 * min }), rep({ home: 7, away: 0, at: KICK + 24 * min })], KICK + 25 * min, win);
  assert.deepEqual([b.home, b.away], [7, 0]);
});

test('newer reports outweigh stale ones', () => {
  const old = [rep({ home: 7, away: 0, at: KICK + 5 * min }), rep({ home: 7, away: 0, at: KICK + 5 * min })];
  const fresh = [rep({ home: 14, away: 0, at: KICK + 40 * min }), rep({ home: 14, away: 0, at: KICK + 40 * min })];
  const b = consensus([...old, ...fresh], KICK + 41 * min, win);
  assert.deepEqual([b.home, b.away], [14, 0]);
});

test('a lower score needs twice the weight to undo a confirmed one', () => {
  const now = KICK + 41 * min;
  const confirmed = [rep({ home: 21, away: 14, at: KICK + 40 * min }), rep({ home: 21, away: 14, at: KICK + 40 * min })];
  const lower = [rep({ home: 14, away: 14, at: KICK + 40.5 * min }), rep({ home: 14, away: 14, at: KICK + 40.5 * min }), rep({ home: 14, away: 14, at: KICK + 40.5 * min })];
  const b = consensus([...confirmed, ...lower], now, win, { home: 21, away: 14, status: 'confirmed' });
  assert.deepEqual([b.home, b.away], [21, 14]);
});

test('trust moves toward accuracy after the final', () => {
  const good = rep({ reporter: 'good', trust: 0.5, home: 35, away: 24 });
  const faker = rep({ reporter: 'faker', trust: 0.5, home: 70, away: 0 });
  const t = updateTrust([good, faker], { home: 35, away: 24 });
  assert.ok(t.get('good')! > 0.5);
  assert.ok(t.get('faker')! < 0.5);
});

console.log(`consensus: ${passed} passed`);
