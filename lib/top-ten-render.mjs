import {topTenLists} from '../data/top-ten.mjs';
import {genreNotes} from '../data/top-ten-notes.mjs';
export const media={movies:{label:'Movies',singular:'Movie',heading:'Movies'},tv:{label:'TV Shows',singular:'TV series',heading:'TV Shows'},gaming:{label:'Gaming',singular:'Game',heading:'Games'}};
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHtml;
export const listPath=l=>'/top-10/'+l.medium+'/'+l.slug;
export const findList=(medium,genre)=>topTenLists.find(l=>l.medium===medium&&l.slug===genre);
const hue=title=>{let n=0;for(const c of title)n=(n*31+c.charCodeAt(0))%360;return n};
function cover(item,type){
 const fallback='<div class="tt-cover-fallback" aria-label="Cover pending for '+e(item.title)+'"><span class="tt-cover-type">'+e(type)+'</span><strong>'+e(item.title)+'</strong><small>Cover pending</small></div>';
 return '<div class="tt-cover" style="--tt-hue:'+hue(item.title)+'">'+fallback+(item.image?'<img class="tt-cover-image" src="'+e(item.image)+'" alt="'+e(item.title)+' cover" loading="lazy">':'')+'</div>';
}
export function renderContent(list){
 const info=media[list.medium],genres=topTenLists.filter(l=>l.medium===list.medium),index=genres.indexOf(list),next=genres[(index+1)%genres.length];
 const title='Top 10 '+list.genre+' '+info.heading;
 const mediumLinks=Object.entries(media).map(([key,mi])=>{const target=findList(key,list.slug)||findList(key,'action');return '<a href="'+listPath(target)+'"'+(key===list.medium?' aria-current="page"':'')+'>'+mi.label+'</a>'}).join('');
 const genreLinks=genres.map(l=>'<a href="'+listPath(l)+'"'+(l===list?' aria-current="page"':'')+'>'+e(l.genre)+'</a>').join('');
 const arrow=(dir,path)=>'<button type="button" class="tt-genre-arrow" data-tt-scroll="'+dir+'" aria-label="Scroll genres '+dir+'" aria-controls="ttGenreLinks"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg></button>';
 const scoreBadge=item=>'<div class="tt-pepper-score" aria-label="Pepper Score '+Number(item.pepperScore).toFixed(1)+' out of 10, editorial rating"><span class="tt-pepper-score-value">'+Number(item.pepperScore).toFixed(1)+'</span><span class="tt-pepper-score-label">/ 10 · Pepper Score</span></div>';
 const cards=list.items.map(item=>'<article class="tt-card"><span class="tt-rank" aria-label="Rank '+item.rank+'">'+item.rank+'</span>'+cover(item,info.singular)+'<div class="tt-card-body"><div class="tt-meta"><span>'+info.singular+'</span><span>'+e(item.year)+'</span>'+(item.edition?'<span>'+e(item.edition)+'</span>':'')+'</div><h3>'+e(item.title)+'</h3><p>'+e(item.description)+'</p>'+scoreBadge(item)+'<div class="tt-pick">Peppermoon pick · '+e(list.genre)+'</div></div></article>').join('');
 return '<main class="tt-page"><section class="container tt-intro"><div class="ratings-eyebrow">PEPPERMOON’S EDITORIAL PICKS</div><h1>Top 10 by Genre</h1><p>The standouts, the classics, the ones that stay with you. Find your next Movie, TV show or Game.</p></section><div class="tt-controls"><div class="container"><nav class="tt-media" aria-label="Movies, TV shows or gaming">'+mediumLinks+'</nav><div class="tt-genre-rail">'+arrow('left','m15 5-7 7 7 7')+'<nav class="tt-genres" id="ttGenreLinks" aria-label="Genre">'+genreLinks+'</nav>'+arrow('right','m9 5 7 7-7 7')+'</div></div></div><section class="container tt-content" aria-labelledby="ttListTitle"><div class="tt-crumb">Pepper Ratings / Top 10 by Genre / '+info.label+' / '+e(list.genre)+'</div><div class="tt-list-head"><div><h2 id="ttListTitle">'+e(title)+'</h2><p>'+e(genreNotes[list.genre])+'</p></div><span class="tt-count">10 EDITORIAL PICKS</span></div><div class="tt-cards">'+cards+'</div><nav class="tt-next" aria-label="More genre lists"><span>'+info.label+' · '+(index+1)+' of '+genres.length+' genres · Ranked 1–10</span><a href="'+listPath(next)+'">'+e(next.genre)+' →</a></nav></section></main>';
}
export function renderTopTenPage(template,list){
 const title='Top 10 '+list.genre+' '+media[list.medium].heading;
 const description=genreNotes[list.genre];const url='https://thepeppermoon.com'+listPath(list);
 // Preserve the existing public header, footer, profile and authentication code.
 let page=template.replace(/<main>[\s\S]*?<\/main>/,renderContent(list));
 page=page.replace(/<title>[\s\S]*?<\/title>/,'<title>'+e(title)+' | Peppermoon</title>');
 page=page.replace(/<meta\b[^>]*(?:name=["']description["']|property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi,'').replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'');
 page=page.replace(/<script[^>]*src=["'][^"']*assets\/ratings\.js[^"']*["'][^>]*><\/script>/g,'');
 // Root-relative assets work on nested clean URLs.
 page=page.replace(/\b(src|href)="(assets\/[^"<>]+|favicon\.png|apple-touch-icon\.png|peppermoon-logo\.png)"/g,'$1="/$2"');
 const schema={'@context':'https://schema.org','@type':'ItemList',name:title,url,numberOfItems:10,itemListOrder:'https://schema.org/ItemListOrderAscending',itemListElement:list.items.map(i=>({'@type':'ListItem',position:i.rank,item:{'@type':list.medium==='movies'?'Movie':list.medium==='tv'?'TVSeries':'VideoGame',name:i.title,description:i.description,...(i.image?{image:'https://thepeppermoon.com'+i.image}:{})}}))};
 const extra='<meta name="description" content="'+e(description)+'"><link rel="canonical" href="'+url+'"><meta property="og:type" content="website"><meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(description)+'"><meta property="og:url" content="'+url+'"><meta property="og:site_name" content="Peppermoon"><meta property="og:image" content="https://thepeppermoon.com/peppermoon-logo.png"><meta name="twitter:card" content="summary"><link rel="stylesheet" href="/assets/top-ten.css?v=2"><script defer src="/assets/top-ten.js?v=1"></script><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>';
 return page.replace('</head>',extra+'</head>');
}

