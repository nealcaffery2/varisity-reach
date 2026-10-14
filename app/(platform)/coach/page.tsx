import type { Metadata } from 'next';
import Link from 'next/link';
import { Broadcast, SealCheck, Star, VideoCamera } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { RosterImport } from '@/components/coach/roster-import';
import { PostNeed } from '@/components/coach/post-need';

export const metadata: Metadata = {
  title: 'Coach dashboard',
  description: 'Update rosters and stats from a photo, spreadsheet or PDF, post what the team needs, and get your athletes seen.',
};

const TOOLS = [
  { icon: Broadcast, title: 'Lock a score', text: 'Verified coaches can lock the live score from the game page. A lock beats every fan report.', href: '/games/' },
  { icon: VideoCamera, title: 'Add film', text: 'Send clips from Hudl or your phone. Each one lands on the athlete’s profile and in the reel feed.', href: '/reels/' },
  { icon: Star, title: 'Nominate an underdog', text: 'Name one athlete a week who deserves more eyes. The community votes.', href: '/spotlight/' },
];

export default function CoachPage() {
  return (
    <>
      <PageHeader title="Coach" accent="dashboard">
        Snap the stat sheet after the game, approve the changes, and every profile your athletes send to colleges is current.
      </PageHeader>
      <div className="wrap grid gap-10 py-12 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-10">
          <RosterImport />
          <PostNeed />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded border border-accent/50 p-5">
            <h2 className="display flex items-center gap-2 text-3xl"><SealCheck size={26} weight="fill" className="text-accent" /> Get verified</h2>
            <p className="mt-2 text-sm text-mute">Verified coaches publish rosters with a mark recruiters filter on, lock scores, and post needs. We confirm you with your athletic director.</p>
            <Link href="/join/" className="btn btn-primary mt-4 w-full">Start verification</Link>
          </section>
          <ul className="space-y-3">
            {TOOLS.map((t) => (
              <li key={t.title}>
                <Link href={t.href} className="group block rounded border border-line p-4 transition-colors hover:border-line-2">
                  <t.icon size={22} className="text-accent" />
                  <p className="mt-2 font-semibold text-bone group-hover:text-accent">{t.title}</p>
                  <p className="mt-1 text-sm text-mute">{t.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
