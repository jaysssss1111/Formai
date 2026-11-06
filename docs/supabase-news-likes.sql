-- formai: shared like counts for the AI news articles.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Stores only an article's address and how many likes it has. Nothing about
-- the visitor (no name, email, IP address or device) is saved.

create table if not exists public.news_likes (
  url text primary key check (url ~ '^https://' and length(url) <= 500),
  likes integer not null default 0 check (likes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.news_likes enable row level security;

-- The website (the anon role) may read the counts, nothing else.
-- Changes go only through news_like() below, one like at a time.
grant usage on schema public to anon;
grant select on public.news_likes to anon;

drop policy if exists "read like counts" on public.news_likes;
create policy "read like counts" on public.news_likes
  for select to anon using (true);

-- Add (d = 1) or remove (d = -1) one like and return the new count.
create or replace function public.news_like(u text, d integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if d not in (1, -1) then raise exception 'd must be 1 or -1'; end if;
  if u !~ '^https://' or length(u) > 500 then raise exception 'bad article address'; end if;
  insert into public.news_likes (url, likes) values (u, greatest(d, 0))
  on conflict (url) do update
    set likes = greatest(public.news_likes.likes + d, 0), updated_at = now()
  returning likes into n;
  return n;
end
$$;

revoke all on function public.news_like(text, integer) from public;
grant execute on function public.news_like(text, integer) to anon;

-- To reset an article's count, edit its row in Table Editor -> news_likes, or run:
--   update public.news_likes set likes = 0 where url = 'https://…';
