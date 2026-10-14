'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { SEASONS } from '@/content/sports';
import type { Season, Sport } from '@/lib/types';
import { asset } from '@/lib/asset';

/** Current IHSA season for the default tab. */
function seasonFor(d = new Date()): Season {
  const m = d.getMonth() + 1;
  if (m >= 8 && m <= 10) return 'Fall';
  if (m >= 11 || m <= 2) return 'Winter';
  return 'Spring';
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen'];

export function SeasonTeams({ school, list: all }: { school: string; list: Sport[] }) {
  const [season, setSeason] = useState<Season>(seasonFor);
  const [hover, setHover] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 });
  const list = all.filter((s) => s.season === season);
  const preview = list.find((s) => s.slug === hover)?.reel;

  return (
    <section className="py-24 md:py-32" aria-labelledby="teams-h">
      <div className="wrap">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="teams-h" className="display text-5xl sm:text-6xl md:text-8xl">{WORDS[all.length] ?? all.length} teams.<br /><span className="text-accent">Three seasons.</span></h2>
          <div role="tablist" aria-label="Season" className="flex gap-1 rounded-full border border-line p-1 self-start md:self-auto">
            {SEASONS.map((s) => (
              <button
                key={s}
                role="tab"
                type="button"
                aria-selected={season === s}
                onClick={() => setSeason(s)}
                className={`relative h-10 rounded-full px-5 text-sm font-medium transition-colors ${season === s ? 'text-accent-ink' : 'text-mute hover:text-bone'}`}
              >
                {season === s && <motion.span layoutId="season-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          ref={box}
          className="relative mt-12"
          onPointerMove={(e) => {
            const r = box.current?.getBoundingClientRect();
            if (!r) return;
            mx.set(e.clientX - r.left);
            my.set(e.clientY - r.top);
          }}
          onPointerLeave={() => setHover(null)}
        >
          <AnimatePresence mode="wait">
            <motion.ul
              key={season}
              role="tabpanel"
              aria-label={`${season} sports`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-line"
            >
              {list.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link
                    href={`/${school}/teams/${s.slug}/`}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(s.slug)}
                    onFocus={() => setHover(null)}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 py-5 md:grid-cols-[1fr_16rem_auto] md:py-6"
                  >
                    <span className="display text-5xl text-bone transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-3 group-hover:text-accent md:text-7xl">
                      {s.name}
                    </span>
                    <span className="hidden text-sm text-mute md:block">
                      {s.coaches[0] ?? <span className="text-dim">Staff not posted</span>}
                      {s.coaches.length > 1 && <span className="text-dim"> + {s.coaches.length - 1} coaches</span>}
                    </span>
                    <ArrowUpRight size={28} className="text-dim transition-[color,transform] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>

          {/* Cursor-following clip preview, desktop pointer only. */}
          <AnimatePresence>
            {preview && (
              <motion.div
                key={preview}
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 z-10 hidden h-64 w-44 overflow-hidden rounded md:block"
                style={{ x, y, translateX: '24px', translateY: '-50%' }}
                initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <video src={asset(preview)} autoPlay muted loop playsInline className="h-full w-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
