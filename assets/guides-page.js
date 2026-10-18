import {mediaMatches,guideMatchesSearch} from './guides-core.mjs';
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

const collectionButtons=[...document.querySelectorAll('[data-guide-collection]')];
const collectionPanels=[...document.querySelectorAll('.guide-hub-section')];
const search=document.getElementById('guideSearch');
let collection='screen';
function renderBrowser(){
 const query=search?.value||'';let count=0;
 collectionButtons.forEach(button=>{const active=button.dataset.guideCollection===collection;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
 collectionPanels.forEach(panel=>{
  panel.hidden=panel.dataset.collection!==collection;
  panel.querySelectorAll('[data-guide-search]').forEach(card=>{card.hidden=!guideMatchesSearch(card.dataset.guideSearch,query);if(!panel.hidden&&!card.hidden)count++;});
 });
 const label=collection==='games'?'Games':'Movies & TV';
 const result=document.getElementById('guideResultCount');if(result)result.textContent=count+' '+(count===1?'guide':'guides')+' in '+label;
 const empty=document.getElementById('guideHubEmpty');if(empty){empty.hidden=count>0;empty.textContent=query.trim()?'No '+label+' guides match your search.':'No guides in '+label+' yet.';}
}
collectionButtons.forEach((button,index)=>{
 button.addEventListener('click',()=>{collection=button.dataset.guideCollection;renderBrowser();});
 button.addEventListener('keydown',event=>{let target=null;if(event.key==='ArrowRight'||event.key==='ArrowLeft')target=collectionButtons[(index+1)%collectionButtons.length];if(event.key==='Home')target=collectionButtons[0];if(event.key==='End')target=collectionButtons.at(-1);if(target){event.preventDefault();target.click();target.focus();}});
});
search?.addEventListener('input',renderBrowser);
if(collectionButtons.length)renderBrowser();
