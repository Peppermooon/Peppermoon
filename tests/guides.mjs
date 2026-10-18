import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import seeds from '../data/guides-seed.mjs';
import {validateGuide,mediaMatches,renderGuideBody,safeImageUrl} from '../assets/guides-core.mjs';
import {renderPage} from '../lib/guides-render.mjs';
import {publishedGuides} from '../lib/guides-store.mjs';
import handler from '../api/guides.mjs';

test('all 17 imported guides remain publishable, including game and screen orders',()=>{
 assert.equal(seeds.length,17);
 for(const seed of seeds){const g=validateGuide(seed);assert.ok(g.release_sections.some(s=>s.items.length));assert.ok(g.story_sections.length);if(g.collection==='games')assert.ok([...g.release_sections,...g.story_sections].flatMap(s=>s.items).some(x=>x.type==='game'));}
 const ff=seeds.find(g=>g.slug==='final-fantasy');assert.ok(ff.story_sections.flatMap(s=>s.items).some(x=>x.title==='Advent Children'&&x.type==='movie'));
});
test('overlapping Star Wars shows stay separate at the same position',()=>{
 const items=seeds.find(g=>g.slug==='star-wars').story_sections.flatMap(s=>s.items);
 const andor=items.find(i=>i.title==='Andor'),rebels=items.find(i=>i.title==='Star Wars Rebels');
 assert.equal(andor.rank,rebels.rank);assert.notEqual(andor.title,rebels.title);assert.match(andor.notes,/separate series/);
});
test('movies-only and TV-only work for every mixed screen guide and MCU alternate timelines',()=>{
 for(const g of seeds.filter(g=>g.collection==='screen'))for(const order of ['release','story']){
  const sections=g[order+'_sections'];const all=sections.flatMap(s=>s.items);
  for(const type of ['movie','tv']){const filtered=all.filter(i=>mediaMatches(i.type,type));assert.equal(filtered.length,all.filter(i=>i.type===type).length);assert.ok(filtered.every(i=>i.type===type));}
 }
 const mcu=seeds.find(g=>g.slug==='marvel-cinematic-universe');assert.ok(mcu.release_sections[0].items.some(i=>i.type==='tv'));assert.ok(mcu.story_sections.some(s=>s.heading.includes('Alternate')));
});
test('rendered user content cannot inject markup or unsafe image URLs',()=>{
 const g=validateGuide({...seeds[0],title:'<script>alert(1)</script>',intro:'<img src=x onerror=alert(1)>',notes:'javascript:alert(1)\n\nSource: https://example.com/story',image_url:'https://example.com/cover.jpg'});
 const html=renderPage({guide:g});assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;script&gt;/);assert.match(html,/rel="noopener noreferrer"/);
 for(const url of ['javascript:alert(1)','data:image/svg+xml,test','//evil.example/cover','http://example.com/a'])assert.throws(()=>safeImageUrl(url));
 assert.equal(safeImageUrl('/assets/cover.jpg'),'/assets/cover.jpg');
});
test('guide pages preserve the common navigation, favicon, cover and canonical URL',()=>{
 const html=renderPage({guide:{...seeds[0],image_url:'https://example.com/cover.jpg'}});
 assert.match(html,/href="\/favicon.png"/);assert.match(html,/EVERY UNIVERSE. IN ORDER./);assert.match(html,/href="https:\/\/thepeppermoon.com\/guides\/star-wars"/);assert.match(html,/property="og:image" content="https:\/\/example.com\/cover.jpg"/);
 assert.match(renderGuideBody(seeds[0]),/data-order-panel="story"/);
});
test('published lookup always filters status and only uses seed fallback for a missing table',async()=>{
 let url;
 const empty=await publishedGuides(async input=>{url=new URL(input);return new Response('[]',{status:200});});
 assert.equal(url.searchParams.get('status'),'eq.published');assert.deepEqual(empty.guides,[]);assert.equal(empty.setupRequired,false);
 const missing=await publishedGuides(async()=>new Response(JSON.stringify({code:'PGRST205'}),{status:404}));assert.equal(missing.guides.length,17);assert.equal(missing.setupRequired,true);
 await assert.rejects(()=>publishedGuides(async()=>new Response(JSON.stringify({code:'42501'}),{status:403})));
 await assert.rejects(()=>publishedGuides(async()=>{throw Error('network unavailable');}));
});
test('an unpublished or unknown guide returns 404 instead of reviving its static copy',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('[]',{status:200});
 try{const res={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};await handler({method:'GET',query:{slug:'star-wars'}},res);assert.equal(res.statusCode,404);assert.match(res.headers['Cache-Control'],/no-store/);assert.match(res.body,/Guide not found/);}finally{globalThis.fetch=original;}
});
test('new franchise URLs route to the guide renderer while CSS and JS remain static',()=>{
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));
 const resolve=url=>config.routes.find(r=>r.src&&new RegExp('^(?:'+r.src+')$').test(url));
 assert.equal(resolve('/guides/new-franchise').dest,'/api/guides?slug=$1');
 assert.equal(resolve('/guides').dest,'/api/guides');assert.equal(resolve('/guides/star-wars-watch-order.html').status,308);
 assert.equal(resolve('/guides/styles.css'),undefined);assert.equal(resolve('/assets/admin-guides.js'),undefined);
});
test('editing validation catches incomplete publishing, invalid positions and URL changes',()=>{
 assert.throws(()=>validateGuide({...seeds[0],slug:'../../other'}));
 assert.throws(()=>validateGuide({...seeds[0],release_sections:[]}));
 assert.throws(()=>validateGuide({...seeds[0],story_sections:[]}));
 assert.throws(()=>validateGuide({...seeds[0],release_sections:[{heading:'Release',note:'',items:[{rank:0,title:'Example',type:'movie'}]}]}));
});
