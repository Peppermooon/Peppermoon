-- PEPPERMOON COMMENTS + REPLIES
-- Run this in Supabase > SQL Editor > New query.

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id bigint references public.comments(id) on delete cascade,
  body text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint comments_status_check
    check (status in ('published','hidden'))
);

create index if not exists comments_post_id_idx
on public.comments(post_id);

create index if not exists comments_parent_id_idx
on public.comments(parent_comment_id);

create index if not exists comments_created_at_idx
on public.comments(created_at);

alter table public.comments enable row level security;


-- Anyone can read published comments/replies.
drop policy if exists "Public can read published comments"
on public.comments;

create policy "Public can read published comments"
on public.comments
for select
to anon, authenticated
using (status = 'published');


-- Logged-in user can create only their own comment/reply.
drop policy if exists "Users can create own comments"
on public.comments;

create policy "Users can create own comments"
on public.comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and status = 'published'
);


-- User can edit only their own comment/reply.
drop policy if exists "Users can update own comments"
on public.comments;

create policy "Users can update own comments"
on public.comments
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);


-- User can delete only their own comment/reply.
drop policy if exists "Users can delete own comments"
on public.comments;

create policy "Users can delete own comments"
on public.comments
for delete
to authenticated
using (auth.uid() = author_id);


-- Admin can read everything, including hidden comments.
drop policy if exists "Admins can read all comments"
on public.comments;

create policy "Admins can read all comments"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- Admin can update/moderate any comment.
drop policy if exists "Admins can update all comments"
on public.comments;

create policy "Admins can update all comments"
on public.comments
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- Admin can delete any comment.
drop policy if exists "Admins can delete all comments"
on public.comments;

create policy "Admins can delete all comments"
on public.comments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);


-- Maintain updated_at.
create or replace function public.set_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists comments_set_updated_at
on public.comments;

create trigger comments_set_updated_at
before update
on public.comments
for each row
execute function public.set_comments_updated_at();
