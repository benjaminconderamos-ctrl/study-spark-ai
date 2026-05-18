import { z } from "zod";
import { getAiProvider } from "../index";
import { FLASHCARDS_SYSTEM, flashcardsUserPrompt } from "../prompts/flashcards";

const CardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1).default("general"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});
const DeckSchema = z.object({ cards: z.array(CardSchema).min(1) });

export type GeneratedCard = z.infer<typeof CardSchema>;

export async function generateFlashcardsFromText(
  title: string,
  content: string,
  count = 12,
): Promise<GeneratedCard[]> {
  const provider = getAiProvider();
  const result = await provider.generateObject<{ cards: GeneratedCard[] }>({
    schemaName: "FlashcardDeck",
    schemaDescription: `A set of ${count} flashcards covering the most important ideas of the document.`,
    system: FLASHCARDS_SYSTEM,
    messages: [{ role: "user", content: flashcardsUserPrompt(title, content, count) }],
    parse: (raw) => DeckSchema.parse(raw),
    temperature: 0.5,
  });
  return result.cards;
}
