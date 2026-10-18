from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
seed=json.loads((root/'data/guides-seed.json').read_text())
schema='''-- Run once in your Peppermoon Supabase project: SQL Editor → New query → Run.
-- Creates guide storage and imports the current 17 guides. Existing edits are preserved.
begin;
create table if not exists public.pepper_guides (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null check (length(trim(title)) between 1 and 180),
 franchise text not null check (length(trim(franchise)) between 1 and 160),
 collection text not null check (collection in ('screen','games')),
 summary text not null default '' check (length(summary)<=600),
 intro text not null default '' check (length(intro)<=30000),
 notes text not null default '' check (length(notes)<=50000),
 image_url text not null default '',
 image_alt text not null default '' check (length(image_alt)<=250),
 display_order integer not null default 0 check (display_order between 0 and 9999),
 status text not null default 'draft' check (status in ('draft','published')),
 release_sections jsonb not null default '[]'::jsonb check (jsonb_typeof(release_sections)='array'),
 story_sections jsonb not null default '[]'::jsonb check (jsonb_typeof(story_sections)='array'),
 created_by uuid references auth.users(id) default auth.uid(),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint pepper_guides_published_content check (status<>'published' or (length(trim(summary))>0 and jsonb_array_length(release_sections)>0))
);
create index if not exists pepper_guides_public_order on public.pepper_guides (status,display_order,franchise);
create or replace function public.pepper_guides_touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end;
$$;
drop trigger if exists pepper_guides_updated_at on public.pepper_guides;
create trigger pepper_guides_updated_at before update on public.pepper_guides for each row execute function public.pepper_guides_touch_updated_at();
alter table public.pepper_guides enable row level security;
revoke all on public.pepper_guides from anon,authenticated;
grant select on public.pepper_guides to anon,authenticated;
grant insert,update on public.pepper_guides to authenticated;
drop policy if exists pepper_guides_public_read on public.pepper_guides;
create policy pepper_guides_public_read on public.pepper_guides for select to anon,authenticated using (status='published');
drop policy if exists pepper_guides_admin on public.pepper_guides;
create policy pepper_guides_admin on public.pepper_guides for all to authenticated
 using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'))
 with check (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
-- The existing article-images bucket is used for guide cover uploads under admin permissions.
insert into public.pepper_guides (slug,title,franchise,collection,summary,intro,notes,image_url,image_alt,status,display_order,release_sections,story_sections,published_at)
select slug,title,franchise,collection,summary,intro,notes,image_url,image_alt,status,display_order,release_sections,story_sections,now()
from jsonb_to_recordset($peppermoon_guides_seed$'''
columns='''$peppermoon_guides_seed$::jsonb) as g(slug text,title text,franchise text,collection text,summary text,intro text,notes text,image_url text,image_alt text,status text,display_order integer,release_sections jsonb,story_sections jsonb)
on conflict (slug) do nothing;
commit;
'''
(root/'SUPABASE-GUIDES-SETUP.sql').write_text(schema+json.dumps(seed,ensure_ascii=False)+columns)
config=json.loads((root/'vercel.json').read_text())
routes=config['routes'];start=next(i for i,r in enumerate(routes) if r.get('src','').startswith('/guides'))
routes=[r for r in routes if not r.get('src','').startswith('/guides')]
guide_routes=[{'src':'/guides/index\\.html','status':308,'headers':{'Location':'/guides'}}]
for p in (root/'guides').glob('*.html'):
 if p.name=='index.html':continue
 s=p.read_text();slug=re.search(r'canonical" href="https://thepeppermoon.com/guides/([^"]+)',s)[1]
 guide_routes.append({'src':'/guides/'+p.name.replace('.','\\.'),'status':308,'headers':{'Location':'/guides/'+slug}})
guide_routes += [{'src':'/guides/','status':308,'headers':{'Location':'/guides'}},{'src':'/guides','dest':'/api/guides'},{'src':'/guides/([a-z0-9]+(?:-[a-z0-9]+)*)/','status':308,'headers':{'Location':'/guides/$1'}},{'src':'/guides/([a-z0-9]+(?:-[a-z0-9]+)*)','dest':'/api/guides?slug=$1'}]
routes[start:start]=guide_routes;config['routes']=routes;(root/'vercel.json').write_text(json.dumps(config,indent=2)+'\n')
for name in ['admin.html','admin-ratings.html']:
 p=root/name;s=p.read_text()
 if 'href="admin-guides.html"' not in s:
  target='<a class="btn small" href="admin-ratings.html">Manage Pepper Ratings</a>' if name=='admin.html' else '<a class="btn small" href="admin.html">Article Admin</a>'
  assert target in s
  s=s.replace(target,target+'<a class="btn small" href="admin-guides.html">Manage Guides</a>')
 p.write_text(s)
s=(root/'api/sitemap.mjs').read_text()
if "import {publishedGuides}" not in s:s="import {publishedGuides} from '../lib/guides-store.mjs';\n"+s
s=s.replace("const [articles,ratings,posts]=await Promise.all([published('articles','slug,published_at'),published('pepper_ratings','slug,updated_at'),published('posts','slug,created_at')]);", "const [articles,ratings,posts,{guides}]=await Promise.all([published('articles','slug,published_at'),published('pepper_ratings','slug,updated_at'),published('posts','slug,created_at'),publishedGuides()]);")
s=re.sub(r'const STATIC_GUIDE_ROUTES=\[.*?\];',"const STATIC_GUIDE_ROUTES=['','/community','/ratings','/about','/guides'];",s)
s=s.replace("add(posts,'/posts/','created_at');", "add(posts,'/posts/','created_at');add(guides,'/guides/','updated_at');")
(root/'api/sitemap.mjs').write_text(s)
