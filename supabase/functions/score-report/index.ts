// A score from the stands. Sets the reporter's role and trust server-side so
// nobody can claim to be a coach, refuses reports outside the game window,
// rate-limits each reporter, and lets only a verified coach or official scorer
// of either team lock the score. When a lock is the final, every reporter's
// trust moves toward how close they were (lib/consensus.ts updateTrust).
import { admin, caller, fail, json, profileOf, serve } from '../_shared/http.ts';
import { gameWindow, updateTrust, type Report } from '../_shared/consensus.ts';

const ROLE_MAP: Record<string, Report['role']> = { coach: 'coach', 'athletic director': 'coach', 'official scorer': 'official', reporter: 'reporter', staff: 'staff', fan: 'fan' };

serve(async (req) => {
  const body = await req.json().catch(() => null);
  const gameId = String(body?.gameId ?? '');
  const home = Number(body?.home);
  const away = Number(body?.away);
  if (!gameId || !Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 300 || away > 300) return fail('Send gameId and two whole-number scores.');

  const db = admin();
  const { data: game } = await db.from('games').select('*').eq('id', gameId).maybeSingle();
  if (!game) return fail('That game is not on the schedule.', 404);
  const now = Date.now();
  const win = gameWindow(Date.parse(game.kickoff));
  if (now < win.start || now > win.end) return fail('Reports open 30 minutes before the start and close 4 hours after the game.');

  const user = await caller(req);
  const profile = user ? await profileOf(user.id) : null;
  // Signed-out fans are told apart by a salted hash of their address, never the address itself (reports are public).
  const reporterId = user?.id ?? `anon:${await hashIp(req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown', gameId)}`;
  const verified = Boolean(profile?.verified_at);
  const ownTeam = profile?.school_slug && [game.home_school, game.away_school].includes(profile.school_slug);
  let role: Report['role'] = user ? (verified ? ROLE_MAP[profile!.role] ?? 'fan' : 'fan') : 'anonymous';
  // A verified coach of some other school is just a well-trusted fan here.
  if ((role === 'coach' || role === 'official') && !ownTeam) role = 'fan';
  const trust = Number(profile?.trust ?? (user ? 0.5 : 0.3));

  // One report per reporter every 30 seconds.
  const { data: recent } = await db.from('score_reports').select('at').eq('game_id', gameId).eq('reporter_id', reporterId).order('at', { ascending: false }).limit(1);
  if (recent?.[0] && now - Date.parse(recent[0].at) < 30_000) return fail('Give it 30 seconds between reports.', 429);

  const lock = Boolean(body?.lock) && (role === 'coach' || role === 'official');
  const final = lock && Boolean(body?.final);
  const photoPath = typeof body?.photoPath === 'string' && body.photoPath.startsWith(`${gameId}/`) ? body.photoPath : null;

  const { data: row, error } = await db
    .from('score_reports')
    .insert({ game_id: gameId, reporter_id: reporterId, role, trust, home, away, period: body?.period ? String(body.period).slice(0, 24) : null, photo_path: photoPath, lock, final })
    .select('*')
    .single();
  if (error) throw error;

  if (final) {
    await db.from('games').update({ status: 'final' }).eq('id', gameId);
    const { data: all } = await db.from('score_reports').select('*').eq('game_id', gameId);
    const reports: Report[] = (all ?? []).map((r) => ({ id: String(r.id), reporter: r.reporter_id, role: r.role, trust: Number(r.trust), home: r.home, away: r.away, at: Date.parse(r.at) }));
    for (const [who, t] of updateTrust(reports.filter((r) => !r.reporter.startsWith('anon:')), { home, away })) {
      await db.from('profiles').update({ trust: t }).eq('id', who);
    }
  }
  return json({ ...row, reporter: row.reporter_id });
});

async function hashIp(ip: string, gameId: string) {
  const salt = Deno.env.get('REPORTER_SALT') ?? 'set-REPORTER_SALT';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${gameId}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}
