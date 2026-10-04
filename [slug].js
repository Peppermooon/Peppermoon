import { sharePage } from '../_shared.js';

export async function onRequest(context) {
  try {
    const slug=String(context.params.slug||'');
    if(!slug) return new Response('Post not found',{status:404});

    const api='https://bgzlqvbvmstebdsnzmqv.supabase.co/rest/v1/posts?slug=eq.'+
      encodeURIComponent(slug)+
      '&status=eq.published&select=title,body,image_url,slug';

    const r=await fetch(api,{
      headers:{
        apikey:'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-',
        Authorization:'Bearer sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-'
      }
    });

    if(!r.ok) return new Response('Could not load post',{status:502});

    const rows=await r.json();
    const p=Array.isArray(rows)?rows[0]:null;
    if(!p) return new Response('Post not found',{status:404});

    const req=new URL(context.request.url);
    const origin=req.origin;
    const canonical=origin+'/post/'+encodeURIComponent(slug);
    const destination=origin+'/post.html?slug='+encodeURIComponent(slug);
    const description=String(p.body||'').replace(/\s+/g,' ').trim().slice(0,220);
    const image=p.image_url || origin+'/peppermoon-logo.png';

    const html=sharePage({
      title:p.title,
      description:description || 'Read this Peppermoon Community post.',
      image,
      canonical,
      destination,
      kind:'article'
    });

    return new Response(html,{
      headers:{
        'content-type':'text/html; charset=UTF-8',
        'cache-control':'public, max-age=120'
      }
    });
  } catch(err) {
    return new Response('Share preview error',{status:500});
  }
}
