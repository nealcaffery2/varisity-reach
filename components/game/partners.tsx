'use client';

import { useEffect, useState } from 'react';
import { ArrowSquareOut, Megaphone, Radio } from '@phosphor-icons/react';
import { starterWants } from '@/content/wants';
import { addPartnerLink, listPartnerLinks, listWants, sponsorGame, topSponsors, viewer, type PartnerLink, type Sponsorship, type Want } from '@/lib/community';

const KINDS: PartnerLink['kind'][] = ['radio', 'stream', 'live blog', 'recap', 'photos'];

/** Local papers, radio stations, the school and coaches link their coverage to the game. */
export function PartnerPanel({ gameId }: { gameId: string }) {
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ partner: '', partnerKind: 'radio' as 'newspaper' | 'radio' | 'tv' | 'stream' | 'school', kind: 'radio' as PartnerLink['kind'], url: '' });
  const [msg, setMsg] = useState('');
  const [canLink, setCanLink] = useState(false);
  useEffect(() => {
    let current = true;
    listPartnerLinks(gameId).then((l) => current && setLinks(l));
    viewer().then((v) => current && setCanLink(Boolean(v.demo) || (v.verified && ['coach', 'athletic director', 'reporter'].includes(v.role))));
    return () => {
      current = false;
    };
  }, [gameId]);

  return (
    <section aria-labelledby="partners-h">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="partners-h" className="display text-3xl">Local coverage</h2>
        {canLink && <button type="button" className="link-u min-h-11 text-sm text-mute hover:text-bone" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Add your broadcast or story'}</button>}
      </div>
      {links.length === 0 ? (
        <p className="mt-3 text-sm text-mute">No radio call, live blog or recap linked yet. Verified coaches, reporters and media partners can add theirs.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {links.map((l, i) => (
            <li key={i}><a className="flex min-h-12 items-center justify-between gap-3 py-2 text-bone hover:text-accent" href={l.url} target="_blank" rel="noreferrer"><span className="flex items-center gap-2"><Radio size={16} aria-hidden /> {l.partner}</span><span className="flex items-center gap-1 text-sm text-mute">{l.kind} <ArrowSquareOut size={12} aria-label="opens in a new tab" /></span></a></li>
          ))}
        </ul>
      )}
      {open && (
        <form
          className="mt-4 grid gap-3 rounded border border-line bg-ink-2 p-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await addPartnerLink({ gameId, ...f });
            setMsg(r.ok ? (r.demo ? 'Saved in this browser (demo mode).' : 'Linked.') : r.reason);
            if (r.ok) { setOpen(false); listPartnerLinks(gameId).then(setLinks); }
          }}
        >
          <div><label htmlFor="pt-name" className="field-label">Outlet</label><input id="pt-name" required className="field" value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} placeholder="WSMI 106.1" /></div>
          <div><label htmlFor="pt-pk" className="field-label">You are</label><select id="pt-pk" className="field" value={f.partnerKind} onChange={(e) => setF({ ...f, partnerKind: e.target.value as typeof f.partnerKind })}><option value="radio">Radio</option><option value="newspaper">Newspaper</option><option value="tv">TV</option><option value="stream">Streamer</option><option value="school">The school or a coach</option></select></div>
          <div><label htmlFor="pt-kind" className="field-label">Link type</label><select id="pt-kind" className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as PartnerLink['kind'] })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
          <div><label htmlFor="pt-url" className="field-label">Link</label><input id="pt-url" type="url" required className="field" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
          <button className="btn btn-primary sm:col-span-2">Link it</button>
        </form>
      )}
      <p className="mt-2 min-h-5 text-sm text-mute" role="status">{msg}</p>
    </section>
  );
}

/** A business sponsors this game: top of the watch list, money to the school for a pledge the school keeps. */
export function SponsorCard({ gameId, school, schoolName, sample }: { gameId: string; school: string; schoolName: string; sample: boolean }) {
  const [current, setCurrent] = useState<Sponsorship | undefined>();
  const [wants, setWants] = useState<Want[]>([]);
  const [f, setF] = useState({ sponsor: '', dollars: '100', wantId: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    topSponsors().then((t) => setCurrent(t[gameId]));
    // The school's own open wants are what a sponsorship can pay for.
    listWants(school, starterWants(school)).then((w) => {
      const open = w.filter((x) => x.status === 'open');
      setWants(open);
      if (open[0]) setF((cur) => ({ ...cur, wantId: cur.wantId || open[0].id }));
    });
  }, [gameId, school]);
  const picked = wants.find((w) => w.id === f.wantId);

  return (
    <section className="rounded border border-line p-5" aria-labelledby="sponsor-h">
      <h2 id="sponsor-h" className="display text-3xl">Sponsor this game</h2>
      {current ? (
        <p className="mt-2 text-sm text-mute"><Megaphone size={14} className="inline text-accent" aria-hidden /> <span className="text-bone">{current.sponsor}</span> put ${Math.round(current.amountCents / 100)} toward {current.pledge.toLowerCase()} for {schoolName}.</p>
      ) : (
        <p className="mt-2 text-sm text-mute">Your name tops the watch list for this game. Every dollar goes to {schoolName} for an item on its wants board.</p>
      )}
      <form
        className="mt-4 grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          if (!picked) return setMsg('This school has nothing on its wants board yet.');
          const dollars = Number(f.dollars);
          if (!Number.isInteger(dollars) || dollars < 25 || dollars > 5000) return setMsg('Sponsorships run from $25 to $5,000.');
          const r = await sponsorGame({ gameId, school, sponsor: f.sponsor, amountCents: Math.round(Number(f.dollars) * 100), pledge: picked.title, wantId: picked.id });
          setBusy(false);
          if (!r.ok) return setMsg(r.reason);
          if (r.checkoutUrl) return window.location.assign(r.checkoutUrl);
          topSponsors().then((t) => setCurrent(t[gameId]));
          setMsg(sample ? 'Sample game: saved in this browser only.' : 'Saved in this browser (demo mode).');
        }}
      >
        <div><label htmlFor="sp-name" className="field-label">Business or family name</label><input id="sp-name" required maxLength={80} className="field" value={f.sponsor} onChange={(e) => setF({ ...f, sponsor: e.target.value })} /></div>
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <div><label htmlFor="sp-amt" className="field-label">Dollars</label><input id="sp-amt" inputMode="numeric" required maxLength={4} className="field num" value={f.dollars} onChange={(e) => setF({ ...f, dollars: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></div>
          <div><label htmlFor="sp-pledge" className="field-label">Pays for</label><select id="sp-pledge" className="field" value={f.wantId} onChange={(e) => setF({ ...f, wantId: e.target.value })} disabled={!wants.length}>{wants.length ? wants.map((w) => <option key={w.id} value={w.id}>{w.title}</option>) : <option value="">Wants board is empty</option>}</select></div>
        </div>
        <button className="btn btn-primary" disabled={busy || !wants.length}>{busy ? 'Opening checkout…' : 'Sponsor'}</button>
        <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
      </form>
    </section>
  );
}
