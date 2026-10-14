import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, FilePdf } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { SEASONS, sportsBySeason } from '@/content/sports';
import { events } from '@/content/news';
import { schoolBySlug } from '@/content/schools';
import { notFound } from 'next/navigation';
import { dayParts } from '@/lib/format';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  return s ? { title: `${s.town} schedule`, description: `${s.name} game schedules by sport and the dates that move them.`, robots: s.sample ? { index: false } : undefined } : {};
}

export default async function SchedulePage({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  const dates = events.filter((e) => e.school === school.slug);
  const official = school.links.schedules ?? school.links.calendar;
  return (
    <>
      <PageHeader title="Schedule">
        Game times change. {official ? 'The school’s own calendar is the source of truth; this page points you to it fast.' : 'Live scores and community updates for every game are on the games page.'}
      </PageHeader>
      <div className="wrap grid gap-16 py-16 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-3">
            {school.links.calendar && <a href={school.links.calendar} className="btn btn-primary">Live calendar <ArrowUpRight size={16} /></a>}
            {school.links.schedules && <a href={school.links.schedules} className="btn btn-ghost">Official athletics site</a>}
            <Link href={`/games/?school=${school.slug}`} className="btn btn-ghost">Live scores</Link>
          </div>
          {SEASONS.map((season) => (
            <section key={season} className="mt-14" aria-labelledby={`sch-${season}`}>
              <h2 id={`sch-${season}`} className="display text-5xl">{season}</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {sportsBySeason(season, school.slug).map((s) => (
                  <li key={s.slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <Link href={`/${school.slug}/teams/${s.slug}/`} className="link-u text-lg text-bone">{s.name}</Link>
                    {s.scheduleUrl ? (
                      <a href={s.scheduleUrl} className="inline-flex min-h-11 items-center gap-2 text-sm text-accent hover:underline"><FilePdf size={18} /> 2026-27 PDF</a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center text-sm text-dim">Posted closer to the season</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="dist-h">
          <h2 id="dist-h" className="display text-3xl">District dates</h2>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {dates.map((e) => {
              const d = dayParts(e.date);
              return (
                <li key={e.date} className="flex gap-4 py-4">
                  <span className="num w-16 shrink-0 text-sm text-accent">{d.month} {d.day}</span>
                  <span>
                    <span className="block text-bone">{e.title}</span>
                    {e.detail && <span className="block text-sm text-mute">{e.detail}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          {dates.length === 0 && <p className="mt-4 text-mute">No district dates posted.</p>}
        </aside>
      </div>
    </>
  );
}
