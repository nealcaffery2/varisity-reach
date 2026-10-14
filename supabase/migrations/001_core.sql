-- Varsity Reach core schema. Idempotent: safe to run twice.
-- Reads are public where the site is public. Every write that matters goes
-- through an edge function (service role) that checks who is asking.

create extension if not exists pgcrypto;

-- ---- people ----------------------------------------------------------------------------------

do $$ begin
  create type role_kind as enum ('fan', 'staff', 'coach', 'athletic director', 'reporter', 'official scorer', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.schools (
  slug text primary key,
  name text not null,
  town text not null,
  state text not null,
  classification text not null,
  mascot text not null,
  colors jsonb not null default '{}'::jsonb,
  -- Stripe Connect account for the school or booster club. Set by an admin after onboarding.
  stripe_account text,
  payee_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role role_kind not null default 'fan',
  school_slug text references public.schools(slug),
  outlet text,
  verified_at timestamptz,
  -- 0 to 1. Community scoring weight; moves after each final (lib/consensus.ts updateTrust).
  trust numeric(4,3) not null default 0.5 check (trust between 0.05 and 1),
  created_at timestamptz not null default now()
);

-- Every new sign-in gets a fan profile; verification raises the role later.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  role role_kind not null,
  name text not null,
  email text not null,
  school_slug text,
  outlet text,
  proof_url text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---- athletes ---------------------------------------------------------------------------------

create table if not exists public.athletes (
  slug text primary key,
  school_slug text not null references public.schools(slug),
  first text not null,
  last text not null,
  grad_year int,
  sports text[] not null default '{}',
  position text,
  jersey int,
  height_in int,
  weight_lb int,
  gpa numeric(3,2),
  act int,
  sat int,
  measurables jsonb not null default '[]'::jsonb,
  seasons jsonb not null default '[]'::jsonb,
  records jsonb not null default '[]'::jsonb,
  awards text[] not null default '{}',
  bio text,
  -- A profile shows publicly only once the family's media release is on file.
  media_release boolean not null default false,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.roster_imports (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  sport text not null,
  coach_id uuid not null references public.profiles(id),
  source text,
  rows jsonb not null,
  created_at timestamptz not null default now()
);

-- ---- games and community scoring ------------------------------------------------------------

create table if not exists public.games (
  id text primary key,
  sport text not null,
  level text not null default 'Varsity',
  home_school text references public.schools(slug),
  home_name text not null,
  away_school text references public.schools(slug),
  away_name text not null,
  kickoff timestamptz not null,
  venue text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'final'))
);

create table if not exists public.score_reports (
  id bigint generated always as identity primary key,
  game_id text not null references public.games(id) on delete cascade,
  reporter_id text not null, -- auth uid, or a device id for signed-out fans
  role text not null,
  trust numeric(4,3) not null,
  home int not null check (home between 0 and 300),
  away int not null check (away between 0 and 300),
  period text,
  photo_path text,
  photo_verified boolean not null default false,
  lock boolean not null default false,
  final boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists score_reports_game_at on public.score_reports (game_id, at);

create table if not exists public.game_streams (
  id bigint generated always as identity primary key,
  game_id text not null references public.games(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'facebook', 'twitch', 'instagram', 'tiktok')),
  url text not null check (url ~ '^https://'),
  by_name text not null default 'A fan in the stands',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---- spotlight --------------------------------------------------------------------------------

create table if not exists public.underdog_votes (
  week date not null,
  athlete_slug text not null,
  voter_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (week, voter_id)
);

-- ---- fundraising --------------------------------------------------------------------------------

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  title text not null,
  kind text not null,
  sport text,
  need text not null,
  story text,
  goal_cents int not null check (goal_cents >= 500),
  ends_on date not null,
  payee_kind text not null default 'booster' check (payee_kind in ('school', 'booster')),
  match_by text,
  match_ratio numeric(4,2),
  match_up_to_cents int,
  created_by uuid references public.profiles(id) default auth.uid(),
  approved_by uuid references public.profiles(id),
  status text not null default 'pending_approval' check (status in ('pending_approval', 'live', 'closed', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id),
  amount_cents int not null check (amount_cents >= 500),
  name text,
  anonymous boolean not null default false,
  message text,
  squad text,
  stripe_session text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.gold_cards (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  holder text not null,
  email text not null,
  season text not null,
  token text not null,
  stripe_session text unique,
  created_at timestamptz not null default now()
);

-- ---- row level security -----------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_requests enable row level security;
alter table public.athletes enable row level security;
alter table public.roster_imports enable row level security;
alter table public.games enable row level security;
alter table public.score_reports enable row level security;
alter table public.game_streams enable row level security;
alter table public.underdog_votes enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.gold_cards enable row level security;

-- Public reads.
drop policy if exists "schools are public" on public.schools;
create policy "schools are public" on public.schools for select using (true);
drop policy if exists "games are public" on public.games;
create policy "games are public" on public.games for select using (true);
drop policy if exists "reports are public" on public.score_reports;
create policy "reports are public" on public.score_reports for select using (true);
drop policy if exists "streams are public" on public.game_streams;
create policy "streams are public" on public.game_streams for select using (true);
drop policy if exists "released athletes are public" on public.athletes;
create policy "released athletes are public" on public.athletes for select using (media_release);
drop policy if exists "live campaigns are public" on public.campaigns;
create policy "live campaigns are public" on public.campaigns for select using (status = 'live' or created_by = auth.uid());
drop policy if exists "gifts are public" on public.donations;
create policy "gifts are public" on public.donations for select using (true);
drop policy if exists "votes are countable" on public.underdog_votes;
create policy "votes are countable" on public.underdog_votes for select using (true);

-- Signed-in writes that need no extra check.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid());
drop policy if exists "ask to be verified" on public.verification_requests;
create policy "ask to be verified" on public.verification_requests for insert with check (true);
drop policy if exists "pair a stream" on public.game_streams;
create policy "pair a stream" on public.game_streams for insert with check (verified = false);
drop policy if exists "vote once a week" on public.underdog_votes;
create policy "vote once a week" on public.underdog_votes for insert with check (voter_id = auth.uid());
drop policy if exists "coaches post needs" on public.campaigns;
create policy "coaches post needs" on public.campaigns for insert with check (
    status = 'pending_approval'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.verified_at is not null and p.role in ('coach', 'athletic director') and p.school_slug = campaigns.school_slug)
  );

-- score_reports, athletes, roster_imports, donations and gold_cards have no
-- insert policy on purpose: only edge functions (service role) write them.

-- Gift totals per campaign, for the progress bars.
create or replace view public.campaign_totals with (security_invoker = true) as
  select c.id, coalesce(sum(d.amount_cents), 0)::int as raised_cents, count(d.id)::int as donors
  from public.campaigns c left join public.donations d on d.campaign_id = c.id
  group by c.id;

-- Realtime for the live scoreboard.
do $$ begin
  alter publication supabase_realtime add table public.score_reports;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- Scoreboard photos: private bucket, uploads only into a game's folder.
insert into storage.buckets (id, name, public) values ('score-photos', 'score-photos', false) on conflict (id) do nothing;
drop policy if exists "upload scoreboard photos" on storage.objects;
create policy "upload scoreboard photos" on storage.objects for insert to authenticated with check (bucket_id = 'score-photos');
