import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isMaxUser } from "@/lib/entitlements.server";
import { getAiProvider } from "@/lib/ai";

const MathSolutionSchema = z.object({
  restated: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  answer: z.string().min(1),
  plot: z
    .object({
      title: z.string(),
      xLabel: z.string().default("x"),
      yLabel: z.string().default("y"),
      series: z
        .array(
          z.object({
            label: z.string(),
            points: z
              .array(z.object({ x: z.number(), y: z.number() }))
              .min(2)
              .max(400),
          }),
        )
        .min(1)
        .max(3),
    })
    .nullable(),
});

export type MathSolution = z.infer<typeof MathSolutionSchema>;

const SYSTEM = `You are an expert math tutor. Solve the user's problem rigorously and clearly.
- Show concise step-by-step reasoning (4-8 steps maximum).
- Cover algebra, calculus, statistics, geometry, linear algebra, and discrete math.
- When the problem involves a function, equation, dataset, or curve that can be visualized in 2D,
  return a "plot" object with sample points (40-120 per series). Otherwise set "plot" to null.
- For functions f(x), sample x evenly across a meaningful domain (e.g. [-5, 5] or wider if needed).
- For datasets, plot the given points.
- Keep all numeric values finite. No NaN, no Infinity.
- Write math using plain text (e.g. x^2, sqrt(x), pi). Do not use LaTeX.`;

export const solveMath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { problem: string }) =>
    z.object({ problem: z.string().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<MathSolution> => {
    const { userId } = context;
    if (!(await isMaxUser(userId))) {
      throw new Error("Math Solver is a Max-plan feature. Upgrade to unlock.");
    }
    const provider = getAiProvider();
    return provider.generateObject<MathSolution>({
      schemaName: "MathSolution",
      schemaDescription:
        "A solved math problem with step-by-step reasoning, the final answer, and optional 2D plot data.",
      system: SYSTEM,
      messages: [{ role: "user", content: data.problem }],
      parse: (raw) => MathSolutionSchema.parse(raw),
      temperature: 0.2,
      maxTokens: 2000,
    });
  });
