-- ============================================================
-- PEPPERMOON V6 — PROFILE AVATAR STORAGE
-- Run this in Supabase SQL Editor once.
-- ============================================================

-- Existing profiles table already contains:
-- username, display_name, bio, avatar_url, updated_at
-- The commands below are safe if those columns already exist.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists updated_at timestamptz default now();

-- Username format protection at database level.
-- Existing invalid usernames must be corrected before adding the constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username ~ '^[a-z0-9_]{3,30}$');
  end if;
exception
  when check_violation then
    raise notice 'Username format constraint was not added because an existing username does not match the new format.';
end $$;

-- Ensure users can update only their own profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ------------------------------------------------------------
-- PROFILE AVATARS STORAGE BUCKET
-- ------------------------------------------------------------

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public can view avatar files.
drop policy if exists "Public can view profile avatars" on storage.objects;
create policy "Public can view profile avatars"
on storage.objects for select
to public
using (bucket_id = 'profile-avatars');

-- A logged-in user can upload only inside:
-- profile-avatars/<their-user-id>/...
drop policy if exists "Users can upload own profile avatars" on storage.objects;
create policy "Users can upload own profile avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own profile avatars" on storage.objects;
create policy "Users can update own profile avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own profile avatars" on storage.objects;
create policy "Users can delete own profile avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
