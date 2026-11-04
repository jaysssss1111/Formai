-- formai: shared booked times for the booking calendar.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Stores only date and time. Names and emails go to your inbox via Formspree.

create table if not exists public.booked_slots (
  date date not null,
  time text not null check (time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  primary key (date, time)          -- the same time cannot be booked twice
);

alter table public.booked_slots enable row level security;

-- Let the website (the anon role) read and add rows, nothing else.
-- Needed when "Automatically expose new tables" is turned off.
grant usage on schema public to anon;
grant select, insert on public.booked_slots to anon;

-- Visitors may see which times are taken.
create policy "read booked times" on public.booked_slots
  for select to anon using (true);

-- Visitors may book a weekday time from today up to about two months ahead.
create policy "book a future time" on public.booked_slots
  for insert to anon
  with check (
    date >= current_date
    and date <= current_date + 62
    and extract(isodow from date) between 1 and 5
  );

-- To free a time again (for example a cancelled meeting), delete its row in
-- Table Editor -> booked_slots, or run:
--   delete from public.booked_slots where date = '2026-11-12' and time = '14:00';
