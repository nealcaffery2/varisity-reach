import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { campaigns, campaignById } from '@/content/fundraising';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { CampaignView } from '@/components/fundraise/campaign-view';
import { asset } from '@/lib/asset';

export const dynamicParams = false;
export const generateStaticParams = () => campaigns.map((c) => ({ id: c.id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = campaignById((await params).id);
  const s = c ? schoolBySlug(c.school) : undefined;
  return c && s ? { title: `${c.title} | ${s.town} ${s.mascot}`, description: c.need, robots: c.sample ? { index: false } : undefined, openGraph: { images: c.image ? [asset(c.image)] : undefined } } : {};
}

export default async function CampaignPage({ params }: Props) {
  const c = campaignById((await params).id);
  if (!c) notFound();
  const school = schoolBySlug(c.school)!;
  return (
    <div style={schoolTheme(school) as React.CSSProperties}>
      <header className="relative isolate overflow-hidden border-b border-line pb-12 pt-28 md:pt-36">
        {c.image && (
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(c.image)} alt="" className="h-full w-full object-cover opacity-40 grayscale" />
            <div className="absolute inset-0 bg-accent opacity-30 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          </div>
        )}
        <div className="wrap">
          <Link href={`/fundraise/?school=${school.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone"><ArrowLeft size={16} /> {school.town} fundraisers</Link>
          <p className="mt-6 text-accent">{school.name}{c.sample && <span className="text-dim"> · sample fundraiser, made up to show the page</span>}</p>
          <h1 className="display mt-2 max-w-5xl text-[clamp(3.5rem,10vw,8.5rem)]">{c.title}</h1>
        </div>
      </header>
      <div className="wrap py-12 md:py-16"><CampaignView c={c} /></div>
    </div>
  );
}
