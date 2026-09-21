/**
 * OpenCodeProvider.ts — OpenCode Inference API Provider Implementation
 *
 * Implements real tool calling and multi-turn reasoning via OpenCode Inference API.
 * Endpoint: https://opencode.ai/inference/openai/v1/chat/completions
 * Fallback Base URL: process.env.OPENCODE_BASE_URL || https://openrouter.ai/api/v1
 * Model: process.env.OPENCODE_MODEL || openai/gpt-4o-mini
 */

import type { AIProvider, AICopilotRequest, AICopilotResponse, HacpToolCall } from './AIProviderTypes';

export class OpenCodeProvider implements AIProvider {
  public readonly id = 'opencode';
  public readonly name = 'OpenCode';

  private apiKey: string | null;
  private baseURL: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENCODE_API_KEY
      ? process.env.OPENCODE_API_KEY.replace(/[^\x20-\x7E]/g, '').trim()
      : null;
    this.baseURL = (process.env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
    this.model = (process.env.OPENCODE_MODEL || 'openai/gpt-4o-mini')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getMissingKeys(): string[] {
    return this.isConfigured() ? [] : ['OPENCODE_API_KEY'];
  }

  public async generateWithTools(request: AICopilotRequest): Promise<AICopilotResponse> {
    if (!this.isConfigured()) {
      return {
        status: 'NOT_CONFIGURED',
        provider: this.name,
        model: this.model,
        message:
          'OpenCode AI Provider nie jest skonfigurowany w środowisku SoloSpot.\n\n' +
          'Brak zmiennej środowiskowej: OPENCODE_API_KEY.\n' +
          'Skonfiguruj klucz w pliku .env.local lub w Vercel Environment Variables.',
        missingKeys: ['OPENCODE_API_KEY'],
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      };
    }

    try {
      const toolsPayload = (request.tools || []).map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const cleanBaseUrl = (this.baseURL || 'https://openrouter.ai/api/v1')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .replace(/\/$/, '');
      const cleanApiKey = (this.apiKey || '').replace(/[^\x20-\x7E]/g, '').trim();
      const cleanModel = (this.model || 'openai/gpt-4o-mini').replace(/[^\x20-\x7E]/g, '').trim();

      const endpoint = `${cleanBaseUrl}/chat/completions`;
      const bodyPayload: Record<string, unknown> = {
        model: cleanModel,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.name ? { name: m.name } : {}),
          ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        })),
        temperature: 0.2,
      };

      if (toolsPayload.length > 0) {
        bodyPayload.tools = toolsPayload;
        bodyPayload.tool_choice = 'auto';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanApiKey}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          status: 'ERROR',
          provider: this.name,
          model: this.model,
          message: `Błąd komunikacji z OpenCode API (${response.status}): ${errText}`,
          error: `HTTP_${response.status}`,
        };
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const messageContent = choice?.message?.content || '';

      const toolCalls: HacpToolCall[] = [];
      if (choice?.message?.tool_calls && Array.isArray(choice.message.tool_calls)) {
        for (const tc of choice.message.tool_calls) {
          try {
            const parsedArgs =
              typeof tc.function?.arguments === 'string'
                ? JSON.parse(tc.function.arguments || '{}')
                : tc.function?.arguments || {};

            toolCalls.push({
              id: tc.id || `call-${Date.now()}`,
              name: tc.function?.name || '',
              arguments: parsedArgs,
            });
          } catch (parseErr) {
            console.error('[OpenCodeProvider] Failed to parse tool arguments:', parseErr);
          }
        }
      }

      return {
        status: 'SUCCESS',
        provider: this.name,
        model: data.model || this.model,
        message: messageContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        rawUsage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err: any) {
      return {
        status: 'ERROR',
        provider: this.name,
        model: this.model,
        message: `Wyjątek podczas wywołania OpenCode API: ${err?.message || 'Nieznany błąd'}`,
        error: String(err?.message || err),
      };
    }
  }
}
