import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { retrieveRelevantChunks } from "./ai/context.server";
import { getAiProvider } from "./ai";
import { TUTOR_SYSTEM, tutorContextBlock } from "./ai/prompts/tutor";

const StartInput = z.object({ documentId: z.string().uuid() });

export const startChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, title")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");

    const { data: existing } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("document_id", doc.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { sessionId: existing.id };

    const { data: session, error: sErr } = await supabaseAdmin
      .from("chat_sessions")
      .insert({ document_id: doc.id, user_id: userId, title: doc.title })
      .select("id")
      .single();
    if (sErr || !session) throw new Error(sErr?.message ?? "Failed to create session");
    return { sessionId: session.id };
  });

const SendInput = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

export const sendTutorMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SendInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .select("id, user_id, document_id")
      .eq("id", data.sessionId)
      .single();
    if (error || !session) throw new Error("Session not found");
    if (session.user_id !== userId) throw new Error("Forbidden");

    const { isProUser } = await import("./entitlements.functions");
    if (!(await isProUser(userId))) {
      throw new Error("AI tutor is a Pro feature. Upgrade to StudyFlow Pro to chat with your documents.");
    }

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(20);

    await supabaseAdmin.from("chat_messages").insert({
      session_id: session.id,
      role: "user",
      content: data.message,
    });

    const chunks = await retrieveRelevantChunks(session.document_id, data.message, 5);
    const provider = getAiProvider();
    const reply = await provider.generateText({
      system: TUTOR_SYSTEM + "\n\n" + tutorContextBlock(chunks),
      messages: [
        ...((history ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))),
        { role: "user", content: data.message },
      ],
      temperature: 0.4,
    });

    const { data: saved, error: sErr } = await supabaseAdmin
      .from("chat_messages")
      .insert({ session_id: session.id, role: "assistant", content: reply })
      .select("id, content, role, created_at")
      .single();
    if (sErr) throw new Error(sErr.message);

    await supabaseAdmin
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", session.id);

    await supabaseAdmin.from("study_sessions").insert({
      user_id: userId,
      activity: "chat",
      duration_seconds: 0,
    });

    return { message: saved };
  });
