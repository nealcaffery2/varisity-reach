// Fan bracket and pick'em math. A bracket is seeded from real standings; fans
// pick winners round by round. Pure: tools/bracket.test.ts runs it.

export type Seed = { seed: number; team: string };
export type Matchup = { id: string; round: number; slot: number; a?: string; b?: string };
export type Picks = Record<string, string>; // matchup id → team picked

/** Standard bracket order so 1 meets 8, 4 meets 5, and 1 and 2 can only meet in the final. */
function order(n: number): number[] {
  let o = [1, 2];
  while (o.length < n) {
    const size = o.length * 2 + 1;
    o = o.flatMap((s) => [s, size - s]);
  }
  return o;
}

/** First-round matchups for 2, 4, 8 or 16 seeds. */
export function firstRound(seeds: readonly Seed[]): Matchup[] {
  const n = seeds.length;
  if (![2, 4, 8, 16].includes(n)) throw new Error('A bracket needs 2, 4, 8 or 16 teams.');
  const bySeed = new Map(seeds.map((s) => [s.seed, s.team]));
  const o = order(n);
  const out: Matchup[] = [];
  for (let i = 0; i < n; i += 2) out.push({ id: `r1-${i / 2}`, round: 1, slot: i / 2, a: bySeed.get(o[i]), b: bySeed.get(o[i + 1]) });
  return out;
}

export const rounds = (teams: number) => Math.log2(teams);

/** The whole bracket as the picks so far fill it in. Later rounds show who a fan sent through. */
export function bracketWithPicks(seeds: readonly Seed[], picks: Picks): Matchup[][] {
  const all: Matchup[][] = [firstRound(seeds)];
  for (let r = 2; r <= rounds(seeds.length); r++) {
    const prev = all[r - 2];
    const cur: Matchup[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      const winner = (m: Matchup) => (picks[m.id] && (picks[m.id] === m.a || picks[m.id] === m.b) ? picks[m.id] : undefined);
      cur.push({ id: `r${r}-${i / 2}`, round: r, slot: i / 2, a: winner(prev[i]), b: winner(prev[i + 1]) });
    }
    all.push(cur);
  }
  return all;
}

/** Changing an early pick knocks out later picks that relied on the old winner. */
export function pick(seeds: readonly Seed[], picks: Picks, matchupId: string, team: string): Picks {
  const next: Picks = { ...picks, [matchupId]: team };
  // Re-validate every later pick against the bracket it now produces.
  for (let pass = 0; pass < rounds(seeds.length); pass++) {
    for (const round of bracketWithPicks(seeds, next)) {
      for (const m of round) {
        const p = next[m.id];
        if (p && p !== m.a && p !== m.b) delete next[m.id];
      }
    }
  }
  return next;
}

export const champion = (seeds: readonly Seed[], picks: Picks) => {
  const all = bracketWithPicks(seeds, picks);
  const final = all[all.length - 1][0];
  const p = picks[final.id];
  return p && (p === final.a || p === final.b) ? p : undefined;
};

/** 1, 2, 4, 8 points per correct pick by round, the usual bracket scoring. */
export function score(picks: Picks, results: Picks): number {
  return Object.entries(results).reduce((n, [id, winner]) => {
    const round = Number(id.split('-')[0].slice(1));
    return n + (picks[id] === winner ? 2 ** (round - 1) : 0);
  }, 0);
}

/** Share of fans picking each side of a game, from raw vote counts. */
export function pickShare(votes: Record<string, number>) {
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(votes).map(([k, v]) => [k, total ? Math.round((v / total) * 100) : 0]));
}
