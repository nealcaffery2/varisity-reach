// The numbers behind the mission. Every figure is quoted from its source,
// checked October 2026. Add a stat only with a page that states it.

export type Fact = { figure: string; claim: string; year: string; source: string; url: string };

export const reality: Fact[] = [
  {
    figure: '55%',
    claim: 'of rural high school graduates went to college the next fall in 2023, against 64% from suburban schools.',
    year: '2023',
    source: 'Harvard CEPR, National Center for Rural Education Research Networks, citing the National Student Clearinghouse',
    url: 'https://ncrern.provingground.cepr.harvard.edu/sites/g/files/omnuum3601/files/2025-03/College%20Pathways_12.17.24.pdf',
  },
  {
    figure: '$4.4B',
    claim: 'in Pell Grants went unclaimed by the class of 2024 because students did not file the FAFSA.',
    year: '2024',
    source: 'National College Attainment Network',
    url: 'https://www.ncan.org/Web/Web/News/698621.aspx',
  },
  {
    figure: '53.9%',
    claim: 'of the class of 2025 had filed the FAFSA by June 30. Seniors who file are 84% more likely to enroll in college right away.',
    year: '2025',
    source: 'National College Attainment Network',
    url: 'https://www.ncan.org/Web/Web/FAFSA/Why-FAFSA.aspx',
  },
  {
    figure: '21.1%',
    claim: 'of rural children lived in poverty, against 16.1% in metro areas.',
    year: '2019',
    source: 'USDA Economic Research Service',
    url: 'https://www.ers.usda.gov/topics/rural-economy-population/rural-poverty-well-being',
  },
  {
    figure: '20.2',
    claim: 'percentage points: the gap in regular sports play between kids from homes under $25,000 and homes over $100,000. It was 13.6 in 2012.',
    year: '2024',
    source: 'Aspen Institute Project Play, State of Play 2025',
    url: 'https://projectplay.org/state-of-play-2025/participation-trends',
  },
  {
    figure: '$1,016',
    claim: 'is what the average family spent on a child’s main sport in 2024, up 46% in five years.',
    year: '2024',
    source: 'Aspen Institute Project Play',
    url: 'https://projectplay.org/news/2025/2/24/project-play-survey-family-spending-on-youth-sports-rises-46-over-five-years',
  },
  {
    figure: '2%',
    claim: 'of high school athletes earn a college athletic scholarship, and most of those are partial.',
    year: '2026',
    source: 'NCAA',
    url: 'https://www.ncaa.org/student-athletes/scholarships-and-grants/',
  },
  {
    figure: '8.1%',
    claim: 'of high school football players go on to play in the NCAA. 3.4% reach Division I.',
    year: '2024-25',
    source: 'NCAA, probability of competing beyond high school',
    url: 'https://www.ncaa.org/student-athletes/probability-of-competing-beyond-high-school/',
  },
  {
    figure: '10 years',
    claim: 'old or older, a football helmet can no longer be recertified by certified reconditioners. It has to be replaced.',
    year: 'since 2012',
    source: 'National Athletic Equipment Reconditioners Association',
    url: 'https://www.naera.net/10-years-or-older-helmets',
  },
];
