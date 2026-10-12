import sharp from 'sharp';
const BASE='https://bgzlqvbvmstebdsnzmqv.supabase.co';
const KEY='sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-';
export default async function handler(req,res){
 try{
 const slug=new URL(req.url,'https://peppermoonlk.vercel.app').searchParams.get('slug');
 if(!slug||slug.length>240){res.statusCode=400;return res.end('Invalid article');}
 const query=new URL(BASE+'/rest/v1/articles');
 for(const [k,v] of Object.entries({select:'featured_image',slug:'eq.'+slug,status:'eq.published',limit:'1'}))query.searchParams.set(k,v);
 const result=await fetch(query,{headers:{apikey:KEY},signal:AbortSignal.timeout(8000)});
 if(!result.ok)throw new Error('Lookup failed');
 const [article]=await result.json();
 if(!article?.featured_image){res.statusCode=404;return res.end('Image not found');}
 const image=new URL(article.featured_image);
 if(image.origin!==BASE||!image.pathname.startsWith('/storage/v1/object/public/article-images/')){res.statusCode=404;return res.end('Image not available');}
 const source=await fetch(image,{signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!source.ok)throw new Error('Image unavailable');
 const bytes=Buffer.from(await source.arrayBuffer());
 if(bytes.length>20*1024*1024)throw new Error('Image too large');
 let output=await sharp(bytes,{limitInputPixels:40000000}).rotate().resize(1200,630,{fit:'contain',background:'#10131c'}).flatten({background:'#10131c'}).jpeg({quality:72}).toBuffer();
 if(output.length>300000)output=await sharp(output).jpeg({quality:50}).toBuffer();
 res.setHeader('Content-Type','image/jpeg');res.setHeader('Content-Length',String(output.length));
 res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
 res.statusCode=200;return res.end(output);
 }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');return res.end('Preview image unavailable');}
}
