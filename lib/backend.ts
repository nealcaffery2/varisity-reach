'use client';

// One door to the backend. With NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY set, everything reads and writes Supabase
// (tables and functions in supabase/). Without them the site runs in demo
// mode: writes stay in this browser so every flow can be tried end to end,
// and nothing pretends to have reached a server.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Report } from './consensus';
import type { Stream } from './streams';
import type { ImportedAthlete } from './roster';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isLive = Boolean(URL_ && KEY);
let client: SupabaseClient | null = null;
export const supabase = (): SupabaseClient | null => {
  if (!isLive) return null;
  client ??= createClient(URL_!, KEY!);
  return client;
};

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

/** A stable id for this device, used as the reporter id in demo mode. */
export function deviceId(): string {
  let id = read<string>('vr-device', '');
  if (!id) {
    id = `dev-${Math.random().toString(36).slice(2, 10)}`;
    write('vr-device', id);
  }
  return id;
}

// ---- sign in ----------------------------------------------------------------------------------

/** Email a one-tap sign-in link. No passwords to forget. */
export async function sendSignInLink(email: string): Promise<{ demo?: true }> {
  const sb = supabase();
  if (!sb) return { demo: true };
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw new Error(error.message);
  return {};
}

// ---- score reports ----------------------------------------------------------------------

export async function listReports(gameId: string): Promise<Report[]> {
  const sb = supabase();
  if (!sb) return read<Report[]>(`vr-reports-${gameId}`, []);
  const { data, error } = await sb.from('score_reports').select('*').eq('game_id', gameId).order('at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export type NewReport = Pick<Report, 'home' | 'away' | 'period' | 'photo'> & { photoFile?: File; lock?: boolean; final?: boolean };

/** Send a report. Live mode goes through the score-report function, which sets role and trust server-side. */
export async function submitReport(gameId: string, r: NewReport): Promise<Report> {
  const sb = supabase();
  if (!sb) {
    const rep: Report = { id: `local-${Date.now()}`, reporter: deviceId(), role: 'fan', trust: 0.5, home: r.home, away: r.away, period: r.period, photo: Boolean(r.photoFile), at: Date.now() };
    const all = [...read<Report[]>(`vr-reports-${gameId}`, []), rep];
    write(`vr-reports-${gameId}`, all);
    return rep;
  }
  let photoPath: string | undefined;
  if (r.photoFile) {
    photoPath = `${gameId}/${crypto.randomUUID()}-${r.photoFile.name.replace(/[^\w.-]/g, '')}`;
    const up = await sb.storage.from('score-photos').upload(photoPath, r.photoFile, { contentType: r.photoFile.type });
    if (up.error) throw new Error(`Photo upload failed: ${up.error.message}`);
  }
  const { data, error } = await sb.functions.invoke('score-report', { body: { gameId, home: r.home, away: r.away, period: r.period, photoPath, lock: r.lock, final: r.final } });
  if (error) throw new Error(error.message);
  return fromRow(data);
}

/** New reports for a game as they arrive. Returns an unsubscribe function. */
export function watchReports(gameId: string, onReport: (r: Report) => void): () => void {
  const sb = supabase();
  if (!sb) {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== `vr-reports-${gameId}` || !e.newValue) return;
      const all = JSON.parse(e.newValue) as Report[];
      const last = all[all.length - 1];
      if (last) onReport(last);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }
  const ch = sb
    .channel(`reports-${gameId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'score_reports', filter: `game_id=eq.${gameId}` }, (p) => onReport(fromRow(p.new)))
    .subscribe();
  return () => { sb.removeChannel(ch); };
}

function fromRow(row: any): Report {
  return {
    id: String(row.id),
    reporter: String(row.reporter_id ?? row.reporter),
    role: row.role,
    trust: Number(row.trust),
    home: Number(row.home),
    away: Number(row.away),
    period: row.period ?? undefined,
    at: typeof row.at === 'number' ? row.at : Date.parse(row.at),
    photo: Boolean(row.photo_path ?? row.photo),
    photoVerified: Boolean(row.photo_verified ?? row.photoVerified),
    lock: Boolean(row.lock),
    final: Boolean(row.final),
  };
}

// ---- paired streams ----------------------------------------------------------------------


export async function listStreams(gameId: string): Promise<Stream[]> {
  const sb = supabase();
  if (!sb) return read<Stream[]>(`vr-streams-${gameId}`, []);
  const { data, error } = await sb.from('game_streams').select('platform,url,by_name,verified').eq('game_id', gameId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ platform: r.platform, url: r.url, by: r.by_name, verified: r.verified }));
}

export async function pairStream(gameId: string, s: Stream): Promise<void> {
  const sb = supabase();
  if (!sb) {
    write(`vr-streams-${gameId}`, [...read<Stream[]>(`vr-streams-${gameId}`, []), s]);
    return;
  }
  const { error } = await sb.from('game_streams').insert({ game_id: gameId, platform: s.platform, url: s.url, by_name: s.by });
  if (error) throw new Error(error.message);
}

// ---- underdog of the week ----------------------------------------------------------------

/** One vote per person per week. Live mode enforces it in the database (unique week + voter). */
export async function castVote(week: string, athlete: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const sb = supabase();
  if (!sb) {
    if (read<string>(`vr-vote-${week}`, '')) return { ok: false, reason: 'You already voted this week.' };
    write(`vr-vote-${week}`, athlete);
    return { ok: true };
  }
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, reason: 'Sign in to vote, so every person counts once.' };
  const { error } = await sb.from('underdog_votes').insert({ week, athlete_slug: athlete, voter_id: auth.user.id });
  if (error) return { ok: false, reason: error.code === '23505' ? 'You already voted this week.' : error.message };
  return { ok: true };
}

export const myVote = (week: string) => read<string>(`vr-vote-${week}`, '');

// ---- donations ----------------------------------------------------------------------------

export type Pledge = { campaignId: string; amountCents: number; name: string; message?: string; squad?: string; anonymous: boolean };

/** Live: returns a Stripe Checkout URL to send the donor to. Demo: records the gift in this browser. */
export async function startDonation(p: Pledge): Promise<{ checkoutUrl?: string; demo?: true }> {
  const sb = supabase();
  if (!sb) {
    const key = `vr-gifts-${p.campaignId}`;
    write(key, [...read<Pledge[]>(key, []), p]);
    return { demo: true };
  }
  const { data, error } = await sb.functions.invoke('checkout', { body: { kind: 'donation', ...p, returnUrl: window.location.href.split('?')[0] } });
  if (error) throw new Error(error.message);
  return { checkoutUrl: data.url };
}

export const demoGifts = (campaignId: string) => read<Pledge[]>(`vr-gifts-${campaignId}`, []);

// ---- coach requests ------------------------------------------------------------------------

export type NeedDraft = { school: string; title: string; kind: string; goalCents: number; need: string; endsOn: string; payee: 'school' | 'booster'; match?: { by: string; ratio: number; upToCents: number } };

/** A coach posts a need. It waits for the athletic director's approval before it can take money. */
export async function postNeed(d: NeedDraft): Promise<{ id: string; demo?: true }> {
  const sb = supabase();
  if (!sb) {
    const id = `draft-${Date.now()}`;
    write('vr-needs', [...read<(NeedDraft & { id: string })[]>('vr-needs', []), { ...d, id }]);
    return { id, demo: true };
  }
  const { data, error } = await sb.from('campaigns').insert({
    school_slug: d.school, title: d.title, kind: d.kind, goal_cents: d.goalCents, need: d.need, ends_on: d.endsOn, payee_kind: d.payee,
    match_by: d.match?.by, match_ratio: d.match?.ratio, match_up_to_cents: d.match?.upToCents, status: 'pending_approval',
  }).select('id').single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export const draftNeeds = () => read<(NeedDraft & { id: string })[]>('vr-needs', []);

// ---- verification ---------------------------------------------------------------------------

export type VerifyRequest = { role: 'coach' | 'athletic director' | 'reporter' | 'official scorer'; name: string; email: string; school: string; outlet?: string; proofUrl?: string; note?: string };

export async function requestVerification(r: VerifyRequest): Promise<{ demo?: true }> {
  const sb = supabase();
  if (!sb) {
    write('vr-verify-request', { ...r, at: new Date().toISOString() });
    return { demo: true };
  }
  const { error } = await sb.from('verification_requests').insert({ role: r.role, name: r.name, email: r.email, school_slug: r.school, outlet: r.outlet, proof_url: r.proofUrl, note: r.note });
  if (error) throw new Error(error.message);
  return {};
}

// ---- gold cards ----------------------------------------------------------------------------

export type CardPurchase = { school: string; holder: string; email: string };

export async function buyGoldCard(p: CardPurchase): Promise<{ checkoutUrl?: string; token?: string; demo?: true }> {
  const sb = supabase();
  if (!sb) {
    const { demoSign } = await import('./gold-card');
    const token = await demoSign({ school: p.school, holder: p.holder, season: '2026-27', exp: '2027-07-31', n: Math.random().toString(36).slice(2, 8) });
    write('vr-gold-card', token);
    return { token, demo: true };
  }
  const { data, error } = await sb.functions.invoke('checkout', { body: { kind: 'gold-card', ...p, returnUrl: `${window.location.origin}${window.location.pathname}` } });
  if (error) throw new Error(error.message);
  return { checkoutUrl: data.url };
}

export const savedGoldCard = () => read<string>('vr-gold-card', '');

/** After Stripe sends the buyer back: trade the session id for the signed card. Retries while the webhook lands. */
export async function claimGoldCard(sessionId: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  for (let i = 0; i < 6; i++) {
    const { data, error } = await sb.functions.invoke('gold-card-claim', { body: { sessionId } });
    if (!error && data?.token) {
      write('vr-gold-card', data.token);
      return data.token as string;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export async function verifyGoldCard(token: string) {
  const sb = supabase();
  const { demoVerify } = await import('./gold-card');
  if (!sb) return demoVerify(token);
  const { data, error } = await sb.functions.invoke('gold-card-verify', { body: { token } });
  if (error) return { ok: false as const, reason: error.message };
  return data as Awaited<ReturnType<typeof demoVerify>>;
}

// ---- roster import ------------------------------------------------------------------------


/** Save approved roster rows. Live: the publish-roster function checks the caller coaches this team. */
export async function publishRoster(school: string, sport: string, rows: ImportedAthlete[]): Promise<{ saved: number; demo?: true }> {
  const sb = supabase();
  if (!sb) {
    write(`vr-roster-${school}-${sport}`, { at: new Date().toISOString(), rows });
    return { saved: rows.length, demo: true };
  }
  const { data, error } = await sb.functions.invoke('publish-roster', { body: { school, sport, rows } });
  if (error) throw new Error(error.message);
  return { saved: data.saved };
}

/** Send a document or photo to the roster-import function. Live mode only. */
export async function extractRoster(file: { name: string; mediaType: string; base64?: string; text?: string }, sport: string) {
  const sb = supabase();
  if (!sb) throw new Error('DEMO');
  const { data, error } = await sb.functions.invoke('roster-import', { body: { file, sport } });
  if (error) throw new Error(error.message);
  return data as { athletes: unknown[]; notes?: string };
}
