import {validateGuide,slugify,escapeHtml as e,safeImageUrl} from './guides-core.mjs';
const sb=window.supabase.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co','sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
const $=id=>document.getElementById(id);
const fields=['franchise','title','slug','collection','summary','display_order','image_url','image_alt','intro','notes'];
let session=null,items=[],editing=null,busy=false,ready=false,dirty=false,autoSlug=true,imageObjectUrl=null,authVersion=0;
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function markDirty(){dirty=true;}
function defaultSection(order){return {heading:order==='release'?'Release order':'Story order',note:'',items:[]};}
function showEditor(item=null,afterSave=false){
 if(busy&&!afterSave)return;
 if(dirty&&!confirm('Discard the unsaved guide changes?'))return;
 editing=item?structuredClone(item):{release_sections:[defaultSection('release')],story_sections:[defaultSection('story')],status:'draft'};
 $('guideForm').reset();for(const key of fields)$('edit_'+key).value=item?.[key]??(key==='collection'?'screen':key==='display_order'?Math.max(0,...items.map(i=>i.display_order||0))+1:'');
 $('edit_slug').readOnly=!!item?.id;delete $('edit_title').dataset.manual;autoSlug=!item;dirty=false;
 $('editorHeading').textContent=item?'Edit '+item.franchise:'New franchise guide';
 $('savedStatus').textContent=item?'Saved status: '+item.status:'New guide · Not saved yet';
 $('viewGuide').hidden=!item||item.status!=='published';if(item)$('viewGuide').href='/guides/'+encodeURIComponent(item.slug);
 $('editor').hidden=false;setOrderTab('release');renderSections('release');renderSections('story');previewImage();
 $('editor').scrollIntoView({behavior:'smooth',block:'start'});message('');setBusy(false);
}
function setOrderTab(order){for(const value of ['release','story']){$(value+'Tab').setAttribute('aria-selected',String(order===value));$(value+'Editor').hidden=order!==value;}}
function renderSections(order){
 const root=$(order+'Sections');root.replaceChildren();
 editing[order+'_sections'].forEach((section,sectionIndex)=>{
  const container=document.createElement('section');container.className='order-section';
  container.innerHTML='<div class="order-section-heading"><label>Section heading<input value="'+e(section.heading)+'" maxlength="200" data-section-field="heading"></label><button class="btn danger" type="button" data-remove-section>Remove section</button></div><label>Section explanation (optional)<textarea rows="3" data-section-field="note">'+e(section.note)+'</textarea></label><div class="entries"></div><button class="btn secondary" type="button" data-add-entry>+ Add entry</button>';
  container.querySelectorAll('[data-section-field]').forEach(input=>input.addEventListener('input',()=>{section[input.dataset.sectionField]=input.value;markDirty();}));
  container.querySelector('[data-remove-section]').addEventListener('click',()=>{if(section.items.length&&!confirm('Remove this section and its entries from the unsaved guide?'))return;editing[order+'_sections'].splice(sectionIndex,1);markDirty();renderSections(order);});
  container.querySelector('[data-add-entry]').addEventListener('click',()=>{section.items.push({rank:Math.max(0,...section.items.map(x=>Number(x.rank)||0))+1,title:'',year:'',type:$('edit_collection').value==='games'?'game':'movie',notes:''});markDirty();renderSections(order);const last=$(order+'Sections').children[sectionIndex].querySelector('.order-entry:last-child input[data-field="title"]');last?.focus();});
  const entryRoot=container.querySelector('.entries');
  section.items.forEach((entry,index)=>{
   const row=document.createElement('div');row.className='order-entry';
   row.innerHTML='<div class="entry-grid"><label>Position<input data-field="rank" type="number" min="1" max="999" step="1" value="'+e(entry.rank)+'"></label><label class="entry-title">Title / entry<input data-field="title" maxlength="1200" value="'+e(entry.title)+'" placeholder="Film, TV series, season or game title"></label><label>Release year<input data-field="year" maxlength="60" value="'+e(entry.year)+'" placeholder="2026 or 2019–2022"></label><label>Type<select data-field="type">'+[['movie','Movie'],['tv','TV series'],['game','Game']].map(([v,label])=>'<option value="'+v+'"'+(entry.type===v?' selected':'')+'>'+label+'</option>').join('')+'</select></label><label class="entry-notes">Notes / remake / overlap<textarea data-field="notes" rows="2">'+e(entry.notes)+'</textarea></label></div><div class="entry-actions"><button class="btn secondary" type="button" data-move="-1"'+(index===0?' disabled':'')+' aria-label="Move entry up">↑ Up</button><button class="btn secondary" type="button" data-move="1"'+(index===section.items.length-1?' disabled':'')+' aria-label="Move entry down">↓ Down</button><button class="btn danger" type="button" data-remove-entry>Remove entry</button></div>';
   row.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{entry[input.dataset.field]=input.dataset.field==='rank'?Number(input.value):input.value;markDirty();}));
   row.querySelector('[data-remove-entry]').addEventListener('click',()=>{section.items.splice(index,1);markDirty();renderSections(order);});
   row.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const target=index+Number(button.dataset.move);if(target<0||target>=section.items.length)return;const other=section.items[target];[entry.rank,other.rank]=[other.rank,entry.rank];[section.items[index],section.items[target]]=[other,entry];markDirty();renderSections(order);}));
   entryRoot.append(row);
  });
  root.append(container);
 });
}
function renderList(){
 const query=$('search').value.trim().toLowerCase(),collection=$('collectionFilter').value,status=$('statusFilter').value;
 const filtered=items.filter(item=>(!query||(item.title+' '+item.franchise).toLowerCase().includes(query))&&(!collection||item.collection===collection)&&(!status||item.status===status));
 $('guideCount').textContent=filtered.length+' of '+items.length+' guides';$('guideList').replaceChildren();
 for(const item of filtered){const card=document.createElement('article');card.className='guide-row';let image='';try{image=safeImageUrl(item.image_url);}catch{}
  card.innerHTML=(image?'<img src="'+e(image)+'" alt="'+e(item.image_alt||item.franchise)+'" loading="lazy">':'')+'<div class="details"><h3>'+e(item.franchise)+'</h3><p>'+e(item.collection==='games'?'Games':'Movies & TV')+' · Position '+e(item.display_order)+'</p><span class="badge '+(item.status==='published'?'published':'')+'">'+e(item.status)+'</span></div><button class="btn secondary" type="button">Edit</button>';
  card.querySelector('button').disabled=!ready||busy;card.querySelector('button').addEventListener('click',()=>showEditor(item));$('guideList').append(card);
 }
 if(!filtered.length)$('guideList').innerHTML='<p class="empty-list">'+(items.length?'No guides match your filters.':'No guides yet. Add your first franchise.')+'</p>';
}
async function load(){
 const {data,error}=await sb.from('pepper_guides').select('*').order('display_order',{ascending:true}).order('franchise',{ascending:true}).limit(1000);
 if(error){
  ready=false;$('newGuide').disabled=true;
  if(['PGRST205','42P01'].includes(error.code)){$('setupPanel').hidden=false;const seed=await import('../data/guides-seed.mjs');items=structuredClone(seed.default);message('One-time setup is needed before you can save guide changes.');renderList();return;}
  throw error;
 }
 ready=true;items=data||[];$('setupPanel').hidden=true;$('newGuide').disabled=false;renderList();
}
async function authorize(){
 const version=++authVersion;try{
  const {data,error}=await sb.auth.getSession();if(error)throw error;session=data.session;
  if(!session){$('dashboard').hidden=true;$('loginPanel').hidden=false;$('logout').hidden=true;$('authState').textContent='';return;}
  const profile=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
  if(version!==authVersion)return;
  if(profile.error||profile.data?.role!=='admin'){$('dashboard').hidden=true;$('loginPanel').hidden=false;$('logout').hidden=false;$('authState').textContent='This account is not authorized to manage Peppermoon Guides.';return;}
  $('loginPanel').hidden=true;$('dashboard').hidden=false;$('logout').hidden=false;$('authState').textContent='Signed in as '+session.user.email;await load();
 }catch(error){message(error.message||'Could not load guide editing.',true);$('authState').textContent='Please try again.';}
}
function previewImage(){
 if(imageObjectUrl){URL.revokeObjectURL(imageObjectUrl);imageObjectUrl=null;}
 const file=$('imageFile').files[0];let url='';if(file){imageObjectUrl=URL.createObjectURL(file);url=imageObjectUrl;}else{try{url=safeImageUrl($('edit_image_url').value);}catch{}}
 $('imagePreviewPanel').hidden=!url;if(url)$('imagePreview').src=url;else $('imagePreview').removeAttribute('src');
}
function setBusy(value){busy=value;document.querySelectorAll('#guideForm button,#guideForm input,#guideForm select,#guideForm textarea').forEach(control=>control.disabled=value||(control.tagName==='BUTTON'&&control.type==='submit'&&!ready));$('newGuide').disabled=value||!ready;document.querySelectorAll('.guide-row button').forEach(button=>button.disabled=value||!ready);}
async function imageUpload(file,slug){
 if(file.size>10*1024*1024)throw new Error('Choose an image smaller than 10 MB.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use a JPEG, PNG or WebP image.');
 let bitmap,temporaryUrl;
 if(typeof createImageBitmap==='function')bitmap=await createImageBitmap(file);
 else{temporaryUrl=URL.createObjectURL(file);bitmap=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not open that image.'));img.src=temporaryUrl;});}
 try{
  const width=bitmap.width||bitmap.naturalWidth,height=bitmap.height||bitmap.naturalHeight,scale=Math.min(1,1600/Math.max(width,height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.85));if(!blob)throw new Error('Could not prepare that image.');
  const path='guides-'+slug+'/cover-'+crypto.randomUUID()+'.jpg';
  const {error}=await sb.storage.from('article-images').upload(path,blob,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});if(error)throw error;
  return {path,url:sb.storage.from('article-images').getPublicUrl(path).data.publicUrl};
 }finally{bitmap.close?.();if(temporaryUrl)URL.revokeObjectURL(temporaryUrl);}
}
$('guideForm').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!ready||!session)return;setBusy(true);message('Saving guide…');let upload=null;
 try{
  const input={...editing};for(const key of fields)input[key]=$('edit_'+key).value;input.status=event.submitter?.value==='published'?'published':'draft';
  if(editing.id)input.slug=editing.slug;
  const payload=validateGuide(input);const file=$('imageFile').files[0];if(file){upload=await imageUpload(file,payload.slug);payload.image_url=upload.url;}
  payload.published_at=payload.status==='published'?(editing.published_at||new Date().toISOString()):null;
  let query=editing.id?sb.from('pepper_guides').update(payload).eq('id',editing.id).eq('updated_at',editing.updated_at):sb.from('pepper_guides').insert({...payload,created_by:session.user.id});
  const {data,error}=await query.select().maybeSingle();if(error)throw error;if(!data)throw new Error('This guide changed in another tab. Reload the guide before saving again.');
  upload=null;dirty=false;await load();showEditor(data,true);message(data.status==='published'?'Published. The Guides card and article are now updated.':'Draft saved. This guide is hidden from the public Guides page.');
 }catch(error){if(upload)await sb.storage.from('article-images').remove([upload.path]).catch(()=>{});message(error.code==='23505'?'That URL name already exists. Choose a different URL name.':error.message||'The guide could not be saved.',true);}
 finally{setBusy(false);}
});
$('loginForm').addEventListener('submit',async event=>{event.preventDefault();$('loginError').textContent='';const {error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error){$('loginError').textContent=error.message;return;}$('password').value='';await authorize();});
$('logout').addEventListener('click',async()=>{if(dirty&&!confirm('Discard unsaved changes and log out?'))return;dirty=false;await sb.auth.signOut();});
$('newGuide').addEventListener('click',()=>showEditor());
$('closeEditor').addEventListener('click',()=>{if(dirty&&!confirm('Discard the unsaved guide changes?'))return;dirty=false;$('editor').hidden=true;editing=null;});
for(const order of ['release','story']){$(order+'Tab').addEventListener('click',()=>setOrderTab(order));}
document.querySelectorAll('[data-add-section]').forEach(button=>button.addEventListener('click',()=>{const order=button.dataset.addSection;editing[order+'_sections'].push(defaultSection(order));markDirty();renderSections(order);}));
for(const id of ['search','collectionFilter','statusFilter'])$(id).addEventListener(id==='search'?'input':'change',renderList);
$('guideForm').addEventListener('input',markDirty);
$('edit_franchise').addEventListener('input',()=>{if(autoSlug)$('edit_slug').value=slugify($('edit_franchise').value);if(!editing.id&&!$('edit_title').dataset.manual)$('edit_title').value=$('edit_franchise').value+($('edit_collection').value==='games'?' Play Order':' Watch Order');});
$('edit_title').addEventListener('input',()=>$('edit_title').dataset.manual='true');
$('edit_slug').addEventListener('input',()=>autoSlug=false);
$('imageFile').addEventListener('change',()=>{markDirty();previewImage();});$('edit_image_url').addEventListener('input',previewImage);
$('removeImage').addEventListener('click',()=>{$('imageFile').value='';$('edit_image_url').value='';markDirty();previewImage();});
$('copySetup').addEventListener('click',async()=>{try{const response=await fetch('/SUPABASE-GUIDES-SETUP.sql');if(!response.ok)throw Error('Could not open setup SQL.');await navigator.clipboard.writeText(await response.text());message('Setup SQL copied. Paste it into Supabase → SQL Editor → New query, run it, then choose “I ran it — recheck”.');}catch(error){message(error.message+' You can also open the setup file and copy its contents.',true);}});
$('recheckSetup').addEventListener('click',()=>authorize());
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){authVersion++;session=null;dirty=false;editing=null;$('editor').hidden=true;$('dashboard').hidden=true;$('loginPanel').hidden=false;$('logout').hidden=true;$('authState').textContent='';}});
authorize();
