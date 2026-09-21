/**
 * AIProviderRegistry.ts — AI Provider Registry & Factory
 *
 * Discovers and selects the active AI Provider based on environment variables.
 * In accordance with Rule 0 and Rule 2:
 * If no provider is configured, returns explicit AI_PROVIDER = NOT_CONFIGURED
 * with the exact list of missing credentials. Zero fake AI, zero mock execution.
 */

import type { AIProvider, AICopilotRequest, AICopilotResponse } from './AIProviderTypes';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';

export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers: AIProvider[] = [];

  private constructor() {
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());
  }

  public static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.push(provider);
  }

  public getActiveProvider(): AIProvider | null {
    // 1. Explicit provider preference if specified
    const preferredId = process.env.AI_PROVIDER?.toLowerCase();
    if (preferredId) {
      const found = this.providers.find((p) => p.id === preferredId);
      if (found && found.isConfigured()) {
        return found;
      }
    }

    // 2. First configured provider
    for (const p of this.providers) {
      if (p.isConfigured()) {
        return p;
      }
    }

    return null;
  }

  public isAnyConfigured(): boolean {
    return this.getActiveProvider() !== null;
  }

  public getMissingKeys(): string[] {
    const keys = new Set<string>();
    for (const p of this.providers) {
      p.getMissingKeys().forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }

  public async execute(request: AICopilotRequest): Promise<AICopilotResponse> {
    const active = this.getActiveProvider();
    if (!active) {
      const missing = this.getMissingKeys();
      return {
        status: 'NOT_CONFIGURED',
        provider: 'NONE',
        model: 'NONE',
        message:
          'Żaden zewnętrzny AI Provider nie jest obecnie skonfigurowany w środowisku SoloSpot.\n\n' +
          'Aby podłączyć prawdziwy model AI, zdefiniuj jedną ze zmiennych środowiskowych:\n' +
          '• OPENAI_API_KEY (dla modeli GPT-4o / GPT-4o-mini / OpenRouter)\n' +
          '• GEMINI_API_KEY (dla modeli Google Gemini 2.0 / 1.5)\n\n' +
          'HACP działa w trybie bezpośrednim ze ścisłą weryfikacją BuilderDocument.',
        missingKeys: missing,
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      };
    }

    return active.generateWithTools(request);
  }
}
