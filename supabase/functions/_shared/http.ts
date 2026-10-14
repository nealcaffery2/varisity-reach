// Shared plumbing for every function: CORS, JSON replies, the service-role
// client, and who is calling.
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.117.3';

export const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const fail = (message: string, status = 400) => json({ error: message }, status);

/** Service-role client. Bypasses RLS, so every function checks the caller itself. */
export const admin = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

/** The signed-in user behind the request, if any. */
export async function caller(req: Request): Promise<User | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}

export type Profile = { id: string; role: string; school_slug: string | null; verified_at: string | null; trust: number };

export async function profileOf(userId: string): Promise<Profile | null> {
  const { data } = await admin().from('profiles').select('id, role, school_slug, verified_at, trust').eq('id', userId).maybeSingle();
  return data as Profile | null;
}

export const isVerified = (p: Profile | null, roles: string[], school?: string) =>
  Boolean(p && p.verified_at && roles.includes(p.role) && (!school || p.school_slug === school));

/** Wraps a handler with CORS preflight and a catch-all. */
export const serve = (handler: (req: Request) => Promise<Response>) =>
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return fail('POST only', 405);
    try {
      return await handler(req);
    } catch (e) {
      console.error(e);
      return fail('Something went wrong on our side. Try again in a minute.', 500);
    }
  });
