/**
 * StorefrontProductReviewRatingBridgeEngine.ts — Sprint G1-71 Storefront Product Reviews Engine (Night Shift Level 33)
 *
 * Implements a pure TypeScript, headless product reviews, star rating calculation, verified buyer badges, and review submission engine
 * for published WEB FACTOR storefronts. Handles review rating aggregations, average rating scores (1.0 to 5.0), and star distribution counts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface ProductReviewDTO {
  readonly reviewId: string;
  readonly productId: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly rating: number; // 1 to 5
  readonly headline: string;
  readonly commentText: string;
  readonly isVerifiedBuyer: boolean;
  readonly createdAt: number;
}

export interface RatingSummaryDTO {
  readonly productId: string;
  readonly averageRating: number;
  readonly totalReviewsCount: number;
  readonly starDistribution: {
    readonly 5: number;
    readonly 4: number;
    readonly 3: number;
    readonly 2: number;
    readonly 1: number;
  };
}

export interface ReviewCatalogConfigDTO {
  readonly siteId: string;
  readonly reviews: ReadonlyArray<ProductReviewDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontProductReviewRatingBridgeEngine {
  /**
   * Creates a default review catalog configuration.
   */
  public static createDefaultReviewConfig(siteId = 'default_storefront_site'): ReviewCatalogConfigDTO {
    return {
      siteId,
      reviews: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Submits a new product review and records it in the catalog.
   */
  public static submitReview(
    config: ReviewCatalogConfigDTO,
    productId: string,
    customerId: string,
    customerName: string,
    rating: number,
    headline: string,
    commentText: string,
    isVerifiedBuyer = true
  ): ReviewCatalogConfigDTO {
    if (!config || !productId || !customerId) {
      throw new Error('StorefrontProductReviewRatingBridgeEngine: Required parameters missing');
    }

    const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
    const newReview: ProductReviewDTO = {
      reviewId: `rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId,
      customerId,
      customerName: customerName.trim(),
      rating: clampedRating,
      headline: headline.trim(),
      commentText: commentText.trim(),
      isVerifiedBuyer,
      createdAt: Date.now()
    };

    return {
      ...config,
      reviews: [...config.reviews, newReview],
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculates average rating score and star distribution summary for a product.
   */
  public static getRatingSummary(config: ReviewCatalogConfigDTO, productId: string): RatingSummaryDTO {
    if (!config || !productId) {
      return { productId: productId || '', averageRating: 0, totalReviewsCount: 0, starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }

    const productReviews = config.reviews.filter(r => r.productId === productId);
    if (productReviews.length === 0) {
      return { productId, averageRating: 0, totalReviewsCount: 0, starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }

    let sum = 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(r => {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof typeof dist]++;
      }
    });

    const averageRating = parseFloat((sum / productReviews.length).toFixed(1));

    return {
      productId,
      averageRating,
      totalReviewsCount: productReviews.length,
      starDistribution: dist
    };
  }

  /**
   * Serializes review config to JSON string.
   */
  public static serializeReviewConfig(config: ReviewCatalogConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores review config from JSON string.
   */
  public static restoreReviewConfig(json: string): ReviewCatalogConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid review JSON structure');
      }
      return parsed as ReviewCatalogConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore review config: ${err.message}`);
    }
  }
}
