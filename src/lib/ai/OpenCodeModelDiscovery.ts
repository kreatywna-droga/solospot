/**
 * OpenCodeModelDiscovery.ts — Dynamic Model Discovery for OpenCode API
 *
 * Dynamically queries official OpenCode models catalog:
 * - Primary: https://opencode.ai/zen/v1/models
 * - Fallback / Gateway: process.env.OPENCODE_BASE_URL/models
 *
 * Normalizes metadata: model ID, display name, provider, free/paid tier,
 * context length, tool capabilities, and availability status.
 *
 * Server-side execution only with in-memory TTL caching.
 */

export interface OpenCodeModelDescriptor {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
  contextLength?: number;
  supportsTools: boolean;
  status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  description?: string;
}

export interface ModelDiscoveryResult {
  models: OpenCodeModelDescriptor[];
  freeModels: OpenCodeModelDescriptor[];
  paidModels: OpenCodeModelDescriptor[];
  source: 'zen_api' | 'gateway_api' | 'cache' | 'fallback';
  timestamp: number;
}

export class OpenCodeModelDiscovery {
  private static instance: OpenCodeModelDiscovery;
  private cache: ModelDiscoveryResult | null = null;
  private cacheTTLMs = 10 * 60 * 1000; // 10 minutes cache
  private zenEndpoint = 'https://opencode.ai/zen/v1/models';

  public static getInstance(): OpenCodeModelDiscovery {
    if (!OpenCodeModelDiscovery.instance) {
      OpenCodeModelDiscovery.instance = new OpenCodeModelDiscovery();
    }
    return OpenCodeModelDiscovery.instance;
  }

  /**
   * Discover available models from OpenCode dynamically.
   */
  public async discoverModels(forceRefresh = false): Promise<ModelDiscoveryResult> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.cache.timestamp < this.cacheTTLMs) {
      return this.cache;
    }

    let models: OpenCodeModelDescriptor[] = [];
    let source: ModelDiscoveryResult['source'] = 'fallback';

    // 1. Try OpenCode Zen Models endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(this.zenEndpoint, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'solospot-ai-builder/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (rawList.length > 0) {
          models = this.normalizeZenModels(rawList);
          source = 'zen_api';
        }
      }
    } catch (err: any) {
      console.warn('[OpenCodeModelDiscovery] Zen API models fetch failed, trying gateway:', err?.message);
    }

    // 2. Query Gateway models to ensure exact gateway callable free models (like nvidia/nemotron-3.5-lightning:free)
    try {
      const rawBase = (process.env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .replace(/\/$/, '');
      const apiKey = (process.env.OPENCODE_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${rawBase}/models`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : [];
        if (rawList.length > 0) {
          const gatewayModels = this.normalizeGatewayModels(rawList);
          const freeGateway = gatewayModels.filter((m) => m.isFree);
          const existingIds = new Set(models.map((m) => m.id));
          const newFree = freeGateway.filter((m) => !existingIds.has(m.id));
          models = [...newFree, ...models];
          source = 'gateway_api';
        }
      }
    } catch (err: any) {
      console.warn('[OpenCodeModelDiscovery] Gateway models fetch failed:', err?.message);
    }

    // 3. If remote fetch failed entirely, fallback to safe known model catalog
    if (models.length === 0) {
      if (this.cache) {
        return this.cache;
      }
      models = this.getFallbackCatalog();
      source = 'fallback';
    }

    const freeModels = models.filter((m) => m.isFree);
    const paidModels = models.filter((m) => !m.isFree);

    const result: ModelDiscoveryResult = {
      models,
      freeModels,
      paidModels,
      source,
      timestamp: now,
    };

    this.cache = result;
    return result;
  }

  /**
   * Normalizes models returned by https://opencode.ai/zen/v1/models
   */
  private normalizeZenModels(rawList: any[]): OpenCodeModelDescriptor[] {
    return rawList.map((item) => {
      const id = String(item.id || item.name || '');
      const isFree =
        id.toLowerCase().includes('free') ||
        id.toLowerCase().includes(':free') ||
        item.pricing?.prompt === 0;

      const provider = this.detectProvider(id, item.owned_by);
      const name = this.formatDisplayName(id);
      const supportsTools = this.detectToolSupport(id);

      return {
        id,
        name,
        provider,
        isFree,
        pricing: item.pricing
          ? { prompt: Number(item.pricing.prompt || 0), completion: Number(item.pricing.completion || 0) }
          : undefined,
        contextLength: item.context_length || 32768,
        supportsTools,
        status: supportsTools ? 'AVAILABLE' : 'LIMITED',
        description: item.description,
      };
    });
  }

  /**
   * Normalizes models returned by Gateway models endpoint.
   */
  private normalizeGatewayModels(rawList: any[]): OpenCodeModelDescriptor[] {
    return rawList.map((item) => {
      const id = String(item.id || '');
      const isFree =
        id.includes(':free') ||
        id.includes('-free') ||
        item.pricing?.prompt === '0' ||
        item.pricing?.prompt === 0;

      const provider = this.detectProvider(id, item.owned_by);
      const name = item.name || this.formatDisplayName(id);
      const supportsTools = this.detectToolSupport(id);

      return {
        id,
        name,
        provider,
        isFree,
        pricing: item.pricing
          ? { prompt: parseFloat(item.pricing.prompt || 0), completion: parseFloat(item.pricing.completion || 0) }
          : undefined,
        contextLength: item.context_length || 32768,
        supportsTools,
        status: supportsTools ? 'AVAILABLE' : 'LIMITED',
        description: item.description,
      };
    });
  }

  private detectProvider(id: string, ownedBy?: string): string {
    const lower = id.toLowerCase();
    if (lower.includes('deepseek')) return 'DeepSeek';
    if (lower.includes('nemotron') || lower.includes('nvidia')) return 'NVIDIA';
    if (lower.includes('mimo') || lower.includes('minimax')) return 'MiniMax';
    if (lower.includes('qwen')) return 'Qwen';
    if (lower.includes('claude') || lower.includes('anthropic')) return 'Anthropic';
    if (lower.includes('gpt') || lower.includes('openai')) return 'OpenAI';
    if (lower.includes('gemini') || lower.includes('google')) return 'Google';
    if (lower.includes('ling') || lower.includes('inclusionai')) return 'InclusionAI';
    return ownedBy ? ownedBy.toUpperCase() : 'OpenCode';
  }

  private formatDisplayName(id: string): string {
    const parts = id.split('/');
    const raw = parts[parts.length - 1];
    return raw
      .replace(/:free$/, ' (Free)')
      .replace(/-free$/, ' Free')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private detectToolSupport(id: string): boolean {
    const lower = id.toLowerCase();
    // Experimental reasoning / nano models on free tiers exhaust local workers and should not be advertised as tool capable
    if (lower.includes('reasoning') || lower.includes('nano-omni')) return false;

    // Known tool calling compatible families
    if (lower.includes('gpt-4') || lower.includes('gpt-5') || lower.includes('gpt-3.5')) return true;
    if (lower.includes('claude-3') || lower.includes('claude-sonnet') || lower.includes('claude-opus')) return true;
    if (lower.includes('deepseek-v4') || lower.includes('deepseek-v3')) return true;
    if (lower.includes('nemotron-3.5-lightning') || lower.includes('nemotron-3-ultra')) return true;
    if (lower.includes('qwen2.5') || lower.includes('qwen3')) return true;
    if (lower.includes('mimo-v2.5')) return true;
    return false;
  }

  private getFallbackCatalog(): OpenCodeModelDescriptor[] {
    return [
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        isFree: false,
        supportsTools: true,
        status: 'AVAILABLE',
      },
      {
        id: 'deepseek-v4-flash-free',
        name: 'DeepSeek V4 Flash Free',
        provider: 'DeepSeek',
        isFree: true,
        supportsTools: true,
        status: 'AVAILABLE',
      },
      {
        id: 'mimo-v2.5-free',
        name: 'MiMo-V2.5 Free',
        provider: 'MiniMax',
        isFree: true,
        supportsTools: true,
        status: 'AVAILABLE',
      },
      {
        id: 'nemotron-3-ultra-free',
        name: 'Nemotron-3 Ultra Free',
        provider: 'NVIDIA',
        isFree: true,
        supportsTools: true,
        status: 'AVAILABLE',
      },
      {
        id: 'anthropic/claude-3.5-haiku',
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        isFree: false,
        supportsTools: true,
        status: 'AVAILABLE',
      },
    ];
  }
}
