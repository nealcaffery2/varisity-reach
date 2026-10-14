'use client';

import { useState } from 'react';
import { Check, HandCoins } from '@phosphor-icons/react';
import { schools } from '@/content/schools';
import { postNeed } from '@/lib/backend';
import { parseAmount, dollars } from '@/lib/fundraise';

const KINDS = [
  ['cleats', 'Cash for Cleats'],
  ['travel', 'Bus or travel'],
  ['equipment', 'Equipment'],
  ['camp', 'Recruiting camps'],
  ['facility', 'Facility'],
  ['exposure', 'Ads and exposure (highlight videos, ads that reach college coaches)'],
  ['general', 'Something else'],
] as const;

/** A coach says what the team needs. The athletic director approves it before it takes a dollar. */
export function PostNeed() {
  const [school, setSchool] = useState('hillsboro');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<string>('cleats');
  const [goal, setGoal] = useState('');
  const [need, setNeed] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [payee, setPayee] = useState<'school' | 'booster'>('booster');
  const [matchBy, setMatchBy] = useState('');
  const [matchUpTo, setMatchUpTo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ demo: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (title.trim().length < 4) errs.title = 'Give it a short name, like “Cash for Cleats”.';
    const g = parseAmount(goal);
    if ('error' in g) errs.goal = g.error;
    if (need.trim().length < 20) errs.need = 'Say what the money buys, with a number. Recruits and donors read this first.';
    if (!endsOn) errs.endsOn = 'Pick an end date.';
    const m = matchBy.trim() ? parseAmount(matchUpTo) : null;
    if (m && 'error' in m) errs.match = m.error;
    setErrors(errs);
    if (Object.keys(errs).length || 'error' in g) return;
    setBusy(true);
    try {
      const res = await postNeed({
        school, title: title.trim(), kind, goalCents: g.cents, need: need.trim(), endsOn, payee,
        match: m && 'cents' in m ? { by: matchBy.trim(), ratio: 1, upToCents: m.cents } : undefined,
      });
      setDone({ demo: Boolean(res.demo) });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not post that.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="rounded border border-line bg-ink-2 p-6" aria-live="polite">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink"><Check size={24} weight="bold" /></span>
        <h2 className="display mt-4 text-4xl">Sent to your athletic director</h2>
        <p className="mt-2 max-w-md text-mute">
          It goes live once they approve it and the {payee === 'school' ? 'school' : 'booster club'} payout account is connected.
          {done.demo && ' Demo mode: saved in this browser only.'}
        </p>
        <button type="button" className="btn btn-ghost mt-5" onClick={() => { setDone(null); setTitle(''); setGoal(''); setNeed(''); }}>Post another need</button>
      </section>
    );
  }

  const err = (k: string) => errors[k] && <p id={`${k}-err`} className="mt-1.5 text-sm text-danger">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate className="rounded border border-line bg-ink-2 p-5 md:p-6" aria-labelledby="need-h">
      <h2 id="need-h" className="display flex items-center gap-3 text-4xl"><HandCoins size={32} className="text-accent" /> Post a need</h2>
      <p className="mt-2 max-w-xl text-mute">Cleats, a bus to state, camp fees, a squat rack. Say what it costs and what it buys. Your athletic director approves it, and the money goes to the school or booster club account.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="n-school" className="field-label">School</label>
          <select id="n-school" className="field" value={school} onChange={(e) => setSchool(e.target.value)}>
            {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="n-kind" className="field-label">Kind</label>
          <select id="n-kind" className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="n-title" className="field-label">Name</label>
          <input id="n-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-err' : undefined} />
          {err('title')}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="n-need" className="field-label">What it buys</label>
          <textarea id="n-need" rows={3} className="field min-h-24 py-3" value={need} onChange={(e) => setNeed(e.target.value)} aria-invalid={Boolean(errors.need)} aria-describedby={errors.need ? 'need-err' : 'need-help'} />
          <p id="need-help" className="mt-1.5 text-xs text-dim">Example: “31 freshmen and JV players need cleats. $85 buys one pair.”</p>
          {err('need')}
        </div>
        <div>
          <label htmlFor="n-goal" className="field-label">Goal ($)</label>
          <input id="n-goal" inputMode="decimal" className="field num" value={goal} onChange={(e) => setGoal(e.target.value)} aria-invalid={Boolean(errors.goal)} aria-describedby={errors.goal ? 'goal-err' : undefined} />
          {err('goal')}
        </div>
        <div>
          <label htmlFor="n-end" className="field-label">Ends</label>
          <input id="n-end" type="date" className="field" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} aria-invalid={Boolean(errors.endsOn)} aria-describedby={errors.endsOn ? 'endsOn-err' : undefined} />
          {err('endsOn')}
        </div>
        <fieldset className="md:col-span-2">
          <legend className="field-label">Money goes to</legend>
          <div className="flex flex-wrap gap-2">
            {(['booster', 'school'] as const).map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={payee === p} onClick={() => setPayee(p)}>{p === 'booster' ? 'Booster club' : 'School district'}</button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="n-match" className="field-label">Matching sponsor (optional)</label>
          <input id="n-match" className="field" value={matchBy} onChange={(e) => setMatchBy(e.target.value)} placeholder="A local business" />
        </div>
        <div>
          <label htmlFor="n-matchmax" className="field-label">Matches up to ($)</label>
          <input id="n-matchmax" inputMode="decimal" className="field num" value={matchUpTo} onChange={(e) => setMatchUpTo(e.target.value)} disabled={!matchBy.trim()} aria-invalid={Boolean(errors.match)} aria-describedby={errors.match ? 'match-err' : undefined} />
          {err('match')}
        </div>
      </div>
      {err('form')}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send for approval'}</button>
        {goal && 'cents' in parseAmount(goal) && <span className="text-sm text-dim">Goal {dollars((parseAmount(goal) as { cents: number }).cents)}</span>}
      </div>
    </form>
  );
}
