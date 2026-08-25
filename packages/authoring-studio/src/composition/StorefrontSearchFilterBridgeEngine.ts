/**
 * StorefrontSearchFilterBridgeEngine.ts — Sprint G1-69 Storefront Catalog Search & Filtering Engine (Night Shift Level 31)
 *
 * Implements a pure TypeScript, headless product & content faceted search, multi-criteria filtering, category facet aggregation,
 * and sorting engine for published WEB FACTOR storefronts. Enables shoppers to perform keyword searches, price range filtering,
 * category filtering, and in-stock filtering cleanly.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type SortOption = 'price_asc' | 'price_desc' | 'title';

export interface SearchableProductDTO {
  readonly productId: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly tags: ReadonlyArray<string>;
  readonly priceCents: number;
  readonly inStock: boolean;
}

export interface SearchFilterCriteriaDTO {
  readonly query?: string;
  readonly category?: string;
  readonly minPriceCents?: number;
  readonly maxPriceCents?: number;
  readonly inStockOnly?: boolean;
  readonly sortBy?: SortOption;
}

export interface SearchResultDTO {
  readonly totalCount: number;
  readonly items: ReadonlyArray<SearchableProductDTO>;
  readonly facets: {
    readonly categories: Record<string, number>;
  };
}

export interface SearchCatalogConfigDTO {
  readonly siteId: string;
  readonly products: ReadonlyArray<SearchableProductDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontSearchFilterBridgeEngine {
  /**
   * Creates a default search catalog configuration.
   */
  public static createDefaultCatalogConfig(siteId = 'default_storefront_site'): SearchCatalogConfigDTO {
    return {
      siteId,
      products: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers a product into the searchable catalog index.
   */
  public static registerProduct(config: SearchCatalogConfigDTO, product: SearchableProductDTO): SearchCatalogConfigDTO {
    if (!config || !product) throw new Error('StorefrontSearchFilterBridgeEngine: Config or product is null');

    const existingIdx = config.products.findIndex(p => p.productId === product.productId);
    const updatedProducts = existingIdx >= 0
      ? config.products.map((p, idx) => (idx === existingIdx ? product : p))
      : [...config.products, product];

    return {
      ...config,
      products: updatedProducts,
      lastUpdated: Date.now()
    };
  }

  /**
   * Executes keyword search, faceted category filtering, price bounds filtering, and sorting.
   */
  public static executeSearchAndFilter(
    config: SearchCatalogConfigDTO,
    criteria: SearchFilterCriteriaDTO
  ): SearchResultDTO {
    if (!config) {
      return { totalCount: 0, items: [], facets: { categories: {} } };
    }

    let results = [...config.products];

    // Keyword Search
    if (criteria.query && criteria.query.trim().length > 0) {
      const q = criteria.query.toLowerCase().trim();
      results = results.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
    }

    // Category Filter
    if (criteria.category) {
      results = results.filter(p => p.category.toLowerCase() === criteria.category!.toLowerCase());
    }

    // Price Filtering
    if (criteria.minPriceCents !== undefined) {
      results = results.filter(p => p.priceCents >= criteria.minPriceCents!);
    }
    if (criteria.maxPriceCents !== undefined) {
      results = results.filter(p => p.priceCents <= criteria.maxPriceCents!);
    }

    // In-Stock Filter
    if (criteria.inStockOnly) {
      results = results.filter(p => p.inStock);
    }

    // Sorting
    if (criteria.sortBy === 'price_asc') {
      results.sort((a, b) => a.priceCents - b.priceCents);
    } else if (criteria.sortBy === 'price_desc') {
      results.sort((a, b) => b.priceCents - a.priceCents);
    } else if (criteria.sortBy === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Facet aggregation
    const categories: Record<string, number> = {};
    results.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    return {
      totalCount: results.length,
      items: results,
      facets: { categories }
    };
  }

  /**
   * Serializes catalog config to JSON string.
   */
  public static serializeCatalogConfig(config: SearchCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores catalog config from JSON string.
   */
  public static restoreCatalogConfig(json: string): SearchCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid catalog JSON structure');
      }
      return parsed as SearchCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore catalog config: ${err.message}`);
    }
  }
}
