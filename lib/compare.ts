// Side-by-side numbers: a small-school athlete against a reference recruit or
// another athlete. Pure, tested in tools/compare.test.ts.

import type { Athlete, StatKey } from './types';
import { formatStat } from './format';
import { latest } from './stats';

export type CompareSide = {
  label: string;
  heightIn: number;
  weightLb: number;
  measurables: Record<string, number>;
  stats: Record<string, number>;
};

export type Row = {
  label: string;
  a?: number;
  b?: number;
  aText: string;
  bText: string;
  /** Which side has the better number, or null when better is not a thing (size) or a side is missing. */
  edge: 'a' | 'b' | 'even' | null;
};

/** Lower is better for times. Everything else measured here, higher is better. */
const LOWER_MEASURABLES = /40 yd|agility|shuttle|lane|dash|time/i;

/** "4.47" → 4.47, "36 in" → 36, "275 lb" → 275, "10 ft 6 in" → 126, "9 ft 8 in" → 116. */
export function measurableNumber(v: string): number | undefined {
  const ft = v.match(/(\d+)\s*ft\s*(\d+(?:\.\d+)?)?/i);
  if (ft) return Number(ft[1]) * 12 + Number(ft[2] ?? 0);
  const n = parseFloat(v.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

export function sideFromAthlete(a: Athlete): CompareSide {
  const stats: Record<string, number> = {};
  for (const s of a.seasons) for (const [k, v] of Object.entries(s.stats)) if (stats[k] === undefined) stats[k] = latest(a, k)?.value ?? v;
  const measurables: Record<string, number> = {};
  for (const m of a.measurables) {
    const n = measurableNumber(m.value);
    if (n !== undefined) measurables[m.label] = n;
  }
  return { label: `${a.first} ${a.last}`, heightIn: a.heightIn, weightLb: a.weightLb, measurables, stats };
}

const edge = (a: number | undefined, b: number | undefined, lowerWins: boolean): Row['edge'] => {
  if (a === undefined || b === undefined) return null;
  if (Math.abs(a - b) < 1e-9) return 'even';
  return (lowerWins ? a < b : a > b) ? 'a' : 'b';
};

const fmtMeasure = (label: string, n: number | undefined) =>
  n === undefined ? '–' : /jump|reach/i.test(label) && n > 60 ? `${Math.floor(n / 12)}' ${Math.round((n % 12) * 10) / 10}"` : String(Math.round(n * 100) / 100);

export function compareRows(a: CompareSide, b: CompareSide, statKeys: readonly StatKey[]): Row[] {
  const rows: Row[] = [
    { label: 'Height', a: a.heightIn, b: b.heightIn, aText: `${Math.floor(a.heightIn / 12)}'${a.heightIn % 12}"`, bText: `${Math.floor(b.heightIn / 12)}'${b.heightIn % 12}"`, edge: null },
    { label: 'Weight', a: a.weightLb, b: b.weightLb, aText: `${a.weightLb} lb`, bText: `${b.weightLb} lb`, edge: null },
  ];
  const labels = [...new Set([...Object.keys(a.measurables), ...Object.keys(b.measurables)])].filter((l) => a.measurables[l] !== undefined && b.measurables[l] !== undefined);
  for (const l of labels) {
    const x = a.measurables[l];
    const y = b.measurables[l];
    rows.push({ label: l, a: x, b: y, aText: fmtMeasure(l, x), bText: fmtMeasure(l, y), edge: edge(x, y, LOWER_MEASURABLES.test(l)) });
  }
  for (const k of statKeys) {
    const x = a.stats[k.key];
    const y = b.stats[k.key];
    if (x === undefined || y === undefined) continue;
    rows.push({ label: k.long, a: x, b: y, aText: formatStat(x, k), bText: formatStat(y, k), edge: edge(x, y, Boolean(k.lowerWins)) });
  }
  return rows;
}

export function tally(rows: readonly Row[]) {
  return {
    a: rows.filter((r) => r.edge === 'a').length,
    b: rows.filter((r) => r.edge === 'b').length,
    even: rows.filter((r) => r.edge === 'even').length,
  };
}
