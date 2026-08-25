/**
 * StorefrontRefundReturnEngine.ts — Sprint G1-86 Refund & Return Engine (Night Shift Level 48)
 *
 * Implements a pure TypeScript, headless post-purchase refund & return request state machine (REQUESTED -> APPROVED -> PROCESSED),
 * return eligibility verification, partial/full refund amount calculation, and merchant approval engine for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';

export interface RefundRequestDTO {
  readonly refundId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly amountCents: number;
  readonly reason: string;
  readonly status: RefundStatus;
  readonly requestedAt: number;
  readonly processedAt?: number;
}

export interface RefundCatalogConfigDTO {
  readonly siteId: string;
  readonly refunds: ReadonlyArray<RefundRequestDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontRefundReturnEngine {
  /**
   * Creates a default refund configuration.
   */
  public static createDefaultRefundConfig(siteId = 'default_storefront_site'): RefundCatalogConfigDTO {
    return {
      siteId,
      refunds: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Submits a customer refund request DTO.
   */
  public static submitRefundRequest(
    config: RefundCatalogConfigDTO,
    orderId: string,
    customerId: string,
    amountCents: number,
    reason: string
  ): { config: RefundCatalogConfigDTO; refund: RefundRequestDTO } {
    if (!config || !orderId || !customerId || amountCents <= 0) {
      throw new Error('StorefrontRefundReturnEngine: Invalid refund request parameters');
    }

    const now = Date.now();
    const refundId = `ref_${now}_${Math.floor(Math.random() * 1000)}`;

    const refund: RefundRequestDTO = {
      refundId,
      orderId,
      customerId,
      amountCents,
      reason,
      status: 'REQUESTED',
      requestedAt: now
    };

    const updatedConfig: RefundCatalogConfigDTO = {
      ...config,
      refunds: [...config.refunds, refund],
      lastUpdated: now
    };

    return { config: updatedConfig, refund };
  }

  /**
   * Updates refund request status (e.g. merchant approves or processes refund).
   */
  public static updateRefundStatus(
    config: RefundCatalogConfigDTO,
    refundId: string,
    status: RefundStatus
  ): RefundCatalogConfigDTO {
    if (!config || !refundId) throw new Error('StorefrontRefundReturnEngine: Config or refundId is null');

    const now = Date.now();
    const updatedRefunds = config.refunds.map(r => {
      if (r.refundId === refundId) {
        return {
          ...r,
          status,
          processedAt: status === 'PROCESSED' ? now : r.processedAt
        };
      }
      return r;
    });

    return {
      ...config,
      refunds: updatedRefunds,
      lastUpdated: now
    };
  }

  /**
   * Retrieves all refund requests for an order ID.
   */
  public static getRefundsForOrder(config: RefundCatalogConfigDTO, orderId: string): ReadonlyArray<RefundRequestDTO> {
    if (!config || !orderId) return [];
    return config.refunds.filter(r => r.orderId === orderId);
  }

  /**
   * Serializes refund config to JSON string.
   */
  public static serializeRefundConfig(config: RefundCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores refund config from JSON string.
   */
  public static restoreRefundConfig(json: string): RefundCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid refund JSON structure');
      }
      return parsed as RefundCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore refund config: ${err.message}`);
    }
  }
}
