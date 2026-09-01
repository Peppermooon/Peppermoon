-- PEPPERMOON V7 — COMMUNITY POST SLUGS

alter table public.posts
add column if not exists slug text;

update public.posts
set slug =
  trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'))
  || '-' || id::text
where slug is null or slug = '';

create unique index if not exists posts_slug_unique_idx
on public.posts(slug);
