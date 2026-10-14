import Link from 'next/link';
import { Play } from '@phosphor-icons/react/dist/ssr';
import type { Reel } from '@/lib/types';
import { athleteBySlug, fullName } from '@/content/athletes';
import { sportBySlug } from '@/content/sports';
import { AutoplayVideo } from './autoplay-video';
import { Reveal } from './reveal';
import { asset } from '@/lib/asset';

/** Four vertical clips in a row; each opens the full-screen feed at that clip. */
export function ReelStrip({ list, query = '' }: { list: Reel[]; query?: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {list.map((r, i) => {
        const a = r.athlete ? athleteBySlug(r.athlete) : undefined;
        return (
          <Reveal as="li" key={r.id} delay={i * 0.06}>
            <Link href={`/reels/${query}#${r.id}`} className="group relative block aspect-[9/16] overflow-hidden rounded bg-ink">
              <AutoplayVideo src={asset(r.src)} poster={asset(r.poster)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-bone">
                <p className="text-xs font-semibold text-accent-2">{sportBySlug(r.sport)?.name}</p>
                <p className="mt-1 font-semibold leading-tight">{a ? fullName(a) : r.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-bone/75">{r.title}</p>
              </div>
              <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-bone backdrop-blur transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                <Play size={14} weight="fill" />
              </span>
            </Link>
          </Reveal>
        );
      })}
    </ul>
  );
}
