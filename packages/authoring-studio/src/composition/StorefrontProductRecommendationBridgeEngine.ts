/**
 * StorefrontProductRecommendationBridgeEngine.ts — Sprint G1-76 Storefront Product Recommendation Engine (Night Shift Level 38)
 *
 * Implements a pure TypeScript, headless related product recommendation, cross-sell item suggestion, and upsell product mapping engine
 * for published WEB FACTOR storefronts. Increases Average Order Value (AOV) by providing intelligent product recommendations on product pages and in cart drawers.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface RecommendationRuleDTO {
  readonly productId: string;
  readonly relatedProductIds: ReadonlyArray<string>;
  readonly crossSellProductIds: ReadonlyArray<string>;
  readonly upsellProductIds: ReadonlyArray<string>;
}

export interface ProductRecommendationConfigDTO {
  readonly siteId: string;
  readonly rules: ReadonlyArray<RecommendationRuleDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontProductRecommendationBridgeEngine {
  /**
   * Creates a default recommendation configuration.
   */
  public static createDefaultRecommendationConfig(siteId = 'default_storefront_site'): ProductRecommendationConfigDTO {
    return {
      siteId,
      rules: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Sets recommendation rules (related, cross-sell, upsell) for a product.
   */
  public static setProductRecommendations(
    config: ProductRecommendationConfigDTO,
    rule: RecommendationRuleDTO
  ): ProductRecommendationConfigDTO {
    if (!config || !rule || !rule.productId) {
      throw new Error('StorefrontProductRecommendationBridgeEngine: Config or rule is null');
    }

    const existingIdx = config.rules.findIndex(r => r.productId === rule.productId);
    const updatedRules = existingIdx >= 0
      ? config.rules.map((r, idx) => (idx === existingIdx ? rule : r))
      : [...config.rules, rule];

    return {
      ...config,
      rules: updatedRules,
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves related product IDs for a given product.
   */
  public static getRelatedProducts(
    config: ProductRecommendationConfigDTO,
    productId: string,
    maxCount = 4
  ): ReadonlyArray<string> {
    if (!config || !productId) return [];
    const rule = config.rules.find(r => r.productId === productId);
    if (!rule) return [];
    return rule.relatedProductIds.slice(0, maxCount);
  }

  /**
   * Retrieves cross-sell product IDs for cart drawer recommendations.
   */
  public static getCrossSellProducts(
    config: ProductRecommendationConfigDTO,
    productId: string,
    maxCount = 2
  ): ReadonlyArray<string> {
    if (!config || !productId) return [];
    const rule = config.rules.find(r => r.productId === productId);
    if (!rule) return [];
    return rule.crossSellProductIds.slice(0, maxCount);
  }

  /**
   * Serializes recommendation config to JSON string.
   */
  public static serializeRecommendationConfig(config: ProductRecommendationConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores recommendation config from JSON string.
   */
  public static restoreRecommendationConfig(json: string): ProductRecommendationConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid recommendation JSON structure');
      }
      return parsed as ProductRecommendationConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore recommendation config: ${err.message}`);
    }
  }
}
