'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, CaretDown, CaretUp, Check, Heart, Play, X, ShareFat, SpeakerHigh, SpeakerSlash, User } from '@phosphor-icons/react';
import { reels as ALL } from '@/content/reels';
import { athleteBySlug, fullName } from '@/content/athletes';
import { sportBySlug } from '@/content/sports';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { feetInches, shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';
import type { Reel } from '@/lib/types';

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
  const list = useMemo(
    () => ALL.filter((r) => (!sport || r.sport === sport) && (!school || (r.athlete && athleteBySlug(r.athlete)?.school === school))),
    [sport, school],
  );

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikes(readLikes());
    const sc = new URLSearchParams(window.location.search).get('school');
    if (sc && schoolBySlug(sc)) setSchool(sc);
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = ''; };
  }, []);

  const toggleLike = useCallback((id: string, force?: boolean) => {
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

      <div ref={feed} data-lenis-prevent className="reel-feed no-scrollbar h-full overflow-y-scroll" aria-label="Highlight reels" key={sport + school}>
        {list.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="display text-4xl">No clips here yet</p>
            <p className="mt-3 max-w-sm text-mute">Coaches and families add film from the coach dashboard.</p>
            <button type="button" className="btn btn-primary mt-6" onClick={() => { setSport(''); setSchool(''); }}>Show every clip</button>
          </div>
        )}
        {list.map((r, i) => (
          <ReelSlide key={r.id} reel={r} index={i} active={i === active} near={Math.abs(i - active) <= 1} muted={muted} onMute={() => setMuted((m) => !m)} liked={likes.has(r.id)} onLike={(force) => toggleLike(r.id, force)} />
        ))}
      </div>

      <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button type="button" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous reel" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-ink/60 text-bone backdrop-blur hover:bg-ink-3 disabled:opacity-30"><CaretUp size={20} /></button>
        <button type="button" onClick={() => go(1)} disabled={active === list.length - 1} aria-label="Next reel" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-ink/60 text-bone backdrop-blur hover:bg-ink-3 disabled:opacity-30"><CaretDown size={20} /></button>
      </div>
    </div>
  );
}

function ReelSlide({ reel, index, active, near, muted, onMute, liked, onLike }: {
  reel: Reel; index: number; active: boolean; near: boolean; muted: boolean; onMute: () => void; liked: boolean; onLike: (force?: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const [shared, setShared] = useState(false);
  const lastTap = useRef(0);
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
          <button type="button" className={rail} onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'}>
            <span className={railBtn}>{muted ? <SpeakerSlash size={22} /> : <SpeakerHigh size={22} />}</span>
            <span>{muted ? 'Sound off' : 'Sound on'}</span>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[4] h-0.5 bg-bone/15">
          <div ref={bar} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
      {index === 0 && active && (
        <p className="pointer-events-none absolute bottom-2 left-1/2 z-[5] -translate-x-1/2 text-xs text-mute md:hidden">Swipe up for the next clip</p>
      )}
    </section>
  );
}
