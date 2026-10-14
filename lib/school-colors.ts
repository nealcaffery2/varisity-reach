// School color names → hex, and a readable accent set for a dark page.
// Directories write colors as words ("Orange/Black", "Royal Blue & Gold").
// We map each word to a standard athletic shade, then pick the brightest
// non-neutral as the accent so text on black stays readable.

const NAMED: Record<string, string> = {
  black: '#111111',
  white: '#ffffff',
  silver: '#a7a9ac',
  gray: '#8a8d91',
  grey: '#8a8d91',
  'vegas gold': '#c5b358',
  'old gold': '#cfb53b',
  gold: '#ffb81c',
  yellow: '#ffd100',
  orange: '#ff7f00',
  'burnt orange': '#cc5500',
  red: '#d22630',
  scarlet: '#d0021b',
  cardinal: '#c41e3a',
  crimson: '#a6192e',
  maroon: '#862633',
  burgundy: '#7c2529',
  purple: '#6f2da8',
  violet: '#7f3fbf',
  blue: '#1f5fbf',
  'royal blue': '#1d4ed8',
  royal: '#1d4ed8',
  'columbia blue': '#75b2dd',
  'carolina blue': '#7bafd4',
  'light blue': '#7bafd4',
  'sky blue': '#5bb8f0',
  'kelly green': '#2a9d3a',
  'forest green': '#1e5631',
  'hunter green': '#2c5234',
  green: '#1f8a3b',
  teal: '#00827f',
  navy: '#1b2a4a',
  'navy blue': '#1b2a4a',
  brown: '#6b3f22',
  cream: '#f3e9d2',
  vegas: '#c5b358',
  columbia: '#75b2dd',
  kelly: '#2a9d3a',
};

const NEUTRAL = new Set(['#111111', '#ffffff', '#a7a9ac', '#8a8d91', '#f3e9d2']);

/** "Orange/Black" → ["#ff7f00", "#111111"]; unknown words are skipped. */
export function colorsToHex(raw: string): string[] {
  const parts = raw
    .toLowerCase()
    .replace(/\band\b|&|\+/g, '/')
    .split(/[/,;-]/)
    .map((s) => s.replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const hit = NAMED[p] ?? NAMED[p.split(' ').slice(-2).join(' ')] ?? NAMED[p.split(' ').pop() ?? ''];
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio between two hex colors. */
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const mix = (hex: string, toward: string, t: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t) + parseInt(toward.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

/**
 * The accent a school's page uses on our dark background: its first
 * non-neutral color, lightened until it reads at 4.5:1 on #0b0b0c. Schools
 * whose colors are all neutral (black and white) get silver.
 */
export function accentFor(hex: readonly string[]): { accent: string; accentInk: string; accentDeep: string } {
  let accent = hex.find((h) => !NEUTRAL.has(h)) ?? '#c9cbd0';
  for (let i = 0; i < 10 && contrast(accent, '#0b0b0c') < 4.5; i++) accent = mix(accent, '#ffffff', 0.15);
  return { accent, accentInk: '#0b0b0c', accentDeep: mix(accent, '#000000', 0.35) };
}
