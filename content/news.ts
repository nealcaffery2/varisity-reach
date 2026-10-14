import type { EventItem, NewsItem } from '@/lib/types';

// Written from posts on hiltopperathletics.org and hillsboroschools.net
// (pulled October 2026). Each item links to where it came from. Archive posts
// on the athletics site carry no date, so those items leave `date` out.

const ATH = { label: 'hiltopperathletics.org', url: 'https://hiltopperathletics.org/' };
const DIST = { label: 'hillsboroschools.net', url: 'https://www.hillsboroschools.net/fs/pages/5183' };

export const news: NewsItem[] = [
  {
    school: 'hillsboro',
    slug: 'gym-scoreboard-shot-clocks',
    title: 'Competition gym gets a digital scoreboard and shot clocks',
    date: '2026-07-16',
    sport: 'boys-basketball',
    summary: 'Grant money already awarded to the district pays for a new board in the high school gym, with the shot clocks IHSA now requires.',
    body: [
      'The Board of Education approved a digital scoreboard for the high school competition gym. It is paid for with grant money the district was already awarded.',
      'The package includes shot clocks, which IHSA now requires for varsity basketball. Volleyball and wrestling use the same gym.',
    ],
    source: DIST,
    image: '/media/reels/r10.jpg',
  },
  {
    school: 'hillsboro',
    slug: 'sports-complex-agreement',
    title: 'Five more years at the Hillsboro Sports Complex',
    date: '2026-07-16',
    sport: 'football',
    summary: 'The district and the City of Hillsboro signed a new five-year agreement for school teams to keep using the complex.',
    body: [
      'District teams practice and play at the Hillsboro Sports Complex. The new agreement with the City of Hillsboro keeps them there for five more years.',
      'The same board meeting raised pay for game officials to match nearby schools, and asked the personnel committee to review coaching staff for high school wrestling and track based on participation and the number of contests.',
    ],
    source: DIST,
    image: '/media/reels/r2.jpg',
  },
  {
    school: 'hillsboro',
    slug: 'honors-gpa-latin-honors',
    title: 'Honors now starts at a 3.5 GPA, and Latin honors are coming',
    date: '2025-12-11',
    summary: 'The board raised the honors GPA to 3.5 this year and moved the high school to Latin honors. The Class of 2029 is the first to graduate under it.',
    body: [
      'Recognition as an honors student now takes a 3.5 GPA or higher. The high school also moves to a 10-point grading scale next school year to match surrounding districts.',
      'Latin honors (cum laude, magna cum laude, summa cum laude) phase in over three years. The Class of 2029 is the first class to graduate under the new system.',
      'For athletes talking to colleges: the GPA on every Topper recruiting profile is the unweighted 4.0-scale number from the transcript.',
    ],
    source: { label: 'December 11, 2025 board meeting', url: DIST.url },
  },
  {
    school: 'hillsboro',
    slug: 'toppers-3a-playoffs',
    title: 'Toppers head south for the 3A playoffs',
    sport: 'football',
    summary: 'Winners of six of their last seven, the Hiltoppers opened the IHSA 3A playoffs at Anna-Jonesboro.',
    body: [
      'Hillsboro won six of its last seven regular-season games to earn a spot in the IHSA Class 3A bracket.',
      'The first-round game was a Saturday trip to Anna-Jonesboro.',
    ],
    source: ATH,
    image: '/media/reels/r1.jpg',
  },
  {
    school: 'hillsboro',
    slug: 'boys-soccer-scc-title',
    title: 'Boys soccer goes 9-0 to win the SCC',
    sport: 'boys-soccer',
    summary: 'A 4-0 win at Litchfield finished a sweep of every South Central Conference opponent.',
    body: [
      'The Hiltoppers beat all nine South Central Conference opponents. The last one was a 4-0 win at Litchfield, which clinched the conference title.',
    ],
    source: ATH,
    image: '/media/reels/r6.jpg',
  },
  {
    school: 'hillsboro',
    slug: 'boys-golf-returns-to-state',
    title: 'Boys golf returns to state',
    sport: 'boys-golf',
    summary: 'After a 4th-place finish in 1A the year before, the team went back to the state finals at Prairie Vista in Bloomington.',
    body: [
      'Hillsboro qualified for the IHSA Class 1A state tournament at Prairie Vista Golf Course in Bloomington for a second straight year.',
      'The year before, the Toppers finished 4th in the state.',
    ],
    source: ATH,
  },
  {
    school: 'hillsboro',
    slug: 'boys-golf-regional-title',
    title: 'Boys golf wins the Windsor regional',
    sport: 'boys-golf',
    summary: 'The Toppers took the team title at Fox Prairie, and sophomore Alex Eickhoff was regional medalist.',
    body: [
      'Hillsboro won the regional team title at Fox Prairie Golf Course in Windsor.',
      'Sophomore Alex Eickhoff shot the low round of the day to take medalist honors.',
    ],
    source: ATH,
  },
  {
    school: 'hillsboro',
    slug: 'matoush-ibca-all-state',
    title: 'Matoush named IBCA first-team all-state',
    sport: 'girls-basketball',
    summary: 'The Illinois Basketball Coaches Association put Sammi Matoush on its first team.',
    body: ['Sammi Matoush was named to the Illinois Basketball Coaches Association all-state first team.'],
    source: ATH,
    image: '/media/reels/r11.jpg',
  },
  {
    school: 'hillsboro',
    slug: 'new-athletics-website',
    title: 'Schedules moved to a new athletics site',
    summary: 'Every team schedule, the calendar and photo galleries now live on hiltopperathletics.org, run by Athletic Director Aaron Duff.',
    body: [
      'Pick a sport under Sports & Activities on hiltopperathletics.org for its full schedule. Questions about schedules go to Athletic Director Aaron Duff.',
      'This site pulls those schedules into each team page and links back for changes made on game day.',
    ],
    source: ATH,
  },
  // ---- Sample stories for the invented schools. ----
  {
    school: 'prairie-bend',
    slug: 'weight-room-drive',
    title: 'Weight room drive passes a quarter of its goal',
    date: '2026-10-10',
    summary: 'Every head coach at Prairie Bend signed on to the drive for two more squat racks.',
    body: ['Fifty-eight athletes share one squat rack. The athletic director posted the drive with a vendor quote, and the school board matches 50 cents on the dollar up to $1,500.', 'Sample story, written to show a school news page.'],
    source: { label: 'Sample story', url: '/fundraise/prairie-bend-weight-room/' },
    image: '/media/reels/r12.jpg',
  },
  {
    school: 'cedar-fork',
    slug: 'pruitt-2000',
    title: 'Pruitt passes 2,000 yards in a 48-27 win',
    date: '2026-10-10',
    sport: 'football',
    summary: 'DeShawn Pruitt ran for 287 yards and four touchdowns against Stonewell.',
    body: ['Pruitt crossed 2,000 rushing yards in the third quarter and finished the night at 2,311 for the season.', 'Sample story, written to show a school news page.'],
    source: { label: 'Sample story', url: '/spotlight/' },
    image: '/media/reels/r2.jpg',
  },
  {
    school: 'kessler-valley',
    slug: 'harnisch-state',
    title: 'Harnisch wins the 165-pound state title',
    date: '2026-02-28',
    sport: 'wrestling',
    summary: 'The sophomore finished 44-2 with 31 pins.',
    body: ['Colt Harnisch won the 3A title at 165 pounds. Both of his losses came at an open tournament against wrestlers from 6A programs.', 'Sample story, written to show a school news page.'],
    source: { label: 'Sample story', url: '/spotlight/' },
    image: '/media/reels/r15.jpg',
  },
  {
    school: 'elm-hollow',
    slug: 'okafor-sectional',
    title: 'Okafor runs 10.52 at sectionals',
    date: '2026-05-15',
    sport: 'track-and-field',
    summary: 'Jalen Okafor won the 100 and the 200 and qualified for the state final.',
    body: ['Okafor ran a wind-legal 10.52 in the 100 and 21.33 in the 200.', 'Sample story, written to show a school news page.'],
    source: { label: 'Sample story', url: '/spotlight/' },
    image: '/media/reels/r13.jpg',
  },
];

/** District calendar dates that move practice and game times. */
export const events: EventItem[] = [
  { school: 'hillsboro', date: '2026-10-16', title: 'End of 1st quarter', kind: 'school' },
  { school: 'hillsboro', date: '2026-10-30', title: 'Early dismissal', detail: 'School improvement planning. HHS lets out at 11:35 a.m.', kind: 'school' },
  { school: 'hillsboro', date: '2026-11-11', title: 'No school', detail: "Veterans Day", kind: 'school' },
  { school: 'hillsboro', date: '2026-11-25', end: '2026-11-29', title: 'Thanksgiving break', detail: 'No school', kind: 'school' },
];

export const newsBySlug = (slug: string) => news.find((n) => n.slug === slug);

/** Results crawl under each school's hero. Hillsboro's come from its own posts. */
export const tickers: Record<string, string[]> = {
  hillsboro: [
    'Boys soccer 9-0 in the SCC',
    'Boys soccer 4, Litchfield 0',
    'Football into the 3A playoffs',
    'Boys golf back to state',
    'Matoush IBCA all-state first team',
    'Eickhoff regional medalist',
  ],
};
