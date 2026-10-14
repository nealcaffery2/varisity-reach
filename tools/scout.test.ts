// Scouting: diamonds, cornfed, smallest town, needs, scramble, tapes, ratios.
// Run: npx tsx tools/scout.test.ts
import assert from 'node:assert/strict';
import { canSendTape, cornfed, diamondScore, fits, ratios, scramble, smallestTown, watchLine, type Prospect, type Tape } from '../lib/scout';
import { rng } from '../lib/recommend';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};
const P = (o: Partial<Prospect>): Prospect => ({ slug: 'x', sport: 'football', position: 'RB', gradYear: 2027, production: 0.8, watchers: 0, ...o });

test('diamonds: same production, fewer watchers scores higher', () => {
  assert.equal(diamondScore({ production: 0.9, watchers: 0 }), 85);
  assert.ok(diamondScore({ production: 0.9, watchers: 0 }) > diamondScore({ production: 0.9, watchers: 9 }));
  assert.ok(diamondScore({ production: 0.95, watchers: 1 }) > diamondScore({ production: 0.5, watchers: 0 }));
});

test('cornfed: tiny school and town multiply production, big ones shrink it', () => {
  const farm = cornfed({ production: 0.8, enrollment: 120, townPop: 900 });
  const city = cornfed({ production: 0.8, enrollment: 2400, townPop: 150_000 });
  assert.ok(farm.cornfed && !city.cornfed);
  assert.ok(farm.score > 0.8 && city.score < 0.8);
});

test('smallest town wins among strong nominees', () => {
  const w = smallestTown([P({ slug: 'a', townPop: 6000 }), P({ slug: 'b', townPop: 450, production: 0.5 }), P({ slug: 'c', townPop: 1200 })]);
  assert.equal(w?.slug, 'c');
  assert.equal(smallestTown([P({ slug: 'big', enrollment: 900 }), P({ slug: 'tiny', enrollment: 140 })])?.slug, 'tiny');
});

test('needs: positions, class, height, and the do-not-want list wins', () => {
  const n = { sports: ['football'], positions: ['RB', 'SS'], classes: [2027, 2028], minHeightIn: 70, dontWant: [] };
  assert.ok(fits({ sport: 'football', position: 'RB / SS', gradYear: 2027, heightIn: 71 }, n));
  assert.ok(!fits({ sport: 'football', position: 'RB / SS', gradYear: 2027, heightIn: 68 }, n));
  assert.ok(!fits({ sport: 'football', position: 'QB', gradYear: 2027, heightIn: 74 }, n));
  assert.ok(!fits({ sport: 'football', position: 'RB / K', gradYear: 2027, heightIn: 72 }, { ...n, dontWant: ['K'] }));
});

test('scramble skips seen athletes and prefers fits', () => {
  const pool = [P({ slug: 'qb', position: 'QB' }), P({ slug: 'rb', position: 'RB' }), P({ slug: 'ol', position: 'OL' })];
  const needs = { sports: [], positions: ['RB'], classes: [], dontWant: [] };
  const r = rng(5);
  for (let i = 0; i < 20; i++) assert.equal(scramble(pool, { needs, seen: new Set(), rand: r })?.slug, 'rb');
  assert.notEqual(scramble(pool, { needs, seen: new Set(['rb']), rand: r })?.slug, 'rb');
  assert.equal(scramble(pool, { seen: new Set(['qb', 'rb', 'ol']), rand: r }), undefined);
});

test('tapes: three a season, two weeks apart, and a watched tape waits for "send more"', () => {
  const day = 86_400_000;
  const t0 = Date.UTC(2026, 9, 1);
  const h: Tape[] = [{ athlete: 'a', recruiter: 'r', sentAt: t0 }];
  assert.equal(canSendTape(h, 'a', 'r', t0 + 5 * day).ok, false);
  assert.equal(canSendTape(h, 'a', 'r', t0 + 15 * day).ok, true);
  assert.equal(canSendTape(h, 'a', 'other', t0 + day).ok, true);
  h[0].seenAt = t0 + 2 * day;
  const seen = canSendTape(h, 'a', 'r', t0 + 30 * day);
  assert.equal(seen.ok, false);
  h[0].moreRequestedAt = t0 + 3 * day;
  assert.equal(canSendTape(h, 'a', 'r', t0 + 4 * day).ok, true);
  const three: Tape[] = [0, 20, 40].map((d) => ({ athlete: 'a', recruiter: 'r', sentAt: t0 + d * day }));
  assert.equal(canSendTape(three, 'a', 'r', t0 + 90 * day).ok, false);
});

test('ratios: computed when inputs exist, undefined otherwise', () => {
  const r = ratios({ rushYds: 1412, rushAtt: 188, rec: 0, passComp: 120, passAtt: 200, passTd: 18, int: 4 });
  assert.equal(r.yardsPerCarry, 7.5);
  assert.equal(r.completionPct, 60);
  assert.equal(r.tdToInt, 4.5);
  assert.equal(r.yardsPerCatch, undefined);
  assert.equal(watchLine(0), 'No recruiters yet');
  assert.equal(watchLine(4), '4 recruiters watching');
});

console.log(`scout: ${passed} passed`);
