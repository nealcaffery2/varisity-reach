'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LinkSimple, UploadSimple } from '@phosphor-icons/react';
import { athletes, athleteBySlug, fullName } from '@/content/athletes';
import { schools } from '@/content/schools';
import {
  claimLinkCode, demoAddress, demoLinks, demoSocials, demoUploads, saveAddress, saveSocials, sendAcademicFeedback, uploadToProfile,
  type Address, type Socials,
} from '@/lib/community';

const NETWORKS: { key: keyof Socials; label: string }[] = [
  { key: 'hudl', label: 'Hudl profile link' },
  { key: 'maxpreps', label: 'MaxPreps profile link' },
  { key: 'x', label: 'X handle' },
  { key: 'instagram', label: 'Instagram handle' },
  { key: 'tiktok', label: 'TikTok handle' },
  { key: 'youtube', label: 'YouTube channel link' },
  { key: '247', label: '247Sports profile link' },
  { key: 'on3', label: 'On3 profile link' },
];

function AthletePanel({ slug }: { slug: string }) {
  const a = athleteBySlug(slug)!;
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploads, setUploads] = useState(demoUploads(slug));
  const [addr, setAddr] = useState<Address>(demoAddress(slug) ?? { nameOnMail: `Parents of ${fullName(a)}`, street: '', city: '', state: '', zip: '', shareWithRecruiters: false, parentConsent: false });
  const [socials, setSocials] = useState<Socials>(demoSocials(slug));
  const [msg, setMsg] = useState('');
  const say = (r: { ok: boolean; reason?: string }, ok: string) => setMsg(r.ok ? ok : (r as { reason: string }).reason);

  return (
    <article className="rounded border border-line">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-4">
        <h3 className="display text-4xl">{fullName(a)}</h3>
        <Link className="link-u text-sm text-mute" href={`/athletes/${slug}/`}>Open profile and wishlist</Link>
      </header>
      <div className="grid gap-px bg-line md:grid-cols-3">
        <form
          className="grid content-start gap-3 bg-ink p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            const r = await uploadToProfile({ athlete: slug, file, caption });
            say(r, 'Uploaded. The coach approves it before it shows on the profile.');
            if (r.ok) { setUploads(demoUploads(slug)); setFile(null); setCaption(''); }
          }}
        >
          <h4 className="font-semibold text-bone">Add to the profile</h4>
          <div>
            <label htmlFor={`up-${slug}`} className="field-label">Photo, clip or document</label>
            <input id={`up-${slug}`} type="file" accept="image/*,video/*,application/pdf" className="field file:mr-3 file:rounded-sm file:border-0 file:bg-ink-3 file:px-3 file:py-1 file:text-bone" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label htmlFor={`cap-${slug}`} className="field-label">Caption</label>
            <input id={`cap-${slug}`} className="field" maxLength={280} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={!file}><UploadSimple size={16} /> Upload</button>
          {uploads.length > 0 && <ul className="text-sm text-mute">{uploads.map((u) => <li key={u.at}>{u.name}: waiting for coach review</li>)}</ul>}
        </form>

        <form
          className="grid content-start gap-3 bg-ink p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            say(await saveAddress(slug, addr), addr.shareWithRecruiters ? 'Saved. Verified recruiters can request it, and you hear each time one does.' : 'Saved. Only your family can see it.');
          }}
        >
          <h4 className="font-semibold text-bone">Mailing address</h4>
          <p className="text-sm text-mute">Private. College mail can reach you without anyone posting your street online.</p>
          {(['nameOnMail', 'street', 'city', 'state', 'zip'] as const).map((k) => (
            <div key={k}>
              <label htmlFor={`ad-${k}-${slug}`} className="field-label">{{ nameOnMail: 'Name on the envelope', street: 'Street', city: 'City', state: 'State', zip: 'ZIP' }[k]}</label>
              <input id={`ad-${k}-${slug}`} required className="field" autoComplete={{ nameOnMail: 'name', street: 'street-address', city: 'address-level2', state: 'address-level1', zip: 'postal-code' }[k]} value={addr[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })} />
            </div>
          ))}
          <label className="flex min-h-11 items-start gap-3 text-sm text-bone"><input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-accent)]" checked={addr.shareWithRecruiters} onChange={(e) => setAddr({ ...addr, shareWithRecruiters: e.target.checked })} /> Verified recruiters may see it</label>
          <label className="flex min-h-11 items-start gap-3 text-sm text-bone"><input type="checkbox" className="mt-0.5 size-5 accent-[var(--color-accent)]" checked={addr.parentConsent} onChange={(e) => setAddr({ ...addr, parentConsent: e.target.checked })} /> I am a parent or guardian and I agree</label>
          <button className="btn btn-primary">Save address</button>
        </form>

        <form className="grid content-start gap-3 bg-ink p-5" onSubmit={async (e) => { e.preventDefault(); say(await saveSocials(slug, socials), 'Links saved. Recruiters see them on the profile.'); }}>
          <h4 className="font-semibold text-bone">Socials and film accounts</h4>
          <p className="text-sm text-mute">Recruiters check these. Keep them ones you are proud of.</p>
          {NETWORKS.map((n) => (
            <div key={n.key}>
              <label htmlFor={`so-${n.key}-${slug}`} className="field-label">{n.label}</label>
              <input id={`so-${n.key}-${slug}`} className="field" value={socials[n.key] ?? ''} onChange={(e) => setSocials({ ...socials, [n.key]: e.target.value })} />
            </div>
          ))}
          <button className="btn btn-primary">Save links</button>
        </form>
      </div>
      <p className="min-h-6 px-5 py-3 text-sm text-mute" role="status">{msg}</p>
    </article>
  );
}

export function FamilyCenter() {
  const [links, setLinks] = useState<{ athlete: string }[]>([]);
  const [code, setCode] = useState('');
  const [demoAthlete, setDemoAthlete] = useState(athletes[0].slug);
  const [err, setErr] = useState('');
  const [fb, setFb] = useState({ school: schools[0].slug, topic: 'Classes and electives', body: '' });
  const [fbMsg, setFbMsg] = useState('');

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLinks(demoLinks());
  }, []);

  return (
    <div className="grid gap-14">
      <section aria-labelledby="link-h" className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="link-h" className="display text-5xl">Link your <span className="text-accent">athlete</span></h2>
          <p className="mt-4 text-mute">The coach hands each family a one-time code. Parents who link see every recruiter star, message, meet request and address view, get a copy of every message, and can add photos and film to the profile.</p>
        </div>
        <form
          className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr('');
            const r = await claimLinkCode(code, demoAthlete);
            if (!r.ok) return setErr(r.reason);
            setLinks(demoLinks());
            setCode('');
          }}
        >
          <div>
            <label htmlFor="fam-code" className="field-label">Link code</label>
            <input id="fam-code" className="field uppercase tracking-widest" required maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label htmlFor="fam-ath" className="field-label">Athlete (sample codes only)</label>
            <select id="fam-ath" className="field" value={demoAthlete} onChange={(e) => setDemoAthlete(e.target.value)}>
              {athletes.map((a) => <option key={a.slug} value={a.slug}>{fullName(a)}</option>)}
            </select>
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn btn-primary"><LinkSimple size={16} /> Link</button>
          <p className="text-xs text-dim">In demo mode any six letters work, for example TOPPER.</p>
        </form>
      </section>

      {links.length > 0 && (
        <section aria-label="Linked athletes" className="grid gap-8">
          {links.map((l) => <AthletePanel key={l.athlete} slug={l.athlete} />)}
        </section>
      )}

      <section aria-labelledby="fb-h" className="grid gap-6 border-t border-line pt-14 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="fb-h" className="display text-5xl">Tell the <span className="text-accent">school</span></h2>
          <p className="mt-4 text-mute">Private feedback on academics: classes you want offered, tutoring, college prep, schedules. It goes to the principal and athletic director only. Nobody else sees it, and it is never posted.</p>
        </div>
        <form
          className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await sendAcademicFeedback(fb);
            setFbMsg(r.ok ? (r.demo ? 'Saved in this browser. Once the site is live it goes to the school.' : 'Sent to the school.') : r.reason);
            if (r.ok) setFb({ ...fb, body: '' });
          }}
        >
          <div>
            <label htmlFor="fb-school" className="field-label">School</label>
            <select id="fb-school" className="field" value={fb.school} onChange={(e) => setFb({ ...fb, school: e.target.value })}>{schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
          </div>
          <div>
            <label htmlFor="fb-topic" className="field-label">About</label>
            <select id="fb-topic" className="field" value={fb.topic} onChange={(e) => setFb({ ...fb, topic: e.target.value })}>
              {['Classes and electives', 'Tutoring and study hall', 'College and career prep', 'Testing (ACT, SAT, NCAA core courses)', 'Schedules and practice time', 'Something else'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fb-body" className="field-label">What would help</label>
            <textarea id="fb-body" required maxLength={3000} className="field min-h-32" value={fb.body} onChange={(e) => setFb({ ...fb, body: e.target.value })} />
          </div>
          <button className="btn btn-primary">Send privately</button>
          <p className="min-h-5 text-sm text-mute" role="status">{fbMsg}</p>
        </form>
      </section>
    </div>
  );
}
