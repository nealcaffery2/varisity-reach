'use client';

import { useState } from 'react';
import { SealCheck } from '@phosphor-icons/react';
import { claimSchool, type SchoolClaim } from '@/lib/community';

const ACCOUNTS: { key: keyof SchoolClaim['accounts']; label: string; hint: string }[] = [
  { key: 'hudl', label: 'Hudl', hint: 'https://www.hudl.com/team/…' },
  { key: 'maxpreps', label: 'MaxPreps', hint: 'https://www.maxpreps.com/il/…' },
  { key: '247', label: '247Sports', hint: 'High school page link' },
  { key: 'on3', label: 'On3', hint: 'High school page link' },
  { key: 'facebook', label: 'Facebook', hint: 'https://www.facebook.com/…' },
  { key: 'instagram', label: 'Instagram', hint: '@handle' },
  { key: 'x', label: 'X', hint: '@handle' },
  { key: 'tiktok', label: 'TikTok', hint: '@handle' },
  { key: 'youtube', label: 'YouTube or NFHS Network', hint: 'Channel link' },
  { key: 'newspaper', label: 'Local newspaper sports page', hint: 'Link to the section' },
];

const PERMS: { key: keyof SchoolClaim['permissions']; label: string }[] = [
  { key: 'siteNews', label: 'Read news from our website’s feed and post sports stories here' },
  { key: 'schedules', label: 'Read schedules and scores from our athletics calendar' },
  { key: 'rosters', label: 'Read rosters we publish (coaches still approve every athlete)' },
  { key: 'photos', label: 'Use photos from our posts, credited to the school' },
];

/** The athletic director (or whoever runs athletics) claims the page and connects the school's accounts. */
export function ClaimForm({ school, name, website }: { school: string; name: string; website?: string }) {
  const [f, setF] = useState<SchoolClaim>({ school, name: '', title: 'Athletic director', email: '', website, permissions: { siteNews: true, schedules: true, rosters: false, photos: false }, accounts: {} });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded border border-accent p-6" role="status">
        <SealCheck size={36} className="text-accent" aria-hidden />
        <p className="display mt-3 text-4xl">Claim received</p>
        <p className="mt-2 max-w-lg text-mute">{msg} We confirm by calling the {name} main office, then your page switches to verified and starts pulling from the sources you allowed.</p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/\.(k12\.[a-z]{2}\.us|org|net|edu|us|com)$/i.test(f.email.split('@')[1] ?? '')) return setMsg('Use your school email address so we can match it to the school.');
        const r = await claimSchool(f);
        if (!r.ok) return setMsg(r.reason);
        setMsg(r.demo ? 'Saved in this browser (demo mode).' : '');
        setDone(true);
      }}
    >
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="display mb-2 text-3xl">You</legend>
        <div><label htmlFor="c-name" className="field-label">Name</label><input id="c-name" required autoComplete="name" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label htmlFor="c-title" className="field-label">Title</label><input id="c-title" required className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label htmlFor="c-email" className="field-label">School email</label><input id="c-email" type="email" required autoComplete="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label htmlFor="c-site" className="field-label">School website</label><input id="c-site" type="url" className="field" value={f.website ?? ''} onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
      </fieldset>
      <fieldset className="grid gap-1">
        <legend className="display mb-2 text-3xl">What we may read</legend>
        {PERMS.map((p) => (
          <label key={p.key} className="flex min-h-11 items-start gap-3 text-sm text-bone">
            <input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-accent)]" checked={f.permissions[p.key]} onChange={(e) => setF({ ...f, permissions: { ...f.permissions, [p.key]: e.target.checked } })} />
            {p.label}
          </label>
        ))}
        <p className="mt-2 text-sm text-dim">Change these any time. We read public pages and feeds only and never log in to your accounts.</p>
      </fieldset>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="display mb-2 text-3xl">Connect accounts</legend>
        {ACCOUNTS.map((a) => (
          <div key={a.key}>
            <label htmlFor={`c-${a.key}`} className="field-label">{a.label}</label>
            <input id={`c-${a.key}`} className="field" placeholder={a.hint} value={f.accounts[a.key] ?? ''} onChange={(e) => setF({ ...f, accounts: { ...f.accounts, [a.key]: e.target.value } })} />
          </div>
        ))}
        <p className="text-sm text-dim md:col-span-2">Hudl, MaxPreps and 247Sports do not offer public data feeds, so we link and embed them instead of copying their numbers. Your coaches’ own stat entries stay the source on Varsity Reach.</p>
      </fieldset>
      {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
      <button className="btn btn-primary w-full sm:w-auto"><SealCheck size={18} /> Claim {name}</button>
    </form>
  );
}
