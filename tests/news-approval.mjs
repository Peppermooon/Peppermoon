import assert from 'node:assert/strict';
import generate from '../api/news-generate.mjs';
import inbox from '../api/news-inbox.mjs';
import {sourceUrl,draftSlug,parseFeed} from '../lib/news-utils.mjs';
const feed='<rss><channel><item><title><![CDATA[New game announced]]></title><link>https://www.gamespot.com/articles/new-game/?utm_source=test</link><description><![CDATA[<p>Confirmed news &amp; details</p>]]></description><pubDate>Fri, 16 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>';
const parsed=parseFeed(feed,{name:'GameSpot',category:'Gaming'});assert.equal(parsed.length,1);assert.equal(parsed[0].excerpt,'Confirmed news & details');assert.equal(parsed[0].url,'https://www.gamespot.com/articles/new-game/');assert.equal(parsed[0].draft_slug,draftSlug(parsed[0].title,parsed[0].url));
for(const url of ['http://www.ign.com/news','https://127.0.0.1/','https://www.ign.com.evil.com/','https://user:pass@www.ign.com/','https://www.ign.com:444/'])assert.throws(()=>sourceUrl(url));
let calls=[],saved=null,role='admin',existing=false,shortSource=false,providerError=false,feedError=false;
const article={id:'draft-id',title:'Original headline',status:'draft'};
global.fetch=async (url,opts={})=>{
 url=String(url);calls.push({url,opts});
 if(url.includes('/auth/v1/user'))return new Response(JSON.stringify({id:'admin-id'}));
 if(url.includes('/rest/v1/profiles'))return new Response(JSON.stringify([{role}]));
 if(url.includes('/rest/v1/articles')&&opts.method==='POST'){saved=JSON.parse(opts.body);return new Response(JSON.stringify([article]))}
 if(url.includes('/rest/v1/articles'))return new Response(JSON.stringify(existing?[article]:[]));
 if(url==='https://api.openai.com/v1/responses'){
  if(providerError)return new Response('{}',{status:429});
  const draft={title:'Original headline',summary:'A checked summary',paragraphs:['Original news body <script>not executable</script>'],review_notes:['Check the release date.']};
  return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(draft)}]}],usage:{input_tokens:100,output_tokens:70,total_tokens:170}}));
 }
 if(url.includes('feeds.ign.com'))return new Response('<html>Unavailable</html>');
 if(url.includes('/feed')||url.includes('/feeds/'))return new Response(feedError?'bad feed':feed);
 return new Response('<article><p>'+(shortSource?'Short text.':'Confirmed facts about the announced game, release platform, development studio and trailer. '.repeat(8))+'</p></article>');
};
const aiCalls=()=>calls.filter(c=>c.url==='https://api.openai.com/v1/responses').length;
async function request(handler,patch={}){calls=[];saved=null;const headers={};let body;const res={setHeader:(k,v)=>headers[k]=v,end:b=>body=JSON.parse(b)};await handler({method:'POST',headers:{authorization:'Bearer fake-session-token',host:'thepeppermoon.com',origin:'https://thepeppermoon.com'},body:{approved:true,url:'https://www.gamespot.com/articles/new-game/',title:'New game announced',category:'Gaming',excerpt:''},...patch},res);return {status:res.statusCode,headers,body}}
delete process.env.OPENAI_API_KEY;
let r=await request(generate);assert.equal(r.status,503);assert.equal(aiCalls(),0);
process.env.OPENAI_API_KEY='test-only-not-a-real-key';
r=await request(generate,{headers:{}});assert.equal(r.status,401);assert.equal(calls.length,0);
role='member';r=await request(generate);assert.equal(r.status,403);assert.equal(aiCalls(),0);role='admin';
r=await request(generate,{method:'GET'});assert.equal(r.status,405);assert.equal(calls.length,0);
r=await request(generate,{body:{approved:false}});assert.equal(r.status,400);assert.equal(aiCalls(),0);
shortSource=true;r=await request(generate);assert.equal(r.status,422);assert.equal(aiCalls(),0);shortSource=false;
existing=true;r=await request(generate);assert.equal(r.status,200);assert.equal(r.body.reused,true);assert.equal(aiCalls(),0);existing=false;
r=await request(generate);assert.equal(r.status,200);assert.equal(aiCalls(),1);assert.equal(saved.status,'draft');assert.equal(saved.show_on_homepage,false);assert.equal(saved.featured,false);assert.equal(saved.featured_image,null);assert.equal(saved.published_at,null);assert.ok(saved.content.includes('&lt;script&gt;'));assert.ok(saved.content.includes('Source:'));assert.ok(saved.content.includes('data-peppermoon-ai-draft'));assert.equal(r.body.usage.total_tokens,170);
const payload=JSON.parse(calls.find(c=>c.url==='https://api.openai.com/v1/responses').opts.body);assert.equal(payload.store,false);assert.equal(payload.reasoning.effort,'none');assert.ok(payload.max_output_tokens<=1800);
providerError=true;r=await request(generate);assert.equal(r.status,502);assert.equal(saved,null);providerError=false;
r=await request(inbox,{method:'GET'});assert.equal(r.status,200);assert.equal(aiCalls(),0);assert.equal(r.body.ai_ready,true);assert.ok(r.body.warnings.some(w=>w.includes('IGN')));assert.ok(r.body.items.length>0);
delete process.env.OPENAI_API_KEY;
console.log('Passed RSS parsing, source restrictions, admin authorization, missing-key gating, explicit approval, short-source gating, draft reuse, private draft saving, HTML escaping, provider failure and zero-AI inbox checks.');
