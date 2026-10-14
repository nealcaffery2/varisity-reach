'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, Check, FunnelSimple, LinkSimple, Rows, SquaresFour, X } from '@phosphor-icons/react';
import { athletes, fullName } from '@/content/athletes';
import { sports, sportBySlug } from '@/content/sports';
import { EMPTY, activeCount, applyFilters, parseFilters, serializeFilters, type Filters, type SortKey } from '@/lib/filters';
import { feetInches, gpa } from '@/lib/format';
import { AthleteCard } from './athlete-card';

const YEARS = [...new Set(athletes.map((a) => a.gradYear))].sort();
const HEIGHTS = Array.from({ length: 25 }, (_, i) => 60 + i); // 5'0" to 7'0"
const SPORTS_ON_BOARD = sports.filter((s) => athletes.some((a) => a.sports.includes(s.slug)));

export function RecruitBoard() {
  const [f, setF] = useState<Filters>(EMPTY);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  // Read the search out of the URL once, then keep the URL in step so the
  // address bar is always a link to exactly this search.
  useEffect(() => {
    setF(parseFilters(new URLSearchParams(window.location.search)));
    try { if (localStorage.getItem('board-view') === 'table') setView('table'); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const qs = serializeFilters(f);
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [f, ready]);
  useEffect(() => {
    try { localStorage.setItem('board-view', view); } catch {}
  }, [view]);

  const results = useMemo(() => applyFilters(athletes, f), [f]);
  const n = activeCount(f);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', window.location.href);
    }
  };

  const sortBy = (k: SortKey) =>
    setF((x) => ({ ...x, sort: k, dir: x.sort === k ? (x.dir === 'asc' ? 'desc' : 'asc') : k === 'name' ? 'asc' : 'desc' }));

  const panel = (
    <div className="space-y-7">
      <div>
        <label htmlFor="q" className="field-label">Search</label>
        <input id="q" type="search" className="field" value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Name, position, town or major" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="sport" className="field-label">Sport</label>
        <select id="sport" className="field" value={f.sport} onChange={(e) => set('sport', e.target.value)}>
          <option value="">All sports</option>
          {SPORTS_ON_BOARD.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className="field-label">Class</legend>
        <div className="flex flex-wrap gap-2">
          {YEARS.map((y) => {
            const on = f.grad.includes(y);
            return (
              <button key={y} type="button" className="chip" aria-pressed={on} onClick={() => set('grad', on ? f.grad.filter((g) => g !== y) : [...f.grad, y])}>
                {on && <Check size={12} weight="bold" />}{y}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="gpa" className="field-label">Minimum GPA</label>
          <span className="num text-sm text-bone">{f.minGpa ? gpa(f.minGpa) : 'Any'}</span>
        </div>
        <input id="gpa" type="range" min={0} max={4} step={0.05} value={f.minGpa} onChange={(e) => set('minGpa', Number(e.target.value))} className="w-full" />
      </div>
      <fieldset>
        <legend className="field-label">Height</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="hmin">Minimum height</label>
          <select id="hmin" className="field" value={f.minHeight} onChange={(e) => set('minHeight', Number(e.target.value))}>
            <option value={0}>Min</option>
            {HEIGHTS.map((h) => <option key={h} value={h}>{feetInches(h)}</option>)}
          </select>
          <label className="sr-only" htmlFor="hmax">Maximum height</label>
          <select id="hmax" className="field" value={f.maxHeight} onChange={(e) => set('maxHeight', Number(e.target.value))}>
            <option value={0}>Max</option>
            {HEIGHTS.map((h) => <option key={h} value={h}>{feetInches(h)}</option>)}
          </select>
        </div>
      </fieldset>
      <fieldset>
        <legend className="field-label">Weight (lb)</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="wmin">Minimum weight</label>
          <input id="wmin" type="number" inputMode="numeric" min={0} className="field num" placeholder="Min" value={f.minWeight || ''} onChange={(e) => set('minWeight', Number(e.target.value) || 0)} />
          <label className="sr-only" htmlFor="wmax">Maximum weight</label>
          <input id="wmax" type="number" inputMode="numeric" min={0} className="field num" placeholder="Max" value={f.maxWeight || ''} onChange={(e) => set('maxWeight', Number(e.target.value) || 0)} />
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-bone">
        <input type="checkbox" className="h-4 w-4" checked={f.ncaa} onChange={(e) => set('ncaa', e.target.checked)} />
        NCAA Eligibility Center registered
      </label>
      <button type="button" className="btn btn-ghost w-full" onClick={() => setF(EMPTY)} disabled={n === 0}>Clear filters</button>
    </div>
  );

  const th = (k: SortKey | null, label: string, cls = '') => (
    <th scope="col" className={`whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-mute ${cls}`} aria-sort={k && f.sort === k ? (f.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      {k ? (
        <button type="button" onClick={() => sortBy(k)} className="inline-flex min-h-6 items-center gap-1 hover:text-bone">
          {label}
          {f.sort === k && (f.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </button>
      ) : label}
    </th>
  );

  return (
    <div className="wrap grid gap-10 py-12 lg:grid-cols-[17rem_1fr] lg:py-16">
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Filters">{panel}</aside>

      <div className="min-w-0">
        <h2 className="sr-only">Results</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-mute" aria-live="polite">
            <span className="num text-bone">{results.length}</span> {results.length === 1 ? 'athlete' : 'athletes'}
            {n > 0 && <> · {n} {n === 1 ? 'filter' : 'filters'}</>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-ghost lg:hidden" onClick={() => setSheet(true)}>
              <FunnelSimple size={18} /> Filters{n > 0 && <span className="num rounded-full bg-orange px-1.5 text-xs text-orange-ink">{n}</span>}
            </button>
            <select aria-label="Sort by" className="field h-11 w-auto" value={`${f.sort}:${f.dir}`} onChange={(e) => { const [s, d] = e.target.value.split(':'); setF((x) => ({ ...x, sort: s as SortKey, dir: d as 'asc' | 'desc' })); }}>
              <option value="gpa:desc">GPA, high to low</option>
              <option value="height:desc">Tallest first</option>
              <option value="weight:desc">Heaviest first</option>
              <option value="grad:asc">Class, soonest first</option>
              <option value="name:asc">Name, A to Z</option>
            </select>
            <div className="flex rounded border border-line-2" role="group" aria-label="View">
              <button type="button" aria-label="Card view" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={`inline-flex h-11 w-11 items-center justify-center ${view === 'grid' ? 'bg-ink-3 text-bone' : 'text-dim hover:text-bone'}`}><SquaresFour size={18} /></button>
              <button type="button" aria-label="Table view" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`inline-flex h-11 w-11 items-center justify-center ${view === 'table' ? 'bg-ink-3 text-bone' : 'text-dim hover:text-bone'}`}><Rows size={18} /></button>
            </div>
            <button type="button" onClick={share} className="btn btn-ghost" aria-live="polite">
              {copied ? <><Check size={18} /> Copied</> : <><LinkSimple size={18} /> <span className="hidden sm:inline">Share search</span><span className="sm:hidden">Share</span></>}
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading athletes">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[26rem] animate-pulse rounded border border-line bg-ink-2" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-6 rounded border border-dashed border-line-2 p-10 text-center">
            <p className="display text-4xl">No one fits that search</p>
            <p className="mx-auto mt-3 max-w-md text-mute">Loosen a filter or two. GPA and height ranges narrow the board the fastest.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={() => setF(EMPTY)}>Clear filters</button>
          </div>
        ) : view === 'grid' ? (
          <motion.ul layout className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((a) => (
                <motion.li key={a.slug} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                  <AthleteCard a={a} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <div className="mt-6 overflow-x-auto rounded border border-line" data-lenis-prevent>
            <table className="w-full min-w-[52rem] text-sm">
              <caption className="sr-only">Recruits matching the current filters</caption>
              <thead className="border-b border-line bg-ink-2">
                <tr>
                  {th('name', 'Athlete')}
                  {th(null, 'Sport')}
                  {th(null, 'Pos')}
                  {th('grad', 'Class')}
                  {th('height', 'Ht', 'text-right')}
                  {th('weight', 'Wt', 'text-right')}
                  {th('gpa', 'GPA', 'text-right')}
                  {th(null, 'ACT', 'text-right')}
                  {th(null, 'NCAA')}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((a) => (
                  <tr key={a.slug} className="transition-colors hover:bg-ink-2">
                    <td className="px-4 py-3">
                      <Link href={`/athletes/${a.slug}/`} className="link-u font-semibold text-bone">{fullName(a)}</Link>
                      {a.sample && <span className="ml-2 text-xs text-dim">sample</span>}
                    </td>
                    <td className="px-4 py-3 text-mute">{sportBySlug(a.sports[0])?.short}</td>
                    <td className="px-4 py-3 text-mute">{a.position}</td>
                    <td className="num px-4 py-3 text-mute">{a.gradYear}</td>
                    <td className="num px-4 py-3 text-right text-bone">{feetInches(a.heightIn)}</td>
                    <td className="num px-4 py-3 text-right text-bone">{a.weightLb}</td>
                    <td className="num px-4 py-3 text-right text-orange">{gpa(a.gpa)}</td>
                    <td className="num px-4 py-3 text-right text-bone">{a.act ?? '–'}</td>
                    <td className="px-4 py-3 text-mute">{a.ncaaEligibility ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close filters" className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setSheet(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              data-lenis-prevent
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-lg border-t border-line bg-ink-2 p-5 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="display text-3xl">Filters</h2>
                <button type="button" aria-label="Close filters" className="inline-flex h-11 w-11 items-center justify-center" onClick={() => setSheet(false)}><X size={22} /></button>
              </div>
              {panel}
              <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setSheet(false)}>Show {results.length} {results.length === 1 ? 'athlete' : 'athletes'}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
