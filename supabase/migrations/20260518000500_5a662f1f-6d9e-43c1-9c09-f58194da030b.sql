
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  user_id uuid not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_summaries_user on public.summaries(user_id);

alter table public.summaries enable row level security;

create policy "Users view own summaries" on public.summaries
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own summaries" on public.summaries
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own summaries" on public.summaries
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own summaries" on public.summaries
  for delete to authenticated using (auth.uid() = user_id);

create trigger trg_summaries_updated_at
  before update on public.summaries
  for each row execute function public.set_updated_at();
