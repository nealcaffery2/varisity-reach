// Every public high school in the country, from the NCES Common Core of Data,
// through the Urban Institute's Education Data API (free, no key):
// https://educationdata.urban.org/api/v1/schools/ccd/directory/{year}/?fips={state}
// NCES has names, addresses, grades, enrollment and websites but no colors or
// mascots; state association directories (IHSA in Illinois) fill those in.

export type CcdRow = {
  ncessch: string;
  school_name: string;
  street_location?: string;
  city_location?: string;
  state_location?: string;
  zip_location?: string;
  phone?: string;
  website?: string | null;
  lowest_grade_offered?: number;
  highest_grade_offered?: number;
  enrollment?: number | null;
  school_type?: number; // 1 regular, 2 special ed, 3 vocational, 4 alternative
  school_status?: number; // 1 open, 2 closed, 3 new, 4 added, 5 changed agency, 6 inactive, 7 future, 8 reopened
  charter?: number; // 1 yes
  latitude?: number;
  longitude?: number;
  county_name?: string;
};

export type NationalSchool = {
  ncesId: string;
  name: string;
  town: string;
  state: string;
  zip?: string;
  street?: string;
  phone?: string;
  website?: string;
  enrollment?: number;
  charter: boolean;
  geo?: [number, number];
  county?: string;
  slug: string;
};

export const FIPS: Record<string, number> = {
  AL: 1, AK: 2, AZ: 4, AR: 5, CA: 6, CO: 8, CT: 9, DE: 10, DC: 11, FL: 12, GA: 13, HI: 15, ID: 16, IL: 17, IN: 18, IA: 19, KS: 20, KY: 21, LA: 22, ME: 23, MD: 24,
  MA: 25, MI: 26, MN: 27, MS: 28, MO: 29, MT: 30, NE: 31, NV: 32, NH: 33, NJ: 34, NM: 35, NY: 36, NC: 37, ND: 38, OH: 39, OK: 40, OR: 41, PA: 42, RI: 44, SC: 45,
  SD: 46, TN: 47, TX: 48, UT: 49, VT: 50, VA: 51, WA: 53, WV: 54, WI: 55, WY: 56,
};

export const ccdUrl = (state: string, year = 2022) => `https://educationdata.urban.org/api/v1/schools/ccd/directory/${year}/?fips=${FIPS[state]}`;

const title = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bHs\b/g, 'HS').replace(/\bSr\b/g, 'Sr.');
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Open, regular high schools (offer grade 12, not special-ed-only). */
export function isHighSchool(r: CcdRow): boolean {
  return r.highest_grade_offered === 12 && (r.lowest_grade_offered ?? 0) >= 6 && (r.school_type ?? 1) !== 2 && ![2, 6, 7].includes(r.school_status ?? 1);
}

export function toNational(r: CcdRow): NationalSchool {
  const name = title(r.school_name.trim());
  const town = title((r.city_location ?? '').trim());
  const site = r.website?.trim();
  return {
    ncesId: r.ncessch,
    name,
    town,
    state: r.state_location ?? '',
    zip: r.zip_location?.slice(0, 5),
    street: r.street_location ? title(r.street_location) : undefined,
    phone: r.phone || undefined,
    website: site ? (/^https?:/i.test(site) ? site : `https://${site}`) : undefined,
    enrollment: r.enrollment && r.enrollment > 0 ? r.enrollment : undefined,
    charter: r.charter === 1,
    geo: r.latitude && r.longitude ? [r.latitude, r.longitude] : undefined,
    county: r.county_name ? title(r.county_name) : undefined,
    slug: `${slugify(name)}-${(r.state_location ?? '').toLowerCase()}`,
  };
}

/** Normalized key for matching an NCES school to a state association listing. */
export const matchKey = (name: string, town: string) =>
  `${slugify(town)}|${slugify(name.replace(/\b(high school|senior high|sr\.? high|jr\.?\/sr\.? high|community|unit|cusd|h\.?s\.?)\b/gi, ''))}`;
