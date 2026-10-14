'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { athletes as ALL, fullName } from '@/content/athletes';
import { schools, schoolBySlug } from '@/content/schools';
import { sports } from '@/content/sports';
import { latest, leaders, usedKeys } from '@/lib/stats';
import { formatStat } from '@/lib/format';

const WITH_STATS = sports.filter((s) => usedKeys(ALL, s).length > 0);

export function StatsBoard() {
  const [slug, setSlug] = useState(WITH_STATS[0]?.slug ?? '');
  const [school, setSchool] = useState('');
  const athletes = useMemo(() => (school ? ALL.filter((a) => a.school === school) : ALL), [school]);
  const sport = WITH_STATS.find((s) => s.slug === slug) ?? WITH_STATS[0];
  const keys = useMemo(() => (sport ? usedKeys(athletes, sport) : []), [sport, athletes]);
  const [sortKey, setSortKey] = useState<string>('');
  const [asc, setAsc] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get('sport');
    const sc = p.get('school');
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q && WITH_STATS.some((s) => s.slug === q)) setSlug(q);
    if (sc && schoolBySlug(sc)) setSchool(sc);
  }, []);
  const sync = (s: string, sc: string) => window.history.replaceState(null, '', `?sport=${s}${sc ? `&school=${sc}` : ''}`);
  const pick = (s: string) => {
    setSlug(s);
    setSortKey('');
    sync(s, school);
  };

  if (!sport) return <p className="wrap py-16 text-mute">No stats posted yet.</p>;

  const k0 = keys.find((k) => k.key === sortKey) ?? keys[0] ?? sport.statKeys[0];
  const lower = asc !== Boolean(k0?.lowerWins);
  const rows = athletes
    .filter((a) => a.sports.includes(sport.slug) && keys.some((k) => latest(a, k.key)))
    .sort((a, b) => {
      const x = latest(a, k0.key)?.value;
      const y = latest(b, k0.key)?.value;
      if (x === undefined) return 1;
      if (y === undefined) return -1;
      return lower ? x - y : y - x;
    });

  return (
    <div className="wrap py-12 md:py-16">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Sport" data-lenis-prevent>
        {WITH_STATS.map((s) => (
          <button key={s.slug} role="tab" type="button" aria-selected={s.slug === sport.slug} className="chip shrink-0 whitespace-nowrap" onClick={() => pick(s.slug)}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="stats-school" className="field-label">School</label>
          <select id="stats-school" className="field w-auto" value={school} onChange={(e) => { setSchool(e.target.value); sync(sport.slug, e.target.value); }}>
            <option value="">Every school on the network</option>
            {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <h2 className="display mt-12 text-5xl md:text-7xl">{sport.name} <span className="text-accent">leaders</span></h2>
      {keys.length === 0 && <p className="mt-4 text-mute">No {sport.name.toLowerCase()} numbers posted for this school yet.</p>}
      <div className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {keys.slice(0, 4).map((k, i) => {
          const top = leaders(athletes, sport, k, 1)[0];
          return (
            <motion.div key={sport.slug + k.key} className="bg-ink p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <p className="text-sm text-mute">{k.long}</p>
              <p className="num mt-3 text-5xl text-accent">{top ? formatStat(top.value, k) : '–'}</p>
              {top && <Link href={`/athletes/${top.athlete.slug}/`} className="link-u mt-3 inline-block text-bone">{fullName(top.athlete)}</Link>}
              {top && <p className="text-xs text-dim">{top.year}</p>}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 overflow-x-auto rounded border border-line" data-lenis-prevent>
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">{sport.name} statistics, latest season, sortable</caption>
          <thead className="border-b border-line bg-ink-2">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mute">Athlete</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mute">Season</th>
              {keys.map((k) => (
                <th key={k.key} scope="col" className="px-4 py-3 text-right text-xs font-medium text-mute" aria-sort={k0.key === k.key ? (lower ? 'ascending' : 'descending') : undefined}>
                  <button type="button" title={k.long} onClick={() => (k0.key === k.key ? setAsc((v) => !v) : (setSortKey(k.key), setAsc(false)))} className={`inline-flex min-h-6 items-center gap-1 ${k0.key === k.key ? 'text-accent' : 'hover:text-bone'}`}>
                    {k.label}
                    {k0.key === k.key && (lower ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((a) => (
              <tr key={a.slug} className="hover:bg-ink-2">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <Link href={`/athletes/${a.slug}/`} className="link-u font-semibold text-bone">{fullName(a)}</Link>
                  <span className="block text-xs text-dim">{a.gradYear} · {a.position} · {schoolBySlug(a.school)?.town}, {schoolBySlug(a.school)?.state} {schoolBySlug(a.school)?.classification}</span>
                </th>
                <td className="num px-4 py-3 text-mute">{latest(a, k0.key)?.year ?? a.seasons[0]?.year}</td>
                {keys.map((k) => (
                  <td key={k.key} className={`num px-4 py-3 text-right ${k0.key === k.key ? 'text-bone' : 'text-mute'}`}>{formatStat(latest(a, k.key)?.value, k)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-dim">Latest season on file for each athlete. Coaches update numbers in <code className="num">content/athletes.ts</code>.</p>
    </div>
  );
}
