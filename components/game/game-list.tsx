'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { games, type Game } from '@/content/games';
import { schools, schoolBySlug } from '@/content/schools';
import { sportBySlug } from '@/content/sports';
import { sourceLine } from '@/lib/consensus';
import { useGameBoard } from './game-center';
import { Scorebug } from './scorebug';

function Tile({ game }: { game: Game }) {
  const { board } = useGameBoard(game);
  return (
    <li className="min-w-0">
      <Link href={`/games/${game.id}/`} className="group block min-w-0 rounded border border-line p-3 transition-colors hover:border-line-2 hover:bg-ink-2">
        <Scorebug game={game} board={board} compact />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
          <span className="text-mute">{sportBySlug(game.sport)?.name} · {game.venue}</span>
          <span className="inline-flex items-center gap-1 text-dim group-hover:text-bone">{game.status === 'scheduled' ? 'Preview' : sourceLine(board)} <ArrowRight size={14} /></span>
        </div>
      </Link>
    </li>
  );
}

const ORDER: Record<Game['status'], number> = { live: 0, scheduled: 1, final: 2 };

export function GameList() {
  const [school, setSchool] = useState('');
  useEffect(() => {
    const sc = new URLSearchParams(window.location.search).get('school');
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sc && schoolBySlug(sc)) setSchool(sc);
  }, []);
  const list = games
    .filter((g) => !school || g.home.school === school || g.away.school === school)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.kickoff.localeCompare(b.kickoff));
  const groups: [string, Game[]][] = [
    ['Live now', list.filter((g) => g.status === 'live')],
    ['Coming up', list.filter((g) => g.status === 'scheduled')],
    ['Final', list.filter((g) => g.status === 'final')],
  ];
  return (
    <div className="wrap py-12">
      <div>
        <label htmlFor="games-school" className="field-label">School</label>
        <select
          id="games-school"
          className="field w-auto"
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            window.history.replaceState(null, '', e.target.value ? `?school=${e.target.value}` : window.location.pathname);
          }}
        >
          <option value="">Every school on the network</option>
          {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      {list.length === 0 ? (
        <div className="mt-10 rounded border border-dashed border-line-2 p-10">
          <p className="display text-4xl">No games posted</p>
          <p className="mt-3 max-w-md text-mute">Games appear once a coach uploads the schedule. Then anyone at the game can report the score and pair a stream.</p>
          <Link href="/coach/" className="btn btn-primary mt-6">Coach dashboard</Link>
        </div>
      ) : (
        groups.map(([label, gs]) =>
          gs.length ? (
            <section key={label} className="mt-12" aria-label={label}>
              <h2 className="display text-4xl">{label}</h2>
              <ul className="mt-5 grid gap-4 lg:grid-cols-2">{gs.map((g) => <Tile key={g.id} game={g} />)}</ul>
            </section>
          ) : null,
        )
      )}
    </div>
  );
}
