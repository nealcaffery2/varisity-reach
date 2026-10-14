// Compare: parses measurables, picks the right winner per row, skips what one side lacks.
// Run: npx tsx tools/compare.test.ts
import assert from 'node:assert/strict';
import { athleteBySlug } from '../content/athletes';
import { benchmarkById } from '../content/benchmarks';
import { sportBySlug } from '../content/sports';
import { compareRows, measurableNumber, sideFromAthlete, tally } from '../lib/compare';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

test('measurable strings to numbers', () => {
  assert.equal(measurableNumber('4.47'), 4.47);
  assert.equal(measurableNumber('36 in'), 36);
  assert.equal(measurableNumber('275 lb'), 275);
  assert.equal(measurableNumber('10 ft 6 in'), 126);
  assert.equal(measurableNumber('Level 12.4'), 12.4);
  assert.equal(measurableNumber('n/a'), undefined);
});

test('lower 40 time wins, higher yards win, size has no winner', () => {
  const a = sideFromAthlete(athleteBySlug('deshawn-pruitt')!);
  const b = benchmarkById('rb-4star')!;
  const rows = compareRows(a, b, sportBySlug('football')!.statKeys);
  const by = (l: string) => rows.find((r) => r.label === l)!;
  assert.equal(by('40 yd').edge, 'a'); // 4.47 vs 4.52
  assert.equal(by('Rushing yards').edge, 'a');
  assert.equal(by('Weight').edge, null);
  assert.ok(!rows.some((r) => r.label === 'Passing yards'));
  const t = tally(rows);
  assert.ok(t.a > t.b);
});

console.log(`compare: ${passed} passed`);
