// Spotlights and the Underdog of the Week. All SAMPLE: written about the
// invented athletes to show the format. Real spotlights are written by a
// verified coach or reporter and say who wrote them.

export type Spotlight = {
  id: string;
  sample: boolean;
  kind: 'player' | 'game';
  athlete: string;
  game?: string;
  title: string;
  dek: string;
  body: string[];
  date: string;
  author: { name: string; role: 'coach' | 'reporter' };
  reel?: string;
};

export const spotlights: Spotlight[] = [
  {
    id: 'pruitt-287',
    sample: true,
    kind: 'game',
    athlete: 'deshawn-pruitt',
    game: 'cedar-fork-vs-stonewell',
    title: '287 yards, four scores, 231 students',
    dek: 'DeShawn Pruitt went past 2,000 yards for the season in the third quarter.',
    body: [
      'Pruitt carried 31 times for 287 yards and four touchdowns in a 48-27 win over Stonewell. His 64-yard run on the first drive came on a third-and-2 inside zone.',
      'He finished the night at 2,311 yards for the season. Cedar Fork has 231 students in four grades.',
    ],
    date: '2026-10-10',
    author: { name: 'Sample reporter', role: 'reporter' },
    reel: 'r2',
  },
  {
    id: 'lindqvist-44',
    sample: true,
    kind: 'player',
    athlete: 'mara-lindqvist',
    title: 'The 1A guard with a 40.6 from three',
    dek: 'Mara Lindqvist scored 26.4 a game and shot 40.6% from three on 6.1 attempts.',
    body: [
      'Lindqvist plays for a school of 142. She led her conference in points, steals and assists as a junior, and posted 44 in a January win.',
      'Her coach tracks every shot by hand. Those charts are attached to her verified stat line.',
    ],
    date: '2026-03-14',
    author: { name: 'Sample head coach', role: 'coach' },
    reel: 'r11',
  },
  {
    id: 'harnisch-44-2',
    sample: true,
    kind: 'player',
    athlete: 'colt-harnisch',
    title: '44-2, and both losses to 6A kids by three points total',
    dek: 'Colt Harnisch won a state title as a sophomore at 165 pounds.',
    body: [
      'Harnisch pinned 31 opponents on the way to 44-2. His losses came at an open tournament against wrestlers from two of the largest schools in the region, 3-2 and 4-3.',
    ],
    date: '2026-03-01',
    author: { name: 'Sample reporter', role: 'reporter' },
    reel: 'r15',
  },
];

export type Nominee = { athlete: string; reason: string; votes: number; nominatedBy: string };

/** This week's ballot. Coaches and verified reporters nominate; anyone can vote once per week. */
export const underdog = {
  week: '2026-10-12',
  closes: '2026-10-18',
  sample: true,
  nominees: [
    { athlete: 'tucker-voss', reason: '312 yards passing and 3 touchdowns behind a line with two freshmen starters.', votes: 412, nominatedBy: 'Sample head coach' },
    { athlete: 'brynn-aldana', reason: 'Won the regional singles title as a sophomore. Trains two hours away on weekends.', votes: 388, nominatedBy: 'Sample reporter' },
    { athlete: 'jalen-okafor', reason: '10.52 in the 100 at a sectional with no school above 2A.', votes: 301, nominatedBy: 'Sample track coach' },
    { athlete: 'cade-rakers', reason: '211 carries, 2 fumbles, and starts both ways.', votes: 254, nominatedBy: 'Sample head coach' },
  ] satisfies Nominee[],
  /** Past winners, newest first. */
  past: [
    { week: '2026-10-05', athlete: 'deshawn-pruitt' },
    { week: '2026-09-28', athlete: 'colt-harnisch' },
  ],
};
