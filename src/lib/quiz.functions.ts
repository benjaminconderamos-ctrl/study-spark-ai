import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadDocumentContext } from "./ai/context.server";
import { generateQuizFromText } from "./ai/services/quiz.service";

const GenInput = z.object({
  documentId: z.string().uuid(),
  count: z.number().int().min(3).max(20).default(8),
  types: z
    .array(z.enum(["multiple_choice", "true_false", "open"]))
    .min(1)
    .default(["multiple_choice", "true_false"]),
});

export const generateQuiz = createServerFn({ method: "POST" })
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
    const questions = await generateQuizFromText(title, content, data.count, data.types);

    // Replace existing quiz for this document (MVP: single quiz per doc).
    await supabaseAdmin.from("quizzes").delete().eq("document_id", doc.id);

    const { data: quiz, error: qErr } = await supabaseAdmin
      .from("quizzes")
      .insert({ document_id: doc.id, user_id: userId, title })
      .select("id")
      .single();
    if (qErr || !quiz) throw new Error(qErr?.message ?? "Failed to create quiz");

    const rows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      position: i,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
    const { error: insErr } = await supabaseAdmin.from("quiz_questions").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { quizId: quiz.id, count: rows.length };
  });

const SubmitInput = z.object({
  quizId: z.string().uuid(),
  answers: z
    .array(z.object({ questionId: z.string().uuid(), answer: z.string().max(2000) }))
    .min(1),
});

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("id, user_id")
      .eq("id", data.quizId)
      .single();
    if (error || !quiz) throw new Error("Quiz not found");
    if (quiz.user_id !== userId) throw new Error("Forbidden");

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, type, correct_answer")
      .eq("quiz_id", data.quizId);
    if (qErr) throw new Error(qErr.message);

    const correctMap = new Map(questions?.map((q) => [q.id, q]));
    let score = 0;
    const answerRows: Array<{
      question_id: string;
      user_answer: string;
      is_correct: boolean;
    }> = [];
    for (const a of data.answers) {
      const q = correctMap.get(a.questionId);
      if (!q) continue;
      const isCorrect =
        q.type === "open"
          ? false // open answers require manual review; mark wrong by default
          : a.answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      if (isCorrect) score++;
      answerRows.push({ question_id: a.questionId, user_answer: a.answer, is_correct: isCorrect });
    }

    const { data: attempt, error: aErr } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({
        quiz_id: data.quizId,
        user_id: userId,
        score,
        total: questions?.length ?? 0,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (aErr || !attempt) throw new Error(aErr?.message ?? "Failed to record attempt");

    const { error: ansErr } = await supabaseAdmin
      .from("quiz_answers")
      .insert(answerRows.map((r) => ({ ...r, attempt_id: attempt.id })));
    if (ansErr) throw new Error(ansErr.message);

    await supabaseAdmin.from("study_sessions").insert({
      user_id: userId,
      activity: "quiz",
      duration_seconds: 0,
    });

    return { attemptId: attempt.id, score, total: questions?.length ?? 0 };
  });
