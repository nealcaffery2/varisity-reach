'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Flag, HandHeart, LockSimple, SealCheck, Trophy, Users } from '@phosphor-icons/react';
import { type Campaign, daysLeft, dollars, matchedCents, milestoneState, parseAmount, progress, squadBoard, tierFor, totalCents, TIERS } from '@/lib/fundraise';
import { demoGifts, isLive, startDonation } from '@/lib/backend';
import { ShareBar } from '@/components/share-bar';
import { platform } from '@/content/platform';

const PRESETS = [1000, 2500, 5000, 8500, 10000];

export function CampaignView({ c: base }: { c: Campaign }) {
  const [extra, setExtra] = useState<{ cents: number; name: string; message?: string; squad?: string }[]>([]);
  const [amount, setAmount] = useState('25');
  const [squad, setSquad] = useState(base.squads[0]?.name ?? '');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [anon, setAnon] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'thanks'>('idle');
  const [error, setError] = useState('');
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExtra(demoGifts(base.id).map((g) => ({ cents: g.amountCents, name: g.anonymous ? 'Anonymous' : g.name, message: g.message, squad: g.squad })));
    setToday(new Date());
    const p = new URLSearchParams(window.location.search);
    if (p.get('thanks') === '1') setState('thanks');
  }, [base.id]);

  // Fold this browser's demo gifts into the totals so the game mechanics respond.
  const c: Campaign = useMemo(() => {
    const add = extra.reduce((n, g) => n + g.cents, 0);
    return {
      ...base,
      raisedCents: base.raisedCents + add,
      donors: base.donors + extra.length,
      squads: base.squads.map((s) => ({ ...s, raisedCents: s.raisedCents + extra.filter((g) => g.squad === s.name).reduce((n, g) => n + g.cents, 0) })),
      recent: [...extra.map((g) => ({ name: g.name, amountCents: g.cents, message: g.message, squad: g.squad, at: 'just now' })).reverse(), ...base.recent],
    };
  }, [base, extra]);

  const pct = progress(c);
  const ms = milestoneState(c);
  const parsed = parseAmount(amount);
  const cents = 'cents' in parsed ? parsed.cents : 0;
  const tier = tierFor(cents || 1);
  const left = today ? daysLeft(c.endsOn, today) : null;
  const board = squadBoard(c.squads);
  const leadSquad = board[0]?.raisedCents || 1;

  const give = async (e: React.FormEvent) => {
    e.preventDefault();
    if ('error' in parsed) return setError(parsed.error);
    if (!anon && !name.trim()) return setError('Add your name, or give anonymously.');
    setError('');
    setState('busy');
    try {
      const res = await startDonation({ campaignId: c.id, amountCents: parsed.cents, name: name.trim(), message: message.trim() || undefined, squad: squad || undefined, anonymous: anon });
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl);
        return;
      }
      setExtra((x) => [...x, { cents: parsed.cents, name: anon ? 'Anonymous' : name.trim(), message: message.trim() || undefined, squad: squad || undefined }]);
      setState('thanks');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'The gift did not go through. Nothing was charged.');
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0 space-y-12">
        <section aria-labelledby="progress-h">
          <h2 id="progress-h" className="sr-only">Progress</h2>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p>
              <span className="num text-5xl text-bone md:text-6xl">{dollars(totalCents(c))}</span>
              <span className="ml-2 text-mute">of {dollars(c.goalCents)}</span>
            </p>
            <p className="text-sm text-mute">
              <span className="num text-bone">{c.donors}</span> donors{left !== null && <> · <span className="num text-bone">{left}</span> {left === 1 ? 'day' : 'days'} left</>}
            </p>
          </div>
          <div className="relative mt-4 h-4 rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Raised so far, including the match">
            <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 60, damping: 18 }} />
            {c.milestones.map((m) => {
              const hit = pct * 100 >= m.atPct;
              return (
                <span key={m.atPct} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${Math.min(m.atPct, 99.5)}%` }}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${hit ? 'border-accent bg-accent text-accent-ink' : 'border-line-2 bg-ink text-dim'}`}>
                    {hit ? <Check size={14} weight="bold" /> : <LockSimple size={12} />}
                  </span>
                </span>
              );
            })}
          </div>
          <ol className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
            {c.milestones.map((m) => {
              const hit = pct * 100 >= m.atPct;
              return (
                <li key={m.atPct} className={`flex items-start gap-3 bg-ink p-4 ${hit ? '' : 'text-mute'}`}>
                  <Flag size={20} weight={hit ? 'fill' : 'regular'} className={hit ? 'text-accent' : 'text-dim'} />
                  <span>
                    <span className="num text-sm text-dim">{m.atPct}%</span>
                    <span className={`block ${hit ? 'text-bone' : ''}`}>{m.label}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          {ms.next && (
            <p className="mt-4 text-bone">
              <span className="num text-accent">{dollars(ms.toNextCents)}</span> more unlocks <span className="font-semibold">{ms.next.label.toLowerCase()}</span>
              {c.match && matchedCents(c) < c.match.upToCents && (c.match.ratio === 1 ? ', with the match doubling every dollar' : `, with the match adding ${Math.round(c.match.ratio * 100)} cents per dollar`)}.
            </p>
          )}
        </section>

        {board.length > 0 && (
          <section aria-labelledby="squads-h">
            <h2 id="squads-h" className="display flex items-center gap-3 text-4xl"><Users size={30} className="text-accent" /> The race</h2>
            <p className="mt-2 text-mute">Pick a side when you give. The board moves with every gift.</p>
            <ol className="mt-6 space-y-3">
              {board.map((s, i) => (
                <li key={s.name}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2 text-bone">{i === 0 && <Trophy size={16} weight="fill" className="text-accent" />}{s.name}</span>
                    <span className="num text-mute">{dollars(s.raisedCents)}</span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-line">
                    <motion.div className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-line-2'}`} initial={{ width: 0 }} whileInView={{ width: `${(s.raisedCents / leadSquad) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="story-h">
          <h2 id="story-h" className="display text-4xl">Where it goes</h2>
          <p className="mt-4 max-w-[65ch] text-lg text-bone/90">{c.need}</p>
          <p className="mt-3 max-w-[65ch] text-mute">{c.story}</p>
          <dl className="mt-6 grid gap-px overflow-hidden rounded border border-line bg-line text-sm sm:grid-cols-3">
            <div className="bg-ink p-4"><dt className="text-dim">Posted by</dt><dd className="mt-1 text-bone">{c.createdBy.name}, {c.createdBy.role}</dd></div>
            <div className="bg-ink p-4"><dt className="text-dim">Paid to</dt><dd className="mt-1 text-bone">{c.payee}</dd></div>
            <div className="bg-ink p-4"><dt className="text-dim">Fees</dt><dd className="mt-1 text-bone">Card processing by Stripe{platform.feePct ? `, plus a ${platform.feePct}% platform fee` : '. No platform fee'}.</dd></div>
          </dl>
        </section>

        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="display text-4xl">Recent gifts</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {c.recent.slice(0, 8).map((d, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <span>
                  <span className="text-bone">{d.name}</span>
                  {d.squad && <span className="text-sm text-dim"> · {d.squad}</span>}
                  {d.message && <span className="block text-sm text-mute">“{d.message}”</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="num block text-bone">{dollars(d.amountCents)}</span>
                  <span className="text-xs text-accent">{tierFor(d.amountCents).name}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <AnimatePresence mode="wait">
          {state === 'thanks' ? (
            <motion.div key="thanks" className="relative overflow-hidden rounded border border-accent bg-ink-2 p-6 text-center" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <Burst />
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink"><HandHeart size={28} weight="fill" /></span>
              <p className="display relative mt-4 text-4xl">Thank you</p>
              <p className="relative mt-2 text-mute">You are on the board as a <span className="text-accent">{tier.name}</span> backer.{!isLive && ' Demo mode: no card was charged.'}</p>
              <div className="relative mt-5 flex justify-center"><ShareBar title={c.title} text={`I just backed “${c.title}”. Help get it over the line:`} /></div>
              <button type="button" className="btn btn-ghost relative mt-4" onClick={() => setState('idle')}>Give again</button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={give} className="rounded border border-line bg-ink-2 p-5" noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="display text-4xl">Give</h2>
              {c.match && matchedCents(c) < c.match.upToCents && (
                <p className="mt-2 rounded-sm bg-accent/10 px-3 py-2 text-sm text-bone">{c.match.by} matches {c.match.ratio === 1 ? 'every dollar' : `${Math.round(c.match.ratio * 100)} cents per dollar`}, {dollars(c.match.upToCents - matchedCents(c))} of match left.</p>
              )}
              <fieldset className="mt-4">
                <legend className="field-label">Amount</legend>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button key={p} type="button" className="chip justify-center" aria-pressed={cents === p} onClick={() => setAmount(String(p / 100))}>{dollars(p)}</button>
                  ))}
                  <label className="sr-only" htmlFor="g-amt">Other amount in dollars</label>
                  <input id="g-amt" inputMode="decimal" className="field num h-8 min-h-8 rounded-full px-3 text-center text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="g-tier" />
                </div>
                <p id="g-tier" className="mt-2 text-sm text-mute">
                  {cents ? <>That makes you a <span className="text-accent">{tier.name}</span> backer{c.kind === 'cleats' && cents >= 8500 ? ` and buys ${Math.floor(cents / 8500)} ${Math.floor(cents / 8500) === 1 ? 'pair' : 'pairs'} of cleats` : ''}.</> : 'Enter an amount.'}
                </p>
              </fieldset>
              {c.squads.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="g-squad" className="field-label">Count it toward</label>
                  <select id="g-squad" className="field" value={squad} onChange={(e) => setSquad(e.target.value)}>
                    {c.squads.map((s) => <option key={s.name}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div className="mt-4">
                <label htmlFor="g-name" className="field-label">Name on the board</label>
                <input id="g-name" className="field" value={name} onChange={(e) => setName(e.target.value)} disabled={anon} autoComplete="name" />
              </div>
              <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-bone">
                <input type="checkbox" className="h-4 w-4" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Give anonymously
              </label>
              <div className="mt-2">
                <label htmlFor="g-msg" className="field-label">Message (optional)</label>
                <input id="g-msg" className="field" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={120} />
              </div>
              {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
              <button type="submit" className="btn btn-primary mt-5 w-full" disabled={state === 'busy'}>
                {state === 'busy' ? 'Opening checkout…' : `Give ${cents ? dollars(cents) : ''}`}
              </button>
              <p className="mt-3 text-xs text-dim">Secure checkout by Stripe. {c.schoolBacked ? 'Approved by the school.' : 'Posted by the coach.'} Receipts come from {c.payee}.</p>
              <details className="mt-3 text-xs text-dim">
                <summary className="cursor-pointer text-mute">Backer levels</summary>
                <ul className="mt-2 space-y-1">{TIERS.slice(0, -1).map((t) => <li key={t.name}>{t.name}: {dollars(t.minCents)} and up</li>)}</ul>
              </details>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {c.schoolBacked && <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-2 py-1 font-semibold text-accent-ink"><SealCheck size={13} weight="fill" /> School backed</span>}
          {c.coachBacked && <span className="rounded-sm border border-line-2 px-2 py-1 text-mute">Backed by {c.coachBacked}</span>}
        </div>
      </aside>
    </div>
  );
}

/** A short burst of school-colored confetti behind the thank-you. Skipped with reduced motion by the global rule. */
function Burst() {
  const bits = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {bits.map((i) => {
        const angle = (i / bits.length) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className={`absolute left-1/2 top-16 h-2 w-1 rounded-sm ${i % 3 ? 'bg-accent' : 'bg-bone'}`}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * 140, y: Math.sin(angle) * 110 + 40, opacity: 0, rotate: 260 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </div>
  );
}
