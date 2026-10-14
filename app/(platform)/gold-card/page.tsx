import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { GoldCardShop } from '@/components/fundraise/gold-card';
import { MerchantSignup } from '@/components/fundraise/merchant-signup';

export const metadata: Metadata = {
  title: 'Gold card',
  description: 'A season of local discounts on your phone. Every card sold funds a small-school team.',
};

export default function GoldCardPage() {
  return (
    <>
      <PageHeader title="Gold" accent="card">
        The fundraiser card, on your phone. Local businesses give a discount all season, the shop scans the code, and the money goes to the team.
      </PageHeader>
      <div className="wrap py-12"><GoldCardShop /></div>
      <section className="border-t border-line py-14" aria-labelledby="merch-h">
        <div className="wrap">
          <h2 id="merch-h" className="display text-5xl md:text-7xl">Own a <span className="text-accent">business?</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">Put a deal on the card. You get foot traffic from every family in the bleachers, and the team gets the card money.</p>
          <div className="mt-8"><MerchantSignup /></div>
        </div>
      </section>
    </>
  );
}
