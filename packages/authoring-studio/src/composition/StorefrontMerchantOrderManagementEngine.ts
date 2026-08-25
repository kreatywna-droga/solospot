/**
 * StorefrontMerchantOrderManagementEngine.ts — Sprint G1-82 Merchant Order Management Engine (Night Shift Level 44)
 *
 * Implements a pure TypeScript, headless merchant-facing order management domain, order filtering, fulfillment status updates,
 * merchant order analytics aggregation, and multi-criteria order search engine for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface MerchantOrderSummaryDTO {
  readonly orderId: string;
  readonly customerId: string;
  readonly customerEmail: string;
  readonly totalCents: number;
  readonly paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  readonly fulfillmentStatus: 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  readonly orderDate: number;
  readonly itemCount: number;
}

export interface OrderFilterCriteriaDTO {
  readonly paymentStatus?: string;
  readonly fulfillmentStatus?: string;
  readonly customerEmail?: string;
  readonly minTotalCents?: number;
  readonly maxTotalCents?: number;
}

export interface MerchantOrderStatsDTO {
  readonly totalOrders: number;
  readonly totalRevenueCents: number;
  readonly pendingFulfillmentCount: number;
  readonly averageOrderValueCents: number;
}

export interface MerchantOrderCatalogConfigDTO {
  readonly siteId: string;
  readonly orders: ReadonlyArray<MerchantOrderSummaryDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontMerchantOrderManagementEngine {
  /**
   * Creates a default merchant order management configuration.
   */
  public static createDefaultMerchantOrderConfig(siteId = 'default_storefront_site'): MerchantOrderCatalogConfigDTO {
    return {
      siteId,
      orders: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Records or updates a merchant order summary DTO.
   */
  public static recordMerchantOrder(
    config: MerchantOrderCatalogConfigDTO,
    order: MerchantOrderSummaryDTO
  ): MerchantOrderCatalogConfigDTO {
    if (!config || !order || !order.orderId) {
      throw new Error('StorefrontMerchantOrderManagementEngine: Config or order is null');
    }

    const existingIdx = config.orders.findIndex(o => o.orderId === order.orderId);
    const updatedOrders = existingIdx >= 0
      ? config.orders.map((o, idx) => (idx === existingIdx ? order : o))
      : [...config.orders, order];

    return {
      ...config,
      orders: updatedOrders,
      lastUpdated: Date.now()
    };
  }

  /**
   * Filters merchant orders based on multi-criteria filter rules.
   */
  public static filterMerchantOrders(
    config: MerchantOrderCatalogConfigDTO,
    criteria: OrderFilterCriteriaDTO
  ): ReadonlyArray<MerchantOrderSummaryDTO> {
    if (!config) return [];

    let results = [...config.orders];

    if (criteria.paymentStatus) {
      results = results.filter(o => o.paymentStatus.toUpperCase() === criteria.paymentStatus!.toUpperCase());
    }
    if (criteria.fulfillmentStatus) {
      results = results.filter(o => o.fulfillmentStatus.toUpperCase() === criteria.fulfillmentStatus!.toUpperCase());
    }
    if (criteria.customerEmail) {
      results = results.filter(o => o.customerEmail.toLowerCase().includes(criteria.customerEmail!.toLowerCase()));
    }
    if (criteria.minTotalCents !== undefined) {
      results = results.filter(o => o.totalCents >= criteria.minTotalCents!);
    }
    if (criteria.maxTotalCents !== undefined) {
      results = results.filter(o => o.totalCents <= criteria.maxTotalCents!);
    }

    return results;
  }

  /**
   * Calculates aggregate merchant order statistics (total revenue, pending orders, AOV).
   */
  public static getMerchantOrderStats(config: MerchantOrderCatalogConfigDTO): MerchantOrderStatsDTO {
    if (!config || config.orders.length === 0) {
      return { totalOrders: 0, totalRevenueCents: 0, pendingFulfillmentCount: 0, averageOrderValueCents: 0 };
    }

    let revenue = 0;
    let pendingCount = 0;

    config.orders.forEach(o => {
      if (o.paymentStatus === 'PAID') revenue += o.totalCents;
      if (o.fulfillmentStatus === 'UNFULFILLED' || o.fulfillmentStatus === 'PROCESSING') pendingCount++;
    });

    const aov = config.orders.length > 0 ? Math.round(revenue / config.orders.length) : 0;

    return {
      totalOrders: config.orders.length,
      totalRevenueCents: revenue,
      pendingFulfillmentCount: pendingCount,
      averageOrderValueCents: aov
    };
  }

  /**
   * Serializes merchant order config to JSON string.
   */
  public static serializeMerchantOrderConfig(config: MerchantOrderCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores merchant order config from JSON string.
   */
  public static restoreMerchantOrderConfig(json: string): MerchantOrderCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid merchant order JSON structure');
      }
      return parsed as MerchantOrderCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore merchant order config: ${err.message}`);
    }
  }
}
