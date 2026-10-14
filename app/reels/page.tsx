import type { Metadata } from 'next';
import { ReelFeed } from '@/components/reel-feed';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: 'Reels',
  description: `Vertical highlight clips of ${site.school} athletes. Swipe through, like, share, and jump to any athlete's recruiting profile.`,
};

export default function ReelsPage() {
  return (
    <>
      <h1 className="sr-only">Hiltopper highlight reels</h1>
      <ReelFeed />
    </>
  );
}
