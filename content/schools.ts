import type { School } from '@/lib/types';

// Hillsboro is real: facts from hillsboroschools.net, hhs.hillsboroschools.net
// /athletics and hiltopperathletics.org (October 2026). The other schools are
// invented (`sample: true`) to show how the network looks with several towns
// in it; they carry a visible tag and stay out of search.

export const schools: School[] = [
  {
    slug: 'hillsboro',
    name: 'Hillsboro High School',
    town: 'Hillsboro',
    state: 'IL',
    mascot: 'Hiltoppers',
    short: 'Toppers',
    classification: '3A',
    classNote: 'IHSA Class 3A football',
    conference: 'South Central Conference',
    sample: false,
    colors: { name: 'Black and orange', accent: '#ff7f00', accent2: '#ff9a33', accentInk: '#1a0d00', accentDeep: '#b45200' },
    logo: '/brand/Hillsboro.png',
    heroReel: 'r1',
    rallyCry: 'Go Toppers',
    address: { street: '522 East Tremont', city: 'Hillsboro', state: 'IL', zip: '62049' },
    phone: '217-532-2841',
    athleticDirector: 'Aaron Duff',
    recruitingEmail: 'aduff@hillsboroschools.net',
    links: {
      district: 'https://www.hillsboroschools.net',
      athletics: 'https://hhs.hillsboroschools.net/athletics',
      schedules: 'https://hiltopperathletics.org/',
      calendar: 'https://www.arbiterlive.com/School/Calendar/10115',
      coaches: 'https://hhs.hillsboroschools.net/athletics/coaches',
      facebook: 'https://www.facebook.com/TopperPride',
      instagram: 'https://www.instagram.com/hillsboroilschools/',
    },
  },
  {
    slug: 'prairie-bend',
    name: 'Prairie Bend High School',
    town: 'Prairie Bend',
    state: 'IA',
    mascot: 'Pioneers',
    short: 'Pioneers',
    classification: '1A',
    classNote: 'IHSAA Class A',
    conference: 'Sample conference',
    sample: true,
    colors: { name: 'Green and gold', accent: '#3fbf6b', accent2: '#5fd789', accentInk: '#04190b', accentDeep: '#1f7a40' },
    heroReel: 'r12',
    rallyCry: 'Go Pioneers',
    enrollment: 142,
    links: {},
  },
  {
    slug: 'cedar-fork',
    name: 'Cedar Fork High School',
    town: 'Cedar Fork',
    state: 'TX',
    mascot: 'Wildcats',
    short: 'Cats',
    classification: '2A',
    classNote: 'UIL Class 2A',
    conference: 'Sample district',
    sample: true,
    colors: { name: 'Maroon and white', accent: '#e8546a', accent2: '#f07386', accentInk: '#1f0509', accentDeep: '#a32a3d' },
    heroReel: 'r10',
    rallyCry: 'Go Cats',
    enrollment: 231,
    links: {},
  },
  {
    slug: 'kessler-valley',
    name: 'Kessler Valley High School',
    town: 'Kessler Valley',
    state: 'KS',
    mascot: 'Knights',
    short: 'Knights',
    classification: '3A',
    classNote: 'KSHSAA Class 3A',
    conference: 'Sample league',
    sample: true,
    colors: { name: 'Royal blue and silver', accent: '#5b95ff', accent2: '#7eaaff', accentInk: '#030d21', accentDeep: '#2858b8' },
    heroReel: 'r14',
    rallyCry: 'Go Knights',
    enrollment: 318,
    links: {},
  },
  {
    slug: 'elm-hollow',
    name: 'Elm Hollow High School',
    town: 'Elm Hollow',
    state: 'IN',
    mascot: 'Eagles',
    short: 'Eagles',
    classification: '2A',
    classNote: 'IHSAA Class 2A football',
    conference: 'Sample conference',
    sample: true,
    colors: { name: 'Navy and gold', accent: '#f2bf3a', accent2: '#f7d063', accentInk: '#1c1300', accentDeep: '#8a6400' },
    heroReel: 'r16',
    rallyCry: 'Go Eagles',
    enrollment: 276,
    links: {},
  },
];

export const schoolBySlug = (slug: string) => schools.find((s) => s.slug === slug);
export const mustSchool = (slug: string) => {
  const s = schoolBySlug(slug);
  if (!s) throw new Error(`Unknown school ${slug}`);
  return s;
};

/** CSS custom properties that re-skin a page in a school's colors. */
export const schoolTheme = (s: School): Record<string, string> => ({
  '--color-accent': s.colors.accent,
  '--color-accent-2': s.colors.accent2,
  '--color-accent-ink': s.colors.accentInk,
  '--color-accent-deep': s.colors.accentDeep,
});
