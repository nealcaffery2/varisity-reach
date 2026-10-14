import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { RecruitBoard } from '@/components/recruit-board';

export const metadata: Metadata = {
  title: 'Recruit board',
  description: 'Filter small-school athletes by sport, state, school size, class, GPA, height, weight and verified stats. Every profile has stats, measurables, academics and film.',
};

export default function RecruitsPage() {
  return (
    <>
      <PageHeader title="Recruit" accent="board">
        Athletes from 1A to 4A schools in one place. Filter by sport, state, school size, GPA, height and weight, then send the search to your staff as a link.
      </PageHeader>
      <RecruitBoard />
    </>
  );
}
