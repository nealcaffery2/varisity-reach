// Reference recruits for the side-by-side compare. ALL SAMPLE: the numbers
// sketch a typical highly rated prospect at each position so the tool has
// something to show. They are not any real player, and not pulled from ESPN,
// 247Sports or MaxPreps (whose data is licensed). To ship real comparisons,
// replace each entry with numbers from a source you are allowed to publish
// and fill in `source`; the compare page prints it under the table.

export type Benchmark = {
  id: string;
  sample: boolean;
  label: string; // "National 4-star RB"
  sport: string;
  position: string;
  stars?: number;
  heightIn: number;
  weightLb: number;
  measurables: Record<string, number>; // keyed by measurable label, numeric
  stats: Record<string, number>; // keyed by stat key
  source?: { label: string; url: string };
};

export const benchmarks: Benchmark[] = [
  {
    id: 'rb-4star',
    sample: true,
    label: 'Sample national 4-star running back',
    sport: 'football',
    position: 'RB',
    stars: 4,
    heightIn: 71,
    weightLb: 205,
    measurables: { '40 yd': 4.52, 'Pro agility': 4.2, Vertical: 34, Bench: 265, Squat: 455 },
    stats: { rushYds: 1650, rushTd: 21, recYds: 240 },
  },
  {
    id: 'qb-4star',
    sample: true,
    label: 'Sample national 4-star quarterback',
    sport: 'football',
    position: 'QB',
    stars: 4,
    heightIn: 75,
    weightLb: 210,
    measurables: { '40 yd': 4.78 },
    stats: { passYds: 2950, passTd: 31, rushYds: 380, rushTd: 6 },
  },
  {
    id: 'guard-4star',
    sample: true,
    label: 'Sample national 4-star girls guard',
    sport: 'girls-basketball',
    position: 'Guard',
    stars: 4,
    heightIn: 70,
    weightLb: 150,
    measurables: { Vertical: 24, 'Lane agility': 11.0 },
    stats: { ppg: 22.5, rpg: 5.5, apg: 4.8, spg: 2.4, fgPct: 47.0, threePct: 36.5 },
  },
  {
    id: 'sprinter-5star',
    sample: true,
    label: 'Sample national 5-star sprinter',
    sport: 'track-and-field',
    position: 'Sprints',
    stars: 5,
    heightIn: 72,
    weightLb: 170,
    measurables: { '40 yd': 4.38, Vertical: 38 },
    stats: { m100: 10.45, m200: 21.1, m400: 47.9, longJump: 23.5 },
  },
  {
    id: 'wrestler-top',
    sample: true,
    label: 'Sample nationally ranked 160-pound wrestler',
    sport: 'wrestling',
    position: '160 lb',
    heightIn: 70,
    weightLb: 160,
    measurables: { Bench: 240, Squat: 400, 'Pull-ups': 25 },
    stats: { wins: 42, losses: 3, pins: 26, takedowns: 128 },
  },
];

export const benchmarkById = (id: string) => benchmarks.find((b) => b.id === id);
export const benchmarksFor = (sport: string) => benchmarks.filter((b) => b.sport === sport);
