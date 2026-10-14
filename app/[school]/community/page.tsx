import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { WantsBoard } from '@/components/school/wants-board';
import { schoolBySlug } from '@/content/schools';
import { sportsFor } from '@/content/sports';
import { starterWants } from '@/content/wants';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  return s ? { title: `${s.town} wants board`, description: `What ${s.town} families and athletes want for ${s.name}, by vote, and what the school board is deciding.`, robots: s.sample ? { index: false } : undefined } : {};
}

export default async function CommunityPage({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  const sports = sportsFor(school.slug).map((s) => ({ slug: s.slug, name: s.name }));
  return (
    <>
      <PageHeader title="Wants" accent="board">What {school.town} families and athletes want for {school.short}, ranked by vote. The athletic director sees the totals.</PageHeader>
      <section className="wrap py-14"><WantsBoard school={school.slug} town={school.town} short={school.short} sports={sports} starters={starterWants(school.slug)} /></section>
      <section className="border-t border-line py-14" aria-labelledby="board-h">
        <div className="wrap grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 id="board-h" className="display text-5xl">On the board’s <span className="text-accent">agenda</span></h2>
            <p className="mt-4 text-mute">Facilities, schedules, fees, co-ops: when the school board votes on something that touches {school.short} activities, the athletic director posts it here with a link to the agenda, then the outcome.</p>
          </div>
          <div className="rounded border border-dashed border-line-2 p-6">
            <p className="font-semibold text-bone">Nothing posted yet</p>
            <p className="mt-2 text-sm text-mute">Board items show up once {school.name} claims its page.</p>
            {school.links.district && <a className="btn btn-ghost mt-4" href={school.links.district} target="_blank" rel="noreferrer">District website <ArrowSquareOut size={14} aria-hidden /></a>}
          </div>
        </div>
      </section>
    </>
  );
}
