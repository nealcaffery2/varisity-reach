// Pays a license's outstanding shares from the license_payouts ledger. Each
// share is its own row, paid with an idempotency key, so a retry after a
// partial failure pays only what is still owed and never pays twice.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { stripe } from './stripe.ts';

type Row = { license_id: string; recipient: 'creator' | 'school'; amount_cents: number; destination: string | null; source_charge: string | null; status: string };

export async function payOutstanding(db: SupabaseClient, licenseId: string): Promise<{ paid: number; owed: number }> {
  const { data, error } = await db.from('license_payouts').select('license_id, recipient, amount_cents, destination, source_charge, status').eq('license_id', licenseId).neq('status', 'paid');
  if (error) throw error;
  let paid = 0;
  let owed = 0;
  for (const r of (data ?? []) as Row[]) {
    if (!r.destination || !r.source_charge || r.amount_cents <= 0) {
      owed++;
      continue;
    }
    try {
      const t = await stripe<{ id: string }>(
        '/transfers',
        { amount: r.amount_cents, currency: 'usd', destination: r.destination, source_transaction: r.source_charge, transfer_group: `license-${licenseId}` },
        `license-${licenseId}-${r.recipient}`,
      );
      const up = await db.from('license_payouts').update({ status: 'paid', transfer_id: t.id, last_error: null, updated_at: new Date().toISOString() }).eq('license_id', licenseId).eq('recipient', r.recipient);
      if (up.error) throw up.error;
      paid++;
    } catch (e) {
      owed++;
      await db.from('license_payouts').update({ status: 'failed', last_error: String(e).slice(0, 300), updated_at: new Date().toISOString() }).eq('license_id', licenseId).eq('recipient', r.recipient);
    }
  }
  return { paid, owed };
}
