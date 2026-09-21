/**
 * GeminiProvider.ts — Google Gemini AI Provider Implementation
 *
 * Implements real function calling via Google Generative Language REST API.
 * Uses gemini-2.0-flash or gemini-1.5-pro with tools/functionDeclarations.
 */

import type { AIProvider, AICopilotRequest, AICopilotResponse, HacpToolCall } from './AIProviderTypes';

export class GeminiProvider implements AIProvider {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini';

  private apiKey: string | null;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getMissingKeys(): string[] {
    return this.isConfigured() ? [] : ['GEMINI_API_KEY'];
  }

  public async generateWithTools(request: AICopilotRequest): Promise<AICopilotResponse> {
    if (!this.isConfigured()) {
      return {
        status: 'NOT_CONFIGURED',
        provider: this.name,
        model: this.model,
        message: 'AI Provider Google Gemini nie jest skonfigurowany. Brak zmiennej GEMINI_API_KEY.',
        missingKeys: ['GEMINI_API_KEY'],
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      // Format tools for Gemini API
      const functionDeclarations = (request.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      // Format messages into Gemini contents
      const contents = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      // Extract system instruction if present
      const systemMsg = request.messages.find((m) => m.role === 'system');

      const bodyPayload: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: 0.2,
        },
      };

      if (systemMsg) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemMsg.content }],
        };
      }

      if (functionDeclarations.length > 0) {
        bodyPayload.tools = [{ functionDeclarations }];
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          status: 'ERROR',
          provider: this.name,
          model: this.model,
          message: `Błąd komunikacji z Google Gemini (${response.status}): ${errText}`,
          error: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let messageContent = '';
      const toolCalls: HacpToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          messageContent += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call-gemini-${Date.now()}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }

      return {
        status: 'SUCCESS',
        provider: this.name,
        model: this.model,
        message: messageContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        rawUsage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        } : undefined,
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        provider: this.name,
        model: this.model,
        message: `Wyjątek podczas wywołania Google Gemini: ${err?.message || 'Nieznany błąd'}`,
        error: String(err?.message || err),
      };
    }
  }
}
