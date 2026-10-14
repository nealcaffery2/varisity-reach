// Reel feed for recruiters. Two modes: "random" shuffles everything a viewer
// may see; "for you" leans toward the sports a viewer engages with (likes,
// comments, saves, watching to the end) and away from what they skip, while
// keeping a share of other sports so the feed never narrows to one. Pure:
// tools/recommend.test.ts runs it.

export type Engagement = { reelId: string; sport: string; kind: 'view' | 'complete' | 'like' | 'comment' | 'share' | 'save' | 'skip'; at: number };
export type FeedReel = { id: string; sport: string; posted?: string; audience?: 'public' | 'recruiters' };

const SIGNAL: Record<Engagement['kind'], number> = { view: 0.2, complete: 1, like: 2, comment: 3, share: 3, save: 4, skip: -1.5 };
const HALF_LIFE_DAYS = 14;

/** Sport → affinity weight from recent engagement, decayed by age. Unseen sports sit at 1. */
export function affinities(events: readonly Engagement[], now: number): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const e of events) {
    const age = Math.max(0, now - e.at) / 86_400_000;
    raw[e.sport] = (raw[e.sport] ?? 0) + SIGNAL[e.kind] * 0.5 ** (age / HALF_LIFE_DAYS);
  }
  // Squash to a 0.25..4 multiplier so one binge can't wipe out other sports.
  return Object.fromEntries(Object.entries(raw).map(([s, v]) => [s, Math.min(4, Math.max(0.25, 2 ** (v / 6)))]));
}

/** Seeded PRNG so a feed is stable while the viewer scrolls and changes on refresh. */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a ^= a << 13; a >>>= 0;
    a ^= a >> 17;
    a ^= a << 5; a >>>= 0;
    return a / 2 ** 32;
  };
}

/** Recruiter-only reels show to verified recruiters and nobody else. */
export const visible = <R extends FeedReel>(reels: readonly R[], viewer: { verifiedRecruiter: boolean }) =>
  reels.filter((r) => r.audience !== 'recruiters' || viewer.verifiedRecruiter);

export function shuffle<T>(xs: readonly T[], seed: number): T[] {
  const r = rng(seed);
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * "For you": weighted sampling without replacement (Efraimidis–Spirakis), so
 * high-affinity sports come up more often but never exclusively. Reels the
 * viewer already filed under "No thanks" drop out; already seen ones sink.
 */
export function forYou<R extends FeedReel>(
  reels: readonly R[],
  events: readonly Engagement[],
  opts: { now: number; seed: number; hidden?: ReadonlySet<string> },
): R[] {
  const aff = affinities(events, opts.now);
  const seen = new Set(events.map((e) => e.reelId));
  const r = rng(opts.seed);
  return reels
    .filter((x) => !opts.hidden?.has(x.id))
    .map((x) => {
      const w = (aff[x.sport] ?? 1) * (seen.has(x.id) ? 0.2 : 1);
      return { x, key: r() ** (1 / w) };
    })
    .sort((a, b) => b.key - a.key)
    .map((k) => k.x);
}

/** Top sports for a "because you watch" label. */
export const topSports = (events: readonly Engagement[], now: number, n = 2) =>
  Object.entries(affinities(events, now))
    .filter(([, w]) => w > 1.2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([s]) => s);
