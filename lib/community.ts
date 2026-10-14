'use client';

// Backend calls for the conference hub, recruiters, reels, families,
// boosters and school pages. Same rule as lib/backend.ts: live mode talks to
// Supabase (tables in supabase/migrations/002_community.sql), demo mode keeps
// everything in this browser and says so.

import { localRead as read, localWrite as write, supabase, userId } from './backend';
import type { Picks } from './bracket';
import type { Squad } from './fantasy';
import type { Engagement } from './recommend';
import { canSendTape, type Needs, type Tape } from './scout';

type Result = { ok: true; demo?: true } | { ok: false; reason: string };
const SIGN_IN = 'Sign in first, so it saves to your account.';

async function signedIn() {
  const sb = supabase();
  if (!sb) return { sb: null, uid: null } as const;
  return { sb, uid: await userId() } as const;
}

// ---- conference -------------------------------------------------------------------------------

export const myPicks = (conf: string) => read<Record<string, string>>(`vr-picks-${conf}`, {});

export async function savePick(conf: string, gameKey: string, team: string): Promise<Result> {
  write(`vr-picks-${conf}`, { ...myPicks(conf), [gameKey]: team });
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('conference_picks').upsert({ user_id: uid, conference: conf, game_key: gameKey, team });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

/** Fan counts per game. Demo mode has no crowd, so it returns nothing rather than a made-up split. */
export async function pickCounts(conf: string): Promise<Record<string, Record<string, number>>> {
  const sb = supabase();
  if (!sb) return {};
  const { data } = await sb.rpc('pick_counts', { conf });
  const out: Record<string, Record<string, number>> = {};
  for (const r of (data ?? []) as { game_key: string; team: string; n: number }[]) (out[r.game_key] ??= {})[r.team] = Number(r.n);
  return out;
}

export const myBracket = (conf: string) => read<Picks>(`vr-bracket-${conf}`, {});
export async function saveBracket(conf: string, picks: Picks): Promise<Result> {
  write(`vr-bracket-${conf}`, picks);
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('fan_brackets').upsert({ user_id: uid, conference: conf, picks, updated_at: new Date().toISOString() });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export const mySquad = (conf: string) => read<{ name: string; squad: Squad }>(`vr-squad-${conf}`, { name: '', squad: {} });
export async function saveSquad(conf: string, name: string, squad: Squad): Promise<Result> {
  write(`vr-squad-${conf}`, { name, squad });
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('fantasy_squads').upsert({ user_id: uid, conference: conf, name: name || 'My squad', squad, updated_at: new Date().toISOString() });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- viewer -----------------------------------------------------------------------------------

export type Viewer = { role: 'guest' | 'fan' | 'recruiter' | 'parent' | 'athlete' | 'coach' | 'athletic director' | 'reporter'; verified: boolean; name?: string; demo?: true };

/** Demo mode lets a visitor try each role from a switcher; live mode reads the verified profile. */
export async function viewer(): Promise<Viewer> {
  const sb = supabase();
  if (!sb) return { ...read<Viewer>('vr-demo-viewer', { role: 'guest', verified: false }), demo: true };
  const uid = await userId();
  if (!uid) return { role: 'guest', verified: false };
  const { data } = await sb.from('profiles').select('role, verified_at, display_name').eq('id', uid).maybeSingle();
  return { role: (data?.role ?? 'fan') as Viewer['role'], verified: Boolean(data?.verified_at), name: data?.display_name ?? undefined };
}
export const setDemoViewer = (v: Omit<Viewer, 'demo'>) => write('vr-demo-viewer', v);

// ---- recruiters -------------------------------------------------------------------------------

export const myStars = () => read<string[]>('vr-stars', []);

/** Star an athlete. The athlete and linked parents get a notification naming the recruiter and school. */
export async function toggleStar(slug: string): Promise<Result & { starred?: boolean }> {
  const now = myStars();
  const on = !now.includes(slug);
  const { sb, uid } = await signedIn();
  if (sb) {
    if (!uid) return { ok: false, reason: 'Sign in as a verified recruiter to star athletes.' };
    const { error } = on
      ? await sb.from('recruiter_stars').insert({ recruiter_id: uid, athlete_slug: slug })
      : await sb.from('recruiter_stars').delete().eq('recruiter_id', uid).eq('athlete_slug', slug);
    if (error) return { ok: false, reason: error.code === '42501' ? 'Only verified recruiters can star athletes.' : error.message };
  }
  write('vr-stars', on ? [...now, slug] : now.filter((s) => s !== slug));
  if (!sb && on) pushDemoNotice(slug, { kind: 'recruiter_star', at: new Date().toISOString() });
  return { ok: true, starred: on, ...(sb ? {} : { demo: true as const }) };
}

export type Notice = { kind: 'recruiter_star' | 'address_viewed' | 'recruiter_feedback' | 'recruiter_message'; at: string; from?: string; text?: string };
const pushDemoNotice = (slug: string, n: Notice) => write(`vr-notices-${slug}`, [n, ...read<Notice[]>(`vr-notices-${slug}`, [])].slice(0, 30));
export const demoNotices = (slug: string) => read<Notice[]>(`vr-notices-${slug}`, []);

export type Outreach = { athlete: string; channel: 'email' | 'mail'; subject: string; body: string; division: string; sport: string };

/** Email or a mailed letter, sent by the recruiter-contact function. It holds messages before the contact date and copies the family. */
export async function contactAthlete(o: Outreach): Promise<Result & { held?: string }> {
  const sb = supabase();
  if (!sb) {
    write('vr-outreach', [...read<Outreach[]>('vr-outreach', []), o]);
    pushDemoNotice(o.athlete, { kind: 'recruiter_message', at: new Date().toISOString(), text: o.subject });
    return { ok: true, demo: true };
  }
  const { data, error } = await sb.functions.invoke('recruiter-contact', { body: o });
  if (error) return { ok: false, reason: error.message };
  return data.held ? { ok: true, held: data.held } : { ok: true };
}

export type Address = { nameOnMail: string; street: string; city: string; state: string; zip: string; shareWithRecruiters: boolean; parentConsent: boolean };

export const demoAddress = (slug: string) => read<Address | null>(`vr-address-${slug}`, null);
export async function saveAddress(slug: string, a: Address): Promise<Result> {
  if (a.shareWithRecruiters && !a.parentConsent) return { ok: false, reason: 'A parent or guardian has to agree before recruiters can see an address.' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-address-${slug}`, a);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('private_addresses').upsert({
    athlete_slug: slug, name_on_mail: a.nameOnMail, street: a.street, city: a.city, state: a.state, zip: a.zip,
    share_with_recruiters: a.shareWithRecruiters, parent_consent_by: a.parentConsent ? uid : null, parent_consent_at: a.parentConsent ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, reason: error.code === '42501' ? 'Only the athlete or a linked parent can set this.' : error.message } : { ok: true };
}

/** Verified recruiters only. Logged, and the family is told who looked. */
export async function revealAddress(slug: string): Promise<{ ok: true; address: Omit<Address, 'shareWithRecruiters' | 'parentConsent'> } | { ok: false; reason: string }> {
  const sb = supabase();
  if (!sb) {
    const a = demoAddress(slug);
    if (!a?.shareWithRecruiters) return { ok: false, reason: 'This family has not shared a mailing address.' };
    pushDemoNotice(slug, { kind: 'address_viewed', at: new Date().toISOString() });
    return { ok: true, address: a };
  }
  const { data, error } = await sb.rpc('reveal_address', { slug });
  if (error) return { ok: false, reason: error.message };
  const r = (data as { name_on_mail: string; street: string; city: string; state: string; zip: string }[])[0];
  return { ok: true, address: { nameOnMail: r.name_on_mail, street: r.street, city: r.city, state: r.state, zip: r.zip } };
}

// ---- reels ------------------------------------------------------------------------------------

export const reelEvents = () => read<Engagement[]>('vr-reel-events', []);

export async function logReel(e: Omit<Engagement, 'at'>) {
  const all = [...reelEvents(), { ...e, at: Date.now() }].slice(-500);
  write('vr-reel-events', all);
  const { sb, uid } = await signedIn();
  if (sb && uid) await sb.from('reel_events').insert({ user_id: uid, reel_id: e.reelId, sport: e.sport, kind: e.kind });
}

export type ReelSave = { reelId: string; athlete?: string; list: 'prospect' | 'maybe' | 'no'; reason?: string; shareWith: 'none' | 'coach' | 'family' };
export const savedReels = () => read<Record<string, ReelSave>>('vr-reel-saves', {});

export async function saveReel(s: ReelSave): Promise<Result> {
  write('vr-reel-saves', { ...savedReels(), [s.reelId]: s });
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('reel_saves').upsert({ user_id: uid, reel_id: s.reelId, athlete_slug: s.athlete, list: s.list, reason: s.reason, share_with: s.shareWith, updated_at: new Date().toISOString() });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export async function unsaveReel(reelId: string) {
  const all = savedReels();
  delete all[reelId];
  write('vr-reel-saves', all);
  const { sb, uid } = await signedIn();
  if (sb && uid) await sb.from('reel_saves').delete().eq('user_id', uid).eq('reel_id', reelId);
}

// ---- families ---------------------------------------------------------------------------------

export const demoLinks = () => read<{ athlete: string; relation: string }[]>('vr-family-links', []);

/** Link this account to an athlete with the one-time code the coach (or the other parent) handed out. */
export async function claimLinkCode(code: string, demoAthlete?: string): Promise<{ ok: true; athlete: string; demo?: true } | { ok: false; reason: string }> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,10}$/.test(clean)) return { ok: false, reason: 'Codes are 6 to 10 letters and numbers.' };
  const sb = supabase();
  if (!sb) {
    if (!demoAthlete) return { ok: false, reason: 'Pick the athlete this sample code is for.' };
    write('vr-family-links', [...demoLinks().filter((l) => l.athlete !== demoAthlete), { athlete: demoAthlete, relation: 'parent' }]);
    return { ok: true, athlete: demoAthlete, demo: true };
  }
  const { data, error } = await sb.rpc('claim_link_code', { c: clean });
  return error ? { ok: false, reason: error.message } : { ok: true, athlete: data as string };
}

export type Upload = { athlete: string; file: File; caption?: string };
export const demoUploads = (slug: string) => read<{ name: string; caption?: string; at: string }[]>(`vr-uploads-${slug}`, []);

/** Families add photos and clips; nothing shows publicly until the coach approves it. */
export async function uploadToProfile(u: Upload): Promise<Result> {
  const kind = u.file.type.startsWith('video/') ? 'video' : u.file.type.startsWith('image/') ? 'photo' : 'document';
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-uploads-${u.athlete}`, [{ name: u.file.name, caption: u.caption, at: new Date().toISOString() }, ...demoUploads(u.athlete)]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const path = `${u.athlete}/${crypto.randomUUID()}-${u.file.name.replace(/[^\w.-]/g, '_')}`;
  const up = await sb.storage.from('family-uploads').upload(path, u.file);
  if (up.error) return { ok: false, reason: up.error.message };
  const { error } = await sb.from('athlete_media').insert({ athlete_slug: u.athlete, uploaded_by: uid, path, kind, caption: u.caption });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- boosters, alumni, siblings ---------------------------------------------------------------

export type BoosterEntry = { school: string; name: string; anonymous: boolean; kind: 'booster' | 'alumni' | 'business' | 'family'; classOf?: number; sports: string[]; message?: string; email?: string; phone?: string; shareContact: boolean };
export const demoBoosters = (school: string) => read<(BoosterEntry & { at: string })[]>(`vr-boosters-${school}`, []);

export async function joinBoosters(b: BoosterEntry): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-boosters-${b.school}`, [{ ...b, at: new Date().toISOString() }, ...demoBoosters(b.school)]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('boosters').insert({
    school_slug: b.school, user_id: uid, display_name: b.name, anonymous: b.anonymous, kind: b.kind, class_of: b.classOf, sports: b.sports,
    message: b.message, email: b.shareContact ? b.email : null, phone: b.shareContact ? b.phone : null, share_contact: b.shareContact,
  });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type GloryPost = { school: string; author: string; tag: 'alumni' | 'booster' | 'family'; classOf?: number; sport?: string; title: string; story: string; articleUrl?: string; photos: File[] };
export const demoGlory = (school: string) => read<(Omit<GloryPost, 'photos'> & { photos: string[]; at: string })[]>(`vr-glory-${school}`, []);

export async function postGloryDays(p: GloryPost): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-glory-${p.school}`, [{ ...p, photos: p.photos.map((f) => f.name), at: new Date().toISOString() }, ...demoGlory(p.school)]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const paths: string[] = [];
  for (const f of p.photos.slice(0, 6)) {
    const path = `${p.school}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, '_')}`;
    const up = await sb.storage.from('glory-days').upload(path, f);
    if (up.error) return { ok: false, reason: up.error.message };
    paths.push(path);
  }
  const { error } = await sb.from('glory_days').insert({ school_slug: p.school, user_id: uid, author: p.author, tag: p.tag, class_of: p.classOf, sport: p.sport, title: p.title, story: p.story, photos: paths, article_url: p.articleUrl });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type Sibling = { name: string; classOf?: number; sports: string; highlight: string };
export type SiblingSet = { school: string; familyName: string; members: Sibling[]; story?: string };
export const demoSiblings = (school: string) => read<(SiblingSet & { at: string })[]>(`vr-siblings-${school}`, []);

export async function submitSiblings(s: SiblingSet): Promise<Result> {
  if (s.members.filter((m) => m.name.trim()).length < 2) return { ok: false, reason: 'Add at least two siblings.' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-siblings-${s.school}`, [{ ...s, at: new Date().toISOString() }, ...demoSiblings(s.school)]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('sibling_sets').insert({ school_slug: s.school, family_name: s.familyName, members: s.members, story: s.story, submitted_by: uid });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- wishlists, academic feedback -------------------------------------------------------------

export type WishItem = { id: string; kind: 'school' | 'gear' | 'athlete'; title: string; url?: string; note?: string };
export const demoWishlist = (slug: string) => read<WishItem[]>(`vr-wish-${slug}`, []);

export async function saveWishlist(slug: string, items: WishItem[]): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-wish-${slug}`, items);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const del = await sb.from('wishlist_items').delete().eq('athlete_slug', slug);
  if (del.error) return { ok: false, reason: del.error.code === '42501' ? 'Only the athlete or a linked parent can edit this list.' : del.error.message };
  if (!items.length) return { ok: true };
  const { error } = await sb.from('wishlist_items').insert(items.map((i, n) => ({ athlete_slug: slug, kind: i.kind, title: i.title, url: i.url, note: i.note, sort: n })));
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type AcademicNote = { school: string; topic: string; body: string };
export async function sendAcademicFeedback(n: AcademicNote): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-academic-feedback', [...read<AcademicNote[]>('vr-academic-feedback', []), n]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('academic_feedback').insert({ school_slug: n.school, user_id: uid, topic: n.topic, body: n.body });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- schools ----------------------------------------------------------------------------------

export type SchoolClaim = {
  school: string;
  name: string;
  title: string;
  email: string;
  website?: string;
  permissions: { siteNews: boolean; schedules: boolean; rosters: boolean; photos: boolean };
  accounts: Partial<Record<'hudl' | 'maxpreps' | '247' | 'on3' | 'x' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'newspaper', string>>;
};

/** An AD (or whoever runs athletics) claims the school page. Staff verify by calling the school office. */
export async function claimSchool(c: SchoolClaim): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-claim-${c.school}`, { ...c, at: new Date().toISOString() });
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const ver = await sb.from('verification_requests').insert({ role: 'athletic director', name: c.name, email: c.email, school_slug: c.school, note: `${c.title}. Claim request.` });
  if (ver.error) return { ok: false, reason: ver.error.message };
  const { error } = await sb.from('school_claims').insert({ school_slug: c.school, user_id: uid, title: c.title, website: c.website, permissions: c.permissions, accounts: c.accounts });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type MerchantSignup = { school: string; business: string; contactName: string; contactEmail: string; phone?: string; address?: string; offer: string; finePrint?: string; tier: 'gold' | 'silver' | 'bronze' };

/** A business offers a gold card deal. It stays pending until the merchant signs and staff turn it on. */
export async function offerMerchantDeal(m: MerchantSignup): Promise<Result> {
  const sb = supabase();
  if (!sb) {
    write('vr-merchant-offers', [...read<MerchantSignup[]>('vr-merchant-offers', []), m]);
    return { ok: true, demo: true };
  }
  const { error } = await sb.from('merchant_offers').insert({
    school_slug: m.school, business: m.business, contact_name: m.contactName, contact_email: m.contactEmail, phone: m.phone, address: m.address, offer: m.offer, fine_print: m.finePrint, tier: m.tier,
  });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- scouting ---------------------------------------------------------------------------------


export type MyNeeds = Needs & { program: string; division: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO'; timeline: string; openToTapes: boolean };
export const myNeeds = () => read<MyNeeds | null>('vr-needs-post', null);

export async function saveNeeds(n: MyNeeds): Promise<Result> {
  write('vr-needs-post', n);
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('recruiter_needs').upsert({
    recruiter_id: uid, program: n.program, division: n.division, sports: n.sports, positions: n.positions, classes: n.classes,
    min_height_in: n.minHeightIn ?? null, min_gpa: n.minGpa ?? null, dont_want: n.dontWant, timeline: n.timeline, open_to_tapes: n.openToTapes, updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, reason: error.code === '42501' ? 'Only verified recruiters can post needs.' : error.message } : { ok: true };
}

export const demoTapes = () => read<(Tape & { url: string })[]>('vr-tapes', []);

/** Send a highlight tape. The database enforces the same limits as canSendTape. */
export async function sendTape(t: { athlete: string; recruiter: string; url: string; note?: string }): Promise<Result> {
  if (!/^https:\/\//.test(t.url)) return { ok: false, reason: 'Paste a full https link to the tape (Hudl, YouTube, a drive link).' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    const check = canSendTape(demoTapes(), t.athlete, t.recruiter, Date.now());
    if (!check.ok) return check;
    write('vr-tapes', [...demoTapes(), { athlete: t.athlete, recruiter: t.recruiter, url: t.url, sentAt: Date.now() }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const season = (() => { const d = new Date(); const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${String(y + 1).slice(2)}`; })();
  const { error } = await sb.from('tape_submissions').insert({ athlete_slug: t.athlete, recruiter_id: t.recruiter, sent_by: uid, url: t.url, note: t.note, season });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

/** Demo only: play the coach's side so the limits can be tried. */
export function demoTapeAction(athlete: string, recruiter: string, action: 'seen' | 'more') {
  const all = demoTapes();
  const mine = all.filter((t) => t.athlete === athlete && t.recruiter === recruiter);
  const last = mine[mine.length - 1];
  if (!last) return;
  if (action === 'seen') last.seenAt = Date.now();
  else last.moreRequestedAt = Date.now();
  write('vr-tapes', all);
}

export type MeetRequest = { id: string; athlete: string; kind: 'video call' | 'phone call' | 'campus visit' | 'at a game'; when?: string; message?: string; status: 'pending' | 'accepted' | 'declined'; from?: string };
export const demoMeets = () => read<MeetRequest[]>('vr-meets', []);

export async function requestMeet(m: Omit<MeetRequest, 'id' | 'status'>): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-meets', [...demoMeets(), { ...m, id: crypto.randomUUID(), status: 'pending' }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('meet_requests').insert({ recruiter_id: uid, athlete_slug: m.athlete, kind: m.kind, proposed_at: m.when || null, message: m.message });
  return error ? { ok: false, reason: error.code === '42501' ? 'Only verified recruiters can ask to meet.' : error.message } : { ok: true };
}

export async function answerMeet(id: string, status: 'accepted' | 'declined'): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-meets', demoMeets().map((m) => (m.id === id ? { ...m, status } : m)));
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('meet_requests').update({ status, answered_by: uid, answered_at: new Date().toISOString() }).eq('id', id);
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type FilmRequest = { id: string; school: string; athlete?: string; sport: string; games: string; status: 'open' | 'sent' | 'declined'; filmUrl?: string };
export const demoFilm = () => read<FilmRequest[]>('vr-film', []);

/** Ask the high school coach for game film. The coach answers with one button and a link. */
export async function requestFilm(f: Omit<FilmRequest, 'id' | 'status'>): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-film', [...demoFilm(), { ...f, id: crypto.randomUUID(), status: 'open' }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('film_requests').insert({ recruiter_id: uid, school_slug: f.school, athlete_slug: f.athlete, sport: f.sport, games: f.games });
  return error ? { ok: false, reason: error.code === '42501' ? 'Only verified recruiters can request film.' : error.message } : { ok: true };
}

export async function answerFilm(id: string, filmUrl: string | null): Promise<Result> {
  const status = filmUrl ? 'sent' : 'declined';
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-film', demoFilm().map((f) => (f.id === id ? { ...f, status, filmUrl: filmUrl ?? undefined } : f)));
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('film_requests').update({ status, film_url: filmUrl, answered_by: uid, answered_at: new Date().toISOString() }).eq('id', id);
  return error ? { ok: false, reason: error.message } : { ok: true };
}

/** Recruiters on each school in the last 30 days. Demo mode has no recruiters, so it says zero, not a guess. */
export async function schoolAttention(): Promise<Record<string, number>> {
  const sb = supabase();
  if (!sb) return {};
  const { data } = await sb.rpc('school_attention');
  return Object.fromEntries(((data ?? []) as { school_slug: string; recruiters: number }[]).map((r) => [r.school_slug, Number(r.recruiters)]));
}

export async function logRecruiterView(athlete: string, school: string) {
  const { sb, uid } = await signedIn();
  if (sb && uid) await sb.from('recruiter_views').upsert({ recruiter_id: uid, athlete_slug: athlete, school_slug: school }, { ignoreDuplicates: true });
}

export type Prefs = { email: boolean; sms: boolean; push: boolean; muted: string[] };
export const NOTICE_KINDS: { kind: string; label: string }[] = [
  { kind: 'recruiter_star', label: 'A recruiter starred a profile' },
  { kind: 'recruiter_message', label: 'A recruiter wrote' },
  { kind: 'meet_request', label: 'Meet and greet requests' },
  { kind: 'tape_more', label: 'A coach asked for more film' },
  { kind: 'address_viewed', label: 'A recruiter viewed the mailing address' },
  { kind: 'recruiter_feedback', label: 'Recruiter feedback on a reel' },
  { kind: 'film_request', label: 'Film requests (coaches)' },
  { kind: 'grant_deadline', label: 'Grant deadlines near my school' },
  { kind: 'coverage', label: 'Photo and video requests near me (photographers)' },
];
export const demoPrefs = () => read<Prefs>('vr-prefs', { email: true, sms: false, push: true, muted: [] });

export async function savePrefs(p: Prefs): Promise<Result> {
  write('vr-prefs', p);
  const { sb, uid } = await signedIn();
  if (!sb) return { ok: true, demo: true };
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('notification_prefs').upsert({ user_id: uid, email: p.email, sms: p.sms, push: p.push, muted: p.muted, updated_at: new Date().toISOString() });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- school wants board -----------------------------------------------------------------------

export type Want = { id: string; school: string; sport?: string; title: string; detail?: string; estCents?: number; votes: number; status: string };
const demoWants = (school: string) => read<Want[]>(`vr-wants-${school}`, []);
export const myWantVotes = (school: string) => read<string[]>(`vr-want-votes-${school}`, []);

export async function listWants(school: string, seed: Want[]): Promise<Want[]> {
  const sb = supabase();
  if (!sb) return [...seed, ...demoWants(school)].map((w) => ({ ...w, votes: w.votes + (myWantVotes(school).includes(w.id) ? 1 : 0) }));
  const { data } = await sb.from('school_want_tally').select('*').eq('school_slug', school).order('votes', { ascending: false });
  return ((data ?? []) as { id: string; school_slug: string; sport: string | null; title: string; detail: string | null; est_cost_cents: number | null; votes: number; status: string }[]).map((r) => ({
    id: r.id, school: r.school_slug, sport: r.sport ?? undefined, title: r.title, detail: r.detail ?? undefined, estCents: r.est_cost_cents ?? undefined, votes: r.votes, status: r.status,
  }));
}

export async function suggestWant(w: { school: string; sport?: string; title: string; detail?: string }): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-wants-${w.school}`, [...demoWants(w.school), { ...w, id: crypto.randomUUID(), votes: 0, status: 'open' }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('school_wants').insert({ school_slug: w.school, sport: w.sport || null, title: w.title, detail: w.detail, suggested_by: uid });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export async function voteWant(school: string, id: string, on: boolean): Promise<Result> {
  const mine = myWantVotes(school);
  const { sb, uid } = await signedIn();
  if (sb) {
    if (!uid) return { ok: false, reason: 'Sign in to vote, so every family counts once.' };
    const { error } = on ? await sb.from('school_want_votes').insert({ want_id: id, voter_id: uid }) : await sb.from('school_want_votes').delete().eq('want_id', id).eq('voter_id', uid);
    if (error && error.code !== '23505') return { ok: false, reason: error.message };
  }
  write(`vr-want-votes-${school}`, on ? [...new Set([...mine, id])] : mine.filter((x) => x !== id));
  return { ok: true, ...(sb ? {} : { demo: true as const }) };
}

export type Socials = Partial<Record<'x' | 'instagram' | 'tiktok' | 'youtube' | 'hudl' | 'maxpreps' | '247' | 'on3' | 'facebook', string>>;
export const demoSocials = (slug: string) => read<Socials>(`vr-socials-${slug}`, {});

/** Links recruiters use for due diligence. Handles only; we never log in to these accounts. */
export async function saveSocials(slug: string, s: Socials): Promise<Result> {
  const clean = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, (v ?? '').trim().replace(/^@/, '')]).filter(([, v]) => v)) as Socials;
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-socials-${slug}`, clean);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const del = await sb.from('athlete_socials').delete().eq('athlete_slug', slug);
  if (del.error) return { ok: false, reason: del.error.message };
  const rows = Object.entries(clean).map(([network, handle]) => ({ athlete_slug: slug, network, handle }));
  const { error } = rows.length ? await sb.from('athlete_socials').insert(rows) : { error: null };
  return error ? { ok: false, reason: error.message } : { ok: true };
}

// ---- media partners, sponsors, pledges, creators, awards --------------------------------------

export type PartnerLink = { gameId: string; partner: string; kind: 'radio' | 'stream' | 'live blog' | 'recap' | 'photos'; url: string };
export const demoPartnerLinks = (gameId: string) => read<PartnerLink[]>(`vr-partner-${gameId}`, []);

export async function listPartnerLinks(gameId: string): Promise<PartnerLink[]> {
  const sb = supabase();
  if (!sb) return demoPartnerLinks(gameId);
  const { data } = await sb.from('game_partner_links').select('kind, url, media_partners(name)').eq('game_id', gameId);
  return ((data ?? []) as unknown as { kind: PartnerLink['kind']; url: string; media_partners: { name: string } | null }[]).map((r) => ({ gameId, partner: r.media_partners?.name ?? 'Partner', kind: r.kind, url: r.url }));
}

/** A paper, radio station, school or coach links its broadcast or recap to a game. */
export async function addPartnerLink(l: PartnerLink & { partnerKind: 'newspaper' | 'radio' | 'tv' | 'stream' | 'school' }): Promise<Result> {
  if (!/^https:\/\//.test(l.url)) return { ok: false, reason: 'Paste a full https link.' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-partner-${l.gameId}`, [...demoPartnerLinks(l.gameId), { gameId: l.gameId, partner: l.partner, kind: l.kind, url: l.url }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  let { data: p } = await sb.from('media_partners').select('id').eq('name', l.partner).eq('created_by', uid).maybeSingle();
  if (!p) {
    const ins = await sb.from('media_partners').insert({ name: l.partner, kind: l.partnerKind, created_by: uid }).select('id').single();
    if (ins.error) return { ok: false, reason: ins.error.message };
    p = ins.data;
  }
  const { error } = await sb.from('game_partner_links').upsert({ game_id: l.gameId, partner_id: p!.id, kind: l.kind, url: l.url, added_by: uid });
  return error ? { ok: false, reason: error.code === '42501' ? 'Verified coaches, reporters and partners can add links.' : error.message } : { ok: true };
}

export type Sponsorship = { gameId: string; school: string; sponsor: string; amountCents: number; pledge: string; wantId?: string };
export const demoSponsors = () => read<Sponsorship[]>('vr-sponsors', []);

/** Sponsor a game: top of the watch list, money to the school, for the thing the school pledged. */
export async function sponsorGame(s: Sponsorship): Promise<{ ok: true; checkoutUrl?: string; demo?: true } | { ok: false; reason: string }> {
  if (s.amountCents < 2500) return { ok: false, reason: 'Sponsorships start at $25.' };
  if (!s.pledge.trim()) return { ok: false, reason: 'Pick what the money pays for.' };
  const sb = supabase();
  if (!sb) {
    write('vr-sponsors', [...demoSponsors(), s]);
    return { ok: true, demo: true };
  }
  const { data, error } = await sb.functions.invoke('checkout', { body: { kind: 'sponsor', ...s, returnUrl: `${window.location.origin}${window.location.pathname}` } });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, checkoutUrl: data.url };
}

export type WantPledge = { wantId: string; by: 'faculty' | 'booster' | 'sponsor' | 'family'; name: string; cents?: number; hours?: number; note?: string };
export const demoPledges = (school: string) => read<WantPledge[]>(`vr-pledges-${school}`, []);

export async function listPledges(school: string, wantIds: string[]): Promise<WantPledge[]> {
  const sb = supabase();
  if (!sb) return demoPledges(school);
  if (!wantIds.length) return [];
  const { data } = await sb.from('want_pledges').select('want_id, by_kind, name, cents, hours, note').in('want_id', wantIds);
  return ((data ?? []) as { want_id: string; by_kind: WantPledge['by']; name: string; cents: number | null; hours: number | null; note: string | null }[]).map((r) => ({ wantId: r.want_id, by: r.by_kind, name: r.name, cents: r.cents ?? undefined, hours: r.hours ?? undefined, note: r.note ?? undefined }));
}

/** Faculty, boosters, sponsors and families pledge money or hours toward a want. Faculty pledges need a verified staff account. */
export async function pledgeWant(school: string, p: WantPledge): Promise<Result> {
  if (!p.cents && !p.hours) return { ok: false, reason: 'Pledge dollars, hours, or both.' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-pledges-${school}`, [...demoPledges(school), p]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('want_pledges').insert({ want_id: p.wantId, user_id: uid, by_kind: p.by, name: p.name, cents: p.cents ?? null, hours: p.hours ?? null, note: p.note });
  return error ? { ok: false, reason: error.code === '42501' ? 'Faculty pledges need a verified school staff account.' : error.message } : { ok: true };
}

export type CreatorProfile = { name: string; kind: 'photographer' | 'videographer' | 'both'; town: string; miles: number; portfolio?: string; bio?: string };
export const demoCreator = () => read<CreatorProfile | null>('vr-creator', null);

export async function becomeCreator(c: CreatorProfile): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-creator', c);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('media_creators').upsert({ user_id: uid, display_name: c.name, kind: c.kind, home_town: c.town, travel_miles: c.miles, portfolio_url: c.portfolio, bio: c.bio });
  return error ? { ok: false, reason: error.message } : { ok: true };
}

export type Coverage = { id: string; school: string; sport: string; gameOn: string; location?: string; needs?: string; payCents: number; status: 'open' | 'claimed' | 'done'; claimedBy?: string };
export const demoCoverage = () => read<Coverage[]>('vr-coverage', []);

export async function listCoverage(seed: Coverage[]): Promise<Coverage[]> {
  const sb = supabase();
  if (!sb) return [...demoCoverage(), ...seed];
  const { data } = await sb.from('coverage_requests').select('*').in('status', ['open', 'claimed']).order('game_on');
  return ((data ?? []) as { id: string; school_slug: string; sport: string; game_on: string; location: string | null; needs: string | null; pay_cents: number; status: Coverage['status'] }[]).map((r) => ({ id: r.id, school: r.school_slug, sport: r.sport, gameOn: r.game_on, location: r.location ?? undefined, needs: r.needs ?? undefined, payCents: r.pay_cents, status: r.status }));
}

export async function requestCoverage(c: Omit<Coverage, 'id' | 'status'>): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-coverage', [{ ...c, id: crypto.randomUUID(), status: 'open' }, ...demoCoverage()]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('coverage_requests').insert({ school_slug: c.school, requested_by: uid, sport: c.sport, game_on: c.gameOn, location: c.location, needs: c.needs, pay_cents: c.payCents });
  return error ? { ok: false, reason: error.code === '42501' ? 'Verified coaches and athletic directors can request coverage.' : error.message } : { ok: true };
}

export async function claimCoverage(id: string): Promise<Result> {
  const { sb, uid } = await signedIn();
  if (!sb) {
    write('vr-coverage', demoCoverage().map((c) => (c.id === id ? { ...c, status: 'claimed' as const, claimedBy: 'you' } : c)));
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  const { error } = await sb.from('coverage_requests').update({ status: 'claimed', claimed_by: uid }).eq('id', id).eq('status', 'open');
  return error ? { ok: false, reason: error.code === '42501' ? 'Set up your photographer profile first.' : error.message } : { ok: true };
}

export async function buyLicense(itemId: string, use: string, org?: string): Promise<{ ok: true; checkoutUrl?: string; demo?: true } | { ok: false; reason: string }> {
  const sb = supabase();
  if (!sb) return { ok: true, demo: true };
  const { data, error } = await sb.functions.invoke('checkout', { body: { kind: 'license', itemId, use, org, returnUrl: `${window.location.origin}${window.location.pathname}` } });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, checkoutUrl: data.url };
}

export type AwardEntry = { id: string; award: 'shakiest-camera' | 'loudest-parent'; reelId?: string; caption: string; school?: string; votes: number; at: string; sample?: boolean };
export const myAwardVotes = (week: string) => read<Record<string, string>>(`vr-award-votes-${week}`, {});
export const demoEntries = (week: string) => read<AwardEntry[]>(`vr-award-entries-${week}`, []);

export async function voteAward(week: string, award: AwardEntry['award'], entryId: string): Promise<Result> {
  const mine = myAwardVotes(week);
  if (mine[award]) return { ok: false, reason: 'One vote per award each week.' };
  const { sb, uid } = await signedIn();
  if (sb) {
    if (!uid) return { ok: false, reason: 'Sign in to vote, so every person counts once.' };
    const { error } = await sb.from('award_votes').insert({ voter_id: uid, award, week, entry_id: entryId });
    if (error) return { ok: false, reason: error.code === '23505' ? 'One vote per award each week.' : error.message };
  }
  write(`vr-award-votes-${week}`, { ...mine, [award]: entryId });
  return { ok: true, ...(sb ? {} : { demo: true as const }) };
}

export async function enterAward(week: string, e: { award: AwardEntry['award']; reelId?: string; file?: File; caption: string; school?: string; consent: boolean }): Promise<Result> {
  if (!e.consent) return { ok: false, reason: 'The person in the clip has to be in on the joke. Check the box once they said yes.' };
  if (!e.reelId && !e.file) return { ok: false, reason: 'Pick a reel or upload the clip.' };
  const { sb, uid } = await signedIn();
  if (!sb) {
    write(`vr-award-entries-${week}`, [...demoEntries(week), { id: crypto.randomUUID(), award: e.award, reelId: e.reelId, caption: e.caption, school: e.school, votes: 0, at: new Date().toISOString() }]);
    return { ok: true, demo: true };
  }
  if (!uid) return { ok: false, reason: SIGN_IN };
  let path: string | null = null;
  if (e.file) {
    path = `${week}/${crypto.randomUUID()}-${e.file.name.replace(/[^\w.-]/g, '_')}`;
    const up = await sb.storage.from('award-clips').upload(path, e.file);
    if (up.error) return { ok: false, reason: up.error.message };
  }
  const { error } = await sb.from('award_entries').insert({ award: e.award, week, school_slug: e.school, reel_id: e.reelId, video_path: path, caption: e.caption, submitted_by: uid, consent: true });
  return error ? { ok: false, reason: error.message } : { ok: true };
}
