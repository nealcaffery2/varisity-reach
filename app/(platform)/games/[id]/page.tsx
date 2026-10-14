import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { games, gameById } from '@/content/games';
import { sportBySlug } from '@/content/sports';
import { GameCenter } from '@/components/game/game-center';

export const dynamicParams = false;
export const generateStaticParams = () => games.map((g) => ({ id: g.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = gameById((await params).id);
  return g ? { title: `${g.home.short} vs ${g.away.short}`, description: `Live score, streams and plays: ${g.home.name} vs ${g.away.name}, ${sportBySlug(g.sport)?.name}.`, robots: g.sample ? { index: false } : undefined } : {};
}

export default async function GamePage({ params }: Props) {
  const g = gameById((await params).id);
  if (!g) notFound();
  return (
    <div className="wrap pb-20 pt-24 md:pt-28">
      <Link href="/games/" className="inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone"><ArrowLeft size={16} /> All games</Link>
      <h1 className="display mt-3 text-5xl md:text-7xl">
        {g.home.name.replace(' (sample)', '')} <span className="text-dim">vs</span> {g.away.name.replace(' (sample)', '')}
      </h1>
      <p className="mt-2 text-mute">
        {sportBySlug(g.sport)?.name} · {g.level} · {g.venue}
        {g.sample && <span className="text-dim"> · Sample game, made up to show the game center</span>}
      </p>
      <div className="mt-8"><GameCenter game={g} /></div>
    </div>
  );
}
