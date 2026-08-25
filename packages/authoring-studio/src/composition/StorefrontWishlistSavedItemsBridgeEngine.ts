/**
 * StorefrontWishlistSavedItemsBridgeEngine.ts — Sprint G1-72 Storefront Customer Wishlist Engine (Night Shift Level 34)
 *
 * Implements a pure TypeScript, headless customer wishlist management, saved favorite products, and wishlist transfer-to-cart engine
 * for published WEB FACTOR storefronts. Allows shoppers to save items for future purchases and manage personal saved product lists.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface WishlistItemDTO {
  readonly productId: string;
  readonly productName: string;
  readonly priceCents: number;
  readonly imageUrl: string;
  readonly addedAt: number;
}

export interface CustomerWishlistDTO {
  readonly customerId: string;
  readonly items: ReadonlyArray<WishlistItemDTO>;
  readonly lastUpdated: number;
}

export interface WishlistCatalogConfigDTO {
  readonly siteId: string;
  readonly wishlists: Record<string, CustomerWishlistDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontWishlistSavedItemsBridgeEngine {
  /**
   * Creates a default wishlist catalog configuration.
   */
  public static createDefaultWishlistConfig(siteId = 'default_storefront_site'): WishlistCatalogConfigDTO {
    return {
      siteId,
      wishlists: {},
      lastUpdated: Date.now()
    };
  }

  /**
   * Adds a product item to a customer's wishlist.
   */
  public static addToWishlist(
    config: WishlistCatalogConfigDTO,
    customerId: string,
    product: { productId: string; productName: string; priceCents: number; imageUrl?: string }
  ): WishlistCatalogConfigDTO {
    if (!config || !customerId || !product || !product.productId) {
      throw new Error('StorefrontWishlistSavedItemsBridgeEngine: Config, customerId, or product is null');
    }

    const existingWishlist = config.wishlists[customerId] || { customerId, items: [], lastUpdated: Date.now() };
    const alreadySaved = existingWishlist.items.some(i => i.productId === product.productId);

    if (alreadySaved) return config; // Idempotent add

    const newItem: WishlistItemDTO = {
      productId: product.productId,
      productName: product.productName,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl || '',
      addedAt: Date.now()
    };

    const updatedWishlist: CustomerWishlistDTO = {
      customerId,
      items: [...existingWishlist.items, newItem],
      lastUpdated: Date.now()
    };

    return {
      ...config,
      wishlists: {
        ...config.wishlists,
        [customerId]: updatedWishlist
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Removes a product item from a customer's wishlist.
   */
  public static removeFromWishlist(
    config: WishlistCatalogConfigDTO,
    customerId: string,
    productId: string
  ): WishlistCatalogConfigDTO {
    if (!config || !customerId || !productId) {
      throw new Error('StorefrontWishlistSavedItemsBridgeEngine: Config, customerId, or productId is null');
    }

    const existingWishlist = config.wishlists[customerId];
    if (!existingWishlist) return config;

    const updatedItems = existingWishlist.items.filter(i => i.productId !== productId);
    const updatedWishlist: CustomerWishlistDTO = {
      ...existingWishlist,
      items: updatedItems,
      lastUpdated: Date.now()
    };

    return {
      ...config,
      wishlists: {
        ...config.wishlists,
        [customerId]: updatedWishlist
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves a customer's saved wishlist items.
   */
  public static getCustomerWishlist(config: WishlistCatalogConfigDTO, customerId: string): CustomerWishlistDTO {
    if (!config || !customerId || !config.wishlists[customerId]) {
      return { customerId: customerId || '', items: [], lastUpdated: Date.now() };
    }
    return config.wishlists[customerId];
  }

  /**
   * Serializes wishlist config to JSON string.
   */
  public static serializeWishlistConfig(config: WishlistCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores wishlist config from JSON string.
   */
  public static restoreWishlistConfig(json: string): WishlistCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid wishlist JSON structure');
      }
      return parsed as WishlistCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore wishlist config: ${err.message}`);
    }
  }
}
