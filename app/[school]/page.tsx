import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Hero } from '@/components/home/hero';
import { Ticker } from '@/components/home/ticker';
import { SeasonTeams } from '@/components/home/season-teams';
import { FeaturedAthletes } from '@/components/home/featured-athletes';
import { Slider } from '@/components/slider';
import { NewsCard } from '@/components/news-card';
import { ReelStrip } from '@/components/reel-strip';
import { Reveal } from '@/components/reveal';
import { news, events, tickers } from '@/content/news';
import { athletesAt } from '@/content/athletes';
import { publicReels as reels, reelById } from '@/content/reels';
import { sportsFor } from '@/content/sports';
import { schoolBySlug } from '@/content/schools';
import { campaignsFor } from '@/content/fundraising';
import { CampaignCard } from '@/components/campaign-card';
import { PlacePhotos } from '@/components/school/place-photos';
import { dayParts } from '@/lib/format';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  if (!s) return {};
  return {
    title: { absolute: `${s.town} ${s.mascot} | ${s.name} athletics` },
    description: `Scores, film and recruiting profiles for ${s.name} athletes in ${s.town}, ${s.state}.`,
    robots: s.sample ? { index: false, follow: true } : undefined,
  };
}

const PROFILE_FIELDS = [
  ['Measurables', 'Height, weight, 40, vertical, lifts, wingspan'],
  ['Academics', 'Unweighted GPA, ACT or SAT, core GPA, NCAA status'],
  ['Production', 'Season-by-season stats from the coach’s book'],
  ['Film', 'Vertical reels that play in one tap on a phone'],
  ['Contact', 'Head coach and athletic office, one tap away'],
];

export default async function SchoolHome({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  const roster = athletesAt(school.slug);
  const featured = [...roster].sort((a, b) => a.gradYear - b.gradYear || b.gpa - a.gpa).slice(0, 8);
  const slugs = new Set(roster.map((a) => a.slug));
  const reelRow = reels.filter((r) => r.athlete && slugs.has(r.athlete)).slice(0, 4);
  const stories = news.filter((n) => n.school === school.slug);
  const dates = events.filter((e) => e.school === school.slug);
  const hero = reelById(school.heroReel) ?? reels[0];
  const ticker = tickers[school.slug] ?? [];
  const teams = sportsFor(school.slug);
  const drives = campaignsFor(school.slug);

  return (
    <>
      <Hero
        over={school.town}
        word={school.mascot}
        label={`${school.name} athletics`}
        sub={`Scores, film and recruiting profiles for every ${school.short.replace(/s$/, '')} at ${school.name}.`}
        reel={hero}
        image={school.heroImage}
        primary={{ href: `/reels/?school=${school.slug}`, label: 'Watch reels' }}
        secondary={{ href: `/recruits/?school=${school.slug}`, label: 'Recruit board' }}
      />
      {ticker.length > 0 && <Ticker items={ticker} />}
      {school.sample && (
        <p className="border-b border-line bg-ink-2 py-3 text-center text-sm text-mute">
          Sample school. {school.town} and its athletes are made up to show what a school site looks like.
        </p>
      )}

      {stories.length > 0 && (
        <section id="highlights" className="scroll-mt-16 py-24 md:py-32" aria-labelledby="highlights-h">
          <Slider label="highlights" title={<h2 id="highlights-h" className="display text-5xl sm:text-6xl md:text-8xl">Highlights</h2>}>
            {stories.map((n, i) => (
              <NewsCard key={n.slug} item={n} wide={i === 0} />
            ))}
          </Slider>
        </section>
      )}

      <SeasonTeams school={school.slug} list={teams} />

      {featured.length > 0 && <FeaturedAthletes list={featured} more={`/recruits/?school=${school.slug}`} />}

      {reelRow.length > 0 && (
        <section className="bg-bone py-24 text-ink md:py-32" aria-labelledby="reels-h">
          <div className="wrap">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 id="reels-h" className="display text-5xl sm:text-6xl md:text-8xl">
                Film, <span className="text-accent-deep">vertical.</span>
              </h2>
              <p className="max-w-sm text-lg text-ink/70">Swipe through clips the way recruits and fans already watch. Every reel links to the athlete’s profile.</p>
            </div>
            <div className="mt-12"><ReelStrip list={reelRow} query={`?school=${school.slug}`} /></div>
            <Link href={`/reels/?school=${school.slug}`} className="btn mt-10 bg-ink text-bone hover:bg-ink-3">Open the reel feed <ArrowRight size={16} /></Link>
          </div>
        </section>
      )}

      {drives.length > 0 && (
        <section className="py-24 md:py-32" aria-labelledby="drives-h">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 id="drives-h" className="display text-5xl sm:text-6xl md:text-8xl">Back the <span className="text-accent">{school.short}</span></h2>
              <Link href={`/fundraise/?school=${school.slug}`} className="btn btn-ghost">All fundraisers</Link>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {drives.slice(0, 2).map((c) => <CampaignCard key={c.id} c={c} />)}
            </div>
          </div>
        </section>
      )}

      <PlacePhotos school={school} />

      <section className="border-t border-line py-24 md:py-32" aria-labelledby="coaches-h">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <h2 id="coaches-h" className="display text-5xl sm:text-6xl md:text-8xl">College coach? <span className="text-accent">Start here.</span></h2>
            <p className="mt-6 max-w-md text-lg text-mute">
              Filter every {school.short.replace(/s$/, '')} by sport, class, GPA, height and weight. Send the search as a link. Print any profile as a one-page sheet.
            </p>
            <Link href={`/recruits/?school=${school.slug}`} className="btn btn-primary mt-8">Recruit board <ArrowRight size={16} /></Link>
          </div>
          <dl className="border-t border-line">
            {PROFILE_FIELDS.map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.05} className="grid grid-cols-[8rem_1fr] gap-6 border-b border-line py-5 md:grid-cols-[11rem_1fr]">
                <dt className="display text-3xl text-bone">{k}</dt>
                <dd className="self-center text-mute">{v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {dates.length > 0 && (
        <section className="border-t border-line bg-ink-2 py-24" aria-labelledby="dates-h">
          <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 id="dates-h" className="display text-6xl">Mark it</h2>
              <p className="mt-4 max-w-sm text-mute">District dates that change practice and game times. Game schedules live on each team page.</p>
              {school.links.schedules && <a href={school.links.schedules} className="btn btn-ghost mt-6">All game schedules</a>}
            </div>
            <ol className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
              {dates.map((e) => {
                const d = dayParts(e.date);
                return (
                  <li key={e.date} className="flex gap-5 bg-ink-2 p-6">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-xs uppercase text-accent">{d.month}</p>
                      <p className="display text-5xl">{d.day}</p>
                      <p className="text-xs text-dim">{d.dow}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-bone">{e.title}</p>
                      {e.detail && <p className="mt-1 text-sm text-mute">{e.detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}
