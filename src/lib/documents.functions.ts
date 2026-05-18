import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { chunkText } from "./chunking";

const ProcessInput = z.object({ documentId: z.string().uuid() });

/**
 * Downloads the PDF from storage, extracts text with `unpdf`,
 * chunks it, and writes processed_documents + document_chunks.
 * Idempotent: safe to retry.
 */
export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProcessInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify ownership via authed client (RLS)
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, user_id, file_path, status")
      .eq("id", data.documentId)
      .single();
    if (docErr || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");

    // Mark processing
    await supabaseAdmin
      .from("documents")
      .update({ status: "processing", error_message: null })
      .eq("id", doc.id);

    try {
      // Download via admin (we already verified ownership)
      const { data: file, error: dlErr } = await supabaseAdmin.storage
        .from("documents")
        .download(doc.file_path);
      if (dlErr || !file) throw new Error(dlErr?.message ?? "Download failed");

      const buf = new Uint8Array(await file.arrayBuffer());
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buf);
      const pageCount = pdf.numPages;
      const { text } = await extractText(pdf, { mergePages: true });
      const fullText = Array.isArray(text) ? text.join("\n\n") : String(text);

      if (!fullText.trim()) throw new Error("No extractable text in PDF");

      // Wipe any prior processing for idempotency
      await supabaseAdmin.from("processed_documents").delete().eq("document_id", doc.id);
      await supabaseAdmin.from("document_chunks").delete().eq("document_id", doc.id);

      await supabaseAdmin.from("processed_documents").insert({
        document_id: doc.id,
        full_text: fullText,
      });

      const chunks = chunkText(fullText, 1000, 100);
      if (chunks.length > 0) {
        const rows = chunks.map((c, i) => ({
          document_id: doc.id,
          chunk_index: i,
          content: c.content,
          token_count: c.token_count,
        }));
        // Insert in batches to keep payloads small
        const batch = 50;
        for (let i = 0; i < rows.length; i += batch) {
          const { error: insErr } = await supabaseAdmin
            .from("document_chunks")
            .insert(rows.slice(i, i + batch));
          if (insErr) throw new Error(insErr.message);
        }
      }

      await supabaseAdmin
        .from("documents")
        .update({ status: "ready", page_count: pageCount })
        .eq("id", doc.id);

      return { ok: true as const, pageCount, chunks: chunks.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      await supabaseAdmin
        .from("documents")
        .update({ status: "failed", error_message: message })
        .eq("id", doc.id);
      throw new Error(message);
    }
  });

const DeleteInput = z.object({ documentId: z.string().uuid() });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, user_id, file_path")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    if (doc.user_id !== userId) throw new Error("Forbidden");

    await supabaseAdmin.storage.from("documents").remove([doc.file_path]);
    await supabaseAdmin.from("documents").delete().eq("id", doc.id);
    return { ok: true as const };
  });
