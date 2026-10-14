import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { news } from '@/content/news';
import { sportBySlug } from '@/content/sports';
import { schoolBySlug } from '@/content/schools';
import { notFound } from 'next/navigation';
import { shortDate } from '@/lib/format';
import { asset } from '@/lib/asset';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  return s ? { title: `${s.town} news`, description: `${s.name} athletics news, results and decisions that affect ${s.short} teams.`, robots: s.sample ? { index: false } : undefined } : {};
}

export default async function NewsPage({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  const list = news.filter((n) => n.school === school.slug);
  const [lead, ...rest] = list;
  return (
    <>
      <PageHeader title="News">Results, honors and decisions that touch {school.short} sports. Each story links to its source.</PageHeader>
      {!lead ? (
        <div className="wrap py-16">
          <div className="rounded border border-dashed border-line-2 p-10">
            <p className="display text-4xl">No stories yet</p>
            <p className="mt-3 max-w-md text-mute">Verified coaches and local reporters post game recaps here. Get verified to write for {school.town}.</p>
            <Link href="/join/" className="btn btn-primary mt-6">Get verified</Link>
          </div>
        </div>
      ) : (
      <div className="wrap py-16">
        <Link href={`/${school.slug}/news/${lead.slug}/`} className="group grid overflow-hidden rounded border border-line md:grid-cols-[1.3fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden bg-ink-2 md:aspect-auto">
            {lead.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset(lead.image)} alt="" className="absolute inset-0 h-full w-full object-cover grayscale transition-[transform,filter] duration-700 group-hover:scale-105 group-hover:grayscale-0" />
            )}
          </div>
          <div className="flex flex-col justify-end gap-4 p-6 md:p-10">
            <p className="text-sm text-accent">{lead.date ? shortDate(lead.date) : 'From the archive'}</p>
            <h2 className="display text-5xl md:text-6xl group-hover:text-accent transition-colors">{lead.title}</h2>
            <p className="text-mute">{lead.summary}</p>
          </div>
        </Link>
        <ul className="mt-12 divide-y divide-line border-y border-line">
          {rest.map((n) => {
            const s = n.sport ? sportBySlug(n.sport) : undefined;
            return (
              <li key={n.slug}>
                <Link href={`/${school.slug}/news/${n.slug}/`} className="group grid gap-2 py-6 md:grid-cols-[10rem_1fr_12rem] md:items-baseline md:gap-8">
                  <span className="text-sm text-dim">{n.date ? shortDate(n.date) : 'Archive'}</span>
                  <span>
                    <span className="display block text-3xl text-bone transition-colors group-hover:text-accent md:text-4xl">{n.title}</span>
                    <span className="mt-2 block max-w-[65ch] text-mute">{n.summary}</span>
                  </span>
                  <span className="text-sm text-accent md:text-right">{s?.name ?? 'District'}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      )}
    </>
  );
}
