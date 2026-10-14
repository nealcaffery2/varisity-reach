'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

const TAGS = { div: motion.div, li: motion.li, section: motion.section } as const;

/** Rise-in on first view. Reduced motion shows it in place. */
export function Reveal({ children, as = 'div', delay = 0, className }: { children: ReactNode; as?: keyof typeof TAGS; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const Tag = TAGS[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </Tag>
  );
}
