import Link from 'next/link';
import { ArrowRight, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import { reality } from '@/content/reality';
import il from '@/content/directory/il.json';
import { schools } from '@/content/schools';
import { Swatch } from '@/components/conference/team-mark';

type Il = { ihsaName: string; town: string; enrollment?: number; colors: string[]; type?: string };

/** Smallest Illinois public schools, by NCES enrollment, that have no page on the network yet. */
function underTheRadar(n = 8) {
  const onNetwork = new Set(schools.filter((s) => !s.sample && s.state === 'IL').map((s) => s.town.toLowerCase()));
  return (il as { schools: Il[] }).schools
    .filter((s) => s.enrollment && s.type === 'Public' && !onNetwork.has(s.town.toLowerCase()))
    .sort((a, b) => a.enrollment! - b.enrollment!)
    .slice(0, n);
}

export function Reality() {
  const radar = underTheRadar();
  const total = (il as { count: number }).count;
  const live = schools.filter((s) => !s.sample && s.state === 'IL').length;
  return (
    <section className="border-t border-line py-24 md:py-32" aria-labelledby="reality-h">
      <div className="wrap">
        <h2 id="reality-h" className="display text-[clamp(3rem,9vw,7.5rem)]">The odds <span className="text-accent">out here</span></h2>
        <p className="mt-6 max-w-[34rem] text-lg text-mute">Talent is everywhere. College coaches, film crews and scholarship money are not. These are the numbers we are working against, each one linked to where it comes from.</p>

        <ul className="mt-12 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {reality.map((f) => (
            <li key={f.figure} className="flex flex-col bg-ink p-6">
              <p className="display text-6xl text-accent md:text-7xl">{f.figure}</p>
              <p className="mt-3 flex-1 text-bone">{f.claim}</p>
              <a href={f.url} target="_blank" rel="noreferrer" className="link-u mt-4 inline-flex items-start gap-1 self-start text-xs text-dim hover:text-mute">
                {f.source}, {f.year} <ArrowSquareOut size={11} className="mt-0.5 shrink-0" aria-label="opens in a new tab" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h3 className="display text-4xl md:text-5xl">Under the <span className="text-accent">radar</span></h3>
            <p className="mt-4 max-w-[34rem] text-mute">
              Illinois has {total.toLocaleString()} IHSA member schools. {live === 1 ? 'One of them has' : `${live} of them have`} a page here so far. Here are the smallest public ones. None has a page here yet, so a college coach browsing Varsity Reach cannot find a single one of their athletes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/schools/" className="btn btn-primary">Add your school <ArrowRight size={16} /></Link>
              <Link href="/grants/" className="btn btn-ghost">Grants for your school</Link>
            </div>
          </div>
          <ol className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
            {radar.map((s) => (
              <li key={s.ihsaName} className="flex items-center justify-between gap-3 bg-ink px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 font-semibold text-bone"><Swatch school={{ name: s.ihsaName, colors: s.colors }} /> <span className="truncate">{s.ihsaName}</span></span>
                <span className="num shrink-0 text-sm text-mute">{s.enrollment} students</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-3 text-xs text-dim">School list and colors: IHSA. Enrollment: NCES Common Core of Data, 2022.</p>

        <div className="mt-16 grid gap-px overflow-hidden rounded border border-line bg-line md:grid-cols-[1.2fr_1fr_1fr]">
          <Link href="/scout/" className="group bg-ink p-6 transition-colors hover:bg-ink-2">
            <p className="display text-4xl">Recruiters</p>
            <p className="mt-2 text-mute">Diamonds in the fields: big numbers, nobody watching.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-accent">Scout <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/family/" className="group bg-ink p-6 transition-colors hover:bg-ink-2">
            <p className="display text-4xl">Parents</p>
            <p className="mt-2 text-mute">Put your kid’s film where coaches look.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-accent">Start <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </Link>
          <Link href="/fundraise/" className="group bg-ink p-6 transition-colors hover:bg-ink-2">
            <p className="display text-4xl">Everyone</p>
            <p className="mt-2 text-mute">Cleats, helmets, a camera on a tripod.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-accent">Give <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
