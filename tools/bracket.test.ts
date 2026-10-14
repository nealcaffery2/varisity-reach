// Fan bracket: seeding, carrying picks forward, knocking out stale picks,
// scoring. Also the IHSA conference parser. Run: npx tsx tools/bracket.test.ts
import assert from 'node:assert/strict';
import { bracketWithPicks, champion, firstRound, pick, pickShare, score } from '../lib/bracket';
import { normalizeName, parseIhsaConference, sortStandings } from '../lib/ihsa';
import { canPlace, points, squadPoints } from '../lib/fantasy';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};
const seeds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((team, i) => ({ seed: i + 1, team }));

test('8-team seeding: 1v8, 4v5, 2v7, 3v6 with 1 and 2 on opposite sides', () => {
  const r1 = firstRound(seeds).map((m) => `${m.a}-${m.b}`);
  assert.deepEqual(r1, ['A-H', 'D-E', 'B-G', 'C-F']);
  assert.throws(() => firstRound(seeds.slice(0, 6)));
});

test('picks carry forward and crown a champion', () => {
  let p = {};
  for (const [id, t] of [['r1-0', 'A'], ['r1-1', 'D'], ['r1-2', 'B'], ['r1-3', 'C'], ['r2-0', 'A'], ['r2-1', 'C'], ['r3-0', 'C']] as const) p = pick(seeds, p, id, t);
  const b = bracketWithPicks(seeds, p);
  assert.deepEqual([b[1][0].a, b[1][0].b, b[2][0].a, b[2][0].b], ['A', 'D', 'A', 'C']);
  assert.equal(champion(seeds, p), 'C');
});

test('changing an early pick clears later picks that depended on it', () => {
  let p = {};
  for (const [id, t] of [['r1-0', 'A'], ['r1-1', 'D'], ['r2-0', 'A'], ['r1-2', 'B'], ['r1-3', 'C'], ['r2-1', 'B'], ['r3-0', 'A']] as const) p = pick(seeds, p, id, t);
  p = pick(seeds, p, 'r1-0', 'H');
  assert.equal((p as Record<string, string>)['r2-0'], undefined);
  assert.equal((p as Record<string, string>)['r3-0'], undefined);
  assert.equal((p as Record<string, string>)['r2-1'], 'B');
});

test('scoring doubles each round; pick share rounds to whole percents', () => {
  assert.equal(score({ 'r1-0': 'A', 'r2-0': 'A', 'r3-0': 'A' }, { 'r1-0': 'A', 'r2-0': 'A', 'r3-0': 'C' }), 3);
  assert.deepEqual(pickShare({ Hillsboro: 214, Piasa: 86 }), { Hillsboro: 71, Piasa: 29 });
  assert.deepEqual(pickShare({}), {});
});

test('IHSA names normalize to what people call the school', () => {
  assert.equal(normalizeName('Pana (H.S.)'), 'Pana');
  assert.equal(normalizeName('Piasa (Southwestern)\\*'), 'Piasa Southwestern');
  assert.equal(normalizeName('Virden (North Mac)'), 'North Mac');
  assert.equal(normalizeName('Staunton [Coop]'), 'Staunton');
  assert.equal(normalizeName('Clifton (Central)'), 'Clifton Central');
});

test('IHSA conference page parses standings, team facts and games', () => {
  const md = [
    '# South Central Conference',
    'Updated Oct 13, 11:26 PM',
    '| Hillsboro | 7 | 0 | 8 | 0 | 33 | 345 | 130 | R |',
    '| Pana (H.S.) | 6 | 2 | 6 | 2 | 33 | 231 | 107 | C |',
    '## Hillsboro (8-0)Hillsboro (8-0)',
    'Nickname: Hiltoppers',
    'Head Coach: Joe Reed',
    'Enrollment: 440.00',
    '| Fri, Aug 21 | 7:00 | @ | Pana (H.S.)\\* | W | 27–14 | 6-2 | 375.00 |',
    '| Fri, Oct 02 | 7:00 | @ | Lincoln | W | 49–7 | 3-5 | 800.00 |',
    '| Fri, Oct 16 | 7:00 | vs | Piasa (Southwestern)\\* | — |  | 4-4 | 360.00 |',
  ].join('\n');
  const c = parseIhsaConference(md, { sourceUrl: 'x', season: 2026, retrieved: '2026-10-14' });
  const h = c.teams[0];
  assert.deepEqual([h.name, h.nickname, h.headCoach, h.enrollment, h.bid, h.conf.w], ['Hillsboro', 'Hiltoppers', 'Joe Reed', 440, 'R', 7]);
  assert.deepEqual(h.games[0], { date: '2026-08-21', time: '7:00', home: false, opponent: 'Pana', conference: true, result: 'W', score: { for: 27, against: 14 }, forfeit: undefined });
  assert.equal(h.games[1].conference, false);
  assert.equal(h.games[2].result, undefined);
  assert.equal(c.updated, 'Oct 13, 11:26 PM');
});

test('standings sort by conference record', () => {
  const t = (name: string, w: number, l: number) => ({ name, ihsaName: name, conf: { w, l }, overall: { w, l }, oppWins: 0, pointsFor: 0, pointsAgainst: 0, games: [] });
  assert.deepEqual(sortStandings([t('B', 4, 3), t('A', 7, 0), t('C', 4, 4)]).map((x) => x.name), ['A', 'B', 'C']);
});

test('fantasy: slots check positions, one athlete per squad, points add up', () => {
  assert.deepEqual(canPlace({}, 'QB', 'a', 'QB / S'), { ok: true });
  assert.equal(canPlace({}, 'QB', 'a', 'RB / SS').ok, false);
  assert.equal(canPlace({ RB: 'a' }, 'DEF', 'a', 'RB / SS').ok, false);
  assert.equal(canPlace({ RB: 'a' }, 'RB', 'a', 'RB / SS').ok, true);
  assert.equal(points({ rushYds: 180, rushTd: 2, tackles: 6 }), 36);
  assert.equal(points({ passYds: 200, passTd: 2, int: 1 }), 14);
  assert.equal(squadPoints({ QB: 'q', RB: 'r', WR: 'gone' }, { q: { passYds: 200, passTd: 2, int: 1 }, r: { rushTd: 1 } }), 20);
});

console.log(`bracket: ${passed} passed`);
