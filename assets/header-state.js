/* Presentation only: session/profile checks and permissions stay in the page's auth code. */
(()=>{
 const key='pm-header-profile-v1',authKey='sb-bgzlqvbvmstebdsnzmqv-auth-token';
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}};
 const clear=()=>{try{sessionStorage.removeItem(key)}catch{}};
 const avatar=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}};
 let user=null,profile=null,painted=false;
 function paint(){
  if(!user||!profile||painted)return;
  const login=document.getElementById('pmOpenAuth')||document.getElementById('loginBtn');
  const menu=document.getElementById('pmUserMenu')||document.getElementById('userWrap');
  const name=document.getElementById('pmUserName')||document.getElementById('navName');
  const photo=document.getElementById('pmAvatar')||document.getElementById('navAvatar');
  const link=document.getElementById('pmProfileLink')||document.getElementById('profileLink');
  if(!login||!menu||!name||!photo||!link)return;
  login.style.display='none';menu.style.display='block';name.textContent=profile.name;
  photo.style.backgroundImage=profile.avatar?'url('+JSON.stringify(profile.avatar)+')':'';
  photo.textContent=profile.avatar?'':profile.name.slice(0,1).toUpperCase();
  link.href='/profile.html?id='+encodeURIComponent(user.id);painted=true;
 }
 function pending(next){
  user=next;painted=false;
  if(!user){profile=null;clear();return}
  const saved=read(),meta=user.user_metadata||{};
  profile=saved?.id===user.id&&Date.now()-saved.time<86400000?saved:{id:user.id,name:meta.display_name||meta.full_name||meta.name||'Profile',avatar:avatar(meta.avatar_url||meta.picture)};
  paint();
 }
 function ready(next,data){
  if(!next||user?.id!==next.id)return;
  profile={id:next.id,name:String(data?.display_name||data?.username||profile?.name||'Profile'),avatar:avatar(data?.avatar_url),time:Date.now()};
  try{sessionStorage.setItem(key,JSON.stringify(profile))}catch{}
  painted=false;paint();
 }
 window.pmHeaderState={pending,ready};
 // Restore only for the same unexpired locally stored Supabase session.
 try{const session=JSON.parse(localStorage.getItem(authKey)||'null');if(session?.user?.id&&Number(session.expires_at)*1000>Date.now())pending(session.user);else clear()}catch{clear()}
 // Run as the header is parsed, before waiting for profile network requests.
 const observer=new MutationObserver(paint);observer.observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('DOMContentLoaded',()=>{paint();observer.disconnect()},{once:true});
 document.addEventListener('click',event=>{if(event.target.closest('#pmLogout,#logoutBtn')){user=null;profile=null;clear()}},true);
 window.addEventListener('storage',event=>{if(event.key===authKey&&!event.newValue){user=null;profile=null;clear()}});
})();
