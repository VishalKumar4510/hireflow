// ============================================================
// Gemini AI Provider Implementation
// Uses @google/genai SDK with automatic retry & fallback cascade
// ============================================================

import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './provider';

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = [
  PRIMARY_MODEL,
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
].filter((m, i, arr) => arr.indexOf(m) === i); // deduplicate

const EMBEDDING_MODELS = [
  process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  'gemini-embedding-2',
];
const EMBEDDING_DIMENSIONS = 1536;

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;
  private activeModel: string = PRIMARY_MODEL;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  getModelName(): string {
    return this.activeModel;
  }

  private async executeWithFallback<R>(
    action: (model: string) => Promise<R>,
    actionName: string
  ): Promise<R> {
    const modelsToTry = [
      this.activeModel,
      ...FALLBACK_MODELS.filter(m => m !== this.activeModel),
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await action(model);
          if (this.activeModel !== model) {
            console.log(`[Gemini] Model auto-switched to healthy model: ${model}`);
            this.activeModel = model;
          }
          return result;
        } catch (err: unknown) {
          lastError = err as Error;
          const msg = lastError.message || '';
          const isHighDemandOrTransient =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('rate limit') ||
            msg.includes('ETIMEDOUT') ||
            msg.includes('ECONNRESET');

          if (isHighDemandOrTransient) {
            console.warn(`[Gemini] ${actionName} on ${model} (attempt ${attempt}/2): temporary spike or 503 (${msg.slice(0, 100)}).`);
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 600 * attempt));
              continue;
            }
            // Move to next model in cascade
            break;
          } else {
            console.warn(`[Gemini] ${actionName} on ${model} returned error: ${msg.slice(0, 120)}. Trying fallback model...`);
            break;
          }
        }
      }
    }

    throw new Error(`AI generation failed after fallback attempts: ${lastError?.message}`);
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    return this.executeWithFallback(async (model: string) => {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt || 'You are HireFlow, an AI recruitment intelligence assistant. Provide accurate, evidence-based analysis. Never fabricate information. Never make hiring decisions.',
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      });

      return response.text || '';
    }, 'generateText');
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const fullPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no extra text. Just the JSON object/array.`;

    return this.executeWithFallback(async (model: string) => {
      const response = await this.client.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt || 'You are HireFlow, an AI recruitment intelligence assistant. Respond only with valid JSON.',
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });

      const rawText = (response.text || '{}').trim();

      // Clean markdown fences if any
      let cleanText = rawText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      try {
        return JSON.parse(cleanText) as T;
      } catch {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T;
        }
        throw new Error(`Could not parse JSON response from ${model}`);
      }
    }, 'generateJSON');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    let lastError: Error | null = null;

    for (const model of EMBEDDING_MODELS) {
      try {
        const result = await this.client.models.embedContent({
          model,
          contents: text,
          config: {
            outputDimensionality: EMBEDDING_DIMENSIONS,
          },
        });

        return result.embeddings?.[0]?.values || [];
      } catch (error) {
        lastError = error as Error;
        console.warn(`[Gemini] Embedding with ${model} failed, trying fallback: ${(error as Error).message.slice(0, 100)}`);
      }
    }

    throw new Error(`Embedding generation failed: ${lastError?.message}`);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = 10;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);

      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }
}

export function createGeminiProvider(): GeminiProvider | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
    return null;
  }
  return new GeminiProvider(apiKey);
}
