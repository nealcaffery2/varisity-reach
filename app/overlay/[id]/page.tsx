import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { games, gameById } from '@/content/games';
import { Overlay } from '@/components/game/overlay';

export const dynamicParams = false;
export const generateStaticParams = () => games.map((g) => ({ id: g.id }));
export const metadata: Metadata = { title: 'Scoreboard overlay', robots: { index: false } };

/** Browser source for OBS, Streamlabs and Prism: a transparent page with only the score bar. */
export default async function OverlayPage({ params }: { params: Promise<{ id: string }> }) {
  const g = gameById((await params).id);
  if (!g) notFound();
  return <Overlay game={g} />;
}
