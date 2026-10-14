// Free fantasy football for a conference: fans draft athletes whose families
// opted them into the network, score them on the stat lines coaches post, and
// play for bragging rights. No entry fees and no prizes, ever: the players are
// minors and IHSA amateur rules apply. Pure: tools/bracket.test.ts runs it.

export type Slot = 'QB' | 'RB' | 'WR' | 'DEF' | 'FLEX';
export const SLOTS: { slot: Slot; label: string; fits: RegExp }[] = [
  { slot: 'QB', label: 'Quarterback', fits: /\bQB\b/i },
  { slot: 'RB', label: 'Running back', fits: /\b(RB|FB)\b/i },
  { slot: 'WR', label: 'Receiver', fits: /\b(WR|TE)\b/i },
  { slot: 'DEF', label: 'Defender', fits: /\b(LB|DB|SS|FS|CB|DE|DT|DL|S)\b/i },
  { slot: 'FLEX', label: 'Any position', fits: /./ },
];

export type StatLine = Partial<Record<'passYds' | 'passTd' | 'int' | 'rushYds' | 'rushTd' | 'recYds' | 'recTd' | 'tackles' | 'sacks' | 'defInt' | 'fumRec' | 'defTd', number>>;

/** Standard-ish scoring, tuned so a big high school night lands around 20 to 35. */
const POINTS: Required<Record<keyof StatLine, number>> = {
  passYds: 1 / 25, passTd: 4, int: -2, rushYds: 1 / 10, rushTd: 6, recYds: 1 / 10, recTd: 6,
  tackles: 1, sacks: 2, defInt: 3, fumRec: 2, defTd: 6,
};

export const points = (s: StatLine) => Math.round(Object.entries(s).reduce((n, [k, v]) => n + (v ?? 0) * POINTS[k as keyof StatLine], 0) * 10) / 10;

export type Squad = Partial<Record<Slot, string>>; // slot → athlete slug

/** Can this athlete fill this slot, and are they free (not already on the squad elsewhere)? */
export function canPlace(squad: Squad, slot: Slot, slug: string, position: string): { ok: true } | { ok: false; reason: string } {
  const rule = SLOTS.find((s) => s.slot === slot)!;
  if (!rule.fits.test(position)) return { ok: false, reason: `${rule.label} only.` };
  const taken = Object.entries(squad).find(([s, a]) => a === slug && s !== slot);
  if (taken) return { ok: false, reason: `Already your ${taken[0]}.` };
  return { ok: true };
}

export const squadPoints = (squad: Squad, lines: Record<string, StatLine>) =>
  Math.round(Object.values(squad).reduce((n, slug) => n + (slug && lines[slug] ? points(lines[slug]) : 0), 0) * 10) / 10;
