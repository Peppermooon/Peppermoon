export async function onRequest(context){
 const slug=context.params.slug;
 const api='https://bgzlqvbvmstebdsnzmqv.supabase.co/rest/v1/articles?slug=eq.'+encodeURIComponent(slug)+'&status=eq.published&select=title,summary,featured_image,slug';
 const r=await fetch(api,{headers:{apikey:'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-',Authorization:'Bearer sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-'}});
 const rows=await r.json(); const a=Array.isArray(rows)?rows[0]:null;
 if(!a)return new Response('Article not found',{status:404});
 const reqUrl=new URL(context.request.url), origin=reqUrl.origin;
 const assetReq=new Request(origin+'/article.html?slug='+encodeURIComponent(slug),context.request);
 const asset=await context.env.ASSETS.fetch(assetReq);
 let html=await asset.text();
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const title=esc(a.title), desc=esc(a.summary||'Read this Peppermoon article.'), image=esc(a.featured_image||origin+'/peppermoon-logo.png'), share=esc(origin+'/article/'+slug);
 const meta=`<title>${title} | Peppermoon</title><meta name="description" content="${desc}"><link rel="canonical" href="${share}"><meta property="og:type" content="article"><meta property="og:site_name" content="Peppermoon"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${image}"><meta property="og:url" content="${share}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${image}">`;
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'').replace('</head>',meta+'</head>');
 return new Response(html,{headers:{'content-type':'text/html; charset=UTF-8','cache-control':'public, max-age=300'}});
}
