// Grants, equipment programs and college money a small school can use.
// Each one checked on its official page in October 2026. Geography drives
// who gets alerted: 'national', a state code, or a list of counties.

export type Grant = {
  id: string;
  name: string;
  org: string;
  funds: string;
  who: string;
  area: { kind: 'national' } | { kind: 'state'; state: string } | { kind: 'counties'; state: string; counties: string[] };
  award?: string;
  cycle: string;
  /** ISO date of the next deadline or opening, when the funder states one. */
  next?: string;
  url: string;
  tags: ('equipment' | 'facility' | 'fees' | 'girls' | 'college' | 'general')[];
  /** Short check a school can run against itself. */
  fit?: string;
};

export const grants: Grant[] = [
  { id: 'good-sports', name: 'Equipment grant', org: 'Good Sports', funds: 'Brand-new equipment, apparel and footwear, up to 8 donations over two years.', who: 'Schools with more than half of students on free or reduced lunch, or youth nonprofits with fees of $299 or less.', area: { kind: 'national' }, award: 'Equipment; you pay shipping of 5% of its value', cycle: 'Rolling', url: 'https://www.goodsports.org/apply/', tags: ['equipment'], fit: 'Over 50% free or reduced lunch' },
  { id: 'sports-matter', name: 'Sports Matter grants', org: 'DICK’S Sporting Goods Foundation', funds: 'Grants for under-resourced youth sports programs.', who: 'Public or charter schools with at least 50% free or reduced lunch.', area: { kind: 'national' }, cycle: 'By invitation; join the Sports Matter community list to be invited', url: 'https://www.sportsmatter.org/s/grant-eligibility', tags: ['equipment', 'general'], fit: 'Public school, 50%+ free or reduced lunch' },
  { id: 'usa-football', name: 'Equipment grants', org: 'USA Football', funds: 'Football equipment.', who: 'Youth programs, middle schools and high school girls flag programs enrolled with USA Football. Not high school tackle.', area: { kind: 'national' }, cycle: 'Spring and fall; enroll by Sept 1 for fall', url: 'https://usafootball.com/grants', tags: ['equipment', 'girls'] },
  { id: 'nfl-player-match', name: 'Player Matching Grant', org: 'NFL Foundation', funds: 'Matches a current or former NFL player’s gift to a school or nonprofit.', who: 'A school or nonprofit an NFL player supports.', area: { kind: 'national' }, award: 'Up to $5,000', cycle: 'Check site', url: 'https://www.nflfoundation.org/applications/grant_programs', tags: ['general'] },
  { id: 'every-kid-sports', name: 'Every Kid Sports Pass', org: 'Every Kid Sports', funds: 'A family’s registration fee, including recreational school seasons of 4+ weeks.', who: 'Families with a child 4 to 18 on Medicaid, SNAP or WIC.', area: { kind: 'national' }, award: 'Up to $150 per child', cycle: 'Winter pass opens Oct 27, 2026', next: '2026-10-27', url: 'https://pass.everykidsports.org/', tags: ['fees'] },
  { id: 'ltpf', name: 'Equipment grant', org: 'Leveling the Playing Field', funds: 'Free new and used equipment, picked up at a warehouse (Columbus, OH or Detroit, MI).', who: 'Schools and groups serving low-income youth or people with disabilities.', area: { kind: 'national' }, cycle: 'Rolling', url: 'https://www.levelingtheplayingfield.org/apply-for-equipment/', tags: ['equipment'] },
  { id: 'pifbs', name: 'Equipment donations', org: 'Pitch In For Baseball & Softball', funds: 'New and gently used baseball and softball gear.', who: 'Leagues, schools and organizations.', area: { kind: 'national' }, cycle: 'Check site', url: 'https://pifbs.org/', tags: ['equipment'] },
  { id: 'wsf-s4l', name: 'Sports 4 Life', org: 'Women’s Sports Foundation and ESPN', funds: 'Coaching, equipment, uniforms, travel and facility rental for girls 11 to 18.', who: 'Schools, park districts and nonprofits.', area: { kind: 'national' }, cycle: '2027 cycle not open yet; email the foundation to be told', url: 'https://www.womenssportsfoundation.org/wsf_programs/sports-4-life-community/', tags: ['girls', 'equipment'] },
  { id: 'nrpa-musco', name: 'Mini-pitch and lighting grant', org: 'NRPA with Musco Lighting', funds: 'In-kind field lighting or a mini-pitch.', who: 'Park and recreation agencies, so partner with your park district.', area: { kind: 'national' }, award: '$50,000 to $100,000 in kind', cycle: '2027 cycle; needs a Musco quote', url: 'https://www.nrpa.org/our-work/partnerships/initiatives/youth-sports/game-changing-grants-to-increase-access-to-sports/', tags: ['facility'] },
  { id: 'walmart-spark', name: 'Spark Good Local Grants', org: 'Walmart Foundation', funds: 'Local community grants through a nearby Walmart or Sam’s Club.', who: 'K-12 public or nonprofit private schools with an NCES number, and 501(c)(3)s.', area: { kind: 'national' }, award: '$250 to $5,000', cycle: 'Aug 1 to Nov 30, 2026 cycle open', next: '2026-11-30', url: 'https://www.walmart.org/how-we-give/program-guidelines/spark-good-local-grants-guidelines', tags: ['equipment', 'general'] },
  { id: 'isac-map', name: 'Monetary Award Program (MAP)', org: 'Illinois Student Assistance Commission', funds: 'Need-based college grant that does not have to be paid back.', who: 'Illinois students at approved Illinois colleges, through the FAFSA or the Illinois Alternative Application.', area: { kind: 'state', state: 'IL' }, cycle: 'Every year through the FAFSA or the Alternative Application', url: 'https://www.isac.org/students/during-college/types-of-financial-aid/grants/monetary-award-program/', tags: ['college'] },
  { id: 'isac-fafsa', name: 'Free FAFSA help and ISACorps', org: 'Illinois Student Assistance Commission', funds: 'Free FAFSA nights at your school and one-on-one help for families.', who: 'Any Illinois school or family. Illinois public school seniors must file or opt out to graduate.', area: { kind: 'state', state: 'IL' }, award: 'Free', cycle: 'Rolling', url: 'https://www.isac.org/home/fafsa/', tags: ['college'] },
  { id: 'ihsa-foundation', name: 'IHSA Foundation scholarship', org: 'Illinois High School Activities Foundation', funds: 'College scholarships, applied for with a video.', who: 'Seniors at IHSA schools who plan to teach or coach, or are licensed IHSA officials.', area: { kind: 'state', state: 'IL' }, award: '$1,000 each', cycle: 'Every year', url: 'https://www.ihsa.org/about/ihsaf/scholarships', tags: ['college'] },
  { id: 'cfll-grants', name: 'Community Grants Program', org: 'Community Foundation for the Land of Lincoln', funds: 'Grants for any charitable purpose.', who: 'Nonprofits; schools apply through a 501(c)(3) booster club or school foundation.', area: { kind: 'counties', state: 'IL', counties: ['Montgomery', 'Sangamon', 'Christian', 'Macoupin', 'Cass', 'Logan', 'Menard', 'Morgan'] }, cycle: 'Check site', url: 'https://cfll.org/Grants-Scholarships/Recent-Grants/Community-Grants-Program', tags: ['general', 'equipment'] },
  { id: 'cfll-scholarships', name: 'Local scholarships', org: 'Community Foundation for the Land of Lincoln', funds: 'Dozens of named local scholarships.', who: 'Students in the foundation’s eight counties.', area: { kind: 'counties', state: 'IL', counties: ['Montgomery', 'Sangamon', 'Christian', 'Macoupin', 'Cass', 'Logan', 'Menard', 'Morgan'] }, cycle: 'Jan 1 to Mar 1 every year', next: '2027-01-01', url: 'https://cfll.org/Grants-Scholarships/Scholarships', tags: ['college'] },
];
