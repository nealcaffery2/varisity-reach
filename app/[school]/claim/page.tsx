import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ClaimForm } from '@/components/school/claim-form';
import { schoolBySlug } from '@/content/schools';

type Props = { params: Promise<{ school: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = schoolBySlug((await params).school);
  return s ? { title: `Claim ${s.name}`, robots: { index: false } } : {};
}

export default async function ClaimPage({ params }: Props) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  return (
    <>
      <PageHeader title="Claim" accent="this page">For the athletic director or whoever runs {school.short} athletics. Verify once, connect your website and accounts, and the page keeps itself current.</PageHeader>
      <section className="wrap max-w-4xl py-14"><ClaimForm school={school.slug} name={school.name} website={school.links.athletics ?? school.links.district} /></section>
    </>
  );
}
