-- Fixes from the review of 004: release flags, coverage claims, award votes
-- and moderation, private media previews, pledge privacy, partner links,
-- payout ledger, and school payout ids. Idempotent: safe to run twice.

-- ---- media items: only reviewers record a family release ------------------------------------

drop policy if exists "creators upload" on public.media_items;
create policy "creators upload" on public.media_items for insert with check (
  creator_id = auth.uid() and status = 'pending' and release_on_file = false
  and exists (select 1 from public.media_creators c where c.user_id = auth.uid())
);

-- Previews stay private until staff approve the item; approved previews are
-- readable by anyone through a signed URL or the select policy below.
update storage.buckets set public = false where id = 'media-previews';
drop policy if exists "creators upload originals" on storage.objects;
create policy "creators upload originals" on storage.objects for insert to authenticated with check (
  bucket_id in ('media-originals', 'media-previews')
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (select 1 from public.media_creators c where c.user_id = auth.uid())
);
drop policy if exists "approved previews readable" on storage.objects;
create policy "approved previews readable" on storage.objects for select using (
  bucket_id = 'media-previews' and exists (select 1 from public.media_items i where i.preview_path = name and i.status = 'approved')
);
drop policy if exists "creators read own files" on storage.objects;
create policy "creators read own files" on storage.objects for select to authenticated using (
  bucket_id in ('media-originals', 'media-previews') and split_part(name, '/', 1) = auth.uid()::text
);

-- ---- coverage: creators claim open requests, staff manage their own ------------------------

drop policy if exists "manage coverage" on public.coverage_requests;
drop policy if exists "staff manage coverage" on public.coverage_requests;
create policy "staff manage coverage" on public.coverage_requests for update using (public.is_school_staff(school_slug)) with check (public.is_school_staff(school_slug));
drop policy if exists "creators claim coverage" on public.coverage_requests;
create policy "creators claim coverage" on public.coverage_requests for update
  using (status = 'open' and exists (select 1 from public.media_creators c where c.user_id = auth.uid()))
  with check (status = 'claimed' and claimed_by = auth.uid());

-- ---- awards: votes must match the entry; moderators review ----------------------------------

drop policy if exists "vote once a week per award" on public.award_votes;
create policy "vote once a week per award" on public.award_votes for insert with check (
  voter_id = auth.uid()
  and exists (select 1 from public.award_entries e where e.id = entry_id and e.award = award_votes.award and e.week = award_votes.week and e.status = 'approved')
);

create or replace function public.is_moderator(school text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false) or (school is not null and public.is_school_staff(school))
$$;

drop policy if exists "approved entries public" on public.award_entries;
create policy "approved entries public" on public.award_entries for select using (status = 'approved' or submitted_by = auth.uid() or public.is_moderator(school_slug));
drop policy if exists "moderators review entries" on public.award_entries;
create policy "moderators review entries" on public.award_entries for update using (public.is_moderator(school_slug));
drop policy if exists "moderators watch clips" on storage.objects;
create policy "moderators watch clips" on storage.objects for select to authenticated using (
  bucket_id = 'award-clips' and exists (select 1 from public.award_entries e where e.video_path = name and (public.is_moderator(e.school_slug) or e.submitted_by = auth.uid() or e.status = 'approved'))
);

-- ---- pledges: totals are public, names are not ----------------------------------------------

drop policy if exists "pledges public" on public.want_pledges;
drop policy if exists "pledge parties" on public.want_pledges;
create policy "pledge parties" on public.want_pledges for select using (
  user_id = auth.uid() or public.is_school_staff((select school_slug from public.school_wants w where w.id = want_id))
);
create or replace view public.want_pledge_totals with (security_invoker = false) as
  select want_id, coalesce(sum(cents), 0)::int as cents, coalesce(sum(hours), 0)::int as hours, bool_or(by_kind = 'faculty') as faculty, count(*)::int as pledges
  from public.want_pledges group by want_id;
grant select on public.want_pledge_totals to anon, authenticated;

-- ---- partner links: verified people only, and they can update their own --------------------

drop policy if exists "partners link games" on public.game_partner_links;
create policy "partners link games" on public.game_partner_links for insert with check (
  added_by = auth.uid()
  and (public.my_role() in ('coach', 'athletic director', 'reporter', 'admin')
       or exists (select 1 from public.media_partners p where p.id = partner_id and p.created_by = auth.uid() and p.verified_at is not null))
);
drop policy if exists "partners relink games" on public.game_partner_links;
create policy "partners relink games" on public.game_partner_links for update using (added_by = auth.uid()) with check (added_by = auth.uid());

-- ---- payout ledger: each share is tracked until Stripe confirms the transfer ----------------

create table if not exists public.license_payouts (
  license_id uuid not null references public.media_licenses(id) on delete cascade,
  recipient text not null check (recipient in ('creator', 'school')),
  amount_cents int not null check (amount_cents >= 0),
  destination text,
  source_charge text,
  transfer_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  last_error text,
  updated_at timestamptz not null default now(),
  primary key (license_id, recipient)
);
alter table public.license_payouts enable row level security;
-- No policies: only the service role (webhook, payouts sweep) reads or writes it.

-- ---- school payout ids: readable by the service role only ----------------------------------

-- Row level security cannot hide a column, so the public roles get every
-- column of schools except stripe_account.
revoke select on public.schools from anon, authenticated;
grant select (slug, name, town, state, classification, mascot, colors, payee_name, created_at) on public.schools to anon, authenticated;
