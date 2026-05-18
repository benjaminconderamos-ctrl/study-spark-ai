import type {
  AIProvider,
  GenerateObjectOptions,
  GenerateTextOptions,
  StreamChunk,
} from "./types";
import { AIError } from "./types";

const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

function authHeader(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AIError("LOVABLE_API_KEY is not configured", 500);
  return `Bearer ${key}`;
}

async function callChat(body: Record<string, unknown>): Promise<Response> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new AIError("AI rate limit reached. Please try again shortly.", 429);
    if (res.status === 402) throw new AIError("AI credits exhausted. Add credits in Workspace > Usage.", 402);
    throw new AIError(`AI request failed (${res.status}): ${text || res.statusText}`, res.status);
  }
  return res;
}

function buildMessages(opts: GenerateTextOptions) {
  const messages = [...opts.messages];
  if (opts.system) messages.unshift({ role: "system", content: opts.system });
  return messages;
}

export const lovableProvider: AIProvider = {
  name: "lovable",

  async generateText(opts) {
    const res = await callChat({
      model: opts.model ?? DEFAULT_MODEL,
      messages: buildMessages(opts),
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens,
    });
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content ?? "";
  },

  async generateObject<T>(opts: GenerateObjectOptions<T>): Promise<T> {
    const system = [
      opts.system ?? "",
      `Respond with a single JSON object matching the "${opts.schemaName}" schema.`,
      opts.schemaDescription ?? "",
      "Do not wrap the JSON in markdown. Do not include any commentary.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await callChat({
      model: opts.model ?? DEFAULT_MODEL,
      messages: buildMessages({ ...opts, system }),
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens,
      response_format: { type: "json_object" },
    });
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Some models wrap JSON in ```json fences; try a recovery pass.
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    }
    return opts.parse(parsed);
  },

  async *stream(opts: GenerateTextOptions): AsyncIterable<StreamChunk> {
    const res = await callChat({
      model: opts.model ?? DEFAULT_MODEL,
      messages: buildMessages(opts),
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.maxTokens,
      stream: true,
    });
    if (!res.body) return;

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) yield { delta };
          } catch {
            // ignore malformed keep-alive lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};
