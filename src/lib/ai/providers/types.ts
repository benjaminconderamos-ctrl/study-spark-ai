/**
 * Provider-agnostic AI interface. Swap implementations in `index.ts`
 * without touching feature services.
 */
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateTextOptions {
  system?: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateObjectOptions<T> extends GenerateTextOptions {
  // JSON schema describing the expected object (used in the prompt).
  schemaName: string;
  schemaDescription?: string;
  // A safe parser that validates the model output.
  parse: (raw: unknown) => T;
}

export interface StreamChunk {
  delta: string;
}

export interface AIProvider {
  readonly name: string;
  generateText(opts: GenerateTextOptions): Promise<string>;
  generateObject<T>(opts: GenerateObjectOptions<T>): Promise<T>;
  stream(opts: GenerateTextOptions): AsyncIterable<StreamChunk>;
}

export class AIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "AIError";
  }
}
