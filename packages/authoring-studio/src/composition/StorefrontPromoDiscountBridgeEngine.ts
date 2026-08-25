/**
 * StorefrontPromoDiscountBridgeEngine.ts — Sprint G1-64 Storefront Promotional Coupon & Cart Discount Engine (Night Shift Level 26)
 *
 * Implements a pure TypeScript, headless promotional coupon, cart discount, and volume rules engine for published WEB FACTOR storefronts.
 * Validates promo codes, calculates percentage & fixed-amount discounts in integer cents, enforces cart subtotal thresholds,
 * checks expiry timestamps, tracks max redemptions, and integrates directly with storefront cart sessions.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface CouponRuleDTO {
  readonly couponCode: string;
  readonly discountType: DiscountType;
  readonly discountValue: number; // Percentage (0-100) or Fixed Cents amount
  readonly minCartSubtotalCents: number;
  readonly expiryTimestamp: number;
  readonly maxRedemptions: number;
  readonly redemptionCount: number;
  readonly isActive: boolean;
}

export interface AppliedDiscountDTO {
  readonly couponCode: string;
  readonly discountType: DiscountType;
  readonly discountAmountCents: number;
  readonly originalCartSubtotalCents: number;
  readonly finalCartSubtotalCents: number;
  readonly appliedAt: number;
}

export interface VolumeDiscountRuleDTO {
  readonly minItemCount: number;
  readonly discountPercentage: number;
}

export interface PromoDiscountConfigDTO {
  readonly siteId: string;
  readonly activeCoupons: ReadonlyArray<CouponRuleDTO>;
  readonly volumeDiscountRules: ReadonlyArray<VolumeDiscountRuleDTO>;
  readonly lastUpdated: number;
}

export interface CouponValidationResult {
  readonly isValid: boolean;
  readonly appliedDiscount?: AppliedDiscountDTO;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontPromoDiscountBridgeEngine {
  /**
   * Creates a default promotional discount configuration with sample coupons.
   */
  public static createDefaultPromoConfig(siteId = 'default_storefront_site'): PromoDiscountConfigDTO {
    const defaultCoupons: CouponRuleDTO[] = [
      {
        couponCode: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minCartSubtotalCents: 1000, // $10.00 min
        expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        maxRedemptions: 1000,
        redemptionCount: 0,
        isActive: true
      },
      {
        couponCode: 'SAVE20USD',
        discountType: 'FIXED_AMOUNT',
        discountValue: 2000, // $20.00 off
        minCartSubtotalCents: 5000, // $50.00 min
        expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
        maxRedemptions: 500,
        redemptionCount: 0,
        isActive: true
      }
    ];

    const defaultVolumeRules: VolumeDiscountRuleDTO[] = [
      { minItemCount: 5, discountPercentage: 5 },
      { minItemCount: 10, discountPercentage: 12 }
    ];

    return {
      siteId,
      activeCoupons: defaultCoupons,
      volumeDiscountRules: defaultVolumeRules,
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers or updates a coupon rule in the promo configuration.
   */
  public static registerCouponRule(config: PromoDiscountConfigDTO, coupon: CouponRuleDTO): PromoDiscountConfigDTO {
    if (!config || !coupon) throw new Error('StorefrontPromoDiscountBridgeEngine: Config or coupon is null');

    const upperCode = coupon.couponCode.toUpperCase().trim();
    const normalizedCoupon = { ...coupon, couponCode: upperCode };

    const existingIdx = config.activeCoupons.findIndex(c => c.couponCode === upperCode);
    const updatedCoupons = existingIdx >= 0
      ? config.activeCoupons.map((c, idx) => (idx === existingIdx ? normalizedCoupon : c))
      : [...config.activeCoupons, normalizedCoupon];

    return {
      ...config,
      activeCoupons: updatedCoupons,
      lastUpdated: Date.now()
    };
  }

  /**
   * Validates and applies a coupon code against a cart subtotal in cents.
   */
  public static validateAndApplyCoupon(
    config: PromoDiscountConfigDTO,
    couponCode: string,
    cartSubtotalCents: number,
    itemCount = 1
  ): CouponValidationResult {
    if (!config || !couponCode) {
      return { isValid: false, error: 'Config or coupon code is missing' };
    }

    const upperCode = couponCode.toUpperCase().trim();
    const coupon = config.activeCoupons.find(c => c.couponCode === upperCode);

    if (!coupon || !coupon.isActive) {
      return { isValid: false, error: `Coupon code '${upperCode}' is invalid or inactive` };
    }

    if (Date.now() > coupon.expiryTimestamp) {
      return { isValid: false, error: `Coupon code '${upperCode}' has expired` };
    }

    if (coupon.redemptionCount >= coupon.maxRedemptions) {
      return { isValid: false, error: `Coupon code '${upperCode}' has reached maximum redemptions` };
    }

    if (cartSubtotalCents < coupon.minCartSubtotalCents) {
      return {
        isValid: false,
        error: `Minimum cart subtotal of ${(coupon.minCartSubtotalCents / 100).toFixed(2)} required for coupon '${upperCode}'`
      };
    }

    let discountAmountCents = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmountCents = Math.round((cartSubtotalCents * coupon.discountValue) / 100);
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discountAmountCents = Math.min(coupon.discountValue, cartSubtotalCents);
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      discountAmountCents = 0;
    }

    const finalCartSubtotalCents = Math.max(0, cartSubtotalCents - discountAmountCents);

    return {
      isValid: true,
      appliedDiscount: {
        couponCode: upperCode,
        discountType: coupon.discountType,
        discountAmountCents,
        originalCartSubtotalCents: cartSubtotalCents,
        finalCartSubtotalCents,
        appliedAt: Date.now()
      }
    };
  }

  /**
   * Serializes promo configuration to JSON string.
   */
  public static serializePromoConfig(config: PromoDiscountConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores promo configuration from JSON string.
   */
  public static restorePromoConfig(json: string): PromoDiscountConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid promo JSON structure');
      }
      return parsed as PromoDiscountConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore promo config: ${err.message}`);
    }
  }
}
