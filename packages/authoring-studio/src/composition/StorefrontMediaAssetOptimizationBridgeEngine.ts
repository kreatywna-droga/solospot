/**
 * StorefrontMediaAssetOptimizationBridgeEngine.ts — Sprint G1-65 Storefront Media Asset Optimization Engine (Night Shift Level 27)
 *
 * Implements a pure TypeScript, headless image asset optimization, WebP/AVIF format pre-resolution, responsive srcset generation,
 * and CDN URL compilation engine for published WEB FACTOR websites and storefronts. Optimizes storefront image delivery, calculates
 * aspect ratio dimensions, and compiles standard responsive HTML image attributes (`srcset` and `sizes`) for fast Core Web Vitals.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type ImageFormat = 'webp' | 'avif' | 'png' | 'jpg';

export interface MediaAssetVariantDTO {
  readonly widthPx: number;
  readonly heightPx: number;
  readonly format: ImageFormat;
  readonly url: string;
  readonly fileSizeBytes: number;
}

export interface OptimizedMediaAssetDTO {
  readonly assetId: string;
  readonly originalUrl: string;
  readonly altText: string;
  readonly aspectRatio: number; // width / height
  readonly variants: ReadonlyArray<MediaAssetVariantDTO>;
  readonly srcset: string;
  readonly sizes: string;
}

export interface MediaOptimizationConfigDTO {
  readonly cdnBaseUrl: string;
  readonly defaultFormats: ReadonlyArray<ImageFormat>;
  readonly responsiveBreakpointsPx: ReadonlyArray<number>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontMediaAssetOptimizationBridgeEngine {
  /**
   * Creates a default media asset optimization configuration.
   */
  public static createDefaultOptimizationConfig(cdnBaseUrl = 'https://cdn.webfactor.io/assets'): MediaOptimizationConfigDTO {
    return {
      cdnBaseUrl,
      defaultFormats: ['webp', 'avif'],
      responsiveBreakpointsPx: [320, 640, 768, 1024, 1280, 1920],
      lastUpdated: Date.now()
    };
  }

  /**
   * Optimizes an image asset URL by pre-resolving WebP/AVIF variants and generating HTML srcset string.
   */
  public static optimizeImageSource(
    config: MediaOptimizationConfigDTO,
    assetId: string,
    originalUrl: string,
    altText: string,
    originalWidthPx = 1200,
    originalHeightPx = 800
  ): OptimizedMediaAssetDTO {
    if (!config || !assetId || !originalUrl) {
      throw new Error('StorefrontMediaAssetOptimizationBridgeEngine: Missing required arguments');
    }

    const aspectRatio = parseFloat((originalWidthPx / originalHeightPx).toFixed(2));
    const variants: MediaAssetVariantDTO[] = [];

    config.responsiveBreakpointsPx.forEach(widthPx => {
      if (widthPx <= originalWidthPx) {
        const heightPx = Math.round(widthPx / aspectRatio);
        config.defaultFormats.forEach(fmt => {
          const url = `${config.cdnBaseUrl}/${assetId}_${widthPx}x${heightPx}.${fmt}`;
          const fileSizeBytes = Math.round(widthPx * heightPx * 0.15); // Estimated WebP compression
          variants.push({ widthPx, heightPx, format: fmt, url, fileSizeBytes });
        });
      }
    });

    const webpVariants = variants.filter(v => v.format === 'webp');
    const srcset = webpVariants.map(v => `${v.url} ${v.widthPx}w`).join(', ');
    const sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px';

    return {
      assetId,
      originalUrl,
      altText: altText || assetId,
      aspectRatio,
      variants,
      srcset,
      sizes
    };
  }

  /**
   * Serializes media optimization config to JSON string.
   */
  public static serializeOptimizationConfig(config: MediaOptimizationConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores media optimization config from JSON string.
   */
  public static restoreOptimizationConfig(json: string): MediaOptimizationConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.cdnBaseUrl) {
        throw new Error('Invalid media config JSON structure');
      }
      return parsed as MediaOptimizationConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore media config: ${err.message}`);
    }
  }
}
