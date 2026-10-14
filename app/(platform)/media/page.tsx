import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { CoverageBoard, CreatorSignup, LicenseTable } from '@/components/media/marketplace';

export const metadata: Metadata = { title: 'Photo and video', description: 'Coaches request game coverage, local photographers and videographers take it, and schools and newspapers license the shots with credit.' };

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Shoot" accent="the game">Local photographers and videographers cover small-school games. Coaches ask, creators show up, schools and papers pay to use the shots, and every sale credits the shooter and feeds the team fund.</PageHeader>
      <section className="wrap py-14" aria-labelledby="cov-h">
        <h2 id="cov-h" className="display text-5xl md:text-7xl">Open <span className="text-accent">requests</span></h2>
        <div className="mt-8"><CoverageBoard /></div>
      </section>
      <section className="border-t border-line py-14" aria-labelledby="lic-h">
        <div className="wrap">
          <h2 id="lic-h" className="display text-5xl md:text-7xl">Licenses</h2>
          <p className="mt-4 max-w-[34rem] text-mute">The photographer keeps the copyright. A family, the school, a newspaper or a sponsor buys the right to use a shot. Every use carries the credit line, and commercial use of a student needs the family’s release first.</p>
          <div className="mt-8"><LicenseTable /></div>
        </div>
      </section>
      <section className="border-t border-line py-14" aria-labelledby="join-h">
        <div className="wrap max-w-4xl">
          <h2 id="join-h" className="display text-5xl md:text-7xl">Shoot <span className="text-accent">for us</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">Students with a phone and a good eye count too. Payouts go through Stripe.</p>
          <div className="mt-8"><CreatorSignup /></div>
        </div>
      </section>
    </>
  );
}
