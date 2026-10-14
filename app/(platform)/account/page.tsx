import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { AccountCenter } from '@/components/account/account-center';

export const metadata: Metadata = { title: 'Account', description: 'Notifications, meet and greet requests, film requests and notification settings.', robots: { index: false } };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Your" accent="account" />
      <section className="wrap py-14"><AccountCenter /></section>
    </>
  );
}
