import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { GameList } from '@/components/game/game-list';

export const metadata: Metadata = { title: 'Games', description: 'Live scores reported from the stands, paired livestreams and plays for small-school games.' };

export default function GamesPage() {
  return (
    <>
      <PageHeader title="Game" accent="day">
        Scores reported from the stands by parents, students and local reporters, checked against each other, and locked by the coach when it counts.
      </PageHeader>
      <GameList />
    </>
  );
}
