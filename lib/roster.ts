// Roster import: turn whatever a coach has (a spreadsheet, a CSV, a table in
// a Word doc, or what Claude read off a photo or PDF) into athlete rows, then
// diff them against the current roster so the coach approves every change.
// Pure; tools/roster.test.ts covers the parsing.

import type { Athlete, StatKey } from './types';

export type ImportedAthlete = {
  first: string;
  last: string;
  jersey?: number;
  position?: string;
  gradYear?: number;
  heightIn?: number;
  weightLb?: number;
  gpa?: number;
  measurables: Record<string, string>;
  stats: Record<string, number>;
  /** Cells the parser could not read, for the coach to fix. */
  warnings: string[];
};

// ---- single values ------------------------------------------------------------------------

/** 6-2, 6'2", 6’ 2”, 6 ft 2 in, 6.2 (coach shorthand), 74 → inches. */
export function parseHeight(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return v >= 48 && v <= 90 ? Math.round(v) : v > 4 && v < 8 ? shorthand(v) : undefined;
  const s = String(v).trim().toLowerCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"');
  let m = s.match(/^(\d)\s*(?:'|ft|feet|-|\s)\s*(\d{1,2}(?:\.\d)?)\s*(?:"|in|inches)?$/);
  if (m) return inches(Number(m[1]), Number(m[2]));
  m = s.match(/^(\d)'$/);
  if (m) return inches(Number(m[1]), 0);
  m = s.match(/^(\d)\.(\d{1,2})$/);
  if (m) return inches(Number(m[1]), Number(m[2]));
  m = s.match(/^(\d{2})(?:\s*(?:in|"))?$/);
  if (m) {
    const n = Number(m[1]);
    return n >= 48 && n <= 90 ? n : undefined;
  }
  return undefined;
}
const inches = (ft: number, inch: number) => (ft >= 4 && ft <= 7 && inch < 12 ? Math.round(ft * 12 + inch) : undefined);
const shorthand = (n: number) => {
  const ft = Math.floor(n);
  return inches(ft, Math.round((n - ft) * (String(n).split('.')[1]?.length === 1 ? 10 : 100)));
};

export function parseWeight(v: unknown): number | undefined {
  const n = Number(String(v ?? '').replace(/lbs?|pounds|#/gi, '').trim());
  return Number.isFinite(n) && n >= 70 && n <= 400 ? Math.round(n) : undefined;
}

/** Grad year from 2027, '27, 12th, Sr, Senior. Grade letters count from the school year that ends in `seasonEnd`. */
export function parseGrad(v: unknown, seasonEnd: number): number | undefined {
  const s = String(v ?? '').trim().toLowerCase().replace(/\./g, '');
  if (!s) return undefined;
  let m = s.match(/^(20\d{2})$/);
  if (m) return Number(m[1]);
  m = s.match(/^'?(\d{2})$/);
  if (m && Number(m[1]) >= 20 && Number(m[1]) <= 40) return 2000 + Number(m[1]);
  const grade: Record<string, number> = { fr: 9, fresh: 9, freshman: 9, so: 10, soph: 10, sophomore: 10, jr: 11, junior: 11, sr: 12, senior: 12 };
  m = s.match(/^(9|10|11|12)(?:th)?$/);
  const g = m ? Number(m[1]) : grade[s];
  return g ? seasonEnd + (12 - g) : undefined;
}

const num = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/[,%s]/g, '').trim());
  return String(v ?? '').trim() !== '' && Number.isFinite(n) ? n : undefined;
};

/** "4:38.4" → 278.4 seconds; "52.31" → 52.31. */
export function parseTime(v: unknown): number | undefined {
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return num(s);
}

/** "Rakers, Cade" or "Cade Rakers" → first/last. */
export function splitName(v: string): { first: string; last: string } {
  const s = v.trim().replace(/\s+/g, ' ');
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    return { first: title(first ?? ''), last: title(last ?? '') };
  }
  const parts = s.split(' ');
  return { first: title(parts.slice(0, -1).join(' ') || parts[0]), last: title(parts.length > 1 ? parts[parts.length - 1] : '') };
}
const title = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])\S/g, (c) => c.toUpperCase()) : s);

// ---- headers ------------------------------------------------------------------------------

type Field = 'name' | 'first' | 'last' | 'jersey' | 'position' | 'grad' | 'height' | 'weight' | 'gpa' | { measurable: string } | { stat: string };

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

const BASE: [RegExp, Field][] = [
  [/^(name|player|athlete|playername|fullname)$/, 'name'],
  [/^(first|firstname|fname)$/, 'first'],
  [/^(last|lastname|lname|surname)$/, 'last'],
  [/^(no|num|number|jersey|jerseyno|uniform)$/, 'jersey'],
  [/^(pos|position|positions)$/, 'position'],
  [/^(yr|year|class|grade|gr|gradyear|graduation|classof)$/, 'grad'],
  [/^(ht|height)$/, 'height'],
  [/^(wt|weight|lbs)$/, 'weight'],
  [/^(gpa|unweightedgpa|gpaunweighted)$/, 'gpa'],
  [/^(40|40yd|40yard|forty|40time|40yddash)$/, { measurable: '40 yd' }],
  [/^(proagility|shuttle|5105|20ydshuttle)$/, { measurable: 'Pro agility' }],
  [/^(vert|vertical|verticaljump)$/, { measurable: 'Vertical' }],
  [/^(bench|benchpress|bp)$/, { measurable: 'Bench' }],
  [/^(squat|backsquat|sq)$/, { measurable: 'Squat' }],
  [/^(clean|powerclean|hangclean)$/, { measurable: 'Power clean' }],
  [/^(deadlift|dl)$/, { measurable: 'Deadlift' }],
  [/^(broad|broadjump)$/, { measurable: 'Broad jump' }],
  [/^(wingspan)$/, { measurable: 'Wingspan' }],
];

/** Map each header to a field. Stat headers match a sport stat's key, short label or long label. */
export function mapHeaders(headers: string[], statKeys: readonly StatKey[]): (Field | null)[] {
  return headers.map((h) => {
    if (/^\s*(#|no\.?)\s*$/i.test(h)) return 'jersey';
    const n = norm(h);
    if (!n) return null;
    for (const [re, f] of BASE) if (re.test(n)) return f;
    const stat = statKeys.find((k) => [k.key, k.label, k.long].some((x) => norm(x) === n) || norm(k.long).startsWith(n) && n.length >= 5);
    return stat ? { stat: stat.key } : null;
  });
}

const MEAS_UNIT: Record<string, string> = { Vertical: ' in', Bench: ' lb', Squat: ' lb', 'Power clean': ' lb', Deadlift: ' lb', Wingspan: ' in' };

export function rowsToAthletes(rows: unknown[][], statKeys: readonly StatKey[], seasonEnd: number): ImportedAthlete[] {
  // The header is the first row with a name-like column.
  const headerIdx = rows.findIndex((r) => mapHeaders(r.map(String), statKeys).some((f) => f === 'name' || f === 'last' || f === 'first'));
  if (headerIdx < 0) return [];
  const fields = mapHeaders(rows[headerIdx].map(String), statKeys);
  const timeKeys = new Set(statKeys.filter((k) => k.format === 'time').map((k) => k.key));
  const out: ImportedAthlete[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    if (!row.some((c) => String(c ?? '').trim())) continue;
    const a: ImportedAthlete = { first: '', last: '', measurables: {}, stats: {}, warnings: [] };
    fields.forEach((f, i) => {
      const cell = row[i];
      const raw = String(cell ?? '').trim();
      if (!f || raw === '' || raw === '-' || raw === '–') return;
      if (f === 'name') Object.assign(a, splitName(raw));
      else if (f === 'first') a.first = title(raw);
      else if (f === 'last') a.last = title(raw);
      else if (f === 'jersey') a.jersey = num(raw.replace('#', ''));
      else if (f === 'position') a.position = raw.toUpperCase().length <= 6 ? raw.toUpperCase() : raw;
      else if (f === 'grad') (a.gradYear = parseGrad(raw, seasonEnd)) ?? a.warnings.push(`Class "${raw}"`);
      else if (f === 'height') (a.heightIn = parseHeight(cell)) ?? a.warnings.push(`Height "${raw}"`);
      else if (f === 'weight') (a.weightLb = parseWeight(raw)) ?? a.warnings.push(`Weight "${raw}"`);
      else if (f === 'gpa') {
        const g = num(raw);
        if (g !== undefined && g >= 0 && g <= 5) a.gpa = g;
        else a.warnings.push(`GPA "${raw}"`);
      } else if ('measurable' in f) a.measurables[f.measurable] = /^\d+(\.\d+)?$/.test(raw) ? `${raw}${MEAS_UNIT[f.measurable] ?? ''}` : raw;
      else if ('stat' in f) {
        const v = timeKeys.has(f.stat) ? parseTime(raw) : num(raw);
        if (v === undefined) a.warnings.push(`${f.stat} "${raw}"`);
        else a.stats[f.stat] = v;
      }
    });
    if (!a.first && !a.last) continue;
    out.push(a);
  }
  return out;
}

/** CSV with quoted fields, commas or tabs. */
export function parseCsv(text: string): string[][] {
  const delim = (text.split('\n')[0].match(/\t/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"' && cell === '') q = true; // a quote mid-cell (6'2") is just a character
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ---- diff against the current roster --------------------------------------------------------

export type Change = { field: string; from?: string; to: string };
export type DiffRow = { incoming: ImportedAthlete; match?: Athlete; status: 'new' | 'update' | 'same'; changes: Change[] };

const key = (first: string, last: string) => `${first} ${last}`.toLowerCase().replace(/[^a-z]/g, '');

export function diffRoster(current: readonly Athlete[], incoming: readonly ImportedAthlete[]): DiffRow[] {
  return incoming.map((inc) => {
    const match =
      current.find((a) => key(a.first, a.last) === key(inc.first, inc.last)) ??
      (inc.jersey !== undefined ? current.find((a) => a.last.toLowerCase() === inc.last.toLowerCase() && a.jersey === inc.jersey) : undefined);
    const changes: Change[] = [];
    const cmp = (field: string, from: unknown, to: unknown) => {
      if (to === undefined || to === '') return;
      if (String(from ?? '') !== String(to)) changes.push({ field, from: from === undefined ? undefined : String(from), to: String(to) });
    };
    cmp('Jersey', match?.jersey, inc.jersey);
    cmp('Position', match?.position, inc.position);
    cmp('Class', match?.gradYear, inc.gradYear);
    cmp('Height (in)', match?.heightIn, inc.heightIn);
    cmp('Weight (lb)', match?.weightLb, inc.weightLb);
    cmp('GPA', match?.gpa, inc.gpa);
    for (const [k, v] of Object.entries(inc.measurables)) cmp(k, match?.measurables.find((m) => m.label === k)?.value, v);
    const latest = match?.seasons[0]?.stats ?? {};
    for (const [k, v] of Object.entries(inc.stats)) cmp(k, latest[k], v);
    return { incoming: inc, match, status: !match ? 'new' : changes.length ? 'update' : 'same', changes };
  });
}
