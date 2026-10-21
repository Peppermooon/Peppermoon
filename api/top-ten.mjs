import {readFileSync} from 'node:fs';
import {findList,renderTopTenPage} from '../lib/top-ten-render.mjs';
const template=readFileSync(new URL('../ratings.html',import.meta.url),'utf8');
export default function handler(req,res){
 const url=new URL(req.url,'https://thepeppermoon.com');
 const medium=String(req.query?.medium??url.searchParams.get('medium')??'');
 const genre=String(req.query?.genre??url.searchParams.get('genre')??'');
 const list=findList(medium,genre);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 if(!list){res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>List not found | Peppermoon</title><h1>List not found</h1><p><a href="/top-10/movies/action">Browse Top 10 by Genre</a></p></html>');return}
 res.statusCode=200;res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');res.end(renderTopTenPage(template,list));
}
