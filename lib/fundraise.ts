// Fundraiser math, kept pure so the page, the edge function and the tests
// agree: totals with matches, milestones, donor tiers and the squad race.

export type Match = { by: string; ratio: number; upToCents: number };
export type Milestone = { atPct: number; label: string };
export type Squad = { name: string; raisedCents: number };
export type Donation = { name: string; amountCents: number; message?: string; squad?: string; at: string };

export type Campaign = {
  id: string;
  school: string;
  sample: boolean;
  title: string;
  kind: 'cleats' | 'travel' | 'equipment' | 'camp' | 'facility' | 'general';
  sport?: string;
  /** What the coach needs, in the coach's words. */
  need: string;
  story: string;
  goalCents: number;
  raisedCents: number;
  donors: number;
  endsOn: string; // ISO date
  createdBy: { name: string; role: 'coach' | 'athletic director' | 'booster club' };
  /** The school approved it and money lands in the school or booster account. */
  schoolBacked: boolean;
  coachBacked?: string;
  match?: Match;
  /** Who the money goes to, as the payout account is named. */
  payee: string;
  milestones: Milestone[];
  squads: Squad[];
  recent: Donation[];
  image?: string;
};

/** Match dollars earned so far: ratio times raised, capped. */
export const matchedCents = (c: Pick<Campaign, 'raisedCents' | 'match'>) =>
  c.match ? Math.min(c.match.upToCents, Math.round(c.raisedCents * c.match.ratio)) : 0;

export const totalCents = (c: Pick<Campaign, 'raisedCents' | 'match'>) => c.raisedCents + matchedCents(c);

export const progress = (c: Pick<Campaign, 'raisedCents' | 'match' | 'goalCents'>) =>
  c.goalCents > 0 ? Math.min(1, totalCents(c) / c.goalCents) : 0;

export function milestoneState(c: Pick<Campaign, 'raisedCents' | 'match' | 'goalCents' | 'milestones'>) {
  const pct = progress(c) * 100;
  const sorted = [...c.milestones].sort((a, b) => a.atPct - b.atPct);
  return {
    unlocked: sorted.filter((m) => pct >= m.atPct),
    next: sorted.find((m) => pct < m.atPct),
    /** Donor money still needed to reach the next milestone, counting the match. */
    toNextCents: (() => {
      const n = sorted.find((m) => pct < m.atPct);
      return n ? donorCentsToReach(c, (n.atPct / 100) * c.goalCents) : 0;
    })(),
  };
}

/** Donor cents needed for the total (with match) to reach `targetCents`. */
export function donorCentsToReach(c: Pick<Campaign, 'raisedCents' | 'match'>, targetCents: number) {
  const left = targetCents - totalCents(c);
  if (left <= 0) return 0;
  const ratio = c.match?.ratio ?? 0;
  const room = c.match ? Math.max(0, c.match.upToCents - matchedCents(c)) : 0;
  if (!ratio || !room) return Math.ceil(left);
  // Each donor dollar brings `ratio` more until the match runs out.
  const boostedSpan = (room * (1 + ratio)) / ratio;
  return Math.ceil(left <= boostedSpan ? left / (1 + ratio) : room / ratio + (left - boostedSpan));
}

export type Tier = { name: string; minCents: number };
export const TIERS: Tier[] = [
  { name: 'Hall of Fame', minCents: 10000 },
  { name: 'Varsity', minCents: 5000 },
  { name: 'Starter', minCents: 2500 },
  { name: 'Rookie', minCents: 1000 },
  { name: 'Fan', minCents: 1 },
];
export const tierFor = (amountCents: number) => TIERS.find((t) => amountCents >= t.minCents) ?? TIERS[TIERS.length - 1];

export const squadBoard = (squads: Squad[]) => [...squads].sort((a, b) => b.raisedCents - a.raisedCents);

export const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Whole days left, never negative. `today` is injectable for tests and static builds. */
export function daysLeft(endsOn: string, today = new Date()) {
  const [y, m, d] = endsOn.split('-').map(Number);
  const end = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.round((end - now) / 86400000));
}

/** Validate a donation amount typed by a person. Returns cents or an error to show. */
export function parseAmount(input: string): { cents: number } | { error: string } {
  const clean = input.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return { error: 'Enter an amount in dollars, like 25.' };
  const cents = Math.round(Number(clean) * 100);
  if (cents < 500) return { error: 'The smallest gift is $5, so card fees do not eat it.' };
  if (cents > 1000000) return { error: 'For gifts over $10,000, contact the athletic office.' };
  return { cents };
}
