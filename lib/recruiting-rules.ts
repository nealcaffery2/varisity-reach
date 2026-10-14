// When a college coach may start writing to an athlete, by division. A
// guardrail, not legal advice: the NCAA changes its calendar, and the coach's
// compliance office has the final word. Source: NCAA Division I and II
// recruiting rules as of the 2019-20 changes (ncaa.org, "Recruiting"),
// checked October 2026. Messages sent through Varsity Reach always copy a
// linked parent while the athlete is a minor.

export type Division = 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO';

/** First day a coach may send recruiting email or mail, for a class (grad year). */
export function contactOpens(division: Division, sport: string, gradYear: number): Date | null {
  // School year N-1 → N is senior year for class N. Junior year starts in the fall of N-2.
  const juniorFall = gradYear - 2;
  if (division === 'D1' && sport === 'football') return new Date(Date.UTC(juniorFall, 8, 1)); // Sept 1, junior year
  if (division === 'D1' || division === 'D2') return new Date(Date.UTC(juniorFall, 5, 15)); // June 15 after sophomore year
  return null; // D3, NAIA and junior colleges may write at any time
}

export type ContactCheck = { ok: true; ccFamily: boolean } | { ok: false; reason: string; opens: string };

export function canContact(p: { division: Division; sport: string; gradYear: number; now: Date; minor: boolean }): ContactCheck {
  const opens = contactOpens(p.division, p.sport, p.gradYear);
  if (opens && p.now < opens) {
    return { ok: false, reason: `${p.division} coaches can write to the class of ${p.gradYear} starting ${opens.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.`, opens: opens.toISOString().slice(0, 10) };
  }
  return { ok: true, ccFamily: p.minor };
}
