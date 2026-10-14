-- Photo and video marketplace, media partners and sponsors on live games,
-- pledges on the wants board, and the weekly fun awards (Shakiest Camera,
-- Loudest Parent). Idempotent: safe to run twice. Needs 003_scouting.sql.

-- ---- creators and coverage requests ----------------------------------------------------------

create table if not exists public.media_creators (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  kind text not null default 'photographer' check (kind in ('photographer', 'videographer', 'both')),
  home_town text,
  travel_miles int not null default 30,
  portfolio_url text,
  bio text check (length(bio) <= 500),
  -- Stripe Connect account that receives the creator's share of each license.
  stripe_account text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- A coach (or AD) asks for someone to shoot a game.
create table if not exists public.coverage_requests (
  id uuid primary key default gen_random_uuid(),
  school_slug text not null references public.schools(slug),
  requested_by uuid not null references auth.users,
  sport text not null,
  game_ref text, -- games.id or a short description
  game_on date not null,
  location text,
  needs text check (length(needs) <= 500), -- "Senior night, every senior with family"
  pay_cents int not null default 0 check (pay_cents >= 0),
  status text not null default 'open' check (status in ('open', 'claimed', 'done', 'cancelled')),
  claimed_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- What creators upload. Full-size files live in a private bucket; the
-- preview the public sees is the creator's own watermarked or low-res copy.
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users on delete cascade,
  school_slug text not null references public.schools(slug),
  request_id uuid references public.coverage_requests(id) on delete set null,
  sport text,
  kind text not null check (kind in ('photo', 'video')),
  original_path text not null,
  preview_path text not null,
  caption text check (length(caption) <= 280),
  credit_name text not null,
  minors_shown boolean not null default true,
  release_on_file boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.media_licenses (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.media_items(id),
  buyer_id uuid references auth.users,
  buyer_org text,
  use text not null check (use in ('personal', 'school-web', 'editorial', 'commercial')),
  price_cents int not null,
  creator_cents int not null,
  school_cents int not null,
  stripe_session text unique,
  created_at timestamptz not null default now()
);

-- ---- media partners and sponsors on games ---------------------------------------------------

create table if not exists public.media_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- "WSMI Radio", "The Journal-News"
  kind text not null check (kind in ('newspaper', 'radio', 'tv', 'stream', 'school')),
  website text,
  school_slugs text[] not null default '{}',
  created_by uuid references auth.users,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- A partner links its broadcast, stream, live blog or recap to a game.
create table if not exists public.game_partner_links (
  game_id text not null,
  partner_id uuid not null references public.media_partners(id) on delete cascade,
  kind text not null check (kind in ('radio', 'stream', 'live blog', 'recap', 'photos')),
  url text not null,
  added_by uuid references auth.users,
  created_at timestamptz not null default now(),
  primary key (game_id, partner_id, kind)
);

-- A business sponsors a game to sit at the top of the watch list. The money
-- goes to the school, and the school says up front what it will buy with it.
create table if not exists public.game_sponsors (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  school_slug text not null references public.schools(slug),
  sponsor_name text not null,
  cents int not null check (cents >= 2500),
  pledge text not null check (length(pledge) <= 200), -- "New helmets for the JV"
  want_id uuid references public.school_wants(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  stripe_session text unique,
  created_at timestamptz not null default now()
);

-- ---- pledges on the wants board -------------------------------------------------------------

create table if not exists public.want_pledges (
  id uuid primary key default gen_random_uuid(),
  want_id uuid not null references public.school_wants(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  by_kind text not null check (by_kind in ('faculty', 'booster', 'sponsor', 'family')),
  name text not null,
  cents int check (cents >= 0),
  hours int check (hours >= 0),
  note text check (length(note) <= 280),
  created_at timestamptz not null default now()
);

-- ---- fun awards -----------------------------------------------------------------------------

create table if not exists public.award_entries (
  id uuid primary key default gen_random_uuid(),
  award text not null check (award in ('shakiest-camera', 'loudest-parent')),
  week date not null,
  school_slug text references public.schools(slug),
  reel_id text,
  video_path text,
  caption text check (length(caption) <= 200),
  submitted_by uuid not null references auth.users,
  -- Nobody gets named without saying yes: the person filmed or shouted about agrees first.
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.award_votes (
  voter_id uuid not null references auth.users on delete cascade,
  award text not null,
  week date not null,
  entry_id uuid not null references public.award_entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (voter_id, award, week)
);

create or replace view public.award_tally with (security_invoker = false) as
  select e.id, e.award, e.week, e.school_slug, e.reel_id, e.caption, e.created_at, count(v.voter_id)::int as votes
  from public.award_entries e left join public.award_votes v on v.entry_id = e.id
  where e.status = 'approved'
  group by e.id;

-- ---- row level security ---------------------------------------------------------------------

alter table public.media_creators enable row level security;
alter table public.coverage_requests enable row level security;
alter table public.media_items enable row level security;
alter table public.media_licenses enable row level security;
alter table public.media_partners enable row level security;
alter table public.game_partner_links enable row level security;
alter table public.game_sponsors enable row level security;
alter table public.want_pledges enable row level security;
alter table public.award_entries enable row level security;
alter table public.award_votes enable row level security;

drop policy if exists "creators public" on public.media_creators;
create policy "creators public" on public.media_creators for select using (true);
drop policy if exists "own creator profile" on public.media_creators;
create policy "own creator profile" on public.media_creators for insert with check (user_id = auth.uid() and verified_at is null and stripe_account is null);
drop policy if exists "edit creator profile" on public.media_creators;
create policy "edit creator profile" on public.media_creators for update using (user_id = auth.uid());

drop policy if exists "requests public" on public.coverage_requests;
create policy "requests public" on public.coverage_requests for select using (true);
drop policy if exists "coaches request coverage" on public.coverage_requests;
create policy "coaches request coverage" on public.coverage_requests for insert with check (requested_by = auth.uid() and status = 'open' and public.is_school_staff(school_slug));
drop policy if exists "manage coverage" on public.coverage_requests;
create policy "manage coverage" on public.coverage_requests for update using (
  public.is_school_staff(school_slug) or (status = 'open' and exists (select 1 from public.media_creators c where c.user_id = auth.uid()))
);

drop policy if exists "approved media public" on public.media_items;
create policy "approved media public" on public.media_items for select using (status = 'approved' or creator_id = auth.uid() or public.is_school_staff(school_slug));
drop policy if exists "creators upload" on public.media_items;
create policy "creators upload" on public.media_items for insert with check (creator_id = auth.uid() and status = 'pending' and exists (select 1 from public.media_creators c where c.user_id = auth.uid()));
drop policy if exists "staff review media items" on public.media_items;
create policy "staff review media items" on public.media_items for update using (public.is_school_staff(school_slug));

-- Licenses are written by the Stripe webhook only.
drop policy if exists "license parties" on public.media_licenses;
create policy "license parties" on public.media_licenses for select using (
  buyer_id = auth.uid() or exists (select 1 from public.media_items i where i.id = item_id and (i.creator_id = auth.uid() or public.is_school_staff(i.school_slug)))
);

drop policy if exists "partners public" on public.media_partners;
create policy "partners public" on public.media_partners for select using (true);
drop policy if exists "add a partner" on public.media_partners;
create policy "add a partner" on public.media_partners for insert with check (created_by = auth.uid() and verified_at is null);

drop policy if exists "partner links public" on public.game_partner_links;
create policy "partner links public" on public.game_partner_links for select using (true);
drop policy if exists "partners link games" on public.game_partner_links;
create policy "partners link games" on public.game_partner_links for insert with check (
  added_by = auth.uid() and exists (select 1 from public.media_partners p where p.id = partner_id and (p.created_by = auth.uid() or public.my_role() in ('coach', 'athletic director', 'reporter')))
);

-- Sponsors are written by checkout and the webhook; paid ones are public.
drop policy if exists "paid sponsors public" on public.game_sponsors;
create policy "paid sponsors public" on public.game_sponsors for select using (status = 'paid' or public.is_school_staff(school_slug));

drop policy if exists "pledges public" on public.want_pledges;
create policy "pledges public" on public.want_pledges for select using (true);
drop policy if exists "make a pledge" on public.want_pledges;
create policy "make a pledge" on public.want_pledges for insert with check (
  user_id = auth.uid() and (by_kind <> 'faculty' or public.is_school_staff((select school_slug from public.school_wants w where w.id = want_id)))
);

drop policy if exists "approved entries public" on public.award_entries;
create policy "approved entries public" on public.award_entries for select using (status = 'approved' or submitted_by = auth.uid());
drop policy if exists "enter an award" on public.award_entries;
create policy "enter an award" on public.award_entries for insert with check (submitted_by = auth.uid() and status = 'pending' and consent);
drop policy if exists "vote once a week per award" on public.award_votes;
create policy "vote once a week per award" on public.award_votes for insert with check (voter_id = auth.uid());
drop policy if exists "own award votes" on public.award_votes;
create policy "own award votes" on public.award_votes for select using (voter_id = auth.uid());

grant select on public.award_tally to anon, authenticated;

-- ---- storage --------------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('media-originals', 'media-originals', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('media-previews', 'media-previews', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('award-clips', 'award-clips', false) on conflict (id) do nothing;

drop policy if exists "creators upload originals" on storage.objects;
create policy "creators upload originals" on storage.objects for insert to authenticated with check (
  bucket_id in ('media-originals', 'media-previews') and exists (select 1 from public.media_creators c where c.user_id = auth.uid())
);
drop policy if exists "upload award clips" on storage.objects;
create policy "upload award clips" on storage.objects for insert to authenticated with check (bucket_id = 'award-clips');
