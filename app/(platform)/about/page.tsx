import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { Reveal } from '@/components/reveal';
import { platform } from '@/content/platform';
import { reality } from '@/content/reality';
import directory from '@/content/directory/il.json';

export const metadata: Metadata = {
  title: 'About',
  description: 'Varsity Reach is a network of athletics sites for 1A to 4A high schools, built so small-town athletes get seen by the coaches who sign.',
};

// Three of the sourced figures from the home page; each links to its source.
// Schools whose IHSA listing includes colors.
const WITH_COLORS = directory.schools.filter((s) => s.colors && s.colors.length > 0).length;

const WHY = ['55%', '$4.4B', '20.2'].map((f) => reality.find((r) => r.figure === f)!).filter(Boolean);

const WHO: { name: string; does: string; links: { href: string; label: string }[] }[] = [
  {
    name: 'College coaches',
    does: 'Find a player who fits a need by sport, class, size and grades in under a minute. See production and film, and reach the right adult through the athletic office.',
    links: [{ href: '/recruits/', label: 'Recruit board' }, { href: '/scout/', label: 'Scout' }],
  },
  {
    name: 'Athletes and families',
    does: 'A profile worth texting to a coach: stats, reels, highlight tapes and links to socials. Free for athletes, and it looks right on a phone.',
    links: [{ href: '/family/', label: 'Parents and athletes' }, { href: '/reels/', label: 'Reels' }],
  },
  {
    name: 'Schools and boosters',
    does: 'A site in the school’s own colors, a wants board the town votes on, fundraisers, gold cards and a list of grants with deadlines near you.',
    links: [{ href: '/schools/', label: 'Add your school' }, { href: '/grants/', label: 'Grants' }],
  },
  {
    name: 'Fans and the town',
    does: 'Scores, schedules, conference standings, live games with local radio and streams, and the Friday night clips everybody already films.',
    links: [{ href: '/games/', label: 'Games' }, { href: '/conference/scc/', label: 'Conference' }],
  },
];

const PROMISES: { title: string; body: string }[] = [
  {
    title: 'Athletes are minors',
    body: 'A real profile goes up only with a signed media release. No home address, phone or personal email is shown, and contact goes through the athletic office.',
  },
  {
    title: 'Every number says where it came from',
    body: 'A score or stat is marked as from a verified coach, a verified reporter, or the crowd with its agreement percentage. Sample data is labeled and kept out of search.',
  },
  {
    title: 'The money goes to the school',
    body: `Gifts, sponsorships and licenses pay into the school’s or booster club’s own Stripe account, approved by the athletic director. The platform fee today is ${platform.feePct}%, and every fundraiser prints it.`,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Built for" accent="small towns">
        {platform.name} is a network of athletics sites for 1A to 4A high schools. It puts small-school athletes, their numbers and their film in front of the college coaches who sign players, and it helps their schools raise what they need.
      </PageHeader>

      <section aria-labelledby="why-h" className="border-b border-line">
        <div className="wrap grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <h2 id="why-h" className="display text-5xl md:text-7xl">The <span className="text-accent">point</span></h2>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-mute">
              A five-star recruit in a big suburb has a camera crew, a ranking and a dozen coaches at every game. A kid in a town of a few thousand has a parent with a phone and a coach with no time to cut film. Talent is spread out. Attention is not.
            </p>
            <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-mute">
              The goal is exposure: get the good players in small towns seen, and give their schools the tools the big programs already have.
            </p>
          </div>
          <ul className="grid gap-px self-start overflow-hidden rounded bg-line">
            {WHY.map((f) => (
              <li key={f.figure} className="grid gap-x-6 gap-y-2 bg-ink-2 p-6 sm:grid-cols-[8rem_1fr]">
                <p className="num text-3xl font-semibold text-accent">{f.figure}</p>
                <div>
                  <p className="leading-relaxed text-bone">{f.claim}</p>
                  <a href={f.url} className="link-u mt-2 inline-flex items-center gap-1 text-sm text-dim hover:text-bone" target="_blank" rel="noreferrer">
                    {f.source}, {f.year}
                    <ArrowUpRight size={14} aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="who-h" className="border-b border-line">
        <div className="wrap py-16 md:py-24">
          <h2 id="who-h" className="display text-5xl md:text-7xl">Who it <span className="text-accent">serves</span></h2>
          <ul className="mt-10 border-t border-line">
            {WHO.map((w, i) => (
              <Reveal as="li" key={w.name} delay={i * 0.05} className="grid gap-4 border-b border-line py-8 md:grid-cols-[16rem_1fr] md:items-baseline md:gap-x-10 lg:grid-cols-[20rem_1fr_16rem]">
                <h3 className="display text-3xl md:text-4xl">{w.name}</h3>
                <p className="max-w-[34rem] leading-relaxed text-mute">{w.does}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:col-start-2 lg:col-start-auto lg:justify-end">
                  {w.links.map((l) => (
                    <Link key={l.href} href={l.href} className="link-u inline-flex min-h-11 items-center gap-1 font-semibold text-bone hover:text-accent">
                      {l.label}
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                  ))}
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rules-h" className="border-b border-line bg-ink-2">
        <div className="wrap grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 id="rules-h" className="display text-5xl md:text-7xl">House <span className="text-accent">rules</span></h2>
          <dl className="grid gap-8">
            {PROMISES.map((p) => (
              <div key={p.title}>
                <dt className="text-lg font-semibold text-bone">{p.title}</dt>
                <dd className="mt-2 max-w-[34rem] leading-relaxed text-mute">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="start-h">
        <div className="wrap grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 id="start-h" className="display text-5xl md:text-7xl">Where it <span className="text-accent">started</span></h2>
          <div>
            <p className="max-w-[34rem] text-lg leading-relaxed text-mute">
              The first school is Hillsboro High in Hillsboro, Illinois: the Hiltoppers, black and orange, in the South Central Conference. All {directory.count} IHSA member schools are already in the directory, {WITH_COLORS} of them with their official colors, ready for an athletic director to claim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/schools/" className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-accent px-5 font-semibold text-accent-ink transition-colors hover:bg-accent-2">
                Add your school
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/hillsboro/" className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-2 px-5 font-semibold text-bone transition-colors hover:border-bone">
                See Hillsboro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
