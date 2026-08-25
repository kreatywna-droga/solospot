/**
 * StorefrontAbandonedCartRecoveryBridgeEngine.ts — Sprint G1-77 Storefront Abandoned Cart Recovery Engine (Night Shift Level 39)
 *
 * Implements a pure TypeScript, headless abandoned cart tracking, recovery email queue, and cart restoration engine
 * for published WEB FACTOR storefronts. Recovers lost sales revenue by capturing incomplete checkout sessions and managing recovery workflows.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type RecoveryStatus = 'PENDING' | 'RECOVERED' | 'EXPIRED';

export interface AbandonedCartItemDTO {
  readonly productId: string;
  readonly quantity: number;
  readonly priceCents: number;
}

export interface AbandonedCartSessionDTO {
  readonly sessionId: string;
  readonly customerEmail: string;
  readonly items: ReadonlyArray<AbandonedCartItemDTO>;
  readonly subtotalCents: number;
  readonly abandonedAt: number;
  readonly recoveryStatus: RecoveryStatus;
  readonly recoveryEmailSentCount: number;
}

export interface AbandonedCartConfigDTO {
  readonly siteId: string;
  readonly abandonedCarts: ReadonlyArray<AbandonedCartSessionDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontAbandonedCartRecoveryBridgeEngine {
  /**
   * Creates a default abandoned cart configuration.
   */
  public static createDefaultAbandonedCartConfig(siteId = 'default_storefront_site'): AbandonedCartConfigDTO {
    return {
      siteId,
      abandonedCarts: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Records an abandoned cart session when a customer leaves checkout.
   */
  public static recordAbandonedCart(
    config: AbandonedCartConfigDTO,
    sessionId: string,
    customerEmail: string,
    items: ReadonlyArray<AbandonedCartItemDTO>,
    subtotalCents: number
  ): AbandonedCartConfigDTO {
    if (!config || !sessionId || !customerEmail) {
      throw new Error('StorefrontAbandonedCartRecoveryBridgeEngine: Config, sessionId, or customerEmail is null');
    }

    const now = Date.now();
    const newSession: AbandonedCartSessionDTO = {
      sessionId,
      customerEmail: customerEmail.trim(),
      items,
      subtotalCents,
      abandonedAt: now,
      recoveryStatus: 'PENDING',
      recoveryEmailSentCount: 0
    };

    const existingIdx = config.abandonedCarts.findIndex(c => c.sessionId === sessionId);
    const updatedCarts = existingIdx >= 0
      ? config.abandonedCarts.map((c, idx) => (idx === existingIdx ? newSession : c))
      : [...config.abandonedCarts, newSession];

    return {
      ...config,
      abandonedCarts: updatedCarts,
      lastUpdated: now
    };
  }

  /**
   * Marks an abandoned cart session as successfully recovered upon checkout completion.
   */
  public static markCartRecovered(config: AbandonedCartConfigDTO, sessionId: string): AbandonedCartConfigDTO {
    if (!config || !sessionId) throw new Error('StorefrontAbandonedCartRecoveryBridgeEngine: Config or sessionId is null');

    const updatedCarts = config.abandonedCarts.map(c => (c.sessionId === sessionId ? { ...c, recoveryStatus: 'RECOVERED' as RecoveryStatus } : c));

    return {
      ...config,
      abandonedCarts: updatedCarts,
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves pending recovery cart sessions.
   */
  public static getPendingRecoveryCarts(config: AbandonedCartConfigDTO): ReadonlyArray<AbandonedCartSessionDTO> {
    if (!config) return [];
    return config.abandonedCarts.filter(c => c.recoveryStatus === 'PENDING');
  }

  /**
   * Serializes abandoned cart config to JSON string.
   */
  public static serializeAbandonedCartConfig(config: AbandonedCartConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores abandoned cart config from JSON string.
   */
  public static restoreAbandonedCartConfig(json: string): AbandonedCartConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid abandoned cart JSON structure');
      }
      return parsed as AbandonedCartConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore abandoned cart config: ${err.message}`);
    }
  }
}
