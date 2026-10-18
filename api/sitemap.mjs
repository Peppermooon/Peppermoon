import {publishedGuides} from '../lib/guides-store.mjs';
const ORIGIN='https://thepeppermoon.com';
const SUPABASE='https://bgzlqvbvmstebdsnzmqv.supabase.co';
const KEY='sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-';
const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
async function published(table,fields){
 const rows=[];
 for(let offset=0;;offset+=1000){
  const url=new URL(SUPABASE+'/rest/v1/'+table);
  for(const [key,value] of Object.entries({select:fields,status:'eq.published',order:'id.asc',offset:String(offset),limit:'1000'}))url.searchParams.set(key,value);
  const response=await fetch(url,{headers:{apikey:KEY},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Sitemap lookup failed');
  const batch=await response.json();rows.push(...batch);
  if(rows.length>49996)throw new Error('Sitemap index required');
  if(batch.length<1000)return rows;
 }
}
export default async function handler(req,res){
 try{
  const [articles,ratings,posts,{guides}]=await Promise.all([published('articles','slug,published_at'),published('pepper_ratings','slug,updated_at'),published('posts','slug,created_at'),publishedGuides()]);
  const STATIC_GUIDE_ROUTES=['','/community','/ratings','/about','/guides'];
  const entries=new Map(STATIC_GUIDE_ROUTES.map(path=>[ORIGIN+path,'']));
  const add=(items,prefix,dateKey,clean=false)=>{for(const item of items){if(!item.slug)continue;const slug=clean?item.slug.replace(/^pepper-draft-/,''):item.slug;const url=ORIGIN+prefix+encodeURIComponent(slug);const date=item[dateKey]?new Date(item[dateKey]):null;entries.set(url,date&&!Number.isNaN(date.valueOf())?date.toISOString():'')}};
  add(articles,'/articles/','published_at');add(ratings,'/ratings/','updated_at',true);add(posts,'/posts/','created_at');add(guides,'/guides/','updated_at');add(guides,'/guides/','updated_at');add(guides,'/guides/','updated_at');
  if(entries.size>50000)throw new Error('Sitemap index required');
  const body='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...entries].map(([loc,date])=>'<url><loc>'+xml(loc)+'</loc>'+(date?'<lastmod>'+xml(date)+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>';
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  res.statusCode=200;res.end(body);
 }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');res.end('Sitemap temporarily unavailable');}
}

