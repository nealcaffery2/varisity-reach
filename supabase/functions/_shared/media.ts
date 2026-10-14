// GENERATED from lib/ by tools/sync-functions.ts. Edit the lib/ copy, then run `pnpm sync:functions`.
// Photo and video marketplace, sponsored game listings, and the weekly
// fun awards. Pure: tools/media.test.ts runs it.
//
// Photographers keep the copyright. A school or news partner buys a license
// to use a photo; the photographer is paid and credited, and a share goes to
// the school's team fund. Card processing comes off the top, so a small sale
// never costs the platform money.

export type LicenseUse = 'personal' | 'school-web' | 'editorial' | 'commercial';

export const LICENSES: Record<LicenseUse, { label: string; who: string; priceCents: number; terms: string }> = {
  personal: { label: 'Personal', who: 'Families', priceCents: 500, terms: 'Print and share. No resale, no ads.' },
  'school-web': { label: 'School', who: 'The school or district', priceCents: 1500, terms: 'School website, social posts, yearbook, programs.' },
  editorial: { label: 'Editorial', who: 'Newspapers, radio and TV sites', priceCents: 2500, terms: 'News stories in print and online, with credit.' },
  commercial: { label: 'Commercial', who: 'Businesses and sponsors', priceCents: 7500, terms: 'Ads and marketing. Needs the family’s release for any student in the photo.' },
};

/** Card processing on a sale: Stripe's standard US card rate, 2.9% plus 30 cents. */
export const processing = (priceCents: number) => Math.round(priceCents * 0.029) + 30;

/** Who gets what from a sale: card fees first, then 79% of the rest to the photographer and 21% to the team fund. */
export function split(priceCents: number, creatorPct = 79) {
  const fees = processing(priceCents);
  const net = priceCents - fees;
  const creator = Math.round((net * creatorPct) / 100);
  return { creator, school: net - creator, fees };
}

/** Commercial use of a photo with students in it needs the family's release on file. */
export function canLicense(use: LicenseUse, photo: { minorsShown: boolean; releaseOnFile: boolean }): { ok: true } | { ok: false; reason: string } {
  if (use === 'commercial' && photo.minorsShown && !photo.releaseOnFile) return { ok: false, reason: 'Commercial use of a photo with students in it needs the family’s release first.' };
  return { ok: true };
}

/** Credit line every licensed use must carry. */
export const creditLine = (creator: string, school: string) => `Photo: ${creator} for ${school} via Varsity Reach`;

// ---- sponsored games ------------------------------------------------------------------------

export type Listing = { gameId: string; kickoff: string; sponsor?: { name: string; cents: number; pledge: string } };

/**
 * Watch list order: games live now first, by kickoff; then sponsored games by
 * amount; then everything else by kickoff. Money never moves a game within
 * or above the live group.
 */
export function orderListings<T extends Listing>(list: readonly T[], live: ReadonlySet<string>): T[] {
  return [...list].sort((a, b) => {
    const la = live.has(a.gameId) ? 1 : 0;
    const lb = live.has(b.gameId) ? 1 : 0;
    if (la !== lb) return lb - la;
    if (la) return a.kickoff.localeCompare(b.kickoff);
    const sa = a.sponsor?.cents ?? 0;
    const sb = b.sponsor?.cents ?? 0;
    if (sa !== sb) return sb - sa;
    return a.kickoff.localeCompare(b.kickoff);
  });
}

// ---- pledges on the wants board --------------------------------------------------------------

export type Pledge = { by: 'faculty' | 'booster' | 'sponsor' | 'family'; name: string; cents?: number; hours?: number };

/** How close a want is: money pledged against the estimate, with volunteer hours listed separately. */
export function pledgeProgress(estCents: number | undefined, pledges: readonly Pledge[]) {
  const cents = pledges.reduce((n, p) => n + (p.cents ?? 0), 0);
  const hours = pledges.reduce((n, p) => n + (p.hours ?? 0), 0);
  return { cents, hours, pct: estCents ? Math.min(100, Math.round((cents / estCents) * 100)) : undefined, faculty: pledges.some((p) => p.by === 'faculty') };
}

// ---- fun awards -----------------------------------------------------------------------------

export type Award = 'shakiest-camera' | 'loudest-parent';
export const AWARDS: Record<Award, { title: string; blurb: string }> = {
  'shakiest-camera': { title: 'Shakiest Camera of the Week', blurb: 'The phone was pointed at the field. Mostly.' },
  'loudest-parent': { title: 'Loudest Parent of the Week', blurb: 'You could hear them from the parking lot. With love.' },
};

/** One vote per person per award per week; the most votes wins, earliest entry breaks ties. */
export function tally(votes: readonly { voter: string; clip: string }[], entries: readonly { clip: string; at: string }[]) {
  const seen = new Set<string>();
  const count = new Map<string, number>();
  for (const v of votes) {
    if (seen.has(v.voter)) continue;
    seen.add(v.voter);
    count.set(v.clip, (count.get(v.clip) ?? 0) + 1);
  }
  return [...entries].map((e) => ({ ...e, votes: count.get(e.clip) ?? 0 })).sort((a, b) => b.votes - a.votes || a.at.localeCompare(b.at));
}
