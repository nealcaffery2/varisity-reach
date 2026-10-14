import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { FunAwards } from '@/components/media/fun-awards';

export const metadata: Metadata = { title: 'Fun awards', description: 'Shakiest Camera and Loudest Parent of the Week. Vote once per award, every week.' };

export default function AwardsPage() {
  return (
    <>
      <PageHeader title="The bleacher" accent="awards">Every small-town game has a parent filming the sky and a parent you can hear from the parking lot. They deserve a trophy. One vote per award, every week.</PageHeader>
      <section className="wrap py-14"><FunAwards /></section>
    </>
  );
}
