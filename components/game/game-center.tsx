'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Broadcast, Camera, Check, CopySimple, Info, Minus, Plus, SealCheck, ShieldCheck, Warning, X } from '@phosphor-icons/react';
import type { Game } from '@/content/games';
import { seedReports } from '@/content/games';
import { athleteBySlug, fullName } from '@/content/athletes';
import { consensus, gameWindow, sourceLine, type Board, type Report } from '@/lib/consensus';
import { isLive, listReports, submitReport, watchReports } from '@/lib/backend';
import { Scorebug } from './scorebug';
import { StreamPanel } from './stream-panel';
import { asset } from '@/lib/asset';

const PERIODS: Record<string, string[]> = {
  football: ['Q1', 'Q2', 'Half', 'Q3', 'Q4', 'OT', 'Final'],
  'girls-flag-football': ['1st half', 'Half', '2nd half', 'Final'],
  'boys-basketball': ['Q1', 'Q2', 'Half', 'Q3', 'Q4', 'OT', 'Final'],
  'girls-basketball': ['Q1', 'Q2', 'Half', 'Q3', 'Q4', 'OT', 'Final'],
  volleyball: ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5', 'Final'],
  wrestling: ['Match in progress', 'Final'],
};

/** Seed plus live reports for a game, folded into the board. Shared by the game page and the overlay. */
export function useGameBoard(game: Game) {
  const [kickoff, setKickoff] = useState(() => Date.parse(game.kickoff));
  const [now, setNow] = useState(() => Date.parse(game.kickoff) + (game.liveDemo?.minutesIn ?? 0) * 60_000);
  const [extra, setExtra] = useState<Report[]>([]);
  const [prev, setPrev] = useState<Board | undefined>();

  // Demo live games start relative to when you open the page, so they read as live.
  useEffect(() => {
    const t = Date.now();
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (game.liveDemo) setKickoff(t - game.liveDemo.minutesIn * 60_000);
    setNow(t);
    const id = setInterval(() => setNow(Date.now()), 15_000);
    listReports(game.id).then(setExtra).catch(() => {});
    const stop = watchReports(game.id, (r) => setExtra((x) => [...x, r]));
    return () => {
      clearInterval(id);
      stop();
    };
  }, [game.id, game.liveDemo]);

  const win = useMemo(() => gameWindow(kickoff), [kickoff]);
  const reports = useMemo(() => [...seedReports(game, kickoff), ...extra], [game, kickoff, extra]);
  const board = useMemo(() => consensus(reports, game.status === 'final' ? kickoff + 400 * 60_000 : now, win, prev), [reports, now, win, prev, game.status, kickoff]);
  useEffect(() => {
    // Remember the last trustworthy score so a thin lower report cannot drag it back.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (board.status === 'confirmed' || board.status === 'locked') setPrev((p) => (p && p.home === board.home && p.away === board.away && p.status === board.status ? p : board));
  }, [board]);

  return { board, now, win, kickoff, addReport: (r: Report) => setExtra((x) => [...x, r]) };
}

export function GameCenter({ game }: { game: Game }) {
  const { board, now, win, addReport } = useGameBoard(game);
  const [sheet, setSheet] = useState(false);
  const canReport = game.status !== 'scheduled' || now >= win.start;
  const spotlight = (game.spotlight ?? []).map(athleteBySlug).filter((a) => a !== undefined);

  return (
    <div className="space-y-8">
      <div className="sticky top-16 z-30 -mx-4 bg-ink/80 px-4 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Scorebug game={game} board={board} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="inline-flex items-center gap-2 text-mute" aria-live="polite">
            {board.status === 'locked' ? <SealCheck size={16} weight="fill" className="text-accent" /> : board.status === 'confirmed' ? <ShieldCheck size={16} className="text-accent" /> : <Warning size={16} className="text-dim" />}
            {sourceLine(board)}
          </p>
          {board.status !== 'none' && board.status !== 'locked' && (
            <div className="flex items-center gap-2" aria-hidden>
              <span className="text-xs text-dim">Agreement</span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                <motion.span className="block h-full rounded-full bg-accent" animate={{ width: `${Math.round(board.confidence * 100)}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          <StreamPanel game={game} />

          {game.plays.length > 0 && (
            <section aria-labelledby="plays-h">
              <h2 id="plays-h" className="display text-3xl">Plays</h2>
              <ol className="mt-4 divide-y divide-line border-y border-line">
                {[...game.plays].reverse().map((p) => {
                  const a = p.athlete ? athleteBySlug(p.athlete) : undefined;
                  return (
                    <li key={p.atMin + p.text} className="flex gap-4 py-3">
                      <span className="num w-12 shrink-0 text-sm text-dim">{p.atMin}′</span>
                      <span className="text-bone">
                        {p.text}
                        {a && <Link href={`/athletes/${a.slug}/`} className="link-u ml-2 text-sm text-accent">Profile</Link>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded border border-line bg-ink-2 p-5" aria-labelledby="report-h">
            <h2 id="report-h" className="display text-3xl">At the game?</h2>
            <p className="mt-2 text-sm text-mute">Report the score from the stands. A photo of the scoreboard makes your report count for more.</p>
            <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setSheet(true)} disabled={!canReport}>
              <Broadcast size={18} /> Report the score
            </button>
            {!canReport && <p className="mt-2 text-xs text-dim">Opens 30 minutes before the start.</p>}
            <details className="mt-4 text-sm text-mute">
              <summary className="cursor-pointer text-bone">How the score is decided</summary>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>A verified coach or official scorer can lock it.</li>
                <li>Otherwise the score most people report wins, weighted by each reporter’s track record.</li>
                <li>A verified scoreboard photo counts double.</li>
                <li>Reports from outside the game window, and repeat reports from one phone, do not stack.</li>
                <li>Fakers lose weight on every game they get wrong.</li>
              </ul>
            </details>
          </section>

          <OverlayCard gameId={game.id} />

          {spotlight.length > 0 && (
            <section aria-labelledby="spot-h">
              <h2 id="spot-h" className="display text-3xl">Spotlight</h2>
              <ul className="mt-3 space-y-2">
                {spotlight.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/athletes/${a.slug}/`} className="flex items-center gap-3 rounded border border-line p-3 transition-colors hover:border-line-2">
                      <span className="display inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent text-lg text-accent">{a.jersey}</span>
                      <span>
                        <span className="block font-semibold text-bone">{fullName(a)}</span>
                        <span className="block text-sm text-mute">{a.gradYear} · {a.position}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!isLive && (
            <p className="flex gap-2 text-xs text-dim">
              <Info size={14} className="mt-0.5 shrink-0" /> Demo mode: your reports stay in this browser. Connect Supabase to share them with everyone at the game.
            </p>
          )}
        </aside>
      </div>

      <ReportSheet open={sheet} onClose={() => setSheet(false)} game={game} board={board} onSent={addReport} />
    </div>
  );
}

function OverlayCard({ gameId }: { gameId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${asset(`/overlay/${gameId}/`)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this overlay link', url);
    }
  };
  return (
    <section className="rounded border border-line p-5" aria-labelledby="overlay-h">
      <h2 id="overlay-h" className="display text-3xl">Streaming this game?</h2>
      <p className="mt-2 text-sm text-mute">
        Put this scoreboard on your stream. Add the overlay link as a browser source in OBS, Streamlabs or Prism, sized 1280 by 200. It updates as the stands report.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? <><Check size={16} /> Copied</> : <><CopySimple size={16} /> Copy overlay link</>}</button>
        <Link href={`/overlay/${gameId}/`} className="btn btn-ghost">Preview</Link>
      </div>
    </section>
  );
}

function Stepper({ label, value, onChange, id }: { label: string; value: number; onChange: (n: number) => void; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="flex items-stretch gap-2">
        <button type="button" aria-label={`Lower ${label} score`} className="inline-flex h-14 w-12 items-center justify-center rounded border border-line-2 text-bone hover:bg-ink-3" onClick={() => onChange(Math.max(0, value - 1))}><Minus size={18} /></button>
        <input id={id} type="number" inputMode="numeric" min={0} max={300} value={value} onChange={(e) => onChange(Math.max(0, Math.min(300, Number(e.target.value) || 0)))} className="field num h-14 flex-1 text-center text-3xl" />
        <button type="button" aria-label={`Raise ${label} score`} className="inline-flex h-14 w-12 items-center justify-center rounded border border-line-2 text-bone hover:bg-ink-3" onClick={() => onChange(value + 1)}><Plus size={18} /></button>
      </div>
    </div>
  );
}

function ReportSheet({ open, onClose, game, board, onSent }: { open: boolean; onClose: () => void; game: Game; board: Board; onSent: (r: Report) => void }) {
  const [home, setHome] = useState(board.home);
  const [away, setAway] = useState(board.away);
  const [period, setPeriod] = useState(board.period ?? '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [lock, setLock] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const periods = PERIODS[game.sport] ?? ['In progress', 'Final'];

  useEffect(() => {
    if (!open) return;
    // Start from what the board shows; most reports change one number.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHome(board.home);
    setAway(board.away);
    setPeriod(board.period ?? periods[0]);
    setPhoto(null);
    setState('idle');
    setError('');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = async () => {
    setState('sending');
    setError('');
    try {
      const r = await submitReport(game.id, { home, away, period, photoFile: photo ?? undefined, photo: Boolean(photo), lock, final: lock && period === 'Final' });
      onSent(r);
      setState('sent');
      setTimeout(onClose, 1200);
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'The report did not send.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-h"
            data-lenis-prevent
            className="relative max-h-[92svh] w-full max-w-md overflow-y-auto rounded-t-lg border border-line bg-ink-2 p-5 sm:rounded-lg"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="flex items-center justify-between">
              <h2 id="sheet-h" className="display text-3xl">Report the score</h2>
              <button type="button" aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center" onClick={onClose}><X size={22} /></button>
            </div>
            <div className="mt-4 grid gap-4">
              <Stepper id="rep-home" label={game.home.short} value={home} onChange={setHome} />
              <Stepper id="rep-away" label={game.away.short} value={away} onChange={setAway} />
              <div>
                <label htmlFor="rep-period" className="field-label">Period</label>
                <select id="rep-period" className="field" value={period} onChange={(e) => setPeriod(e.target.value)}>
                  {periods.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <span className="field-label">Scoreboard photo (optional)</span>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded border border-dashed border-line-2 px-4 text-sm text-mute hover:border-bone hover:text-bone">
                  <Camera size={20} />
                  <span className="truncate">{photo ? photo.name : 'Take or choose a photo'}</span>
                  <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
                <p className="mt-1.5 text-xs text-dim">Photos are checked against the game time before they count double.</p>
              </div>
              {isLive && (
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-bone">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={lock} onChange={(e) => setLock(e.target.checked)} />
                  <span>I coach or keep the official book for one of these teams. Lock this score.<span className="block text-xs text-dim">Only verified accounts can lock; for anyone else this sends a normal report.</span></span>
                </label>
              )}
              {state === 'error' && <p className="text-sm text-danger" role="alert">{error} Try again in a moment.</p>}
              <button type="button" className="btn btn-primary w-full" onClick={send} disabled={state === 'sending' || state === 'sent'}>
                {state === 'sending' ? 'Sending…' : state === 'sent' ? <><Check size={18} /> Sent</> : `Send ${home}-${away}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
