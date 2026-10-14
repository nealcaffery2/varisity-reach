// Saves the rows a coach approved. Only a verified coach or athletic director
// of that school can publish, every row is stamped with who verified it, and
// new athletes stay hidden until the family's media release is recorded.
import { admin, caller, fail, isVerified, json, profileOf, serve } from '../_shared/http.ts';

type Row = { first: string; last: string; jersey?: number; position?: string; gradYear?: number; heightIn?: number; weightLb?: number; gpa?: number; measurables?: Record<string, string>; stats?: Record<string, number> };

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

serve(async (req) => {
  const user = await caller(req);
  if (!user) return fail('Sign in to publish.', 401);
  const body = await req.json().catch(() => null);
  const school = String(body?.school ?? '');
  const sport = String(body?.sport ?? '');
  const rows: Row[] = Array.isArray(body?.rows) ? body.rows.slice(0, 200) : [];
  const profile = await profileOf(user.id);
  if (!isVerified(profile, ['coach', 'athletic director'], school)) return fail('Only a verified coach at this school can publish its roster.', 403);
  if (!rows.length) return fail('Nothing to publish.');

  const db = admin();
  const season = (() => {
    const d = new Date();
    const end = d.getUTCMonth() >= 6 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
    return `${end - 1}-${String(end).slice(2)}`;
  })();
  let saved = 0;
  for (const r of rows) {
    if (!r.first?.trim() || !r.last?.trim()) continue;
    const slug = `${slugify(`${r.first} ${r.last}`)}-${school}`;
    const { data: existing } = await db.from('athletes').select('*').eq('slug', slug).maybeSingle();
    const seasons = (existing?.seasons ?? []) as { year: string; level: string; stats: Record<string, number> }[];
    if (r.stats && Object.keys(r.stats).length) {
      const cur = seasons.find((s) => s.year === season);
      if (cur) cur.stats = { ...cur.stats, ...r.stats };
      else seasons.unshift({ year: season, level: 'Varsity', stats: r.stats });
    }
    const measurables = [...((existing?.measurables ?? []) as { label: string; value: string }[]).filter((m) => !r.measurables?.[m.label]), ...Object.entries(r.measurables ?? {}).map(([label, value]) => ({ label, value }))];
    const { error } = await db.from('athletes').upsert({
      slug,
      school_slug: school,
      first: r.first.trim(),
      last: r.last.trim(),
      sports: [...new Set([...(existing?.sports ?? []), sport])],
      jersey: r.jersey ?? existing?.jersey,
      position: r.position ?? existing?.position,
      grad_year: r.gradYear ?? existing?.grad_year,
      height_in: r.heightIn ?? existing?.height_in,
      weight_lb: r.weightLb ?? existing?.weight_lb,
      gpa: r.gpa ?? existing?.gpa,
      measurables,
      seasons,
      media_release: existing?.media_release ?? false,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    saved++;
  }
  await db.from('roster_imports').insert({ school_slug: school, sport, coach_id: user.id, source: String(body?.source ?? ''), rows });
  return json({ saved });
});
