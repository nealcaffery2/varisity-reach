-- Recruiter needs and don't-want lists, highlight tape inbox with limits,
-- meet-and-greet requests, game film requests to high school coaches,
-- athlete social links, recruiter attention per school, notification
-- settings, school wants board with votes, and school board items. (Booster
-- money for ads is a campaign with kind 'exposure'; campaigns.kind is free text.)
-- Idempotent: safe to run twice. Needs 002_community.sql.

-- ---- recruiter profile: what they need next season -------------------------------------------

create table if not exists public.recruiter_needs (
  recruiter_id uuid primary key references auth.users on delete cascade,
  program text not null, -- "Greenville University football"
  division text not null check (division in ('D1', 'D2', 'D3', 'NAIA', 'JUCO')),
  sports text[] not null default '{}',
  positions text[] not null default '{}',
  classes int[] not null default '{}',
  min_height_in int,
  min_gpa numeric(3,2),
  dont_want text[] not null default '{}',
  timeline text check (length(timeline) <= 500), -- "Offers after junior film, official visits in June"
  notes text check (length(notes) <= 1000),
  open_to_tapes boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---- highlight tapes ------------------------------------------------------------------------

create table if not exists public.tape_submissions (
  id uuid primary key default gen_random_uuid(),
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  recruiter_id uuid not null references auth.users on delete cascade,
  sent_by uuid not null references auth.users,
  url text not null,
  note text check (length(note) <= 500),
  season text not null,
  seen_at timestamptz,
  more_requested_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tape_pair on public.tape_submissions (athlete_slug, recruiter_id, created_at desc);

-- Limits live in the database so no client can skip them: three a season per
-- coach, fourteen days apart, and none after the coach watched one until the
-- coach asks for more.
create or replace function public.check_tape() returns trigger
language plpgsql security definer set search_path = public as $$
declare last public.tape_submissions; n int;
begin
  if not public.is_family(new.athlete_slug) then raise exception 'Only the athlete or a linked parent can send a tape.'; end if;
  if not exists (select 1 from public.recruiter_needs where recruiter_id = new.recruiter_id and open_to_tapes) then raise exception 'This coach is not taking tapes right now.'; end if;
  select * into last from public.tape_submissions where athlete_slug = new.athlete_slug and recruiter_id = new.recruiter_id order by created_at desc limit 1;
  select count(*) into n from public.tape_submissions where athlete_slug = new.athlete_slug and recruiter_id = new.recruiter_id and season = new.season;
  if last.id is not null and last.more_requested_at is null then
    if last.seen_at is not null then raise exception 'This coach watched your last tape. Wait for them to ask for more.'; end if;
    if n >= 3 then raise exception 'That is three tapes to this coach this season.'; end if;
    if last.created_at > now() - interval '14 days' then raise exception 'Wait two weeks between tapes to the same coach.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists tape_limits on public.tape_submissions;
create trigger tape_limits before insert on public.tape_submissions for each row execute function public.check_tape();

-- ---- meet and greet -------------------------------------------------------------------------

create table if not exists public.meet_requests (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users on delete cascade,
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  kind text not null check (kind in ('video call', 'phone call', 'campus visit', 'at a game')),
  proposed_at timestamptz,
  message text check (length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  answered_by uuid references auth.users,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- film requests to high school coaches ---------------------------------------------------

create table if not exists public.film_requests (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users on delete cascade,
  school_slug text not null references public.schools(slug),
  athlete_slug text references public.athletes(slug) on delete set null,
  sport text not null,
  games text check (length(games) <= 300), -- "Week 8 vs Staunton, any full game"
  status text not null default 'open' check (status in ('open', 'sent', 'declined')),
  film_url text,
  answered_by uuid references auth.users,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---- athlete socials ------------------------------------------------------------------------

create table if not exists public.athlete_socials (
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  network text not null check (network in ('x', 'instagram', 'tiktok', 'youtube', 'hudl', 'maxpreps', '247', 'on3', 'facebook')),
  handle text not null check (length(handle) <= 100),
  primary key (athlete_slug, network)
);

-- ---- recruiter attention --------------------------------------------------------------------

create table if not exists public.recruiter_views (
  recruiter_id uuid not null references auth.users on delete cascade,
  athlete_slug text not null references public.athletes(slug) on delete cascade,
  school_slug text not null,
  day date not null default current_date,
  primary key (recruiter_id, athlete_slug, day)
);

-- Distinct recruiters per school over the last 30 days. Counts only, never names.
create or replace function public.school_attention()
returns table (school_slug text, recruiters bigint)
language sql stable security definer set search_path = public as $$
  select school_slug, count(distinct recruiter_id) from public.recruiter_views where day > current_date - 30 group by 1
$$;

-- ---- notifications --------------------------------------------------------------------------

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users on delete cascade,
  email boolean not null default true,
  sms boolean not null default false,
  push boolean not null default true,
  -- kinds turned off, e.g. {"recruiter_star"}
  muted text[] not null default '{}',
  quiet_from time,
  quiet_to time,
  updated_at timestamptz not null default now()
);

-- ---- school wants board and board items -----------------------------------------------------

create table if not exists public.school_wants (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  sport text, -- null for the whole school
  title text not null check (length(title) <= 120),
  detail text check (length(detail) <= 500),
  est_cost_cents int,
  suggested_by uuid references auth.users,
  status text not null default 'open' check (status in ('open', 'funded', 'done', 'declined', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.school_want_votes (
  want_id uuid not null references public.school_wants(id) on delete cascade,
  voter_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (want_id, voter_id)
);

create or replace view public.school_want_tally with (security_invoker = false) as
  select w.id, w.school_slug, w.sport, w.title, w.detail, w.est_cost_cents, w.status, w.created_at, count(v.voter_id)::int as votes
  from public.school_wants w left join public.school_want_votes v on v.want_id = w.id
  where w.status <> 'hidden'
  group by w.id;

-- What the school board is voting on, posted by staff with a link to the agenda.
create table if not exists public.board_items (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  meeting_on date not null,
  title text not null,
  summary text,
  agenda_url text,
  outcome text,
  posted_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- ---- row level security ---------------------------------------------------------------------

alter table public.recruiter_needs enable row level security;
alter table public.tape_submissions enable row level security;
alter table public.meet_requests enable row level security;
alter table public.film_requests enable row level security;
alter table public.athlete_socials enable row level security;
alter table public.recruiter_views enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.school_wants enable row level security;
alter table public.school_want_votes enable row level security;
alter table public.board_items enable row level security;

drop policy if exists "needs are public" on public.recruiter_needs;
create policy "needs are public" on public.recruiter_needs for select using (true);
drop policy if exists "recruiters post needs" on public.recruiter_needs;
create policy "recruiters post needs" on public.recruiter_needs for all using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid() and public.is_verified_recruiter());

drop policy if exists "families send tapes" on public.tape_submissions;
create policy "families send tapes" on public.tape_submissions for insert with check (sent_by = auth.uid());
drop policy if exists "tapes seen by both sides" on public.tape_submissions;
create policy "tapes seen by both sides" on public.tape_submissions for select using (recruiter_id = auth.uid() or public.is_family(athlete_slug));
drop policy if exists "recruiters mark tapes" on public.tape_submissions;
create policy "recruiters mark tapes" on public.tape_submissions for update using (recruiter_id = auth.uid());

drop policy if exists "recruiters ask to meet" on public.meet_requests;
create policy "recruiters ask to meet" on public.meet_requests for insert with check (recruiter_id = auth.uid() and public.is_verified_recruiter() and status = 'pending');
drop policy if exists "meets seen by both sides" on public.meet_requests;
create policy "meets seen by both sides" on public.meet_requests for select using (recruiter_id = auth.uid() or public.is_family(athlete_slug));
drop policy if exists "family answers meets" on public.meet_requests;
create policy "family answers meets" on public.meet_requests for update using (public.is_family(athlete_slug) or recruiter_id = auth.uid());

drop policy if exists "recruiters ask for film" on public.film_requests;
create policy "recruiters ask for film" on public.film_requests for insert with check (recruiter_id = auth.uid() and public.is_verified_recruiter() and status = 'open');
drop policy if exists "film requests seen by both sides" on public.film_requests;
create policy "film requests seen by both sides" on public.film_requests for select using (recruiter_id = auth.uid() or public.is_school_staff(school_slug));
drop policy if exists "coaches answer film" on public.film_requests;
create policy "coaches answer film" on public.film_requests for update using (public.is_school_staff(school_slug));

drop policy if exists "socials public on released profiles" on public.athlete_socials;
create policy "socials public on released profiles" on public.athlete_socials for select using (exists (select 1 from public.athletes a where a.slug = athlete_slug and a.media_release) or public.is_family(athlete_slug));
drop policy if exists "family keeps socials" on public.athlete_socials;
create policy "family keeps socials" on public.athlete_socials for all using (public.is_family(athlete_slug)) with check (public.is_family(athlete_slug));

drop policy if exists "recruiters log views" on public.recruiter_views;
create policy "recruiters log views" on public.recruiter_views for insert with check (recruiter_id = auth.uid() and public.is_verified_recruiter());
drop policy if exists "own views" on public.recruiter_views;
create policy "own views" on public.recruiter_views for select using (recruiter_id = auth.uid());

drop policy if exists "own prefs" on public.notification_prefs;
create policy "own prefs" on public.notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "wants visible" on public.school_wants;
create policy "wants visible" on public.school_wants for select using (status <> 'hidden' or public.is_school_staff(school_slug));
drop policy if exists "suggest a want" on public.school_wants;
create policy "suggest a want" on public.school_wants for insert with check (suggested_by = auth.uid() and status = 'open');
drop policy if exists "staff manage wants" on public.school_wants;
create policy "staff manage wants" on public.school_wants for update using (public.is_school_staff(school_slug));
drop policy if exists "one vote each" on public.school_want_votes;
create policy "one vote each" on public.school_want_votes for insert with check (voter_id = auth.uid());
drop policy if exists "take back a vote" on public.school_want_votes;
create policy "take back a vote" on public.school_want_votes for delete using (voter_id = auth.uid());
drop policy if exists "own votes" on public.school_want_votes;
create policy "own votes" on public.school_want_votes for select using (voter_id = auth.uid());

drop policy if exists "board items public" on public.board_items;
create policy "board items public" on public.board_items for select using (true);
drop policy if exists "staff post board items" on public.board_items;
create policy "staff post board items" on public.board_items for insert with check (posted_by = auth.uid() and public.is_school_staff(school_slug));

grant execute on function public.school_attention() to anon, authenticated;
grant select on public.school_want_tally to anon, authenticated;

-- Tell the other side when something needs an answer.
create or replace function public.on_scouting_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'meet_requests' and tg_op = 'INSERT' then
    perform public.notify_family(new.athlete_slug, 'meet_request', jsonb_build_object('kind', new.kind, 'at', new.proposed_at));
  elsif tg_table_name = 'meet_requests' and new.status <> old.status then
    insert into public.notifications (user_id, kind, body) values (new.recruiter_id, 'meet_' || new.status, jsonb_build_object('athlete', new.athlete_slug));
  elsif tg_table_name = 'tape_submissions' and tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, body) values (new.recruiter_id, 'tape', jsonb_build_object('athlete', new.athlete_slug));
  elsif tg_table_name = 'tape_submissions' and new.more_requested_at is distinct from old.more_requested_at then
    perform public.notify_family(new.athlete_slug, 'tape_more', '{}'::jsonb);
  elsif tg_table_name = 'film_requests' and tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, body)
      select p.id, 'film_request', jsonb_build_object('sport', new.sport, 'games', new.games) from public.profiles p
      where p.school_slug = new.school_slug and p.verified_at is not null and p.role::text in ('coach', 'athletic director');
  elsif tg_table_name = 'film_requests' and new.status <> old.status then
    insert into public.notifications (user_id, kind, body) values (new.recruiter_id, 'film_' || new.status, jsonb_build_object('url', new.film_url));
  end if;
  return new;
end $$;
drop trigger if exists meet_notify on public.meet_requests;
create trigger meet_notify after insert or update on public.meet_requests for each row execute function public.on_scouting_event();
drop trigger if exists tape_notify on public.tape_submissions;
create trigger tape_notify after insert or update on public.tape_submissions for each row execute function public.on_scouting_event();
drop trigger if exists film_notify on public.film_requests;
create trigger film_notify after insert or update on public.film_requests for each row execute function public.on_scouting_event();
