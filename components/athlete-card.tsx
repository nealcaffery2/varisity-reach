import Link from 'next/link';
import type { Athlete } from '@/lib/types';
import { fullName } from '@/content/athletes';
import { sportBySlug } from '@/content/sports';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import { reelById } from '@/content/reels';
import { feetInches, gpa } from '@/lib/format';
import { asset } from '@/lib/asset';

/**
 * Trading-card layout: the jersey number is the portrait. No stock faces;
 * when a real athlete has a photo, put it in `public/athletes/<slug>.jpg`.
 */
export function AthleteCard({ a, size = 'md' }: { a: Athlete; size?: 'md' | 'lg' }) {
  const sport = sportBySlug(a.sports[0]);
  const poster = a.reels[0] ? reelById(a.reels[0])?.poster : undefined;
  const lg = size === 'lg';
  const school = schoolBySlug(a.school);
  return (
    <Link
      href={`/athletes/${a.slug}/`}
      style={school ? (schoolTheme(school) as React.CSSProperties) : undefined}
      className={`group relative flex shrink-0 flex-col overflow-hidden rounded border border-line bg-ink-2 transition-colors hover:border-line-2 ${lg ? 'h-[32rem] w-[82vw] sm:w-[22rem]' : 'h-[26rem] w-full'}`}
      draggable={false}
    >
      <div className="relative flex-1 overflow-hidden">
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset(poster)} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover opacity-35 grayscale transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/40 to-transparent" />
        <span
          aria-hidden
          className="display absolute -right-2 top-2 text-[9.5rem] leading-none text-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 [-webkit-text-stroke:2px_var(--color-accent)]"
        >
          {a.jersey}
        </span>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-sm bg-ink/80 px-2 py-1 text-xs font-medium text-bone backdrop-blur">{a.gradYear}</span>
          {a.sample && <span className="rounded-sm border border-line-2 bg-ink/80 px-2 py-1 text-xs text-mute backdrop-blur">Sample profile</span>}
        </div>
      </div>
      <div className="relative p-5">
        <p className="text-sm text-accent">{sport?.name} · {a.position}</p>
        <h3 className="display mt-1 flex items-center gap-2 text-4xl text-bone">
          {fullName(a)}
          {a.verified && <SealCheck size={22} weight="fill" className="shrink-0 text-accent" aria-label="Stats verified" />}
        </h3>
        {school && <p className="mt-1 truncate text-sm text-mute">{school.town}, {school.state} · {school.classification}</p>}
        <dl className="mt-4 grid grid-cols-3 border-t border-line pt-4 text-sm">
          <div><dt className="text-dim">Height</dt><dd className="num mt-0.5 text-bone">{feetInches(a.heightIn)}</dd></div>
          <div><dt className="text-dim">Weight</dt><dd className="num mt-0.5 text-bone">{a.weightLb}</dd></div>
          <div><dt className="text-dim">GPA</dt><dd className="num mt-0.5 text-bone">{gpa(a.gpa)}</dd></div>
        </dl>
      </div>
    </Link>
  );
}
