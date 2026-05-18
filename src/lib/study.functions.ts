import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ActivitySchema = z.enum(["summary", "flashcards", "quiz", "chat", "upload"]);

const LogInput = z.object({
  activity: ActivitySchema,
  documentId: z.string().uuid().nullable().optional(),
  durationSeconds: z.number().int().min(1).max(60 * 60 * 6),
});

export const logStudySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("study_sessions").insert({
      user_id: userId,
      document_id: data.documentId ?? null,
      activity: data.activity,
      duration_seconds: data.durationSeconds,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
