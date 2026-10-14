'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, BookmarkSimple, CaretDown, CaretUp, Check, Heart, LockSimple, Play, X, ShareFat, SpeakerHigh, SpeakerSlash, User } from '@phosphor-icons/react';
import { reels as ALL } from '@/content/reels';
import { athleteBySlug, fullName } from '@/content/athletes';
import { sportBySlug } from '@/content/sports';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { feetInches, shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';
import type { Reel } from '@/lib/types';
import { forYou, shuffle, topSports, visible } from '@/lib/recommend';
import { logReel, reelEvents, savedReels, saveReel, unsaveReel, viewer, type ReelSave } from '@/lib/community';

type Mode = 'latest' | 'foryou' | 'random';
const MODES: { mode: Mode; label: string }[] = [
  { mode: 'foryou', label: 'For you' },
  { mode: 'random', label: 'Scramble' },
  { mode: 'latest', label: 'Newest' },
];

const SPORTS = [...new Set(ALL.map((r) => r.sport))];

function readLikes(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('reel-likes') ?? '[]')); } catch { return new Set(); }
}

export function ReelFeed() {
  const [sport, setSport] = useState('');
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const feed = useRef<HTMLDivElement>(null);
  const [school, setSchool] = useState('');
  const [mode, setMode] = useState<Mode>('latest');
  const [seed, setSeed] = useState(1);
  const [now, setNow] = useState(0);
  const [recruiter, setRecruiter] = useState(false);
  const [saves, setSaves] = useState<Record<string, ReelSave>>({});
  const [because, setBecause] = useState<string[]>([]);
  const list = useMemo(() => {
    const base = visible(ALL, { verifiedRecruiter: recruiter }).filter((r) => (!sport || r.sport === sport) && (!school || (r.athlete && athleteBySlug(r.athlete)?.school === school)));
    if (mode === 'random') return shuffle(base, seed);
    if (mode === 'foryou') {
      const hidden = new Set(Object.values(saves).filter((x) => x.list === 'no').map((x) => x.reelId));
      return forYou(base, reelEvents(), { now, seed, hidden });
    }
    return [...base].sort((a, b) => b.date.localeCompare(a.date));
    // saves only matter when the mode changes, so a save does not reshuffle the clip on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, school, mode, seed, now, recruiter]);

  // Engagement: a clip left in under 1.5 s is a skip, longer is a view.
  const shownAt = useRef({ id: '', at: 0, sport: '' });
  useEffect(() => {
    const cur = list[active];
    const prev = shownAt.current;
    if (prev.id && prev.id !== cur?.id) logReel({ reelId: prev.id, sport: prev.sport, kind: Date.now() - prev.at < 1500 ? 'skip' : 'view' });
    if (cur) shownAt.current = { id: cur.id, at: Date.now(), sport: cur.sport };
  }, [active, list]);

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikes(readLikes());
    setSaves(savedReels());
    setSeed(Math.floor(Math.random() * 1e9));
    setNow(Date.now());
    setBecause(topSports(reelEvents(), Date.now()));
    viewer().then((v) => {
      const isRecruiter = v.role === 'recruiter' && v.verified;
      setRecruiter(isRecruiter);
      if (isRecruiter) setMode('foryou');
    });
    const sc = new URLSearchParams(window.location.search).get('school');
    if (sc && schoolBySlug(sc)) setSchool(sc);
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = ''; };
  }, []);

  const toggleLike = useCallback((id: string, force?: boolean) => {
    const r = ALL.find((x) => x.id === id);
    if (r && (force ?? !readLikes().has(id))) logReel({ reelId: id, sport: r.sport, kind: 'like' });
    setLikes((prev) => {
      const next = new Set(prev);
      if (force ?? !next.has(id)) next.add(id);
      else next.delete(id);
      try { localStorage.setItem('reel-likes', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // Which reel is on screen.
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index);
            setActive(i);
            const id = list[i]?.id;
            if (id) window.history.replaceState(null, '', `#${id}`);
          }
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list]);

  // Deep link: /reels/#r12 opens on that clip.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const i = list.findIndex((r) => r.id === id);
    if (i > 0) feed.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const i = Math.min(list.length - 1, Math.max(0, active + dir));
    feed.current?.querySelector<HTMLElement>(`[data-index="${i}"]`)?.scrollIntoView({ behavior: 'smooth' });
  }, [active, list.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); go(-1); }
      if (e.key === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="fixed inset-0 z-40 bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-ink/80 to-transparent pb-10">
        <div className="pointer-events-auto flex items-center gap-2 px-3 pt-3 md:px-6 md:pt-4">
          <Link href="/" aria-label="Back to the home page" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur hover:bg-ink-3">
            <ArrowLeft size={20} />
          </Link>
          <div className="no-scrollbar flex shrink-0 gap-1 rounded-full bg-ink/60 p-1 backdrop-blur" role="group" aria-label="Order">
            {MODES.map((m) => (
              <button key={m.mode} type="button" className="chip shrink-0 whitespace-nowrap border-transparent" aria-pressed={mode === m.mode} onClick={() => { setMode(m.mode); setSeed(Math.floor(Math.random() * 1e9)); setNow(Date.now()); setActive(0); }}>{m.label}</button>
            ))}
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto py-1" role="group" aria-label="Filter reels by sport">
            {school && (
              <button type="button" className="chip shrink-0 whitespace-nowrap backdrop-blur" aria-pressed onClick={() => setSchool('')} aria-label={`Showing ${schoolBySlug(school)?.town} only. Show every school`}>
                {schoolBySlug(school)?.town} <X size={12} weight="bold" />
              </button>
            )}
            <button type="button" className="chip shrink-0 backdrop-blur aria-[pressed=false]:bg-ink/50" aria-pressed={sport === ''} onClick={() => setSport('')}>All</button>
            {SPORTS.map((s) => (
              <button key={s} type="button" className="chip shrink-0 whitespace-nowrap backdrop-blur aria-[pressed=false]:bg-ink/50" aria-pressed={sport === s} onClick={() => setSport(s)}>
                {sportBySlug(s)?.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'foryou' && because.length > 0 && (
        <p className="pointer-events-none absolute left-1/2 top-[4.5rem] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/60 px-3 py-1 text-xs text-mute backdrop-blur">More {because.map((b) => sportBySlug(b)?.short ?? b).join(' and ')}, from what you watch</p>
      )}
      <div ref={feed} data-lenis-prevent className="reel-feed no-scrollbar h-full overflow-y-scroll" aria-label="Highlight reels" key={sport + school + mode + seed}>
        {list.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="display text-4xl">No clips here yet</p>
            <p className="mt-3 max-w-sm text-mute">Coaches and families add film from the coach dashboard.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={() => { setSport(''); setSchool(''); }}>Show every clip</button>
          </div>
        )}
        {list.map((r, i) => (
          <ReelSlide key={r.id} reel={r} index={i} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} onMute={() => setMuted((m) => !m)} liked={likes.has(r.id)} onLike={(force) => toggleLike(r.id, force)}
            recruiter={recruiter} save={saves[r.id]} onSave={async (sv) => {
              if (sv) { await saveReel(sv); logReel({ reelId: r.id, sport: r.sport, kind: 'save' }); } else await unsaveReel(r.id);
              setSaves(savedReels());
            }} />
        ))}
      </div>

      <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button type="button" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous reel" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-ink/60 text-bone backdrop-blur hover:bg-ink-3 disabled:opacity-30"><CaretUp size={20} /></button>
        <button type="button" onClick={() => go(1)} disabled={active === list.length - 1} aria-label="Next reel" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-ink/60 text-bone backdrop-blur hover:bg-ink-3 disabled:opacity-30"><CaretDown size={20} /></button>
      </div>
    </div>
  );
}

function ReelSlide({ reel, index, active, near, muted, onMute, liked, onLike, recruiter, save, onSave }: {
  reel: Reel; index: number; active: boolean; near: boolean; muted: boolean; onMute: () => void; liked: boolean; onLike: (force?: boolean) => void;
  recruiter: boolean; save?: ReelSave; onSave: (s: ReelSave | null) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const [shared, setShared] = useState(false);
  const lastTap = useRef(0);
  const completed = useRef(false);
  const a = reel.athlete ? athleteBySlug(reel.athlete) : undefined;
  const sport = sportBySlug(reel.sport);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active && !paused) v.play().catch((e: DOMException) => e.name === 'NotAllowedError' && setPaused(true));
    else v.pause();
    if (!active) v.currentTime = 0;
  }, [active, paused]);

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onLike(true);
      setBurst((b) => b + 1);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    window.setTimeout(() => {
      if (lastTap.current === now) setPaused((p) => !p);
    }, 280);
  };

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${reel.id}`;
    const title = a ? `${fullName(a)}: ${reel.title}` : reel.title;
    logReel({ reelId: reel.id, sport: reel.sport, kind: 'share' });
    if (navigator.share) return navigator.share({ title, url }).catch(() => {});
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1600);
    } catch {}
  };

  const rail = 'flex flex-col items-center gap-1 text-xs font-semibold text-bone [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]';
  const railBtn = 'inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink/50 backdrop-blur transition-transform active:scale-90';

  return (
    <section id={reel.id} data-index={index} style={a && schoolBySlug(a.school) ? (schoolTheme(schoolBySlug(a.school)!) as React.CSSProperties) : undefined} className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden" aria-label={`${a ? fullName(a) + ', ' : ''}${reel.title}`}>
      {/* Desktop: blurred poster fills the sides around the 9:16 frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(reel.poster)} alt="" aria-hidden className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-40 blur-2xl md:block" />
      <div className="relative h-full w-full md:aspect-[9/16] md:h-[calc(100svh-2rem)] md:w-auto md:overflow-hidden md:rounded">
        <video
          ref={video}
          src={near ? asset(reel.src) : undefined}
          poster={asset(reel.poster)}
          muted={muted}
          loop
          playsInline
          preload={near ? 'auto' : 'none'}
          className="absolute inset-0 h-full w-full object-cover"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration && v.currentTime > v.duration - 0.3 && !completed.current) {
              completed.current = true;
              logReel({ reelId: reel.id, sport: reel.sport, kind: 'complete' });
            }
            if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
          }}
        />
        <button type="button" className="absolute inset-0 z-[1] cursor-default" aria-label={paused ? 'Play' : 'Pause'} onClick={tap} />
        <AnimatePresence>
          {paused && active && (
            <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.3 }} className="pointer-events-none absolute left-1/2 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/50 p-5 text-bone backdrop-blur">
              <Play size={36} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {burst > 0 && (
            <motion.span key={burst} initial={{ opacity: 0, scale: 0.4, rotate: -12 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 1.4], rotate: [-12, 6, 0, 0] }} transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1] }} className="pointer-events-none absolute left-1/2 top-1/2 z-[2] -ml-14 -mt-14 text-accent">
              <Heart size={112} weight="fill" />
            </motion.span>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-ink via-ink/80 to-transparent px-4 pb-8 pt-36 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)] md:pb-6">
          <div className="pointer-events-auto max-w-[78%]">
            <p className="text-sm font-semibold text-accent-2">{sport?.name} · {shortDate(reel.date)}</p>
            {reel.audience === 'recruiters' && <p className="mt-1 inline-flex items-center gap-1 rounded-sm bg-ink/70 px-1.5 py-0.5 text-xs text-bone"><LockSimple size={12} aria-hidden /> Verified recruiters only</p>}
            {a && (
              <Link href={`/athletes/${a.slug}/`} className="mt-1 inline-block">
                <h2 className="display text-4xl leading-none text-bone hover:text-accent">{fullName(a)}</h2>
                <span className="mt-1 block text-sm text-mute">{a.gradYear} · {a.position} · {feetInches(a.heightIn)} · {a.weightLb} lb</span>
              </Link>
            )}
            {a && <p className="text-sm text-bone/85">{schoolBySlug(a.school)?.name} · {schoolBySlug(a.school)?.state} {schoolBySlug(a.school)?.classification}</p>}
            <p className="mt-2 text-bone">{reel.title}</p>
            {reel.credit && <p className="mt-1 text-xs text-bone/80">{reel.credit}</p>}
          </div>
        </div>

        <div className="absolute bottom-24 right-3 z-[3] flex flex-col items-center gap-5 md:bottom-20">
          {a && (
            <Link href={`/athletes/${a.slug}/`} className={rail} aria-label={`Open ${fullName(a)}'s profile`}>
              <span className="display inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent bg-ink text-xl text-accent">{a.jersey}</span>
              <span className="inline-flex items-center gap-0.5"><User size={12} /> Profile</span>
            </Link>
          )}
          <button type="button" className={rail} onClick={() => onLike()} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'}>
            <motion.span className={railBtn} animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}>
              <Heart size={26} weight={liked ? 'fill' : 'regular'} className={liked ? 'text-accent' : ''} />
            </motion.span>
            <span>{liked ? 'Liked' : 'Like'}</span>
          </button>
          <button type="button" className={rail} onClick={share} aria-label="Share this reel">
            <span className={railBtn}>{shared ? <Check size={24} /> : <ShareFat size={24} />}</span>
            <span>{shared ? 'Copied' : 'Share'}</span>
          </button>
          {recruiter && (
            <button type="button" className={rail} onClick={() => setSheet(true)} aria-label={save ? `Saved to ${LIST_LABEL[save.list]}. Change` : 'Save to a list'}>
              <span className={railBtn}><BookmarkSimple size={24} weight={save ? 'fill' : 'regular'} className={save ? 'text-accent' : ''} /></span>
              <span>{save ? LIST_LABEL[save.list] : 'Save'}</span>
            </button>
          )}
          <button type="button" className={rail} onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            <span className={railBtn}>{muted ? <SpeakerSlash size={22} /> : <SpeakerHigh size={22} />}</span>
            <span>{muted ? 'Sound off' : 'Sound on'}</span>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[4] h-0.5 bg-bone/15">
          <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
      {sheet && <SaveSheet reel={reel} current={save} onClose={() => setSheet(false)} onSave={(sv) => { onSave(sv); setSheet(false); }} />}
      {index === 0 && active && (
        <p className="pointer-events-none absolute bottom-2 left-1/2 z-[5] -translate-x-1/2 text-xs text-mute md:hidden">Swipe up for the next clip</p>
      )}
    </section>
  );
}

const LIST_LABEL: Record<ReelSave['list'], string> = { prospect: 'Prospect', maybe: 'Maybe', no: 'No thanks' };

/** Recruiter save sheet: file the clip, say why, and choose who hears it. */
function SaveSheet({ reel, current, onClose, onSave }: { reel: Reel; current?: ReelSave; onClose: () => void; onSave: (s: ReelSave | null) => void }) {
  const [list, setList] = useState<ReelSave['list']>(current?.list ?? 'prospect');
  const [reason, setReason] = useState(current?.reason ?? '');
  const [shareWith, setShareWith] = useState<ReelSave['shareWith']>(current?.shareWith ?? 'none');
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/60 md:items-center" role="dialog" aria-modal="true" aria-labelledby={`save-${reel.id}`} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form
        className="w-full max-w-md rounded-t border border-line bg-ink-2 p-5 md:rounded"
        onSubmit={(e) => { e.preventDefault(); onSave({ reelId: reel.id, athlete: reel.athlete, list, reason: reason.trim() || undefined, shareWith: reason.trim() ? shareWith : 'none' }); }}
      >
        <div className="flex items-center justify-between">
          <h2 id={`save-${reel.id}`} className="display text-3xl">Save to</h2>
          <button type="button" aria-label="Close" className="grid size-11 place-items-center rounded-sm text-mute hover:bg-ink-3 hover:text-bone" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="List">
          {(Object.keys(LIST_LABEL) as ReelSave['list'][]).map((k) => <button key={k} type="button" className="chip" aria-pressed={list === k} onClick={() => setList(k)}>{LIST_LABEL[k]}</button>)}
        </div>
        <label htmlFor={`why-${reel.id}`} className="field-label mt-4">{list === 'no' ? 'Why not (optional)' : 'Notes (optional)'}</label>
        <textarea id={`why-${reel.id}`} autoFocus className="field min-h-24" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={list === 'no' ? 'Need more length at that position; would watch senior film' : 'Explosive first step; want full-game film'} />
        <fieldset className="mt-3" disabled={!reason.trim()}>
          <legend className="field-label">Who sees the note</legend>
          {([['none', 'Only me'], ['coach', 'The high school coach'], ['family', 'The coach and the family']] as const).map(([k, l]) => (
            <label key={k} className="flex min-h-11 items-center gap-3 text-sm text-bone"><input type="radio" name={`sw-${reel.id}`} className="size-5 accent-[var(--color-accent)]" checked={shareWith === k} onChange={() => setShareWith(k)} /> {l}</label>
          ))}
        </fieldset>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-primary flex-1">Save</button>
          {current && <button type="button" className="btn btn-ghost" onClick={() => onSave(null)}>Remove</button>}
        </div>
        <p className="mt-3 text-xs text-dim">“No thanks” clips drop out of your For you feed. A shared note helps a kid know what to work on.</p>
      </form>
    </div>
  );
}
