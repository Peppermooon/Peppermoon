import {mediaMatches} from './guides-core.mjs';
const orderButtons=[...document.querySelectorAll('[data-guide-order-btn]')];
const mediaButtons=[...document.querySelectorAll('[data-guide-media]')];
const panels=[...document.querySelectorAll('[data-order-panel]')];
let order='release',media='both';
function render(){
 let visible=0;
 orderButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideOrderBtn===order)));
 mediaButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.guideMedia===media)));
 panels.forEach(panel=>{
  panel.hidden=panel.dataset.orderPanel!==order;
  panel.querySelectorAll('[data-guide-section]').forEach(section=>{
   const items=[...section.querySelectorAll('li[data-media]')];let count=0;
   items.forEach(item=>{item.hidden=!mediaMatches(item.dataset.media,media);if(!item.hidden)count++;});
   section.hidden=items.length>0&&count===0;
   if(!panel.hidden)visible+=count||(!items.length&&!section.hidden?1:0);
  });
 });
 const status=document.querySelector('.guide-status');if(status)status.textContent=(mediaButtons.length?({both:'Movies + TV',movie:'Movies only',tv:'TV only'}[media])+' • ':'')+(order==='release'?'Release order':'Story order');
 const empty=document.getElementById('guideEmptyFilter');if(empty)empty.hidden=visible>0;
}
orderButtons.forEach(button=>button.addEventListener('click',()=>{order=button.dataset.guideOrderBtn;render();}));
mediaButtons.forEach(button=>button.addEventListener('click',()=>{media=button.dataset.guideMedia;render();}));
if(panels.length)render();
