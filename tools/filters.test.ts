// The recruiting board's filters: each one narrows, sorts hold, and a search
// survives a trip through the URL. Run: npx tsx tools/filters.test.ts
import assert from 'node:assert/strict';
import { athletes } from '../content/athletes';
import { schoolBySlug } from '../content/schools';
import { EMPTY, activeCount, applyFilters, parseFilters, serializeFilters, type Filters } from '../lib/filters';
import { formatStat, feetInches } from '../lib/format';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};
const f = (over: Partial<Filters>): Filters => ({ ...EMPTY, ...over });

test('no filters returns everyone, GPA high to low', () => {
  const out = applyFilters(athletes, EMPTY);
  assert.equal(out.length, athletes.length);
  for (let i = 1; i < out.length; i++) assert.ok(out[i - 1].gpa >= out[i].gpa);
});

test('sport, GPA, height, weight and NCAA each narrow', () => {
  assert.ok(applyFilters(athletes, f({ sport: 'wrestling' })).every((a) => a.sports.includes('wrestling')));
  assert.ok(applyFilters(athletes, f({ minGpa: 3.5 })).every((a) => a.gpa >= 3.5));
  assert.ok(applyFilters(athletes, f({ minHeight: 72 })).every((a) => a.heightIn >= 72));
  assert.ok(applyFilters(athletes, f({ minWeight: 160, maxWeight: 200 })).every((a) => a.weightLb >= 160 && a.weightLb <= 200));
  assert.ok(applyFilters(athletes, f({ ncaa: true })).every((a) => a.ncaaEligibility === 'Registered'));
});

test('search matches name, position and town', () => {
  assert.equal(applyFilters(athletes, f({ q: 'rakers' }))[0]?.slug, 'cade-rakers');
  assert.ok(applyFilters(athletes, f({ q: 'coffeen' })).length >= 1);
});

test('name sort ascending is alphabetical by last name', () => {
  const out = applyFilters(athletes, f({ sort: 'name', dir: 'asc' }));
  const lasts = out.map((a) => a.last);
  assert.deepEqual(lasts, [...lasts].sort((a, b) => a.localeCompare(b)));
});

test('URL round trip keeps the search, drops defaults', () => {
  const want = f({ sport: 'football', grad: [2028, 2027], minGpa: 3.25, minHeight: 70, ncaa: true, sort: 'height' });
  const qs = serializeFilters(want);
  assert.ok(!qs.includes('dir='));
  const back = parseFilters(new URLSearchParams(qs));
  assert.deepEqual(back, { ...want, grad: [2027, 2028] });
  assert.equal(serializeFilters(EMPTY), '');
  assert.equal(activeCount(want), 5);
});

test('school, state, class and verified narrow', () => {
  assert.ok(applyFilters(athletes, f({ school: 'cedar-fork' })).every((a) => a.school === 'cedar-fork'));
  const tx = applyFilters(athletes, f({ state: 'TX' }), schoolBySlug);
  assert.ok(tx.length > 0 && tx.every((a) => schoolBySlug(a.school)?.state === 'TX'));
  const small = applyFilters(athletes, f({ classes: ['1A', '2A'] }), schoolBySlug);
  assert.ok(small.length > 0 && small.every((a) => ['1A', '2A'].includes(schoolBySlug(a.school)!.classification)));
  assert.ok(applyFilters(athletes, f({ verified: true })).every((a) => a.verified));
  const back = parseFilters(new URLSearchParams(serializeFilters(f({ state: 'ia', classes: ['2A', '1A'], verified: true }))));
  assert.deepEqual([back.state, back.classes, back.verified], ['IA', ['1A', '2A'], true]);
});

test('junk in the URL falls back to defaults', () => {
  const back = parseFilters(new URLSearchParams('gpa=nine&sort=drop&grad=abc,1999&hmin=-4'));
  assert.deepEqual(back, EMPTY);
});

test('stat formats', () => {
  assert.equal(formatStat(1384, { format: 'int' }), '1,384');
  assert.equal(formatStat(0.284, { format: 'dec3' }), '.284');
  assert.equal(formatStat(17.25, { format: 'feet' }), '17-3');
  assert.equal(formatStat(278.4, { format: 'time' }), '4:38.40');
  assert.equal(formatStat(undefined, {}), '–');
  assert.equal(feetInches(74), `6'2"`);
});

console.log(`filters: ${passed} passed`);
