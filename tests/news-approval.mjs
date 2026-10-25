import assert from 'node:assert/strict';
import generate from '../api/news-generate.mjs';
import inbox from '../api/news-inbox.mjs';
import {sourceUrl,draftSlug,parseFeed} from '../lib/news-utils.mjs';
const feed='<rss><channel><item><title><![CDATA[New game announced]]></title><link>https://www.gamespot.com/articles/new-game/?utm_source=test</link><description><![CDATA[<p>Confirmed news &amp; details</p>]]></description><pubDate>Fri, 16 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>';
const parsed=parseFeed(feed,{name:'GameSpot',category:'Gaming'});assert.equal(parsed.length,1);assert.equal(parsed[0].excerpt,'Confirmed news & details');assert.equal(parsed[0].url,'https://www.gamespot.com/articles/new-game/');assert.equal(parsed[0].draft_slug,draftSlug(parsed[0].title,parsed[0].url));
for(const url of ['http://www.ign.com/news','https://127.0.0.1/','https://www.ign.com.evil.com/','https://user:pass@www.ign.com/','https://www.ign.com:444/'])assert.throws(()=>sourceUrl(url));
let saveError=false;
let calls=[],saved=null,role='admin',existing=false,shortSource=false,providerError=false,feedError=false;
const article={id:'draft-id',title:'Original headline',status:'draft'};
global.fetch=async (url,opts={})=>{
 url=String(url);calls.push({url,opts});
 if(url.includes('/auth/v1/user'))return new Response(JSON.stringify({id:'admin-id'}));
 if(url.includes('/rest/v1/profiles'))return new Response(JSON.stringify([{role}]));
 if(url.includes('/rest/v1/articles')&&opts.method==='POST'){if(saveError)return new Response('{}',{status:503});saved=JSON.parse(opts.body);return new Response(JSON.stringify([article]))}
 if(url.includes('/rest/v1/articles'))return new Response(JSON.stringify(existing?[article]:[]));
 if(url==='https://api.openai.com/v1/responses')throw Error('OpenAI must never be called');
 if(url.startsWith('https://generativelanguage.googleapis.com/')){
  if(providerError)return new Response('{}',{status:429});
  const draft={title:'Original headline',summary:'A checked summary',paragraphs:['Original news body <script>not executable</script>'],review_notes:['Check the release date.']};
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(draft)}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:70,totalTokenCount:170}}));
 }
 if(url.includes('feeds.ign.com'))return new Response('<html>Unavailable</html>');
 if(url.includes('/feed')||url.includes('/feeds/'))return new Response(feedError?'bad feed':feed);
 return new Response('<article><p>'+(shortSource?'Short text.':'Confirmed facts about the announced game, release platform, development studio and trailer. '.repeat(8))+'</p></article>');
};
const aiCalls=()=>calls.filter(c=>c.url.startsWith('https://generativelanguage.googleapis.com/')).length;
async function request(handler,patch={}){calls=[];saved=null;const headers={};let body;const res={setHeader:(k,v)=>headers[k]=v,end:b=>body=JSON.parse(b)};await handler({method:'POST',headers:{authorization:'Bearer fake-session-token',host:'thepeppermoon.com',origin:'https://thepeppermoon.com'},body:{approved:true,url:'https://www.gamespot.com/articles/new-game/',title:'New game announced',category:'Gaming',excerpt:''},...patch},res);return {status:res.statusCode,headers,body}}
delete process.env.GEMINI_API_KEY;
let r=await request(generate);assert.equal(r.status,503);assert.equal(aiCalls(),0);
process.env.GEMINI_API_KEY='test-only-not-a-real-key';
process.env.OPENAI_API_KEY='must-not-be-used';
r=await request(generate,{headers:{}});assert.equal(r.status,401);assert.equal(calls.length,0);
role='member';r=await request(generate);assert.equal(r.status,403);assert.equal(aiCalls(),0);role='admin';
r=await request(generate,{method:'GET'});assert.equal(r.status,405);assert.equal(calls.length,0);
r=await request(generate,{body:{approved:false}});assert.equal(r.status,400);assert.equal(aiCalls(),0);
shortSource=true;r=await request(generate);assert.equal(r.status,422);assert.equal(aiCalls(),0);shortSource=false;
existing=true;r=await request(generate);assert.equal(r.status,200);assert.equal(r.body.reused,true);assert.equal(aiCalls(),0);existing=false;
r=await request(generate);assert.equal(r.status,200);assert.equal(aiCalls(),1);assert.equal(saved.status,'draft');assert.equal(saved.show_on_homepage,false);assert.equal(saved.featured,false);assert.equal(saved.featured_image,null);assert.equal(saved.published_at,null);assert.ok(saved.content.includes('&lt;script&gt;'));assert.ok(saved.content.includes('Source:'));assert.ok(saved.content.includes('data-peppermoon-ai-draft'));assert.equal(r.body.usage.total_tokens,170);assert.equal(r.body.cost,null);assert.equal(r.body.provider,'gemini');assert.equal(r.body.model,'gemini-3.5-flash-lite');assert.equal(calls.some(c=>c.url.includes('/rpc/')),false);
const aiCall=calls.find(c=>c.url.startsWith('https://generativelanguage.googleapis.com/'));const payload=JSON.parse(aiCall.opts.body);assert.equal(aiCall.opts.headers['x-goog-api-key'],'test-only-not-a-real-key');assert(!aiCall.url.includes('key='));assert.equal(payload.tools,undefined);assert.equal(payload.generationConfig.thinkingConfig.thinkingLevel,'minimal');assert.ok(payload.generationConfig.maxOutputTokens<=2048);assert.equal(payload.generationConfig.responseFormat.text.mimeType,'APPLICATION_JSON');assert.deepEqual(payload.generationConfig.responseFormat.text.schema.required,['title','summary','paragraphs','review_notes']);
process.env.NEWS_AI_DISABLED='true';r=await request(generate);assert.equal(r.status,503);assert.equal(aiCalls(),0);delete process.env.NEWS_AI_DISABLED;
assert.ok(aiCall.url.endsWith('/gemini-3.5-flash-lite:generateContent'));assert.ok(payload.systemInstruction.parts[0].text.includes('ONLY the supplied facts'));
for(let i=0;i<22;i++){r=await request(generate);assert.equal(r.status,200);assert.equal(aiCalls(),1);assert.equal(calls.some(c=>c.url.includes('/rpc/')),false)}
saveError=true;r=await request(generate);assert.equal(r.status,502);assert.equal(r.body.cost,null);assert.equal(r.body.usage.total_tokens,170);assert.equal(aiCalls(),1);saveError=false;
providerError=true;r=await request(generate);assert.equal(r.status,429);assert.equal(saved,null);assert.equal(aiCalls(),1);assert.equal(calls.some(c=>c.url.includes('api.openai.com')),false);providerError=false;
r=await request(inbox,{method:'GET'});assert.equal(r.status,200);assert.equal(aiCalls(),0);assert.equal(r.body.ai_ready,true);assert.ok(r.body.warnings.some(w=>w.includes('IGN')));assert.ok(r.body.items.length>0);
delete process.env.GEMINI_API_KEY;
// An OpenAI key alone must not enable drafting or cause a paid fallback.
r=await request(generate);assert.equal(r.status,503);assert.equal(aiCalls(),0);
r=await request(inbox,{method:'GET'});assert.equal(r.body.ai_ready,false);assert.equal(r.body.ai_provider,'gemini');
delete process.env.OPENAI_API_KEY;
console.log('Passed RSS parsing, source restrictions, admin authorization, missing-key gating, explicit approval, short-source gating, draft reuse, private draft saving, HTML escaping, provider failure and zero-AI inbox checks.');

const {estimateNewsCost}=await import('../lib/news-cost.mjs');
assert.equal(estimateNewsCost(null),null);assert.equal(estimateNewsCost({input_tokens:1}),null);assert.equal(estimateNewsCost({input_tokens:1,output_tokens:1,input_tokens_details:{cached_tokens:2}}),null);
assert.ok(Math.abs(estimateNewsCost({input_tokens:1000,output_tokens:1000,input_tokens_details:{cached_tokens:500}}).usd-0.000555)<1e-12);
console.log('Passed cost calculation, cached token discount, missing usage and 23 consecutive requests without quota checks.');
