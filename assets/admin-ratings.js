import {prepareImports} from './ratings-import.js';
import {validateRating,slugify,displayCategory} from './ratings-core.js';
const sb=window.supabase.createClient('https://bgzlqvbvmstebdsnzmqv.supabase.co','sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-');
const $=id=>document.getElementById(id);let session=null,items=[],editing=null,busy=false;
function message(text){$('ratingsAdminMessage').textContent=text;}
function showEditor(item=null){editing=item;$('ratingForm').reset();for(const key of ['title','category','release_year','score','summary','review','image_url','top_rank'])$('edit_'+key).value=item?.[key]??(key==='category'?'Movies':'');$('editorHeading').textContent=item?'Edit '+item.title:'New editorial rating';$('savedStatus').textContent=item?'Saved status: '+item.status:'New rating · Not yet saved';$('editor').hidden=false;$('editor').scrollIntoView({behavior:'smooth',block:'start'});message('');}
function render(){const body=$('ratingsAdminList');body.replaceChildren();for(const item of items){const row=document.createElement('tr');for(const value of [item.title,displayCategory(item.category),Number(item.score).toFixed(1),item.status,item.top_rank?'#'+item.top_rank:'—']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}const cell=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='Edit';button.addEventListener('click',()=>showEditor(item));cell.append(button);row.append(cell);body.append(row);}if(!items.length)$('emptyRatings').textContent='No ratings yet. Add your first review.';else $('emptyRatings').textContent='';}
async function load(){const {data,error}=await sb.from('pepper_ratings').select('*').order('updated_at',{ascending:false});if(error){$('setupNotice').hidden=false;message(error.code==='PGRST205'||error.code==='42P01'?'Run SUPABASE-RATINGS-SETUP.sql to activate ratings.':'Could not load ratings: '+error.message);return;}items=data||[];$('setupNotice').hidden=true;render();}
async function authorize(){const {data,error}=await sb.auth.getSession();session=data.session;if(error||!session){$('loginPanel').hidden=false;$('ratingsDashboard').hidden=true;$('authState').textContent='';return;}
 const profile=await sb.from('profiles').select('role').eq('id',session.user.id).maybeSingle();if(profile.error||profile.data?.role!=='admin'){$('authState').textContent='This account is not authorized to manage Pepper Ratings.';$('ratingsDashboard').hidden=true;$('loginPanel').hidden=false;return;}
 $('loginPanel').hidden=true;$('ratingsDashboard').hidden=false;$('authState').textContent='Signed in as '+session.user.email;await load();}
$('ratingsLogin').addEventListener('submit',async event=>{event.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('ratingsEmail').value.trim(),password:$('ratingsPassword').value});if(error){$('loginError').textContent=error.message;return;}$('ratingsPassword').value='';$('loginError').textContent='';await authorize();});
$('newRating').addEventListener('click',()=>showEditor());$('cancelRating').addEventListener('click',()=>{$('editor').hidden=true;editing=null;});
async function imageUpload(file,slug){if(file.size>10*1024*1024)throw new Error('Choose a cover image smaller than 10 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use a JPEG, PNG or WebP cover.');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#10131c';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));if(!blob)throw new Error('Could not prepare the cover image.');const path='ratings/'+session.user.id+'/'+slug+'-'+crypto.randomUUID()+'.jpg';const {error}=await sb.storage.from('article-images').upload(path,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;return sb.storage.from('article-images').getPublicUrl(path).data.publicUrl;}
$('ratingForm').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;const buttons=Array.from($('ratingForm').querySelectorAll('button'));buttons.forEach(b=>b.disabled=true);message('Saving rating…');try{
 const input={};for(const key of ['title','category','release_year','score','summary','review','image_url','top_rank'])input[key]=$('edit_'+key).value;input.status=event.submitter?.value==='published'?'published':'draft';let payload=validateRating(input);
 if(payload.status==='published'&&payload.top_rank!==null&&items.some(item=>item.id!==editing?.id&&item.status==='published'&&item.category===payload.category&&item.top_rank===payload.top_rank))throw new Error('That Top 10 position is occupied. Remove the position from the other review first.');
 const slug=editing?.slug||slugify(payload.title)+'-'+crypto.randomUUID().slice(0,8);const file=$('edit_image_file').files[0];if(file)payload.image_url=await imageUpload(file,slug);payload.slug=slug;
 const query=editing?sb.from('pepper_ratings').update(payload).eq('id',editing.id):sb.from('pepper_ratings').insert({...payload,created_by:session.user.id});const {data,error}=await query.select().single();if(error)throw error;editing=data;await load();showEditor(data);message(payload.status==='published'?'Published. This review is visible in Pepper Ratings.':'Draft saved. This review is private.');
 }catch(error){message(error.code==='23505'?'That Top 10 position is already occupied. Change its position and try again.':error.message||'The rating could not be saved.');}finally{busy=false;buttons.forEach(b=>b.disabled=false);}});
sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){session=null;$('ratingsDashboard').hidden=true;$('loginPanel').hidden=false;}});
authorize();

$('importPreparedRatings').addEventListener('click',()=>{if(!busy)$('preparedRatingsFile').click();});
$('preparedRatingsFile').addEventListener('change',async()=>{
 if(busy||!session)return;busy=true;
 const controls=Array.from(document.querySelectorAll('#ratingsDashboard button'));controls.forEach(button=>button.disabled=true);
 message('Checking the prepared ratings and existing entries…');
 try{
 const file=$('preparedRatingsFile').files[0];
 if(!file)throw new Error('Choose the prepared JSON import file.');
 if(file.size>1024*1024)throw new Error('The prepared file is too large.');
 const rows=JSON.parse(await file.text());
 const {data:existing,error:readError}=await sb.from('pepper_ratings').select('title,category,slug');
 if(readError)throw readError;
 const payload=prepareImports(rows,existing||[],session.user.id);
 if(!payload.length){message('All prepared titles already exist. Nothing was changed.');return;}
 const {error}=await sb.from('pepper_ratings').insert(payload);
 if(error)throw error;
 await load();
 message('Imported '+payload.length+' ratings as drafts with covers. Existing reviews were preserved. Edit any draft, then choose Publish Rating when ready.');
 }catch(error){message(error.message||'The draft import failed. Nothing was published.');}
 finally{busy=false;$('preparedRatingsFile').value='';controls.forEach(button=>button.disabled=false);}
});
