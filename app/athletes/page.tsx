import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { RecruitBoard } from '@/components/recruit-board';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: 'Recruit board',
  description: `Filter ${site.school} athletes by sport, class, GPA, height and weight. Every profile has stats, measurables, academics and film.`,
};

export default function AthletesPage() {
  return (
    <>
      <PageHeader title="Recruit" accent="board">
        Every Topper with a profile. Filter by sport, class, GPA, height and weight, then send the search to your staff as a link.
      </PageHeader>
      <RecruitBoard />
    </>
  );
}
