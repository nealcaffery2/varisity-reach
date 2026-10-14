'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Megaphone, Trophy, Vibrate } from '@phosphor-icons/react';
import { publicReels } from '@/content/reels';
import { asset } from '@/lib/asset';
import { AWARDS, tally, type Award } from '@/lib/media';
import { demoEntries, enterAward, myAwardVotes, voteAward, type AwardEntry } from '@/lib/community';

/** Monday of this week, the award week key. */
const weekOf = (d = new Date()) => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
};

const SAMPLES: AwardEntry[] = [
  { id: 's1', award: 'shakiest-camera', reelId: 'r1', caption: 'Filmed the touchdown, the sky, a hot dog and the touchdown again', votes: 0, at: '2026-10-09', sample: true },
  { id: 's2', award: 'shakiest-camera', reelId: 'r13', caption: 'Relay anchor, shot while running alongside the fence', votes: 0, at: '2026-10-10', sample: true },
  { id: 's3', award: 'loudest-parent', reelId: 'r14', caption: 'Mom in section C coaching the single leg from row 9', votes: 0, at: '2026-10-08', sample: true },
  { id: 's4', award: 'loudest-parent', reelId: 'r10', caption: 'Dad called the three before it left his kid’s hands', votes: 0, at: '2026-10-11', sample: true },
];

const ICON = { 'shakiest-camera': Vibrate, 'loudest-parent': Megaphone };

export function FunAwards() {
  const [week, setWeek] = useState('');
  const [entries, setEntries] = useState<AwardEntry[]>(SAMPLES);
  const [mine, setMine] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ award: 'shakiest-camera' as Award, reelId: '', caption: '', consent: false });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const w = weekOf();
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeek(w);
    setEntries([...SAMPLES, ...demoEntries(w)]);
    setMine(myAwardVotes(w));
  }, []);

  const vote = async (e: AwardEntry) => {
    const r = await voteAward(week, e.award, e.id);
    if (!r.ok) return setMsg(r.reason);
    setMine(myAwardVotes(week));
  };

  return (
    <div className="grid gap-14">
      <div className="grid gap-10 lg:grid-cols-2">
        {(Object.keys(AWARDS) as Award[]).map((a) => {
          const Icon = ICON[a];
          const list = tally(
            Object.entries(mine).filter(([k]) => k === a).map(([, clip]) => ({ voter: 'you', clip })),
            entries.filter((e) => e.award === a).map((e) => ({ clip: e.id, at: e.at })),
          );
          return (
            <section key={a} aria-labelledby={`aw-${a}`} className="min-w-0">
              <h2 id={`aw-${a}`} className="display flex items-center gap-3 text-4xl md:text-5xl"><Icon size={32} className="text-accent" aria-hidden /> {AWARDS[a].title}</h2>
              <p className="mt-2 text-mute">{AWARDS[a].blurb}</p>
              <ol className="mt-5 grid gap-px overflow-hidden rounded border border-line bg-line">
                {list.map((t, i) => {
                  const e = entries.find((x) => x.id === t.clip)!;
                  const reel = e.reelId ? publicReels.find((r) => r.id === e.reelId) : undefined;
                  const voted = mine[a] === e.id;
                  return (
                    <li key={e.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 bg-ink p-3">
                      {reel ? (
                        <Link href={`/reels/#${reel.id}`} aria-label={`Watch: ${e.caption}`} className="block aspect-[9/16] w-[4.5rem] overflow-hidden rounded-sm bg-ink-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset(reel.poster)} alt="" className={`h-full w-full object-cover ${a === 'shakiest-camera' ? 'rotate-3 scale-110 blur-[1px]' : ''}`} />
                        </Link>
                      ) : (
                        <span className="grid aspect-[9/16] w-[4.5rem] place-items-center rounded-sm bg-ink-3 text-xs text-dim">Clip</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-bone">{i === 0 && t.votes > 0 && <Trophy size={14} weight="fill" className="mr-1 inline text-accent" aria-label="Leading" />}{e.caption}</p>
                        <p className="text-xs text-dim">{e.sample ? 'Sample entry · ' : ''}<span className="num">{t.votes}</span> vote{t.votes === 1 ? '' : 's'}</p>
                      </div>
                      <button type="button" className={`btn ${voted ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={voted} disabled={Boolean(mine[a]) && !voted} onClick={() => vote(e)}>{voted ? 'Voted' : 'Vote'}</button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
      <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>

      <form
        className="grid gap-4 rounded border border-line bg-ink-2 p-6 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await enterAward(week, { award: f.award, reelId: f.reelId || undefined, file: file ?? undefined, caption: f.caption, consent: f.consent });
          if (!r.ok) return setMsg(r.reason);
          setEntries([...SAMPLES, ...demoEntries(week)]);
          setF({ ...f, reelId: '', caption: '', consent: false });
          setFile(null);
          setMsg(r.demo ? 'Entered (saved in this browser).' : 'Entered. It shows up once a moderator watches it.');
        }}
      >
        <h2 className="display text-3xl md:col-span-2">Nominate</h2>
        <div><label htmlFor="aw-kind" className="field-label">Award</label><select id="aw-kind" className="field" value={f.award} onChange={(e) => setF({ ...f, award: e.target.value as Award })}>{(Object.keys(AWARDS) as Award[]).map((a) => <option key={a} value={a}>{AWARDS[a].title}</option>)}</select></div>
        <div><label htmlFor="aw-reel" className="field-label">A reel already on the site</label><select id="aw-reel" className="field" value={f.reelId} onChange={(e) => setF({ ...f, reelId: e.target.value })}><option value="">None, I’ll upload</option>{publicReels.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></div>
        {!f.reelId && <div className="md:col-span-2"><label htmlFor="aw-file" className="field-label">Or upload the clip</label><input id="aw-file" type="file" accept="video/*" className="field file:mr-3 file:rounded-sm file:border-0 file:bg-ink-3 file:px-3 file:py-1 file:text-bone" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>}
        <div className="md:col-span-2"><label htmlFor="aw-cap" className="field-label">Caption</label><input id="aw-cap" required maxLength={200} className="field" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></div>
        <label className="flex min-h-11 items-start gap-3 text-sm text-bone md:col-span-2"><input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-accent)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} /> The person filming or the parent doing the yelling knows and is in on it. No students as the joke.</label>
        <div className="md:col-span-2"><button className="btn btn-primary">Enter it</button></div>
      </form>
    </div>
  );
}
