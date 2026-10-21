import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../assets/header-state.js',import.meta.url),'utf8'),key='pm-header-profile-v1',auth='sb-bgzlqvbvmstebdsnzmqv-auth-token';
function setup({session=null,saved=null,community=false,blockedStorage=false}={}){
 const nodes={},events={},values=new Map(saved?[[key,JSON.stringify(saved)]]:[]);
 const ids=community?['loginBtn','userWrap','navName','navAvatar','profileLink']:['pmOpenAuth','pmUserMenu','pmUserName','pmAvatar','pmProfileLink'];
 const storage={getItem:k=>{if(blockedStorage)throw Error('blocked');return values.get(k)||null},setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 let mutation;const doc={documentElement:{},getElementById:id=>nodes[id]||null,addEventListener:(n,f)=>events[n]=f};
 const win={addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(code,{window:win,document:doc,sessionStorage:storage,localStorage:{getItem:()=>{if(blockedStorage)throw Error('blocked');return JSON.stringify(session)}},URL,Date,MutationObserver:class{constructor(f){mutation=f}observe(){}disconnect(){}}});
 // Header parsing happens after the synchronous head script.
 ids.forEach(id=>nodes[id]={style:{},textContent:''});mutation();
 return {api:win.pmHeaderState,nodes,ids,values,events};
}
const user={id:'test-user',user_metadata:{name:'Metadata Name',avatar_url:'https://example.com/meta.png'}};
const session={user,expires_at:Date.now()/1000+3600,access_token:'test-only-never-cached'};
const saved={id:user.id,name:'Current Profile',avatar:'https://example.com/profile.png',time:Date.now()};
for(const community of [false,true]){
 const x=setup({session,saved,community});const [login,menu,name,photo,link]=x.ids;
 assert.equal(x.nodes[menu].style.display,'block');assert.equal(x.nodes[login].style.display,'none');assert.equal(x.nodes[name].textContent,saved.name);assert(x.nodes[photo].style.backgroundImage.includes(saved.avatar));
 assert.equal(x.nodes[link].href,'/profile.html?id=test-user');
 x.api.pending(user);assert.equal(x.nodes[name].textContent,saved.name);
 x.api.ready(user,{display_name:'Updated Profile',avatar_url:'https://example.com/updated.png'});
 assert.equal(x.nodes[name].textContent,'Updated Profile');assert(!x.values.get(key).includes('access_token'));assert(!x.values.get(key).includes('test-only-never-cached'));
 x.api.pending(null);assert(!x.values.has(key));
}
let x=setup({session,saved:{...saved,id:'other-user',name:'Do not display'}});assert.equal(x.nodes.pmUserName.textContent,'Metadata Name');
x=setup({session:{...session,expires_at:1},saved});assert.notEqual(x.nodes.pmUserMenu.style.display,'block');assert(!x.values.has(key));
x=setup({saved});assert.notEqual(x.nodes.pmUserMenu.style.display,'block');assert(!x.values.has(key));
x=setup({blockedStorage:true});x.api.pending(user);assert.equal(x.nodes.pmUserName.textContent,'Metadata Name');
x=setup({session,saved});x.events.click({target:{closest:()=>true}});assert(!x.values.has(key));
x=setup({session,saved});x.events.storage({key:auth,newValue:null});assert(!x.values.has(key));
x=setup({session,saved});x.api.ready(user,{display_name:'Safe',avatar_url:'javascript:alert(1)'});assert.equal(x.nodes.pmAvatar.style.backgroundImage,'');
console.log('Passed early profile restoration, both header variants, fresh profile updates, signed-out/expired/mismatched sessions, logout, blocked storage, safe avatar URLs and no token caching.');
for(const path of ['index.html','ratings.html','community.html','about.html','article.html','post.html','profile.html','rating.html','notifications.html']){
 const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');assert.equal(html.split('src="/assets/header-state.js"').length,2);
 for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi))if(!/src=|application\/ld\+json|type="module"/.test(attrs))new vm.Script(body,{filename:path});
 assert(html.includes('pmHeaderState?.pending'));assert(html.includes('pmHeaderState?.ready'));
}
console.log('Passed all nine public page integrations and inline script syntax.');
