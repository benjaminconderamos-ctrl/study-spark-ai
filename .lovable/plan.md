
# StudyFlow AI — Build Plan

AI-powered study platform: upload PDFs, generate summaries / flashcards / quizzes, chat with documents, track progress.

## Stack (adjusted to this project)

- **Frontend**: TanStack Start v1 (React 19 + Vite, Cloudflare Workers) — Lovable's stack, not Next.js
- **UI**: Tailwind v4 + shadcn/ui, following the uploaded `MINIMALIST_SKILL.md` design protocol (warm monochrome, editorial serif headings, geometric sans body, flat bento grids, no gradients/heavy shadows)
- **Backend**: Lovable Cloud (Supabase under the hood) — Postgres, Auth, Storage, RLS
- **Server logic**: `createServerFn` (no Edge Functions)
- **AI (temporary)**: Lovable AI Gateway via a swappable `AIProvider` interface
- **Deploy**: Lovable (Cloudflare Workers); you can fork/export later

## AI Provider Abstraction (key architectural decision)

All AI logic lives behind one interface so you swap providers later without touching features:

```
src/lib/ai/
  providers/
    types.ts            # AIProvider interface (complete, generateObject, stream)
    lovable.ts          # current impl — calls Lovable AI Gateway
    openai.ts           # stub for later
    anthropic.ts        # stub for later
  prompts/              # all prompts centralized, versioned
    summary.ts
    flashcards.ts
    quiz.ts
    tutor.ts
  services/             # feature-level services, provider-agnostic
    summary.service.ts
    flashcards.service.ts
    quiz.service.ts
    tutor.service.ts
  index.ts              # exports getAiProvider() — single swap point
```

Server functions import only from `services/`. Services depend on the interface, never on a concrete provider. To swap providers later: change one line in `index.ts`.

## Database Schema (Lovable Cloud / Postgres)

All tables RLS-enabled, scoped by `user_id = auth.uid()`. Roles in a separate `user_roles` table (security best practice).

```
profiles(id PK→auth.users, display_name, avatar_url, created_at)
user_roles(id, user_id, role app_role)              -- separate, with has_role() SECURITY DEFINER
documents(id, user_id, title, file_path, file_size, page_count, status, created_at)
processed_documents(id, document_id, full_text, created_at)
document_chunks(id, document_id, chunk_index, content, token_count)   -- ready for embeddings later
summaries(id, document_id, user_id, type, content jsonb, created_at)
flashcard_decks(id, document_id, user_id, title, created_at)
flashcards(id, deck_id, question, answer, category, difficulty, created_at)
flashcard_reviews(id, flashcard_id, user_id, rating, reviewed_at)     -- progress
quizzes(id, document_id, user_id, title, created_at)
quiz_questions(id, quiz_id, type, prompt, options jsonb, correct_answer, explanation)
quiz_attempts(id, quiz_id, user_id, score, total, started_at, completed_at)
quiz_answers(id, attempt_id, question_id, user_answer, is_correct)
chat_sessions(id, document_id, user_id, title, created_at)
chat_messages(id, session_id, role, content, created_at)
study_sessions(id, user_id, document_id, duration_seconds, activity_type, started_at)
```

Storage bucket `documents` (private), RLS so users only access their own files.

## Route Structure (TanStack file-based)

```
src/routes/
  __root.tsx
  index.tsx                          # landing
  login.tsx                          # email/password + Google
  signup.tsx
  _authenticated.tsx                 # auth gate (beforeLoad redirect)
  _authenticated/
    dashboard.tsx                    # stats, recent docs, quick actions
    documents.index.tsx              # library + upload
    documents.$documentId.tsx        # doc detail (tabs: summary, flashcards, quiz, chat)
    documents.$documentId.chat.tsx   # tutor chat
    flashcards.$deckId.tsx           # study mode
    quizzes.$quizId.tsx              # take quiz
    settings.tsx
  api/public/...                     # reserved for future webhooks
```

## Build Phases

Incremental, end of each phase = working app.

**Phase 1 — Foundation**
- Enable Lovable Cloud
- Tailwind theme: warm monochrome tokens in `src/styles.css` (oklch), serif heading family, geometric sans body, mono accent — per uploaded design protocol
- Base layout shell (top nav, sidebar for authed routes)
- Auth: email/password + Google sign-in, `profiles` table + trigger, `_authenticated` route guard, login/signup pages

**Phase 2 — Documents & Upload**
- Schema: `documents`, `processed_documents`, `document_chunks` + RLS + storage bucket
- Drag-and-drop PDF upload component (size/type validation, progress)
- Server fn `processDocument`: downloads PDF from storage, extracts text with `unpdf` (pure JS, Workers-compatible), cleans, chunks (~1000 tokens), stores
- Documents library page + document detail shell

**Phase 3 — AI Layer**
- AIProvider interface + Lovable Gateway implementation
- Prompts module
- Server fns: `generateSummary`, `generateFlashcards`, `generateQuiz`, `tutorChat` (each ~10 lines, delegates to a service)
- Error handling: 429/402 surfaced to UI

**Phase 4 — Summaries**
- `summaries` table
- "Generate summary" action on document detail → calls service → stores → renders (key concepts, bullets, simplified explanation)

**Phase 5 — Flashcards**
- `flashcard_decks`, `flashcards`, `flashcard_reviews`
- Generation flow + viewer (flip animation) + study mode with self-rated recall → writes reviews

**Phase 6 — Quizzes**
- `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers`
- Generation (MCQ / true-false / open) → take-quiz UI → scoring → history list

**Phase 7 — Tutor Chat**
- `chat_sessions`, `chat_messages`
- Streaming chat (`async function*` server fn) using document chunks as context (simple keyword retrieval now; vector retrieval is a later upgrade — schema already supports it)

**Phase 8 — Dashboard & Polish**
- Stats cards (docs uploaded, quizzes taken, avg score, study minutes)
- Recent activity, quick actions
- `study_sessions` tracking
- Empty states, loading skeletons, error boundaries, mobile responsive QA

## Performance & Security

- RLS on every table; service-role bypass only inside trusted server fns
- Zod input validation on all server fns
- File limits: PDF only, ≤ 20 MB
- TanStack Query for client cache + loaders
- Lazy route loading is default in TanStack Start
- Document chunking lets us send only relevant chunks to AI (cost + latency)

## Out of Scope for MVP

- Vector embeddings / semantic search (schema is ready; can layer pgvector later)
- SRS scheduling algorithm (track ratings now, schedule later)
- Sharing decks/quizzes with other users
- Billing / plans

## Deliverable Per Phase

Each phase produces: schema migration → server fns + services → UI screens → working end-to-end flow you can test. I'll pause after each phase so you can review before continuing.

Ready to start with Phase 1 (Cloud + theme + auth) on your approval.
