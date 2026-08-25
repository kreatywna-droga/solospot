/**
 * StorefrontProductInventoryBridgeEngine.ts — Sprint G1-68 Storefront Product Inventory Engine (Night Shift Level 30)
 *
 * Implements a pure TypeScript, headless product stock inventory tracking, low-stock threshold alerting, and stock decrement engine
 * for published WEB FACTOR storefronts. Prevents out-of-stock purchases, manages SKU quantities, and triggers low-stock badges.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface InventoryItemDTO {
  readonly productId: string;
  readonly stockQuantity: number;
  readonly lowStockThreshold: number;
  readonly allowBackorder: boolean;
  readonly sku: string;
}

export interface StockCheckResultDTO {
  readonly productId: string;
  readonly isAvailable: boolean;
  readonly requestedQuantity: number;
  readonly availableQuantity: number;
  readonly isLowStock: boolean;
  readonly error?: string;
}

export interface InventoryConfigDTO {
  readonly siteId: string;
  readonly items: ReadonlyArray<InventoryItemDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontProductInventoryBridgeEngine {
  /**
   * Creates a default inventory configuration.
   */
  public static createDefaultInventoryConfig(siteId = 'default_storefront_site'): InventoryConfigDTO {
    return {
      siteId,
      items: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Sets or updates stock quantity for a product.
   */
  public static setProductStock(
    config: InventoryConfigDTO,
    productId: string,
    stockQuantity: number,
    lowStockThreshold = 5,
    allowBackorder = false,
    sku = ''
  ): InventoryConfigDTO {
    if (!config || !productId) throw new Error('StorefrontProductInventoryBridgeEngine: Config or productId is null');

    const item: InventoryItemDTO = {
      productId,
      stockQuantity: Math.max(0, stockQuantity),
      lowStockThreshold,
      allowBackorder,
      sku: sku || `SKU_${productId}`
    };

    const existingIdx = config.items.findIndex(i => i.productId === productId);
    const updatedItems = existingIdx >= 0
      ? config.items.map((i, idx) => (idx === existingIdx ? item : i))
      : [...config.items, item];

    return {
      ...config,
      items: updatedItems,
      lastUpdated: Date.now()
    };
  }

  /**
   * Checks stock availability for a requested quantity of a product.
   */
  public static checkStockAvailability(
    config: InventoryConfigDTO,
    productId: string,
    requestedQuantity = 1
  ): StockCheckResultDTO {
    if (!config || !productId) {
      return { productId: productId || '', isAvailable: false, requestedQuantity, availableQuantity: 0, isLowStock: false, error: 'Config or productId is null' };
    }

    const item = config.items.find(i => i.productId === productId);
    if (!item) {
      // Default fallback: assume in-stock if un-tracked
      return { productId, isAvailable: true, requestedQuantity, availableQuantity: 999, isLowStock: false };
    }

    const isAvailable = item.allowBackorder || item.stockQuantity >= requestedQuantity;
    const isLowStock = item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0;

    return {
      productId,
      isAvailable,
      requestedQuantity,
      availableQuantity: item.stockQuantity,
      isLowStock,
      error: !isAvailable ? `Only ${item.stockQuantity} items in stock` : undefined
    };
  }

  /**
   * Decrements stock quantity upon successful order placement.
   */
  public static decrementStock(
    config: InventoryConfigDTO,
    productId: string,
    quantity = 1
  ): InventoryConfigDTO {
    if (!config || !productId) throw new Error('StorefrontProductInventoryBridgeEngine: Config or productId is null');

    const updatedItems = config.items.map(item => {
      if (item.productId === productId) {
        const nextQty = item.allowBackorder ? item.stockQuantity - quantity : Math.max(0, item.stockQuantity - quantity);
        return { ...item, stockQuantity: nextQty };
      }
      return item;
    });

    return {
      ...config,
      items: updatedItems,
      lastUpdated: Date.now()
    };
  }

  /**
   * Serializes inventory config to JSON string.
   */
  public static serializeInventoryConfig(config: InventoryConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores inventory config from JSON string.
   */
  public static restoreInventoryConfig(json: string): InventoryConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid inventory JSON structure');
      }
      return parsed as InventoryConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore inventory config: ${err.message}`);
    }
  }
}
