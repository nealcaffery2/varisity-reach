import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, FilePdf } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { SEASONS, sportsBySeason } from '@/content/sports';
import { events } from '@/content/news';
import { site } from '@/content/site';
import { dayParts } from '@/lib/format';

export const metadata: Metadata = { title: 'Schedule', description: `${site.school} game schedules by sport and the district dates that move them.` };

export default function SchedulePage() {
  return (
    <>
      <PageHeader title="Schedule">
        Game times change. The live calendar on the athletics site is the source of truth; this page points you to it fast.
      </PageHeader>
      <div className="wrap grid gap-16 py-16 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-3">
            <a href={site.links.calendar} className="btn btn-primary">Live calendar <ArrowUpRight size={16} /></a>
            <a href={site.links.schedules} className="btn btn-ghost">Hiltopper Athletics site</a>
          </div>
          {SEASONS.map((season) => (
            <section key={season} className="mt-14" aria-labelledby={`sch-${season}`}>
              <h2 id={`sch-${season}`} className="display text-5xl">{season}</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {sportsBySeason(season).map((s) => (
                  <li key={s.slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <Link href={`/sports/${s.slug}/`} className="link-u text-lg text-bone">{s.name}</Link>
                    {s.scheduleUrl ? (
                      <a href={s.scheduleUrl} className="inline-flex min-h-11 items-center gap-2 text-sm text-orange hover:underline"><FilePdf size={18} /> 2026-27 PDF</a>
                    ) : (
                      <a href={site.links.schedules} className="inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone">Posted closer to the season <ArrowUpRight size={14} /></a>
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
            {events.map((e) => {
              const d = dayParts(e.date);
              return (
                <li key={e.date} className="flex gap-4 py-4">
                  <span className="num w-16 shrink-0 text-sm text-orange">{d.month} {d.day}</span>
                  <span>
                    <span className="block text-bone">{e.title}</span>
                    {e.detail && <span className="block text-sm text-mute">{e.detail}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-sm text-dim">From the district calendar at hillsboroschools.net.</p>
        </aside>
      </div>
    </>
  );
}
