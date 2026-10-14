'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { Board } from '@/lib/consensus';
import type { Game, Side } from '@/content/games';

function Score({ value }: { value: number }) {
  return (
    <span className="relative inline-flex h-[1em] min-w-[1.4ch] justify-end overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="num block leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Team({ side, score, lead, align }: { side: Side; score: number; lead: boolean; align: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="h-full w-1.5 shrink-0 self-stretch rounded-sm" style={{ background: side.color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="display truncate text-2xl leading-none text-bone sm:text-3xl">{side.short}</p>
        <p className="truncate text-xs text-mute">{side.name}</p>
      </div>
      <span className={`display text-5xl leading-none sm:text-6xl ${lead ? 'text-bone' : 'text-bone/70'}`}>
        <Score value={score} />
      </span>
    </div>
  );
}

/**
 * The broadcast-style score bar. Used on the game page and, transparent, as
 * the OBS/Streamlabs browser-source overlay.
 */
export function Scorebug({ game, board, compact = false }: { game: Game; board: Board; compact?: boolean }) {
  const live = game.status === 'live' && !board.final;
  const period = board.final ? 'Final' : board.period ?? (game.status === 'scheduled' ? 'Pregame' : '');
  return (
    <div className={`flex items-stretch gap-3 rounded border border-line-2 bg-ink/90 backdrop-blur-md ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`} role="group" aria-label={`${game.home.name} ${board.home}, ${game.away.name} ${board.away}, ${period}`}>
      <Team side={game.home} score={board.home} lead={board.home > board.away} align="left" />
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-x border-line px-2 text-center sm:w-24">
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase text-accent-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" aria-hidden /> Live
          </span>
        ) : (
          <span className="text-[0.6875rem] font-semibold uppercase text-mute">{game.status === 'scheduled' ? 'Soon' : 'Final'}</span>
        )}
        <span className="display mt-1 text-2xl leading-none text-bone">{period}</span>
      </div>
      <Team side={game.away} score={board.away} lead={board.away > board.home} align="right" />
    </div>
  );
}
