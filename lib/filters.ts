import type { Athlete, School } from './types';

// The recruiting board's filters. Pure, so tools/filters.test.ts can run it,
// and round-trips through the URL so a coach can bookmark or send a search.

export type SortKey = 'name' | 'gpa' | 'height' | 'weight' | 'grad';

export type Filters = {
  q: string;
  sport: string; // '' = any
  grad: number[]; // empty = any
  minGpa: number; // 0 = any
  minHeight: number; // inches, 0 = any
  maxHeight: number; // inches, 0 = any
  minWeight: number; // lb, 0 = any
  maxWeight: number; // lb, 0 = any
  ncaa: boolean; // only NCAA-registered
  school: string; // '' = any
  state: string; // '' = any
  classes: string[]; // empty = any, e.g. ['1A', '2A']
  verified: boolean; // only coach- or reporter-verified stats
  sort: SortKey;
  dir: 'asc' | 'desc';
};

export const EMPTY: Filters = {
  q: '', sport: '', grad: [], minGpa: 0, minHeight: 0, maxHeight: 0, minWeight: 0, maxWeight: 0, ncaa: false, school: '', state: '', classes: [], verified: false, sort: 'gpa', dir: 'desc',
};

const num = (v: string | null) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : 0;
};
const SORTS: SortKey[] = ['name', 'gpa', 'height', 'weight', 'grad'];

export function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get('sort') as SortKey | null;
  return {
    q: (params.get('q') ?? '').slice(0, 60),
    sport: params.get('sport') ?? '',
    grad: (params.get('grad') ?? '').split(',').map(Number).filter((n) => n > 2000 && n < 2100),
    minGpa: Math.min(num(params.get('gpa')), 4),
    minHeight: num(params.get('hmin')),
    maxHeight: num(params.get('hmax')),
    minWeight: num(params.get('wmin')),
    maxWeight: num(params.get('wmax')),
    ncaa: params.get('ncaa') === '1',
    school: (params.get('school') ?? '').slice(0, 60),
    state: (params.get('state') ?? '').toUpperCase().slice(0, 2),
    classes: (params.get('class') ?? '').split(',').filter((c) => /^[1-6]A$/.test(c)),
    verified: params.get('verified') === '1',
    sort: sort && SORTS.includes(sort) ? sort : EMPTY.sort,
    dir: params.get('dir') === 'asc' ? 'asc' : params.get('dir') === 'desc' ? 'desc' : EMPTY.dir,
  };
}

/** Only the fields that differ from EMPTY, so links stay short. */
export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.sport) p.set('sport', f.sport);
  if (f.grad.length) p.set('grad', [...f.grad].sort().join(','));
  if (f.minGpa) p.set('gpa', String(f.minGpa));
  if (f.minHeight) p.set('hmin', String(f.minHeight));
  if (f.maxHeight) p.set('hmax', String(f.maxHeight));
  if (f.minWeight) p.set('wmin', String(f.minWeight));
  if (f.maxWeight) p.set('wmax', String(f.maxWeight));
  if (f.ncaa) p.set('ncaa', '1');
  if (f.school) p.set('school', f.school);
  if (f.state) p.set('state', f.state);
  if (f.classes.length) p.set('class', [...f.classes].sort().join(','));
  if (f.verified) p.set('verified', '1');
  if (f.sort !== EMPTY.sort) p.set('sort', f.sort);
  if (f.dir !== EMPTY.dir) p.set('dir', f.dir);
  return p.toString();
}

export function activeCount(f: Filters): number {
  return [f.q.trim(), f.sport, f.grad.length, f.minGpa, f.minHeight || f.maxHeight, f.minWeight || f.maxWeight, f.ncaa, f.school, f.state, f.classes.length, f.verified].filter(Boolean).length;
}

const sortValue = (a: Athlete, key: SortKey): number | string => {
  switch (key) {
    case 'name': return `${a.last} ${a.first}`.toLowerCase();
    case 'gpa': return a.gpa;
    case 'height': return a.heightIn;
    case 'weight': return a.weightLb;
    case 'grad': return a.gradYear;
  }
};

export function applyFilters(list: readonly Athlete[], f: Filters, schoolsBySlug: (slug: string) => School | undefined = () => undefined): Athlete[] {
  const q = f.q.trim().toLowerCase();
  const out = list.filter((a) => {
    if (q && !`${a.first} ${a.last} ${a.position} ${a.hometown} ${a.intendedMajor ?? ''}`.toLowerCase().includes(q)) return false;
    if (f.sport && !a.sports.includes(f.sport)) return false;
    if (f.grad.length && !f.grad.includes(a.gradYear)) return false;
    if (f.minGpa && a.gpa < f.minGpa) return false;
    if (f.minHeight && a.heightIn < f.minHeight) return false;
    if (f.maxHeight && a.heightIn > f.maxHeight) return false;
    if (f.minWeight && a.weightLb < f.minWeight) return false;
    if (f.maxWeight && a.weightLb > f.maxWeight) return false;
    if (f.ncaa && a.ncaaEligibility !== 'Registered') return false;
    if (f.school && a.school !== f.school) return false;
    if (f.verified && !a.verified) return false;
    if (f.state || f.classes.length) {
      const s = schoolsBySlug(a.school);
      if (f.state && s?.state !== f.state) return false;
      if (f.classes.length && (!s || !f.classes.includes(s.classification))) return false;
    }
    return true;
  });
  const sign = f.dir === 'asc' ? 1 : -1;
  return out.sort((a, b) => {
    const x = sortValue(a, f.sort);
    const y = sortValue(b, f.sort);
    if (x === y) return a.last.localeCompare(b.last);
    return (x < y ? -1 : 1) * sign;
  });
}
