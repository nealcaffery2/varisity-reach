// Reels recommender and recruiter contact calendar.
// Run: npx tsx tools/recommend.test.ts
import assert from 'node:assert/strict';
import { affinities, forYou, shuffle, topSports, visible, type Engagement } from '../lib/recommend';
import { canContact, contactOpens } from '../lib/recruiting-rules';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};
const NOW = Date.UTC(2026, 9, 14);
const day = 86_400_000;
const reels = Array.from({ length: 60 }, (_, i) => ({ id: `r${i}`, sport: ['football', 'wrestling', 'volleyball'][i % 3] }));
const ev = (sport: string, kind: Engagement['kind'], daysAgo = 0, reelId = 'x'): Engagement => ({ reelId, sport, kind, at: NOW - daysAgo * day });

test('engagement raises a sport, skips lower it, both stay inside 0.25..4', () => {
  const a = affinities([ev('wrestling', 'like'), ev('wrestling', 'save'), ev('wrestling', 'comment'), ev('volleyball', 'skip'), ev('volleyball', 'skip')], NOW);
  assert.ok(a.wrestling > 2);
  assert.ok(a.volleyball < 1);
  const binge = affinities(Array.from({ length: 200 }, () => ev('football', 'save')), NOW);
  assert.equal(binge.football, 4);
});

test('old engagement fades', () => {
  const fresh = affinities([ev('football', 'save')], NOW).football;
  const old = affinities([ev('football', 'save', 60)], NOW).football;
  assert.ok(fresh > old && old > 1);
});

test('for-you leans toward liked sports but keeps the others', () => {
  const events = Array.from({ length: 6 }, () => ev('wrestling', 'save'));
  let topWrestling = 0;
  let others = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const top10 = forYou(reels, events, { now: NOW, seed }).slice(0, 10);
    topWrestling += top10.filter((r) => r.sport === 'wrestling').length;
    others += top10.filter((r) => r.sport !== 'wrestling').length;
  }
  assert.ok(topWrestling / 500 > 0.5, `wrestling share ${topWrestling / 500}`);
  assert.ok(others > 0);
  assert.deepEqual(topSports(events, NOW), ['wrestling']);
});

test('no-thanks reels drop out; the same seed gives the same order', () => {
  const hidden = new Set(['r0', 'r1']);
  const a = forYou(reels, [], { now: NOW, seed: 7, hidden });
  assert.equal(a.length, 58);
  assert.ok(!a.some((r) => hidden.has(r.id)));
  assert.deepEqual(a.map((r) => r.id), forYou(reels, [], { now: NOW, seed: 7, hidden }).map((r) => r.id));
  assert.notDeepEqual(shuffle(reels, 1).map((r) => r.id), shuffle(reels, 2).map((r) => r.id));
  assert.equal(new Set(shuffle(reels, 3).map((r) => r.id)).size, 60);
});

test('recruiter-only reels stay hidden from everyone else', () => {
  const rs = [{ id: 'a', sport: 'football' }, { id: 'b', sport: 'football', audience: 'recruiters' as const }];
  assert.deepEqual(visible(rs, { verifiedRecruiter: false }).map((r) => r.id), ['a']);
  assert.equal(visible(rs, { verifiedRecruiter: true }).length, 2);
});

test('contact calendar: D1 football opens Sept 1 of junior year, D1/D2 others June 15 after sophomore, D3 any time', () => {
  assert.equal(contactOpens('D1', 'football', 2028)?.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(contactOpens('D2', 'wrestling', 2029)?.toISOString().slice(0, 10), '2027-06-15');
  assert.equal(contactOpens('D3', 'football', 2030), null);
  const held = canContact({ division: 'D1', sport: 'football', gradYear: 2029, now: new Date(NOW), minor: true });
  assert.equal(held.ok, false);
  assert.deepEqual(canContact({ division: 'D1', sport: 'football', gradYear: 2028, now: new Date(NOW), minor: true }), { ok: true, ccFamily: true });
});

console.log(`recommend: ${passed} passed`);
