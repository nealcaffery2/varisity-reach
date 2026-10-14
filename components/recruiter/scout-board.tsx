'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Diamond, Shuffle, Plant, MapPinLine } from '@phosphor-icons/react';
import type { BoardProspect } from '@/content/scout';
import { cornfed, diamondScore, scramble, smallestTown, watchLine } from '@/lib/scout';
import { myNeeds, schoolAttention } from '@/lib/community';
import { localRead, localWrite } from '@/lib/backend';

const pct = (n: number) => `${Math.round(n * 100)}`;

function Row({ p, right, note }: { p: BoardProspect; right: React.ReactNode; note?: string }) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-3 bg-ink px-4 py-3">
      <div className="min-w-0">
        <Link href={`/athletes/${p.slug}/`} className="link-u font-semibold text-bone">{p.name}</Link>
        {p.sample && <span className="ml-2 rounded-sm border border-line-2 px-1.5 text-[11px] text-dim">sample</span>}
        <p className="truncate text-sm text-mute">{p.position} · {p.gradYear} · {p.town}, {p.state}{note ? ` · ${note}` : ''}</p>
      </div>
      <div className="text-right">{right}</div>
    </li>
  );
}

export function ScoutBoard({ prospects }: { prospects: BoardProspect[] }) {
  const [watch, setWatch] = useState<Record<string, number>>({});
  const [pick, setPick] = useState<BoardProspect | null>(null);
  const [sport, setSport] = useState('');

  useEffect(() => {
    schoolAttention().then(setWatch);
  }, []);

  const pool = useMemo(() => prospects.map((p) => ({ ...p, watchers: watch[p.school] ?? 0 })).filter((p) => !sport || p.sport === sport), [prospects, watch, sport]);
  const sports = [...new Set(prospects.map((p) => p.sport))].sort();
  const diamonds = [...pool].sort((a, b) => diamondScore(b) - diamondScore(a)).slice(0, 6);
  const corn = [...pool].map((p) => ({ p, c: cornfed(p) })).sort((a, b) => b.c.score - a.c.score).slice(0, 6);
  const smallest = smallestTown(pool);

  // Schools: average production against how many recruiters looked this month.
  const schools = Object.values(
    pool.reduce<Record<string, { school: string; name: string; town: string; n: number; prod: number; watchers: number; enrollment?: number }>>((m, p) => {
      const s = (m[p.school] ??= { school: p.school, name: p.schoolName, town: `${p.town}, ${p.state}`, n: 0, prod: 0, watchers: p.watchers, enrollment: p.enrollment });
      s.n++;
      s.prod += p.production;
      return m;
    }, {}),
  )
    .map((s) => ({ ...s, prod: s.prod / s.n }))
    .sort((a, b) => diamondScore({ production: b.prod, watchers: b.watchers }) - diamondScore({ production: a.prod, watchers: a.watchers }));

  const doScramble = () => {
    const seen = new Set(localRead<string[]>('vr-scramble-seen', []));
    let next = scramble(pool, { needs: myNeeds() ?? undefined, seen, rand: Math.random });
    if (!next) {
      localWrite('vr-scramble-seen', []);
      next = scramble(pool, { needs: myNeeds() ?? undefined, seen: new Set(), rand: Math.random });
    }
    if (next) localWrite('vr-scramble-seen', [...seen, next.slug]);
    setPick(next ?? null);
  };

  return (
    <div className="grid gap-14">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="scout-sport" className="field-label">Sport</label>
          <select id="scout-sport" className="field w-auto" value={sport} onChange={(e) => { setSport(e.target.value); setPick(null); }}>
            <option value="">Every sport</option>
            {sports.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={doScramble}><Shuffle size={18} /> Scramble</button>
        <p className="max-w-md text-sm text-mute">One athlete to look into, picked from what you posted you need, never the same one twice in a row.</p>
      </div>

      {pick && (
        <div className="rounded border border-accent p-5" role="status">
          <p className="text-sm text-mute">Look into</p>
          <p className="display mt-1 text-5xl">{pick.name}</p>
          <p className="mt-2 text-mute">{pick.position}, class of {pick.gradYear}, {pick.schoolName} in {pick.town}, {pick.state}. Production {pct(pick.production)} of 100. {watchLine(pick.watchers)}.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href={`/athletes/${pick.slug}/`}>Open profile</Link>
            <button type="button" className="btn btn-ghost" onClick={doScramble}><Shuffle size={16} /> Another</button>
          </div>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="dia-h" className="min-w-0">
          <h2 id="dia-h" className="display flex items-center gap-3 text-4xl md:text-5xl"><Diamond size={30} className="text-accent" aria-hidden /> Diamonds in the fields</h2>
          <p className="mt-3 max-w-[34rem] text-mute">Big production, few recruiters. The score drops as more coaches look, so the list keeps pointing at kids nobody has called.</p>
          <ol className="mt-5 grid gap-px overflow-hidden rounded border border-line bg-line">
            {diamonds.map((p) => <Row key={p.slug} p={p} note={watchLine(p.watchers)} right={<span className="num text-2xl text-accent">{diamondScore(p)}</span>} />)}
          </ol>
        </section>

        <section aria-labelledby="corn-h" className="min-w-0">
          <h2 id="corn-h" className="display flex items-center gap-3 text-4xl md:text-5xl"><Plant size={30} className="text-accent" aria-hidden /> Cornfed</h2>
          <p className="mt-3 text-mute">Production scaled by how small the school is. Under 250 students earns the tag.</p>
          <ol className="mt-5 grid gap-px overflow-hidden rounded border border-line bg-line">
            {corn.map(({ p, c }) => (
              <Row key={p.slug} p={p} note={p.enrollment ? `${p.enrollment} students` : undefined} right={<span className="flex items-center gap-2">{c.cornfed && <span className="rounded-sm bg-accent px-1.5 text-xs font-semibold text-accent-ink">Cornfed</span>}<span className="num text-2xl text-bone">{c.score.toFixed(2)}</span></span>} />
            ))}
          </ol>
        </section>
      </div>

      {smallest && (
        <section aria-labelledby="small-h" className="grid gap-6 rounded border border-line bg-ink-2 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <MapPinLine size={56} className="text-accent" aria-hidden />
          <div className="min-w-0">
            <h2 id="small-h" className="text-sm font-semibold text-mute">Smallest Town Athlete of the Week</h2>
            <p className="display mt-1 text-5xl md:text-6xl"><Link className="link-u" href={`/athletes/${smallest.slug}/`}>{smallest.name}</Link></p>
            <p className="mt-2 text-mute">{smallest.position} at {smallest.schoolName}, {smallest.town}, {smallest.state}{smallest.enrollment ? `: ${smallest.enrollment} students in the whole school` : ''}. Picked from strong weeks on the network, smallest school first.{smallest.sample && ' Sample athlete.'}</p>
          </div>
        </section>
      )}

      <section aria-labelledby="sch-h" className="min-w-0">
        <h2 id="sch-h" className="display text-4xl md:text-5xl">Schools by stats and attention</h2>
        <p className="mt-3 max-w-[34rem] text-mute">Average production of each school’s athletes on the network, against how many verified recruiters opened one of their profiles in the last 30 days. Counts only; nobody sees who.</p>
        <div className="relative mt-5 overflow-x-auto rounded border border-line">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-ink-2 text-xs text-dim">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">School</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Athletes</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Production</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Recruiters, 30 days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {schools.map((s) => (
                <tr key={s.school}>
                  <th scope="row" className="px-3 py-3 font-semibold text-bone"><Link className="link-u" href={`/${s.school}/`}>{s.name}</Link><span className="block text-xs font-normal text-dim">{s.town}{s.enrollment ? ` · ${s.enrollment} students` : ''}</span></th>
                  <td className="num px-3 py-3 text-right text-mute">{s.n}</td>
                  <td className="num px-3 py-3 text-right text-bone">{pct(s.prod)}</td>
                  <td className={`num px-3 py-3 text-right ${s.watchers === 0 ? 'text-accent' : 'text-mute'}`}>{s.watchers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[30rem] text-sm text-dim">Production is each athlete’s latest season against the best mark in the same sport on the network. Every profile on the network today is a sample, so these numbers show how the board works, not real rankings.</p>
      </section>
    </div>
  );
}
