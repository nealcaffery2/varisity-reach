'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SLOTS, canPlace, type Slot, type Squad } from '@/lib/fantasy';
import { mySquad, saveSquad } from '@/lib/community';

export type FantasyAthlete = { slug: string; name: string; school: string; position: string; sample: boolean };

/** Free fantasy: five slots, athletes whose families put them on the network. No money, no prizes. */
export function FantasySquad({ conf, pool }: { conf: string; pool: FantasyAthlete[] }) {
  const [name, setName] = useState('');
  const [squad, setSquad] = useState<Squad>({});
  const [errors, setErrors] = useState<Partial<Record<Slot, string>>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = mySquad(conf);
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(s.name);
    setSquad(s.squad);
  }, [conf]);

  const place = (slot: Slot, slug: string) => {
    const next = { ...squad };
    if (!slug) {
      delete next[slot];
      setSquad(next);
      setErrors((e) => ({ ...e, [slot]: undefined }));
      return;
    }
    const a = pool.find((p) => p.slug === slug)!;
    const ok = canPlace(squad, slot, slug, a.position);
    setErrors((e) => ({ ...e, [slot]: ok.ok ? undefined : ok.reason }));
    if (ok.ok) setSquad({ ...next, [slot]: slug });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await saveSquad(conf, name.trim(), squad);
    setBusy(false);
    setMsg(r.ok ? (r.demo ? 'Squad saved in this browser.' : 'Squad saved.') : r.reason);
  };

  const filled = Object.values(squad).filter(Boolean).length;

  if (!pool.length) {
    return <p className="text-mute">No athletes from this conference are on the network yet. When families add a profile, they show up here.</p>;
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <div className="max-w-sm">
        <label htmlFor="squad-name" className="field-label">Squad name</label>
        <input id="squad-name" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>
      <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {SLOTS.map((s) => {
          const eligible = pool.filter((p) => s.fits.test(p.position));
          return (
            <li key={s.slot} className="min-w-0 bg-ink p-4">
              <label htmlFor={`slot-${s.slot}`} className="field-label">{s.label}</label>
              <select id={`slot-${s.slot}`} className="field" value={squad[s.slot] ?? ''} onChange={(e) => place(s.slot, e.target.value)} aria-invalid={Boolean(errors[s.slot])}>
                <option value="">Open</option>
                {eligible.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}, {p.school}{p.sample ? ' (sample)' : ''}</option>
                ))}
              </select>
              {errors[s.slot] && <p className="mt-2 text-sm text-danger">{errors[s.slot]}</p>}
              {squad[s.slot] && <Link className="link-u mt-2 inline-block text-sm text-mute" href={`/athletes/${squad[s.slot]}/`}>View profile</Link>}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={busy || filled === 0}>{busy ? 'Saving…' : 'Save squad'}</button>
        <p className="num text-sm text-mute">{filled}/5 filled</p>
        <p className="text-sm text-mute" role="status">{msg}</p>
      </div>
      <p className="max-w-[30rem] text-sm text-dim">
        Points come from the stat lines coaches post after each game: a rushing or receiving touchdown is 6, ten yards is 1, a tackle is 1, a sack 2. It is free and stays free. Nobody pays to play and nobody wins money, because the players are high school kids.
      </p>
    </form>
  );
}
