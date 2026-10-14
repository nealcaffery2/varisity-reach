// Stripe tells us a payment cleared. Gifts are recorded; gold cards are signed
// and stored so the buyer's success page can claim the card. Idempotent on the
// Checkout Session id. Deploy with --no-verify-jwt; Stripe signs instead.
import { admin, json } from '../_shared/http.ts';
import { stripe, stripeGet, verifyStripeSignature } from '../_shared/stripe.ts';
import { sign } from '../_shared/gold-card.ts';

Deno.serve(async (req) => {
  const raw = await req.text();
  const ok = await verifyStripeSignature(raw, req.headers.get('Stripe-Signature'), Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  if (!ok) return new Response('bad signature', { status: 400 });
  const event = JSON.parse(raw);
  if (event.type !== 'checkout.session.completed' || event.data.object.payment_status !== 'paid') return json({ ignored: true });

  const s = event.data.object;
  const m = s.metadata ?? {};
  const db = admin();
  if (m.kind === 'donation') {
    await db.from('donations').upsert(
      { campaign_id: m.campaign_id, amount_cents: s.amount_total, name: m.anonymous === '1' ? null : m.name, anonymous: m.anonymous === '1', message: m.message || null, squad: m.squad || null, stripe_session: s.id },
      { onConflict: 'stripe_session', ignoreDuplicates: true },
    );
  } else if (m.kind === 'gold-card') {
    const now = new Date();
    const end = now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
    const payload = { school: m.school, holder: m.holder, season: `${end - 1}-${String(end).slice(2)}`, exp: `${end}-07-31`, n: crypto.randomUUID().slice(0, 8) };
    const token = await sign(payload, Deno.env.get('GOLD_CARD_SECRET')!);
    await db.from('gold_cards').upsert({ school_slug: m.school, holder: m.holder, email: m.email, season: payload.season, token, stripe_session: s.id }, { onConflict: 'stripe_session', ignoreDuplicates: true });
  } else if (m.kind === 'license') {
    const { data: item } = await db.from('media_items').select('id, creator_id, school_slug').eq('id', m.item_id).single();
    const { data: lic } = await db
      .from('media_licenses')
      .upsert({ item_id: m.item_id, use: m.use, buyer_org: m.buyer_org || null, price_cents: s.amount_total, creator_cents: Number(m.creator_cents), school_cents: Number(m.school_cents), stripe_session: s.id }, { onConflict: 'stripe_session', ignoreDuplicates: true })
      .select('id');
    // Pay out only the first time this session is seen.
    if (lic?.length && item) {
      const pi = await stripeGet<{ latest_charge: string }>(`/payment_intents/${s.payment_intent}`);
      const { data: creator } = await db.from('media_creators').select('stripe_account').eq('user_id', item.creator_id).maybeSingle();
      const { data: school } = await db.from('schools').select('stripe_account').eq('slug', item.school_slug).maybeSingle();
      if (creator?.stripe_account) await stripe('/transfers', { amount: Number(m.creator_cents), currency: 'usd', destination: creator.stripe_account, source_transaction: pi.latest_charge, transfer_group: `license-${item.id}` });
      if (school?.stripe_account) await stripe('/transfers', { amount: Number(m.school_cents), currency: 'usd', destination: school.stripe_account, source_transaction: pi.latest_charge, transfer_group: `license-${item.id}` });
    }
  } else if (m.kind === 'sponsor') {
    await db.from('game_sponsors').update({ status: 'paid', stripe_session: s.id }).eq('id', m.sponsor_id);
  }
  return json({ received: true });
});
