import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadDocumentContext } from "./ai/context.server";
import { generateSummaryFromText } from "./ai/services/summary.service";

const Input = z.object({ documentId: z.string().uuid() });

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, status")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");
    if (doc.status !== "ready") throw new Error("Document is not ready yet.");

    const { title, content } = await loadDocumentContext(doc.id);
    const summary = await generateSummaryFromText(title, content);

    const { error: upErr } = await supabaseAdmin
      .from("summaries")
      .upsert(
        { document_id: doc.id, user_id: userId, content: summary },
        { onConflict: "document_id" },
      );
    if (upErr) throw new Error(upErr.message);

    return { summary };
  });
