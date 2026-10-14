// Reads every school and newspaper feed in school_feeds and saves new sports
// stories to news_items. Run on a schedule (Supabase cron calling this
// function every 30 minutes with the service-role key) or by a verified AD
// for their own school.
import { admin, caller, fail, json, profileOf, serve } from '../_shared/http.ts';
import { parseFeed, sportsOnly } from '../_shared/feeds.ts';

type Feed = { url: string; school_slug: string; source: string; sports_only: boolean };

serve(async (req) => {
  const db = admin();
  const auth = req.headers.get('Authorization') ?? '';
  const isCron = auth === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;
  let school: string | null = null;
  if (!isCron) {
    const user = await caller(req);
    const p = user ? await profileOf(user.id) : null;
    if (!p?.verified_at || !['athletic director', 'coach', 'admin'].includes(p.role) || !p.school_slug) return fail('Verified school staff only.', 403);
    school = p.school_slug;
  }
  let q = db.from('school_feeds').select('url, school_slug, source, sports_only');
  if (school) q = q.eq('school_slug', school);
  const { data: feeds } = await q;

  let saved = 0;
  for (const f of (feeds ?? []) as Feed[]) {
    try {
      const res = await fetch(f.url, { headers: { 'User-Agent': 'VarsityReach feed reader (+https://varsityreach.org)' }, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseFeed(await res.text());
      const keep = (f.sports_only ? sportsOnly(items) : items).slice(0, 25);
      if (keep.length) {
        const { error } = await db.from('news_items').upsert(
          keep.map((i) => ({ url: i.url, school_slug: f.school_slug, source: f.source, title: i.title, summary: i.summary, image: i.image, published: i.published })),
          { onConflict: 'url', ignoreDuplicates: true },
        );
        if (error) throw error;
        saved += keep.length;
      }
      await db.from('school_feeds').update({ last_fetched: new Date().toISOString(), last_error: null }).eq('url', f.url);
    } catch (e) {
      await db.from('school_feeds').update({ last_fetched: new Date().toISOString(), last_error: String(e).slice(0, 300) }).eq('url', f.url);
    }
  }
  return json({ feeds: feeds?.length ?? 0, saved });
});
