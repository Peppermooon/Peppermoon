import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {findList,renderTopTenPage} from '../lib/top-ten-render.mjs';
const root=new URL('../',import.meta.url);
const paths=['index.html','ratings.html','community.html','about.html','article.html','post.html','profile.html','rating.html','notifications.html'];
for(const path of paths){
 const html=readFileSync(new URL(path,root),'utf8');
 assert(!/(["'])((?:profile|notifications)\.html)/.test(html),path+' must not have relative account links');
 const header=html.match(/<header\b[\s\S]*?<\/header>/)[0];
 for(const base of ['https://thepeppermoon.com/','https://thepeppermoon.com/top-10/movies/action','https://thepeppermoon.com/articles/test-article','https://thepeppermoon.com/ratings/test-review']){
  for(const [,href] of header.matchAll(/href="([^"<>]*(?:profile|notifications)\.html[^"<>]*)"/g)){
   const u=new URL(href,base);assert(['/profile.html','/notifications.html'].includes(u.pathname),path+' '+u.href);
  }
 }
 if(path!=='community.html'){
  assert(html.includes("location.href='/profile.html#saved'"),path+' saved handler');
  assert(html.includes(".href='/profile.html?id='"),path+' resolved profile handler');
 }
 for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|application\/ld\+json|type="module"/.test(attrs))new vm.Script(body,{filename:path});
}
const page=renderTopTenPage(readFileSync(new URL('ratings.html',root),'utf8'),findList('movies','action'));
assert(page.includes('href="/notifications.html"'));assert(page.includes('href="/profile.html#saved"'));assert(page.includes("location.href='/profile.html#saved'"));
console.log('Passed Profile, Notifications and Saved links across nine public pages and the generated Top 10 page, including nested URL resolution and inline script syntax.');
