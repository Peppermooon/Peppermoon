document.addEventListener('DOMContentLoaded',()=>{
 const paths={'My Profile':'<circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>','Create Post':'<path d="M12 3v18M3 12h18"/>','Saved':'<path d="M6 3h12v19l-6-4-6 4z"/>','Notifications':'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4"/>','Log out':'<path d="M9 3H4v18h5M9 12h12m-4-4 4 4-4 4"/>'};
 document.querySelectorAll('#pmUserDropdown a,#pmUserDropdown button,#dropdown a,#dropdown button').forEach(el=>{const path=paths[el.textContent.trim()];if(!path)return;el.insertAdjacentHTML('afterbegin','<svg class="pm-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>')});
 const close=()=>document.querySelectorAll('#pmUserDropdown,#dropdown').forEach(el=>el.classList.remove('open'));
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#pmUserMenu,#userWrap'))close()},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.querySelectorAll('#pmUserDropdown a,#dropdown a').forEach(el=>el.addEventListener('click',close));
 const button=document.getElementById('communitySearchToggle'),panel=document.getElementById('communitySearchPanel'),input=document.getElementById('communitySearch');
 if(button&&panel){button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)input.focus()};input.addEventListener('input',()=>{if(typeof loadPosts==='function')loadPosts()})}
 const header=document.querySelector('body>header');
 if(header&&document.querySelector('.community-feed-sticky')){
 const tabs=document.querySelector('.community-feed-sticky'),filters=document.querySelector('.filters');
 const tabsSpace=document.createElement('div'),anchor=document.createElement('div');
 tabsSpace.setAttribute('aria-hidden','true');tabsSpace.hidden=true;tabs.before(tabsSpace);
 anchor.className='pm-filter-anchor';filters.before(anchor);anchor.append(filters);
 const update=()=>{
  const h=header.getBoundingClientRect().height,mobile=window.innerWidth<=800;
  tabs.classList.toggle('pm-mobile-pinned',mobile);tabs.style.top=h+'px';
  tabsSpace.hidden=!mobile;tabsSpace.style.height=mobile?tabs.getBoundingClientRect().height+'px':'';
  const top=h+tabs.getBoundingClientRect().height,rect=anchor.getBoundingClientRect();
  const pinned=mobile&&rect.top<=top;
  filters.classList.toggle('pm-mobile-pinned',pinned);
  if(pinned){anchor.style.height=filters.getBoundingClientRect().height+'px';filters.style.top=top+'px';filters.style.left=rect.left+'px';filters.style.width=rect.width+'px';}
  else{anchor.style.height='';filters.style.left='';filters.style.width='';filters.style.top=(h+24)+'px';}
 };
 new ResizeObserver(update).observe(header);new ResizeObserver(update).observe(tabs);
 window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
 }
});


// Vercel Web Analytics: collect page views after dashboard activation.
(()=>{
 if(!/^https?:$/.test(location.protocol)||document.querySelector('script[src="/_vercel/insights/script.js"]'))return;
 window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
 const script=document.createElement('script');script.defer=true;script.src='/_vercel/insights/script.js';document.head.appendChild(script);
})();


// Pepper Ratings destinations: hover on desktop, tap on mobile.
document.addEventListener('DOMContentLoaded',()=>{
 const groups=[];
 const closeAll=except=>groups.forEach(({item,trigger})=>{if(item!==except){item.classList.remove('pm-ratings-open');trigger.setAttribute('aria-expanded','false')}});
 document.querySelectorAll('body>header .nav-links a[href="/ratings"],body>header .nav-links a[href="ratings.html"],.mobile-bottom-nav a[data-mobile-section="ratings"],.mobile-bottom-nav a[href="/ratings"]').forEach((trigger,index)=>{
  if(trigger.closest('.pm-ratings-nav-item'))return;
  const mobile=!!trigger.closest('.mobile-bottom-nav'),item=document.createElement('div'),menu=document.createElement('div');
  item.className='pm-ratings-nav-item'+(mobile?' pm-ratings-mobile-item':'');
  trigger.before(item);item.append(trigger);menu.className='pm-ratings-destinations';menu.id='pmRatingsDestinations'+index;
  menu.setAttribute('aria-label','Pepper Ratings destinations');
  const isTop=location.pathname.startsWith('/top-10');
  menu.innerHTML='<a href="/top-10/movies/action"'+(isTop?' aria-current="page"':'')+'>Top 10 by Genre</a><a href="/ratings"'+(!isTop&&location.pathname==='/ratings'?' aria-current="page"':'')+'>Pepper Ratings</a>';
  item.append(menu);trigger.setAttribute('aria-haspopup','true');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',menu.id);
  if(isTop){trigger.classList.add('active');trigger.setAttribute('aria-current','page')}
  const open=()=>{closeAll(item);item.classList.add('pm-ratings-open');trigger.setAttribute('aria-expanded','true')};
  const close=()=>{item.classList.remove('pm-ratings-open');trigger.setAttribute('aria-expanded','false')};
  trigger.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(item.classList.contains('pm-ratings-open'))close();else open()},true);
  if(!mobile){item.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover: hover) and (pointer: fine)').matches)open()});item.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&!item.contains(document.activeElement))close()});item.addEventListener('focusin',open);item.addEventListener('focusout',event=>{if(!item.contains(event.relatedTarget))close()})}
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();open();menu.querySelector('a').focus()}if(event.key===' '){event.preventDefault();item.classList.contains('pm-ratings-open')?close():open()}});
  groups.push({item,trigger});
 });
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.pm-ratings-nav-item'))closeAll()},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAll()});
});
