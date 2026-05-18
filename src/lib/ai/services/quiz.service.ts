import { z } from "zod";
import { getAiProvider } from "../index";
import { QUIZ_SYSTEM, quizUserPrompt } from "../prompts/quiz";

const QuestionSchema = z.object({
  type: z.enum(["multiple_choice", "true_false", "open"]),
  prompt: z.string().min(1),
  options: z.array(z.string()).nullable().optional(),
  correct_answer: z.string().min(1),
  explanation: z.string().default(""),
});
const QuizSchema = z.object({ questions: z.array(QuestionSchema).min(1) });

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;

export async function generateQuizFromText(
  title: string,
  content: string,
  count = 8,
  types: Array<"multiple_choice" | "true_false" | "open"> = ["multiple_choice", "true_false"],
): Promise<GeneratedQuestion[]> {
  const provider = getAiProvider();
  const result = await provider.generateObject<{ questions: GeneratedQuestion[] }>({
    schemaName: "Quiz",
    schemaDescription: `A ${count}-question quiz covering the document.`,
    system: QUIZ_SYSTEM,
    messages: [{ role: "user", content: quizUserPrompt(title, content, count, types) }],
    parse: (raw) => QuizSchema.parse(raw),
    temperature: 0.4,
  });
  return result.questions;
}
