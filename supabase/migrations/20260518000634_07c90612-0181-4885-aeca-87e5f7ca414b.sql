
create type public.card_difficulty as enum ('easy', 'medium', 'hard');
create type public.review_rating as enum ('again', 'hard', 'good', 'easy');

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_decks_doc on public.flashcard_decks(document_id);
create index idx_decks_user on public.flashcard_decks(user_id);

alter table public.flashcard_decks enable row level security;
create policy "Users view own decks" on public.flashcard_decks
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own decks" on public.flashcard_decks
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own decks" on public.flashcard_decks
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own decks" on public.flashcard_decks
  for delete to authenticated using (auth.uid() = user_id);

create trigger trg_decks_updated_at
  before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  difficulty public.card_difficulty not null default 'medium',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_cards_deck on public.flashcards(deck_id, position);

alter table public.flashcards enable row level security;
create policy "Users view cards in own decks" on public.flashcards
  for select to authenticated using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = auth.uid())
  );
create policy "Users manage cards in own decks" on public.flashcards
  for all to authenticated using (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = auth.uid())
  );

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null,
  rating public.review_rating not null,
  reviewed_at timestamptz not null default now()
);
create index idx_reviews_user on public.flashcard_reviews(user_id, reviewed_at desc);
create index idx_reviews_card on public.flashcard_reviews(flashcard_id);

alter table public.flashcard_reviews enable row level security;
create policy "Users view own reviews" on public.flashcard_reviews
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own reviews" on public.flashcard_reviews
  for insert to authenticated with check (auth.uid() = user_id);
