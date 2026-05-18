import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Loads up to `maxChars` of document text (joined from chunks) for AI calls.
 * Truncates aggressively so prompts stay under model context limits.
 */
export async function loadDocumentContext(
  documentId: string,
  maxChars = 24000,
): Promise<{ title: string; content: string }> {
  const { data: doc, error: docErr } = await supabaseAdmin
    .from("documents")
    .select("title")
    .eq("id", documentId)
    .single();
  if (docErr || !doc) throw new Error("Document not found");

  const { data: chunks, error: chunkErr } = await supabaseAdmin
    .from("document_chunks")
    .select("content, chunk_index")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });
  if (chunkErr) throw new Error(chunkErr.message);
  if (!chunks || chunks.length === 0) {
    throw new Error("Document text is not available yet. Try reprocessing.");
  }

  let content = "";
  for (const c of chunks) {
    if (content.length + c.content.length > maxChars) {
      const remaining = maxChars - content.length;
      if (remaining > 200) content += "\n\n" + c.content.slice(0, remaining);
      break;
    }
    content += (content ? "\n\n" : "") + c.content;
  }
  return { title: doc.title, content };
}

/**
 * Naive keyword retrieval over chunks. Returns the top-K most-matching chunks
 * for the query. We will swap this for vector retrieval in a future phase.
 */
export async function retrieveRelevantChunks(
  documentId: string,
  query: string,
  k = 5,
): Promise<string[]> {
  const { data: chunks, error } = await supabaseAdmin
    .from("document_chunks")
    .select("content, chunk_index")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true });
  if (error) throw new Error(error.message);
  if (!chunks || chunks.length === 0) return [];

  const terms = Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    ),
  );
  if (terms.length === 0) {
    return chunks.slice(0, k).map((c) => c.content);
  }

  const scored = chunks.map((c) => {
    const lower = c.content.toLowerCase();
    let score = 0;
    for (const t of terms) {
      const matches = lower.split(t).length - 1;
      score += matches;
    }
    return { score, content: c.content };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, k);
  return (top.length > 0 ? top : scored.slice(0, k)).map((s) => s.content);
}
