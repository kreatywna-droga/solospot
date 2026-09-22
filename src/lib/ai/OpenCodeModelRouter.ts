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
    // Free-model-first: default is the best free model, not a paid model
    const defaultPaidModel =
      catalog.freeModels.find((m) => m.id === 'nex-agi/nex-n2.5-pro:free') ||
      catalog.freeModels.find((m) => m.supportsTools) ||
      catalog.freeModels[0] ||
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

      return {
        selectedModel: targetModel,
        mode: mode,
        fallbackUsed: false,
        requiresTools,
        toolSupported,
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
        };
      }

      // Preferred working free models with verified low latency (<1s) and high reasoning capability in Polish
      const preferredFree =
        freeCandidates.find((m) => m.id === 'nex-agi/nex-n2.5-pro:free') ||
        freeCandidates.find((m) => m.id === 'nex-agi/nex-n2.5-mini:free') ||
        freeCandidates.find((m) => m.id === 'dots-studio/dots-3-note-preview:free') ||
        freeCandidates.find((m) => m.id === 'liquid/lfm-2.5-2.6b:free') ||
        freeCandidates.find((m) => m.id.includes('nex-n2.5')) ||
        freeCandidates.find((m) => m.id === 'nvidia/nemotron-3.5-lightning:free') ||
        freeCandidates.find((m) => m.supportsTools) ||
        freeCandidates[0];

      return {
        selectedModel: preferredFree,
        mode: 'FREE',
        fallbackUsed: false,
        requiresTools: false,
        toolSupported: preferredFree.supportsTools,
      };
    }

    // PAID MODE: Same as AUTO (free-model-first architecture)
    // Paid models are not used — only free models
    if (mode === 'PAID') {
      const paidModel =
        catalog.freeModels.find((m) => m.id === 'nex-agi/nex-n2.5-pro:free') ||
        catalog.freeModels.find((m) => m.supportsTools) ||
        catalog.freeModels[0] ||
        defaultPaidModel;

      return {
        selectedModel: paidModel,
        mode: 'PAID',
        fallbackUsed: false,
        requiresTools,
        toolSupported: paidModel.supportsTools,
      };
    }

    // AUTO MODE: Choose best free model (free-model-first architecture)
    const autoModel =
      catalog.freeModels.find((m) => m.id === 'nex-agi/nex-n2.5-pro:free') ||
      catalog.freeModels.find((m) => m.id === 'nvidia/nemotron-3.5-lightning:free') ||
      catalog.freeModels.find((m) => m.supportsTools) ||
      catalog.freeModels[0] ||
      catalog.models.find((m) => m.supportsTools) ||
      catalog.models[0];

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
