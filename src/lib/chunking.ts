// Rough token estimate: ~4 chars / token for English.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Split text into chunks of roughly `targetTokens` tokens with `overlapTokens` overlap.
// Splits on paragraph then sentence boundaries when possible.
export function chunkText(
  text: string,
  targetTokens = 1000,
  overlapTokens = 100,
): { content: string; token_count: number }[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const targetChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;

  // Split into paragraphs, then sentences within long paragraphs.
  const paragraphs = cleaned.split(/\n{2,}/);
  const pieces: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= targetChars) {
      pieces.push(p);
    } else {
      const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [p];
      pieces.push(...sentences.map((s) => s.trim()).filter(Boolean));
    }
  }

  const chunks: { content: string; token_count: number }[] = [];
  let buf = "";
  for (const piece of pieces) {
    if (buf.length + piece.length + 2 > targetChars && buf.length > 0) {
      chunks.push({ content: buf.trim(), token_count: estimateTokens(buf) });
      // Carry last `overlapChars` for context continuity.
      buf = buf.slice(-overlapChars) + "\n\n" + piece;
    } else {
      buf = buf ? buf + "\n\n" + piece : piece;
    }
  }
  if (buf.trim()) {
    chunks.push({ content: buf.trim(), token_count: estimateTokens(buf) });
  }
  return chunks;
}
