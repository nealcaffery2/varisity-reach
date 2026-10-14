// Reference recruits for the side-by-side compare: real Class of 2025
// prospects, all now in college. Ratings, sizes and senior-season numbers
// are copied from the pages in `sources` (checked October 2026); a number
// no source states is left out rather than guessed. Stats are high school
// senior-season totals unless `note` says otherwise.

export type Source = { label: string; url: string };

export type Benchmark = {
  id: string;
  /** Kept for invented entries; every entry below is a real player. */
  sample: boolean;
  /** Dropdown and heading text: "Alvin Henderson". */
  label: string;
  /** "4-star RB" or "No. 2 nationally at 157". */
  level: string;
  school: string;
  college: string;
  sport: string;
  position: string;
  stars?: number;
  heightIn?: number;
  weightLb?: number;
  measurables: Record<string, number>;
  stats: Record<string, number>;
  sources: Source[];
  note?: string;
};

const COMPOSITE_RB: Source = { label: '247Sports Composite, 2025 RB', url: 'https://247sports.com/season/2025-football/compositerecruitrankings/?Position=RB' };
const COMPOSITE_QB: Source = { label: '247Sports Composite, 2025 QB', url: 'https://247sports.com/season/2025-football/compositerecruitrankings/?Position=QB' };
const FLO_2025: Source = { label: 'FloWrestling Class of 2025 Big Board', url: 'https://www.flowrestling.org/rankings/7727055-class-of-2025-high-school-big-board/50803-top-100-recruits-in-the-class-of-2025' };

export const benchmarks: Benchmark[] = [
  // ---- football: running backs ----
  {
    id: 'rb-5star-berry',
    sample: false,
    label: 'Harlem Berry',
    level: '5-star RB',
    school: 'St. Martin’s Episcopal, Metairie, La.',
    college: 'LSU',
    sport: 'football',
    position: 'RB',
    stars: 5,
    heightIn: 71,
    weightLb: 175,
    measurables: {},
    stats: { rushYds: 2178, rushTd: 41, recYds: 340 },
    sources: [COMPOSITE_RB, { label: 'St. Martin’s Episcopal', url: 'https://www.stmsaints.com/about/stm-news/harlem-berry-25-signs-with-lsu-on-national-early-signing-day' }],
  },
  {
    id: 'rb-4star',
    sample: false,
    label: 'Alvin Henderson',
    level: '4-star RB',
    school: 'Elba High School, Elba, Ala.',
    college: 'Auburn',
    sport: 'football',
    position: 'RB',
    stars: 4,
    heightIn: 69,
    weightLb: 200,
    measurables: {},
    stats: { rushYds: 3620, rushTd: 61, recYds: 56 },
    sources: [COMPOSITE_RB, { label: 'MaxPreps', url: 'https://www.maxpreps.com/al/elba/elba-tigers/athletes/alvin-henderson/football/stats/?careerid=477m815l1dvp9' }, { label: 'Gatorade Player of the Year', url: 'https://playeroftheyear.gatorade.com/winner/Alvin-Henderson/40564' }],
    note: 'His 3,620 rushing yards set the Alabama single-season record.',
  },
  {
    id: 'rb-3star-williams',
    sample: false,
    label: 'Kamran Williams',
    level: '3-star RB',
    school: 'Jefferson High School, Jefferson, Texas',
    college: 'UNLV',
    sport: 'football',
    position: 'RB',
    stars: 3,
    heightIn: 70,
    weightLb: 180,
    measurables: {},
    stats: { rushYds: 2368, rushTd: 28, recYds: 62 },
    sources: [COMPOSITE_RB, { label: 'MaxPreps', url: 'https://www.maxpreps.com/tx/jefferson/jefferson-bulldogs/athletes/kamran-williams/football/stats/?careerid=n9jgllh4b94td' }],
  },
  // ---- football: quarterbacks ----
  {
    id: 'qb-5star-underwood',
    sample: false,
    label: 'Bryce Underwood',
    level: '5-star QB',
    school: 'Belleville High School, Belleville, Mich.',
    college: 'Michigan',
    sport: 'football',
    position: 'QB',
    stars: 5,
    heightIn: 75.5,
    weightLb: 205,
    measurables: {},
    stats: { passYds: 2509, passTd: 32, rushTd: 6 },
    sources: [COMPOSITE_QB, { label: 'Michigan roster bio', url: 'https://mgoblue.com/sports/football/roster/underwood-bryce/26792' }],
    note: 'Michigan lists “over 600” rushing yards with no exact total, so rushing yards are left out.',
  },
  {
    id: 'qb-4star',
    sample: false,
    label: 'Adam Schobel',
    level: '4-star QB',
    school: 'Columbus High School, Columbus, Texas',
    college: 'TCU',
    sport: 'football',
    position: 'QB',
    stars: 4,
    heightIn: 76.5,
    weightLb: 190,
    measurables: {},
    stats: { passYds: 3734, passTd: 53, rushYds: 575, rushTd: 13 },
    sources: [COMPOSITE_QB, { label: 'Fort Worth Star-Telegram', url: 'https://www.star-telegram.com/sports/college/big-12/texas-christian-university/article297391004.html' }],
  },
  {
    id: 'qb-3star-mcdaniel',
    sample: false,
    label: 'Robert McDaniel',
    level: '3-star QB',
    school: 'Hughson High School, Hughson, Calif.',
    college: 'UCLA, now San José State',
    sport: 'football',
    position: 'QB',
    stars: 3,
    heightIn: 73,
    weightLb: 195,
    measurables: {},
    stats: { passYds: 2889, passTd: 34, rushYds: 141, rushTd: 0 },
    sources: [COMPOSITE_QB, { label: 'MaxPreps', url: 'https://www.maxpreps.com/ca/hughson/hughson-huskies/athletes/robert-mcdaniel/football/stats/?careerid=aojhi9a17ojn7' }],
  },
  // ---- track: sprints ----
  {
    id: 'sprinter-5star',
    sample: false,
    label: 'Maurice Gleaton Jr.',
    level: '5-star sprinter, No. 3 nationally',
    school: 'Langston Hughes High School, Atlanta, Ga.',
    college: 'Georgia',
    sport: 'track-and-field',
    position: 'Sprints',
    stars: 5,
    heightIn: 70,
    measurables: {},
    stats: { m100: 9.92, m200: 20.52, m400: 48.04 },
    sources: [{ label: 'scarecruiting 2025 rankings', url: 'https://www.scarecruiting.com/track-boys-recruit-rankings-2025' }, { label: 'Georgia roster bio', url: 'https://georgiadogs.com/sports/track-and-field/roster/maurice-gleaton-jr/10464' }, { label: 'Athletic.net', url: 'https://www.athletic.net/athlete/30078994/track-and-field' }],
    note: 'Bests through his senior season. The 9.92 came at the 2025 USA Championships and set the U.S. U20 record.',
  },
  {
    id: 'sprinter-briggman',
    sample: false,
    label: 'Niles Briggman',
    level: 'adidas Nationals 100m champion',
    school: 'Hayfield Secondary, Alexandria, Va.',
    college: 'South Carolina',
    sport: 'track-and-field',
    position: 'Sprints',
    measurables: {},
    stats: { m100: 10.47, m200: 20.72, m400: 48.56, longJump: 19.04 },
    sources: [{ label: 'FloTrack', url: 'https://www.flotrack.org/articles/13223499-three-of-the-top-uncommitted-high-school-recruits-still-up-for-grabs' }, { label: 'Athletic.net', url: 'https://www.athletic.net/athlete/24148830/track-and-field' }],
    note: 'High school bests.',
  },
  {
    id: 'sprinter-lamalfa',
    sample: false,
    label: 'Samuel LaMalfa',
    level: 'Connecticut State Open 400m champion',
    school: 'Portland High School, Portland, Conn.',
    college: 'Bryant',
    sport: 'track-and-field',
    position: 'Sprints / 400',
    measurables: {},
    stats: { m100: 11.26, m200: 21.14, m400: 46.83 },
    sources: [{ label: 'Athletic.net', url: 'https://www.athletic.net/athlete/31147661/track-and-field' }],
    note: 'High school bests, from a Class S (small school) program.',
  },
  // ---- wrestling ----
  {
    id: 'wrestler-top',
    sample: false,
    label: 'PJ Duke',
    level: 'No. 2 recruit nationally, 157',
    school: 'Minisink Valley High School, Slate Hill, N.Y.',
    college: 'Penn State',
    sport: 'wrestling',
    position: '157 lb',
    measurables: {},
    stats: { wins: 44, losses: 0 },
    sources: [FLO_2025, { label: 'Penn State roster bio', url: 'https://gopsusports.com/sports/wrestling/roster/player/pj-duke' }],
  },
  {
    id: 'wrestler-tucker',
    sample: false,
    label: 'Brogan Tucker',
    level: 'No. 27 recruit nationally, 157',
    school: 'Graham High School, St. Paris, Ohio',
    college: 'NC State',
    sport: 'wrestling',
    position: '157 lb',
    measurables: {},
    stats: { wins: 50, losses: 1 },
    sources: [FLO_2025, { label: 'DubStat', url: 'https://dubstat.com/wrestlers-of-the-year-2025/' }],
  },
  {
    id: 'wrestler-gallardo',
    sample: false,
    label: 'Gabriel Gallardo',
    level: 'Four-time Arizona D3 state champion',
    school: 'Sahuarita High School, Sahuarita, Ariz.',
    college: 'North Dakota State',
    sport: 'wrestling',
    position: '157 lb',
    measurables: {},
    stats: { wins: 61, losses: 3 },
    sources: [{ label: 'NDSU signing release', url: 'https://gobison.com/news/2025/8/25/ndsu-wrestling-announces-2025-signee-class' }],
    note: '156 career pins tied the Arizona record; senior-year pins are not published.',
  },
];

export const benchmarkById = (id: string) => benchmarks.find((b) => b.id === id);
export const benchmarksFor = (sport: string) => benchmarks.filter((b) => b.sport === sport);
