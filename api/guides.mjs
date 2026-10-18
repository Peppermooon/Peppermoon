import {publishedGuides} from '../lib/guides-store.mjs';
import {renderPage} from '../lib/guides-render.mjs';
export default async function handler(req,res){
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method not allowed');}
 try{
  const slug=String(req.query?.slug||'');
  if(slug&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){res.statusCode=404;return res.end(req.method==='HEAD'?'':renderPage({error:'Guide not found',status:404}));}
  const {guides}=await publishedGuides();const guide=slug?guides.find(item=>item.slug===slug):null;
  const status=slug&&!guide?404:200;res.statusCode=status;
  const body=renderPage({guides,guide,error:status===404?'Guide not found':null,status});
  res.end(req.method==='HEAD'?'':body);
 }catch{res.statusCode=503;res.end(req.method==='HEAD'?'':renderPage({error:'Guides are temporarily unavailable. Please try again.',status:503}));}
}
