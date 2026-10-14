import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { CompareTool } from '@/components/compare-tool';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Line up a small-school athlete against a highly rated recruit, number by number: 40 time, lifts, production.',
};

export default function ComparePage() {
  return (
    <>
      <PageHeader title="Same numbers." accent="Smaller town.">
        Put a 1A to 4A athlete next to a highly rated recruit, measurable by measurable. If the 40 is the 40, the town should not matter.
      </PageHeader>
      <CompareTool />
    </>
  );
}
