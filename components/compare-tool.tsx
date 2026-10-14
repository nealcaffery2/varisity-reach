'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Info, LinkSimple, Check } from '@phosphor-icons/react';
import { athletes, athleteBySlug, fullName } from '@/content/athletes';
import { benchmarks, benchmarkById, type Benchmark } from '@/content/benchmarks';
import { sportBySlug } from '@/content/sports';
import { schoolBySlug } from '@/content/schools';
import { compareRows, sideFromAthlete, tally, type CompareSide } from '@/lib/compare';

const DEFAULT_A = 'deshawn-pruitt';

/** Right-hand choice: a reference recruit ("b:id") or another athlete ("a:slug"). */
type Other = { side: CompareSide; sample: boolean; ref?: Benchmark };

function sideFor(choice: string): Other | null {
  const [kind, id] = choice.split(':');
  if (kind === 'b') {
    const b = benchmarkById(id);
    return b ? { side: b, sample: b.sample, ref: b } : null;
  }
  const a = athleteBySlug(id);
  return a ? { side: sideFromAthlete(a), sample: a.sample } : null;
}

export function CompareTool() {
  const [aSlug, setA] = useState(DEFAULT_A);
  const [right, setRight] = useState('b:rb-4star');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const a = p.get('a');
    const vs = p.get('vs');
    const ath = a ? athleteBySlug(a) : undefined;
    if (ath) {
      // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setA(ath.slug);
      const first = benchmarks.find((b) => b.sport === ath.sports[0]);
      setRight(vs && sideFor(vs) ? vs : first ? `b:${first.id}` : `a:${athletes.find((x) => x.slug !== ath.slug && x.sports[0] === ath.sports[0])?.slug ?? ''}`);
    }
  }, []);

  const athlete = athleteBySlug(aSlug)!;
  const sport = sportBySlug(athlete.sports[0])!;
  const other = sideFor(right);
  const rows = useMemo(() => (other ? compareRows(sideFromAthlete(athlete), other.side, sport.statKeys) : []), [athlete, other, sport]);
  const score = tally(rows);
  const school = schoolBySlug(athlete.school);
  const choices = [
    ...benchmarks.filter((b) => b.sport === sport.slug).map((b) => ({ value: `b:${b.id}`, label: `${b.level}: ${b.label}, ${b.college}` })),
    ...athletes.filter((x) => x.slug !== athlete.slug && x.sports.includes(sport.slug)).map((x) => ({ value: `a:${x.slug}`, label: `${fullName(x)}, ${schoolBySlug(x.school)?.town}` })),
  ];

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?a=${aSlug}&vs=${right}`;
    window.history.replaceState(null, '', `?a=${aSlug}&vs=${right}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  return (
    <div className="wrap py-12">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div>
          <label htmlFor="cmp-a" className="field-label">Small-school athlete</label>
          <select
            id="cmp-a"
            className="field"
            value={aSlug}
            onChange={(e) => {
              const next = athleteBySlug(e.target.value)!;
              setA(next.slug);
              const first = benchmarks.find((b) => b.sport === next.sports[0]);
              const peer = athletes.find((x) => x.slug !== next.slug && x.sports.includes(next.sports[0]));
              setRight(first ? `b:${first.id}` : peer ? `a:${peer.slug}` : '');
            }}
          >
            {athletes.map((x) => <option key={x.slug} value={x.slug}>{fullName(x)} · {sportBySlug(x.sports[0])?.short} · {schoolBySlug(x.school)?.town} {schoolBySlug(x.school)?.classification}</option>)}
          </select>
        </div>
        <span className="display hidden pb-2 text-3xl text-dim md:block" aria-hidden>vs</span>
        <div>
          <label htmlFor="cmp-b" className="field-label">Compare with</label>
          <select id="cmp-b" className="field" value={right} onChange={(e) => setRight(e.target.value)} disabled={!choices.length}>
            {!choices.length && <option value="">Nobody else in this sport yet</option>}
            {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {other && rows.length > 0 ? (
        <>
          <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-end gap-4 border-b border-line pb-6">
            <div>
              <Link href={`/athletes/${athlete.slug}/`} className="display text-3xl text-bone hover:text-accent sm:text-4xl md:text-6xl">{fullName(athlete)}</Link>
              <p className="mt-1 text-sm text-mute">{school?.name} · {school?.classification}{school?.enrollment ? ` · ${school.enrollment} students` : ''}</p>
            </div>
            <p className="display whitespace-nowrap pb-1 text-center text-4xl md:text-7xl" aria-label={`${score.a} to ${score.b}`}>
              <span className="text-accent">{score.a}</span>
              <span className="text-dim">–</span>
              <span className="text-bone">{score.b}</span>
            </p>
            <div className="text-right">
              <p className="display text-3xl text-bone sm:text-4xl md:text-6xl">{other.side.label}</p>
              {other.ref ? (
                <p className="mt-1 text-sm text-mute">{other.ref.level} · {other.ref.school} · signed with {other.ref.college}</p>
              ) : (
                other.sample && <p className="mt-1 text-sm text-dim">Sample athlete</p>
              )}
            </div>
          </div>
          <table className="mt-2 w-full">
            <caption className="sr-only">{fullName(athlete)} compared with {other.side.label}</caption>
            <thead className="sr-only">
              <tr><th scope="col">{fullName(athlete)}</th><th scope="col">Measure</th><th scope="col">{other.side.label}</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => {
                const max = Math.max(r.a ?? 0, r.b ?? 0) || 1;
                return (
                  <tr key={r.label}>
                    <td className="w-[42%] py-3">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`num text-lg ${r.edge === 'a' ? 'text-accent' : 'text-bone'}`}>{r.aText}</span>
                        <span className="hidden h-2 w-40 justify-end overflow-hidden rounded-full bg-line sm:flex" aria-hidden>
                          <motion.span className={`block h-full rounded-full ${r.edge === 'a' ? 'bg-accent' : 'bg-line-2'}`} initial={{ width: 0 }} whileInView={{ width: `${((r.a ?? 0) / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                        </span>
                      </div>
                    </td>
                    <th scope="row" className="px-3 py-3 text-center text-sm font-normal text-mute">{r.label}</th>
                    <td className="w-[42%] py-3">
                      <div className="flex items-center gap-3">
                        <span className="hidden h-2 w-40 overflow-hidden rounded-full bg-line sm:block" aria-hidden>
                          <motion.span className={`block h-full rounded-full ${r.edge === 'b' ? 'bg-bone' : 'bg-line-2'}`} initial={{ width: 0 }} whileInView={{ width: `${((r.b ?? 0) / max) * 100}%` }} viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                        </span>
                        <span className={`num text-lg ${r.edge === 'b' ? 'text-bone' : 'text-mute'}`}>{r.bText}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-primary" onClick={share}>{copied ? <><Check size={18} /> Copied</> : <><LinkSimple size={18} /> Share this comparison</>}</button>
            <Link href={`/athletes/${athlete.slug}/`} className="btn btn-ghost">Full profile</Link>
          </div>
          <p className="mt-6 flex max-w-2xl gap-2 text-sm text-dim">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              {other.ref ? (
                <>
                  {other.ref.label}: Class of 2025, high school senior season{other.ref.note ? `. ${other.ref.note}` : ''}. Sources:{' '}
                  {other.ref.sources.map((src, i) => (
                    <span key={src.url}>{i > 0 && ', '}<a href={src.url} target="_blank" rel="noreferrer" className="link-u text-mute hover:text-bone">{src.label}</a></span>
                  ))}
                  .{' '}
                </>
              ) : null}
              Stats are season totals; small schools often play fewer games, which this table does not adjust for.
            </span>
          </p>
        </>
      ) : (
        <div className="mt-10 rounded border border-dashed border-line-2 p-10">
          <p className="display text-4xl">Nothing to line up yet</p>
          <p className="mt-3 max-w-md text-mute">This athlete and the other side share no measurables or stats. Pick another comparison.</p>
        </div>
      )}
    </div>
  );
}
