import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { StatsBoard } from '@/components/stats-board';

export const metadata: Metadata = { title: 'Stats', description: 'Season leaders and sortable stat tables for small-school athletes across the network.' };

export default function StatsPage() {
  return (
    <>
      <PageHeader title="Stats">Leaders across every school on the network, or one school at a time. Click a column to sort.</PageHeader>
      <StatsBoard />
    </>
  );
}
