'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, Play } from '@phosphor-icons/react';
import { asset } from '@/lib/asset';

const EASE = [0.16, 1, 0.3, 1] as const;

type HeroProps = {
  /** Small line above the big word, e.g. the town. */
  over: string;
  /** The big word that rises in letter by letter. */
  word: string;
  label: string;
  sub: string;
  reel: { src: string; poster: string };
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export function Hero({ over, word, label, sub, reel, primary, secondary }: HeroProps) {
  const WORD = word.toUpperCase();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.18]);
  const lift = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-22%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative isolate h-[100svh] min-h-[600px] overflow-hidden" aria-label={label}>
      <motion.div style={{ scale }} className="absolute inset-0 -z-10 origin-center">
        <video
          className="h-full w-full object-cover grayscale contrast-125 brightness-75"
          src={asset(reel.src)}
          poster={asset(reel.poster)}
          autoPlay={!reduce}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        {/* Orange duotone: multiply lifts the brand into the highlights without a glow. */}
        <div className="absolute inset-0 bg-accent mix-blend-multiply opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
      </motion.div>
      <div className="grain absolute inset-0 -z-10 overflow-hidden" />

      <motion.div style={{ y: lift, opacity: fade }} className="wrap flex h-full flex-col justify-end pb-24 md:pb-28">
        <h1 className="display text-bone text-[clamp(4.25rem,17vw,15rem)] leading-[0.8]" aria-label={`${over} ${word}`}>
          <span className="block overflow-hidden text-[0.28em] leading-none tracking-normal text-accent">
            <motion.span
              className="block pb-[0.08em]"
              initial={reduce ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
            >
              {over}
            </motion.span>
          </span>
          <span className="flex overflow-hidden" aria-hidden>
            {WORD.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={reduce ? false : { y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.18 + i * 0.045 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </h1>
        <motion.div
          className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.75 }}
        >
          <p className="max-w-md text-lg leading-snug text-bone/85 md:text-xl">
            {sub}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={primary.href} className="btn btn-primary">
              <Play size={18} weight="fill" /> {primary.label}
            </Link>
            <Link href={secondary.href} className="btn btn-ghost bg-ink/40 backdrop-blur-sm">{secondary.label}</Link>
          </div>
        </motion.div>
      </motion.div>

      <a href="#highlights" className="absolute bottom-6 right-4 hidden h-11 w-11 items-center justify-center rounded-full border border-line-2 text-mute transition-colors hover:text-bone md:inline-flex md:right-8" aria-label="Scroll to highlights">
        <ArrowDown size={18} />
      </a>
    </section>
  );
}
