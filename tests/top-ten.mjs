import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync,cpSync} from 'node:fs';
import {topTenLists} from '../data/top-ten.mjs';
import {findList,listPath,renderTopTenPage} from '../lib/top-ten-render.mjs';
import handler from '../api/top-ten.mjs';
const template=readFileSync(new URL('../ratings.html',import.meta.url),'utf8');
assert.equal(topTenLists.length,47);
assert.equal(topTenLists.reduce((sum,l)=>sum+l.items.length,0),470);
assert.deepEqual(topTenLists.filter(l=>l.medium==='gaming').map(l=>l.genre).filter(g=>['Drama','Romance','Animation','Musical'].includes(g)),[]);
for(const list of topTenLists){
 assert.equal(list.items.length,10);assert.deepEqual(list.items.map(i=>i.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert(list.items.every(i=>i.title&&i.description.length>60&&/^\d{4}$/.test(i.year)));
 const html=renderTopTenPage(template,list);
 assert.equal((html.match(/class="tt-card"/g)||[]).length,10);
 assert.equal((html.match(/class="tt-card-body"/g)||[]).length,10);
 assert(html.includes('https://thepeppermoon.com'+listPath(list)));
 assert(!html.includes('src="assets/'));assert(!html.includes('src="assets/ratings.js'));
 assert(html.includes('id="pmUserTrigger"'));assert(html.includes('id="pmAuthModal"'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema.numberOfItems,10);
}
function response(){return {statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}}}
let res=response();handler({url:'/api/top-ten?medium=movies&genre=action'},res);assert.equal(res.statusCode,200);assert(res.body.includes('Terminator 2'));
res=response();handler({url:'/api/top-ten?medium=gaming&genre=romance'},res);assert.equal(res.statusCode,404);
const cfg=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));assert(cfg.routes.some(r=>r.dest==='/api/top-ten?medium=$1&genre=$2'));assert.equal(cfg.functions['api/top-ten.mjs'].includeFiles,'ratings.html');
const baseRoute=cfg.routes.find(r=>r.src==='/top-10/(movies|tv|gaming)/?');assert.equal(baseRoute.status,308);assert.equal(baseRoute.headers.Location,'/top-10/$1/action');
for(const medium of ['movies','tv','gaming'])assert(new RegExp('^'+baseRoute.src+'$').test('/top-10/'+medium));
console.log('Passed: 47 lists, 470 descriptions, clean routes, schema, auth shell and invalid category handling.');
