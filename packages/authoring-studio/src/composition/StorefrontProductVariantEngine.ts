/**
 * StorefrontProductVariantEngine.ts — Sprint G1-84 Product Option & Variant Engine (Night Shift Level 46)
 *
 * Implements a pure TypeScript, headless product variant resolution, multi-option combinations (Size, Color, Material),
 * variant-level pricing override, SKU binding, and stock availability resolution engine for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface ProductOptionDTO {
  readonly name: string; // e.g. "Size", "Color"
  readonly values: ReadonlyArray<string>; // e.g. ["S", "M", "L"]
}

export interface ProductVariantDTO {
  readonly variantId: string;
  readonly productId: string;
  readonly optionValues: Record<string, string>; // e.g. { Size: "M", Color: "Blue" }
  readonly priceCents: number;
  readonly sku: string;
  readonly inventoryCount: number;
  readonly inStock: boolean;
}

export interface ProductVariantCatalogConfigDTO {
  readonly siteId: string;
  readonly variants: ReadonlyArray<ProductVariantDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontProductVariantEngine {
  /**
   * Creates a default variant configuration.
   */
  public static createDefaultVariantConfig(siteId = 'default_storefront_site'): ProductVariantCatalogConfigDTO {
    return {
      siteId,
      variants: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers or updates a product variant DTO.
   */
  public static registerVariant(
    config: ProductVariantCatalogConfigDTO,
    variant: ProductVariantDTO
  ): ProductVariantCatalogConfigDTO {
    if (!config || !variant || !variant.variantId || !variant.productId || variant.priceCents < 0) {
      throw new Error('StorefrontProductVariantEngine: Config or variant parameters are invalid');
    }

    const existingIdx = config.variants.findIndex(v => v.variantId === variant.variantId);
    const updatedVariants = existingIdx >= 0
      ? config.variants.map((v, idx) => (idx === existingIdx ? variant : v))
      : [...config.variants, variant];

    return {
      ...config,
      variants: updatedVariants,
      lastUpdated: Date.now()
    };
  }

  /**
   * Resolves a matching product variant based on selected option combinations (e.g. Size=M, Color=Red).
   */
  public static resolveVariant(
    config: ProductVariantCatalogConfigDTO,
    productId: string,
    selectedOptions: Record<string, string>
  ): ProductVariantDTO | undefined {
    if (!config || !productId || !selectedOptions) return undefined;

    return config.variants.find(v => {
      if (v.productId !== productId) return false;
      const keys = Object.keys(selectedOptions);
      return keys.every(k => v.optionValues[k] === selectedOptions[k]);
    });
  }

  /**
   * Retrieves all registered variants for a given product ID.
   */
  public static getVariantsForProduct(
    config: ProductVariantCatalogConfigDTO,
    productId: string
  ): ReadonlyArray<ProductVariantDTO> {
    if (!config || !productId) return [];
    return config.variants.filter(v => v.productId === productId);
  }

  /**
   * Serializes variant config to JSON string.
   */
  public static serializeVariantConfig(config: ProductVariantCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores variant config from JSON string.
   */
  public static restoreVariantConfig(json: string): ProductVariantCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid variant JSON structure');
      }
      return parsed as ProductVariantCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore variant config: ${err.message}`);
    }
  }
}
