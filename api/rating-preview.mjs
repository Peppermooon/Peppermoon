import { readFile } from 'node:fs/promises';
const SUPABASE='https://bgzlqvbvmstebdsnzmqv.supabase.co';
const KEY='sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default async function handler(req,res){
 res.setHeader('Content-Type','text/html; charset=utf-8');
 const origin=new URL('https://'+req.headers.host).origin;
 const url=new URL(req.url,origin),slug=url.searchParams.get('slug') || (url.pathname.startsWith('/article/') ? decodeURIComponent(url.pathname.slice(9)) : null);
 let template;
 try{template=await readFile(process.cwd()+'/rating.html','utf8');}catch{res.statusCode=500;return res.end('Article page unavailable');}
 if(!slug||slug.length>240){res.statusCode=404;return res.end(template);}
 try{
 const query=new URL(SUPABASE+'/rest/v1/pepper_ratings');
 query.searchParams.set('select','slug,title,summary,image_url,updated_at,score');
 query.searchParams.set('slug','eq.'+slug);query.searchParams.set('status','eq.published');query.searchParams.set('limit','1');
 const response=await fetch(query,{headers:{apikey:KEY,Authorization:'Bearer '+KEY},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('Article lookup failed');
 const [article]=await response.json();
 if(!article){res.statusCode=404;res.setHeader('Cache-Control','no-store');return res.end(template);}
 const canonical=origin+'/rating.html?slug='+encodeURIComponent(article.slug);
 let image=origin+'/peppermoon-logo.png';
 try{const cover=new URL(article.image_url);if(cover.protocol==='https:')image=cover.href;}catch{}
 const title=article.title+' · '+Number(article.score).toFixed(1)+'/10 | Pepper Ratings';
 const description=String(article.summary||'Peppermoon Editorial Rating: '+Number(article.score).toFixed(1)+'/10. Read our review of '+article.title+'.').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,300);
 const tags=[
 ['name','description',description],['property','og:type','article'],['property','og:site_name','Peppermoon'],
 ['property','og:title',article.title],['property','og:description',description],['property','og:image',image],
 ['property','og:image:alt',article.title],['property','og:url',canonical],
 ['name','twitter:card','summary_large_image'],['name','twitter:title',article.title],
 ['name','twitter:description',description],['name','twitter:image',image]
 ];
 if(article.updated_at)tags.push(['property','article:published_time',article.updated_at]);
 const metadata=tags.map(([kind,name,value])=>'<meta '+kind+'="'+name+'" content="'+escape(value)+'">').join('\n')+'\n<link rel="canonical" href="'+escape(canonical)+'">';
 template=template.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escape(title)+'</title>');
 template=template.replace(/<meta charset="UTF-8">/i,'');
 template=template.replace('<head>','<head>\n<meta charset="UTF-8">\n'+metadata+'\n<base href="'+escape(origin)+'/">');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');
 res.statusCode=200;return res.end(template);
 }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');return res.end(template);}
}
