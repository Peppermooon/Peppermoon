export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const slugify=value=>String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
export const mediaLabel=type=>({movie:'Movie',tv:'TV series',game:'Game'}[type]||'Movie');
export function safeImageUrl(value){
 const text=String(value||'').trim();if(!text)return '';
 if(/^\/(?!\/)[a-zA-Z0-9_/.%-]+$/.test(text))return text;
 try{const url=new URL(text);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
 throw new Error('Use an HTTPS image URL or upload an image.');
}
const bounded=(value,max,label)=>{const s=String(value??'').trim();if(s.length>max)throw new Error(label+' is too long.');return s;};
function sections(value,label){
 if(!Array.isArray(value)||value.length>30)throw new Error(label+' must contain up to 30 sections.');
 let total=0;
 return value.map(section=>{
  if(!Array.isArray(section.items))throw new Error('Each order section needs an entry list.');
  total+=section.items.length;if(total>400)throw new Error('Keep each order below 400 entries.');
  return {heading:bounded(section.heading,200,'Section heading'),note:bounded(section.note,12000,'Section note'),items:section.items.map((item,index)=>{
   const rank=Number(item.rank??index+1);if(!Number.isInteger(rank)||rank<1||rank>999)throw new Error('Entry positions must be whole numbers from 1 to 999.');
   if(!['movie','tv','game'].includes(item.type))throw new Error('Choose Movie, TV series or Game for every entry.');
   const title=bounded(item.title,1200,'Entry title');if(!title)throw new Error('Give every entry a title, or remove its empty row.');
   return {rank,title,year:bounded(item.year,60,'Release year'),type:item.type,notes:bounded(item.notes,6000,'Entry note')};
  })};
 });
}
export function validateGuide(input){
 const title=bounded(input.title,180,'Guide title'),franchise=bounded(input.franchise,160,'Franchise name'),slug=String(input.slug||'').trim();
 if(!title||!franchise)throw new Error('Enter a franchise name and guide title.');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>100)throw new Error('Use a URL name with lowercase letters, numbers and hyphens.');
 if(!['screen','games'].includes(input.collection))throw new Error('Choose Movies & TV or Games.');
 const display_order=Number(input.display_order||0);if(!Number.isInteger(display_order)||display_order<0||display_order>9999)throw new Error('Card position must be a whole number from 0 to 9999.');
 if(!['draft','published'].includes(input.status))throw new Error('Choose draft or published.');
 const guide={slug,title,franchise,collection:input.collection,summary:bounded(input.summary,600,'Card summary'),intro:bounded(input.intro,30000,'Introduction'),notes:bounded(input.notes,50000,'Extra notes'),image_url:safeImageUrl(input.image_url),image_alt:bounded(input.image_alt,250,'Image description'),display_order,status:input.status,release_sections:sections(input.release_sections||[],'Release order'),story_sections:sections(input.story_sections||[],'Story order')};
 if(guide.status==='published'&&(!guide.summary||!guide.release_sections.some(s=>s.items.length)))throw new Error('Publishing needs a card summary and at least one release-order entry.');
 if(guide.status==='published'&&!guide.story_sections.some(s=>s.items.length||s.note))throw new Error('Add a story order, or explain in a story section why there is no single timeline.');
 return guide;
}
function linkedText(text){return String(text).split(/(https?:\/\/[^\s)]+)/g).map(part=>/^https?:\/\//.test(part)?'<a href="'+escapeHtml(part)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(part)+'</a>':escapeHtml(part)).join('').replace(/\n/g,'<br>');}
export function paragraphs(value){return String(value||'').split(/\n\s*\n/).filter(p=>p.trim()).map(p=>'<p>'+linkedText(p)+'</p>').join('');}
function renderNotes(value){return String(value||'').split(/\n\s*\n/).filter(p=>p.trim()).map(p=>p.startsWith('## ')?'<h2>'+escapeHtml(p.slice(3))+'</h2>':'<p>'+linkedText(p)+'</p>').join('');}
export const mediaMatches=(type,media='both')=>media==='both'||type===media;
function renderSections(sections){return sections.map(section=>'<section class="guide-order-section" data-guide-section><h2>'+escapeHtml(section.heading)+'</h2>'+paragraphs(section.note)+'<ol>'+[...section.items].sort((a,b)=>a.rank-b.rank).map(item=>'<li value="'+item.rank+'" data-media="'+escapeHtml(item.type)+'"><strong>'+escapeHtml(item.title)+'</strong><span class="entry-meta">'+escapeHtml([item.year,mediaLabel(item.type)].filter(Boolean).join(' • '))+'</span>'+ (item.notes?'<p class="entry-note">'+linkedText(item.notes)+'</p>':'')+'</li>').join('')+'</ol></section>').join('');}
export function renderGuideBody(guide){
 const types=new Set([...guide.release_sections,...guide.story_sections].flatMap(s=>s.items.map(i=>i.type)));
 const both=types.has('movie')&&types.has('tv');
 const media=both?'<p class="control-label">Choose what to watch</p><div class="selector" role="group" aria-label="Choose movies and TV">'+[['movie','Movies only'],['tv','TV only'],['both','Movies + TV']].map(([value,label])=>'<button type="button" data-guide-media="'+value+'" aria-pressed="'+(value==='both')+'">'+label+'</button>').join('')+'</div>':'';
 return paragraphs(guide.intro)+'<div class="guide-controls">'+media+'<p class="control-label">Choose order</p><div class="selector" role="group" aria-label="Choose release or story order"><button type="button" data-guide-order-btn="release" aria-pressed="true">Release order</button><button type="button" data-guide-order-btn="story" aria-pressed="false">Story order</button></div><p class="guide-status" aria-live="polite">Release order</p></div><div data-order-panel="release">'+renderSections(guide.release_sections)+'</div><div data-order-panel="story" hidden>'+renderSections(guide.story_sections)+'</div><p id="guideEmptyFilter" hidden>No entries match this selection.</p>'+(guide.notes?'<section class="guide-extra-notes">'+(guide.notes.startsWith('## ')?'':'<h2>Guide notes & recommendations</h2>')+renderNotes(guide.notes)+'</section>':'')+'<noscript><style>[data-order-panel][hidden]{display:block!important}.guide-controls{display:none}</style></noscript>';
}
export function renderHubContent(guides){
 if(!guides.length)return '<p>No guides are published yet. Check back soon.</p>';
 return [['screen','Movies & TV'],['games','Games']].map(([collection,label])=>{
  const items=guides.filter(g=>g.collection===collection);if(!items.length)return '';
  return '<section><h2>'+escapeHtml(label)+'</h2><div class="grid">'+items.map(g=>'<a class="card" href="/guides/'+encodeURIComponent(g.slug)+'">'+(g.image_url?'<img class="guide-card-image" src="'+escapeHtml(safeImageUrl(g.image_url))+'" alt="'+escapeHtml(g.image_alt||g.franchise)+'" loading="lazy" width="800" height="450">':'')+'<span class="tag">'+escapeHtml(label)+'</span><h3>'+escapeHtml(g.franchise)+'</h3><p>'+escapeHtml(g.summary)+'</p><span class="read">Open guide →</span></a>').join('')+'</div></section>';
 }).join('');
}
