'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Crown } from '@phosphor-icons/react';
import { underdog } from '@/content/spotlight';
import { athleteBySlug, fullName } from '@/content/athletes';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { sportBySlug } from '@/content/sports';
import { castVote, myVote } from '@/lib/backend';
import { shortDate } from '@/lib/format';

/** Underdog of the Week: coaches nominate, the community votes once a week. */
export function UnderdogBallot() {
  const [mine, setMine] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(myVote(underdog.week));
  }, []);

  const total = underdog.nominees.reduce((n, x) => n + x.votes, 0) + (mine ? 1 : 0);
  const sorted = [...underdog.nominees].sort((a, b) => b.votes - a.votes);
  const leader = sorted[0]?.athlete;

  const vote = async (slug: string) => {
    setBusy(slug);
    setError('');
    const r = await castVote(underdog.week, slug);
    setBusy('');
    if (r.ok) setMine(slug);
    else setError(r.reason);
  };

  return (
    <div>
      <p className="text-sm text-mute">Week of {shortDate(underdog.week)} · voting closes {shortDate(underdog.closes)}{underdog.sample && ' · sample ballot'}</p>
      <ol className="mt-6 grid gap-3">
        {sorted.map((n, i) => {
          const a = athleteBySlug(n.athlete);
          if (!a) return null;
          const school = schoolBySlug(a.school);
          const votes = n.votes + (mine === n.athlete ? 1 : 0);
          const pct = Math.round((votes / total) * 100);
          return (
            <li key={n.athlete} style={school ? (schoolTheme(school) as React.CSSProperties) : undefined} className="relative overflow-hidden rounded border border-line">
              <motion.span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-accent/10"
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
              <div className="relative grid gap-4 p-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
                <span className="display text-4xl text-accent">{n.athlete === leader ? <Crown size={34} weight="fill" aria-label="Leading" /> : i + 1}</span>
                <div>
                  <Link href={`/athletes/${a.slug}/`} className="display text-3xl text-bone hover:text-accent">{fullName(a)}</Link>
                  <p className="text-sm text-mute">{sportBySlug(a.sports[0])?.name} · {school?.town}, {school?.state} · {school?.classification}</p>
                  <p className="mt-2 max-w-[60ch] text-bone/90">{n.reason}</p>
                  <p className="mt-1 text-xs text-dim">Nominated by {n.nominatedBy}</p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className="num text-2xl text-bone">{pct}%</span>
                  {mine === n.athlete ? (
                    <span className="btn btn-ghost pointer-events-none"><Check size={16} /> Your vote</span>
                  ) : (
                    <button type="button" className="btn btn-primary" disabled={Boolean(mine) || busy !== ''} onClick={() => vote(n.athlete)}>
                      {busy === n.athlete ? 'Voting…' : 'Vote'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error} {error.startsWith('Sign in') && <Link href="/sign-in/" className="link-u text-bone">Sign in</Link>}
        </p>
      )}
      <p className="mt-3 text-sm text-dim">{total.toLocaleString('en-US')} votes. One vote per person per week.</p>
    </div>
  );
}
