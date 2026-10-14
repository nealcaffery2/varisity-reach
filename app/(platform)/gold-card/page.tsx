import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { GoldCardShop } from '@/components/fundraise/gold-card';

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
    </>
  );
}
