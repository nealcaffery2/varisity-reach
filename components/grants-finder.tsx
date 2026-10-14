'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowSquareOut, BellRinging } from '@phosphor-icons/react';
import { grants, type Grant } from '@/content/grants';
import { forPlace, upcoming } from '@/lib/grants';
import { getPrefs, setMuted } from '@/lib/community';

const TAGS: { tag: Grant['tags'][number]; label: string }[] = [
  { tag: 'equipment', label: 'Equipment' },
  { tag: 'facility', label: 'Fields and lights' },
  { tag: 'fees', label: 'Family fees' },
  { tag: 'girls', label: 'Girls’ sports' },
  { tag: 'college', label: 'College money' },
];

const STATES = ['IL', 'IA', 'IN', 'KS', 'MO', 'TX', 'WI', 'Other'];
const area = (g: Grant) => (g.area.kind === 'national' ? 'National' : g.area.kind === 'state' ? g.area.state : `${g.area.counties.length} counties, ${g.area.state}`);

/** Grants a school can use, nearest first. Coaches can turn on alerts for deadlines near them. */
export function GrantsFinder() {
  const [today, setToday] = useState('');
  const [state, setState] = useState('IL');
  const [county, setCounty] = useState('Montgomery');
  const [tag, setTag] = useState<string>('');
  const [alerts, setAlerts] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const d = new Date();
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    getPrefs().then((p) => setAlerts(!p.muted.includes('grant_deadline')));
  }, []);

  const place = { state, county: county.trim() || undefined };
  const list = useMemo(() => forPlace(grants, place).filter((g) => !tag || g.tags.includes(tag as Grant['tags'][number])), [state, county, tag]); // eslint-disable-line react-hooks/exhaustive-deps
  const soon = today ? upcoming(grants, place, today, 60) : [];

  const toggleAlerts = async () => {
    const on = !alerts;
    const r = await setMuted('grant_deadline', !on);
    if (!r.ok) return setMsg(r.reason);
    setAlerts(on);
    setMsg(on ? 'Deadline alerts on. They show on your account page for your school’s state and county.' : 'Deadline alerts off.');
  };

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="g-state" className="field-label">State</label>
          <select id="g-state" className="field w-auto" value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div>
          <label htmlFor="g-county" className="field-label">County</label>
          <input id="g-county" className="field w-48" value={county} onChange={(e) => setCounty(e.target.value)} autoComplete="off" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="What it pays for">
          <button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag('')}>Everything</button>
          {TAGS.map((t) => <button key={t.tag} type="button" className="chip" aria-pressed={tag === t.tag} onClick={() => setTag(t.tag)}>{t.label}</button>)}
        </div>
      </div>

      <div className="rounded border border-accent p-5">
        {soon.length > 0 ? (
          <>
            <p className="flex items-center gap-2 font-semibold text-bone"><BellRinging size={18} className="text-accent" aria-hidden /> Coming up in the next 60 days</p>
            <ul className="mt-2 max-w-[30rem] text-sm text-mute">{soon.map((g) => <li key={g.id}><span className="text-bone">{g.org}, {g.name}:</span> {g.cycle}</li>)}</ul>
          </>
        ) : (
          <p className="text-sm text-mute">No dated deadlines in the next 60 days for {county || state}.</p>
        )}
        <button type="button" className="btn btn-ghost mt-4" aria-pressed={alerts} onClick={toggleAlerts}><BellRinging size={16} weight={alerts ? 'fill' : 'regular'} /> Deadline alerts</button>
        <p className="mt-2 min-h-5 max-w-[30rem] text-sm text-mute" role="status">{msg}</p>
      </div>

      {list.length === 0 ? (
        <p className="text-mute">Nothing matches that filter for {county || state}. Try Everything.</p>
      ) : (
        <ul className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2">
          {list.map((g) => (
            <li key={g.id} className="flex min-w-0 flex-col bg-ink p-5 md:[&:last-child:nth-child(odd)]:col-span-2">
              <p className="text-xs text-dim">{area(g)}{g.area.kind !== 'national' && <span className="ml-2 rounded-sm bg-accent px-1.5 font-semibold text-accent-ink">Near you</span>}</p>
              <h2 className="mt-1 font-semibold text-bone">{g.org}: {g.name}</h2>
              <p className="mt-2 max-w-[30rem] text-sm text-mute">{g.funds}</p>
              <dl className="mt-3 grid max-w-[34rem] grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-dim">Who</dt><dd className="text-bone">{g.who}</dd>
                {g.award && <><dt className="text-dim">Award</dt><dd className="text-bone">{g.award}</dd></>}
                <dt className="text-dim">When</dt><dd className="text-bone">{g.cycle}</dd>
                {g.fit && <><dt className="text-dim">Check</dt><dd className="text-bone">{g.fit}</dd></>}
              </dl>
              <a className="btn btn-ghost mt-4 self-start" href={g.url} target="_blank" rel="noreferrer">Official page <ArrowSquareOut size={14} aria-hidden /></a>
            </li>
          ))}
        </ul>
      )}
      <p className="max-w-[30rem] text-sm text-dim">Every program here was checked on its official page in October 2026. Rules and dates change, so confirm on the funder’s site before you apply. Know one we missed? Tell us from the school’s claim page.</p>
    </div>
  );
}
