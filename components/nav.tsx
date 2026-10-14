'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import { platform } from '@/content/platform';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { asset } from '@/lib/asset';
import { PLATFORM_NAV, schoolNav } from './nav-links';
import { Wordmark } from './wordmark';

/** Pages that run full-screen with their own chrome. */
const BARE = ['/reels', '/overlay'];

export function Nav() {
  const path = usePathname() ?? '/';
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setSolid(y > 24));

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (BARE.some((b) => path.startsWith(b))) return null;

  const school = schoolBySlug(path.split('/')[1] ?? '');
  const links = school ? schoolNav(school.slug) : PLATFORM_NAV;
  const active = (href: string) => {
    const base = href.split('?')[0];
    return base !== '/' && path.startsWith(base);
  };

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50" style={school ? (schoolTheme(school) as React.CSSProperties) : undefined}>
      <div
        className={`border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
          solid || open ? 'border-line bg-ink/85 backdrop-blur-md' : 'border-transparent bg-gradient-to-b from-ink/70 to-transparent'
        }`}
      >
        <nav className="wrap flex h-16 items-center justify-between gap-6" aria-label="Main">
          {school ? (
            <Link href={`/${school.slug}/`} className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
              {school.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(school.logo)} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              ) : (
                <span aria-hidden className="display inline-flex h-10 w-10 items-center justify-center rounded bg-accent text-2xl text-accent-ink">{school.town[0]}</span>
              )}
              <span className="display truncate text-2xl leading-none">
                {school.mascot}
                <span className="sr-only">, {school.name} home</span>
              </span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center" onClick={() => setOpen(false)} aria-label={`${platform.name} home`}>
              <Wordmark />
            </Link>
          )}
          <ul className="hidden items-center gap-1 xl:flex">
            {links.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active(n.href) ? 'page' : undefined}
                  className={`relative inline-flex h-10 items-center px-3 text-[0.9375rem] font-medium transition-colors ${active(n.href) ? 'text-bone' : 'text-bone/75 hover:text-bone'}`}
                >
                  {n.label}
                  {active(n.href) && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-px h-0.5 bg-accent" />}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            {school ? (
              <Link href="/" className="hidden text-sm text-bone/70 hover:text-bone sm:inline-flex sm:min-h-11 sm:items-center">on {platform.name}</Link>
            ) : (
              <Link href="/coach/" className="btn btn-primary hidden sm:inline-flex">For coaches</Link>
            )}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded text-bone xl:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={26} /> : <List size={26} />}
            </button>
          </div>
        </nav>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            className="fixed inset-0 top-16 z-40 overflow-y-auto bg-ink xl:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="wrap flex flex-col pt-4">
              {[...links, school ? { href: '/', label: platform.name } : { href: '/coach/', label: 'For coaches' }].map((n, i) => (
                <motion.li
                  key={n.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.035, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <Link href={n.href} onClick={() => setOpen(false)} className={`display flex items-center py-3.5 text-4xl ${active(n.href) ? 'text-accent' : 'text-bone'}`}>
                    {n.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
