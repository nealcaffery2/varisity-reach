import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { BoosterWall, GloryDays, SiblingSuperstars } from '@/components/school/boosters';
import { schoolBySlug } from '@/content/schools';
import { sportsFor } from '@/content/sports';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  return s ? { title: `${s.town} boosters and alumni`, description: `${s.name} boosters, alumni stories, old photos and clippings, and Sibling Superstars.`, robots: s.sample ? { index: false } : undefined } : {};
}

export default async function BoostersPage({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  const sports = sportsFor(school.slug).map((s) => ({ slug: s.slug, name: s.name }));
  return (
    <>
      <PageHeader title="Boosters" accent="and alumni">The people who fill the bleachers, run the concession stand and still talk about the 1987 sectional.</PageHeader>
      <section className="wrap py-14" aria-label="Booster wall"><BoosterWall school={school.slug} town={school.town} short={school.short} sports={sports} /></section>
      <section className="border-t border-line py-14" aria-labelledby="glory-h">
        <div className="wrap">
          <h2 id="glory-h" className="display text-5xl md:text-7xl">Glory <span className="text-accent">days</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">Alumni and boosters post the old photos, clippings and stories. Each post carries an alumni or booster tag.</p>
          <div className="mt-8"><GloryDays school={school.slug} short={school.short} sports={sports} /></div>
        </div>
      </section>
      <section className="border-t border-line py-14" aria-labelledby="sib-h">
        <div className="wrap">
          <h2 id="sib-h" className="display text-5xl md:text-7xl">Sibling <span className="text-accent">superstars</span></h2>
          <div className="mt-8"><SiblingSuperstars school={school.slug} short={school.short} /></div>
        </div>
      </section>
    </>
  );
}
