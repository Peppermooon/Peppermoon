(()=>{
 const rail=document.getElementById('ttGenreLinks');if(!rail)return;
 const buttons=[...document.querySelectorAll('[data-tt-scroll]')];
 const update=()=>{const max=rail.scrollWidth-rail.clientWidth;buttons.forEach(button=>button.disabled=button.dataset.ttScroll==='left'?rail.scrollLeft<=2:rail.scrollLeft>=max-2)};
 buttons.forEach(button=>button.addEventListener('click',()=>rail.scrollBy({left:(button.dataset.ttScroll==='left'?-1:1)*Math.max(180,rail.clientWidth*.65),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})));
 rail.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(rail);
 const active=rail.querySelector('[aria-current="page"]');if(active)rail.scrollLeft=Math.max(0,active.offsetLeft-rail.offsetLeft-(rail.clientWidth-active.offsetWidth)/2);
 const header=document.querySelector('body>header');if(header){const size=()=>document.documentElement.style.setProperty('--tt-header-height',header.getBoundingClientRect().height+'px');new ResizeObserver(size).observe(header);size()}
 document.querySelectorAll('.tt-cover-image').forEach(image=>image.addEventListener('error',()=>image.remove(),{once:true}));update();
})();
