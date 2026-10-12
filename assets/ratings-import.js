import {validateRating,slugify} from './ratings-core.js';
const identity=item=>item.category+'|'+String(item.title).toLowerCase().replace(/part\s+ii\b/g,'part 2').replace(/[^a-z0-9]/g,'');
export function prepareImports(rows,existing,userId){
 if(!Array.isArray(rows)||rows.length!==30)throw new Error('The prepared list must contain 30 ratings.');
 const known=new Set(existing.map(identity)),slugs=new Set(existing.map(item=>item.slug)),seen=new Set();
 const result=[];
 for(const row of rows){
 const key=identity(row);if(seen.has(key))throw new Error('The prepared list contains a duplicate title.');seen.add(key);
 if(known.has(key))continue;
 const payload=validateRating({...row,status:'draft'});
 const slug='pepper-draft-'+slugify(payload.title);
 if(slugs.has(slug))throw new Error('A review with that import slug already exists. Please check it before importing.');
 result.push({...payload,slug,created_by:userId});}
 return result;
}
