import Link from 'next/link';
import { ArrowRight, Play } from '@phosphor-icons/react/dist/ssr';
import { Hero } from '@/components/home/hero';
import { Ticker } from '@/components/home/ticker';
import { SeasonTeams } from '@/components/home/season-teams';
import { FeaturedAthletes } from '@/components/home/featured-athletes';
import { Slider } from '@/components/slider';
import { NewsCard } from '@/components/news-card';
import { AutoplayVideo } from '@/components/autoplay-video';
import { Reveal } from '@/components/reveal';
import { news, events } from '@/content/news';
import { athletes, athleteBySlug, fullName } from '@/content/athletes';
import { reels } from '@/content/reels';
import { sportBySlug } from '@/content/sports';
import { site } from '@/content/site';
import { dayParts } from '@/lib/format';
import { asset } from '@/lib/asset';

const TICKER = [
  'Boys soccer 9-0 in the SCC',
  'Boys soccer 4, Litchfield 0',
  'Football into the 3A playoffs',
  'Boys golf back to state',
  'Matoush IBCA all-state first team',
  'Eickhoff regional medalist',
];

const PROFILE_FIELDS = [
  ['Measurables', 'Height, weight, 40, vertical, lifts, wingspan'],
  ['Academics', 'Unweighted GPA, ACT or SAT, core GPA, NCAA status'],
  ['Production', 'Season-by-season stats from the coach’s book'],
  ['Film', 'Vertical reels that play in one tap on a phone'],
  ['Contact', 'Head coach and athletic office, one tap away'],
];

export default function Home() {
  const featured = [...athletes].sort((a, b) => a.gradYear - b.gradYear || b.gpa - a.gpa).slice(0, 8);
  const reelRow = reels.slice(0, 4);

  return (
    <>
      <Hero />
      <Ticker items={TICKER} />

      <section id="highlights" className="scroll-mt-16 py-24 md:py-32" aria-labelledby="highlights-h">
        <Slider label="highlights" title={<h2 id="highlights-h" className="display text-5xl sm:text-6xl md:text-8xl">Highlights</h2>}>
          {news.map((n, i) => (
            <NewsCard key={n.slug} item={n} wide={i === 0} />
          ))}
        </Slider>
      </section>

      <SeasonTeams />

      <FeaturedAthletes list={featured} />

      <section className="bg-bone py-24 text-ink md:py-32" aria-labelledby="reels-h">
        <div className="wrap">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 id="reels-h" className="display text-5xl sm:text-6xl md:text-8xl">
              Film, <span className="text-orange-deep">vertical.</span>
            </h2>
            <p className="max-w-sm text-lg text-ink/70">Swipe through clips the way recruits and fans already watch. Every reel links to the athlete’s profile.</p>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {reelRow.map((r, i) => {
              const a = r.athlete ? athleteBySlug(r.athlete) : undefined;
              return (
                <Reveal as="li" key={r.id} delay={i * 0.06}>
                  <Link href={`/reels/#${r.id}`} className="group relative block aspect-[9/16] overflow-hidden rounded bg-ink">
                    <AutoplayVideo src={asset(r.src)} poster={asset(r.poster)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" aria-hidden />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-bone">
                      <p className="text-xs text-orange">{sportBySlug(r.sport)?.name}</p>
                      <p className="mt-1 font-semibold leading-tight">{a ? fullName(a) : r.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-bone/70">{r.title}</p>
                    </div>
                    <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur transition-colors group-hover:bg-orange group-hover:text-orange-ink">
                      <Play size={14} weight="fill" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
          <Link href="/reels/" className="btn mt-10 bg-ink text-bone hover:bg-ink-3">Open the reel feed <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="py-24 md:py-32" aria-labelledby="coaches-h">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <h2 id="coaches-h" className="display text-5xl sm:text-6xl md:text-8xl">College coach? <span className="text-orange">Start here.</span></h2>
            <p className="mt-6 max-w-md text-lg text-mute">
              Filter every Topper by sport, class, GPA, height and weight. Send the search as a link. Print any profile as a one-page sheet.
            </p>
            <Link href="/athletes/" className="btn btn-primary mt-8">Recruit board <ArrowRight size={16} /></Link>
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

      <section className="border-t border-line bg-ink-2 py-24" aria-labelledby="dates-h">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="dates-h" className="display text-6xl">Mark it</h2>
            <p className="mt-4 max-w-sm text-mute">District dates that change practice and game times. Game schedules live on each team page.</p>
            <a href={site.links.schedules} className="btn btn-ghost mt-6">All game schedules</a>
          </div>
          <ol className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
            {events.map((e) => {
              const d = dayParts(e.date);
              return (
                <li key={e.date} className="flex gap-5 bg-ink-2 p-6">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-xs uppercase text-orange">{d.month}</p>
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
    </>
  );
}
