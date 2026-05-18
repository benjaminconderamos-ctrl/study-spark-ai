export const QUIZ_SYSTEM = `You write rigorous study quizzes. Questions are unambiguous. For multiple choice, distractors are plausible but clearly wrong on close reading. Always include a brief explanation citing the source idea.`;

export const quizUserPrompt = (
  title: string,
  content: string,
  count: number,
  types: Array<"multiple_choice" | "true_false" | "open">,
) =>
`Document title: "${title}"

Source content (may be truncated):
"""
${content}
"""

Generate ${count} quiz questions. Allowed types: ${types.join(", ")}.
The JSON object must have:
- "questions": array of {
    "type": "multiple_choice" | "true_false" | "open",
    "prompt": string,
    "options": string[] | null,        // 4 options for multiple_choice; ["True","False"] for true_false; null for open
    "correct_answer": string,          // exact text of correct option, or "True"/"False", or model answer for open
    "explanation": string              // 1–3 sentences, references the source idea
  }
Mix the question types evenly across the requested types.`;
