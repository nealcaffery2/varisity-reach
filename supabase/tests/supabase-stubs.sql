-- Stand-ins for the schemas Supabase provides (auth, storage, realtime), so CI can
-- run the migrations against a bare Postgres and prove they apply twice cleanly.
create role authenticated; create role anon;
create schema auth; create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create function auth.role() returns text language sql as $$ select 'anon' $$;
create schema storage; create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create publication supabase_realtime;
