'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowCounterClockwise, Camera, Check, DownloadSimple, FileArrowUp, Info, Sparkle, Warning } from '@phosphor-icons/react';
import { athletes } from '@/content/athletes';
import { schools } from '@/content/schools';
import { sportsFor, sportBySlug } from '@/content/sports';
import { diffRoster, rowsToAthletes, type DiffRow, type ImportedAthlete } from '@/lib/roster';
import { readRosterFile } from '@/lib/roster-files';
import { extractRoster, isLive, publishRoster } from '@/lib/backend';
import { feetInches } from '@/lib/format';
import { asset } from '@/lib/asset';

type Stage =
  | { kind: 'idle' }
  | { kind: 'reading'; label: string }
  | { kind: 'review'; rows: DiffRow[]; source: string; picked: Set<number> }
  | { kind: 'needs-ai'; source: string }
  | { kind: 'done'; saved: number; demo: boolean }
  | { kind: 'error'; message: string };

/** The school year a fall roster belongs to ends the next June. */
const seasonEnd = () => {
  const d = new Date();
  return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
};

// What Claude returns for the sample photo, so the demo shows the whole flow.
const SAMPLE_PHOTO_ROWS = [
  ['#', 'Name', 'Pos', 'Yr', 'Ht', 'Wt', '40', 'Bench'],
  ['22', 'Cade Rakers', 'RB', 'Sr', '6-0', '189', '4.55', '255'],
  ['74', 'Avery Niehaus', 'OT', 'Sr', '6-5', '291', '5.19', '325'],
  ['157', 'Maddox Kessinger', 'LB', 'Sr', '5-9', '162', '4.71', '235'],
  ['4', 'Owen Fesser', 'WR', 'Sr', '5-10', '166', '4.47', ''],
  ['31', 'Wyatt Brummer', 'FB', 'So', '5-11', '204', '4.86', '265'],
  ['15', 'Eli Sasse', 'QB', 'Fr', '6-1', '171', '4.81', '185'],
];

export function RosterImport() {
  const [school, setSchool] = useState('hillsboro');
  const [sport, setSport] = useState('football');
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const teams = sportsFor(school);
  const statKeys = sportBySlug(sport)?.statKeys ?? [];
  const current = useMemo(() => athletes.filter((a) => a.school === school && a.sports.includes(sport)), [school, sport]);

  const review = useCallback(
    (list: ImportedAthlete[], source: string) => {
      if (!list.length) {
        setStage({ kind: 'error', message: 'No athletes found. Check that the file has a name column, or try a clearer photo.' });
        return;
      }
      const rows = diffRoster(current, list);
      setStage({ kind: 'review', rows, source, picked: new Set(rows.map((r, i) => (r.status === 'same' ? -1 : i)).filter((i) => i >= 0)) });
    },
    [current],
  );

  const handle = async (file: File) => {
    setStage({ kind: 'reading', label: `Reading ${file.name}…` });
    try {
      const r = await readRosterFile(file);
      if (r.kind === 'rows') return review(rowsToAthletes(r.rows, statKeys, seasonEnd()), r.source);
      if (!isLive) return setStage({ kind: 'needs-ai', source: r.source });
      setStage({ kind: 'reading', label: `Claude is reading the ${r.source.toLowerCase()}…` });
      const out = await extractRoster(r.file, sport);
      review(out.athletes as ImportedAthlete[], `${r.source}, read by Claude`);
    } catch (e) {
      setStage({ kind: 'error', message: e instanceof Error ? e.message : 'Could not read that file.' });
    }
  };

  const publish = async () => {
    if (stage.kind !== 'review') return;
    const rows = stage.rows.filter((_, i) => stage.picked.has(i)).map((r) => r.incoming);
    try {
      const res = await publishRoster(school, sport, rows);
      setStage({ kind: 'done', saved: res.saved, demo: Boolean(res.demo) });
    } catch (e) {
      setStage({ kind: 'error', message: e instanceof Error ? e.message : 'Publishing failed.' });
    }
  };

  const download = () => {
    if (stage.kind !== 'review') return;
    const rows = stage.rows.filter((_, i) => stage.picked.has(i)).map((r) => r.incoming);
    const blob = new Blob([JSON.stringify({ school, sport, rows }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${school}-${sport}-roster.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section aria-labelledby="import-h" className="rounded border border-line bg-ink-2">
      <div className="border-b border-line p-5 md:p-6">
        <h2 id="import-h" className="display text-4xl">Update a roster</h2>
        <p className="mt-2 max-w-[65ch] text-mute">Drop the file you already have. Names, numbers, positions, class, height, weight, 40 times, lifts and season stats are pulled out and lined up against the current roster for you to approve.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:max-w-xl">
          <div>
            <label htmlFor="imp-school" className="field-label">School</label>
            <select id="imp-school" className="field" value={school} onChange={(e) => { setSchool(e.target.value); setSport(sportsFor(e.target.value)[0]?.slug ?? 'football'); setStage({ kind: 'idle' }); }}>
              {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="imp-sport" className="field-label">Team</label>
            <select id="imp-sport" className="field" value={sport} onChange={(e) => { setSport(e.target.value); setStage({ kind: 'idle' }); }}>
              {teams.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        <AnimatePresence mode="wait">
          {(stage.kind === 'idle' || stage.kind === 'error') && (
            <motion.div key="drop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
                className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-8 text-center transition-colors ${drag ? 'border-accent bg-accent/5' : 'border-line-2 hover:border-bone'}`}
              >
                <FileArrowUp size={40} className="text-accent" />
                <span className="display mt-4 text-3xl text-bone">Drop a roster or stat sheet</span>
                <span className="mt-2 text-sm text-mute">Excel, CSV, PDF, Word, or a photo from your phone</span>
                <span className="btn btn-primary mt-5"><Camera size={18} /> Choose a file</span>
                <input ref={input} type="file" className="sr-only" accept=".xlsx,.xls,.ods,.csv,.tsv,.txt,.pdf,.docx,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ''; }} />
              </label>
              {stage.kind === 'error' && <p className="mt-3 flex gap-2 text-sm text-danger" role="alert"><Warning size={18} className="shrink-0" /> {stage.message}</p>}
              <button type="button" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone" onClick={() => { setSchool('hillsboro'); setSport('football'); setStage({ kind: 'reading', label: 'Reading the sample photo…' }); setTimeout(() => review(rowsToAthletes(SAMPLE_PHOTO_ROWS, sportBySlug('football')!.statKeys, seasonEnd()), 'Photo, read by Claude (sample result)'), 900); }}>
                <Sparkle size={16} /> Try it with a sample roster photo
              </button>
            </motion.div>
          )}

          {stage.kind === 'reading' && (
            <motion.div key="reading" className="flex min-h-56 flex-col items-center justify-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-busy="true">
              <div className="grid w-full max-w-lg gap-2" aria-hidden>
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-ink-3" style={{ animationDelay: `${i * 120}ms` }} />)}
              </div>
              <p className="text-mute" role="status">{stage.label}</p>
            </motion.div>
          )}

          {stage.kind === 'needs-ai' && (
            <motion.div key="ai" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-6 md:grid-cols-[1fr_18rem]">
              <div>
                <p className="display text-3xl">Photos and PDFs need the reader turned on</p>
                <p className="mt-3 max-w-xl text-mute">
                  Spreadsheets and Word tables are read in your browser. A {stage.source.toLowerCase()} goes to Claude, which runs once this site is connected to its Supabase project with an Anthropic key. Here is what it returns for a sample photo of a roster sheet.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => { setSchool('hillsboro'); setSport('football'); review(rowsToAthletes(SAMPLE_PHOTO_ROWS, sportBySlug('football')!.statKeys, seasonEnd()), 'Photo, read by Claude (sample result)'); }}>Show the sample result</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setStage({ kind: 'idle' })}>Pick another file</button>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/media/sample-roster.jpg')} alt="A handwritten varsity football roster sheet with numbers, names, positions, class, height, weight, 40 times and bench press" className="w-full rounded border border-line" />
            </motion.div>
          )}

          {stage.kind === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ReviewTable
                stage={stage}
                onToggle={(i) => setStage((s) => {
                  if (s.kind !== 'review') return s;
                  const picked = new Set(s.picked);
                  if (picked.has(i)) picked.delete(i);
                  else picked.add(i);
                  return { ...s, picked };
                })}
              />
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="button" className="btn btn-primary" onClick={publish} disabled={stage.picked.size === 0}>
                  <Check size={18} /> Publish {stage.picked.size} {stage.picked.size === 1 ? 'change' : 'changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={download} disabled={stage.picked.size === 0}><DownloadSimple size={18} /> Download JSON</button>
                <button type="button" className="btn btn-ghost" onClick={() => setStage({ kind: 'idle' })}><ArrowCounterClockwise size={18} /> Start over</button>
              </div>
            </motion.div>
          )}

          {stage.kind === 'done' && (
            <motion.div key="done" className="flex min-h-56 flex-col items-center justify-center text-center" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink"><Check size={28} weight="bold" /></span>
              <p className="display mt-4 text-4xl">{stage.saved} {stage.saved === 1 ? 'athlete' : 'athletes'} updated</p>
              <p className="mt-2 max-w-md text-mute">
                {stage.demo ? 'Demo mode: saved in this browser only. With Supabase connected, profiles update for everyone and carry your verified mark.' : 'Profiles are live with your verified mark.'}
              </p>
              <button type="button" className="btn btn-ghost mt-5" onClick={() => setStage({ kind: 'idle' })}>Import another file</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ReviewTable({ stage, onToggle }: { stage: Extract<Stage, { kind: 'review' }>; onToggle: (i: number) => void }) {
  const counts = {
    new: stage.rows.filter((r) => r.status === 'new').length,
    update: stage.rows.filter((r) => r.status === 'update').length,
    same: stage.rows.filter((r) => r.status === 'same').length,
  };
  const badge = { new: 'bg-accent text-accent-ink', update: 'border border-accent text-accent', same: 'border border-line-2 text-dim' } as const;
  const label = { new: 'New', update: 'Changes', same: 'No change' } as const;
  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
        <span className="text-bone">{stage.source}</span>
        <span>{counts.new} new</span>
        <span>{counts.update} with changes</span>
        <span>{counts.same} unchanged</span>
      </p>
      <div className="mt-4 overflow-x-auto rounded border border-line" data-lenis-prevent>
        <table className="w-full min-w-[46rem] text-sm">
          <caption className="sr-only">Roster changes to approve</caption>
          <thead className="border-b border-line bg-ink">
            <tr>
              <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-medium text-mute"><span className="sr-only">Include</span></th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-mute">Athlete</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-mute">Status</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-mute">What changes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {stage.rows.map((r, i) => (
              <tr key={i} className={stage.picked.has(i) ? '' : 'opacity-60'}>
                <td className="px-3 py-3 align-top">
                  <input type="checkbox" className="h-4 w-4" checked={stage.picked.has(i)} onChange={() => onToggle(i)} aria-label={`Include ${r.incoming.first} ${r.incoming.last}`} disabled={r.status === 'same'} />
                </td>
                <td className="px-3 py-3 align-top">
                  <span className="font-semibold text-bone">{r.incoming.first} {r.incoming.last}</span>
                  <span className="block text-xs text-dim">
                    {[r.incoming.jersey !== undefined && `#${r.incoming.jersey}`, r.incoming.position, r.incoming.gradYear, r.incoming.heightIn && feetInches(r.incoming.heightIn), r.incoming.weightLb && `${r.incoming.weightLb} lb`].filter(Boolean).join(' · ')}
                  </span>
                </td>
                <td className="px-3 py-3 align-top"><span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${badge[r.status]}`}>{label[r.status]}</span></td>
                <td className="px-3 py-3 align-top">
                  {r.status === 'new' ? (
                    <span className="text-mute">New profile. It stays hidden until the family’s media release is on file.</span>
                  ) : r.changes.length ? (
                    <ul className="space-y-1">
                      {r.changes.map((c) => (
                        <li key={c.field} className="num text-xs">
                          <span className="text-mute">{c.field}</span> <span className="text-dim line-through">{c.from ?? '–'}</span> <span className="text-accent">→ {c.to}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-dim">Matches the current roster</span>
                  )}
                  {r.incoming.warnings.length > 0 && (
                    <p className="mt-1 flex gap-1 text-xs text-danger"><Warning size={14} className="shrink-0" /> Could not read {r.incoming.warnings.join(', ')}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex gap-2 text-xs text-dim"><Info size={14} className="mt-0.5 shrink-0" /> Nothing saves until you publish. Uncheck any row you do not want.</p>
    </div>
  );
}
