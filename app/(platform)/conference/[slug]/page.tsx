import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { Pickem } from '@/components/conference/pickem';
import { FanBracket } from '@/components/conference/fan-bracket';
import { FantasySquad, type FantasyAthlete } from '@/components/conference/fantasy-squad';
import { Swatch, TeamMark } from '@/components/conference/team-mark';
import { bracketSeeds, conferenceBySlug, conferences, currentWeek, fixtures, record, weeks } from '@/content/conference';
import { athletes, fullName } from '@/content/athletes';
import { schoolBySlug } from '@/content/schools';

export const generateStaticParams = () => conferences.map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = conferenceBySlug((await params).slug);
  return c ? { title: `${c.name} football`, description: `${c.name} football standings, every team's schedule and results, fan pick'em, a fan bracket and free fantasy.` } : {};
}

const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default async function ConferencePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = conferenceBySlug((await params).slug);
  if (!c) notFound();
  const week = currentWeek(c);
  const all = fixtures(c);
  const names = new Set(c.teams.map((t) => t.name));
  const pool: FantasyAthlete[] = athletes
    .filter((a) => a.sports.includes('football'))
    .map((a) => ({ slug: a.slug, name: fullName(a), school: schoolBySlug(a.school)?.town ?? a.school, position: a.position, sample: a.sample }))
    .filter((a) => names.has(a.school));

  return (
    <>
      <PageHeader title={c.name.replace(' Conference', '')} accent="Conference">
        Football {c.season}. Standings and every result come from IHSA, updated {c.updated}. Pick this week’s games, fill out a fan bracket, and draft a free fantasy squad.
      </PageHeader>

      <section className="wrap grid gap-12 py-14 lg:grid-cols-[1.25fr_1fr]" aria-labelledby="standings-h">
        <div className="min-w-0">
          <h2 id="standings-h" className="display text-5xl md:text-6xl">Standings</h2>
          <div className="relative mt-6 overflow-x-auto rounded border border-line">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">{c.name} football standings, sorted by conference record</caption>
              <thead className="bg-ink-2 text-xs text-dim">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Team</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Conf</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Overall</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">PF</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">PA</th>
                  <th scope="col" className="px-3 py-2 text-center font-medium">IHSA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {c.teams.map((t, i) => {
                  const s = c.schools[t.name];
                  return (
                    <tr key={t.name} className={i === 0 ? 'bg-accent/5' : undefined}>
                      <th scope="row" className="px-3 py-3 font-semibold text-bone">
                        <span className="flex min-w-0 items-center gap-2">
                          <Swatch school={s} />
                          {s?.site ? <Link href={`/${s.site}/`} className="link-u truncate">{t.name}</Link> : <a href={`#team-${t.name.replace(/\W/g, '')}`} className="link-u truncate">{t.name}</a>}
                          {t.nickname && <span className="hidden truncate font-normal text-dim md:inline">{t.nickname}</span>}
                        </span>
                      </th>
                      <td className={`num px-3 py-3 text-right ${i === 0 ? 'text-accent' : 'text-bone'}`}>{record(t.conf)}</td>
                      <td className="num px-3 py-3 text-right text-mute">{record(t.overall)}</td>
                      <td className="num px-3 py-3 text-right text-mute">{t.pointsFor}</td>
                      <td className="num px-3 py-3 text-right text-mute">{t.pointsAgainst}</td>
                      <td className="num px-3 py-3 text-center text-xs text-mute">{t.bid ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-[30rem] text-sm text-dim">
            Source: <a className="link-u text-mute" href={c.sourceUrl} target="_blank" rel="noreferrer">IHSA conference schedules <ArrowSquareOut size={12} className="inline" aria-label="opens in a new tab" /></a>. School colors from the IHSA school directory. The IHSA column repeats the playoff status letter IHSA prints beside each team.
          </p>
        </div>

        <div className="min-w-0">
          <h2 className="display text-5xl md:text-6xl">This <span className="text-accent">week</span></h2>
          <div className="mt-6">
            <Pickem conf={c.slug} week={week.week} games={week.games} schools={c.schools} past={all} />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="bracket-h">
        <div className="wrap">
          <h2 id="bracket-h" className="display text-5xl md:text-7xl">Fan <span className="text-accent">bracket</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">
            The top eight in today’s standings, seeded one through eight. IHSA’s real playoffs run statewide by class, so this is the conference tournament that never gets played. Settle it here.
          </p>
          <div className="mt-8">
            <FanBracket conf={c.slug} seeds={bracketSeeds(c)} schools={c.schools} />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="fantasy-h">
        <div className="wrap">
          <h2 id="fantasy-h" className="display text-5xl md:text-7xl">Fantasy <span className="text-accent">squad</span></h2>
          <p className="mt-4 max-w-[34rem] text-mute">Draft five players from {c.short} schools whose families put them on Varsity Reach.</p>
          <div className="mt-8">
            <FantasySquad conf={c.slug} pool={pool} />
          </div>
        </div>
      </section>

      <section className="border-t border-line py-14" aria-labelledby="schedules-h">
        <div className="wrap">
          <h2 id="schedules-h" className="display text-5xl md:text-7xl">Every <span className="text-accent">schedule</span></h2>
          <div className="mt-8 grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-2">
            {c.teams.map((t) => {
              const s = c.schools[t.name];
              return (
                <details key={t.name} id={`team-${t.name.replace(/\W/g, '')}`} className="group min-w-0 bg-ink open:bg-ink-2">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <TeamMark school={s} name={t.name} className="font-semibold text-bone" />
                    <span className="num shrink-0 text-sm text-mute">{record(t.overall)}</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-sm text-mute">
                      {[t.nickname, t.headCoach && `Head coach ${t.headCoach}`, t.enrollment && `Enrollment ${t.enrollment}`].filter(Boolean).join(' · ')}
                    </p>
                    <ol className="mt-3 divide-y divide-line text-sm">
                      {t.games.map((g) => (
                        <li key={g.date} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-2">
                          <span className="num text-dim">{shortDay(g.date)}</span>
                          <span className="min-w-0 truncate text-bone">{g.home ? 'vs' : 'at'} {g.opponent}{g.conference && <span className="sr-only"> (conference)</span>}{g.conference && <span aria-hidden className="text-accent"> ·</span>}</span>
                          <span className={`num ${g.result === 'W' ? 'text-bone' : 'text-mute'}`}>
                            {g.result ? `${g.result} ${g.score?.for}-${g.score?.against}${g.forfeit ? ' (forfeit)' : ''}` : `${g.time} pm`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-dim"><span className="text-accent">·</span> marks a conference game.</p>
          <p className="mt-8 text-sm text-dim">{weeks(c).length} weeks, {all.length} games.</p>
        </div>
      </section>
    </>
  );
}
