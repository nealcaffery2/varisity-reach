'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { campaigns } from '@/content/fundraising';
import { schools, schoolBySlug } from '@/content/schools';
import { CampaignCard } from '@/components/campaign-card';

export function CampaignList() {
  const [school, setSchool] = useState('');
  useEffect(() => {
    const sc = new URLSearchParams(window.location.search).get('school');
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sc && schoolBySlug(sc)) setSchool(sc);
  }, []);
  const list = campaigns.filter((c) => !school || c.school === school);
  return (
    <div>
      <h2 className="sr-only">Open fundraisers</h2>
      <label htmlFor="f-school" className="field-label">School</label>
      <select
        id="f-school"
        className="field w-auto"
        value={school}
        onChange={(e) => {
          setSchool(e.target.value);
          window.history.replaceState(null, '', e.target.value ? `?school=${e.target.value}` : window.location.pathname);
        }}
      >
        <option value="">Every school on the network</option>
        {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
      </select>
      {list.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">{list.map((c) => <CampaignCard key={c.id} c={c} />)}</div>
      ) : (
        <div className="mt-8 rounded border border-dashed border-line-2 p-10">
          <p className="display text-4xl">No open fundraisers</p>
          <p className="mt-3 max-w-md text-mute">A coach posts a need from the coach dashboard, and it opens here once the athletic director approves it.</p>
          <Link href="/coach/" className="btn btn-primary mt-6">Post a need</Link>
        </div>
      )}
    </div>
  );
}
