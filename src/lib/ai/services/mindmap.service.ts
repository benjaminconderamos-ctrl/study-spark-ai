import { z } from "zod";
import { getAiProvider } from "../index";
import { MINDMAP_SYSTEM, mindmapUserPrompt } from "../prompts/mindmap";

const MindMapSchema = z.object({
  central: z.string().min(1).max(120),
  branches: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        children: z.array(z.string().min(1).max(100)).min(1).max(8),
      }),
    )
    .min(2)
    .max(10),
});

export type MindMap = z.infer<typeof MindMapSchema>;

export async function generateMindMapFromText(title: string, content: string): Promise<MindMap> {
  const provider = getAiProvider();
  return provider.generateObject<MindMap>({
    schemaName: "DocumentMindMap",
    schemaDescription:
      "A hierarchical mind map with a central topic, first-level branches (themes), and second-level children (concepts).",
    system: MINDMAP_SYSTEM,
    messages: [{ role: "user", content: mindmapUserPrompt(title, content) }],
    parse: (raw) => MindMapSchema.parse(raw),
    temperature: 0.3,
  });
}
