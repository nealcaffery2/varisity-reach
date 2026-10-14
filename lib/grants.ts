// Which grants apply to a school, and which coaches to tell. Pure:
// tools/media.test.ts runs it alongside the other money logic.

import type { Grant } from '@/content/grants';

export type Place = { state: string; county?: string };

export function appliesTo(g: Pick<Grant, 'area'>, p: Place): boolean {
  if (g.area.kind === 'national') return true;
  if (g.area.state !== p.state) return false;
  if (g.area.kind === 'state') return true;
  return Boolean(p.county && g.area.counties.some((c) => c.toLowerCase() === p.county!.toLowerCase()));
}

/** Local first (county, then state, then national), then the soonest stated date. */
export function forPlace<G extends Pick<Grant, 'area' | 'next'>>(list: readonly G[], p: Place): G[] {
  const rank = (g: G) => (g.area.kind === 'counties' ? 0 : g.area.kind === 'state' ? 1 : 2);
  return list.filter((g) => appliesTo(g, p)).sort((a, b) => rank(a) - rank(b) || (a.next ?? '9999').localeCompare(b.next ?? '9999'));
}

/** Grants with a stated date inside the next `days` days: these go out as coach alerts. */
export function upcoming<G extends Pick<Grant, 'area' | 'next' | 'id'>>(list: readonly G[], p: Place, today: string, days = 45): G[] {
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
  return forPlace(list, p).filter((g) => g.next && g.next >= today && g.next <= end);
}
