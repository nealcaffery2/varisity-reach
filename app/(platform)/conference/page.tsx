import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { Swatch } from '@/components/conference/team-mark';
import { conferences, record } from '@/content/conference';

export const metadata: Metadata = { title: 'Conferences', description: 'Conference standings, schedules, fan pick’em, brackets and free fantasy.' };

export default function ConferenceIndex() {
  return (
    <>
      <PageHeader title="Conferences">Standings and schedules straight from the state association, with pick’em, fan brackets and free fantasy on top.</PageHeader>
      <ul className="wrap grid gap-px py-14">
        {conferences.map((c) => (
          <li key={c.slug}>
            <Link href={`/conference/${c.slug}/`} className="group flex flex-wrap items-center justify-between gap-6 rounded border border-line p-6 transition-colors hover:border-line-2 hover:bg-ink-2">
              <div className="min-w-0">
                <h2 className="display text-5xl">{c.name}</h2>
                <p className="mt-2 text-mute">Football {c.season} · {c.teams.length} schools · leader {c.teams[0].name} <span className="num">{record(c.teams[0].conf)}</span></p>
                <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
                  {Object.values(c.schools).map((s) => <Swatch key={s.name} school={s} size={18} />)}
                </div>
              </div>
              <span className="btn btn-ghost">Open <ArrowRight size={16} /></span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
