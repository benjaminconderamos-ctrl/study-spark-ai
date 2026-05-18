
create type public.quiz_question_type as enum ('multiple_choice', 'true_false', 'open');

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_quizzes_doc on public.quizzes(document_id);
create index idx_quizzes_user on public.quizzes(user_id);

alter table public.quizzes enable row level security;
create policy "Users view own quizzes" on public.quizzes
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own quizzes" on public.quizzes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own quizzes" on public.quizzes
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own quizzes" on public.quizzes
  for delete to authenticated using (auth.uid() = user_id);

create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position integer not null default 0,
  type public.quiz_question_type not null,
  prompt text not null,
  options jsonb,
  correct_answer text not null,
  explanation text,
  created_at timestamptz not null default now()
);
create index idx_quiz_questions_quiz on public.quiz_questions(quiz_id, position);

alter table public.quiz_questions enable row level security;
create policy "Users view questions in own quizzes" on public.quiz_questions
  for select to authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );
create policy "Users manage questions in own quizzes" on public.quiz_questions
  for all to authenticated using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid())
  );

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null,
  score integer not null default 0,
  total integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index idx_attempts_user on public.quiz_attempts(user_id, started_at desc);
create index idx_attempts_quiz on public.quiz_attempts(quiz_id);

alter table public.quiz_attempts enable row level security;
create policy "Users view own attempts" on public.quiz_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own attempts" on public.quiz_attempts
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own attempts" on public.quiz_attempts
  for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own attempts" on public.quiz_attempts
  for delete to authenticated using (auth.uid() = user_id);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index idx_quiz_answers_attempt on public.quiz_answers(attempt_id);

alter table public.quiz_answers enable row level security;
create policy "Users view answers in own attempts" on public.quiz_answers
  for select to authenticated using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );
create policy "Users manage answers in own attempts" on public.quiz_answers
  for all to authenticated using (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );
