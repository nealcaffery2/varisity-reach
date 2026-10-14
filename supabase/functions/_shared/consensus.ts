// GENERATED from lib/ by tools/sync-functions.ts. Edit the lib/ copy, then run `pnpm sync:functions`.
// Community scoring. Parents and fans in the stands report the score; this
// decides what the scoreboard shows and how sure it is. Pure, so the browser,
// the score-report edge function and tools/consensus.test.ts run the same code.
//
// The rules, in plain words:
//   1. A verified coach, athletic director or official scorer for either team
//      can lock the score. A lock wins until a newer lock replaces it.
//   2. Otherwise every report casts a weighted vote for the exact score it
//      claims. Weight = role × reporter trust × proof × freshness.
//   3. Reports outside the game window (30 minutes before kickoff to 4 hours
//      after) count for nothing.
//   4. The score with the most weight wins. Confidence is its share of all
//      live weight; under 60%, or under two independent reporters, the board
//      shows it as "unconfirmed".
//   5. A reported score lower than one the board already confirmed needs
//      twice the weight to take over, since scores only go up.
//   6. After the final, reporters who matched it gain trust and reporters who
//      did not lose it, so a faker's next report counts for less.

export type Role = 'official' | 'coach' | 'reporter' | 'staff' | 'fan' | 'anonymous';

export type Report = {
  id: string;
  reporter: string; // user id or device id
  role: Role;
  /** 0 to 1, starts at 0.5 for a new account. */
  trust: number;
  home: number;
  away: number;
  /** "Q3 4:12", "Set 2", "Top 5th"; shown, not scored. */
  period?: string;
  at: number; // ms epoch
  /** Photo of the scoreboard attached. */
  photo?: boolean;
  /** A moderator or the photo's timestamp check confirmed it. */
  photoVerified?: boolean;
  /** Coach or official marking this as the locked score. */
  lock?: boolean;
  final?: boolean;
};

export type Window = { start: number; end: number };

export const ROLE_WEIGHT: Record<Role, number> = {
  official: 10,
  coach: 8,
  reporter: 5,
  staff: 4,
  fan: 1,
  anonymous: 0.4,
};

const HALF_LIFE_MS = 4 * 60 * 1000;
const LOCK_ROLES: Role[] = ['official', 'coach'];

export const gameWindow = (kickoff: number, lengthMin = 150): Window => ({
  start: kickoff - 30 * 60 * 1000,
  end: kickoff + (lengthMin + 240) * 60 * 1000,
});

export function weight(r: Report, now: number, win: Window): number {
  if (r.at < win.start || r.at > win.end || r.at > now + 60_000) return 0;
  const trust = Math.max(0.05, Math.min(1, r.trust));
  const proof = r.photoVerified ? 2 : r.photo ? 1.4 : 1;
  const age = Math.max(0, now - r.at);
  const fresh = Math.pow(0.5, age / HALF_LIFE_MS);
  return ROLE_WEIGHT[r.role] * trust * proof * fresh;
}

export type Board = {
  home: number;
  away: number;
  period?: string;
  status: 'locked' | 'confirmed' | 'unconfirmed' | 'none';
  confidence: number; // 0 to 1
  reporters: number; // distinct people behind the winning score
  totalReports: number;
  lockedBy?: Role;
  final: boolean;
  updatedAt?: number;
};

const key = (r: Pick<Report, 'home' | 'away'>) => `${r.home}-${r.away}`;

export function consensus(reports: readonly Report[], now: number, win: Window, previous?: Pick<Board, 'home' | 'away' | 'status'>): Board {
  const inWindow = reports.filter((r) => r.at >= win.start && r.at <= win.end && r.home >= 0 && r.away >= 0);
  const empty: Board = { home: 0, away: 0, status: 'none', confidence: 0, reporters: 0, totalReports: inWindow.length, final: false };
  if (!inWindow.length) return empty;

  const locks = inWindow.filter((r) => r.lock && LOCK_ROLES.includes(r.role)).sort((a, b) => b.at - a.at);
  const newestLock = locks[0];
  // A lock holds unless newer fan reports pile on, which only flags it. The lock still shows.
  if (newestLock) {
    return {
      home: newestLock.home,
      away: newestLock.away,
      period: newestLock.period,
      status: 'locked',
      confidence: 1,
      reporters: 1,
      totalReports: inWindow.length,
      lockedBy: newestLock.role,
      final: Boolean(newestLock.final),
      updatedAt: newestLock.at,
    };
  }

  // One vote per reporter: their newest report.
  const latestByReporter = new Map<string, Report>();
  for (const r of inWindow) {
    const cur = latestByReporter.get(r.reporter);
    if (!cur || r.at > cur.at) latestByReporter.set(r.reporter, r);
  }

  const tally = new Map<string, { w: number; people: Set<string>; newest: Report }>();
  let total = 0;
  for (const r of latestByReporter.values()) {
    const w = weight(r, now, win);
    if (w <= 0) continue;
    total += w;
    const k = key(r);
    const t = tally.get(k) ?? { w: 0, people: new Set<string>(), newest: r };
    t.w += w;
    t.people.add(r.reporter);
    if (r.at > t.newest.at) t.newest = r;
    tally.set(k, t);
  }
  if (!tally.size || total <= 0) return empty;

  const ranked = [...tally.values()].sort((a, b) => b.w - a.w);
  let pick = ranked[0];

  // Scores do not go down. A lower score must carry twice the weight of the confirmed one to replace it.
  if (previous && previous.status !== 'none' && previous.status !== 'unconfirmed') {
    const goesDown = pick.newest.home < previous.home || pick.newest.away < previous.away;
    if (goesDown) {
      const prev = tally.get(key(previous));
      if (prev && pick.w < prev.w * 2) pick = prev;
    }
  }

  const confidence = pick.w / total;
  const status = confidence >= 0.6 && pick.people.size >= 2 ? 'confirmed' : 'unconfirmed';
  return {
    home: pick.newest.home,
    away: pick.newest.away,
    period: pick.newest.period,
    status,
    confidence,
    reporters: pick.people.size,
    totalReports: inWindow.length,
    final: Boolean(pick.newest.final) && status === 'confirmed',
    updatedAt: pick.newest.at,
  };
}

/** After the final: nudge each reporter's trust toward how close their last report was. */
export function updateTrust(reports: readonly Report[], final: Pick<Board, 'home' | 'away'>): Map<string, number> {
  const out = new Map<string, number>();
  const latest = new Map<string, Report>();
  for (const r of reports) {
    const cur = latest.get(r.reporter);
    if (!cur || r.at > cur.at) latest.set(r.reporter, r);
  }
  for (const [who, r] of latest) {
    const off = Math.abs(r.home - final.home) + Math.abs(r.away - final.away);
    const target = off === 0 ? 1 : off <= 3 ? 0.5 : 0;
    const next = r.trust + (target - r.trust) * 0.25;
    out.set(who, Math.round(Math.max(0.05, Math.min(1, next)) * 1000) / 1000);
  }
  return out;
}

/** What the board says about how it knows, in a few words. */
export function sourceLine(b: Board): string {
  if (b.status === 'none') return 'No reports yet';
  if (b.status === 'locked') return b.lockedBy === 'official' ? 'Official score' : 'Verified by the coach';
  const pct = Math.round(b.confidence * 100);
  const people = `${b.reporters} ${b.reporters === 1 ? 'fan' : 'fans'}`;
  return b.status === 'confirmed' ? `Community score · ${people} · ${pct}% agree` : `Unconfirmed · ${people} · ${pct}% agree`;
}
