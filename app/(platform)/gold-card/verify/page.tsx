import type { Metadata } from 'next';
import { GoldCardVerify } from '@/components/fundraise/gold-card-verify';

export const metadata: Metadata = { title: 'Check a gold card', robots: { index: false } };

export default function VerifyPage() {
  return (
    <div className="wrap pb-20 pt-28">
      <h1 className="display text-center text-5xl md:text-7xl">Check a gold card</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-mute">For merchants. Point your phone camera at the customer’s code; this page opens with the answer.</p>
      <div className="mt-10"><GoldCardVerify /></div>
    </div>
  );
}
