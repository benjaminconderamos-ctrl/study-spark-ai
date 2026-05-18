export const MINDMAP_SYSTEM = `You are an expert study coach who structures academic and technical material into clear hierarchical mind maps. Stay faithful to the source. Use terminology from the document. Keep labels short.`;

export const mindmapUserPrompt = (title: string, content: string) =>
`Document title: "${title}"

Source content (may be truncated):
"""
${content}
"""

Produce an interactive mind map structure. The JSON object must have:
- "central": short label for the central node (the main topic — usually the document title or its core subject), max 60 chars.
- "branches": array of 4 to 7 first-level themes/sections. Each item is:
  - "title": short label, max 40 chars.
  - "children": array of 2 to 5 key concepts/subtopics, each a short string label (max 50 chars).

Labels should be concise noun phrases — not full sentences. No numbering. No markdown.`;
