import { z } from "zod";
import { getAiProvider } from "../index";
import { SUMMARY_SYSTEM, summaryUserPrompt } from "../prompts/summary";

const SummarySchema = z.object({
  overview: z.string().min(1),
  key_concepts: z
    .array(z.object({ term: z.string().min(1), definition: z.string().min(1) }))
    .min(1),
  bullets: z.array(z.string().min(1)).min(1),
  simplified: z.string().min(1),
});

export type Summary = z.infer<typeof SummarySchema>;

export async function generateSummaryFromText(title: string, content: string): Promise<Summary> {
  const provider = getAiProvider();
  return provider.generateObject<Summary>({
    schemaName: "DocumentSummary",
    schemaDescription:
      "A study summary with overview, key concepts (term/definition pairs), bullet takeaways, and a simplified explanation.",
    system: SUMMARY_SYSTEM,
    messages: [{ role: "user", content: summaryUserPrompt(title, content) }],
    parse: (raw) => SummarySchema.parse(raw),
    temperature: 0.3,
  });
}
