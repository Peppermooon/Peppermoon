
(function(){
const sbAuth=window.supabase.createClient(
  "https://bgzlqvbvmstebdsnzmqv.supabase.co",
  "sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-",
  {
    auth:{
      persistSession:true,
      autoRefreshToken:true,
      detectSessionInUrl:true
    }
  }
);

const $=id=>document.getElementById(id);

function setMsg(el,t,type='error'){
  if(!el)return;
  el.textContent=t;
  el.className='pm-auth-msg show '+type;
}

function cleanUsername(v){
  return String(v||'')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g,'_')
    .replace(/_+/g,'_')
    .replace(/^_+|_+$/g,'')
    .slice(0,24);
}

async function usernameExists(username){
  const r=await sbAuth.from('profiles').select('id').eq('username',username).maybeSingle();
  return !!r.data;
}

async function buildSocialUsername(user){
  const meta=user.user_metadata||{};
  const emailPrefix=(user.email||'user').split('@')[0];
  let base=cleanUsername(meta.preferred_username || meta.user_name || emailPrefix || 'user');
  if(base.length<3)base='user';

  if(!(await usernameExists(base)))return base;

  const suffix=user.id.replace(/-/g,'').slice(0,5).toLowerCase();
  let candidate=(base.slice(0,18)+'_'+suffix).slice(0,24);
  if(!(await usernameExists(candidate)))return candidate;

  return ('user_'+user.id.replace(/-/g,'').slice(0,10)).slice(0,24);
}

async function ensureProfile(user){
  let r=await sbAuth.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if(r.data)return r.data;

  const meta=user.user_metadata||{};
  let username=cleanUsername(meta.username);

  if(!username){
    username=await buildSocialUsername(user);
  }

  const displayName=
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    username;

  const avatar=
    meta.avatar_url ||
    meta.picture ||
    null;

  const payload={
    id:user.id,
    username:username,
    display_name:displayName,
    avatar_url:avatar
  };

  const inserted=await sbAuth.from('profiles').insert(payload).select().maybeSingle();
  if(inserted.data)return inserted.data;

  // A rare username collision can occur between simultaneous signups.
  payload.username=('user_'+user.id.replace(/-/g,'').slice(0,10)).slice(0,24);
  const retry=await sbAuth.from('profiles').insert(payload).select().maybeSingle();
  return retry.data||null;
}

async function render(session){
 if(session?.user) $("pmOpenAuth").style.display="none"; $("pmOpenAuth").style.visibility="visible";
  if(!session||!session.user){
    $('pmOpenAuth').style.display='';
    $('pmUserMenu').style.display='none';
    return;
  }

  const p=await ensureProfile(session.user);

  if(!p){
    $('pmOpenAuth').style.display='none';
    $('pmUserMenu').style.display='block';
    $('pmUserName').textContent='Profile';
    $('pmAvatar').textContent='U';
    return;
  }

  const n=p.display_name||p.username||session.user.email||'User';
  $('pmOpenAuth').style.display='none';
  $('pmUserMenu').style.display='block';
  $('pmUserName').textContent=n;
  $('pmAvatar').textContent=n.slice(0,1).toUpperCase();

  if(p.avatar_url){
    $('pmAvatar').style.backgroundImage='url("'+p.avatar_url+'")';
    $('pmAvatar').textContent='';
  }

  $('pmProfileLink').href='/profile.html?id='+encodeURIComponent(session.user.id);
}

$('pmOpenAuth').onclick=()=>$('pmAuthModal').classList.add('open');
$('pmCloseAuth').onclick=()=>$('pmAuthModal').classList.remove('open');

// Data-entry dialog intentionally does not close from backdrop clicks.
$('pmAuthModal').onclick=()=>{};

document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-auth-tab]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const login=b.dataset.authTab==='login';
  $('pmLoginForm').classList.toggle('active',login);
  $('pmSignupForm').classList.toggle('active',!login);
});

$('pmUserTrigger').onclick=()=>$('pmUserDropdown').classList.toggle('open');
document.addEventListener('click',e=>{
  if($('pmUserMenu') && !$('pmUserMenu').contains(e.target))
    $('pmUserDropdown').classList.remove('open');
});

$('pmGoogleLogin').onclick=async()=>{
  const r=await sbAuth.auth.signInWithOAuth({
    provider:'google',
    options:{
      redirectTo:window.location.origin + window.location.pathname + window.location.search
    }
  });

  if(r.error){
    setMsg($('pmLoginMsg'),r.error.message,'error');
  }
};

$('pmLoginForm').onsubmit=async e=>{
  e.preventDefault();

  const r=await sbAuth.auth.signInWithPassword({
    email:$('pmLoginEmail').value.trim(),
    password:$('pmLoginPassword').value
  });

  if(r.error){
    setMsg($('pmLoginMsg'),r.error.message,'error');
    return;
  }

  $('pmAuthModal').classList.remove('open');
};

$('pmSignupForm').onsubmit=async e=>{
  e.preventDefault();

  const username=cleanUsername($('pmSignupUsername').value);
  const dn=$('pmSignupDisplayName').value.trim();

  const chk=await sbAuth.from('profiles').select('id').eq('username',username).maybeSingle();
  if(chk.data){
    setMsg($('pmSignupMsg'),'Username already taken.','error');
    return;
  }

  const r=await sbAuth.auth.signUp({
    email:$('pmSignupEmail').value.trim(),
    password:$('pmSignupPassword').value,
    options:{
      data:{
        username:username,
        display_name:dn||username
      }
    }
  });

  if(r.error){
    setMsg($('pmSignupMsg'),r.error.message,'error');
    return;
  }

  if(r.data.session && r.data.user){
    await ensureProfile(r.data.user);
    $('pmAuthModal').classList.remove('open');
    return;
  }

  setMsg(
    $('pmSignupMsg'),
    'Account created. Confirm the email, then Peppermoon will recognize the session when you return.',
    'ok'
  );
};

$('pmLogout').onclick=async()=>{
  await sbAuth.auth.signOut();
  $('pmUserDropdown').classList.remove('open');
};

$('pmCreatePostPlaceholder').onclick=e=>{
  e.preventDefault();
  location.href='/community#create';
};

$('pmSavedPlaceholder').onclick=e=>{e.preventDefault();location.href='/profile.html#saved'};

(async()=>{
  const r=await sbAuth.auth.getSession();
  await render(r.data.session);
})();

sbAuth.auth.onAuthStateChange((_event,session)=>{
  setTimeout(async()=>{await render(session);if(session && $('pmAuthModal'))$('pmAuthModal').classList.remove('open');},0);
});
})();
