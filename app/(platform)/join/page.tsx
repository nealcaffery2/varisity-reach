import type { Metadata } from 'next';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/page-header';
import { JoinForm } from '@/components/join-form';

export const metadata: Metadata = { title: 'Get verified', description: 'Verification for coaches, athletic directors, local reporters and official scorers.' };

const CAN = [
  ['Coaches', 'Publish rosters and stats with a verified mark, lock live scores, post team needs, nominate the Underdog of the Week.'],
  ['Athletic directors', 'Approve fundraisers, connect the payout account, claim teams and confirm coaches.'],
  ['Reporters', 'Write spotlights, verify stat lines you covered, and lock scores at games you are working.'],
  ['Official scorers', 'Lock the official score from the scorer’s table.'],
];

export default function JoinPage() {
  return (
    <>
      <PageHeader title="Get" accent="verified">
        The mark recruiters filter on. Verified accounts are the ones whose numbers and scores the whole network can trust.
      </PageHeader>
      <div className="wrap grid gap-12 py-12 lg:grid-cols-[1fr_1.3fr]">
        <dl className="divide-y divide-line border-y border-line">
          {CAN.map(([k, v]) => (
            <div key={k} className="py-5">
              <dt className="display flex items-center gap-2 text-3xl"><SealCheck size={24} weight="fill" className="text-accent" /> {k}</dt>
              <dd className="mt-2 text-mute">{v}</dd>
            </div>
          ))}
        </dl>
        <JoinForm />
      </div>
    </>
  );
}
