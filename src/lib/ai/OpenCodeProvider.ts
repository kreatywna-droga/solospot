/**
 * OpenCodeProvider.ts — OpenCode Inference API Provider Implementation
 *
 * Implements real tool calling and multi-turn reasoning via OpenCode Inference API.
 * Integrated with OpenCodeModelRouter for AUTO, FREE, PAID, and MANUAL model routing.
 *
 * Endpoint: process.env.OPENCODE_BASE_URL || https://openrouter.ai/api/v1
 * Model: Dynamic via OpenCodeModelRouter (default: openai/gpt-4o-mini)
 */

import type { AIProvider, AICopilotRequest, AICopilotResponse, HacpToolCall, ChatMessage } from './AIProviderTypes';
import { OpenCodeModelRouter } from './OpenCodeModelRouter';

export class OpenCodeProvider implements AIProvider {
  public readonly id = 'opencode';
  public readonly name = 'OpenCode';

  private apiKey: string | null;
  private baseURL: string;
  private router = OpenCodeModelRouter.getInstance();

  constructor() {
    this.apiKey = process.env.OPENCODE_API_KEY
      ? process.env.OPENCODE_API_KEY.replace(/[^\x20-\x7E]/g, '').trim()
      : null;
    this.baseURL = (process.env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1')
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
        model: 'NONE',
        message:
          'OpenCode AI Provider nie jest skonfigurowany w środowisku SoloSpot.\n\n' +
          'Brak zmiennej środowiskowej: OPENCODE_API_KEY.\n' +
          'Skonfiguruj klucz w pliku .env.local lub w Vercel Environment Variables.',
        missingKeys: ['OPENCODE_API_KEY'],
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      };
    }

    try {
      const requiresTools = Boolean(request.tools && request.tools.length > 0);
      const resolution = await this.router.resolveModel(
        request.routerMode || 'AUTO',
        request.modelId,
        requiresTools
      );

      // If limitation message exists (e.g. Free model selected but cannot execute tools)
      if (resolution.limitationMessage && requiresTools && !resolution.toolSupported) {
        return {
          status: 'SUCCESS',
          provider: this.name,
          model: resolution.selectedModel.id,
          message: resolution.limitationMessage,
          isFreeModel: resolution.selectedModel.isFree,
          routerMode: resolution.mode,
        };
      }

      const selectedModelId = resolution.selectedModel.id;
      const cleanBaseUrl = (this.baseURL || 'https://openrouter.ai/api/v1')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .replace(/\/$/, '');
      const cleanApiKey = (this.apiKey || '').replace(/[^\x20-\x7E]/g, '').trim();

      // Normalize chat messages: map 'ai' to 'assistant' to strictly adhere to OpenAI specs
      const normalizedMessages = request.messages.map((m: any) => {
        let role: ChatMessage['role'] = m.role || (m.type === 'user' ? 'user' : 'assistant');
        if ((role as string) === 'ai') role = 'assistant';
        return {
          role,
          content: m.content || m.text || '',
          ...(m.name ? { name: m.name } : {}),
          ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        };
      });

      const toolsPayload = (request.tools || []).map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      const endpoint = `${cleanBaseUrl}/chat/completions`;
      const bodyPayload: Record<string, unknown> = {
        model: selectedModelId,
        messages: normalizedMessages,
        temperature: 0.2,
        max_tokens: 1000,
      };

      if (toolsPayload.length > 0 && resolution.toolSupported) {
        bodyPayload.tools = toolsPayload;
        bodyPayload.tool_choice = 'auto';
      }

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanApiKey}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      // Attempt fallback if 402, 429 or 500
      if (!response.ok && (response.status === 402 || response.status === 429 || response.status >= 500)) {
        const fallback = await this.router.getFallbackModel(selectedModelId, resolution.mode);
        if (fallback) {
          console.warn(`[OpenCodeProvider] Upstream ${response.status} on ${selectedModelId}, falling back to ${fallback.id}`);
          bodyPayload.model = fallback.id;
          bodyPayload.max_tokens = 500;
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanApiKey}`,
            },
            body: JSON.stringify(bodyPayload),
          });
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        return {
          status: 'ERROR',
          provider: this.name,
          model: selectedModelId,
          message: `Błąd komunikacji z OpenCode API (${response.status}): ${errText}`,
          error: `HTTP_${response.status}`,
          isFreeModel: resolution.selectedModel.isFree,
          routerMode: resolution.mode,
        };
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const messageContent = choice?.message?.content || '';
      const finishReason = choice?.finish_reason || 'stop';

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
        model: data.model || selectedModelId,
        message: messageContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        isFreeModel: resolution.selectedModel.isFree,
        finishReason,
        routerMode: resolution.mode,
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
        model: 'UNKNOWN',
        message: `Wyjątek podczas wywołania OpenCode API: ${err?.message || 'Nieznany błąd'}`,
        error: String(err?.message || err),
      };
    }
  }
}
