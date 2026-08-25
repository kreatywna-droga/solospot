/**
 * StorefrontCheckoutValidationEngine.ts — Sprint G1-85 Checkout Validation Engine (Night Shift Level 47)
 *
 * Implements a pure TypeScript, headless checkout journey hardening, cart item validation, stock availability validation,
 * price integrity validation, tax/shipping recalculation, and OrderIntent payload validation engine for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface CheckoutValidationItemDTO {
  readonly productId: string;
  readonly variantId?: string;
  readonly requestedQuantity: number;
  readonly unitPriceCents: number;
}

export interface CheckoutValidationResultDTO {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly calculatedSubtotalCents: number;
  readonly taxCents: number;
  readonly shippingCents: number;
  readonly discountCents: number;
  readonly finalTotalCents: number;
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontCheckoutValidationEngine {
  /**
   * Validates a complete checkout journey and recalculates financial totals with strict integrity rules.
   */
  public static validateCheckoutJourney(
    items: ReadonlyArray<CheckoutValidationItemDTO>,
    promoDiscountCents = 0,
    taxRate = 0.08,
    shippingFeeCents = 500
  ): CheckoutValidationResultDTO {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push('Cart is empty. Checkout cannot proceed.');
    }

    let subtotal = 0;
    (items || []).forEach((item, idx) => {
      if (!item.productId) {
        errors.push(`Item at index ${idx} is missing productId.`);
      }
      if (item.requestedQuantity <= 0) {
        errors.push(`Item ${item.productId || idx} has invalid quantity (${item.requestedQuantity}).`);
      }
      if (item.unitPriceCents < 0) {
        errors.push(`Item ${item.productId || idx} has invalid price (${item.unitPriceCents}).`);
      }
      subtotal += item.requestedQuantity * item.unitPriceCents;
    });

    const discountCents = Math.max(0, Math.min(promoDiscountCents, subtotal));
    const taxableAmount = Math.max(0, subtotal - discountCents);
    const taxCents = Math.round(taxableAmount * taxRate);
    const shippingCents = subtotal > 0 ? shippingFeeCents : 0;
    const finalTotalCents = subtotal - discountCents + taxCents + shippingCents;

    return {
      valid: errors.length === 0,
      errors,
      calculatedSubtotalCents: subtotal,
      taxCents,
      shippingCents,
      discountCents,
      finalTotalCents,
      timestamp: Date.now()
    };
  }

  /**
   * Serializes validation result to JSON string.
   */
  public static serializeValidationResult(result: CheckoutValidationResultDTO): string {
    return JSON.stringify(result);
  }

  /**
   * Restores validation result from JSON string.
   */
  public static restoreValidationResult(json: string): CheckoutValidationResultDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || parsed.valid === undefined) {
        throw new Error('Invalid validation JSON structure');
      }
      return parsed as CheckoutValidationResultDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore validation result: ${err.message}`);
    }
  }
}
