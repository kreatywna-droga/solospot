/**
 * OpenCodeModelRouter.ts — OpenCode Intelligent Model Router
 *
 * Directs incoming AI requests to the optimal model based on mode:
 * - AUTO: Picks first available model satisfying task technical requirements (tool support).
 * - FREE: Restricts strictly to verified free models. Honestly informs if tools unsupported.
 * - PAID: Routes to verified full-capability models.
 * - MANUAL: Directly uses user-selected model ID.
 *
 * Implements transparent fallback if selected model returns 429/500/timeout,
 * preserving full conversation context.
 */

import { OpenCodeModelDiscovery, type OpenCodeModelDescriptor } from './OpenCodeModelDiscovery';

export type RouterMode = 'AUTO' | 'FREE' | 'PAID' | 'MANUAL';

export interface RouteResolution {
  selectedModel: OpenCodeModelDescriptor;
  mode: RouterMode;
  fallbackUsed: boolean;
  requiresTools: boolean;
  toolSupported: boolean;
  limitationMessage?: string;
}

export class OpenCodeModelRouter {
  private static instance: OpenCodeModelRouter;
  private discovery = OpenCodeModelDiscovery.getInstance();

  public static getInstance(): OpenCodeModelRouter {
    if (!OpenCodeModelRouter.instance) {
      OpenCodeModelRouter.instance = new OpenCodeModelRouter();
    }
    return OpenCodeModelRouter.instance;
  }

  /**
   * Resolves the target model for a given request.
   */
  public async resolveModel(
    mode: RouterMode = 'AUTO',
    requestedModelId?: string,
    requiresTools = true
  ): Promise<RouteResolution> {
    const catalog = await this.discovery.discoverModels();
    const defaultPaidModel =
      catalog.models.find((m) => m.id === 'openai/gpt-4o-mini') ||
      catalog.models.find((m) => m.id === 'gpt-4o-mini') ||
      catalog.models.find((m) => m.id.includes('mini') && m.supportsTools) ||
      catalog.models.find((m) => m.id.includes('flash') && m.supportsTools) ||
      catalog.models.find((m) => m.supportsTools) ||
      catalog.models[0];

    // If a specific model was requested by the user or UI, ALWAYS honor it!
    if (requestedModelId) {
      const found = catalog.models.find(
        (m) => m.id === requestedModelId || m.id.endsWith(requestedModelId) || requestedModelId.endsWith(m.id)
      );
      const targetModel = found || {
        id: requestedModelId,
        name: requestedModelId.split('/').pop() || requestedModelId,
        provider: 'OpenCode',
        isFree: requestedModelId.includes('free'),
        supportsTools: true,
        status: 'AVAILABLE' as const,
      };

      const toolSupported = targetModel.supportsTools;
      const limitationMessage =
        requiresTools && !toolSupported
          ? `Wybrany model „${targetModel.name}” nie obsługuje wywoływania narzędzi HACP. Przełącz na model z obsługą narzędzi, aby modyfikować stronę.`
          : undefined;

      return {
        selectedModel: targetModel,
        mode: mode,
        fallbackUsed: false,
        requiresTools,
        toolSupported,
        limitationMessage,
      };
    }

    // FREE MODE (auto-selection within free tier when no specific model is selected)
    if (mode === 'FREE') {
      const freeCandidates = catalog.freeModels;
      if (freeCandidates.length === 0) {
        return {
          selectedModel: defaultPaidModel,
          mode: 'FREE',
          fallbackUsed: true,
          requiresTools,
          toolSupported: defaultPaidModel.supportsTools,
          limitationMessage: 'Brak obecnie dostępnych darmowych modeli w katalogu OpenCode.',
        };
      }

      // If tools are required, check for tool-capable free model
      if (requiresTools) {
        const toolFree = freeCandidates.find((m) => m.supportsTools);
        if (toolFree) {
          return {
            selectedModel: toolFree,
            mode: 'FREE',
            fallbackUsed: false,
            requiresTools,
            toolSupported: true,
          };
        }

        // Free models available but none support tools -> honest limitation!
        const firstFree = freeCandidates[0];
        return {
          selectedModel: firstFree,
          mode: 'FREE',
          fallbackUsed: false,
          requiresTools,
          toolSupported: false,
          limitationMessage:
            'Aktualnie dostępne darmowe modele OpenCode nie zapewniają wymaganego tool calling dla tej operacji. Wybierz tryb AUTO lub model PAID, aby wprowadzać zmiany na Canvas.',
        };
      }

      // Chat only
      const preferredFree =
        freeCandidates.find((m) => m.id === 'nvidia/nemotron-3.5-lightning:free') ||
        freeCandidates.find((m) => m.id.includes('nemotron') && m.id.includes(':free')) ||
        freeCandidates.find((m) => m.id.includes(':free')) ||
        freeCandidates[0];

      return {
        selectedModel: preferredFree,
        mode: 'FREE',
        fallbackUsed: false,
        requiresTools: false,
        toolSupported: preferredFree.supportsTools,
      };
    }

    // PAID MODE
    if (mode === 'PAID') {
      const paidModel =
        catalog.models.find((m) => m.id === 'openai/gpt-4o-mini') ||
        catalog.paidModels.find((m) => m.id.includes('mini') || m.id.includes('flash')) ||
        catalog.paidModels.find((m) => m.supportsTools) ||
        defaultPaidModel;

      return {
        selectedModel: paidModel,
        mode: 'PAID',
        fallbackUsed: false,
        requiresTools,
        toolSupported: paidModel.supportsTools,
      };
    }

    // AUTO MODE: Choose first capable cost-effective model
    const autoModel =
      catalog.models.find((m) => m.id === 'openai/gpt-4o-mini') ||
      catalog.models.find((m) => m.id === 'gpt-4o-mini') ||
      catalog.models.find((m) => (m.id.includes('mini') || m.id.includes('flash')) && m.supportsTools) ||
      defaultPaidModel;

    return {
      selectedModel: autoModel,
      mode: 'AUTO',
      fallbackUsed: false,
      requiresTools,
      toolSupported: autoModel.supportsTools,
    };
  }

  /**
   * Returns a fallback model if the current one experiences an upstream error.
   */
  public async getFallbackModel(failedModelId: string, mode: RouterMode = 'AUTO'): Promise<OpenCodeModelDescriptor | null> {
    const catalog = await this.discovery.discoverModels();
    const pool =
      mode === 'FREE'
        ? catalog.freeModels
        : mode === 'PAID'
        ? catalog.paidModels
        : catalog.models;

    const alternatives = pool.filter((m) => m.id !== failedModelId && m.status === 'AVAILABLE');
    return alternatives[0] || null;
  }
}
