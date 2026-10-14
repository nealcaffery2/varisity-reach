import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { GrantsFinder } from '@/components/grants-finder';

export const metadata: Metadata = { title: 'Grants', description: 'Equipment grants, field and lighting grants, family fee help and college money for small-school athletes, nearest first.' };

export default function GrantsPage() {
  return (
    <>
      <PageHeader title="Grants" accent="and help">Money and gear that small schools leave on the table. Set your county; local programs come first.</PageHeader>
      <section className="wrap py-14"><GrantsFinder /></section>
    </>
  );
}
