// Opens Stripe Checkout for a gift, a gold card, a photo license or a game
// sponsorship. Gifts, gold cards and sponsorships are destination charges to
// the school's (or booster club's) connected account, so funds land with them;
// the platform keeps PLATFORM_FEE_PCT (0 by default). Photo licenses are
// collected by the platform and split by transfer in the webhook.
import { admin, fail, json, serve } from '../_shared/http.ts';
import { stripe } from '../_shared/stripe.ts';
import { LICENSES, canLicense, split, type LicenseUse } from '../_shared/media.ts';

const FEE_PCT = Number(Deno.env.get('PLATFORM_FEE_PCT') ?? '0');
const GOLD_PRICE_CENTS = Number(Deno.env.get('GOLD_CARD_PRICE_CENTS') ?? '2000');

serve(async (req) => {
  const b = await req.json().catch(() => null);
  // Stripe sends the buyer back here, so it must be this site and nothing else.
  const origin = Deno.env.get('SITE_ORIGIN');
  if (!origin) return fail('Checkout is not configured yet.', 503);
  let returnUrl: string;
  try {
    const u = new URL(String(b?.returnUrl ?? ''));
    if (u.origin !== new URL(origin).origin) return fail('Unknown return address.');
    returnUrl = `${u.origin}${u.pathname}`;
  } catch {
    return fail('Unknown return address.');
  }
  const db = admin();

  if (b?.kind === 'donation') {
    const cents = Math.round(Number(b.amountCents));
    if (!Number.isInteger(cents) || cents < 500 || cents > 1_000_000) return fail('Gifts run from $5 to $10,000.');
    const { data: c } = await db.from('campaigns').select('id, title, status, school_slug, schools(stripe_account, payee_name)').eq('id', String(b.campaignId)).maybeSingle();
    if (!c) return fail('That fundraiser is a sample or no longer open.', 404);
    // deno-lint-ignore no-explicit-any
    const school = (c as any).schools as { stripe_account: string | null; payee_name: string | null };
    if (c.status !== 'live' || !school?.stripe_account) return fail('This fundraiser is not taking gifts yet.', 409);
    const session = await stripe<{ url: string }>('/checkout/sessions', {
      mode: 'payment',
      success_url: `${returnUrl}?thanks=1`,
      cancel_url: returnUrl,
      submit_type: 'donate',
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: cents, product_data: { name: c.title, description: `Paid to ${school.payee_name ?? 'the school'}` } } } },
      payment_intent_data: { transfer_data: { destination: school.stripe_account }, application_fee_amount: Math.round((cents * FEE_PCT) / 100) || undefined },
      metadata: { kind: 'donation', campaign_id: c.id, name: String(b.name ?? '').slice(0, 80), anonymous: b.anonymous ? '1' : '0', message: String(b.message ?? '').slice(0, 120), squad: String(b.squad ?? '').slice(0, 40) },
    });
    return json({ url: session.url });
  }

  if (b?.kind === 'gold-card') {
    const { data: s } = await db.from('schools').select('slug, name, stripe_account, payee_name').eq('slug', String(b.school)).maybeSingle();
    if (!s?.stripe_account) return fail('Gold cards are not on sale for that school yet.', 409);
    const session = await stripe<{ url: string }>('/checkout/sessions', {
      mode: 'payment',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      customer_email: String(b.email ?? ''),
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: GOLD_PRICE_CENTS, product_data: { name: `${s.name} gold card` } } } },
      payment_intent_data: { transfer_data: { destination: s.stripe_account }, application_fee_amount: Math.round((GOLD_PRICE_CENTS * FEE_PCT) / 100) || undefined },
      metadata: { kind: 'gold-card', school: s.slug, holder: String(b.holder ?? '').slice(0, 60), email: String(b.email ?? '').slice(0, 120) },
    });
    return json({ url: session.url });
  }

  if (b?.kind === 'license') {
    // Separate charge and transfers: the platform collects, then the webhook
    // pays the photographer and the school their shares.
    const use = String(b.use) as LicenseUse;
    if (!Object.hasOwn(LICENSES, use)) return fail('Pick how you will use the photo.');
    const { data: item } = await db.from('media_items').select('id, kind, school_slug, caption, credit_name, minors_shown, release_on_file, status, creator_id').eq('id', String(b.itemId)).maybeSingle();
    if (!item || item.status !== 'approved') return fail('That photo is not for sale.', 404);
    if (item.kind !== 'photo') return fail('Video licenses are not on sale yet. Photos only for now.', 409);
    // Both shares need somewhere to go before we take the buyer's money.
    const { data: payout } = await db.from('media_creator_payouts').select('stripe_account').eq('user_id', item.creator_id).maybeSingle();
    const { data: school } = await db.from('schools').select('stripe_account').eq('slug', item.school_slug).maybeSingle();
    if (!payout?.stripe_account || !school?.stripe_account) return fail('This photo is not on sale until the photographer and the school finish payout setup.', 409);
    const ok = canLicense(use, { minorsShown: item.minors_shown, releaseOnFile: item.release_on_file });
    if (!ok.ok) return fail(ok.reason, 409);
    const price = LICENSES[use].priceCents;
    const s = split(price);
    const session = await stripe<{ url: string }>('/checkout/sessions', {
      mode: 'payment',
      success_url: `${returnUrl}?licensed=${item.id}`,
      cancel_url: returnUrl,
      customer_email: b.email ? String(b.email) : undefined,
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: price, product_data: { name: `${LICENSES[use].label} license: ${item.caption ?? 'photo'}`, description: `Photo by ${item.credit_name}. ${LICENSES[use].terms}` } } } },
      payment_intent_data: { transfer_group: `license-${item.id}` },
      metadata: { kind: 'license', item_id: item.id, use, buyer_org: String(b.org ?? '').slice(0, 80), creator_cents: String(s.creator), school_cents: String(s.school) },
    });
    return json({ url: session.url });
  }

  if (b?.kind === 'sponsor') {
    const cents = Math.round(Number(b.amountCents));
    if (!Number.isInteger(cents) || cents < 2500 || cents > 500_000) return fail('Game sponsorships run from $25 to $5,000.');
    // The game, the school and the want must belong together.
    const { data: game } = await db.from('games').select('id, home_school, away_school, status').eq('id', String(b.gameId)).maybeSingle();
    if (!game) return fail('That game is not on the schedule.', 404);
    if (game.status === 'final') return fail('That game is over.', 409);
    const slug = String(b.school);
    if (slug !== game.home_school && slug !== game.away_school) return fail('That school is not playing in this game.', 409);
    const { data: want } = await db.from('school_wants').select('id, school_slug, title, status').eq('id', String(b.wantId ?? '')).maybeSingle();
    if (!want || want.school_slug !== slug || want.status !== 'open') return fail('Pick an open item from this school’s wants board.', 409);
    const { data: s } = await db.from('schools').select('slug, name, stripe_account, payee_name').eq('slug', slug).maybeSingle();
    if (!s?.stripe_account) return fail('This school is not set up to take sponsorships yet.', 409);
    const pledge = want.title;
    if (!pledge) return fail('Say what the school will buy with it.');
    const { data: row, error } = await db.from('game_sponsors').insert({ game_id: game.id, school_slug: s.slug, sponsor_name: String(b.sponsor ?? '').slice(0, 80), cents, pledge, want_id: want.id }).select('id').single();
    if (error) throw error;
    const session = await stripe<{ url: string }>('/checkout/sessions', {
      mode: 'payment',
      success_url: `${returnUrl}?sponsored=1`,
      cancel_url: returnUrl,
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: cents, product_data: { name: `Game sponsor: ${s.name}`, description: `Paid to ${s.payee_name ?? 'the school'} for: ${pledge}` } } } },
      payment_intent_data: { transfer_data: { destination: s.stripe_account }, application_fee_amount: Math.round((cents * FEE_PCT) / 100) || undefined },
      metadata: { kind: 'sponsor', sponsor_id: row.id },
    });
    return json({ url: session.url });
  }

  return fail('Unknown checkout.');
});
