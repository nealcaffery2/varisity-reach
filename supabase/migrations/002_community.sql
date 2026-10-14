-- Conference pick'em, fan brackets and free fantasy; recruiter stars, contact
-- and private mailing addresses; reel engagement and save lists; family
-- links and uploads; boosters, alumni stories and Sibling Superstars;
-- wishlists; private academic feedback; school claims, feeds and news;
-- gold card merchants. Idempotent: safe to run twice.
--
-- Roles are compared as text (role::text = 'recruiter') so this file works
-- in one transaction right after the enum gains its new values.

do $$ begin alter type role_kind add value if not exists 'recruiter'; exception when others then null; end $$;
do $$ begin alter type role_kind add value if not exists 'parent'; exception when others then null; end $$;
do $$ begin alter type role_kind add value if not exists 'athlete'; exception when others then null; end $$;

-- ---- helpers ---------------------------------------------------------------------------------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select case when verified_at is not null then role::text else 'fan' end from public.profiles where id = auth.uid()
$$;

create or replace function public.is_verified_recruiter() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'recruiter', false)
$$;

create or replace function public.is_school_staff(school text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.verified_at is not null and p.school_slug = school
      and p.role::text in ('coach', 'athletic director', 'staff', 'admin')
  )
$$;

-- ---- conference: pick'em, brackets, fantasy --------------------------------------------------

create table if not exists public.conference_picks (
  user_id uuid not null references auth.users on delete cascade,
  conference text not null,
  game_key text not null, -- "2026-10-16:Hillsboro@Piasa Southwestern"
  team text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, game_key)
);

create table if not exists public.fan_brackets (
  user_id uuid not null references auth.users on delete cascade,
  conference text not null,
  picks jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, conference)
);

-- Free to play, no prizes: the players are minors.
create table if not exists public.fantasy_squads (
  user_id uuid not null references auth.users on delete cascade,
  conference text not null,
  name text not null default 'My squad' check (length(name) <= 40),
  squad jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, conference)
);

-- Fan share per game without exposing who picked what.
create or replace function public.pick_counts(conf text)
returns table (game_key text, team text, n bigint)
language sql stable security definer set search_path = public as $$
  select game_key, team, count(*) from public.conference_picks where conference = conf group by 1, 2
$$;

-- ---- families --------------------------------------------------------------------------------

-- Who may act for an athlete profile: the athlete, parents or guardians.
create table if not exists public.athlete_links (
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  relation text not null check (relation in ('self', 'parent', 'guardian')),
  created_at timestamptz not null default now(),
  primary key (athlete_slug, user_id)
);

-- One-time codes a coach (or a linked parent) gives the family to link accounts.
create table if not exists public.link_codes (
  code text primary key,
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  relation text not null check (relation in ('self', 'parent', 'guardian')),
  created_by uuid references auth.users,
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users
);

create or replace function public.is_family(slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.athlete_links where athlete_slug = slug and user_id = auth.uid())
$$;

create or replace function public.claim_link_code(c text) returns text
language plpgsql security definer set search_path = public as $$
declare r public.link_codes;
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  select * into r from public.link_codes where code = upper(trim(c)) and used_by is null and expires_at > now() for update;
  if not found then raise exception 'That code is used, expired or mistyped.'; end if;
  insert into public.athlete_links (athlete_slug, user_id, relation) values (r.athlete_slug, auth.uid(), r.relation) on conflict do nothing;
  update public.link_codes set used_by = auth.uid() where code = r.code;
  return r.athlete_slug;
end $$;

-- Photos and clips a family adds to a profile. Staff approve before anything shows.
create table if not exists public.athlete_media (
  id uuid primary key default gen_random_uuid(),
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  uploaded_by uuid not null references auth.users,
  path text not null,
  kind text not null check (kind in ('photo', 'video', 'document')),
  caption text check (length(caption) <= 280),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---- notifications ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,
  body jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.notify_family(slug text, k text, b jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, body) select user_id, k, b from public.athlete_links where athlete_slug = slug
$$;

-- ---- recruiters ------------------------------------------------------------------------------

create table if not exists public.recruiter_stars (
  recruiter_id uuid not null references auth.users on delete cascade,
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recruiter_id, athlete_slug)
);

create or replace function public.on_star() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_family(new.athlete_slug, 'recruiter_star', jsonb_build_object(
    'recruiter', (select display_name from public.profiles where id = new.recruiter_id),
    'outlet', (select outlet from public.profiles where id = new.recruiter_id)));
  return new;
end $$;
drop trigger if exists recruiter_star_notify on public.recruiter_stars;
create trigger recruiter_star_notify after insert on public.recruiter_stars for each row execute function public.on_star();

-- Messages go through the recruiter-contact function, which checks the
-- contact calendar and copies the family. Nobody inserts here directly.
create table if not exists public.recruiter_messages (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users,
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  channel text not null check (channel in ('email', 'mail')),
  subject text not null check (length(subject) <= 140),
  body text not null check (length(body) <= 5000),
  status text not null default 'queued' check (status in ('queued', 'sent', 'held', 'failed')),
  hold_reason text,
  created_at timestamptz not null default now()
);

-- Mailing address, private. The family decides whether verified recruiters
-- may see it; each reveal is logged and the family is told.
create table if not exists public.private_addresses (
  athlete_slug text primary key references public.athletes(slug) on delete cascade,
  name_on_mail text not null,
  street text not null,
  city text not null,
  state text not null,
  zip text not null,
  share_with_recruiters boolean not null default false,
  parent_consent_by uuid references auth.users,
  parent_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.address_reveals (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users,
  athlete_slug text not null,
  at timestamptz not null default now()
);

create or replace function public.reveal_address(slug text)
returns table (name_on_mail text, street text, city text, state text, zip text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_verified_recruiter() then raise exception 'Verified recruiters only.'; end if;
  if not exists (select 1 from public.private_addresses a where a.athlete_slug = slug and a.share_with_recruiters and a.parent_consent_at is not null) then
    raise exception 'This family has not shared a mailing address.';
  end if;
  insert into public.address_reveals (recruiter_id, athlete_slug) values (auth.uid(), slug);
  perform public.notify_family(slug, 'address_viewed', jsonb_build_object('recruiter', (select display_name from public.profiles where id = auth.uid())));
  return query select a.name_on_mail, a.street, a.city, a.state, a.zip from public.private_addresses a where a.athlete_slug = slug;
end $$;

-- ---- reels -----------------------------------------------------------------------------------

create table if not exists public.reel_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  reel_id text not null,
  sport text not null,
  kind text not null check (kind in ('view', 'complete', 'like', 'comment', 'share', 'save', 'skip')),
  at timestamptz not null default now()
);
create index if not exists reel_events_user on public.reel_events (user_id, at desc);

create table if not exists public.reel_saves (
  user_id uuid not null references auth.users on delete cascade,
  reel_id text not null,
  athlete_slug text,
  list text not null check (list in ('prospect', 'maybe', 'no')),
  reason text check (length(reason) <= 500),
  -- Who sees the reason: nobody, the coach, or the coach and the family.
  share_with text not null default 'none' check (share_with in ('none', 'coach', 'family')),
  updated_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);

create or replace function public.on_reel_feedback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.share_with = 'family' and new.athlete_slug is not null and coalesce(new.reason, '') <> '' then
    perform public.notify_family(new.athlete_slug, 'recruiter_feedback', jsonb_build_object('list', new.list, 'reason', new.reason));
  end if;
  return new;
end $$;
drop trigger if exists reel_feedback_notify on public.reel_saves;
create trigger reel_feedback_notify after insert or update on public.reel_saves for each row execute function public.on_reel_feedback();

-- ---- boosters, alumni, siblings --------------------------------------------------------------

create table if not exists public.boosters (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  user_id uuid references auth.users on delete set null,
  display_name text not null check (length(display_name) <= 80),
  anonymous boolean not null default false,
  kind text not null default 'booster' check (kind in ('booster', 'alumni', 'business', 'family')),
  class_of int,
  sports text[] not null default '{}',
  message text check (length(message) <= 280),
  -- Contact for staff only, and only if the booster agrees.
  email text,
  phone text,
  share_contact boolean not null default false,
  gave_at timestamptz,
  created_at timestamptz not null default now()
);

-- What everyone sees: no contact details, no name when anonymous.
create or replace view public.boosters_public with (security_invoker = false) as
  select id, school_slug, case when anonymous then null else display_name end as display_name, anonymous, kind, class_of, sports, message, gave_at is not null as gave, created_at
  from public.boosters;

create table if not exists public.booster_thanks (
  id uuid primary key default gen_random_uuid(),
  booster_id uuid not null references public.boosters(id) on delete cascade,
  from_user uuid not null references auth.users,
  note text not null check (length(note) <= 1000),
  created_at timestamptz not null default now()
);

-- "Glory days": alumni and boosters post old photos, clippings and stories.
create table if not exists public.glory_days (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  user_id uuid not null references auth.users on delete cascade,
  author text not null,
  tag text not null check (tag in ('alumni', 'booster', 'family')),
  class_of int,
  sport text,
  title text not null check (length(title) <= 120),
  story text not null check (length(story) <= 4000),
  photos text[] not null default '{}',
  article_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Sibling Superstars: brothers and sisters who wore the same colors, across years.
create table if not exists public.sibling_sets (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  family_name text not null,
  members jsonb not null, -- [{ name, classOf, sports, highlight, athleteSlug? }]
  story text check (length(story) <= 2000),
  submitted_by uuid references auth.users,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---- wishlists, academic feedback ------------------------------------------------------------

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  kind text not null check (kind in ('school', 'gear', 'athlete')),
  title text not null check (length(title) <= 120),
  url text,
  note text check (length(note) <= 280),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_feedback (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  user_id uuid not null references auth.users on delete cascade,
  topic text not null,
  body text not null check (length(body) <= 3000),
  created_at timestamptz not null default now()
);

-- ---- schools: claims, connected accounts, feeds, news ----------------------------------------

create table if not exists public.school_claims (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null,
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  website text,
  -- What the school lets us read from its own site, set by its AD.
  permissions jsonb not null default '{}'::jsonb,
  accounts jsonb not null default '{}'::jsonb, -- { hudl, maxpreps, on3, "247", x, instagram, facebook, tiktok, youtube }
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.school_feeds (
  url text primary key,
  school_slug text not null,
  source text not null, -- "Hillsboro schools", "The Journal-News"
  kind text not null check (kind in ('school', 'newspaper', 'district')),
  sports_only boolean not null default true,
  last_fetched timestamptz,
  last_error text
);

create table if not exists public.news_items (
  url text primary key,
  school_slug text not null,
  source text not null,
  title text not null,
  summary text,
  image text,
  published timestamptz,
  fetched_at timestamptz not null default now()
);
create index if not exists news_items_school on public.news_items (school_slug, published desc);

-- ---- gold card merchants ---------------------------------------------------------------------

create table if not exists public.merchant_offers (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  business text not null,
  contact_name text not null,
  contact_email text not null,
  phone text,
  address text,
  offer text not null check (length(offer) <= 140),
  fine_print text,
  tier text not null check (tier in ('gold', 'silver', 'bronze')),
  -- An offer shows on cards only after the merchant signs and staff approve.
  status text not null default 'pending' check (status in ('pending', 'signed', 'live', 'ended')),
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- row level security ----------------------------------------------------------------------

alter table public.conference_picks enable row level security;
alter table public.fan_brackets enable row level security;
alter table public.fantasy_squads enable row level security;
alter table public.athlete_links enable row level security;
alter table public.link_codes enable row level security;
alter table public.athlete_media enable row level security;
alter table public.notifications enable row level security;
alter table public.recruiter_stars enable row level security;
alter table public.recruiter_messages enable row level security;
alter table public.private_addresses enable row level security;
alter table public.address_reveals enable row level security;
alter table public.reel_events enable row level security;
alter table public.reel_saves enable row level security;
alter table public.boosters enable row level security;
alter table public.booster_thanks enable row level security;
alter table public.glory_days enable row level security;
alter table public.sibling_sets enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.academic_feedback enable row level security;
alter table public.school_claims enable row level security;
alter table public.school_feeds enable row level security;
alter table public.news_items enable row level security;
alter table public.merchant_offers enable row level security;

-- Your own rows.
drop policy if exists "own picks" on public.conference_picks;
create policy "own picks" on public.conference_picks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own bracket" on public.fan_brackets;
create policy "own bracket" on public.fan_brackets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own squad" on public.fantasy_squads;
create policy "own squad" on public.fantasy_squads for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "squads are public" on public.fantasy_squads;
create policy "squads are public" on public.fantasy_squads for select using (true);
drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "mark read" on public.notifications;
create policy "mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own reel events" on public.reel_events;
create policy "own reel events" on public.reel_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Families.
drop policy if exists "see own links" on public.athlete_links;
create policy "see own links" on public.athlete_links for select using (user_id = auth.uid() or public.is_family(athlete_slug));
drop policy if exists "family makes codes" on public.link_codes;
create policy "family makes codes" on public.link_codes for insert with check (created_by = auth.uid() and (public.is_family(athlete_slug) or public.is_school_staff((select school_slug from public.athletes where slug = athlete_slug))));
drop policy if exists "family sees codes" on public.link_codes;
create policy "family sees codes" on public.link_codes for select using (created_by = auth.uid());
drop policy if exists "family uploads" on public.athlete_media;
create policy "family uploads" on public.athlete_media for insert with check (uploaded_by = auth.uid() and status = 'pending' and public.is_family(athlete_slug));
drop policy if exists "media visible" on public.athlete_media;
create policy "media visible" on public.athlete_media for select using (status = 'approved' or public.is_family(athlete_slug) or public.is_school_staff((select school_slug from public.athletes where slug = athlete_slug)));
drop policy if exists "staff review media" on public.athlete_media;
create policy "staff review media" on public.athlete_media for update using (public.is_school_staff((select school_slug from public.athletes where slug = athlete_slug)));

-- Recruiters.
drop policy if exists "recruiters star" on public.recruiter_stars;
create policy "recruiters star" on public.recruiter_stars for insert with check (recruiter_id = auth.uid() and public.is_verified_recruiter());
drop policy if exists "recruiters unstar" on public.recruiter_stars;
create policy "recruiters unstar" on public.recruiter_stars for delete using (recruiter_id = auth.uid());
drop policy if exists "stars seen by both sides" on public.recruiter_stars;
create policy "stars seen by both sides" on public.recruiter_stars for select using (recruiter_id = auth.uid() or public.is_family(athlete_slug));
drop policy if exists "messages seen by both sides" on public.recruiter_messages;
create policy "messages seen by both sides" on public.recruiter_messages for select using (recruiter_id = auth.uid() or public.is_family(athlete_slug));
drop policy if exists "family keeps address" on public.private_addresses;
create policy "family keeps address" on public.private_addresses for all using (public.is_family(athlete_slug)) with check (public.is_family(athlete_slug));
drop policy if exists "family sees reveals" on public.address_reveals;
create policy "family sees reveals" on public.address_reveals for select using (public.is_family(athlete_slug) or recruiter_id = auth.uid());

-- Reel lists: the recruiter's own; the coach sees reasons shared with coaches.
drop policy if exists "own saves" on public.reel_saves;
create policy "own saves" on public.reel_saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "coach sees shared feedback" on public.reel_saves;
create policy "coach sees shared feedback" on public.reel_saves for select using (
  share_with <> 'none' and athlete_slug is not null and public.is_school_staff((select school_slug from public.athletes where slug = athlete_slug))
);

-- Boosters: join yourself; staff see contact only when the booster shares it.
drop policy if exists "join boosters" on public.boosters;
create policy "join boosters" on public.boosters for insert with check (user_id = auth.uid());
drop policy if exists "own booster row" on public.boosters;
create policy "own booster row" on public.boosters for select using (user_id = auth.uid() or (share_contact and public.is_school_staff(school_slug)));
drop policy if exists "edit own booster row" on public.boosters;
create policy "edit own booster row" on public.boosters for update using (user_id = auth.uid());
drop policy if exists "staff thank boosters" on public.booster_thanks;
create policy "staff thank boosters" on public.booster_thanks for insert with check (from_user = auth.uid() and public.is_school_staff((select school_slug from public.boosters where id = booster_id)));
drop policy if exists "thanks visible to both" on public.booster_thanks;
create policy "thanks visible to both" on public.booster_thanks for select using (from_user = auth.uid() or exists (select 1 from public.boosters b where b.id = booster_id and b.user_id = auth.uid()));

-- Alumni stories and sibling sets: anyone signed in submits, staff approve.
drop policy if exists "post glory days" on public.glory_days;
create policy "post glory days" on public.glory_days for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "approved glory days" on public.glory_days;
create policy "approved glory days" on public.glory_days for select using (status = 'approved' or user_id = auth.uid() or public.is_school_staff(school_slug));
drop policy if exists "staff approve glory days" on public.glory_days;
create policy "staff approve glory days" on public.glory_days for update using (public.is_school_staff(school_slug));
drop policy if exists "submit siblings" on public.sibling_sets;
create policy "submit siblings" on public.sibling_sets for insert with check (submitted_by = auth.uid() and status = 'pending');
drop policy if exists "approved siblings" on public.sibling_sets;
create policy "approved siblings" on public.sibling_sets for select using (status = 'approved' or submitted_by = auth.uid() or public.is_school_staff(school_slug));
drop policy if exists "staff approve siblings" on public.sibling_sets;
create policy "staff approve siblings" on public.sibling_sets for update using (public.is_school_staff(school_slug));

-- Wishlists: public on released profiles, kept by the family.
drop policy if exists "wishlists public" on public.wishlist_items;
create policy "wishlists public" on public.wishlist_items for select using (public.is_family(athlete_slug) or exists (select 1 from public.athletes a where a.slug = athlete_slug and a.media_release));
drop policy if exists "family keeps wishlist" on public.wishlist_items;
create policy "family keeps wishlist" on public.wishlist_items for all using (public.is_family(athlete_slug)) with check (public.is_family(athlete_slug));

-- Academic feedback goes to school staff and nobody else.
drop policy if exists "parents send feedback" on public.academic_feedback;
create policy "parents send feedback" on public.academic_feedback for insert with check (user_id = auth.uid());
drop policy if exists "staff read feedback" on public.academic_feedback;
create policy "staff read feedback" on public.academic_feedback for select using (user_id = auth.uid() or public.is_school_staff(school_slug));

-- School claims and connected accounts.
drop policy if exists "claim a school" on public.school_claims;
create policy "claim a school" on public.school_claims for insert with check (user_id = auth.uid() and status = 'pending');
drop policy if exists "see own claim" on public.school_claims;
create policy "see own claim" on public.school_claims for select using (user_id = auth.uid() or public.is_school_staff(school_slug));
drop policy if exists "feeds public" on public.school_feeds;
create policy "feeds public" on public.school_feeds for select using (true);
drop policy if exists "staff add feeds" on public.school_feeds;
create policy "staff add feeds" on public.school_feeds for insert with check (public.is_school_staff(school_slug));
drop policy if exists "news public" on public.news_items;
create policy "news public" on public.news_items for select using (true);

-- Merchants sign up themselves; only signed, live offers show.
drop policy if exists "merchants sign up" on public.merchant_offers;
create policy "merchants sign up" on public.merchant_offers for insert with check (status = 'pending');
drop policy if exists "live offers public" on public.merchant_offers;
create policy "live offers public" on public.merchant_offers for select using (status = 'live' or public.is_school_staff(school_slug));

-- Fan share and leaderboards are readable by anyone.
grant execute on function public.pick_counts(text) to anon, authenticated;
grant execute on function public.reveal_address(text) to authenticated;
grant execute on function public.claim_link_code(text) to authenticated;
grant select on public.boosters_public to anon, authenticated;

-- ---- storage ---------------------------------------------------------------------------------

-- Recruiter-only reels live in a private bucket; verified recruiters and the
-- athlete's family can read them, nobody else.
insert into storage.buckets (id, name, public) values ('reels-private', 'reels-private', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('family-uploads', 'family-uploads', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('glory-days', 'glory-days', true) on conflict (id) do nothing;

drop policy if exists "recruiters watch private reels" on storage.objects;
create policy "recruiters watch private reels" on storage.objects for select to authenticated using (
  bucket_id = 'reels-private' and (public.is_verified_recruiter() or public.is_family(split_part(name, '/', 1)))
);
drop policy if exists "family uploads files" on storage.objects;
create policy "family uploads files" on storage.objects for insert to authenticated with check (
  bucket_id = 'family-uploads' and public.is_family(split_part(name, '/', 1))
);
drop policy if exists "alumni upload old photos" on storage.objects;
create policy "alumni upload old photos" on storage.objects for insert to authenticated with check (bucket_id = 'glory-days');
