(async()=>{
 const track=document.getElementById('featuredTrack'),region=document.getElementById('featuredArticles'),message=document.getElementById('featuredMessage'),controls=document.getElementById('featuredControls'),dots=document.getElementById('featuredDots'),prev=document.getElementById('featuredPrev'),next=document.getElementById('featuredNext');
 if(!track)return;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 try{
 const client=window.supabase.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co','sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
 const {data,error}=await client.from('articles').select('slug,title,summary,category,featured_image').eq('status','published').eq('show_on_homepage',true).eq('featured',true).order('published_at',{ascending:false,nullsFirst:false}).order('id',{ascending:false});
 if(error)throw error;
 if(!data?.length){region.hidden=true;region.style.setProperty('display','none','important');return;}
 data.forEach((item,index)=>{
 const link=el('a','featured-slide');link.href=location.hostname.endsWith('github.io')?'article.html?slug='+encodeURIComponent(item.slug):'/article/'+encodeURIComponent(item.slug);link.setAttribute('aria-label',item.title);link.setAttribute('aria-roledescription','slide');
 const img=el('img','');const type={'Gaming':'gaming','Movies':'movies','TV Series':'tv'}[item.category]||'entertainment';const fallback='assets/news-'+type+'.svg';img.src=fallback;
 try{const url=new URL(item.featured_image);if(url.protocol==='https:')img.src=url.href;}catch{}
 img.alt='';img.loading=index?'lazy':'eager';img.onerror=()=>{img.onerror=null;img.src=fallback;};
 const copy=el('div','featured-copy');copy.append(el('span','featured-category',item.category||'Peppermoon'),el('h2','',item.title));if(item.summary)copy.append(el('p','',item.summary));copy.append(el('span','featured-read','Read article →'));link.append(img,copy);track.append(link);
 const dot=el('button','');dot.type='button';dot.setAttribute('aria-label','Show article '+(index+1));dot.addEventListener('click',()=>go(index));dots.append(dot);
 });
 const current=()=>Math.max(0,Math.min(data.length-1,Math.round(track.scrollLeft/Math.max(1,track.clientWidth))));
 function go(index){track.scrollTo({left:Math.max(0,Math.min(data.length-1,index))*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 function sync(){const index=current();prev.disabled=index===0;next.disabled=index===data.length-1;Array.from(dots.children).forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));}
 prev.addEventListener('click',()=>go(current()-1));next.addEventListener('click',()=>go(current()+1));
 track.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',()=>{const index=Array.from(dots.children).findIndex(d=>d.getAttribute('aria-current')==='true');go(Math.max(0,index));});
 track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(current()+(event.key==='ArrowRight'?1:-1));}});
 message.hidden=true;controls.hidden=data.length<2;sync();
 }catch{message.textContent='Featured articles could not be loaded. Browse the latest articles below.';}finally{track.setAttribute('aria-busy','false');}
})();