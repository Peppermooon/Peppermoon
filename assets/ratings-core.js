export const categories = ['Movies', 'Gaming', 'TV Series'];
export function slugify(title) {
  return String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'pepper-review';
}
export function validateRating(input) {
  const title=String(input.title||'').trim(), summary=String(input.summary||'').trim(), review=String(input.review||'').trim();
  if (!title || title.length>160) throw new Error('Enter a title of up to 160 characters.');
  if (!categories.includes(input.category)) throw new Error('Choose Movies, Games or TV Series.');
  if (String(input.score).trim()==='' || !Number.isFinite(Number(input.score)) || Number(input.score)<0 || Number(input.score)>10) throw new Error('Enter a Pepper Score between 0 and 10.');
  const score=Math.round(Number(input.score)*10)/10;
  const year=input.release_year==='' || input.release_year==null ? null : Number(input.release_year);
  if(year!==null && (!Number.isInteger(year)||year<1900||year>2100))throw new Error('Enter a release year between 1900 and 2100.');
  const rank=input.top_rank==='' || input.top_rank==null ? null : Number(input.top_rank);
  if(rank!==null && (!Number.isInteger(rank)||rank<1||rank>10))throw new Error('Top 10 position must be between 1 and 10.');
  if(summary.length>400)throw new Error('Keep the summary under 400 characters.');
  if(!['draft','published'].includes(input.status))throw new Error('Invalid publication status.');
  if(input.status==='published'&&review.length<10)throw new Error('Add a review before publishing.');
  const image=String(input.image_url||'').trim();
  if(image){let url;try{url=new URL(image)}catch{throw new Error('Use a valid HTTPS cover image URL.')}if(url.protocol!=='https:')throw new Error('Use an HTTPS cover image URL.');}
  return {title,category:input.category,score,release_year:year,top_rank:rank,summary,review,status:input.status,image_url:image};
}
export function topTen(items, category) {
  return items.filter(item=>item.status==='published'&&item.category===category&&Number.isInteger(Number(item.top_rank))&&item.top_rank!==null&&Number(item.top_rank)>=1&&Number(item.top_rank)<=10).sort((a,b)=>a.top_rank-b.top_rank).slice(0,10);
}
export function displayCategory(category){return category==='Gaming'?'Games':category;}
