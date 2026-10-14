'use client';

import { useState } from 'react';
import { Storefront } from '@phosphor-icons/react';
import { schools } from '@/content/schools';
import { offerMerchantDeal, type MerchantSignup } from '@/lib/community';

const TIERS: { tier: MerchantSignup['tier']; name: string; what: string; examples: string[] }[] = [
  { tier: 'gold', name: 'Gold', what: 'Top of the card, your logo on the scan screen, a thank-you on game-night posts.', examples: ['Free large pizza for every shutout', 'Buy one get one, the Monday after a win', 'Free car wash homecoming week'] },
  { tier: 'silver', name: 'Silver', what: 'Listed on the card with your offer and map link.', examples: ['15% off one item a month', '$15 off a full service oil change'] },
  { tier: 'bronze', name: 'Bronze', what: 'A simple everyday deal.', examples: ['$1 off any drink', 'Free fries with a burger'] },
];

/** Businesses offer a deal. It stays off every card until the owner signs the one-page agreement and the school turns it on. */
export function MerchantSignup() {
  const [f, setF] = useState<MerchantSignup>({ school: schools[0].slug, business: '', contactName: '', contactEmail: '', offer: '', tier: 'gold' });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const set = (k: keyof MerchantSignup) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <div className="rounded border border-accent p-6" role="status">
        <Storefront size={32} className="text-accent" aria-hidden />
        <p className="display mt-3 text-4xl">Thanks, {f.business}</p>
        <p className="mt-2 max-w-lg text-mute">{msg} Next: we email a one-page agreement with your offer written out. Once you sign it and the athletic office approves, it goes live on every card.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <ol className="grid gap-px overflow-hidden rounded border border-line bg-line">
          {TIERS.map((t) => (
            <li key={t.tier} className="bg-ink p-5">
              <p className={`display text-3xl ${t.tier === 'gold' ? 'text-accent' : 'text-bone'}`}>{t.name}</p>
              <p className="mt-1 text-sm text-mute">{t.what}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-dim">{t.examples.map((x) => <li key={x}>{x}</li>)}</ul>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-dim">Deals tied to wins, shutouts and homecoming get used most and get talked about. Every redemption is a scan, so you see exactly how many people came in.</p>
      </div>
      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await offerMerchantDeal(f);
          if (!r.ok) return setMsg(r.reason);
          setMsg(r.demo ? 'Saved in this browser (demo mode).' : '');
          setDone(true);
        }}
      >
        <h3 className="display text-3xl">Offer a deal</h3>
        <div><label htmlFor="m-school" className="field-label">School you are backing</label><select id="m-school" className="field" value={f.school} onChange={set('school')}>{schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
        <div><label htmlFor="m-biz" className="field-label">Business name</label><input id="m-biz" required autoComplete="organization" className="field" value={f.business} onChange={set('business')} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="m-name" className="field-label">Your name</label><input id="m-name" required autoComplete="name" className="field" value={f.contactName} onChange={set('contactName')} /></div>
          <div><label htmlFor="m-email" className="field-label">Email</label><input id="m-email" type="email" required autoComplete="email" className="field" value={f.contactEmail} onChange={set('contactEmail')} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="m-phone" className="field-label">Phone</label><input id="m-phone" type="tel" autoComplete="tel" className="field" value={f.phone ?? ''} onChange={set('phone')} /></div>
          <div><label htmlFor="m-tier" className="field-label">Tier</label><select id="m-tier" className="field" value={f.tier} onChange={set('tier')}>{TIERS.map((t) => <option key={t.tier} value={t.tier}>{t.name}</option>)}</select></div>
        </div>
        <div><label htmlFor="m-addr" className="field-label">Address</label><input id="m-addr" autoComplete="street-address" className="field" value={f.address ?? ''} onChange={set('address')} /></div>
        <div><label htmlFor="m-offer" className="field-label">The offer, in one line</label><input id="m-offer" required maxLength={140} className="field" value={f.offer} onChange={set('offer')} /></div>
        <div><label htmlFor="m-fine" className="field-label">Limits (optional)</label><textarea id="m-fine" className="field min-h-20" value={f.finePrint ?? ''} onChange={set('finePrint')} placeholder="One per visit. Not with other deals. Dine-in only." /></div>
        {msg && <p className="text-sm text-danger" role="alert">{msg}</p>}
        <button className="btn btn-primary"><Storefront size={18} /> Send my offer</button>
      </form>
    </div>
  );
}
