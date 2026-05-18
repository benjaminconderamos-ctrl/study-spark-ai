
-- Enum for document processing status
create type public.document_status as enum ('uploading', 'pending', 'processing', 'ready', 'failed');

-- documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  file_path text not null,
  file_size bigint not null default 0,
  page_count integer,
  status public.document_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_user on public.documents(user_id, created_at desc);

alter table public.documents enable row level security;

create policy "Users view own documents" on public.documents
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own documents" on public.documents
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own documents" on public.documents
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own documents" on public.documents
  for delete to authenticated using (auth.uid() = user_id);

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- processed_documents (1:1 with documents)
create table public.processed_documents (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  full_text text not null,
  created_at timestamptz not null default now()
);

alter table public.processed_documents enable row level security;

create policy "Users view own processed text" on public.processed_documents
  for select to authenticated using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );
create policy "Users manage own processed text" on public.processed_documents
  for all to authenticated using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );

-- document_chunks
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index idx_document_chunks_doc on public.document_chunks(document_id, chunk_index);

alter table public.document_chunks enable row level security;

create policy "Users view own chunks" on public.document_chunks
  for select to authenticated using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );
create policy "Users manage own chunks" on public.document_chunks
  for all to authenticated using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );

-- Private storage bucket for PDFs
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage policies: users only access their own folder (path = {user_id}/...)
create policy "Users read own pdf files" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload own pdf files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update own pdf files" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own pdf files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
