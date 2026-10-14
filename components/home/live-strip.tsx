'use client';

import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { games } from '@/content/games';
import { sourceLine } from '@/lib/consensus';
import { useGameBoard } from '@/components/game/game-center';
import { Scorebug } from '@/components/game/scorebug';

function LiveTile({ id }: { id: string }) {
  const game = games.find((g) => g.id === id)!;
  const { board } = useGameBoard(game);
  return (
    <Link href={`/games/${game.id}/`} className="group block min-w-0">
      <Scorebug game={game} board={board} compact />
      <p className="mt-2 flex items-center justify-between gap-3 px-1 text-sm text-mute">
        <span>{sourceLine(board)}</span>
        <span className="inline-flex items-center gap-1 text-dim group-hover:text-bone">Game center <ArrowRight size={14} /></span>
      </p>
    </Link>
  );
}

/** The games happening right now, right under the hero. */
export function LiveStrip() {
  const live = games.filter((g) => g.status === 'live');
  const recent = games.filter((g) => g.status === 'final').slice(0, 1);
  const show = [...live, ...recent].slice(0, 2);
  if (!show.length) return null;
  return (
    <section className="border-b border-line bg-ink-2 py-8" aria-label="Live and recent games">
      <div className="wrap grid gap-6 lg:grid-cols-2">
        {show.map((g) => <LiveTile key={g.id} id={g.id} />)}
      </div>
    </section>
  );
}
