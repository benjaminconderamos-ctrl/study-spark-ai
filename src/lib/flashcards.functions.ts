import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadDocumentContext } from "./ai/context.server";
import { generateFlashcardsFromText } from "./ai/services/flashcards.service";

const GenInput = z.object({
  documentId: z.string().uuid(),
  count: z.number().int().min(4).max(30).default(12),
});

export const generateFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, title, status")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");
    if (doc.status !== "ready") throw new Error("Document is not ready yet.");

    const { title, content } = await loadDocumentContext(doc.id);
    const cards = await generateFlashcardsFromText(title, content, data.count);

    // Replace any existing deck for this document.
    await supabaseAdmin
      .from("flashcard_decks")
      .delete()
      .eq("document_id", doc.id);

    const { data: deck, error: deckErr } = await supabaseAdmin
      .from("flashcard_decks")
      .insert({ document_id: doc.id, user_id: userId, title })
      .select("id")
      .single();
    if (deckErr || !deck) throw new Error(deckErr?.message ?? "Failed to create deck");

    const rows = cards.map((c, i) => ({
      deck_id: deck.id,
      question: c.question,
      answer: c.answer,
      category: c.category,
      difficulty: c.difficulty,
      position: i,
    }));
    const { error: insErr } = await supabaseAdmin.from("flashcards").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { deckId: deck.id, count: rows.length };
  });

const ReviewInput = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});

export const recordFlashcardReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ownership check via RLS — must be able to see this card.
    const { data: card, error } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", data.flashcardId)
      .single();
    if (error || !card) throw new Error("Card not found");

    const { error: insErr } = await supabaseAdmin
      .from("flashcard_reviews")
      .insert({ flashcard_id: data.flashcardId, user_id: userId, rating: data.rating });
    if (insErr) throw new Error(insErr.message);
    return { ok: true as const };
  });
