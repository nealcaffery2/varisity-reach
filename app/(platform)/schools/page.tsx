import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { JoinForm } from '@/components/join-form';
import { schools, schoolTheme } from '@/content/schools';
import { athletesAt } from '@/content/athletes';
import { sportsFor } from '@/content/sports';

export const metadata: Metadata = { title: 'Schools', description: 'Every school on Varsity Reach, and how to add yours.' };

export default function SchoolsPage() {
  return (
    <>
      <PageHeader title="Schools">
        Each school gets a site in its own colors at its own address, ready to link from the district’s athletics page.
      </PageHeader>
      <div className="wrap py-12">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((s) => (
            <li key={s.slug} style={schoolTheme(s) as React.CSSProperties}>
              <Link href={`/${s.slug}/`} className="group flex h-full flex-col justify-between gap-8 rounded border border-line bg-ink-2 p-6 transition-colors hover:border-accent">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="display text-4xl text-bone group-hover:text-accent">{s.town} {s.mascot}</p>
                    <p className="mt-1 text-sm text-mute">{s.name} · {s.state} · {s.classification}</p>
                  </div>
                  <ArrowUpRight size={22} className="shrink-0 text-dim group-hover:text-accent" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-mute"><span aria-hidden className="h-3 w-3 rounded-full bg-accent" /> {s.colors.name}</span>
                  <span className="text-dim">{sportsFor(s.slug).length} teams · {athletesAt(s.slug).length} profiles{s.sample ? ' · sample' : ''}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.3fr]" aria-labelledby="add-h">
          <div>
            <h2 id="add-h" className="display text-5xl md:text-7xl">Add your <span className="text-accent">school</span></h2>
            <p className="mt-4 max-w-md text-mute">Athletic directors start here. We set up the site in your colors, verify your coaches, and give you a link for the district’s athletics page. Free for the school and every athlete.</p>
          </div>
          <JoinForm addSchool />
        </section>
      </div>
    </>
  );
}
