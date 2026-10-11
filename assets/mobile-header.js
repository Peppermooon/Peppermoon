document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('menuToggle'),menu=document.getElementById('navLinks');
 if(!button||!menu)return;
 button.setAttribute('aria-controls','navLinks');
 const setOpen=open=>{menu.classList.toggle('active',open);button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close menu':'Open menu');};
 setOpen(false);
 button.addEventListener('click',event=>{event.stopImmediatePropagation();setOpen(!menu.classList.contains('active'));},true);
 document.addEventListener('click',event=>{if(!menu.contains(event.target)&&!button.contains(event.target))setOpen(false);});
 menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('active')){setOpen(false);button.focus();}});
 window.addEventListener('resize',()=>{if(window.innerWidth>760)setOpen(false);});
});