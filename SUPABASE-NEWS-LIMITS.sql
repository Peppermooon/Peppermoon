-- Run once in your Peppermoon Supabase SQL Editor. Safe to run again; counters are preserved.
begin;
create table if not exists public.peppermoon_news_limits (
  month_start date primary key,
  local_day date not null,
  day_attempts integer not null default 0 check (day_attempts between 0 and 3),
  month_attempts integer not null default 0 check (month_attempts between 0 and 20)
);
alter table public.peppermoon_news_limits enable row level security;
revoke all on public.peppermoon_news_limits from public, anon, authenticated;

create or replace function public.peppermoon_reserve_news_attempt()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (statement_timestamp() at time zone 'Asia/Colombo')::date;
  month_key date := date_trunc('month', today)::date;
  usage public.peppermoon_news_limits%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  insert into public.peppermoon_news_limits (month_start, local_day)
    values (month_key, today) on conflict (month_start) do nothing;
  -- All admins and Vercel instances share this locked row, including simultaneous requests.
  select * into usage from public.peppermoon_news_limits
    where month_start = month_key for update;
  if usage.month_attempts >= 20 then
    return jsonb_build_object('allowed', false, 'reason', 'monthly');
  end if;
  if usage.local_day = today and usage.day_attempts >= 3 then
    return jsonb_build_object('allowed', false, 'reason', 'daily');
  end if;
  update public.peppermoon_news_limits
    set local_day = today,
        day_attempts = case when local_day = today then day_attempts + 1 else 1 end,
        month_attempts = month_attempts + 1
    where month_start = month_key
    returning * into usage;
  return jsonb_build_object('allowed', true, 'daily_remaining', 3 - usage.day_attempts,
    'monthly_remaining', 20 - usage.month_attempts);
end;
$$;
revoke all on function public.peppermoon_reserve_news_attempt() from public, anon, authenticated;
grant execute on function public.peppermoon_reserve_news_attempt() to authenticated;
commit;
