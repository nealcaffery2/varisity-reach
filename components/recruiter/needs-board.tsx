'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PaperPlaneTilt, X } from '@phosphor-icons/react';
import type { RecruiterBoardEntry } from '@/content/scout';
import { demoLinks, demoTapeAction, myNeeds, saveNeeds, sendTape, viewer, type MyNeeds, type Viewer } from '@/lib/community';

const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

function TapeForm({ recruiter, athletes, onDone }: { recruiter: string; athletes: string[]; onDone: (m: string) => void }) {
  const [athlete, setAthlete] = useState(athletes[0] ?? '');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <form
      className="mt-4 grid gap-3 border-t border-line pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await sendTape({ athlete, recruiter, url });
        setBusy(false);
        if (!r.ok) return setErr(r.reason);
        setUrl('');
        onDone(r.demo ? 'Tape sent (saved in this browser).' : 'Tape sent. You will hear if the coach watches it or asks for more.');
      }}
    >
      {athletes.length > 1 && (
        <div>
          <label htmlFor={`tp-a-${recruiter}`} className="field-label">Athlete</label>
          <select id={`tp-a-${recruiter}`} className="field" value={athlete} onChange={(e) => setAthlete(e.target.value)}>{athletes.map((a) => <option key={a}>{a}</option>)}</select>
        </div>
      )}
      <div>
        <label htmlFor={`tp-u-${recruiter}`} className="field-label">Link to the highlight tape</label>
        <input id={`tp-u-${recruiter}`} type="url" required className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.hudl.com/video/…" />
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button className="btn btn-primary" disabled={busy}><PaperPlaneTilt size={16} /> {busy ? 'Sending…' : 'Send tape'}</button>
      <p className="text-xs text-dim">Three tapes a season to each coach, two weeks apart. Once a coach watches one, wait for them to ask for more.</p>
    </form>
  );
}

function NeedsForm({ onSaved }: { onSaved: () => void }) {
  const cur = myNeeds();
  const [f, setF] = useState({
    program: cur?.program ?? '', division: cur?.division ?? 'D2', sports: (cur?.sports ?? []).join(', '), positions: (cur?.positions ?? []).join(', '),
    classes: (cur?.classes ?? []).join(', '), dontWant: (cur?.dontWant ?? []).join(', '), timeline: cur?.timeline ?? '', openToTapes: cur?.openToTapes ?? true,
  });
  const [msg, setMsg] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });
  return (
    <form
      className="grid gap-4 rounded border border-accent/40 p-6 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const n: MyNeeds = { program: f.program, division: f.division as MyNeeds['division'], sports: list(f.sports), positions: list(f.positions), classes: list(f.classes).map(Number).filter(Boolean), dontWant: list(f.dontWant), timeline: f.timeline, openToTapes: f.openToTapes };
        const r = await saveNeeds(n);
        setMsg(r.ok ? 'Posted. Families see it on this board.' : r.reason);
        if (r.ok) onSaved();
      }}
    >
      <h3 className="display text-3xl md:col-span-2">What you need next season</h3>
      <div><label htmlFor="nd-p" className="field-label">Program</label><input id="nd-p" required className="field" value={f.program} onChange={set('program')} /></div>
      <div><label htmlFor="nd-d" className="field-label">Division</label><select id="nd-d" className="field" value={f.division} onChange={set('division')}>{['D1', 'D2', 'D3', 'NAIA', 'JUCO'].map((d) => <option key={d}>{d}</option>)}</select></div>
      <div><label htmlFor="nd-s" className="field-label">Sports, comma separated</label><input id="nd-s" className="field" value={f.sports} onChange={set('sports')} /></div>
      <div><label htmlFor="nd-pos" className="field-label">Positions you want</label><input id="nd-pos" className="field" value={f.positions} onChange={set('positions')} /></div>
      <div><label htmlFor="nd-c" className="field-label">Classes</label><input id="nd-c" className="field" inputMode="numeric" value={f.classes} onChange={set('classes')} /></div>
      <div><label htmlFor="nd-x" className="field-label">Don’t want right now</label><input id="nd-x" className="field" value={f.dontWant} onChange={set('dontWant')} /></div>
      <div className="md:col-span-2"><label htmlFor="nd-t" className="field-label">Timeline</label><textarea id="nd-t" className="field min-h-20" maxLength={500} value={f.timeline} onChange={set('timeline')} /></div>
      <label className="flex min-h-11 items-center gap-3 text-sm text-bone md:col-span-2"><input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={f.openToTapes} onChange={set('openToTapes')} /> Taking highlight tapes</label>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2"><button className="btn btn-primary">Post needs</button><p className="text-sm text-mute" role="status">{msg}</p></div>
    </form>
  );
}

/** Recruiters post what they need and when; families see it and send a tape where it fits. */
export function NeedsBoard({ entries }: { entries: RecruiterBoardEntry[] }) {
  const [v, setV] = useState<Viewer | null>(null);
  const [mine, setMine] = useState<MyNeeds | null>(null);
  const [family, setFamily] = useState<string[]>([]);
  const [open, setOpen] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    viewer().then(setV);
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(myNeeds());
    setFamily(demoLinks().map((l) => l.athlete));
  }, []);

  const recruiter = v?.role === 'recruiter' && v.verified;
  const isFamily = family.length > 0 || v?.role === 'parent' || v?.role === 'athlete';
  const all: RecruiterBoardEntry[] = [...(mine ? [{ ...mine, id: 'mine', coach: 'You', sample: true as const }] : []), ...entries];

  return (
    <div className="grid gap-8">
      {recruiter && <NeedsForm onSaved={() => setMine(myNeeds())} />}
      <ul className="grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2">
        {all.map((n) => (
          <li key={n.id} className="min-w-0 bg-ink p-5 md:[&:last-child:nth-child(odd)]:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-bone">{n.program}</h3>
              <span className="num text-sm text-mute">{n.division}</span>
            </div>
            <p className="text-sm text-dim">{n.coach}{n.sample && n.id !== 'mine' ? ' · sample post' : ''}</p>
            <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-mute">Wants</dt><dd className="text-bone">{n.positions.join(', ') || 'Any position'}</dd>
              <dt className="text-mute">Classes</dt><dd className="num text-bone">{n.classes.join(', ') || 'Any'}</dd>
              {n.minHeightIn ? <><dt className="text-mute">Height</dt><dd className="num text-bone">{Math.floor(n.minHeightIn / 12)}-{n.minHeightIn % 12} and up</dd></> : null}
              {n.minGpa ? <><dt className="text-mute">GPA</dt><dd className="num text-bone">{n.minGpa.toFixed(1)} and up</dd></> : null}
              {n.dontWant.length > 0 && <><dt className="text-mute">Not now</dt><dd className="text-bone">{n.dontWant.join(', ')}</dd></>}
            </dl>
            <p className="mt-3 text-sm text-mute">{n.timeline}</p>
            {isFamily && n.openToTapes && n.id !== 'mine' && (
              open === n.id ? (
                <>
                  <TapeForm recruiter={n.id} athletes={family.length ? family : ['your athlete']} onDone={(m) => { setMsg(m); setOpen(''); }} />
                  <button type="button" aria-label="Close tape form" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-dim hover:text-bone" onClick={() => setOpen('')}><X size={14} /> Close</button>
                </>
              ) : (
                <button type="button" className="btn btn-ghost mt-4" onClick={() => setOpen(n.id)}><PaperPlaneTilt size={16} /> Send a tape</button>
              )
            )}
            {!n.openToTapes && <p className="mt-4 text-sm text-dim">Not taking tapes right now.</p>}
            {v?.demo && n.id !== 'mine' && family[0] && (
              <p className="mt-3 flex flex-wrap gap-3 text-xs text-dim">
                Try the coach’s side:
                <button type="button" className="link-u" onClick={() => { demoTapeAction(family[0], n.id, 'seen'); setMsg('Marked your last tape as watched.'); }}>mark watched</button>
                <button type="button" className="link-u" onClick={() => { demoTapeAction(family[0], n.id, 'more'); setMsg('The coach asked for more.'); }}>ask for more</button>
              </p>
            )}
          </li>
        ))}
      </ul>
      {!isFamily && <p className="text-sm text-mute">Athletes and parents: link your account to a profile on the <Link className="link-u text-bone" href="/family/">family page</Link> to send tapes.</p>}
      <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
    </div>
  );
}
