import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { FamilyCenter } from '@/components/account/family-center';

export const metadata: Metadata = { title: 'Family', description: 'Link to your athlete, add photos and film, keep a private mailing address, and send the school private feedback.', robots: { index: false } };

export default function FamilyPage() {
  return (
    <>
      <PageHeader title="Family">Parents and athletes run the profile together. You see everything a recruiter does with it.</PageHeader>
      <section className="wrap py-14"><FamilyCenter /></section>
    </>
  );
}
