import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarBlank, FilePdf } from '@phosphor-icons/react/dist/ssr';
import { sportsFor } from '@/content/sports';
import { athletesAt, fullName } from '@/content/athletes';
import { news } from '@/content/news';
import { schoolBySlug } from '@/content/schools';
import { AthleteCard } from '@/components/athlete-card';
import { NewsCard } from '@/components/news-card';
import { AutoplayVideo } from '@/components/autoplay-video';
import { leaders, usedKeys } from '@/lib/stats';
import { formatStat } from '@/lib/format';
import { asset } from '@/lib/asset';

export const dynamicParams = false;
export const generateStaticParams = ({ params }: { params: { school: string } }) => sportsFor(params.school).map((s) => ({ slug: s.slug }));

type Props = { params: Promise<{ school: string; slug: string }> };

async function load(params: Props['params']) {
  const p = await params;
  const school = schoolBySlug(p.school);
  const s = school ? sportsFor(school.slug).find((x) => x.slug === p.slug) : undefined;
  return { school, s };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school, s } = await load(params);
  return s && school ? { title: `${school.town} ${s.name}`, description: `${school.name} ${s.name.toLowerCase()}: coaches, schedule, roster and stat leaders.`, robots: school.sample ? { index: false } : undefined } : {};
}

export default async function SportPage({ params }: Props) {
  const { school, s } = await load(params);
  if (!s || !school) notFound();
  const pool = athletesAt(school.slug);
  const roster = pool.filter((a) => a.sports.includes(s.slug));
  const stories = news.filter((n) => n.school === school.slug && n.sport === s.slug);
  const keys = usedKeys(pool, s).slice(0, 4);

  return (
    <>
      <header className="relative isolate flex min-h-[70svh] items-end overflow-hidden border-b border-line pb-12 pt-32">
        {s.reel && (
          <div className="absolute inset-0 -z-10">
            <AutoplayVideo src={asset(s.reel)} className="h-full w-full object-cover grayscale opacity-50" threshold={0.1} aria-hidden />
            <div className="absolute inset-0 bg-accent mix-blend-multiply opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="wrap">
          <Link href={`/${school.slug}/teams/`} className="inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone"><ArrowLeft size={16} /> All teams</Link>
          <p className="mt-6 text-accent">{s.season} · {s.gender === 'Co-ed' ? 'Boys and girls' : s.gender}</p>
          <h1 className="display mt-2 text-[clamp(4rem,13vw,11rem)]">{s.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-bone/80">{s.blurb}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {s.scheduleUrl ? (
              <a href={s.scheduleUrl} className="btn btn-primary"><FilePdf size={18} /> 2026-27 schedule</a>
            ) : (
              school.links.schedules && <a href={school.links.schedules} className="btn btn-primary"><CalendarBlank size={18} /> Schedule</a>
            )}
            {school.links.calendar && <a href={school.links.calendar} className="btn btn-ghost">Live calendar</a>}
            <Link href={`/games/?school=${school.slug}`} className="btn btn-ghost">Live scores</Link>
          </div>
        </div>
      </header>

      <div className="wrap grid gap-16 py-16 md:py-24 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-20">
          {keys.length > 0 && (
            <section aria-labelledby="leaders-h">
              <h2 id="leaders-h" className="display text-5xl">Leaders</h2>
              <div className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
                {keys.map((k) => {
                  const top = leaders(pool, s, k, 3);
                  return (
                    <div key={k.key} className="bg-ink p-6">
                      <h3 className="text-sm text-mute">{k.long}</h3>
                      <ol className="mt-4 space-y-3">
                        {top.map((l, i) => (
                          <li key={l.athlete.slug} className="flex items-baseline justify-between gap-4">
                            <Link href={`/athletes/${l.athlete.slug}/`} className={`link-u ${i === 0 ? 'font-semibold text-bone' : 'text-mute hover:text-bone'}`}>
                              {fullName(l.athlete)}
                            </Link>
                            <span className={`num ${i === 0 ? 'text-2xl text-accent' : 'text-bone'}`}>{formatStat(l.value, k)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
              <Link href={`/stats/?sport=${s.slug}&school=${school.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone">Full {s.name.toLowerCase()} stats <ArrowUpRight size={14} /></Link>
            </section>
          )}

          <section aria-labelledby="roster-h">
            <h2 id="roster-h" className="display text-5xl">On the recruit board</h2>
            {roster.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {roster.map((a) => <AthleteCard key={a.slug} a={a} />)}
              </div>
            ) : (
              <div className="mt-8 rounded border border-dashed border-line-2 p-8">
                <p className="font-semibold text-bone">No {s.name.toLowerCase()} profiles yet.</p>
                <p className="mt-2 max-w-md text-mute">The coach adds the roster from the coach dashboard: upload a spreadsheet, a PDF or a photo of the roster sheet.</p>
                <Link href="/coach/" className="btn btn-ghost mt-5">Coach dashboard</Link>
              </div>
            )}
          </section>

          {stories.length > 0 && (
            <section aria-labelledby="news-h">
              <h2 id="news-h" className="display text-5xl">News</h2>
              <div className="no-scrollbar mt-8 flex gap-4 overflow-x-auto" data-lenis-prevent>
                {stories.map((n) => <NewsCard key={n.slug} item={n} />)}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="coaches-h">
          <h2 id="coaches-h" className="display text-3xl">Coaching staff</h2>
          {s.coaches.length ? (
            <>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {s.coaches.map((c) => (
                  <li key={c} className="py-3 text-bone">{c}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-dim">
                As listed by the school athletics office.{' '}
                {school.links.coaches && <a href={school.links.coaches} className="link-u text-mute hover:text-bone">Coach contacts</a>}
              </p>
            </>
          ) : (
            <p className="mt-4 text-mute">Not posted yet. A head coach claims the team by getting verified.</p>
          )}
        </aside>
      </div>
    </>
  );
}
