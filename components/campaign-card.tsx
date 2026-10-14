import Link from 'next/link';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import { type Campaign, dollars, progress, totalCents } from '@/lib/fundraise';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { asset } from '@/lib/asset';

/** A drive at a glance: who backs it, how far along, what the next dollar does. */
export function CampaignCard({ c }: { c: Campaign }) {
  const school = schoolBySlug(c.school);
  const pct = Math.round(progress(c) * 100);
  return (
    <Link
      href={`/fundraise/${c.id}/`}
      style={school ? (schoolTheme(school) as React.CSSProperties) : undefined}
      className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded border border-line bg-ink-2 transition-colors hover:border-line-2"
    >
      {c.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset(c.image)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale transition-[opacity,transform] duration-700 group-hover:scale-105 group-hover:opacity-40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-2 from-30% via-ink-2/85 to-ink-2/30" />
      <div className="relative p-6">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-sm bg-ink/80 px-2 py-1 font-medium text-bone">{school?.name}</span>
          {c.schoolBacked && <span className="inline-flex items-center gap-1 rounded-sm bg-accent px-2 py-1 font-semibold text-accent-ink"><SealCheck size={13} weight="fill" /> School backed</span>}
          {c.coachBacked && <span className="rounded-sm border border-line-2 bg-ink/80 px-2 py-1 text-mute">Coach backed</span>}
          {c.sample && <span className="rounded-sm border border-line-2 bg-ink/80 px-2 py-1 text-mute">Sample</span>}
        </div>
        <h3 className="display mt-4 text-4xl text-bone transition-colors group-hover:text-accent md:text-5xl">{c.title}</h3>
        <p className="mt-2 line-clamp-2 max-w-[56ch] text-mute">{c.need}</p>
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span><span className="num text-xl text-bone">{dollars(totalCents(c))}</span> <span className="text-dim">of {dollars(c.goalCents)}</span></span>
            <span className="num text-accent">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          {c.match && <p className="mt-2 text-xs text-dim">Matched {c.match.ratio === 1 ? 'dollar for dollar' : `${c.match.ratio * 100} cents per dollar`} up to {dollars(c.match.upToCents)}</p>}
        </div>
      </div>
    </Link>
  );
}
