/**
 * StorefrontOrderHistoryBridgeEngine.ts — Sprint G1-67 Storefront Order History Engine (Night Shift Level 29)
 *
 * Implements a pure TypeScript, headless customer order tracking, historical purchase retrieval, and order status update engine
 * for published WEB FACTOR storefronts. Manages order records, item line breakdowns, shipment tracking numbers, and customer account purchase histories.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type OrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItemRecordDTO {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly totalPriceCents: number;
}

export interface OrderRecordDTO {
  readonly orderId: string;
  readonly customerId: string;
  readonly orderDate: number;
  readonly status: OrderStatus;
  readonly items: ReadonlyArray<OrderItemRecordDTO>;
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly totalCents: number;
  readonly trackingNumber?: string;
}

export interface OrderHistoryConfigDTO {
  readonly siteId: string;
  readonly orders: ReadonlyArray<OrderRecordDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontOrderHistoryBridgeEngine {
  /**
   * Creates a default order history configuration.
   */
  public static createDefaultOrderHistoryConfig(siteId = 'default_storefront_site'): OrderHistoryConfigDTO {
    return {
      siteId,
      orders: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Records a completed order into the storefront order history database.
   */
  public static recordOrder(config: OrderHistoryConfigDTO, order: OrderRecordDTO): OrderHistoryConfigDTO {
    if (!config || !order) throw new Error('StorefrontOrderHistoryBridgeEngine: Config or order is null');

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
   * Retrieves order history for a specific customer ID.
   */
  public static getCustomerOrders(config: OrderHistoryConfigDTO, customerId: string): ReadonlyArray<OrderRecordDTO> {
    if (!config || !customerId) return [];
    return config.orders.filter(o => o.customerId === customerId);
  }

  /**
   * Updates an order's status and tracking number.
   */
  public static updateOrderStatus(
    config: OrderHistoryConfigDTO,
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ): OrderHistoryConfigDTO {
    if (!config || !orderId) throw new Error('StorefrontOrderHistoryBridgeEngine: Config or orderId is null');

    const updatedOrders = config.orders.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          status,
          trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber
        };
      }
      return o;
    });

    return {
      ...config,
      orders: updatedOrders,
      lastUpdated: Date.now()
    };
  }

  /**
   * Serializes order history config to JSON string.
   */
  public static serializeOrderHistoryConfig(config: OrderHistoryConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores order history config from JSON string.
   */
  public static restoreOrderHistoryConfig(json: string): OrderHistoryConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid order history JSON structure');
      }
      return parsed as OrderHistoryConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore order history config: ${err.message}`);
    }
  }
}
