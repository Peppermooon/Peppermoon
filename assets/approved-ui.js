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
 if(header&&document.querySelector('.community-feed-sticky')){const update=()=>{const h=header.getBoundingClientRect().height;document.querySelector('.community-feed-sticky').style.top=h+'px';document.querySelector('.filters').style.top=(h+24)+'px'};new ResizeObserver(update).observe(header);update()}
});
