import type { School } from '@/lib/types';
import { asset } from '@/lib/asset';

/** Real photos of the school and its town, each credited with its license. */
export function PlacePhotos({ school }: { school: School }) {
  const photos = school.photos ?? [];
  if (photos.length === 0) return null;
  const [lead, ...rest] = photos;
  return (
    <section className="border-t border-line py-24 md:py-32" aria-labelledby="place-h">
      <div className="wrap">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="place-h" className="display text-5xl sm:text-6xl md:text-8xl">
            Home of the <span className="text-accent">{school.mascot}</span>
          </h2>
          <p className="max-w-sm text-lg text-mute">
            {school.town}, {school.state}. The field, the school and the town the {school.short} play for.
          </p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded bg-line md:grid-cols-3">
          <Figure photo={lead} className="md:col-span-3" ratio="aspect-[16/9] md:aspect-[21/8]" eager />
          {rest.map((p) => <Figure key={p.src} photo={p} ratio="aspect-[4/3]" />)}
        </div>
        <p className="mt-4 text-sm text-dim">Shown in black and white; tap a credit for the original photo and its license.</p>
      </div>
    </section>
  );
}

function Figure({ photo, className = '', ratio, eager }: { photo: NonNullable<School['photos']>[number]; className?: string; ratio: string; eager?: boolean }) {
  return (
    <figure className={`group bg-ink-2 ${className}`}>
      <div className={`relative overflow-hidden ${ratio}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
        <img
          src={asset(photo.src)}
          alt={photo.alt}
          loading={eager ? undefined : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover grayscale contrast-110 transition-[filter,transform] duration-700 group-hover:scale-[1.02] group-hover:grayscale-0"
        />
      </div>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4 text-sm">
        {photo.caption && <span className="font-semibold text-bone">{photo.caption}</span>}
        <a href={photo.url} target="_blank" rel="noreferrer" className="link-u text-dim hover:text-bone">
          {photo.credit}, {photo.license}
        </a>
      </figcaption>
    </figure>
  );
}
