import type { Athlete } from '@/lib/types';

// SAMPLE PROFILES. Every athlete in this file is invented to show what a
// finished profile looks like. Each one has `sample: true`, which puts a
// "Sample profile" tag on the page and a noindex tag in its head.
//
// To add a real Topper: copy one entry, set `sample: false`, and fill it in
// from the athlete's transcript, the coach's stat book and a signed media
// release. Leave out anything the family has not approved for publishing.

export const athletes: Athlete[] = [
  {
    slug: 'cade-rakers', first: 'Cade', last: 'Rakers', sample: true,
    gradYear: 2027, sports: ['football', 'track-and-field'], position: 'RB / SS', jersey: 22,
    heightIn: 71, weightLb: 186, gpa: 3.62, act: 25, coreGpa: 3.55, intendedMajor: 'Exercise science', ncaaEligibility: 'Registered',
    measurables: [{ label: '40 yd', value: '4.58' }, { label: 'Pro agility', value: '4.21' }, { label: 'Vertical', value: '33.5 in' }, { label: 'Bench', value: '245 lb' }, { label: 'Squat', value: '405 lb' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { rushYds: 1384, rushTd: 17, recYds: 212, tackles: 48, int: 2 } },
      { year: '2024-25', level: 'Varsity', stats: { rushYds: 611, rushTd: 6, recYds: 94, tackles: 31, int: 1 } },
    ],
    records: [{ label: '100M', value: '11.12' }, { label: 'Long jump', value: '21-4.5' }],
    awards: ['All-SCC first team, running back (2025)', 'Team offensive MVP (2025)'],
    bio: 'Three-down back who also starts at safety. Carried 211 times as a junior and fumbled twice. Runs the 4x100 in the spring.',
    reels: ['r1'], coach: 'Joe Reed', hometown: 'Hillsboro, IL',
    socials: { x: 'caderakers22', hudl: 'https://www.hudl.com' },
  },
  {
    slug: 'avery-niehaus', first: 'Avery', last: 'Niehaus', sample: true,
    gradYear: 2027, sports: ['football', 'track-and-field'], position: 'OT / DT', jersey: 74,
    heightIn: 77, weightLb: 287, gpa: 3.41, act: 23, intendedMajor: 'Agribusiness', ncaaEligibility: 'Registered',
    measurables: [{ label: '40 yd', value: '5.22' }, { label: 'Wingspan', value: '81 in' }, { label: 'Bench', value: '315 lb' }, { label: 'Squat', value: '485 lb' }, { label: 'Power clean', value: '275 lb' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { tackles: 39, sacks: 6.5 } },
      { year: '2024-25', level: 'Varsity', stats: { tackles: 22, sacks: 2 } },
    ],
    records: [{ label: 'Shot put', value: '49-7' }, { label: 'Discus', value: '141-2' }],
    awards: ['All-SCC first team, offensive line (2025)'],
    bio: 'Two-year starter at left tackle. Coaches graded him at 91 percent on run blocks as a junior. Throws shot and discus in the spring.',
    reels: ['r2'], coach: 'Joe Reed', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'jace-wernsing', first: 'Jace', last: 'Wernsing', sample: true,
    gradYear: 2028, sports: ['boys-soccer', 'boys-basketball'], position: 'Forward', jersey: 9,
    heightIn: 70, weightLb: 158, gpa: 3.88, act: 28, intendedMajor: 'Mechanical engineering', ncaaEligibility: 'In progress',
    measurables: [{ label: '40 yd', value: '4.71' }, { label: 'Beep test', value: 'Level 12.4' }, { label: 'Vertical', value: '29 in' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { goals: 21, assists: 9 } },
      { year: '2024-25', level: 'JV', stats: { goals: 14, assists: 6 } },
    ],
    records: [],
    awards: ['All-SCC first team (2025)', 'Academic all-conference (2025)'],
    bio: 'Led the conference champions in goals as a sophomore. Left foot, plays off the shoulder of the last defender.',
    reels: ['r6'], coach: 'Jason Burke', hometown: 'Coffeen, IL',
  },
  {
    slug: 'reese-kirchner', first: 'Reese', last: 'Kirchner', sample: true,
    gradYear: 2027, sports: ['girls-tennis', 'girls-basketball'], position: 'No. 1 singles', jersey: 3,
    heightIn: 67, weightLb: 131, gpa: 3.97, act: 31, sat: 1390, intendedMajor: 'Nursing', ncaaEligibility: 'Registered',
    measurables: [{ label: 'UTR', value: '7.42' }, { label: 'Serve', value: '86 mph' }],
    seasons: [
      { year: '2026-27', level: 'Varsity', stats: { singlesW: 19, singlesL: 4, doublesW: 3, doublesL: 1 } },
      { year: '2025-26', level: 'Varsity', stats: { singlesW: 16, singlesL: 7, doublesW: 5, doublesL: 2 } },
    ],
    records: [{ label: 'Career singles', value: '35-11' }],
    awards: ['IHSA sectional qualifier, singles (2025)', 'SCC singles runner-up (2025)'],
    bio: 'Plays first singles. Big first serve, comfortable at the net. Point guard on the basketball team in the winter.',
    reels: ['r16'], coach: 'Joe Mattson', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'brennan-hough', first: 'Brennan', last: 'Hough', sample: true,
    gradYear: 2027, sports: ['boys-basketball', 'baseball'], position: 'Guard', jersey: 11,
    heightIn: 74, weightLb: 172, gpa: 3.29, act: 22, intendedMajor: 'Business', ncaaEligibility: 'Registered',
    measurables: [{ label: 'Wingspan', value: '77.5 in' }, { label: 'Vertical', value: '31 in' }, { label: 'Lane agility', value: '11.03' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { ppg: 17.8, rpg: 4.6, apg: 3.9, spg: 2.1, fgPct: 46.3, threePct: 38.1 } },
      { year: '2024-25', level: 'Varsity', stats: { ppg: 9.4, rpg: 3.1, apg: 2.2, spg: 1.4, fgPct: 42.0, threePct: 33.6 } },
    ],
    records: [{ label: 'Career points', value: '771' }],
    awards: ['All-SCC first team (2026)', 'Litchfield Thanksgiving Tournament all-tournament (2025)'],
    bio: 'Scoring guard who took 41 percent of his shots from three as a junior. Plays center field in the spring.',
    reels: ['r10'], coach: 'Corbin Govaia', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'kaylee-schaefer', first: 'Kaylee', last: 'Schaefer', sample: true,
    gradYear: 2028, sports: ['girls-basketball', 'volleyball'], position: 'Forward', jersey: 24,
    heightIn: 72, weightLb: 158, gpa: 3.74, act: 26, intendedMajor: 'Biology', ncaaEligibility: 'In progress',
    measurables: [{ label: 'Wingspan', value: '73 in' }, { label: 'Vertical', value: '22.5 in' }, { label: 'Approach jump', value: '9 ft 8 in' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { ppg: 12.6, rpg: 8.9, apg: 1.7, spg: 1.3, fgPct: 51.2, threePct: 27.0 } },
    ],
    records: [],
    awards: ['All-SCC honorable mention (2026)'],
    bio: 'Started every game as a sophomore. Averaged a near double-double and led the team in charges taken.',
    reels: ['r11'], coach: 'Bret Tuetken', hometown: 'Irving, IL',
  },
  {
    slug: 'maddox-kessinger', first: 'Maddox', last: 'Kessinger', sample: true,
    gradYear: 2027, sports: ['wrestling', 'football'], position: '157 lb', jersey: 157,
    heightIn: 69, weightLb: 157, gpa: 3.18, act: 21, intendedMajor: 'Criminal justice', ncaaEligibility: 'Registered',
    measurables: [{ label: 'Bench', value: '235 lb' }, { label: 'Squat', value: '375 lb' }, { label: 'Pull-ups', value: '24' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { wins: 38, losses: 7, pins: 21, takedowns: 112 } },
      { year: '2024-25', level: 'Varsity', stats: { wins: 27, losses: 13, pins: 11, takedowns: 74 } },
    ],
    records: [{ label: 'Career record', value: '65-20' }, { label: 'Fastest fall', value: '0:23' }],
    awards: ['IHSA sectional qualifier (2026)', 'SCC champion, 157 (2026)'],
    bio: 'Leg attacker who finished 21 matches by fall as a junior. Linebacker in the fall.',
    reels: ['r14'], coach: 'Garrett Young', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'grady-luebbert', first: 'Grady', last: 'Luebbert', sample: true,
    gradYear: 2028, sports: ['wrestling'], position: '190 lb', jersey: 190,
    heightIn: 72, weightLb: 189, gpa: 3.52, act: 24, intendedMajor: 'Undecided', ncaaEligibility: 'Not yet',
    measurables: [{ label: 'Bench', value: '255 lb' }, { label: 'Deadlift', value: '445 lb' }],
    seasons: [{ year: '2025-26', level: 'Varsity', stats: { wins: 29, losses: 11, pins: 14, takedowns: 61 } }],
    records: [{ label: 'Career record', value: '29-11' }],
    awards: ['SCC runner-up, 190 (2026)'],
    bio: 'Strong on top. Rode out 9 of his 11 third periods as a sophomore.',
    reels: ['r15'], coach: 'Garrett Young', hometown: 'Butler, IL',
  },
  {
    slug: 'tatum-bohlen', first: 'Tatum', last: 'Bohlen', sample: true,
    gradYear: 2027, sports: ['track-and-field', 'volleyball'], position: 'Hurdles / 400', jersey: 8,
    heightIn: 68, weightLb: 134, gpa: 3.91, act: 29, intendedMajor: 'Physical therapy', ncaaEligibility: 'Registered',
    measurables: [{ label: 'Vertical', value: '24 in' }, { label: 'Approach jump', value: '9 ft 11 in' }],
    seasons: [{ year: '2025-26', level: 'Varsity', stats: { m100: 12.71, m200: 26.04, m400: 58.93, longJump: 17.25 } }],
    records: [{ label: '300M hurdles', value: '46.38', note: 'Sectional, 2nd place' }, { label: '100M hurdles', value: '15.62' }, { label: '400M', value: '58.93' }],
    awards: ['IHSA state qualifier, 300 hurdles (2026)', 'SCC champion, 300 hurdles (2026)'],
    bio: 'State qualifier in the 300 hurdles as a junior. Outside hitter in the fall.',
    reels: ['r12'], coach: 'Katie Homa', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'owen-fesser', first: 'Owen', last: 'Fesser', sample: true,
    gradYear: 2027, sports: ['track-and-field', 'football'], position: 'Sprints', jersey: 4,
    heightIn: 70, weightLb: 165, gpa: 3.07, act: 20, intendedMajor: 'Sports management', ncaaEligibility: 'Registered',
    measurables: [{ label: '40 yd', value: '4.49' }, { label: 'Vertical', value: '35 in' }],
    seasons: [{ year: '2025-26', level: 'Varsity', stats: { m100: 10.94, m200: 22.31, m400: 50.87, longJump: 21.8 } }],
    records: [{ label: '100M', value: '10.94' }, { label: '200M', value: '22.31' }, { label: '4x100 relay', value: '43.12', note: 'Anchor' }],
    awards: ['IHSA state qualifier, 4x100 (2026)', 'SCC champion, 100M (2026)'],
    bio: 'Anchored the 4x100 to state. Slot receiver in the fall.',
    reels: ['r13'], coach: 'Zach Reed', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'brooklyn-haller', first: 'Brooklyn', last: 'Haller', sample: true,
    gradYear: 2028, sports: ['girls-flag-football', 'softball'], position: 'DB / WR', jersey: 7,
    heightIn: 65, weightLb: 127, gpa: 3.66, act: 25, intendedMajor: 'Education', ncaaEligibility: 'In progress',
    measurables: [{ label: '40 yd', value: '5.31' }, { label: 'Home to first', value: '2.93' }],
    seasons: [
      { year: '2026-27', level: 'Varsity', stats: { recYds: 288, int: 6, rushYds: 104 } },
    ],
    records: [{ label: 'Batting avg', value: '.384', note: '2026 softball' }],
    awards: ['Team defensive MVP, flag football (2026)'],
    bio: 'Six interceptions in the first flag football season, two of them returned for scores. Shortstop in the spring.',
    reels: ['r3'], coach: 'Kurt Compton', hometown: 'Hillsboro, IL',
  },
  {
    slug: 'ty-roesch', first: 'Ty', last: 'Roesch', sample: true,
    gradYear: 2027, sports: ['boys-tennis', 'boys-golf'], position: 'No. 1 doubles', jersey: 12,
    heightIn: 73, weightLb: 162, gpa: 4.0, act: 33, sat: 1480, intendedMajor: 'Computer science', ncaaEligibility: 'Registered',
    measurables: [{ label: 'UTR', value: '8.11' }, { label: 'Serve', value: '104 mph' }],
    seasons: [
      { year: '2025-26', level: 'Varsity', stats: { singlesW: 6, singlesL: 3, doublesW: 21, doublesL: 5 } },
      { year: '2024-25', level: 'Varsity', stats: { singlesW: 9, singlesL: 6, doublesW: 14, doublesL: 8 } },
    ],
    records: [{ label: 'Career doubles', value: '35-13' }],
    awards: ['IHSA sectional champion, doubles (2026)', 'Valedictorian candidate'],
    bio: 'Left-handed doubles player who won the sectional title as a junior. Plays on the golf team in the fall.',
    reels: ['r17'], coach: 'Joe Mattson', hometown: 'Hillsboro, IL',
  },
];

export const athleteBySlug = (slug: string) => athletes.find((a) => a.slug === slug);
export const fullName = (a: Pick<Athlete, 'first' | 'last'>) => `${a.first} ${a.last}`;
