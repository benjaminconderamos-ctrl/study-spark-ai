
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_chat_sessions_doc on public.chat_sessions(document_id);
create index idx_chat_sessions_user on public.chat_sessions(user_id, updated_at desc);
alter table public.chat_sessions enable row level security;
create policy "Users view own chat sessions" on public.chat_sessions for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own chat sessions" on public.chat_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own chat sessions" on public.chat_sessions for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own chat sessions" on public.chat_sessions for delete to authenticated using (auth.uid() = user_id);
create trigger trg_chat_sessions_updated_at before update on public.chat_sessions for each row execute function public.set_updated_at();

create type public.chat_role as enum ('user', 'assistant');

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role public.chat_role not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_chat_messages_session on public.chat_messages(session_id, created_at);
alter table public.chat_messages enable row level security;
create policy "Users view messages in own sessions" on public.chat_messages for select to authenticated using (
  exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
);
create policy "Users manage messages in own sessions" on public.chat_messages for all to authenticated using (
  exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid())
);

create type public.study_activity as enum ('summary', 'flashcards', 'quiz', 'chat', 'upload');

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_id uuid references public.documents(id) on delete set null,
  activity public.study_activity not null,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_study_sessions_user on public.study_sessions(user_id, created_at desc);
alter table public.study_sessions enable row level security;
create policy "Users view own study sessions" on public.study_sessions for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own study sessions" on public.study_sessions for insert to authenticated with check (auth.uid() = user_id);
