// Fundraiser math and gold card signatures. Run: npx tsx tools/fundraise.test.ts
import assert from 'node:assert/strict';
import { daysLeft, donorCentsToReach, matchedCents, milestoneState, parseAmount, progress, squadBoard, tierFor, totalCents } from '../lib/fundraise';
import { sign, verify } from '../lib/gold-card';

let passed = 0;
const test = async (name: string, fn: () => void | Promise<void>) => {
  try { await fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

const base = { goalCents: 100000, raisedCents: 20000, milestones: [{ atPct: 50, label: 'half' }, { atPct: 100, label: 'all' }] };

await test('match is capped and counts toward progress', () => {
  const c = { ...base, match: { by: 'x', ratio: 1, upToCents: 15000 } };
  assert.equal(matchedCents(c), 15000);
  assert.equal(totalCents(c), 35000);
  assert.equal(progress(c), 0.35);
  assert.equal(progress({ ...c, raisedCents: 500000 }), 1);
});

await test('donor dollars to the next milestone use the match while it lasts', () => {
  // 1:1 match with 30,000 of room left; need 30,000 more total to reach 50%.
  const c = { ...base, match: { by: 'x', ratio: 1, upToCents: 50000 } };
  assert.equal(totalCents(c), 40000);
  assert.equal(donorCentsToReach(c, 50000), 5000);
  // Past the match room, dollars count once.
  assert.equal(donorCentsToReach({ ...c, match: { by: 'x', ratio: 1, upToCents: 22000 } }, 100000), 2000 + (100000 - 40000 - 4000));
  assert.equal(donorCentsToReach(base, 50000), 30000);
  const m = milestoneState(c);
  assert.equal(m.next?.label, 'half');
  assert.equal(m.toNextCents, 5000);
});

await test('tiers, squads, days and amounts', () => {
  assert.equal(tierFor(10000).name, 'Hall of Fame');
  assert.equal(tierFor(2500).name, 'Starter');
  assert.equal(tierFor(500).name, 'Fan');
  assert.deepEqual(squadBoard([{ name: 'a', raisedCents: 1 }, { name: 'b', raisedCents: 9 }]).map((s) => s.name), ['b', 'a']);
  assert.equal(daysLeft('2026-10-20', new Date('2026-10-14T12:00:00Z')), 6);
  assert.equal(daysLeft('2026-01-01', new Date('2026-10-14T12:00:00Z')), 0);
  assert.deepEqual(parseAmount('$25'), { cents: 2500 });
  assert.deepEqual(parseAmount('1,000.50'), { cents: 100050 });
  assert.ok('error' in parseAmount('3'));
  assert.ok('error' in parseAmount('ten'));
});

await test('gold card tokens verify, reject tampering and expire', async () => {
  const t = await sign({ school: 'hillsboro', holder: 'Pat', season: '2026-27', exp: '2027-07-31', n: 'abc' }, 'k1');
  const ok = await verify(t, 'k1', new Date('2026-10-14'));
  assert.ok(ok.ok && ok.payload.holder === 'Pat');
  assert.equal((await verify(t, 'k2')).ok, false);
  const [body, sig] = t.split('.');
  const forged = `${body.slice(0, -2)}xx.${sig}`;
  assert.equal((await verify(forged, 'k1')).ok, false);
  const late = await verify(t, 'k1', new Date('2027-08-01'));
  assert.ok(!late.ok && late.reason.includes('expired'));
  assert.equal((await verify('garbage', 'k1')).ok, false);
});

console.log(`fundraise: ${passed} passed`);
