// Compare: parses measurables, picks the right winner per row, skips what one side lacks.
// Run: npx tsx tools/compare.test.ts
import assert from 'node:assert/strict';
import { athleteBySlug } from '../content/athletes';
import { benchmarks, benchmarkById } from '../content/benchmarks';
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

test('higher yards win, size has no winner, missing numbers drop out', () => {
  const a = sideFromAthlete(athleteBySlug('deshawn-pruitt')!);
  const b = benchmarkById('rb-3star-williams')!;
  const rows = compareRows(a, b, sportBySlug('football')!.statKeys);
  const by = (l: string) => rows.find((r) => r.label === l)!;
  assert.equal(by('Rushing yards').edge, 'b'); // 2,311 vs 2,368
  assert.equal(by('Rushing touchdowns').edge, 'a'); // 31 vs 28
  assert.equal(by('Weight').edge, null);
  assert.ok(!rows.some((r) => r.label === '40 yd')); // no verified 40 on the reference side
  assert.ok(!rows.some((r) => r.label === 'Passing yards'));
});

test('lower times win; a side without height or weight skips those rows', () => {
  const a = { label: 'A', heightIn: 70, measurables: { '40 yd': 4.47 }, stats: { m100: 10.9 } };
  const b = { label: 'B', measurables: { '40 yd': 4.52 }, stats: { m100: 10.47 } };
  const rows = compareRows(a, b, sportBySlug('track-and-field')!.statKeys);
  assert.equal(rows.find((r) => r.label === '40 yd')!.edge, 'a');
  assert.equal(rows.find((r) => r.label.startsWith('100 meters'))!.edge, 'b');
  assert.ok(!rows.some((r) => r.label === 'Height' || r.label === 'Weight'));
});

test('every reference recruit is real and cites a source', () => {
  for (const r of benchmarks) {
    assert.equal(r.sample, false, r.id);
    assert.ok(r.sources.length > 0 && r.sources.every((s) => s.url.startsWith('https://')), r.id);
    assert.ok(Object.keys(r.stats).length > 0, r.id);
  }
});

console.log(`compare: ${passed} passed`);
