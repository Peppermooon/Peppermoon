// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table public.profiles(id uuid primary key,role text);
insert into public.profiles values ('11111111-1111-1111-1111-111111111111','admin'),('22222222-2222-2222-2222-222222222222','member');`);
const sql=await readFile(new URL('../SUPABASE-NEWS-LIMITS.sql',import.meta.url),'utf8');await db.exec(sql);
async function uid(id){await db.query("select set_config('test.uid',$1,false)",[id])}
async function reserve(){return (await db.query('select public.peppermoon_reserve_news_attempt() as quota')).rows[0].quota}
await uid('');await assert.rejects(reserve,/Admin access/);
await uid('22222222-2222-2222-2222-222222222222');await assert.rejects(reserve,/Admin access/);
await uid('11111111-1111-1111-1111-111111111111');
const burst=await Promise.all(Array.from({length:15},()=>reserve()));assert.equal(burst.filter(q=>q.allowed).length,3);assert.equal(burst.filter(q=>q.reason==='daily').length,12);
await db.exec(sql);assert.equal((await reserve()).reason,'daily'); // rerun does not reset limits
await db.exec("update public.peppermoon_news_limits set local_day=local_day-1");assert.equal((await reserve()).daily_remaining,2);
await db.exec("update public.peppermoon_news_limits set month_attempts=20,local_day=local_day-1");assert.equal((await reserve()).reason,'monthly');
// Simulate history from the prior month. New-month counters begin at zero.
await db.exec("update public.peppermoon_news_limits set month_start=(month_start-interval '1 month')::date");assert.equal((await reserve()).monthly_remaining,19);
await db.exec('set role authenticated');await assert.rejects(()=>db.query('select * from public.peppermoon_news_limits'),/permission denied/);await assert.rejects(()=>db.query('update public.peppermoon_news_limits set month_attempts=0'),/permission denied/);
assert.equal((await reserve()).allowed,true);await db.exec('reset role');
await db.exec('set role anon');await assert.rejects(reserve,/permission denied/);
await db.close();console.log('Passed real PostgreSQL: admin check, 15-request burst limited to 3, daily/monthly rollover, rerun persistence, table access denied, anonymous RPC denied.');
