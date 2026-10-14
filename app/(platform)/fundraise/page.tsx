import type { Metadata } from 'next';
import Link from 'next/link';
import { Cardholder } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { CampaignList } from '@/components/fundraise/campaign-list';

export const metadata: Metadata = {
  title: 'Fundraise',
  description: 'Cash for Cleats, buses to state, recruiting camps and equipment, posted by coaches and backed by their schools.',
};

export default function FundraisePage() {
  return (
    <>
      <PageHeader title="Back a" accent="team">
        Coaches post what the team needs. The school or its booster club approves it and receives the money directly.
      </PageHeader>
      <div className="wrap grid gap-12 py-12 lg:grid-cols-[1fr_20rem]">
        <CampaignList />
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Link href="/gold-card/" className="group block rounded border border-accent/50 p-5 transition-colors hover:bg-ink-2">
            <Cardholder size={30} className="text-accent" />
            <p className="display mt-3 text-3xl text-bone group-hover:text-accent">Gold card</p>
            <p className="mt-1 text-sm text-mute">A season of local discounts on your phone. Every card sold funds the team.</p>
          </Link>
          <Link href="/coach/" className="block rounded border border-line p-5 transition-colors hover:border-line-2">
            <p className="font-semibold text-bone">Coach? Post a need</p>
            <p className="mt-1 text-sm text-mute">Cleats, travel, camps, equipment. Approved by your athletic director.</p>
          </Link>
        </aside>
      </div>
    </>
  );
}
