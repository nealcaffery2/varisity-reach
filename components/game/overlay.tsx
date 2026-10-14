'use client';

import { useEffect } from 'react';
import type { Game } from '@/content/games';
import { sourceLine } from '@/lib/consensus';
import { platform } from '@/content/platform';
import { useGameBoard } from './game-center';
import { Scorebug } from './scorebug';

/** The score bar alone on a transparent page, for a streamer's browser source. */
export function Overlay({ game }: { game: Game }) {
  const { board } = useGameBoard(game);
  useEffect(() => {
    const els = [document.documentElement, document.body];
    const before = els.map((e) => e.style.background);
    els.forEach((e) => (e.style.background = 'transparent'));
    return () => els.forEach((e, i) => (e.style.background = before[i]));
  }, []);
  return (
    <main className="flex min-h-dvh items-end p-4">
      <div className="w-full max-w-3xl">
        <Scorebug game={game} board={board} compact />
        <p className="mt-1 inline-block rounded-sm bg-ink/80 px-2 py-0.5 text-xs text-bone/85">
          {sourceLine(board)} · {platform.name}
        </p>
      </div>
    </main>
  );
}
