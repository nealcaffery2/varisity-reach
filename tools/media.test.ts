// Media marketplace, sponsored listings, pledges, fun awards.
// Run: npx tsx tools/media.test.ts
import assert from 'node:assert/strict';
import { canLicense, creditLine, orderListings, pledgeProgress, split, tally } from '../lib/media';
import { appliesTo, forPlace, upcoming } from '../lib/grants';
import { grants } from '../content/grants';
import { reality } from '../content/reality';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

test('a sale splits to photographer, team fund and fees, adding up', () => {
  const s = split(2500);
  assert.deepEqual(s, { creator: 1875, school: 500, fees: 125 });
  assert.equal(s.creator + s.school + s.fees, 2500);
});

test('commercial use of minors needs a release; editorial does not', () => {
  assert.equal(canLicense('commercial', { minorsShown: true, releaseOnFile: false }).ok, false);
  assert.equal(canLicense('commercial', { minorsShown: true, releaseOnFile: true }).ok, true);
  assert.equal(canLicense('editorial', { minorsShown: true, releaseOnFile: false }).ok, true);
  assert.equal(creditLine('Jo Lee', 'Hillsboro'), 'Photo: Jo Lee for Hillsboro via Varsity Reach');
});

test('watch list: live first, then sponsors by amount, then kickoff', () => {
  const list = [
    { gameId: 'a', kickoff: '2026-10-16T19:00' },
    { gameId: 'b', kickoff: '2026-10-16T18:00', sponsor: { name: 'X', cents: 5000, pledge: 'helmets' } },
    { gameId: 'c', kickoff: '2026-10-16T17:00', sponsor: { name: 'Y', cents: 10000, pledge: 'bus' } },
    { gameId: 'd', kickoff: '2026-10-16T20:00' },
  ];
  assert.deepEqual(orderListings(list, new Set(['d'])).map((x) => x.gameId), ['d', 'c', 'b', 'a']);
});

test('pledges add up toward the estimate and flag faculty', () => {
  const p = pledgeProgress(120000, [{ by: 'faculty', name: 'Mr. K', cents: 20000 }, { by: 'booster', name: 'B', cents: 70000 }, { by: 'family', name: 'F', hours: 6 }]);
  assert.deepEqual(p, { cents: 90000, hours: 6, pct: 75, faculty: true });
  assert.equal(pledgeProgress(undefined, []).pct, undefined);
});

test('fun awards: one vote per person, earliest entry wins ties', () => {
  const t = tally(
    [{ voter: 'u1', clip: 'x' }, { voter: 'u1', clip: 'y' }, { voter: 'u2', clip: 'y' }, { voter: 'u3', clip: 'x' }],
    [{ clip: 'y', at: '2026-10-10' }, { clip: 'x', at: '2026-10-09' }],
  );
  assert.deepEqual(t.map((e) => [e.clip, e.votes]), [['x', 2], ['y', 1]]);
});

test('grants: county, state and national reach the right schools, local first', () => {
  const hillsboro = { state: 'IL', county: 'Montgomery' };
  const peoria = { state: 'IL', county: 'Peoria' };
  const iowa = { state: 'IA' };
  const cfll = grants.find((g) => g.id === 'cfll-grants')!;
  assert.ok(appliesTo(cfll, hillsboro) && !appliesTo(cfll, peoria) && !appliesTo(cfll, iowa));
  assert.ok(!appliesTo(grants.find((g) => g.id === 'isac-map')!, iowa));
  const list = forPlace(grants, hillsboro);
  assert.equal(list[0].area.kind, 'counties');
  assert.ok(forPlace(grants, iowa).every((g) => g.area.kind === 'national'));
  assert.deepEqual(upcoming(grants, hillsboro, '2026-10-14', 60).map((g) => g.id), ['every-kid-sports', 'walmart-spark']);
});

test('every reality stat and grant cites an https source', () => {
  for (const f of reality) assert.match(f.url, /^https:\/\//, f.figure);
  for (const g of grants) assert.match(g.url, /^https:\/\//, g.id);
  assert.equal(new Set(grants.map((g) => g.id)).size, grants.length);
});

console.log(`media: ${passed} passed`);
