'use client';

import { useEffect, useRef, type VideoHTMLAttributes } from 'react';

/** Muted clip that plays only while on screen, so a page of clips stays light. */
export function AutoplayVideo({ threshold = 0.5, ...props }: VideoHTMLAttributes<HTMLVideoElement> & { threshold?: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [threshold]);
  return <video ref={ref} muted loop playsInline preload="none" {...props} />;
}
