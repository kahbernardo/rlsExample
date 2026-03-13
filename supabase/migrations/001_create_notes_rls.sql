create table public.notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null
);

alter table public.notes enable row level security;

create policy "users_select_own_notes"
  on public.notes
  for select
  using (auth.uid() = user_id);

create policy "users_insert_own_notes"
  on public.notes
  for insert
  with check (auth.uid() = user_id);
