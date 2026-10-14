import Link from 'next/link';
import { ArrowRight, Camera, FileCsv, FilePdf, FileText, MicrosoftExcelLogo, SealCheck } from '@phosphor-icons/react/dist/ssr';
import { Hero } from '@/components/home/hero';
import { LiveStrip } from '@/components/home/live-strip';
import { FeaturedAthletes } from '@/components/home/featured-athletes';
import { ReelStrip } from '@/components/reel-strip';
import { CampaignCard } from '@/components/campaign-card';
import { Reveal } from '@/components/reveal';
import { platform } from '@/content/platform';
import { athletes, athleteBySlug, fullName } from '@/content/athletes';
import { publicReels as reels, reelById } from '@/content/reels';
import { schools, schoolBySlug, schoolTheme } from '@/content/schools';
import { underdog } from '@/content/spotlight';
import { campaigns } from '@/content/fundraising';
import { benchmarkById } from '@/content/benchmarks';
import { sportBySlug } from '@/content/sports';
import { compareRows, sideFromAthlete } from '@/lib/compare';

const STEPS = [
  { icon: Camera, title: 'Snap or upload', text: 'A photo of the roster sheet, the stat book, an Excel file, a PDF or a Word doc.' },
  { icon: FileText, title: 'Review the changes', text: 'Every new athlete and every changed number is listed before anything saves. Fix a cell, uncheck a row.' },
  { icon: SealCheck, title: 'Publish verified', text: 'Profiles update with a “verified by coach” mark that recruiters filter on.' },
];

export default function PlatformHome() {
  const hero = reelById('r1')!;
  const leaderNom = [...underdog.nominees].sort((a, b) => b.votes - a.votes)[0];
  const leader = athleteBySlug(leaderNom.athlete)!;
  const leaderSchool = schoolBySlug(leader.school)!;
  const featured = [...athletes].sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)) || b.gpa - a.gpa).slice(0, 8);
  const pruitt = athleteBySlug('deshawn-pruitt')!;
  const rows = compareRows(sideFromAthlete(pruitt), benchmarkById('rb-4star')!, sportBySlug('football')!.statKeys).filter((r) => r.edge !== null).slice(0, 5);

  return (
    <>
      <Hero
        over="Varsity"
        word="Reach"
        label={`${platform.name}: recruiting exposure for small-school athletes`}
        sub="Profiles, verified stats, live scores and film for athletes at 1A to 4A schools. Free for every athlete."
        reel={hero}
        primary={{ href: '/reels/', label: 'Watch reels' }}
        secondary={{ href: '/recruits/', label: 'Recruit board' }}
      />
      <LiveStrip />

      <section className="py-24 md:py-32" aria-labelledby="ud-h" style={schoolTheme(leaderSchool) as React.CSSProperties}>
        <div className="wrap grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="text-sm text-accent">Underdog of the week · leading the vote</p>
            <h2 id="ud-h" className="display mt-3 text-[clamp(3.5rem,10vw,8.5rem)]">{fullName(leader)}</h2>
            <p className="mt-3 text-mute">{sportBySlug(leader.sports[0])?.name} · {leaderSchool.name} · {leaderSchool.town}, {leaderSchool.state} · {leaderSchool.classification}{leaderSchool.enrollment ? ` · ${leaderSchool.enrollment} students` : ''}</p>
            <p className="mt-6 max-w-xl text-xl text-bone/90">{leaderNom.reason}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/spotlight/" className="btn btn-primary">Cast your vote</Link>
              <Link href={`/athletes/${leader.slug}/`} className="btn btn-ghost">Profile</Link>
            </div>
          </div>
          {leader.reels[0] && (
            <div className="hidden lg:block">
              <ReelStrip list={[reelById(leader.reels[0])!]} />
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-line py-24 md:py-32" aria-labelledby="cmp-h">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <h2 id="cmp-h" className="display text-5xl sm:text-6xl md:text-8xl">Same numbers. <span className="text-accent">Smaller town.</span></h2>
            <p className="mt-6 max-w-md text-lg text-mute">
              A 4.47 forty is a 4.47 forty in a town of 900. Line any athlete up against a highly rated recruit and send the table to a coach.
            </p>
            <Link href={`/compare/?a=${pruitt.slug}`} className="btn btn-primary mt-8">Compare athletes <ArrowRight size={16} /></Link>
          </div>
          <div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 border-b border-line pb-3 text-sm">
              <span className="font-semibold text-bone">{fullName(pruitt)} <span className="font-normal text-dim">· 2A, 231 students</span></span>
              <span />
              <span className="text-right text-mute">Sample 4-star RB</span>
            </div>
            <dl className="divide-y divide-line">
              {rows.map((r, i) => (
                <Reveal key={r.label} delay={i * 0.05} className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-3 py-4">
                  <dd className={`num text-3xl md:text-4xl ${r.edge === 'a' ? 'text-accent' : 'text-bone'}`}>{r.aText}</dd>
                  <dt className="text-center text-sm text-mute">{r.label}</dt>
                  <dd className={`num text-right text-3xl md:text-4xl ${r.edge === 'b' ? 'text-bone' : 'text-dim'}`}>{r.bText}</dd>
                </Reveal>
              ))}
            </dl>
            <p className="mt-3 text-xs text-dim">Sample athlete and sample reference numbers, shown to explain the tool.</p>
          </div>
        </div>
      </section>

      <FeaturedAthletes list={featured} title="Verified and rising" />

      <section className="bg-bone py-24 text-ink md:py-32" aria-labelledby="reels-h">
        <div className="wrap">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 id="reels-h" className="display text-5xl sm:text-6xl md:text-8xl">Film, <span className="text-accent-deep">vertical.</span></h2>
            <p className="max-w-sm text-lg text-ink/70">Swipe through clips the way recruits and fans already watch. Every reel links to the athlete’s profile.</p>
          </div>
          <div className="mt-12"><ReelStrip list={reels.filter((r) => ['r10', 'r12', 'r14', 'r16'].includes(r.id))} /></div>
          <Link href="/reels/" className="btn mt-10 bg-ink text-bone hover:bg-ink-3">Open the reel feed <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="py-24 md:py-32" aria-labelledby="coach-h">
        <div className="wrap">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 id="coach-h" className="display text-5xl sm:text-6xl md:text-8xl">Coaches: snap the roster. <span className="text-accent">We do the typing.</span></h2>
            <div className="flex shrink-0 gap-3 text-mute" aria-label="Accepted files: Excel, CSV, PDF, Word, photos">
              <MicrosoftExcelLogo size={28} /><FileCsv size={28} /><FilePdf size={28} /><FileText size={28} /><Camera size={28} />
            </div>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.08} className="bg-ink p-8">
                <s.icon size={32} className="text-accent" />
                <h3 className="display mt-6 text-4xl">{s.title}</h3>
                <p className="mt-3 text-mute">{s.text}</p>
              </Reveal>
            ))}
          </ol>
          <Link href="/coach/" className="btn btn-primary mt-10">Open the coach dashboard <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="border-t border-line py-24 md:py-32" aria-labelledby="fund-h">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="fund-h" className="display text-5xl sm:text-6xl md:text-8xl">Cleats, buses <span className="text-accent">and camps</span></h2>
            <div className="flex gap-3">
              <Link href="/fundraise/" className="btn btn-ghost">All fundraisers</Link>
              <Link href="/gold-card/" className="btn btn-ghost">Gold card</Link>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-lg text-mute">Coaches post what the team needs. The school or the booster club backs it, and the money goes to their account, not ours.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {campaigns.slice(0, 2).map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-ink-2 py-24" aria-labelledby="schools-h">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="schools-h" className="display text-5xl md:text-7xl">Schools on the network</h2>
            <p className="mt-4 max-w-sm text-mute">Every school gets its own site in its own colors, linked from its official page. Free.</p>
            <Link href="/schools/" className="btn btn-primary mt-6">Add your school</Link>
          </div>
          <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
            {schools.map((s) => (
              <li key={s.slug} style={schoolTheme(s) as React.CSSProperties}>
                <Link href={`/${s.slug}/`} className="group flex h-full items-center gap-4 bg-ink-2 p-5 transition-colors hover:bg-ink-3">
                  <span aria-hidden className="h-10 w-1.5 rounded-sm bg-accent" />
                  <span>
                    <span className="display block text-3xl text-bone group-hover:text-accent">{s.town} {s.mascot}</span>
                    <span className="text-sm text-mute">{s.state} · {s.classification}{s.sample ? ' · sample school' : ''}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24 md:py-32" aria-labelledby="verify-h">
        <div className="wrap grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
          <h2 id="verify-h" className="display text-5xl sm:text-6xl md:text-8xl">Coach or local reporter? <span className="text-accent">Get verified.</span></h2>
          <div>
            <p className="text-lg text-mute">Verified accounts lock scores, sign off on stats, write spotlights and nominate the Underdog of the Week. Recruiters filter on that mark.</p>
            <Link href="/join/" className="btn btn-primary mt-6">Get verified</Link>
          </div>
        </div>
      </section>
    </>
  );
}
