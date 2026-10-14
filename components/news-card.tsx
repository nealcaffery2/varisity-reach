import Link from 'next/link';
import type { NewsItem } from '@/lib/types';
import { sportBySlug } from '@/content/sports';
import { shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';

/** Big image card for the highlights rail. Items without a photo get a type-only treatment. */
export function NewsCard({ item, wide }: { item: NewsItem; wide?: boolean }) {
  const sport = item.sport ? sportBySlug(item.sport) : undefined;
  return (
    <Link
      href={`/news/${item.slug}/`}
      data-slide
      className={`group relative flex shrink-0 snap-start flex-col justify-end overflow-hidden rounded bg-ink-2 ${
        wide ? 'h-[26rem] w-[86vw] md:h-[30rem] md:w-[40rem]' : 'h-[26rem] w-[78vw] md:h-[30rem] md:w-[24rem]'
      }`}
      draggable={false}
    >
      {item.image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset(item.image)}
            alt=""
            draggable={false}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover grayscale transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink from-25% via-ink/80 to-ink/10" />
        </>
      ) : (
        <div aria-hidden className="display absolute -right-4 -top-6 text-[11rem] leading-none text-ink-3 transition-colors duration-500 group-hover:text-orange/15">
          {(sport?.short ?? 'HHS').split(' ')[0]}
        </div>
      )}
      <div className="relative p-6">
        <p className="flex items-center gap-2 text-sm text-mute">
          {sport && <span className="text-orange">{sport.name}</span>}
          {sport && item.date && <span aria-hidden>·</span>}
          {item.date ? <time dateTime={item.date}>{shortDate(item.date)}</time> : !sport && <span>From the archive</span>}
        </p>
        <h3 className="display mt-3 text-4xl text-bone md:text-5xl">{item.title}</h3>
        <p className="mt-3 line-clamp-2 max-w-[48ch] text-mute">{item.summary}</p>
      </div>
    </Link>
  );
}
