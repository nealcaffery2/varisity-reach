'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import type { Athlete } from '@/lib/types';
import { AthleteCard } from '@/components/athlete-card';

/**
 * Scroll-pinned horizontal pan on desktop: the section pins and the cards
 * slide left as you scroll down. Phones and reduced motion get a plain
 * swipeable row instead.
 */
export function FeaturedAthletes({ list, more = '/recruits/', title = 'On the board' }: { list: Athlete[]; more?: string; title?: string }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const measure = () => {
      const t = track.current;
      setPinned(mq.matches && !reduce);
      if (t) setDistance(Math.max(0, t.scrollWidth - window.innerWidth + 64));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', measure);
    };
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const heading = (
    <div className="wrap flex items-end justify-between gap-6">
      <h2 id="featured-h" className="display text-5xl sm:text-6xl md:text-8xl">{title}</h2>
      <Link href={more} className="btn btn-ghost hidden md:inline-flex">All recruits</Link>
    </div>
  );

  if (!pinned) {
    return (
      <section ref={section} className="py-24" aria-labelledby="featured-h">
        {heading}
        <div data-lenis-prevent className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:px-8">
          {list.map((a) => (
            <div key={a.slug} className="snap-start"><AthleteCard a={a} size="lg" /></div>
          ))}
        </div>
        <div className="wrap mt-8 md:hidden"><Link href={more} className="btn btn-ghost w-full">All recruits</Link></div>
      </section>
    );
  }

  return (
    <section ref={section} style={{ height: `calc(100vh + ${distance}px)` }} className="relative" aria-labelledby="featured-h">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        {heading}
        <motion.div ref={track} style={{ x }} className="mt-10 flex w-max gap-5 pl-8 pr-8">
          {list.map((a) => (
            <AthleteCard key={a.slug} a={a} size="lg" />
          ))}
        </motion.div>
        <div className="wrap mt-10">
          <div className="h-px bg-line"><motion.div style={{ scaleX: bar }} className="h-px origin-left bg-accent" /></div>
        </div>
      </div>
    </section>
  );
}
