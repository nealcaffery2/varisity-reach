// After checkout, the buyer's browser trades the Checkout Session id for the
// signed card. The webhook may land a second after the redirect, so the page
// retries on 202.
import { admin, fail, json, serve } from '../_shared/http.ts';

serve(async (req) => {
  const b = await req.json().catch(() => null);
  const id = String(b?.sessionId ?? '');
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(id)) return fail('Unknown checkout.');
  const { data } = await admin().from('gold_cards').select('token').eq('stripe_session', id).maybeSingle();
  return data ? json({ token: data.token }) : json({ pending: true }, 202);
});
