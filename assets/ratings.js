import {topTen,displayCategory} from './ratings-core.js';
const sb=window.supabase.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co','sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function cover(item,cls){const img=node('img',cls);const fallback='assets/news-'+({'Movies':'movies','Gaming':'gaming','TV Series':'tv'}[item.category]||'entertainment')+'.svg';img.src=fallback;try{const url=new URL(item.image_url);if(url.protocol==='https:')img.src=url.href}catch{}img.alt='';img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src=fallback};return img;}
function score(item){const el=node('div','pepper-score');el.append(node('strong','',Number(item.score).toFixed(1)),node('span','','/ 10 · Pepper Score'));return el;}
function card(item){const a=node('a','pepper-rating-card');a.href='/ratings/'+encodeURIComponent(item.slug.replace(/^pepper-draft-/,''));const body=node('div','rating-card-body');body.append(node('div','rating-card-meta',displayCategory(item.category)+(item.release_year?' · '+item.release_year:'')),node('h3','',item.title),score(item));if(item.summary)body.append(node('p','',item.summary));a.append(cover(item,'rating-cover'),body);return a;}
function readableError(error){return error?.code==='PGRST205'||error?.code==='42P01'?'Pepper Ratings is being set up. Reviews will appear here soon.':'Ratings could not be loaded. Please try again.';}
if($('ratingsGrid')){
 let items=[],category='All',loaded=false,loadError='';
 function listSection(type){
  const section=node('section','ratings-top');
  const title=node('h2','','Top 10 Peppermoon '+displayCategory(type));
  section.append(node('div','ratings-eyebrow','The Peppermoon picks'),title);
  const ranked=topTen(items,type),list=node('ol','rating-list');
  for(const item of ranked){const li=node('li',''),link=node('a','');link.href='/ratings/'+encodeURIComponent(item.slug.replace(/^pepper-draft-/,''));link.append(node('span','rank',String(item.top_rank)),node('span','list-title',item.title),node('span','list-score',Number(item.score).toFixed(1)+' / 10'));li.append(link);list.append(li);}
  section.append(list);
  if(!ranked.length)section.append(node('p','ratings-note','This list is coming soon.'));
  const dates=ranked.map(i=>new Date(i.updated_at).valueOf()).filter(Number.isFinite);
  if(dates.length)section.append(node('p','ratings-note','Updated '+new Date(Math.max(...dates)).toLocaleDateString()));
  return section;
 }
 function render(){
  const all=category==='All';
  $('ratingsSearchArea').hidden=all;
  $('ratingsGrid').hidden=all;
  $('ratingsTopLists').hidden=!all;
  $('ratingsGrid').replaceChildren();
  $('ratingsTopLists').replaceChildren();
  if(all){
   $('ratingsTopLists').append(...['Movies','Gaming','TV Series'].map(listSection));
   $('ratingsState').textContent=loadError || (!loaded?'Loading Top 10 lists…':'Our curated all-time favourites. List positions reflect editorial selection and may differ from score order.');
  }else{
   const term=$('ratingsSearch').value.trim().toLowerCase();
   const filtered=items.filter(item=>item.category===category&&item.title.toLowerCase().includes(term));
   $('ratingsGrid').append(...filtered.map(card));
   $('ratingsState').textContent=loadError || (!loaded?'Loading reviews…':filtered.length?filtered.length+' '+displayCategory(category).toLowerCase()+' editorial reviews':term?'No reviews match your search.':'Our first '+displayCategory(category).toLowerCase()+' reviews are coming soon.');
  }
 }
 async function load(){loaded=false;loadError='';$('ratingsRetry').hidden=true;render();try{
  const {data,error}=await sb.from('pepper_ratings').select('id,slug,title,category,release_year,score,summary,image_url,status,top_rank,updated_at').eq('status','published').order('score',{ascending:false}).order('title').range(0,499);
  if(error)throw error;items=(data||[]).sort((a,b)=>Number(b.score)-Number(a.score)||a.title.localeCompare(b.title));loaded=true;render();
 }catch(error){loadError=readableError(error);$('ratingsRetry').hidden=false;render();}}
 document.querySelectorAll('[data-rating-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.ratingCategory;document.querySelectorAll('[data-rating-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
 $('ratingsSearch').addEventListener('input',render);
 $('ratingsRetry').addEventListener('click',load);
 load();
}
if($('ratingDetail')){
 const slug=window.PM_CONTENT_SLUG||new URLSearchParams(location.search).get('slug')||(location.pathname.startsWith('/ratings/')?decodeURIComponent(location.pathname.slice(9)):null);
 try{if(!slug)throw new Error('Missing review');const {data:item,error}=await sb.from('pepper_ratings').select('*').eq('slug',slug).eq('status','published').maybeSingle();if(error)throw error;if(!item){$('ratingDetail').textContent='This review is not available.';}else{document.title=item.title+' · Pepper Ratings | Peppermoon';const section=node('article','review-layout'),copy=node('div','');copy.append(node('div','ratings-eyebrow',displayCategory(item.category)+(item.release_year?' · '+item.release_year:'')),node('h1','review-title',item.title),score(item),node('p','ratings-note','Peppermoon Editorial Rating · This is our editorial opinion, not a community vote.'));if(item.summary)copy.append(node('p','ratings-note',item.summary));copy.append(node('h2','','Our review'),node('div','review-body',item.review),node('p','review-updated','Updated '+new Date(item.updated_at).toLocaleDateString()));section.append(cover(item,'review-cover'),copy);$('ratingDetail').replaceChildren(section);}}
 catch(error){$('ratingDetail').textContent=readableError(error);}
}
