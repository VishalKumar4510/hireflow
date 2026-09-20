// ============================================================
// AI Provider Interface
// Abstraction layer so AI providers can be swapped
// ============================================================

export interface AIProvider {
  /** Generate text from a prompt */
  generateText(prompt: string, systemPrompt?: string): Promise<string>;

  /** Generate structured JSON output */
  generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;

  /** Generate embedding for a single text */
  generateEmbedding(text: string): Promise<number[]>;

  /** Generate embeddings for multiple texts (batch) */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /** Get the provider name */
  getProviderName(): string;

  /** Get the model name used for text generation */
  getModelName(): string;
}

let currentProvider: AIProvider | null = null;

export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider;
  console.log(`✅ AI provider set: ${provider.getProviderName()} (${provider.getModelName()})`);
}

export function getAIProvider(): AIProvider {
  if (!currentProvider) {
    throw new Error('AI provider not initialized. Set GEMINI_API_KEY in .env');
  }
  return currentProvider;
}

export function isAIAvailable(): boolean {
  return currentProvider !== null;
}
