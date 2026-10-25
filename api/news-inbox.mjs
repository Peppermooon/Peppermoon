import {SOURCES,parseFeed,requireAdmin,readText,send,HttpError} from '../lib/news-utils.mjs';
import {GEMINI_NEWS_MODEL} from '../lib/news-gemini.mjs';
let cache=null;
export default async function handler(req,res){
 try{
  if(req.method!=='GET')throw new HttpError(405,'Method not allowed.');
  await requireAdmin(req);
  if(!cache||Date.now()-cache.time>15*60*1000){
   const results=await Promise.allSettled(SOURCES.map(async source=>{const r=await fetch(source.url,{headers:{'User-Agent':'PeppermoonNewsInbox/1.0'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('Feed unavailable');const items=parseFeed(await readText(r),source);if(!items.length)throw new Error('No readable feed entries');return items}));
   const seen=new Set(),titles=new Set(),items=[],warnings=[];
   results.forEach((result,i)=>{if(result.status==='rejected'){warnings.push(SOURCES[i].name+' feed is temporarily unavailable.');return}for(const item of result.value){const title=item.title.toLowerCase().replace(/[^a-z0-9]/g,'');if(seen.has(item.url)||titles.has(title))continue;seen.add(item.url);titles.add(title);items.push(item)}});
   items.sort((a,b)=>new Date(b.published_at||0)-new Date(a.published_at||0));
   cache={time:Date.now(),items,warnings};
  }
  send(res,200,{items:cache.items,warnings:cache.warnings,checked_at:new Date(cache.time).toISOString(),ai_ready:!!process.env.GEMINI_API_KEY&&process.env.NEWS_AI_DISABLED!=='true',ai_provider:'gemini',ai_model:GEMINI_NEWS_MODEL});
 }catch(error){send(res,error.status||503,{error:error.status?error.message:'News inbox could not be loaded. Please try again.'})}
}
