'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll } from 'motion/react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';

/**
 * Horizontal rail: native scroll-snap for touch, click-drag on desktop,
 * arrow buttons, and a progress bar tied to the rail's own scroll.
 */
export function Slider({ children, label, title }: { children: ReactNode; label: string; title?: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: rail });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide]');
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 320) + 16), behavior: 'smooth' });
  };

  return (
    <div>
      <div className="wrap mb-8 flex items-end justify-between gap-6">
        {title}
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => step(-1)} aria-label={`Previous ${label}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 text-bone transition-colors hover:border-bone hover:bg-ink-3">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={`Next ${label}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-2 text-bone transition-colors hover:border-bone hover:bg-ink-3">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        role="region"
        aria-label={label}
        tabIndex={0}
        data-lenis-prevent
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:scroll-px-8 md:px-8 cursor-grab active:cursor-grabbing [&.dragging]:snap-none [&.dragging_a]:pointer-events-none"
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || !rail.current) return;
          drag.current = { x: e.clientX, left: rail.current.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          const el = rail.current;
          if (!d || !el) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) {
            d.moved = true;
            el.classList.add('dragging');
          }
          el.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          drag.current = null;
          rail.current?.classList.remove('dragging');
        }}
        onPointerLeave={() => {
          drag.current = null;
          rail.current?.classList.remove('dragging');
        }}
      >
        {children}
      </div>
      <div className="wrap mt-6">
        <div className="h-px w-full bg-line">
          <motion.div className="h-px origin-left bg-orange" style={{ scaleX: scrollXProgress }} />
        </div>
      </div>
    </div>
  );
}
