/**
 * StorefrontNotificationBannerBridgeEngine.ts — Sprint G1-74 Storefront Notification Banner Engine (Night Shift Level 36)
 *
 * Implements a pure TypeScript, headless storefront announcement bar, promotional banner, dismissible alert toast, and top bar engine
 * for published WEB FACTOR storefronts. Manages store announcements, promotional coupon highlights, and dismissible notice states.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type BannerType = 'INFO' | 'PROMO' | 'ALERT';

export interface BannerRecordDTO {
  readonly bannerId: string;
  readonly title: string;
  readonly message: string;
  readonly type: BannerType;
  readonly actionUrl?: string;
  readonly actionText?: string;
  readonly isDismissible: boolean;
  readonly isActive: boolean;
}

export interface BannerConfigDTO {
  readonly siteId: string;
  readonly banners: ReadonlyArray<BannerRecordDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontNotificationBannerBridgeEngine {
  /**
   * Creates a default banner configuration.
   */
  public static createDefaultBannerConfig(siteId = 'default_storefront_site'): BannerConfigDTO {
    return {
      siteId,
      banners: [
        {
          bannerId: 'b_welcome',
          title: 'Special Offer',
          message: 'Free shipping on orders over $50! Use code FREESHIP at checkout.',
          type: 'PROMO',
          actionUrl: '/store',
          actionText: 'Shop Now',
          isDismissible: true,
          isActive: true
        }
      ],
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers or updates a banner record in the configuration.
   */
  public static registerBanner(config: BannerConfigDTO, banner: BannerRecordDTO): BannerConfigDTO {
    if (!config || !banner || !banner.bannerId) {
      throw new Error('StorefrontNotificationBannerBridgeEngine: Config or banner is null');
    }

    const existingIdx = config.banners.findIndex(b => b.bannerId === banner.bannerId);
    const updatedBanners = existingIdx >= 0
      ? config.banners.map((b, idx) => (idx === existingIdx ? banner : b))
      : [...config.banners, banner];

    return {
      ...config,
      banners: updatedBanners,
      lastUpdated: Date.now()
    };
  }

  /**
   * Retrieves active, non-dismissed banners.
   */
  public static getActiveBanners(config: BannerConfigDTO): ReadonlyArray<BannerRecordDTO> {
    if (!config) return [];
    return config.banners.filter(b => b.isActive);
  }

  /**
   * Marks a banner as inactive/dismissed.
   */
  public static dismissBanner(config: BannerConfigDTO, bannerId: string): BannerConfigDTO {
    if (!config || !bannerId) throw new Error('StorefrontNotificationBannerBridgeEngine: Config or bannerId is null');

    const updatedBanners = config.banners.map(b => (b.bannerId === bannerId ? { ...b, isActive: false } : b));

    return {
      ...config,
      banners: updatedBanners,
      lastUpdated: Date.now()
    };
  }

  /**
   * Serializes banner config to JSON string.
   */
  public static serializeBannerConfig(config: BannerConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores banner config from JSON string.
   */
  public static restoreBannerConfig(json: string): BannerConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid banner JSON structure');
      }
      return parsed as BannerConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore banner config: ${err.message}`);
    }
  }
}
