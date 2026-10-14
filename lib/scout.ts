// Scouting math that pushes recruiters toward small towns. Pure:
// tools/scout.test.ts runs it.
//
// - Diamond in the fields: strong production, few recruiters watching.
// - Cornfed: production scaled by how small the school and town are.
// - Scramble: one athlete to look into, leaning on what the recruiter needs.
// - Highlight tapes: athletes and parents send a tape to a recruiter, with
//   limits so inboxes stay worth opening.

export type Prospect = {
  slug: string;
  sport: string;
  position: string;
  gradYear: number;
  /** 0..1, the athlete's production against others at the position (from the stats board). */
  production: number;
  enrollment?: number;
  townPop?: number;
  /** Distinct verified recruiters who viewed or starred in the last 30 days. */
  watchers: number;
};

/** Production that few recruiters have seen scores highest. 0..100. */
export function diamondScore(p: Pick<Prospect, 'production' | 'watchers'>): number {
  const attention = 1 / (1 + p.watchers / 3); // 0 watchers → 1, 3 → 0.5, 9 → 0.25
  return Math.round(100 * p.production ** 1.5 * attention);
}

/** Smaller school, smaller town, bigger number. Enrollment under 250 or a town under 2,500 counts as cornfed. */
export function cornfed(p: Pick<Prospect, 'production' | 'enrollment' | 'townPop'>): { score: number; cornfed: boolean } {
  const e = p.enrollment ?? 1000;
  const t = p.townPop ?? 10_000;
  const small = Math.min(2, Math.max(0.5, Math.log10(1500 / Math.max(e, 30)) + Math.log10(25_000 / Math.max(t, 100)) / 2));
  return { score: Math.round(100 * p.production * small) / 100, cornfed: e < 250 || t < 2500 };
}

/**
 * Smallest Town Athlete of the Week: among strong nominees, the smallest
 * town wins; schools without a town population fall back to enrollment.
 */
export function smallestTown<T extends Pick<Prospect, 'production' | 'townPop' | 'enrollment' | 'slug'>>(nominees: readonly T[], minProduction = 0.6): T | undefined {
  return [...nominees]
    .filter((n) => n.production >= minProduction && (n.townPop || n.enrollment))
    .sort((a, b) => (a.townPop ?? Infinity) - (b.townPop ?? Infinity) || (a.enrollment ?? Infinity) - (b.enrollment ?? Infinity) || b.production - a.production)[0];
}

export type Needs = {
  sports: string[];
  positions: string[]; // "RB", "OL"
  classes: number[]; // grad years
  minHeightIn?: number;
  minGpa?: number;
  dontWant: string[]; // free-text flags matched against position, e.g. "K", "P"
};

/** Does this athlete fit what a recruiter posted? Don't-want entries always win. */
export function fits(p: Pick<Prospect, 'sport' | 'position' | 'gradYear'> & { heightIn?: number; gpa?: number }, n: Needs): boolean {
  const pos = p.position.toUpperCase().split(/[\s/,]+/);
  if (n.dontWant.some((d) => pos.includes(d.toUpperCase()))) return false;
  if (n.sports.length && !n.sports.includes(p.sport)) return false;
  if (n.positions.length && !n.positions.some((x) => pos.includes(x.toUpperCase()))) return false;
  if (n.classes.length && !n.classes.includes(p.gradYear)) return false;
  if (n.minHeightIn && (p.heightIn ?? 0) < n.minHeightIn) return false;
  if (n.minGpa && (p.gpa ?? 0) < n.minGpa) return false;
  return true;
}

/** Scramble: one athlete to look into. Fits come first, diamonds weigh more, already seen ones are skipped. */
export function scramble<T extends Prospect>(pool: readonly T[], opts: { needs?: Needs; seen: ReadonlySet<string>; rand: () => number }): T | undefined {
  const fresh = pool.filter((p) => !opts.seen.has(p.slug));
  const fitting = opts.needs ? fresh.filter((p) => fits(p, opts.needs!)) : fresh;
  const from = fitting.length ? fitting : fresh;
  if (!from.length) return undefined;
  const weights = from.map((p) => 1 + diamondScore(p) / 20);
  let r = opts.rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < from.length; i++) if ((r -= weights[i]) <= 0) return from[i];
  return from[from.length - 1];
}

// ---- highlight tapes -------------------------------------------------------------------------

export type Tape = { athlete: string; recruiter: string; sentAt: number; seenAt?: number; moreRequestedAt?: number };
export const TAPE_LIMIT = 3; // per athlete per recruiter per season
export const TAPE_GAP_DAYS = 14;

/**
 * Can this athlete send this recruiter another tape? Three a season, two
 * weeks apart. Once the recruiter has watched one, the athlete waits for the
 * recruiter to tap "Send more" (which also lifts the gap for one tape).
 */
export function canSendTape(history: readonly Tape[], athlete: string, recruiter: string, now: number): { ok: true } | { ok: false; reason: string } {
  const mine = history.filter((t) => t.athlete === athlete && t.recruiter === recruiter).sort((a, b) => a.sentAt - b.sentAt);
  const last = mine[mine.length - 1];
  const askedForMore = Boolean(last?.moreRequestedAt);
  if (last?.seenAt && !askedForMore) return { ok: false, reason: 'This coach watched your last tape. You can send another when they ask for more.' };
  if (mine.length >= TAPE_LIMIT && !askedForMore) return { ok: false, reason: `That is ${TAPE_LIMIT} tapes to this coach this season.` };
  if (last && !askedForMore && now - last.sentAt < TAPE_GAP_DAYS * 86_400_000) {
    const days = Math.ceil((last.sentAt + TAPE_GAP_DAYS * 86_400_000 - now) / 86_400_000);
    return { ok: false, reason: `Give it ${days} more day${days === 1 ? '' : 's'} before sending another.` };
  }
  return { ok: true };
}

// ---- stat sheet ------------------------------------------------------------------------------

/** Ratios recruiters read first. Missing inputs give undefined, never a made-up number. */
export function ratios(s: Record<string, number | undefined>) {
  const div = (a?: number, b?: number, d = 1) => (a !== undefined && b ? Math.round((a / b) * 10 ** d) / 10 ** d : undefined);
  return {
    yardsPerCarry: div(s.rushYds, s.rushAtt),
    yardsPerCatch: div(s.recYds, s.rec),
    tdPerTouch: div((s.rushTd ?? 0) + (s.recTd ?? 0), (s.rushAtt ?? 0) + (s.rec ?? 0) || undefined, 3),
    completionPct: div(s.passComp !== undefined ? s.passComp * 100 : undefined, s.passAtt),
    tdToInt: div(s.passTd, s.int, 1),
    pointsPerGame: div(s.pts, s.games),
    winPct: div(s.wins !== undefined ? s.wins * 100 : undefined, (s.wins ?? 0) + (s.losses ?? 0) || undefined),
  };
}

/** How many other verified recruiters are on a school this month, worded for the board. */
export const watchLine = (n: number) => (n === 0 ? 'No recruiters yet' : n === 1 ? '1 recruiter watching' : `${n} recruiters watching`);
