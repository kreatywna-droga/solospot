/**
 * StorefrontPerformanceOptimizationEngine.ts — Sprint G1-105 Runtime Performance Optimization Engine (Night Shift Level 67)
 *
 * Provides pure TypeScript, headless storefront render payload size optimization, asset loading strategy generation,
 * cache metadata header resolution, and route-level bundle size analysis.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ResourcePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AssetLoadingHintDTO {
  readonly assetUrl: string;
  readonly resourceType: 'SCRIPT' | 'STYLE' | 'FONT' | 'IMAGE';
  readonly priority: ResourcePriority;
  readonly isCriticalPath: boolean;
}

export interface RenderPayloadOptimizationResultDTO {
  readonly rawSizeBytes: number;
  readonly optimizedSizeBytes: number;
  readonly reductionRatioPercent: number;
  readonly strippedNullFieldsCount: number;
  readonly optimizedPayloadJson: string;
}

export interface RouteOptimizationReportDTO {
  readonly tenantId: string;
  readonly routePath: string;
  readonly estimatedBundleSizeBytes: number;
  readonly isBundleOverThreshold: boolean;
  readonly assetPreloadHints: ReadonlyArray<AssetLoadingHintDTO>;
  readonly recommendedCacheHeader: string;
  readonly generatedAtMs: number;
}

export interface PerformanceEngineStateDTO {
  readonly tenantId: string;
  readonly maxBundleSizeThresholdBytes: number;
  readonly reports: Record<string, RouteOptimizationReportDTO>; // routePath -> report
}

export class StorefrontPerformanceOptimizationEngine {
  private readonly tenantId: string;
  private readonly maxBundleSizeThresholdBytes: number;
  private reports: Map<string, RouteOptimizationReportDTO> = new Map();

  constructor(tenantId = 'default_tenant', maxBundleSizeThresholdBytes = 250 * 1024) { // 250 KB
    this.tenantId = tenantId;
    this.maxBundleSizeThresholdBytes = maxBundleSizeThresholdBytes;
  }

  /**
   * Strips redundant white space and empty/null fields from a JSON render payload.
   */
  public optimizeRenderPayload(rawJsonString: string): RenderPayloadOptimizationResultDTO {
    if (!rawJsonString || rawJsonString.trim().length === 0) {
      throw new Error('rawJsonString cannot be empty');
    }

    const rawSizeBytes = Buffer.byteLength(rawJsonString, 'utf-8');

    let parsed: any;
    try {
      parsed = JSON.parse(rawJsonString);
    } catch (err: any) {
      throw new Error(`Invalid JSON payload for optimization: ${err.message}`);
    }

    let strippedNullFieldsCount = 0;

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj !== null && typeof obj === 'object') {
        const clean: Record<string, any> = {};
        for (const [key, val] of Object.entries(obj)) {
          if (val === null || val === undefined) {
            strippedNullFieldsCount++;
            continue;
          }
          clean[key] = sanitizeObject(val);
        }
        return clean;
      }
      return obj;
    };

    const cleanObject = sanitizeObject(parsed);
    const optimizedPayloadJson = JSON.stringify(cleanObject);
    const optimizedSizeBytes = Buffer.byteLength(optimizedPayloadJson, 'utf-8');

    const reductionRatioPercent = rawSizeBytes > 0
      ? Math.round((1 - optimizedSizeBytes / rawSizeBytes) * 100 * 100) / 100
      : 0;

    return {
      rawSizeBytes,
      optimizedSizeBytes,
      reductionRatioPercent,
      strippedNullFieldsCount,
      optimizedPayloadJson
    };
  }

  /**
   * Generates a performance optimization report for a specific storefront route.
   */
  public analyzeRoutePerformance(
    routePath: string,
    assets: ReadonlyArray<{ url: string; type: 'SCRIPT' | 'STYLE' | 'FONT' | 'IMAGE'; sizeBytes: number; isCritical?: boolean }>
  ): RouteOptimizationReportDTO {
    if (!routePath) {
      throw new Error('routePath is required to analyze route performance');
    }

    const now = Date.now();
    const totalBundleSize = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
    const isBundleOverThreshold = totalBundleSize > this.maxBundleSizeThresholdBytes;

    const assetPreloadHints: AssetLoadingHintDTO[] = assets.map(asset => {
      const isCriticalPath = asset.isCritical ?? (asset.type === 'FONT' || asset.type === 'STYLE');
      const priority: ResourcePriority = isCriticalPath ? 'HIGH' : asset.type === 'SCRIPT' ? 'MEDIUM' : 'LOW';

      return {
        assetUrl: asset.url,
        resourceType: asset.type,
        priority,
        isCriticalPath
      };
    });

    const recommendedCacheHeader = routePath.startsWith('/api/')
      ? 'no-store, no-cache, must-revalidate'
      : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

    const report: RouteOptimizationReportDTO = {
      tenantId: this.tenantId,
      routePath: routePath.trim(),
      estimatedBundleSizeBytes: totalBundleSize,
      isBundleOverThreshold,
      assetPreloadHints,
      recommendedCacheHeader,
      generatedAtMs: now
    };

    this.reports.set(routePath.trim(), report);
    return report;
  }

  public getReport(routePath: string): RouteOptimizationReportDTO | undefined {
    return this.reports.get(routePath);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): PerformanceEngineStateDTO {
    const record: Record<string, RouteOptimizationReportDTO> = {};
    this.reports.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      maxBundleSizeThresholdBytes: this.maxBundleSizeThresholdBytes,
      reports: record
    };
  }

  public importState(state: PerformanceEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.reports.clear();
    Object.entries(state.reports || {}).forEach(([k, v]) => {
      this.reports.set(k, v);
    });
  }
}
