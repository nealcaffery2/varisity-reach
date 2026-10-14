'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import { site } from '@/content/site';
import { asset } from '@/lib/asset';
import { NAV } from './nav-links';


export function Nav() {
  const path = usePathname();
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

  if (path?.startsWith('/reels')) return null;
  const active = (href: string) => path?.startsWith(href);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-[background-color,border-color,backdrop-filter] duration-300 border-b ${
          solid || open ? 'bg-ink/85 backdrop-blur-md border-line' : 'bg-gradient-to-b from-ink/70 to-transparent border-transparent'
        }`}
      >
        <nav className="wrap flex h-16 items-center justify-between gap-6" aria-label="Main">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src={asset('/brand/Hillsboro.png')} alt="" width={44} height={44} className="h-11 w-11 object-contain" priority />
            <span className="display text-2xl leading-none">
              {site.mascot}
              <span className="sr-only"> home</span>
            </span>
          </Link>
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active(n.href) ? 'page' : undefined}
                  className={`relative inline-flex h-10 items-center px-3 text-[0.9375rem] font-medium transition-colors ${
                    active(n.href) ? 'text-bone' : 'text-bone/75 hover:text-bone'
                  }`}
                >
                  {n.label}
                  {active(n.href) && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-px h-0.5 bg-orange" />}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded text-bone lg:hidden"
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
            className="fixed inset-0 top-16 z-40 bg-ink lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="wrap flex flex-col pt-6">
              {NAV.map((n, i) => (
                <motion.li
                  key={n.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`display flex items-center justify-between py-4 text-5xl ${active(n.href) ? 'text-orange' : 'text-bone'}`}
                  >
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
