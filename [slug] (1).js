import { sharePage } from '../_shared.js';

export async function onRequest(context) {
  try {
    const slug=String(context.params.slug||'');
    if(!slug) return new Response('Article not found',{status:404});

    const api='https://bgzlqvbvmstebdsnzmqv.supabase.co/rest/v1/articles?slug=eq.'+
      encodeURIComponent(slug)+
      '&status=eq.published&select=title,summary,featured_image,slug';

    const r=await fetch(api,{
      headers:{
        apikey:'sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-',
        Authorization:'Bearer sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-'
      }
    });

    if(!r.ok) return new Response('Could not load article',{status:502});

    const rows=await r.json();
    const a=Array.isArray(rows)?rows[0]:null;
    if(!a) return new Response('Article not found',{status:404});

    const req=new URL(context.request.url);
    const origin=req.origin;
    const canonical=origin+'/article/'+encodeURIComponent(slug);
    const destination=origin+'/article.html?slug='+encodeURIComponent(slug);
    const image=a.featured_image || origin+'/peppermoon-logo.png';

    const html=sharePage({
      title:a.title,
      description:a.summary || 'Read this Peppermoon article.',
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
