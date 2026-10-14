import type { StatKey } from './types';

export const feetInches = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`;

/** 17.25 → 17-3 (track field-event notation, feet-inches). */
const feetMarks = (feet: number) => {
  const whole = Math.floor(feet);
  const inches = Math.round((feet - whole) * 12 * 2) / 2;
  return `${whole}-${inches}`;
};

/** 278.4 → 4:38.40 */
const clock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = (seconds - m * 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
};

export function formatStat(value: number | undefined, k: Pick<StatKey, 'format'>): string {
  if (value === undefined || Number.isNaN(value)) return '–';
  switch (k.format) {
    case 'dec1': return value.toFixed(1);
    case 'dec2': return value.toFixed(2);
    case 'dec3': return value < 1 ? value.toFixed(3).replace(/^0/, '') : value.toFixed(3);
    case 'pct': return `${value.toFixed(1)}%`;
    case 'time': return clock(value);
    case 'feet': return feetMarks(value);
    default: return Math.round(value).toLocaleString('en-US');
  }
}

export const gpa = (n: number) => n.toFixed(2);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** ISO date → "Oct 16, 2026" without timezone drift. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
export function dayParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { month: MONTHS[m - 1], day: d, dow, year: y };
}

export const classOf = (year: number) => `Class of ${year}`;
