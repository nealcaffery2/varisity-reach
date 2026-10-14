import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { SEASONS, sportsBySeason } from '@/content/sports';
import { athletes } from '@/content/athletes';
import { site } from '@/content/site';

export const metadata: Metadata = { title: 'Teams', description: `Every ${site.school} team, by season, with coaches and schedules.` };

export default function SportsPage() {
  return (
    <>
      <PageHeader title="Teams">
        Fifteen IHSA programs in the {site.conference}. Pick a team for its coaches, schedule, roster and leaders.
      </PageHeader>
      <div className="wrap py-16 md:py-24">
        {SEASONS.map((season) => (
          <section key={season} className="grid gap-6 border-t border-line py-10 lg:grid-cols-[14rem_1fr]" aria-labelledby={`s-${season}`}>
            <h2 id={`s-${season}`} className="display text-5xl text-orange lg:sticky lg:top-24 lg:self-start">{season}</h2>
            <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {sportsBySeason(season).map((s) => {
                const count = athletes.filter((a) => a.sports.includes(s.slug)).length;
                return (
                  <li key={s.slug} className="bg-ink">
                    <Link href={`/sports/${s.slug}/`} className="group flex h-full min-h-48 flex-col justify-between gap-6 p-6 transition-colors hover:bg-ink-2">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="display text-4xl text-bone transition-colors group-hover:text-orange">{s.name}</h3>
                        <ArrowUpRight size={22} className="mt-1 shrink-0 text-dim transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange" />
                      </div>
                      <div>
                        <p className="text-sm text-mute">{s.blurb}</p>
                        <p className="mt-4 text-xs text-dim">
                          {s.coaches[0]}{s.coaches.length > 1 ? ` and ${s.coaches.length - 1} more` : ''}
                          {count > 0 && <> · {count} on the recruit board</>}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
