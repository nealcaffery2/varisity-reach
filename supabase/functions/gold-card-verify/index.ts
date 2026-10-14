// A merchant's scan. The signing key never leaves the server.
import { fail, json, serve } from '../_shared/http.ts';
import { verify } from '../_shared/gold-card.ts';

serve(async (req) => {
  const b = await req.json().catch(() => null);
  if (typeof b?.token !== 'string' || b.token.length > 2000) return fail('Send the card code.');
  return json(await verify(b.token, Deno.env.get('GOLD_CARD_SECRET')!));
});
