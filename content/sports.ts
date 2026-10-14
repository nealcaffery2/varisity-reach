import type { Season, Sport, StatKey } from '@/lib/types';

// Coaches as listed on hhs.hillsboroschools.net/athletics/coaches (October 2026).
// Schedule links are the 2026-27 PDFs on the HHS Schedules page.
const HHS = 'https://hhs.hillsboroschools.net/fs/resource-manager/view/';

const s = (key: string, label: string, long: string, extra: Partial<StatKey> = {}): StatKey => ({ key, label, long, ...extra });

const FOOTBALL: StatKey[] = [
  s('passYds', 'PASS YDS', 'Passing yards', { format: 'int' }),
  s('passTd', 'PASS TD', 'Passing touchdowns', { format: 'int' }),
  s('rushYds', 'RUSH YDS', 'Rushing yards', { format: 'int' }),
  s('rushTd', 'RUSH TD', 'Rushing touchdowns', { format: 'int' }),
  s('recYds', 'REC YDS', 'Receiving yards', { format: 'int' }),
  s('tackles', 'TKL', 'Total tackles', { format: 'int' }),
  s('sacks', 'SACKS', 'Sacks', { format: 'dec1' }),
  s('int', 'INT', 'Interceptions', { format: 'int' }),
];
const BASKETBALL: StatKey[] = [
  s('ppg', 'PPG', 'Points per game', { format: 'dec1' }),
  s('rpg', 'RPG', 'Rebounds per game', { format: 'dec1' }),
  s('apg', 'APG', 'Assists per game', { format: 'dec1' }),
  s('spg', 'SPG', 'Steals per game', { format: 'dec1' }),
  s('fgPct', 'FG%', 'Field goal percentage', { format: 'pct' }),
  s('threePct', '3P%', 'Three-point percentage', { format: 'pct' }),
];
const WRESTLING: StatKey[] = [
  s('wins', 'W', 'Wins', { format: 'int' }),
  s('losses', 'L', 'Losses', { format: 'int', lowerWins: true }),
  s('pins', 'PINS', 'Wins by fall', { format: 'int' }),
  s('takedowns', 'TD', 'Takedowns', { format: 'int' }),
];
const TRACK: StatKey[] = [
  s('m100', '100M', '100 meters (seconds)', { format: 'dec2', lowerWins: true }),
  s('m200', '200M', '200 meters (seconds)', { format: 'dec2', lowerWins: true }),
  s('m400', '400M', '400 meters (seconds)', { format: 'dec2', lowerWins: true }),
  s('m1600', '1600M', '1600 meters', { format: 'time', lowerWins: true }),
  s('longJump', 'LJ', 'Long jump (feet)', { format: 'feet' }),
  s('shotPut', 'SP', 'Shot put (feet)', { format: 'feet' }),
];
const TENNIS: StatKey[] = [
  s('singlesW', 'SGL W', 'Singles wins', { format: 'int' }),
  s('singlesL', 'SGL L', 'Singles losses', { format: 'int', lowerWins: true }),
  s('doublesW', 'DBL W', 'Doubles wins', { format: 'int' }),
  s('doublesL', 'DBL L', 'Doubles losses', { format: 'int', lowerWins: true }),
];
const VOLLEYBALL: StatKey[] = [
  s('kills', 'K', 'Kills', { format: 'int' }),
  s('digs', 'DIGS', 'Digs', { format: 'int' }),
  s('aces', 'ACES', 'Service aces', { format: 'int' }),
  s('blocks', 'BLK', 'Blocks', { format: 'int' }),
  s('hitPct', 'HIT%', 'Hitting percentage', { format: 'dec3' }),
];
const BAT: StatKey[] = [
  s('avg', 'AVG', 'Batting average', { format: 'dec3' }),
  s('hr', 'HR', 'Home runs', { format: 'int' }),
  s('rbi', 'RBI', 'Runs batted in', { format: 'int' }),
  s('sb', 'SB', 'Stolen bases', { format: 'int' }),
  s('era', 'ERA', 'Earned run average', { format: 'dec2', lowerWins: true }),
  s('so', 'K', 'Strikeouts (pitching)', { format: 'int' }),
];
const SOCCER: StatKey[] = [
  s('goals', 'G', 'Goals', { format: 'int' }),
  s('assists', 'A', 'Assists', { format: 'int' }),
  s('saves', 'SV', 'Saves', { format: 'int' }),
];
const GOLF: StatKey[] = [
  s('avg9', 'AVG 9', 'Scoring average, 9 holes', { format: 'dec1', lowerWins: true }),
  s('avg18', 'AVG 18', 'Scoring average, 18 holes', { format: 'dec1', lowerWins: true }),
  s('low18', 'LOW 18', 'Low 18-hole round', { format: 'int', lowerWins: true }),
];

export const sports: Sport[] = [
  { slug: 'football', name: 'Football', short: 'Football', season: 'Fall', gender: 'Boys', coaches: ['Joe Reed', 'Zach Reed', 'Bill Reed', 'Ryan Lipe', 'Roger Fath', 'Corbin Govaia', 'Aaron Shultz', 'Alex Holtschulte', 'Garrett Young', 'Jeremy Connor'], scheduleUrl: HHS + '88089aa9-1db4-42fa-b99e-330f9e8252e3', reel: '/media/reels/r1.mp4', blurb: 'Friday nights at the Hillsboro Sports Complex. Varsity, JV and freshman squads in the South Central Conference.', statKeys: FOOTBALL },
  { slug: 'volleyball', name: 'Volleyball', short: 'Volleyball', season: 'Fall', gender: 'Girls', coaches: ['Emily Zimmerman', 'Beth Cady', 'Reagan Devaisher', 'Makenzie Paden'], scheduleUrl: HHS + '9654cef1-fada-4307-860f-bf6db9d3ffe7', blurb: 'Home matches in the high school competition gym.', statKeys: VOLLEYBALL },
  { slug: 'girls-flag-football', name: 'Girls Flag Football', short: 'Flag Football', season: 'Fall', gender: 'Girls', coaches: ['Kurt Compton', 'Vanessa Compton'], scheduleUrl: HHS + 'a7e68b8d-0937-4990-af7e-b242ba6c3191', reel: '/media/reels/r3.mp4', blurb: 'One of the newest IHSA sports, and the Toppers field a full schedule.', statKeys: FOOTBALL.filter((k) => ['passYds', 'passTd', 'rushYds', 'recYds', 'int'].includes(k.key)) },
  { slug: 'boys-soccer', name: 'Boys Soccer', short: 'Boys Soccer', season: 'Fall', gender: 'Boys', coaches: ['Jason Burke', 'Matt Lentz', 'Mike Rodriguez'], scheduleUrl: HHS + '0ff0c526-7c89-4927-ad23-0cb104a5f560', reel: '/media/reels/r6.mp4', blurb: 'South Central Conference champions after a 9-0 run through league play.', statKeys: SOCCER },
  { slug: 'boys-golf', name: 'Boys Golf', short: 'Boys Golf', season: 'Fall', gender: 'Boys', coaches: ['Jim Luckett'], scheduleUrl: HHS + '6fedce61-ddb0-4695-9976-4851640f88c7', blurb: 'Back-to-back trips to the 1A state finals in Bloomington, including a 4th-place finish.', statKeys: GOLF },
  { slug: 'girls-golf', name: 'Girls Golf', short: 'Girls Golf', season: 'Fall', gender: 'Girls', coaches: ['Alex Frailey'], scheduleUrl: HHS + 'a10d1651-02c3-4174-bbed-90995d6522c0', blurb: 'Nine-hole duals in September, regionals in October.', statKeys: GOLF },
  { slug: 'girls-tennis', name: 'Girls Tennis', short: 'Girls Tennis', season: 'Fall', gender: 'Girls', coaches: ['Joe Mattson', 'Emma Dixon'], scheduleUrl: HHS + 'aac8d084-ff3c-4e3a-9eb5-6f7e4168e6e8', reel: '/media/reels/r16.mp4', blurb: 'Singles and doubles flights from August through the IHSA sectional.', statKeys: TENNIS },
  { slug: 'boys-basketball', name: 'Boys Basketball', short: 'Boys Hoops', season: 'Winter', gender: 'Boys', coaches: ['Corbin Govaia', 'Jake Wilkinson', 'Brent Stewart'], reel: '/media/reels/r10.mp4', blurb: 'Varsity, JV and freshman teams. Home games in the competition gym.', statKeys: BASKETBALL },
  { slug: 'girls-basketball', name: 'Girls Basketball', short: 'Girls Hoops', season: 'Winter', gender: 'Girls', coaches: ['Bret Tuetken', 'Cooper Eaker', 'Lauryn Tuetken'], reel: '/media/reels/r11.mp4', blurb: 'Sammi Matoush made the IBCA all-state first team.', statKeys: BASKETBALL },
  { slug: 'wrestling', name: 'Wrestling', short: 'Wrestling', season: 'Winter', gender: 'Co-ed', coaches: ['Garrett Young', 'Danny Rogers', 'Aaron Shultz', 'Mike Wells'], reel: '/media/reels/r14.mp4', blurb: 'Fourteen weight classes, duals and tournaments from November to the IHSA state series.', statKeys: WRESTLING },
  { slug: 'track-and-field', name: 'Track & Field', short: 'Track', season: 'Spring', gender: 'Co-ed', coaches: ['Zach Reed', 'Joe Reed', 'Katie Homa'], reel: '/media/reels/r12.mp4', blurb: 'Sprints, distance, jumps and throws. Boys and girls teams share the spring.', statKeys: TRACK },
  { slug: 'baseball', name: 'Baseball', short: 'Baseball', season: 'Spring', gender: 'Boys', coaches: ['James Hertel', 'Matt Burke', 'Chris Wygal'], blurb: 'Several Topper baseball teams sit in the HHS Hall of Fame.', statKeys: BAT },
  { slug: 'softball', name: 'Softball', short: 'Softball', season: 'Spring', gender: 'Girls', coaches: ['Heather Lessman', 'Amber Connor', 'Lauryn Tuetken', 'Carly Boden'], blurb: 'Varsity and JV softball, March through the IHSA regional.', statKeys: BAT },
  { slug: 'boys-tennis', name: 'Boys Tennis', short: 'Boys Tennis', season: 'Spring', gender: 'Boys', coaches: ['Joe Mattson', 'Emma Dixon'], reel: '/media/reels/r17.mp4', blurb: 'Spring singles and doubles under the same staff as the girls program.', statKeys: TENNIS },
  { slug: 'girls-soccer', name: 'Girls Soccer', short: 'Girls Soccer', season: 'Spring', gender: 'Girls', coaches: ['Matt Lentz'], blurb: 'Spring soccer at the Sports Complex.', statKeys: SOCCER },
];

export const SEASONS: Season[] = ['Fall', 'Winter', 'Spring'];

/** Every sport the platform knows, for names and stat columns. Hillsboro's list doubles as the catalog. */
export const sportBySlug = (slug: string) => sports.find((x) => x.slug === slug);

// Sample schools run fewer programs. Their pages show the team with no staff
// until a coach claims it from the coach dashboard.
const SAMPLE_TEAMS: Record<string, string[]> = {
  'prairie-bend': ['football', 'volleyball', 'boys-basketball', 'girls-basketball', 'wrestling', 'track-and-field', 'baseball', 'softball'],
  'cedar-fork': ['football', 'volleyball', 'boys-basketball', 'girls-basketball', 'track-and-field', 'baseball', 'softball', 'boys-tennis', 'girls-tennis'],
  'kessler-valley': ['football', 'volleyball', 'boys-basketball', 'girls-basketball', 'wrestling', 'track-and-field', 'baseball', 'softball', 'boys-golf'],
  'elm-hollow': ['football', 'volleyball', 'boys-soccer', 'boys-basketball', 'girls-basketball', 'wrestling', 'track-and-field', 'baseball', 'softball'],
};

export function sportsFor(school: string): Sport[] {
  if (school === 'hillsboro') return sports;
  return (SAMPLE_TEAMS[school] ?? []).flatMap((slug) => {
    const s = sportBySlug(slug);
    return s ? [{ ...s, coaches: [], scheduleUrl: undefined, blurb: 'Sample team. The head coach claims it from the coach dashboard and uploads the roster.' }] : [];
  });
}

export const sportsBySeason = (season: Season, school = 'hillsboro') => sportsFor(school).filter((x) => x.season === season);
