import type { Athlete, Sport, StatKey } from './types';

export type Leader = { athlete: Athlete; value: number; year: string };

/** Most recent varsity season that has this stat. */
export function latest(a: Athlete, key: string) {
  const line = a.seasons.find((s) => s.stats[key] !== undefined);
  return line ? { value: line.stats[key], year: line.year } : undefined;
}

/** Top `n` athletes in one stat for one sport, best first. */
export function leaders(list: readonly Athlete[], sport: Sport, k: StatKey, n = 5): Leader[] {
  return list
    .filter((a) => a.sports.includes(sport.slug))
    .flatMap((a) => {
      const l = latest(a, k.key);
      return l ? [{ athlete: a, ...l }] : [];
    })
    .sort((x, y) => (k.lowerWins ? x.value - y.value : y.value - x.value))
    .slice(0, n);
}

/** Stat keys of a sport that at least one athlete has a number for. */
export const usedKeys = (list: readonly Athlete[], sport: Sport) =>
  sport.statKeys.filter((k) => list.some((a) => a.sports.includes(sport.slug) && latest(a, k.key)));
