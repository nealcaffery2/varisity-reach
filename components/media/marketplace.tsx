'use client';

import { useEffect, useState } from 'react';
import { Camera, MapPin, VideoCamera } from '@phosphor-icons/react';
import { schools, schoolBySlug } from '@/content/schools';
import { sportBySlug, sportsFor } from '@/content/sports';
import { LICENSES, creditLine, split, type LicenseUse } from '@/lib/media';
import { becomeCreator, buyLicense, claimCoverage, listCoverage, listMedia, myCreator, requestCoverage, uploadMedia, viewer, type Coverage, type CreatorProfile, type MediaItem, type Viewer } from '@/lib/community';
import { isLive } from '@/lib/backend';

const money = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

export function LicenseTable() {
  return (
    <div className="relative overflow-x-auto rounded border border-line">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Photo license prices and who gets paid</caption>
        <thead className="bg-ink-2 text-xs text-dim">
          <tr><th scope="col" className="px-3 py-2 font-medium">License</th><th scope="col" className="px-3 py-2 font-medium">For</th><th scope="col" className="px-3 py-2 text-right font-medium">Price</th><th scope="col" className="px-3 py-2 text-right font-medium">Photographer</th><th scope="col" className="px-3 py-2 text-right font-medium">Team fund</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {(Object.keys(LICENSES) as LicenseUse[]).map((k) => {
            const l = LICENSES[k];
            const s = split(l.priceCents);
            return (
              <tr key={k}>
                <th scope="row" className="px-3 py-3 font-semibold text-bone">{l.label}<span className="block text-xs font-normal text-dim">{l.terms}</span></th>
                <td className="px-3 py-3 text-mute">{l.who}</td>
                <td className="num px-3 py-3 text-right text-bone">{money(l.priceCents)}</td>
                <td className="num px-3 py-3 text-right text-accent">{money(s.creator)}</td>
                <td className="num px-3 py-3 text-right text-mute">{money(s.school)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-3 text-sm text-mute">Shares are after card fees. Every licensed use carries the credit line, for example: <span className="text-bone">{creditLine('Jo Lee', 'Hillsboro High School')}</span></p>
    </div>
  );
}

export function CoverageBoard() {
  const [v, setV] = useState<Viewer | null>(null);
  const [list, setList] = useState<Coverage[] | null>(null);
  const [f, setF] = useState({ school: schools[0].slug, sport: 'football', gameOn: '', location: '', needs: '', pay: '' });
  const [msg, setMsg] = useState('');
  const load = () => listCoverage([]).then(setList);
  useEffect(() => {
    viewer().then(setV);
    load();
  }, []);
  const staff = v && (v.role === 'coach' || v.role === 'athletic director') && v.verified;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0">
        {list === null ? (
          <div className="h-24 animate-pulse rounded border border-line bg-ink-2" aria-hidden />
        ) : list.length === 0 ? (
          <div className="rounded border border-dashed border-line-2 p-8">
            <p className="display text-4xl">No open requests yet</p>
            <p className="mt-3 max-w-[34rem] text-mute">When a coach asks for someone to shoot a game, it posts here with the date, the town and what it pays. Photographers check this board and take the ones they can reach.</p>
          </div>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded border border-line bg-line">
            {list.map((c) => (
              <li key={c.id} className="grid gap-3 bg-ink p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-bone">{schoolBySlug(c.school)?.name ?? c.school}: {sportBySlug(c.sport)?.name ?? c.sport}</p>
                  <p className="text-sm text-mute">{day(c.gameOn)}{c.location ? ` · ${c.location}` : ''} · <span className="num text-bone">{c.payCents ? money(c.payCents) : 'Unpaid, keeps all sales'}</span></p>
                  {c.needs && <p className="mt-1 text-sm text-dim">{c.needs}</p>}
                </div>
                {c.status === 'open' ? (
                  <button type="button" className="btn btn-primary" onClick={async () => { const r = await claimCoverage(c.id); setMsg(r.ok ? 'It’s yours. The coach gets your name and portfolio.' : r.reason); load(); }}>Take it</button>
                ) : (
                  <span className="text-sm text-ok">Claimed</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 min-h-5 text-sm text-mute" role="status">{msg}</p>
      </div>

      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const dollars = f.pay.trim() === '' ? 0 : Number(f.pay);
          if (!Number.isFinite(dollars) || dollars < 0 || dollars > 5000) return setMsg('Pay is a dollar amount from 0 to 5,000.');
          const r = await requestCoverage({ school: f.school, sport: f.sport, gameOn: f.gameOn, location: f.location || undefined, needs: f.needs || undefined, payCents: Math.round(dollars * 100) });
          setMsg(r.ok ? (r.demo ? 'Posted in this browser.' : 'Posted. It shows on this board for photographers.') : r.reason);
          if (r.ok) { setF({ ...f, gameOn: '', needs: '', pay: '' }); load(); }
        }}
      >
        <h3 className="display text-3xl">Coaches: ask for coverage</h3>
        {!staff && v && <p className="text-sm text-dim">{v.demo ? 'Demo mode: anyone can post. Live, this takes a verified coach or AD.' : 'Verified coaches and athletic directors can post.'}</p>}
        <div><label htmlFor="cv-school" className="field-label">School</label><select id="cv-school" className="field" value={f.school} onChange={(e) => setF({ ...f, school: e.target.value, sport: sportsFor(e.target.value)[0]?.slug ?? '' })}>{schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
        <div><label htmlFor="cv-sport" className="field-label">Sport</label><select id="cv-sport" className="field" value={f.sport} onChange={(e) => setF({ ...f, sport: e.target.value })}>{sportsFor(f.school).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="cv-date" className="field-label">Game day</label><input id="cv-date" type="date" required className="field" value={f.gameOn} onChange={(e) => setF({ ...f, gameOn: e.target.value })} /></div>
          <div><label htmlFor="cv-pay" className="field-label">Pays ($, optional)</label><input id="cv-pay" inputMode="decimal" className="field" value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value.replace(/[^\d.]/g, '') })} /></div>
        </div>
        <div><label htmlFor="cv-loc" className="field-label">Where</label><input id="cv-loc" className="field" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
        <div><label htmlFor="cv-needs" className="field-label">What you need</label><textarea id="cv-needs" maxLength={500} className="field min-h-20" value={f.needs} onChange={(e) => setF({ ...f, needs: e.target.value })} placeholder="Senior night: every senior with family, plus game action" /></div>
        <button className="btn btn-primary"><Camera size={18} /> Post request</button>
      </form>
    </div>
  );
}

export function CreatorSignup() {
  const [f, setF] = useState<CreatorProfile>({ name: '', kind: 'photographer', town: '', miles: 30 });
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    myCreator().then((c) => {
      if (c) {
        setF(c);
        setDone(true);
      }
    });
  }, []);
  if (done) {
    return (
      <div className="rounded border border-accent p-6" role="status">
        {f.kind === 'videographer' ? <VideoCamera size={32} className="text-accent" aria-hidden /> : <Camera size={32} className="text-accent" aria-hidden />}
        <p className="display mt-3 text-4xl">{f.name}</p>
        <p className="mt-2 text-mute"><MapPin size={14} className="inline" aria-hidden /> {f.town}, {f.miles} miles. Take open requests from the board above, then upload your shots below. The school approves each photo before it sells.</p>
        <button type="button" className="btn btn-ghost mt-4" onClick={() => setDone(false)}>Edit</button>
      </div>
    );
  }
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await becomeCreator(f);
        if (!r.ok) return setMsg(r.reason);
        setDone(true);
      }}
    >
      <div><label htmlFor="cr-name" className="field-label">Name on your credit line</label><input id="cr-name" required className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label htmlFor="cr-kind" className="field-label">You shoot</label><select id="cr-kind" className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as CreatorProfile['kind'] })}><option value="photographer">Photos</option><option value="videographer">Video</option><option value="both">Both</option></select></div>
      <div><label htmlFor="cr-town" className="field-label">Home town</label><input id="cr-town" required className="field" value={f.town} onChange={(e) => setF({ ...f, town: e.target.value })} /></div>
      <div><label htmlFor="cr-miles" className="field-label">Will drive (miles)</label><input id="cr-miles" inputMode="numeric" className="field" value={f.miles} onChange={(e) => setF({ ...f, miles: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></div>
      <div className="md:col-span-2"><label htmlFor="cr-port" className="field-label">Portfolio link</label><input id="cr-port" type="url" className="field" value={f.portfolio ?? ''} onChange={(e) => setF({ ...f, portfolio: e.target.value })} /></div>
      {msg && <p className="text-sm text-danger md:col-span-2" role="alert">{msg}</p>}
      <div className="md:col-span-2"><button className="btn btn-primary">Join as a creator</button></div>
    </form>
  );
}

/** Creators upload a full-size photo and the preview the public sees. Staff approve before it sells. */
export function PhotoUpload() {
  const [isCreator, setIsCreator] = useState(false);
  const [f, setF] = useState({ school: schools[0].slug, sport: '', caption: '', studentsShown: true });
  const [original, setOriginal] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    myCreator().then((c) => setIsCreator(Boolean(c)));
  }, []);
  if (!isLive) return <p className="text-mute">Uploading and selling photos needs the live site. In this demo nothing is uploaded or sold.</p>;
  if (!isCreator) return <p className="text-mute">Join as a creator below, then upload here.</p>;
  return (
    <form
      key={formKey}
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!original || !preview) return setMsg('Add the full-size photo and the preview.');
        setBusy(true);
        const r = await uploadMedia({ school: f.school, sport: f.sport || undefined, caption: f.caption, original, preview, studentsShown: f.studentsShown });
        setBusy(false);
        if (!r.ok) return setMsg(r.reason);
        setMsg('Uploaded. It goes on sale once the school approves it.');
        setOriginal(null);
        setPreview(null);
        setF({ ...f, caption: '' });
        setFormKey((k) => k + 1);
      }}
    >
      <div><label htmlFor="up-school" className="field-label">School</label><select id="up-school" className="field" value={f.school} onChange={(e) => setF({ ...f, school: e.target.value, sport: '' })}>{schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
      <div><label htmlFor="up-sport" className="field-label">Sport</label><select id="up-sport" className="field" value={f.sport} onChange={(e) => setF({ ...f, sport: e.target.value })}><option value="">Not set</option>{sportsFor(f.school).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></div>
      <div><label htmlFor="up-orig" className="field-label">Full-size photo (stays private)</label><input id="up-orig" type="file" accept="image/*" required className="field file:mr-3 file:rounded-sm file:border-0 file:bg-ink-3 file:px-3 file:py-1 file:text-bone" onChange={(e) => setOriginal(e.target.files?.[0] ?? null)} /></div>
      <div><label htmlFor="up-prev" className="field-label">Preview (watermarked or small)</label><input id="up-prev" type="file" accept="image/*" required className="field file:mr-3 file:rounded-sm file:border-0 file:bg-ink-3 file:px-3 file:py-1 file:text-bone" onChange={(e) => setPreview(e.target.files?.[0] ?? null)} /></div>
      <div className="md:col-span-2"><label htmlFor="up-cap" className="field-label">Caption</label><input id="up-cap" required maxLength={280} className="field" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} /></div>
      <label className="flex min-h-11 items-center gap-3 text-sm text-bone md:col-span-2"><input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={f.studentsShown} onChange={(e) => setF({ ...f, studentsShown: e.target.checked })} /> Students are in this photo</label>
      {msg && <p className="text-sm text-mute md:col-span-2" role="status">{msg}</p>}
      <div className="md:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload for review'}</button></div>
    </form>
  );
}

/** Approved photos with a license picker. */
export function PhotoGallery() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [use, setUse] = useState<Record<string, LicenseUse>>({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    listMedia().then(setItems);
  }, []);
  if (!isLive) return <p className="text-mute">Photos for sale show here on the live site. This demo has none.</p>;
  if (items === null) return <div className="h-40 animate-pulse rounded border border-line bg-ink-2" aria-hidden />;
  if (!items.length) return <p className="text-mute">No approved photos yet. Once schools approve uploads, they show here.</p>;
  return (
    <div>
      <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const u = use[it.id] ?? 'personal';
          const blocked = u === 'commercial' && it.studentsShown && !it.releaseOnFile;
          return (
            <li key={it.id} className="flex flex-col bg-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.previewUrl} alt={it.caption} className="aspect-[4/3] w-full object-cover" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="text-bone">{it.caption}</p>
                <p className="text-xs text-dim">{creditLine(it.credit, schools.find((s) => s.slug === it.school)?.name ?? it.school)}</p>
                <div>
                  <label htmlFor={`lic-${it.id}`} className="field-label">License</label>
                  <select id={`lic-${it.id}`} className="field" value={u} onChange={(e) => setUse({ ...use, [it.id]: e.target.value as LicenseUse })}>
                    {(Object.keys(LICENSES) as LicenseUse[]).map((k) => <option key={k} value={k}>{LICENSES[k].label}, {money(LICENSES[k].priceCents)}</option>)}
                  </select>
                </div>
                {blocked && <p className="text-sm text-danger">Commercial use waits on the family’s release for this photo.</p>}
                <button
                  type="button"
                  className="btn btn-primary mt-auto"
                  disabled={busy === it.id || blocked}
                  onClick={async () => {
                    setBusy(it.id);
                    const r = await buyLicense(it.id, u);
                    setBusy('');
                    if (!r.ok) return setMsg(r.reason);
                    if (r.checkoutUrl) window.location.assign(r.checkoutUrl);
                  }}
                >
                  {busy === it.id ? 'Opening checkout…' : 'Buy license'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 min-h-5 text-sm text-mute" role="status">{msg}</p>
    </div>
  );
}
