import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadDocumentContext } from "./ai/context.server";
import { generateMindMapFromText } from "./ai/services/mindmap.service";

const Input = z.object({ documentId: z.string().uuid() });

export const generateMindMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { isMaxUser } = await import("./entitlements.server");
    if (!(await isMaxUser(userId))) {
      throw new Error("Mind maps are a Max plan feature. Upgrade to Max to unlock automatic mind maps.");
    }

    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, status")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");
    if (doc.status !== "ready") throw new Error("Document is not ready yet.");

    const { title, content } = await loadDocumentContext(doc.id);
    const mindmap = await generateMindMapFromText(title, content);
    return { mindmap };
  });
