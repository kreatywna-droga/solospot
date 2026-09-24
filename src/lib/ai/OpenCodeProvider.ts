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
import { UserFacingResponseNormalizer } from './UserFacingResponseNormalizer';
import {
  classifyUpstreamError,
  getUserFacingProviderError,
  sanitizeUpstreamMessage,
} from './UpstreamErrorClassifier';

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

      if (!resolution.selectedModel) {
        return {
          status: 'ERROR',
          provider: this.name,
          model: 'NONE',
          message: 'Nie udało się wybrać modelu AI. Brak dostępnych modeli.',
          error: 'NO_SELECTED_MODEL',
          requestId: `req-${Date.now().toString(36)}`,
          isFreeModel: false,
          routerMode: resolution.mode,
          durationMs: 0,
        };
      }

      const selectedModelId = resolution.selectedModel.id;
      const cleanBaseUrl = (this.baseURL || 'https://openrouter.ai/api/v1')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .replace(/\/$/, '');
      const cleanApiKey = (this.apiKey || '').replace(/[^\x20-\x7E]/g, '').trim();

      // Normalize chat messages: map 'ai' to 'assistant' to strictly adhere to OpenAI specs
      const buildOpenCodeContent = (m: ChatMessage): string | unknown[] => {
        const attachments = m.attachments || [];
        if (attachments.length === 0) return m.content;

        const parts: unknown[] = [{ type: 'text', text: m.content }];
        for (const a of attachments) {
          if (a.type === 'image' && a.content.startsWith('data:')) {
            parts.push({ type: 'image_url', image_url: { url: a.content, detail: 'auto' } });
          } else {
            const isText = a.mimeType.startsWith('text/') || a.mimeType === 'application/json' || a.mimeType === 'application/markdown';
            const inline = isText ? a.content : `[Załącznik: ${a.name} (${a.mimeType})]`;
            parts.push({ type: 'text', text: `\n---\n${inline}\n---\n` });
          }
        }
        return parts;
      };

      const normalizedMessages = request.messages.map((m: any) => {
        let role: ChatMessage['role'] = m.role || (m.type === 'user' ? 'user' : 'assistant');
        if ((role as string) === 'ai') role = 'assistant';
        return {
          role,
          content: buildOpenCodeContent(m as ChatMessage),
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

      const startTime = Date.now();
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

      let activeModelId = selectedModelId;
      let response: Response | null = null;
      let data: any = null;
      let errorBodyText = '';
      const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const requestStartedAt = Date.now();
      let fallbackUsed = false;

      console.log(
        JSON.stringify({
          stage: 'UPSTREAM_REQUEST',
          requestId,
          provider: this.id,
          model: activeModelId,
          endpointHost: (() => { try { return new URL(cleanBaseUrl).host; } catch { return 'unknown'; } })(),
        })
      );

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanApiKey}`,
          },
          body: JSON.stringify(bodyPayload),
        });
        const rawBody = await response.text();
        errorBodyText = rawBody;
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = null;
        }
      } catch (fetchErr: any) {
        console.warn(`[OpenCodeProvider] Primary fetch failed on ${activeModelId}:`, fetchErr?.message);
        errorBodyText = String(fetchErr?.message || fetchErr);
      }

      console.log(
        JSON.stringify({
          stage: 'UPSTREAM_RESPONSE',
          requestId,
          provider: this.id,
          model: activeModelId,
          http: response?.status ?? 0,
          durationMs: Date.now() - requestStartedAt,
          ok: Boolean(response?.ok && data && !data.error),
        })
      );

      // If initial request failed (HTTP error e.g. 429 rate limit or JSON error payload)
      if (!response || !response.ok || data?.error) {
        console.warn(`[OpenCodeProvider] Upstream error/status ${response?.status} on ${activeModelId}, attempting fallback`);
        const fallbackCandidates = [
          'nex-agi/nex-n2.5-pro:free',
          'nex-agi/nex-n2.5-mini:free',
          'nvidia/nemotron-3.5-lightning:free',
          'nvidia/nemotron-3-ultra-550b-a55b:free',
          'inclusionai/ling-3.0-flash-vl:free',
          'dots-studio/dots-3-note-preview:free',
        ].filter((id) => id !== activeModelId);

        for (const candidateId of fallbackCandidates) {
          try {
            console.log(`[OpenCodeProvider] Retrying with fallback candidate: ${candidateId}`);
            bodyPayload.model = candidateId;
            bodyPayload.max_tokens = 600;
            // Always include tools in fallback (free models support tools)
            if (toolsPayload.length > 0) {
              bodyPayload.tools = toolsPayload;
              bodyPayload.tool_choice = 'auto';
            }
            const retryStartedAt = Date.now();
            const retryRes = await fetch(endpoint, {
              method: 'POST',
              signal: AbortSignal.timeout(15000),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cleanApiKey}`,
              },
              body: JSON.stringify(bodyPayload),
            });
            const retryRaw = await retryRes.text();
            if (retryRes.ok) {
              let retryData: any = null;
              try {
                retryData = JSON.parse(retryRaw);
              } catch {
                retryData = null;
              }
              if (retryData && !retryData.error && retryData.choices?.length > 0) {
                response = retryRes;
                data = retryData;
                activeModelId = candidateId;
                // PHASE 10: secondary request actually succeeded after real primary failure
                fallbackUsed = true;
                console.log(
                  JSON.stringify({
                    stage: 'UPSTREAM_RESPONSE',
                    requestId,
                    provider: this.id,
                    model: activeModelId,
                    http: retryRes.status,
                    durationMs: Date.now() - retryStartedAt,
                    ok: true,
                    fallbackUsed: true,
                  })
                );
                break;
              }
            }
            console.log(
              JSON.stringify({
                stage: 'UPSTREAM_RESPONSE',
                requestId,
                provider: this.id,
                model: candidateId,
                http: retryRes.status,
                durationMs: Date.now() - retryStartedAt,
                ok: false,
                fallbackUsed: true,
              })
            );
          } catch (retryErr: any) {
            console.warn(`[OpenCodeProvider] Candidate ${candidateId} failed:`, retryErr?.message);
          }
        }
      }

      if (!response || !response.ok || !data || data.error || !data.choices || data.choices.length === 0) {
        const bodyMessage =
          data?.error?.message ||
          sanitizeUpstreamMessage(errorBodyText) ||
          (response ? `HTTP_${response.status}` : 'Brak odpowiedzi');
        const networkError =
          !response && errorBodyText && !errorBodyText.trim().startsWith('{')
            ? errorBodyText
            : undefined;
        const errorType = classifyUpstreamError({
          httpStatus: response?.status,
          bodyMessage: String(bodyMessage),
          networkError,
        });
        const safeDetail = errorType === 'RATE_LIMIT' || errorType === 'AUTH'
          ? sanitizeUpstreamMessage(String(bodyMessage), 160)
          : undefined;
        const userMessage = getUserFacingProviderError(errorType, activeModelId, safeDetail);

        console.log(
          JSON.stringify({
            stage: 'FINAL_RESPONSE',
            requestId,
            provider: this.id,
            model: activeModelId,
            status: 'ERROR',
            errorType,
            http: response?.status ?? 0,
            durationMs: Date.now() - requestStartedAt,
            fallbackUsed,
          })
        );

        return {
          status: 'ERROR',
          provider: this.name,
          model: activeModelId,
          message: userMessage,
          error: String(bodyMessage),
          errorType,
          fallbackUsed: fallbackUsed || undefined,
          requestId,
          isFreeModel: activeModelId.includes('free'),
          routerMode: resolution.mode,
          durationMs: Date.now() - requestStartedAt,
        };
      }

      const choice = data.choices[0];
      let messageContent = choice?.message?.content || '';
      const finishReason = choice?.finish_reason || 'stop';

      let toolCalls: HacpToolCall[] = [];
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
      // N-STEP AGENT LOOP: Execute read-only tools, chain multi-step reasoning
      // ======================================================================

      // Read-only tools that can be executed locally in the provider loop
      const READ_ONLY_TOOLS = new Set([
        'test_echo', 'read_builder_document', 'inspect_selected_node', 'inspect_page_structure',
        'inspect_node', 'inspect_children', 'inspect_parent', 'find_nodes',
        'inspect_responsive', 'inspect_experience', 'inspect_asset',
        'inspect_available_capabilities', 'inspect_document_summary', 'read_page_full',
        'search_experiences', 'get_experience_categories',
        'search_sections', 'search_website_templates', 'get_typography_presets',
        'get_design_presets', 'resolve_target',
        // Design System (ONE catalog — read-only)
        'search_design_styles', 'search_style_packs', 'search_fonts', 'search_font_pairings',
        'search_color_palettes', 'search_color_combinations', 'search_design_combinations',
        'search_moods', 'search_typography_systems', 'search_button_styles',
        'search_card_styles', 'search_backgrounds', 'search_industry_presets',
        'inspect_design_style', 'inspect_style_pack',
      ]);

      // Maximum iterations for the agent loop (search → inspect → decide → insert)
      const MAX_AGENT_ITERATIONS = 8;
      let allToolCalls: HacpToolCall[] = [];
      let currentMessages = [...normalizedMessages];
      let currentChoice = choice;
      let iteration = 0;

      while (toolCalls.length > 0 && iteration < MAX_AGENT_ITERATIONS) {
        iteration++;

        console.log('[OpenCodeProvider] AGENT_LOOP_TRACE:', {
          phase: 'ITERATION_START',
          iteration,
          toolCallCount: toolCalls.length,
          toolNames: toolCalls.map((tc) => tc.name),
          timestamp: new Date().toISOString(),
        });

        // Add assistant message with tool_calls to history
        currentMessages.push({
          role: 'assistant',
          content: currentChoice.message.content || null,
          tool_calls: currentChoice.message.tool_calls,
        } as any);

        // Separate read-only tools from mutation tools
        const readOnlyCalls: HacpToolCall[] = [];
        const mutationCalls: HacpToolCall[] = [];

        for (const tc of toolCalls) {
          if (READ_ONLY_TOOLS.has(tc.name)) {
            readOnlyCalls.push(tc);
          } else {
            mutationCalls.push(tc);
          }
        }

        // Track all tool calls (mutations will be executed by HacpBridge)
        allToolCalls.push(...mutationCalls);

        // Execute read-only tools locally and build tool result messages
        for (const tc of readOnlyCalls) {
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
          } else if (tc.name === 'search_sections') {
            // Execute search_sections locally to return real results to the model
            try {
              const { searchSectionLibrary } = await import('./LibraryIntelligence');
              const results = searchSectionLibrary({
                query: tc.arguments?.query as string,
                category: tc.arguments?.category as string,
                limit: (tc.arguments?.limit as number) || 20,
              });
              toolResult = { status: 'SUCCESS', count: results.length, sections: results };
            } catch (searchErr: any) {
              toolResult = { status: 'ERROR', count: 0, sections: [], error: String(searchErr?.message || searchErr), note: 'Library search failed.' };
            }
          } else if (tc.name === 'search_experiences') {
            try {
              const { searchExperienceLibrary } = await import('./LibraryIntelligence');
              const results = searchExperienceLibrary({
                query: tc.arguments?.query as string,
                type: tc.arguments?.type as any,
                category: tc.arguments?.category as string,
                mood: tc.arguments?.mood as any,
                industry: tc.arguments?.industry as string,
                limit: (tc.arguments?.limit as number) || 20,
              });
              toolResult = { status: 'SUCCESS', count: results.length, experiences: results };
            } catch (searchErr: any) {
              toolResult = { status: 'ERROR', count: 0, experiences: [], error: String(searchErr?.message || searchErr), note: 'Library search failed.' };
            }
          } else if (tc.name === 'inspect_experience') {
            try {
              const { inspectExperience } = await import('./LibraryIntelligence');
              const result = inspectExperience(tc.arguments?.experienceId as string);
              toolResult = (result as unknown as Record<string, unknown>) || { status: 'NOT_FOUND', message: 'Experience not found.' };
            } catch {
              toolResult = { status: 'ERROR', message: 'Inspection failed.' };
            }
          } else if (tc.name === 'get_experience_categories') {
            try {
              const { getExperienceCategories, getExperienceMoods, getExperienceIndustries } = await import('./LibraryIntelligence');
              toolResult = {
                status: 'SUCCESS',
                categories: getExperienceCategories(),
                moods: getExperienceMoods(),
                industries: getExperienceIndustries(),
              };
            } catch {
              toolResult = { status: 'ERROR', message: 'Failed to get categories.' };
            }
          } else if (tc.name === 'search_website_templates') {
            try {
              const { searchWebsiteTemplates } = await import('./LibraryIntelligence');
              const results = searchWebsiteTemplates({
                query: tc.arguments?.query as string,
                industry: tc.arguments?.industry as string,
                limit: (tc.arguments?.limit as number) || 10,
              });
              toolResult = { status: 'SUCCESS', count: results.length, templates: results };
            } catch (searchErr: any) {
              toolResult = { status: 'ERROR', count: 0, templates: [], error: String(searchErr?.message || searchErr), note: 'Template search failed.' };
            }
          } else if (tc.name === 'get_typography_presets') {
            try {
              const { getTypographyPresets } = await import('./LibraryIntelligence');
              toolResult = { status: 'SUCCESS', presets: getTypographyPresets() };
            } catch {
              toolResult = { status: 'ERROR', message: 'Failed to get presets.' };
            }
          } else if (tc.name === 'get_design_presets') {
            try {
              const { getDesignPresets } = await import('./LibraryIntelligence');
              toolResult = { status: 'SUCCESS', presets: getDesignPresets() };
            } catch {
              toolResult = { status: 'ERROR', message: 'Failed to get presets.' };
            }
          } else if (tc.name === 'find_nodes') {
            // GATE 1: target resolution against live document index (no hardcoded nodeId)
            const idx = request.builderContext?.nodesIndex || [];
            const crit = (tc.arguments || {}) as Record<string, unknown>;
            const textOf = (n: { props?: Record<string, unknown> }) => {
              const p = n.props || {};
              return ['text', 'title', 'subtitle', 'description', 'heading', 'cta', 'ctaText', 'label']
                .map((k) => (typeof p[k] === 'string' ? (p[k] as string) : ''))
                .filter(Boolean)
                .join(' ');
            };
            let matches = idx.slice();
            if (typeof crit.type === 'string' && crit.type) {
              matches = matches.filter((n) => n.type === crit.type);
            }
            if (typeof crit.labelContains === 'string' && crit.labelContains) {
              const q = crit.labelContains.toLowerCase();
              matches = matches.filter((n) => (n.label || '').toLowerCase().includes(q));
            }
            if (typeof crit.textContains === 'string' && crit.textContains) {
              const q = crit.textContains.toLowerCase();
              matches = matches.filter(
                (n) => textOf(n).toLowerCase().includes(q) || (n.label || '').toLowerCase().includes(q)
              );
            }
            if (typeof crit.sectionId === 'string' && crit.sectionId) {
              matches = matches.filter((n) => n.sectionId === crit.sectionId || n.id === crit.sectionId);
            }
            toolResult = {
              status: 'SUCCESS',
              operation: 'find_nodes',
              count: matches.length,
              nodes: matches.map((n) => ({
                id: n.id,
                type: n.type,
                label: n.label,
                sectionId: n.sectionId,
                parentId: n.parentId,
                props: n.props,
              })),
              note: 'Wyniki z live BuilderDocument nodesIndex.',
            };
          } else if (tc.name === 'resolve_target') {
            const idx = request.builderContext?.nodesIndex || [];
            const prompt = String(tc.arguments?.prompt || request.prompt || '');
            const lower = prompt.toLowerCase();
            // Prefer text match, then label match (Hero/section names)
            const byText = idx.find((n) => {
              const p = n.props || {};
              return ['text', 'title', 'subtitle'].some(
                (k) => typeof p[k] === 'string' && lower.includes(String(p[k]).toLowerCase())
              );
            });
            const byLabel = idx.find((n) => n.label && lower.includes(n.label.toLowerCase()));
            const resolved = byText || byLabel || idx.find((n) => n.type === 'hero' || (n.label || '').toLowerCase() === 'hero');
            toolResult = resolved
              ? {
                  status: 'SUCCESS',
                  operation: 'resolve_target',
                  nodeId: resolved.id,
                  nodeType: resolved.type,
                  nodeLabel: resolved.label,
                  sectionId: resolved.sectionId,
                  parentId: resolved.parentId,
                  props: resolved.props,
                }
              : {
                  status: 'NOT_FOUND',
                  operation: 'resolve_target',
                  prompt,
                  note: 'Nie znaleziono pasującego węzła w nodesIndex.',
                };
          } else if (tc.name === 'inspect_node') {
            const nodeId = String(tc.arguments?.nodeId || '');
            const found = (request.builderContext?.nodesIndex || []).find((n) => n.id === nodeId);
            toolResult = found
              ? { status: 'SUCCESS', operation: 'inspect_node', node: found }
              : {
                  status: 'NOT_FOUND',
                  operation: 'inspect_node',
                  nodeId,
                  pageId: request.builderContext?.pageId || 'page-home',
                };
          } else if (tc.name === 'inspect_document_summary' || tc.name === 'inspect_page_structure' ||
                     tc.name === 'inspect_children' || tc.name === 'inspect_parent' ||
                     tc.name === 'inspect_selected_node' || tc.name === 'inspect_responsive' ||
                     tc.name === 'inspect_asset' || tc.name === 'inspect_available_capabilities' ||
                     tc.name === 'read_page_full') {
            // These inspection tools return builder context data
            toolResult = {
              status: 'SUCCESS',
              operation: tc.name,
              arguments: tc.arguments,
              pageId: request.builderContext?.pageId || 'page-home',
              selectedNodeId: request.builderContext?.selectedNodeId,
              viewport: request.builderContext?.viewport || 'DESKTOP',
              sectionsSummary: request.builderContext?.sectionsSummary,
              nodesIndexCount: (request.builderContext?.nodesIndex || []).length,
              note: `Inspekcja ${tc.name} wykonana. Pełne dane dostępne w kontekście Buildera.`,
            };
          } else {
            // TRUTHFULNESS: Unknown tool — no execution occurred, cannot claim SUCCESS
            toolResult = {
              status: 'NOT_SUPPORTED',
              operation: tc.name,
              arguments: tc.arguments,
              detail: `Narzędzie ${tc.name} nie jest obsługiwane w trybie read-only.`,
            };
          }

          currentMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: JSON.stringify(toolResult),
          });
        }

        // If there are mutation tools, stop the provider loop — HacpBridge will execute them
        if (mutationCalls.length > 0) {
          break;
        }

        // No mutations — make another LLM request with tools to continue reasoning.
        // REPAIR (READ→WRITE Gate): continuation must reuse the model that actually
        // succeeded for the initial turn (activeModelId after fallback), NOT the
        // original router selection (selectedModelId). The original selection may
        // be a model that already timed out / 429'd — sending continuation back to
        // it caused the forensic-trace 15s timeout and dropped the chance to call
        // insert_section_from_library after search_sections.
        // Continuation also gets the same fallback candidate chain as the initial
        // request so a single flaky free model cannot permanently block WRITE.
        try {
          const continuationBody = (modelId: string): string =>
            JSON.stringify({
              model: modelId,
              messages: currentMessages,
              tools: toolsPayload,
              tool_choice: 'auto',
              temperature: 0.2,
              max_tokens: 1000,
            });

          const continuationCandidates = [
            activeModelId,
            ...[
              'nex-agi/nex-n2.5-pro:free',
              'nex-agi/nex-n2.5-mini:free',
              'nvidia/nemotron-3.5-lightning:free',
              'nvidia/nemotron-3-ultra-550b-a55b:free',
              'inclusionai/ling-3.0-flash-vl:free',
              'dots-studio/dots-3-note-preview:free',
            ].filter((id) => id !== activeModelId),
          ];

          let nextChoice: any = null;
          for (const candidateId of continuationCandidates) {
            try {
              const nextResponse = await fetch(endpoint, {
                method: 'POST',
                signal: AbortSignal.timeout(15000),
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${cleanApiKey}`,
                },
                body: continuationBody(candidateId),
              });

              if (!nextResponse.ok) continue;

              const nextData = await nextResponse.json();
              const choice = nextData.choices?.[0];
              if (!choice?.message) continue;

              nextChoice = choice;
              if (candidateId !== activeModelId) {
                activeModelId = candidateId;
                fallbackUsed = true;
              }
              console.log(
                JSON.stringify({
                  stage: 'AGENT_LOOP_CONTINUATION',
                  requestId,
                  model: candidateId,
                  http: nextResponse.status,
                  fallbackUsed,
                  iteration,
                })
              );
              break;
            } catch (contErr: any) {
              console.warn(
                `[OpenCodeProvider] Continuation candidate ${candidateId} failed:`,
                contErr?.message
              );
              // try next candidate
            }
          }

          if (!nextChoice) {
            console.warn('[OpenCodeProvider] Agent loop continuation exhausted — keeping READ-only result');
            break;
          }

          currentChoice = nextChoice;
          messageContent = nextChoice.message.content || '';

          // Check if the model made more tool calls
          if (nextChoice.message.tool_calls && Array.isArray(nextChoice.message.tool_calls) && nextChoice.message.tool_calls.length > 0) {
            toolCalls = [];
            for (const tc of nextChoice.message.tool_calls) {
              try {
                const parsedArgs = typeof tc.function?.arguments === 'string'
                  ? JSON.parse(tc.function.arguments || '{}')
                  : tc.function?.arguments || {};
                toolCalls.push({
                  id: tc.id || `call-${Date.now()}`,
                  name: tc.function?.name || '',
                  arguments: parsedArgs,
                });
              } catch {
                // Skip malformed tool calls
              }
            }
          } else {
            // No more tool calls — model generated final text response
            toolCalls = [];
          }
        } catch (loopErr) {
          console.warn('[OpenCodeProvider] Agent loop iteration error:', loopErr);
          break;
        }
      }

      // Use the final message content from the last LLM response
      if (!messageContent || messageContent.trim().length === 0) {
        if (allToolCalls.length > 0) {
          messageContent = UserFacingResponseNormalizer.getFriendlyToolCompletionMessage(allToolCalls[0].name);
        } else {
          messageContent = 'Przeanalizowałem żądanie. Pomóż mi zrozumieć, co dokładnie chciałbyś zmienić.';
        }
      }

      // Use all mutation tool calls (the provider loop collected read-only results for the model)
      toolCalls = allToolCalls.length > 0 ? allToolCalls : toolCalls;

      console.log('[OpenCodeProvider] AGENT_LOOP_TRACE:', {
        phase: 'LOOP_COMPLETE',
        totalIterations: iteration,
        mutationToolCalls: allToolCalls.map((tc) => tc.name),
        finalToolCalls: toolCalls.map((tc) => tc.name),
        messageContent: messageContent?.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // Strictly normalize user-facing output: scrub any reasoning tags (<think>), English leaks, or raw JSON
      const cleanUserFacingMessage = UserFacingResponseNormalizer.normalize(messageContent, {
        toolExecuted: toolCalls[0]?.name,
      });

      // TRUTHFULNESS (FORENSIC GATE v1.0): Only claim SUCCESS when a MUTATION
      // tool call exists. Read-only calls (search_sections, inspect_*, ...) are
      // collected in `toolCalls` as fallback when the agent loop produced no
      // mutation — that is PARTIAL (work started, document unchanged), never
      // SUCCESS. Chat-only responses (no tool calls) are CHAT.
      // NOTE: allToolCalls holds mutation calls only (see agent loop above).
      const hasMutations = allToolCalls.length > 0;
      const finalStatus = hasMutations ? 'SUCCESS' : toolCalls.length > 0 ? 'PARTIAL' : 'CHAT';

      console.log(
        JSON.stringify({
          stage: 'FINAL_RESPONSE',
          requestId,
          provider: this.id,
          model: data.model || activeModelId,
          status: finalStatus,
          durationMs: Date.now() - requestStartedAt,
          fallbackUsed,
        })
      );

      return {
        status: finalStatus,
        provider: this.name,
        model: data.model || selectedModelId,
        message: cleanUserFacingMessage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        fallbackUsed: fallbackUsed || undefined,
        requestId,
        isFreeModel: resolution.selectedModel.isFree,
        finishReason,
        routerMode: resolution.mode,
        durationMs: Date.now() - startTime,
        rawUsage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err: any) {
      const isTimeout =
        err?.name === 'TimeoutError' ||
        err?.name === 'AbortError' ||
        String(err?.message || '').toLowerCase().includes('aborted') ||
        String(err?.message || '').toLowerCase().includes('timeout');

      const errorType = isTimeout
        ? 'TIMEOUT'
        : classifyUpstreamError({ networkError: String(err?.message || err) });
      const friendlyMessage = getUserFacingProviderError(errorType, 'UNKNOWN');

      return {
        status: 'ERROR',
        provider: this.name,
        model: 'UNKNOWN',
        message: friendlyMessage,
        error: isTimeout ? 'TIMEOUT_EXCEEDED' : String(err?.message || err),
        errorType,
      };
    }
  }
}
