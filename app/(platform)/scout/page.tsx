import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { ScoutBoard } from '@/components/recruiter/scout-board';
import { NeedsBoard } from '@/components/recruiter/needs-board';
import { prospects, sampleNeeds } from '@/content/scout';

export const metadata: Metadata = {
  title: 'Scout',
  description: 'Diamonds in the fields, Cornfed rankings, the Smallest Town Athlete of the Week, scramble mode and what college coaches need next season.',
};

export default function ScoutPage() {
  return (
    <>
      <PageHeader title="Scout" accent="the fields">
        Where the production is and the recruiters are not. Built to send college coaches down county roads.
      </PageHeader>
      <section className="wrap py-14"><ScoutBoard prospects={prospects} /></section>
      <section className="border-t border-line py-14" aria-labelledby="needs-h">
        <div className="wrap">
          <h2 id="needs-h" className="display text-5xl md:text-7xl">Coaches <span className="text-accent">need</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">Verified college coaches post the positions, classes and timeline they are recruiting for, and what they do not need right now. Families send a highlight tape where it fits.</p>
          <div className="mt-8"><NeedsBoard entries={sampleNeeds} /></div>
        </div>
      </section>
    </>
  );
}
