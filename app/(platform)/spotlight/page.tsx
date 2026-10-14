import type { Metadata } from 'next';
import Link from 'next/link';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { UnderdogBallot } from '@/components/underdog-ballot';
import { AutoplayVideo } from '@/components/autoplay-video';
import { Reveal } from '@/components/reveal';
import { spotlights, underdog } from '@/content/spotlight';
import { athleteBySlug, fullName } from '@/content/athletes';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { reelById } from '@/content/reels';
import { shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';

export const metadata: Metadata = {
  title: 'Spotlight',
  description: 'Player and game spotlights from verified coaches and reporters, and the community-voted Underdog of the Week.',
};

export default function SpotlightPage() {
  return (
    <>
      <PageHeader title="Spotlight">
        Stories about athletes no national outlet has covered, written by the coaches and local reporters who watched them play.
      </PageHeader>

      <section className="wrap grid gap-12 py-16 lg:grid-cols-[1fr_1.4fr]" aria-labelledby="ud-h">
        <div>
          <h2 id="ud-h" className="display text-6xl md:text-8xl">Underdog <span className="text-accent">of the week</span></h2>
          <p className="mt-6 max-w-md text-lg text-mute">
            Coaches and verified reporters nominate. Everyone else votes. The winner gets the top of the home page for a week and a spot on the recruit board’s front row.
          </p>
          {underdog.past.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-bone">Past winners</h3>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {underdog.past.map((p) => {
                  const a = athleteBySlug(p.athlete);
                  return a ? (
                    <li key={p.week} className="flex items-center justify-between gap-4 py-3">
                      <Link href={`/athletes/${a.slug}/`} className="link-u text-bone">{fullName(a)}</Link>
                      <span className="text-sm text-dim">Week of {shortDate(p.week)}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
        <UnderdogBallot />
      </section>

      <section className="border-t border-line py-16 md:py-24" aria-labelledby="stories-h">
        <div className="wrap">
          <h2 id="stories-h" className="display text-5xl md:text-7xl">Spotlights</h2>
          <div className="mt-10 grid gap-10">
            {spotlights.map((s, i) => {
              const a = athleteBySlug(s.athlete);
              const school = a ? schoolBySlug(a.school) : undefined;
              const reel = s.reel ? reelById(s.reel) : undefined;
              return (
                <Reveal key={s.id} as="section">
                  <article
                    style={school ? (schoolTheme(school) as React.CSSProperties) : undefined}
                    className={`grid gap-8 border-t border-line pt-10 ${i % 2 ? 'md:grid-cols-[16rem_1fr]' : 'md:grid-cols-[1fr_16rem]'}`}
                  >
                    <div className={i % 2 ? 'md:order-2' : ''}>
                      <p className="text-sm text-accent">{s.kind === 'game' ? 'Game spotlight' : 'Player spotlight'} · {shortDate(s.date)}</p>
                      <h3 className="display mt-2 text-4xl md:text-6xl">{s.title}</h3>
                      <p className="mt-3 max-w-[60ch] text-lg text-bone/85">{s.dek}</p>
                      <div className="mt-4 max-w-[65ch] space-y-3 text-mute">
                        {s.body.map((p, j) => <p key={j}>{p}</p>)}
                      </div>
                      <p className="mt-5 inline-flex items-center gap-2 text-sm text-bone">
                        <SealCheck size={16} weight="fill" className="text-accent" /> {s.author.name}, verified {s.author.role}
                        {s.sample && <span className="text-dim"> · sample story</span>}
                      </p>
                      {a && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link href={`/athletes/${a.slug}/`} className="btn btn-primary">{fullName(a)}’s profile</Link>
                          {s.game && <Link href={`/games/${s.game}/`} className="btn btn-ghost">Game center</Link>}
                        </div>
                      )}
                    </div>
                    {reel && (
                      <Link href={`/reels/#${reel.id}`} className="block aspect-[9/16] overflow-hidden rounded bg-ink-2">
                        <AutoplayVideo src={asset(reel.src)} poster={asset(reel.poster)} className="h-full w-full object-cover" aria-label={reel.title} />
                      </Link>
                    )}
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
