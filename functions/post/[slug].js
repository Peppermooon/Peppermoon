export async function onRequest(context){
 const slug=context.params.slug;
 const api='https://bgzlqvbvmstebdsnzmqv.supabase.co/rest/v1/posts?slug=eq.'+encodeURIComponent(slug)+'&status=eq.published&select=title,body,image_url,slug';
 const r=await fetch(api,{headers:{apikey:'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-',Authorization:'Bearer sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-'}});
 const rows=await r.json(); const p=Array.isArray(rows)?rows[0]:null;
 if(!p)return new Response('Post not found',{status:404});
 const reqUrl=new URL(context.request.url), origin=reqUrl.origin;
 const assetReq=new Request(origin+'/post.html?slug='+encodeURIComponent(slug),context.request);
 const asset=await context.env.ASSETS.fetch(assetReq);
 let html=await asset.text();
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const title=esc(p.title), raw=String(p.body||'').replace(/\s+/g,' ').trim().slice(0,220), desc=esc(raw||'Read this Peppermoon Community post.'), image=esc(p.image_url||origin+'/peppermoon-logo.png'), share=esc(origin+'/post/'+slug);
 const meta=`<title>${title} | Peppermoon Community</title><meta name="description" content="${desc}"><link rel="canonical" href="${share}"><meta property="og:type" content="article"><meta property="og:site_name" content="Peppermoon"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:image" content="${image}"><meta property="og:url" content="${share}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${image}">`;
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'').replace('</head>',meta+'</head>');
 return new Response(html,{headers:{'content-type':'text/html; charset=UTF-8','cache-control':'public, max-age=180'}});
}
