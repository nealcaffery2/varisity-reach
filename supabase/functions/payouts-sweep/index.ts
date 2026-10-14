// Pays license shares still owed: failed transfers, and creators or schools
// that connected a payout account after the sale. Run on a schedule with the
// service-role key. Each pass refreshes missing destinations, then pays.
import { admin, fail, json, serve } from '../_shared/http.ts';
import { payOutstanding } from '../_shared/payouts.ts';

serve(async (req) => {
  if (req.headers.get('Authorization') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) return fail('Service role only.', 403);
  const db = admin();
  const { data, error } = await db
    .from('license_payouts')
    .select('license_id, recipient, destination, media_licenses(item_id, media_items(creator_id, school_slug))')
    .neq('status', 'paid')
    .limit(200);
  if (error) throw error;
  type Row = { license_id: string; recipient: 'creator' | 'school'; destination: string | null; media_licenses: { media_items: { creator_id: string; school_slug: string } | null } | null };
  const ids = new Set<string>();
  for (const r of (data ?? []) as unknown as Row[]) {
    ids.add(r.license_id);
    if (r.destination) continue;
    const item = r.media_licenses?.media_items;
    if (!item) continue;
    const dest =
      r.recipient === 'creator'
        ? (await db.from('media_creator_payouts').select('stripe_account').eq('user_id', item.creator_id).maybeSingle()).data?.stripe_account
        : (await db.from('schools').select('stripe_account').eq('slug', item.school_slug).maybeSingle()).data?.stripe_account;
    if (dest) {
      const up = await db.from('license_payouts').update({ destination: dest, updated_at: new Date().toISOString() }).eq('license_id', r.license_id).eq('recipient', r.recipient);
      if (up.error) throw up.error;
    }
  }
  let paid = 0;
  let owed = 0;
  for (const id of ids) {
    const r = await payOutstanding(db, id);
    paid += r.paid;
    owed += r.owed;
  }
  return json({ licenses: ids.size, paid, owed });
});
