// Facts about the school and the program. Sourced from hillsboroschools.net,
// hhs.hillsboroschools.net/athletics and hiltopperathletics.org (October 2026).

export const site = {
  name: 'Hillsboro Hiltoppers',
  /** The school spells the mascot "Hiltopper" with one L. Change here if that ever changes. */
  mascot: 'Hiltoppers',
  short: 'Toppers',
  school: 'Hillsboro High School',
  district: 'Hillsboro Community Unit School District 3',
  city: 'Hillsboro, Illinois',
  conference: 'South Central Conference',
  rallyCry: 'Go Toppers',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hiltoppers.example.com',
  address: { street: '522 East Tremont', city: 'Hillsboro', state: 'IL', zip: '62049' },
  phone: '217-532-2841',
  athleticDirector: 'Aaron Duff',
  /** Where "Contact about this athlete" goes. Public address on the HHS athletics page. */
  recruitingEmail: 'aduff@hillsboroschools.net',
  links: {
    district: 'https://www.hillsboroschools.net',
    athletics: 'https://hhs.hillsboroschools.net/athletics',
    schedules: 'https://hiltopperathletics.org/',
    calendar: 'https://www.arbiterlive.com/School/Calendar/10115',
    coaches: 'https://hhs.hillsboroschools.net/athletics/coaches',
    ihsa: 'https://www.ihsa.org',
    facebook: 'https://www.facebook.com/TopperPride',
    instagram: 'https://www.instagram.com/hillsboroilschools/',
    sportsAssociation: 'https://www.hillsboroschools.net/community/hillsboro-sports-association',
  },
} as const;

export type Site = typeof site;
