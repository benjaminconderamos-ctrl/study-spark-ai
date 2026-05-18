import type { AIProvider } from "./providers/types";
import { lovableProvider } from "./providers/lovable";

/** Swap provider here when migrating to OpenAI / Anthropic / etc. */
export function getAiProvider(): AIProvider {
  return lovableProvider;
}

export type { AIProvider } from "./providers/types";
export { AIError } from "./providers/types";
