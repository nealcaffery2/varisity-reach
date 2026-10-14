import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { news, newsBySlug } from '@/content/news';
import { sportBySlug } from '@/content/sports';
import { shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';

export const dynamicParams = false;
export const generateStaticParams = ({ params }: { params: { school: string } }) => news.filter((n) => n.school === params.school).map((n) => ({ slug: n.slug }));

type Props = { params: Promise<{ school: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = newsBySlug((await params).slug);
  return n ? { title: n.title, description: n.summary, openGraph: { type: 'article', images: n.image ? [asset(n.image)] : undefined } } : {};
}

export default async function NewsItemPage({ params }: Props) {
  const n = newsBySlug((await params).slug);
  if (!n) notFound();
  const sport = n.sport ? sportBySlug(n.sport) : undefined;
  const more = news.filter((x) => x.school === n.school && x.slug !== n.slug && (!n.sport || x.sport === n.sport)).slice(0, 3);
  return (
    <article>
      <header className="wrap pt-32 md:pt-40">
        <Link href={`/${n.school}/news/`} className="inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone"><ArrowLeft size={16} /> All news</Link>
        <p className="mt-6 text-accent">
          {sport && <Link href={`/${n.school}/teams/${sport.slug}/`} className="link-u">{sport.name}</Link>}
          {sport && ' · '}
          {n.date ? <time dateTime={n.date}>{shortDate(n.date)}</time> : 'From the archive'}
        </p>
        <h1 className="display mt-3 max-w-5xl text-[clamp(3rem,8vw,7rem)]">{n.title}</h1>
        <p className="mt-6 max-w-2xl text-xl text-bone/85">{n.summary}</p>
      </header>
      {n.image && (
        <div className="wrap mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(n.image)} alt="" className="aspect-[21/9] w-full rounded object-cover grayscale" />
        </div>
      )}
      <div className="wrap grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_18rem]">
        <div className="max-w-[65ch] space-y-5 text-lg leading-relaxed text-bone/90">
          {n.body.map((p, i) => <p key={i}>{p}</p>)}
          <p className="pt-4 text-base text-mute">
            Source: <a href={n.source.url} className="link-u inline-flex items-center gap-1 text-bone">{n.source.label} <ArrowUpRight size={14} /></a>
          </p>
        </div>
        {more.length > 0 && (
          <aside aria-labelledby="more-h">
            <h2 id="more-h" className="text-sm font-semibold text-bone">More {sport ? sport.name.toLowerCase() : 'news'}</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {more.map((m) => (
                <li key={m.slug}><Link href={`/${n.school}/news/${m.slug}/`} className="block py-4 text-mute hover:text-bone">{m.title}</Link></li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
