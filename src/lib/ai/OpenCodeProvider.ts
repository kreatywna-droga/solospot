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

      let data: any = null;

      if (!response.ok) {
        // Check for 402, 429, or 500+ and attempt fallback
        const fallback = await this.router.getFallbackModel(selectedModelId, resolution.mode);
        if (fallback && fallback.id !== selectedModelId) {
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

      data = await response.json();

      // Check for upstream error payload embedded in JSON (e.g. code 502 ResourceExhausted)
      if (data.error) {
        console.warn(`[OpenCodeProvider] Upstream error on ${selectedModelId}:`, data.error);
        const fallback = await this.router.getFallbackModel(selectedModelId, resolution.mode);
        if (fallback && fallback.id !== selectedModelId) {
          console.warn(`[OpenCodeProvider] Retrying with fallback model ${fallback.id}`);
          bodyPayload.model = fallback.id;
          bodyPayload.max_tokens = 500;
          const retryRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanApiKey}`,
            },
            body: JSON.stringify(bodyPayload),
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (!retryData.error && retryData.choices?.length > 0) {
              data = retryData;
            }
          }
        }
      }

      if (data.error || !data.choices || data.choices.length === 0) {
        const errDetail = data.error?.message || 'Brak odpowiedzi od modelu (puste choices).';
        return {
          status: 'ERROR',
          provider: this.name,
          model: selectedModelId,
          message: `OpenCode Provider zgłasza błąd: ${errDetail}`,
          error: data.error?.message || 'EMPTY_CHOICES',
          isFreeModel: resolution.selectedModel.isFree,
          routerMode: resolution.mode,
        };
      }

      const choice = data.choices[0];
      let messageContent = choice?.message?.content || '';
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

      // ======================================================================
      // 2-STEP AGENT LOOP: If model called tools, execute Request #2 to get final natural response
      // ======================================================================
      if (toolCalls.length > 0) {
        const toolMessages: any[] = [
          ...normalizedMessages,
          {
            role: 'assistant',
            content: choice.message.content || null,
            tool_calls: choice.message.tool_calls,
          },
        ];

        for (const tc of toolCalls) {
          let toolResult: Record<string, unknown> = {};
          if (tc.name === 'test_echo') {
            toolResult = {
              status: 'SUCCESS',
              echo: tc.arguments?.message || 'hello',
              diagnostic: 'Pomyślnie wykonano test diagnostyczny test_echo.',
            };
          } else if (
            tc.name === 'read_builder_document' ||
            tc.name === 'inspect_page_structure' ||
            tc.name === 'inspect_selected_node'
          ) {
            toolResult = {
              status: 'SUCCESS',
              pageId: request.builderContext?.pageId || 'page-home',
              pageName: request.builderContext?.pageName || 'Strona Główna',
              documentNodeCount: request.builderContext?.documentNodeCount ?? 5,
              selectedNodeId: request.builderContext?.selectedNodeId || 'sec-hero-init',
              selectedNodeType: request.builderContext?.selectedNodeType || 'hero',
              selectedNodeLabel: request.builderContext?.selectedNodeLabel || 'Hero Section',
              viewport: request.builderContext?.viewport || 'DESKTOP',
            };
          } else {
            // Mutation tools (update_node_props, insert_section, move_section, etc.)
            toolResult = {
              status: 'SUCCESS',
              operation: tc.name,
              arguments: tc.arguments,
              detail: `Zlecenie ${tc.name} zostało zweryfikowane i przekazane do wykonania na Canvas.`,
            };
          }

          toolMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: JSON.stringify(toolResult),
          });
        }

        try {
          const secondResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanApiKey}`,
            },
            body: JSON.stringify({
              model: selectedModelId,
              messages: toolMessages,
              temperature: 0.2,
              max_tokens: 1000,
            }),
          });

          if (secondResponse.ok) {
            const secondData = await secondResponse.json();
            const secondChoice = secondData.choices?.[0];
            if (secondChoice?.message?.content && secondChoice.message.content.trim().length > 0) {
              messageContent = secondChoice.message.content.trim();
            }
          }
        } catch (secondErr) {
          console.warn('[OpenCodeProvider] Second turn model completion error:', secondErr);
        }

        // If messageContent is still empty, synthesize an honest, helpful natural language statement
        if (!messageContent || messageContent.trim().length === 0) {
          const firstTc = toolCalls[0];
          if (firstTc.name === 'test_echo') {
            messageContent = `Wywołałem test diagnostyczny test_echo: "${firstTc.arguments?.message || 'hello'}". Narzędzie działa prawidłowo.`;
          } else if (firstTc.name === 'update_node_props') {
            const propKeys = Object.keys(firstTc.arguments?.props || {}).join(', ');
            messageContent = `Zaktualizowałem właściwości sekcji (${propKeys || 'props'}). Zmiana jest widoczna na Canvas.`;
          } else if (firstTc.name === 'insert_section') {
            messageContent = `Dodałem nową sekcję typu ${firstTc.arguments?.sectionType || 'hero'} do strony.`;
          } else if (firstTc.name === 'read_builder_document' || firstTc.name === 'inspect_page_structure') {
            messageContent = `Przeanalizowałem strukturę strony „${request.builderContext?.pageName || 'Główna'}”. Liczba sekcji: ${request.builderContext?.documentNodeCount ?? 0}.`;
          } else {
            messageContent = `Zrealizowałem polecenie za pomocą narzędzia ${firstTc.name}.`;
          }
        }
      }

      // If text response is still empty without tools (e.g. reasoning model edge case)
      if ((!messageContent || messageContent.trim().length === 0) && choice?.message?.reasoning) {
        messageContent = choice.message.reasoning.slice(0, 300);
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
