// A verified college coach writes to an athlete. The message is checked
// against the NCAA contact calendar (held until the date if early), saved,
// and emailed to the athlete with every linked parent copied, or queued as a
// printed letter mailed to the address the family shared. The coach never
// receives the athlete's email or street address from this function.
import { admin, caller, fail, json, profileOf, serve } from '../_shared/http.ts';
import { canContact, type Division } from '../_shared/recruiting-rules.ts';

const DIVISIONS: Division[] = ['D1', 'D2', 'D3', 'NAIA', 'JUCO'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

serve(async (req) => {
  const user = await caller(req);
  if (!user) return fail('Sign in as a verified recruiter.', 401);
  const p = await profileOf(user.id);
  if (!p?.verified_at || p.role !== 'recruiter') return fail('Only verified college coaches can write to athletes.', 403);

  const b = await req.json().catch(() => null);
  const slug = String(b?.athlete ?? '');
  const channel = b?.channel === 'mail' ? 'mail' : 'email';
  const subject = String(b?.subject ?? '').trim().slice(0, 140);
  const body = String(b?.body ?? '').trim().slice(0, 5000);
  const division = DIVISIONS.includes(b?.division) ? (b.division as Division) : 'D1';
  if (!slug || !subject || !body) return fail('Add a subject and a message.');

  const db = admin();
  const { data: athlete } = await db.from('athletes').select('slug, first, last, grad_year, sports, media_release').eq('slug', slug).maybeSingle();
  if (!athlete?.media_release) return fail('This profile is not open to contact.', 404);

  // Rate limit: 20 messages a day per recruiter.
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from('recruiter_messages').select('id', { count: 'exact', head: true }).eq('recruiter_id', user.id).gte('created_at', since);
  if ((count ?? 0) >= 20) return fail('Twenty messages a day is the limit. Try again tomorrow.', 429);

  const check = canContact({ division, sport: b?.sport ?? athlete.sports?.[0] ?? '', gradYear: athlete.grad_year, now: new Date(), minor: true });
  const { data: msg, error } = await db
    .from('recruiter_messages')
    .insert({ recruiter_id: user.id, athlete_slug: slug, channel, subject, body, status: check.ok ? 'queued' : 'held', hold_reason: check.ok ? null : check.reason })
    .select('id')
    .single();
  if (error) throw error;

  const { data: who } = await db.from('profiles').select('display_name, outlet').eq('id', user.id).single();
  await db.rpc('notify_family', { slug, k: 'recruiter_message', b: { from: who?.display_name, school: who?.outlet, subject, channel, held: !check.ok } });
  if (!check.ok) return json({ id: msg.id, held: check.opens });

  if (channel === 'mail') {
    const { count: addr } = await db.from('private_addresses').select('athlete_slug', { count: 'exact', head: true }).eq('athlete_slug', slug).not('parent_consent_at', 'is', null);
    if (!addr) {
      await db.from('recruiter_messages').update({ status: 'failed', hold_reason: 'No mailing address on file' }).eq('id', msg.id);
      return fail('This family has not added a mailing address yet. Send an email instead.', 409);
    }
    // Printing and posting is done by staff from the queued list for now.
    return json({ id: msg.id, queued: true });
  }

  // Email: the athlete and every linked parent, through Resend.
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MAIL_FROM') ?? 'Varsity Reach <recruiting@varsityreach.org>';
  const { data: links } = await db.from('athlete_links').select('user_id').eq('athlete_slug', slug);
  const emails: string[] = [];
  for (const l of links ?? []) {
    const { data } = await db.auth.admin.getUserById(l.user_id);
    if (data.user?.email) emails.push(data.user.email);
  }
  if (!key || !emails.length) {
    await db.from('recruiter_messages').update({ status: 'failed', hold_reason: key ? 'No linked family email' : 'Email not configured' }).eq('id', msg.id);
    return fail(emails.length ? 'Email is not set up on this site yet.' : 'This athlete has no linked account to email. Try a letter.', 409);
  }
  const html = `<p><strong>${esc(who?.display_name ?? 'A college coach')}</strong>${who?.outlet ? `, ${esc(who.outlet)}` : ''}, verified on Varsity Reach, wrote to ${esc(athlete.first)}:</p><blockquote>${esc(body).replace(/\n/g, '<br>')}</blockquote><p>Reply to this email to answer. Parents on the account get a copy of every message.</p>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: emails, reply_to: user.email, subject: `${subject} (from ${who?.outlet ?? 'a college coach'})`, html }),
  });
  await db.from('recruiter_messages').update({ status: res.ok ? 'sent' : 'failed', hold_reason: res.ok ? null : `Resend ${res.status}` }).eq('id', msg.id);
  if (!res.ok) return fail('The email did not go out. Try again in a few minutes.', 502);
  return json({ id: msg.id, sent: emails.length });
});
