export const FLASHCARDS_SYSTEM = `You write high-quality study flashcards. Each card should test one atomic concept. Questions are short and specific. Answers are concise but complete. Avoid trivial trivia.`;

export const flashcardsUserPrompt = (title: string, content: string, count: number) =>
`Document title: "${title}"

Source content (may be truncated):
"""
${content}
"""

Generate ${count} flashcards. The JSON object must have:
- "cards": array of {
    "question": string,            // crisp prompt, no preamble
    "answer": string,              // 1–3 sentence answer
    "category": string,            // short topic tag, lowercase
    "difficulty": "easy" | "medium" | "hard"
  }
Distribute difficulty roughly: 30% easy, 50% medium, 20% hard.`;
