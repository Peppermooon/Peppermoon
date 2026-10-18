import seeds from '../data/guides-seed.mjs';
const SUPABASE='https://bgzlqvbvmstebdsnzmqv.supabase.co';
const KEY='sb_publishable_Vr9Pah1UIb3EjRNTfT5vgg_VPnz3vl-';
export async function publishedGuides(fetcher=fetch){
 const url=new URL(SUPABASE+'/rest/v1/pepper_guides');
 url.searchParams.set('select','*');url.searchParams.set('status','eq.published');url.searchParams.set('order','display_order.asc,franchise.asc');url.searchParams.set('limit','1000');
 const response=await fetcher(url,{headers:{apikey:KEY},signal:AbortSignal.timeout(8000)});
 if(!response.ok){
  let error={};try{error=await response.json();}catch{}
  if(['PGRST205','42P01'].includes(error.code))return {guides:seeds,setupRequired:true};
  throw new Error('Guides are temporarily unavailable.');
 }
 const guides=await response.json();if(!Array.isArray(guides))throw new Error('Invalid guide response.');
 return {guides,setupRequired:false};
}
