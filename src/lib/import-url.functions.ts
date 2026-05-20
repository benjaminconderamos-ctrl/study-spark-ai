import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { chunkText } from "./chunking";

const Input = z.object({
  url: z.string().url().max(2000),
});

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function extractYouTubeId(url: string): string | null {
  const m = url.match(YT_REGEX);
  return m ? m[1] : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchYouTubeTranscript(videoId: string): Promise<{ title: string; text: string }> {
  // 1. Get watch page to extract title and caption tracks
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!watchRes.ok) throw new Error(`YouTube fetch failed (${watchRes.status})`);
  const html = await watchRes.text();

  const titleMatch =
    html.match(/<meta name="title" content="([^"]+)"/) ||
    html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/ - YouTube$/, "")) : `YouTube ${videoId}`;

  // Extract captionTracks from ytInitialPlayerResponse
  const tracksMatch = html.match(/"captionTracks":(\[.*?\])/);
  if (!tracksMatch) {
    throw new Error("This video has no available transcript/captions.");
  }
  let tracks: Array<{ baseUrl: string; languageCode?: string; kind?: string }>;
  try {
    tracks = JSON.parse(tracksMatch[1].replace(/\\u0026/g, "&"));
  } catch {
    throw new Error("Could not parse YouTube caption data.");
  }
  if (!tracks.length) throw new Error("This video has no available captions.");

  // Prefer English, otherwise first available
  const preferred =
    tracks.find((t) => t.languageCode === "en" && !t.kind) ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("es")) ||
    tracks[0];

  const transcriptRes = await fetch(preferred.baseUrl);
  if (!transcriptRes.ok) throw new Error("Could not download YouTube transcript.");
  const xml = await transcriptRes.text();

  // Parse XML <text> nodes
  const segments = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
    decodeHtmlEntities(m[1]).replace(/\n/g, " "),
  );
  const text = segments.join(" ").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("Transcript was empty.");

  return { title, text };
}

async function fetchWebPage(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LovableBot/1.0; +https://lovable.dev)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
  const html = await res.text();

  const titleMatch =
    html.match(/<meta property="og:title" content="([^"]+)"/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : new URL(url).hostname;

  // Prefer <article> or <main> content if present
  const bodyMatch =
    html.match(/<article[\s\S]*?<\/article>/i) ||
    html.match(/<main[\s\S]*?<\/main>/i) ||
    html.match(/<body[\s\S]*?<\/body>/i);
  const text = stripHtml(bodyMatch ? bodyMatch[0] : html);
  if (text.length < 200) throw new Error("Could not extract enough text from this page.");

  // Cap to ~150k chars to keep things sane
  return { title, text: text.slice(0, 150_000) };
}

export const importFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Gate: Max only
    const { isMaxUser } = await import("./entitlements.server");
    if (!(await isMaxUser(userId))) {
      throw new Error("Importing from URLs and YouTube is a Max plan feature.");
    }

    const ytId = extractYouTubeId(data.url);
    const sourceType = ytId ? "youtube" : "url";

    let title: string;
    let fullText: string;
    try {
      if (ytId) {
        const r = await fetchYouTubeTranscript(ytId);
        title = r.title;
        fullText = r.text;
      } else {
        const r = await fetchWebPage(data.url);
        title = r.title;
        fullText = r.text;
      }
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Import failed");
    }

    // Create document row (ready immediately — no async processing needed)
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("documents")
      .insert({
        user_id: userId,
        title: title.slice(0, 240),
        file_path: null,
        file_size: fullText.length,
        status: "ready",
        source_type: sourceType,
        source_url: data.url,
      })
      .select("id")
      .single();
    if (insErr || !inserted) throw new Error(insErr?.message ?? "Could not save document");

    await supabaseAdmin.from("processed_documents").insert({
      document_id: inserted.id,
      full_text: fullText,
    });

    const chunks = chunkText(fullText, 1000, 100);
    if (chunks.length > 0) {
      const rows = chunks.map((c, i) => ({
        document_id: inserted.id,
        chunk_index: i,
        content: c.content,
        token_count: c.token_count,
      }));
      const batch = 50;
      for (let i = 0; i < rows.length; i += batch) {
        await supabaseAdmin.from("document_chunks").insert(rows.slice(i, i + batch));
      }
    }

    return { documentId: inserted.id, sourceType };
  });
