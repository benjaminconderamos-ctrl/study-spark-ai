// Centralized prompts. Keep them concise and versioned via filename.

export const SUMMARY_SYSTEM = `You are an expert study coach who writes clear, accurate, and tightly-structured summaries of academic and technical documents. Avoid speculation. Quote terminology from the source. Use plain language.`;

export const summaryUserPrompt = (title: string, content: string) =>
`Document title: "${title}"

Source content (may be truncated):
"""
${content}
"""

Produce a study summary. The JSON object must have these fields:
- "overview": 2–4 sentence plain-language overview.
- "key_concepts": array of { "term": string, "definition": string } — 5 to 10 items, cover the most important ideas.
- "bullets": array of 6–12 short bullet points capturing the essential takeaways.
- "simplified": a 1-paragraph "explain like I'm 15" version of the material.`;
