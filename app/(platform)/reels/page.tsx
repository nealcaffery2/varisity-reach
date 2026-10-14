import type { Metadata } from 'next';
import { ReelFeed } from '@/components/reel-feed';

export const metadata: Metadata = {
  title: 'Reels',
  description: 'Vertical highlight clips of small-school athletes. Swipe through, like, share, and jump to any athlete’s recruiting profile.',
};

export default function ReelsPage() {
  return (
    <>
      <h1 className="sr-only">Highlight reels</h1>
      <ReelFeed />
    </>
  );
}
