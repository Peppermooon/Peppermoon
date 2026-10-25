(()=>{
 const $=id=>document.getElementById(id);let items=[],aiReady=false,busy=false,selected=null;
 const dismissed=()=>{try{return new Set(JSON.parse(localStorage.getItem('pm-news-dismissed')||'[]'))}catch{return new Set()}};
 const message=(text,error=false)=>{const el=$('newsInboxMessage');el.textContent=text;el.style.color=error?'#e65069':''};
 async function call(path,options={}){const {data:{session}}=await sb.auth.getSession();if(!session)throw Error('Please sign in again.');const r=await fetch(path,{...options,headers:{Authorization:'Bearer '+session.access_token,...options.headers}});let data;try{data=await r.json()}catch{throw Error('Server unavailable. Please try again.')}if(!r.ok)throw Error((data.error||'Request failed')+costText(data.cost));return data}
 function costText(cost){return cost?' Estimated AI cost: US$'+Number(cost.usd).toFixed(6)+' ('+cost.input_tokens+' input / '+cost.output_tokens+' output tokens). Final charges: Google AI Studio billing.':''}
 function render(){
  const term=$('newsInboxSearch').value.trim().toLowerCase(),category=$('newsInboxCategory').value,hidden=dismissed();
  const visible=items.filter(i=>!hidden.has(i.url)&&(!category||category===i.category)&&(!term||(i.title+' '+i.source).toLowerCase().includes(term)));
  const root=$('newsInboxRows');root.replaceChildren();
  for(const item of visible){
   const card=document.createElement('article');card.className='news-inbox-item';
   const meta=document.createElement('p');meta.className='help';meta.textContent=item.source+' · '+item.category+(item.published_at?' · '+new Date(item.published_at).toLocaleString():'');
   const title=document.createElement('h3');title.textContent=item.title;
   const excerpt=document.createElement('p');excerpt.className='muted';excerpt.textContent=item.excerpt.slice(0,300);
   const actions=document.createElement('div');actions.className='actions';
   const source=document.createElement('a');source.className='btn small secondary';source.href=item.url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='Read original';actions.append(source);
   const draft=allArticles.find(a=>a.slug===item.draft_slug),generate=document.createElement('button');generate.type='button';generate.className='btn small primary';generate.textContent=draft?(draft.status==='published'?'Open article':'Review draft'):'Generate draft';generate.disabled=!draft&&!aiReady;
   generate.onclick=()=>{if(draft){window.editArticle(draft.id);return}selected=item;$('newsSourceTitle').textContent=item.title;$('newsSourceLink').href=item.url;$('newsSourceLink').textContent='Read original at '+item.source;$('newsSourceExcerpt').textContent=item.excerpt||'No source excerpt available.';$('newsSourceNotes').value='';$('newsDraftCategory').value=item.category;$('newsGenerateApproval').checked=false;$('newsGenerateError').textContent='';$('newsGenerateDialog').showModal()};actions.append(generate);
   const dismiss=document.createElement('button');dismiss.className='btn small secondary';dismiss.type='button';dismiss.textContent='Dismiss';dismiss.onclick=()=>{const set=dismissed();set.add(item.url);localStorage.setItem('pm-news-dismissed',JSON.stringify([...set].slice(-1000)));render()};actions.append(dismiss);
   card.append(meta,title,excerpt,actions);root.append(card);
  }
  if(!visible.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='No matching stories. Refresh later or restore dismissed items.';root.append(empty)}
 }
 async function load(){
  if($('dashboardView').classList.contains('hidden'))return;
  $('newsInboxRefresh').disabled=true;
  try{const data=await call('/api/news-inbox');items=data.items;aiReady=data.ai_ready;render();message((aiReady?'Gemini drafting is configured. Read the source, then approve a draft. Check Google AI Studio for quota and billing.':'News inbox is available. Gemini drafting is unavailable. Check GEMINI_API_KEY in Vercel Production and whether AI drafting is paused.')+' '+(data.warnings||[]).join(' ')+' Checked '+new Date(data.checked_at).toLocaleTimeString());}
  catch(error){message(error.message,true)}finally{$('newsInboxRefresh').disabled=false}
 }
 $('newsInboxRefresh').onclick=load;$('newsInboxSearch').oninput=render;$('newsInboxCategory').onchange=render;
 $('newsInboxRestore').onclick=()=>{localStorage.removeItem('pm-news-dismissed');render()};
 $('newsGenerateCancel').onclick=()=>{if(!busy)$('newsGenerateDialog').close()};
 $('newsGenerateDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 $('newsGenerateForm').onsubmit=async event=>{
  event.preventDefault();if(busy||!selected)return;if(!$('newsGenerateApproval').checked){$('newsGenerateError').textContent='Approve this story before generating.';return}
  busy=true;$('newsGenerateSubmit').disabled=true;$('newsGenerateCancel').disabled=true;$('newsGenerateSubmit').textContent='Generating…';$('newsGenerateError').textContent='';
  try{const result=await call('/api/news-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved:true,url:selected.url,title:selected.title,category:$('newsDraftCategory').value,excerpt:selected.excerpt,notes:$('newsSourceNotes').value})});await loadArticles();render();$('newsGenerateDialog').close();window.editArticle(result.article.id);const notes=(result.review_notes||[]).join(' ');showMsg($('editorMsg'),(result.reused?'Existing article opened. No new AI generation was needed.':'AI draft saved privately. Review the facts, add your image, then publish when ready.')+(notes?' Review notes: '+notes:'')+(result.cost?costText(result.cost):(result.usage?' Gemini tokens used: '+result.usage.total_tokens+'. Check Google AI Studio for quota and billing.':'')),'ok');}
  catch(error){$('newsGenerateError').textContent=error.message}
  finally{busy=false;$('newsGenerateSubmit').disabled=false;$('newsGenerateCancel').disabled=false;$('newsGenerateSubmit').textContent='Generate draft'}
 };
 document.addEventListener('pm-admin-ready',load);if(!$('dashboardView').classList.contains('hidden'))load();
 setInterval(()=>{if(document.visibilityState==='visible')load()},15*60*1000);
})();
