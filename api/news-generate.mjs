import {SUPABASE,requireAdmin,sourceUrl,draftSlug,plain,getSource,escapeHtml,send,HttpError} from '../lib/news-utils.mjs';
import {generateGeminiDraft,GEMINI_NEWS_MODEL} from '../lib/news-gemini.mjs';
const inFlight=new Set();
export default async function handler(req,res){
 let lock,usage=null,cost=null;
 try{
  if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new HttpError(403,'Open Peppermoon Admin to generate a draft.');
  const {user,headers}=await requireAdmin(req);
  if(!process.env.GEMINI_API_KEY)throw new HttpError(503,'Gemini is not connected yet. Add GEMINI_API_KEY in Vercel Production and redeploy.');
  if(process.env.NEWS_AI_DISABLED==='true')throw new HttpError(503,'AI drafting is paused. No AI call was made.');
  let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body||JSON.stringify(body).length>24000)throw new HttpError(400,'The selected source is too large.');
  if(body.approved!==true)throw new HttpError(400,'Approve this story before generating a draft.');
  const url=sourceUrl(body.url),title=plain(body.title).slice(0,250),category=body.category;
  if(!title||!['Gaming','Movies','TV Series'].includes(category))throw new HttpError(400,'Choose a title and category.');
  const slug=draftSlug(title,url),candidate=user.id+':'+slug;if(inFlight.has(candidate))throw new HttpError(409,'This story is already generating. Please wait.');lock=candidate;inFlight.add(lock);
  const lookup=new URL(SUPABASE+'/rest/v1/articles');lookup.searchParams.set('slug','eq.'+slug);lookup.searchParams.set('select','id,title,status');
  const existingResponse=await fetch(lookup,{headers,signal:AbortSignal.timeout(5000)});if(!existingResponse.ok)throw new HttpError(502,'Could not check existing drafts. No AI request was sent.');const [existing]=await existingResponse.json();if(existing)return send(res,200,{article:existing,reused:true});
  let source='';try{const html=await getSource(url);const article=(html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)||html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)||[])[1];if(article)source=plain(article).slice(0,12000)}catch{}
  const supplied=plain(body.notes||'').slice(0,7000),excerpt=plain(body.excerpt||'').slice(0,2500);
  const facts=(source||excerpt)+(supplied?'\nEditor-provided facts: '+supplied:'');
  if(facts.length<200)throw new HttpError(422,'The source did not provide enough readable text. Paste the key facts into the source notes and try again. No AI call was made.');
  const result=await generateGeminiDraft({source_url:url,source_title:title,category,source_material:facts.slice(0,14500)});
  const {draft}=result;usage=result.usage;
  const content='<div data-peppermoon-ai-draft="true">'+draft.paragraphs.map(p=>'<p>'+escapeHtml(p)+'</p>').join('')+'<p>Source: <a href="'+escapeHtml(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(new URL(url).hostname.replace(/^www\./,''))+'</a></p></div>';
  const payload={title:plain(draft.title).slice(0,250),slug,category,summary:plain(draft.summary).slice(0,600),content,author:'Peppermoon',status:'draft',featured:false,show_on_homepage:false,featured_image:null,published_at:null,updated_at:new Date().toISOString()};
  const saved=await fetch(SUPABASE+'/rest/v1/articles',{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)});
  if(!saved.ok)throw new HttpError(502,'The AI draft was generated but could not be saved. Check your connection before trying again; another generation may incur a charge.');const [article]=await saved.json();
  send(res,200,{article:{id:article.id,title:article.title,status:article.status},review_notes:draft.review_notes,usage,cost,provider:'gemini',model:GEMINI_NEWS_MODEL});
 }catch(error){usage=error.usage||usage;send(res,error.status||500,{error:error.status?error.message:'The request could not be completed. Nothing was published.',usage,cost})}finally{if(lock)inFlight.delete(lock)}
}
