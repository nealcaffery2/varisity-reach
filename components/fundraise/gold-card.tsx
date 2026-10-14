'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Storefront } from '@phosphor-icons/react';
import QRCode from 'qrcode';
import { goldCards, goldCardFor } from '@/content/fundraising';
import { schoolBySlug, schoolTheme } from '@/content/schools';
import { buyGoldCard, claimGoldCard, isLive, savedGoldCard, verifyGoldCard } from '@/lib/backend';
import type { CardPayload } from '@/lib/gold-card';
import { dollars } from '@/lib/fundraise';
import { asset } from '@/lib/asset';

export function GoldCardShop() {
  const [school, setSchool] = useState(goldCards[0].school);
  const [holder, setHolder] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<{ token: string; payload: CardPayload; demo: boolean } | null>(null);
  const offer = goldCardFor(school)!;
  const s = schoolBySlug(school)!;

  useEffect(() => {
    const show = (t: string) => verifyGoldCard(t).then((r) => r.ok && setCard({ token: t, payload: r.payload, demo: Boolean(r.demo) }));
    const session = new URLSearchParams(window.location.search).get('session_id');
    if (session) {
      claimGoldCard(session).then((t) => (t ? show(t) : setError('Payment went through. Your card is on its way by email; reload this page in a minute to see it here.')));
      return;
    }
    const t = savedGoldCard();
    if (t) show(t);
  }, []);

  const buy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holder.trim()) return setError('Add the name that goes on the card.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Add an email for the receipt and a copy of the card.');
    setError('');
    setBusy(true);
    try {
      const r = await buyGoldCard({ school, holder: holder.trim(), email: email.trim() });
      if (r.checkoutUrl) return window.location.assign(r.checkoutUrl);
      if (r.token) {
        const v = await verifyGoldCard(r.token);
        if (v.ok) setCard({ token: r.token, payload: v.payload, demo: Boolean(v.demo) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout did not open. Nothing was charged.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_26rem]" style={schoolTheme(s) as React.CSSProperties}>
      <div>
        {card ? (
          <CardFace token={card.token} payload={card.payload} demo={card.demo} />
        ) : (
          <div className="rounded border border-line bg-ink-2 p-6">
            <h2 className="display text-4xl">What it gets you</h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {offer.perks.map((p) => (
                <li key={p.merchant} className="flex items-start gap-3 py-3">
                  <Storefront size={20} className="mt-0.5 shrink-0 text-accent" />
                  <span><span className="block text-bone">{p.offer}</span><span className="text-sm text-mute">{p.merchant}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-dim">Good for the {offer.season} school year. Merchants scan the code on your phone to check it.{offer.sample && ' Sample merchants and offers.'}</p>
          </div>
        )}
      </div>
      <form onSubmit={buy} noValidate className="rounded border border-line bg-ink-2 p-5 lg:sticky lg:top-24 lg:self-start">
        <h2 className="display text-4xl">{card ? 'Buy another' : 'Get the card'}</h2>
        <div className="mt-4">
          <label htmlFor="gc-school" className="field-label">School</label>
          <select id="gc-school" className="field" value={school} onChange={(e) => setSchool(e.target.value)}>
            {goldCards.map((g) => <option key={g.school} value={g.school}>{schoolBySlug(g.school)?.name}</option>)}
          </select>
        </div>
        <div className="mt-4">
          <label htmlFor="gc-name" className="field-label">Name on the card</label>
          <input id="gc-name" className="field" value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="name" />
        </div>
        <div className="mt-4">
          <label htmlFor="gc-email" className="field-label">Email</label>
          <input id="gc-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Opening checkout…' : `Buy for ${dollars(offer.priceCents)}`}</button>
        <p className="mt-3 text-xs text-dim">Paid to {offer.payee}.{!isLive && ' Demo mode: no card is charged and the card says DEMO.'}</p>
      </form>
    </div>
  );
}

function CardFace({ token, payload, demo }: { token: string; payload: CardPayload; demo: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const s = schoolBySlug(payload.school);
  useEffect(() => {
    const url = `${window.location.origin}${asset('/gold-card/verify/')}#t=${token}`;
    if (canvas.current) QRCode.toCanvas(canvas.current, url, { width: 168, margin: 1, color: { dark: '#1a1405', light: '#f6e7b0' } }).catch(() => {});
  }, [token]);
  return (
    <motion.div
      initial={{ rotateX: 18, opacity: 0, y: 20 }}
      animate={{ rotateX: 0, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className="relative mx-auto aspect-[1.586] w-full max-w-lg overflow-hidden rounded-xl p-6 text-[#1a1405] shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)] [perspective:800px]"
      style={{ background: 'linear-gradient(135deg, #f6e7b0 0%, #d9b45a 38%, #f3dc95 55%, #b98d2c 100%)' }}
      role="img"
      aria-label={`Gold card for ${payload.holder}, ${s?.name}, ${payload.season}`}
    >
      <motion.div aria-hidden className="absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)]" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
      <div className="relative flex h-full justify-between gap-4">
        <div className="flex flex-col justify-between">
          <div>
            <p className="display text-3xl leading-none">{s?.town} {s?.mascot}</p>
            <p className="mt-1 text-sm font-semibold uppercase">Gold card · {payload.season}</p>
          </div>
          <div>
            <p className="display text-2xl leading-none">{payload.holder}</p>
            <p className="text-xs">Good through {payload.exp}</p>
            {demo && <p className="mt-1 inline-block rounded-sm bg-[#1a1405] px-1.5 py-0.5 text-[0.625rem] font-bold text-[#f6e7b0]">DEMO, NOT VALID AT MERCHANTS</p>}
          </div>
        </div>
        <canvas ref={canvas} width={168} height={168} className="h-auto w-[42%] max-w-[168px] self-center rounded" />
      </div>
    </motion.div>
  );
}
