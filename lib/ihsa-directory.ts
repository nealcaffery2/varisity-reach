// IHSA member schools. The live source is the JSON API behind IHSA's school
// directory (api.ihsa.org/v1/schools for all 828 schools with official hex
// colors; /v1/schools/{id} adds nicknames, enrollment and conferences).
// parseIhsaDirectory reads the older per-school HTML pages, which IHSA still
// serves for some schools. IHSA hides email addresses, and we leave them
// hidden: schools add contacts when they claim their page.
// Pure, so tools/school-data.test.ts runs it.

import { colorsToHex } from './school-colors';

export type DirectorySchool = {
  ihsaId: string;
  name: string;
  town: string;
  state: 'IL';
  zip?: string;
  street?: string;
  phone?: string;
  website?: string;
  enrollment?: number;
  conferences: string[];
  nicknames: string[];
  colors?: { text: string; hex: string[] };
  type?: string;
  county?: string;
  athleticDirector?: string;
  coaches: Record<string, string>; // "Boys Football" → "Joe Reed"
  updated?: string;
};

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&#160;/g, ' ')
    .replace(/\[email\s*protected\]/gi, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const field = (lines: string[], label: string) => {
  const l = lines.find((x) => x.startsWith(`${label}:`));
  return l ? l.slice(label.length + 1).trim() || undefined : undefined;
};

/** "Hiltoppers (boys), Hiltoppers (girls)" → ["Hiltoppers"]; "Lady Panthers (girls)" kept. */
export function nicknames(raw?: string): string[] {
  if (!raw) return [];
  const names = raw.split(',').map((s) => s.replace(/\((boys|girls)\)/i, '').trim()).filter(Boolean);
  return [...new Set(names)];
}

export function parseIhsaDirectory(html: string, ihsaId: string): DirectorySchool | null {
  const lines = text(html);
  const colorText = field(lines, 'Colors');
  if (!colorText && !field(lines, 'Enrollment')) return null;
  const nameIdx = lines.findIndex((l) => /(High School|H\.S\.|Academy|School)$/i.test(l) && !l.startsWith('IHSA'));
  const name = nameIdx >= 0 ? lines[nameIdx] : (lines.find((l) => l.startsWith('IHSA '))?.slice(5) ?? ihsaId);
  const street = nameIdx >= 0 ? lines[nameIdx + 1]?.replace(/\(\s*Google map.*$/i, '').trim() : undefined;
  const cityLine = lines.find((l) => /, IL\s+\d{5}/.test(l));
  const city = cityLine?.match(/^(.+?), IL\s+(\d{5})/);
  const site = field(lines, 'School Web Site');
  const ad = lines.find((l) => /^Boys Athletic Director :/.test(l)) ?? lines.find((l) => /^Athletic Director :/.test(l));
  const coaches: Record<string, string> = {};
  for (const l of lines) {
    const m = l.match(/^(.+?) Head Coach : (.+)$/);
    if (m) {
      const who = m[2].replace(/phone.*$/i, '').trim();
      if (who && who !== 'TBA') coaches[m[1].trim()] = who;
    }
  }
  const adName = ad?.split(':')[1]?.replace(/phone.*$/i, '').trim();
  const enrollment = Number(field(lines, 'Enrollment')?.replace(/[^\d.]/g, ''));
  return {
    ihsaId,
    name,
    town: city?.[1] ?? name.replace(/\s+(High School|H\.S\.)$/i, ''),
    state: 'IL',
    zip: city?.[2],
    street: street && !/, IL/.test(street) ? street : undefined,
    phone: field(lines, 'Phone'),
    website: site ? (site.startsWith('http') ? site : `https://${site}`) : undefined,
    enrollment: Number.isFinite(enrollment) && enrollment > 0 ? Math.round(enrollment) : undefined,
    conferences: (field(lines, 'Conference(s)') ?? '').split(/[,;]/).map((s) => s.trim()).filter(Boolean),
    nicknames: nicknames(field(lines, 'Nickname(s)')),
    colors: colorText ? { text: colorText, hex: colorsToHex(colorText) } : undefined,
    type: field(lines, 'School Type'),
    county: field(lines, 'County'),
    athleticDirector: adName && adName !== 'TBA' ? adName : undefined,
    coaches,
    updated: lines.find((l) => l.includes('Last updated'))?.replace(/^\*\s*/, '').replace(/^Last updated at\s*/i, ''),
  };
}

/** A row from api.ihsa.org/v1/schools (list) or /v1/schools/{id} (detail). */
export type IhsaApiSchool = {
  SchoolID: string;
  NameIHSA: string;
  nameFormal?: string;
  NameFormal?: string;
  city?: string;
  City?: string;
  Zip?: string;
  Address?: string;
  Color1?: string | null;
  Color2?: string | null;
  TextOnColor1?: string | null;
  HasColors?: boolean;
  Latitude?: number | string | null;
  Longitude?: number | string | null;
  enrollmentType?: string;
  NicknameBoys?: string | null;
  NicknameGirls?: string | null;
  Enrollment?: string | null;
  URL?: string | null;
  Conferences?: { ConferenceName: string }[];
};

export type IllinoisSchool = {
  ihsaId: string;
  ihsaName: string;
  name: string;
  town: string;
  zip?: string;
  street?: string;
  colors: string[];
  textOnColor?: string;
  geo?: [number, number];
  type?: string;
  nicknames?: string[];
  enrollment?: number;
  website?: string;
  conferences?: string[];
};

const hex = (c?: string | null) => (c && /^#[0-9a-f]{6}$/i.test(c) ? c.toLowerCase() : undefined);
const num = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : Number(v));

export function fromIhsaApi(r: IhsaApiSchool): IllinoisSchool {
  const lat = num(r.Latitude);
  const lng = num(r.Longitude);
  const site = r.URL?.trim();
  const enrollment = num(r.Enrollment);
  const nick = [r.NicknameBoys, r.NicknameGirls].filter((n): n is string => Boolean(n?.trim())).map((n) => n.trim());
  return {
    ihsaId: r.SchoolID,
    ihsaName: r.NameIHSA,
    name: r.nameFormal ?? r.NameFormal ?? r.NameIHSA,
    town: r.city ?? r.City ?? r.NameIHSA.replace(/\s*\(.*\)$/, ''),
    zip: r.Zip?.slice(0, 5) || undefined,
    street: r.Address || undefined,
    colors: [hex(r.Color1), hex(r.Color2)].filter((c): c is string => Boolean(c)),
    textOnColor: hex(r.TextOnColor1),
    // IHSA stores longitude as a positive number; Illinois is west of Greenwich.
    geo: lat && lng ? [lat, -Math.abs(lng)] : undefined,
    type: r.enrollmentType,
    nicknames: nick.length ? [...new Set(nick)] : undefined,
    enrollment: enrollment ? Math.round(enrollment) : undefined,
    website: site ? (site.startsWith('http') ? site : `https://${site}`) : undefined,
    conferences: r.Conferences?.map((c) => c.ConferenceName),
  };
}
