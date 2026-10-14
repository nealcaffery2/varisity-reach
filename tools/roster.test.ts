// Roster import parsing: the messy ways coaches write heights, classes and
// headers all land on the same fields. Run: npx tsx tools/roster.test.ts
import assert from 'node:assert/strict';
import { athletes } from '../content/athletes';
import { sportBySlug } from '../content/sports';
import { diffRoster, mapHeaders, parseCsv, parseGrad, parseHeight, parseTime, parseWeight, rowsToAthletes, splitName } from '../lib/roster';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};
const football = sportBySlug('football')!.statKeys;

test('heights in every shape', () => {
  for (const [v, want] of [['6-2', 74], [`6'2"`, 74], ['6’ 2”', 74], ['6 ft 2 in', 74], ['6.2', 74], ['6.11', 83], [74, 74], ['74', 74], [5.9, 69], ["6'", 72]] as const) {
    assert.equal(parseHeight(v), want, String(v));
  }
  assert.equal(parseHeight('tall'), undefined);
  assert.equal(parseHeight('9-2'), undefined);
});

test('weights, classes, times, names', () => {
  assert.equal(parseWeight('186 lbs'), 186);
  assert.equal(parseWeight('12'), undefined);
  // 2026-27 season: seniors graduate in 2027.
  assert.equal(parseGrad('Sr.', 2027), 2027);
  assert.equal(parseGrad('Jr', 2027), 2028);
  assert.equal(parseGrad('9th', 2027), 2030);
  assert.equal(parseGrad("'28", 2027), 2028);
  assert.equal(parseGrad('2029', 2027), 2029);
  assert.equal(parseTime('4:38.4'), 278.4);
  assert.equal(parseTime('52.31'), 52.31);
  assert.deepEqual(splitName('RAKERS, CADE'), { first: 'Cade', last: 'Rakers' });
  assert.deepEqual(splitName('Mary Beth Ott'), { first: 'Mary Beth', last: 'Ott' });
});

test('headers map to fields and sport stats', () => {
  const f = mapHeaders(['#', 'Player', 'Pos', 'Yr', 'Ht', 'Wt', '40', 'Bench', 'Rush Yds', 'Rushing touchdowns', 'Notes'], football);
  assert.deepEqual(f.slice(0, 6), ['jersey', 'name', 'position', 'grad', 'height', 'weight']);
  assert.deepEqual(f[6], { measurable: '40 yd' });
  assert.deepEqual(f[8], { stat: 'rushYds' });
  assert.deepEqual(f[9], { stat: 'rushTd' });
  assert.equal(f[10], null);
});

test('a CSV export becomes athletes, with warnings for cells it cannot read', () => {
  const csv = 'Hillsboro Football 2026,,,\n#,Player,Pos,Yr,Ht,Wt,40,Rush Yds\n22,"Rakers, Cade",rb,Jr,5-11,186,4.58,"1,384"\n74,Avery Niehaus,OT,Jr,6\'5",287,,\n9,New Kid,WR,Fr,tall,150,4.9,12\n';
  const rows = parseCsv(csv);
  const list = rowsToAthletes(rows, football, 2027);
  assert.equal(list.length, 3);
  assert.deepEqual([list[0].first, list[0].last, list[0].jersey, list[0].position, list[0].gradYear, list[0].heightIn, list[0].stats.rushYds], ['Cade', 'Rakers', 22, 'RB', 2028, 71, 1384]);
  assert.equal(list[0].measurables['40 yd'], '4.58');
  assert.equal(list[1].heightIn, 77);
  assert.deepEqual(list[2].warnings, ['Height "tall"']);
});

test('diff finds new athletes, real changes and no-ops', () => {
  const hills = athletes.filter((a) => a.school === 'hillsboro');
  const d = diffRoster(hills, [
    { first: 'Cade', last: 'Rakers', jersey: 22, heightIn: 72, weightLb: 186, measurables: {}, stats: { rushYds: 1384 }, warnings: [] },
    { first: 'Avery', last: 'Niehaus', jersey: 74, measurables: {}, stats: {}, warnings: [] },
    { first: 'Brand', last: 'New', measurables: {}, stats: {}, warnings: [] },
  ]);
  assert.equal(d[0].status, 'update');
  assert.deepEqual(d[0].changes, [{ field: 'Height (in)', from: '71', to: '72' }]);
  assert.equal(d[1].status, 'same');
  assert.equal(d[2].status, 'new');
});

console.log(`roster: ${passed} passed`);
