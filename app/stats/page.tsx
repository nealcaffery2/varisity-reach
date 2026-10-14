import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { StatsBoard } from '@/components/stats-board';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'Stats', description: `Season leaders and sortable stat tables for ${site.school} teams.` };

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Stats">Leaders and full tables by sport. Click a column to sort.</PageHeader>
      <StatsBoard />
    </>
  );
}
