import type { Report, Role } from '@/lib/consensus';
import type { Stream } from '@/lib/streams';

// SAMPLE GAMES between the invented schools and invented opponents. No real
// team's score appears here. Real games come from the schedule a coach
// uploads; scores come from the stands through the report form.

export type Side = { school?: string; name: string; short: string; color: string };

export type Game = {
  id: string;
  sample: boolean;
  sport: string;
  level: 'Varsity' | 'JV';
  home: Side;
  away: Side;
  /** ISO time. Demo games set `liveDemo` and start relative to when the page opens. */
  kickoff: string;
  liveDemo?: { minutesIn: number; period: string; clock?: string };
  venue: string;
  status: 'scheduled' | 'live' | 'final';
  /** Seed reports, minutes after kickoff. */
  seed: { who: string; role: Role; trust: number; home: number; away: number; atMin: number; period?: string; photo?: boolean; photoVerified?: boolean; lock?: boolean; final?: boolean }[];
  streams: Stream[];
  /** Plays of note for the spotlight rail. */
  plays: { atMin: number; text: string; athlete?: string }[];
  spotlight?: string[]; // athlete slugs
};

const opp = (name: string, short: string, color: string): Side => ({ name: `${name} (sample)`, short, color });

export const games: Game[] = [
  {
    id: 'prairie-bend-vs-harlan-creek',
    sample: true,
    sport: 'football',
    level: 'Varsity',
    home: { school: 'prairie-bend', name: 'Prairie Bend Pioneers', short: 'PB', color: '#3fbf6b' },
    away: opp('Harlan Creek Hawks', 'HC', '#c9a227'),
    kickoff: '2026-10-16T19:00:00-05:00',
    liveDemo: { minutesIn: 84, period: 'Q3', clock: '6:41' },
    venue: 'Pioneer Field, Prairie Bend, IA',
    status: 'live',
    seed: [
      { who: 'mom-of-7', role: 'fan', trust: 0.71, home: 21, away: 14, atMin: 79, period: 'Q3', photo: true },
      { who: 'grandpa-voss', role: 'fan', trust: 0.64, home: 21, away: 14, atMin: 80, period: 'Q3' },
      { who: 'booster-pres', role: 'staff', trust: 0.82, home: 21, away: 14, atMin: 81, period: 'Q3', photo: true, photoVerified: true },
      { who: 'student-section', role: 'fan', trust: 0.45, home: 21, away: 14, atMin: 82, period: 'Q3' },
      { who: 'harlan-dad', role: 'fan', trust: 0.58, home: 21, away: 14, atMin: 83, period: 'Q3' },
      { who: 'troll-account', role: 'anonymous', trust: 0.1, home: 0, away: 42, atMin: 82, period: 'Q3' },
      { who: 'radio-guy', role: 'reporter', trust: 0.9, home: 14, away: 14, atMin: 60, period: 'Q2' },
    ],
    streams: [
      { platform: 'file', url: '/media/reels/r1.mp4', by: 'Prairie Bend booster club (sample)', verified: true },
      { platform: 'instagram', url: 'https://www.instagram.com/', by: 'PB student section (sample)' },
    ],
    plays: [
      { atMin: 12, text: 'Tucker Voss 38-yard touchdown pass', athlete: 'tucker-voss' },
      { atMin: 41, text: 'Harlan Creek 71-yard kick return touchdown' },
      { atMin: 77, text: 'Tucker Voss 9-yard keeper, Pioneers lead 21-14', athlete: 'tucker-voss' },
    ],
    spotlight: ['tucker-voss'],
  },
  {
    id: 'cedar-fork-vs-stonewell',
    sample: true,
    sport: 'football',
    level: 'Varsity',
    home: { school: 'cedar-fork', name: 'Cedar Fork Wildcats', short: 'CF', color: '#e8546a' },
    away: opp('Stonewell Mustangs', 'SW', '#8fa3b8'),
    kickoff: '2026-10-09T19:30:00-05:00',
    venue: 'Wildcat Stadium, Cedar Fork, TX',
    status: 'final',
    seed: [
      { who: 'cf-coach', role: 'coach', trust: 1, home: 48, away: 27, atMin: 170, period: 'Final', lock: true, final: true },
      { who: 'fan-1', role: 'fan', trust: 0.6, home: 48, away: 27, atMin: 168, period: 'Final' },
    ],
    streams: [],
    plays: [
      { atMin: 20, text: 'DeShawn Pruitt 64-yard touchdown run', athlete: 'deshawn-pruitt' },
      { atMin: 95, text: 'DeShawn Pruitt passes 2,000 rushing yards for the season', athlete: 'deshawn-pruitt' },
      { atMin: 140, text: 'Pruitt finishes with 287 yards and 4 touchdowns', athlete: 'deshawn-pruitt' },
    ],
    spotlight: ['deshawn-pruitt'],
  },
  {
    id: 'elm-hollow-vs-marlow',
    sample: true,
    sport: 'volleyball',
    level: 'Varsity',
    home: { school: 'elm-hollow', name: 'Elm Hollow Eagles', short: 'EH', color: '#f2bf3a' },
    away: opp('Marlow Rockets', 'MR', '#d0453d'),
    kickoff: '2026-10-20T18:00:00-05:00',
    venue: 'Elm Hollow main gym',
    status: 'scheduled',
    seed: [],
    streams: [],
    plays: [],
  },
  {
    id: 'kessler-valley-duals',
    sample: true,
    sport: 'wrestling',
    level: 'Varsity',
    home: { school: 'kessler-valley', name: 'Kessler Valley Knights', short: 'KV', color: '#5b95ff' },
    away: opp('Ridgefield Bulldogs', 'RB', '#b98a4a'),
    kickoff: '2026-12-03T18:30:00-06:00',
    venue: 'Kessler Valley gym',
    status: 'scheduled',
    seed: [],
    streams: [],
    plays: [],
  },
];

export const gameById = (id: string) => games.find((g) => g.id === id);
export const gamesFor = (school: string) => games.filter((g) => g.home.school === school || g.away.school === school);

/** Seed rows as consensus reports, anchored to a kickoff time. */
export const seedReports = (g: Game, kickoffMs: number): Report[] =>
  g.seed.map((s, i) => ({
    id: `${g.id}-${i}`,
    reporter: s.who,
    role: s.role,
    trust: s.trust,
    home: s.home,
    away: s.away,
    at: kickoffMs + s.atMin * 60_000,
    period: s.period,
    photo: s.photo,
    photoVerified: s.photoVerified,
    lock: s.lock,
    final: s.final,
  }));
