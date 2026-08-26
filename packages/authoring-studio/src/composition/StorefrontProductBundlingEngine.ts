/**
 * StorefrontProductBundlingEngine.ts — Sprint G1-124 Product Bundling & Composite Kit Engine (Night Shift Level 86)
 *
 * Provides pure TypeScript, headless product bundle definition, component stock bottleneck calculation,
 * composite kit pricing, and bundle discount evaluation.
 *
 * External warehouse inventory component feeds remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface BundleComponentItemDTO {
  readonly productId: string;
  readonly quantityRequired: number;
  readonly unitBasePrice: number;
}

export interface ProductBundleDTO {
  readonly bundleId: string;
  readonly tenantId: string;
  readonly bundleName: string;
  readonly components: ReadonlyArray<BundleComponentItemDTO>;
  readonly bundleDiscountPercent: number; // e.g. 15 for 15% off total components
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface BundleStockEvaluationResultDTO {
  readonly bundleId: string;
  readonly maxPurchasableBundles: number;
  readonly bottleneckProductId?: string;
  readonly totalStandaloneComponentsPrice: number;
  readonly discountedBundlePrice: number;
}

export interface ProductBundlingEngineStateDTO {
  readonly tenantId: string;
  readonly bundles: Record<string, ProductBundleDTO>; // bundleId -> bundle
}

export class StorefrontProductBundlingEngine {
  private readonly tenantId: string;
  private bundles: Map<string, ProductBundleDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Defines or updates a composite product bundle kit.
   */
  public registerBundle(params: {
    bundleId: string;
    bundleName: string;
    components: ReadonlyArray<BundleComponentItemDTO>;
    bundleDiscountPercent?: number;
  }): ProductBundleDTO {
    const { bundleId, bundleName, components } = params;

    if (!bundleId || !bundleName || !components || components.length === 0) {
      throw new Error('bundleId, bundleName, and at least one component are required');
    }

    const now = Date.now();
    const dto: ProductBundleDTO = {
      bundleId: bundleId.trim(),
      tenantId: this.tenantId,
      bundleName: bundleName.trim(),
      components,
      bundleDiscountPercent: params.bundleDiscountPercent ?? 0,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.bundles.set(dto.bundleId, dto);
    return dto;
  }

  /**
   * Evaluates available purchasable bundle count based on individual component stock levels.
   */
  public evaluateBundleStockAndPricing(params: {
    bundleId: string;
    componentStockMap: Record<string, number>; // productId -> available stock
  }): BundleStockEvaluationResultDTO {
    const { bundleId, componentStockMap } = params;

    const bundle = this.bundles.get(bundleId.trim());
    if (!bundle) {
      throw new Error(`Product bundle ${bundleId} not found`);
    }

    let maxPurchasableBundles = Number.MAX_SAFE_INTEGER;
    let bottleneckProductId: string | undefined;
    let totalStandaloneComponentsPrice = 0;

    for (const comp of bundle.components) {
      totalStandaloneComponentsPrice += comp.unitBasePrice * comp.quantityRequired;
      const stock = componentStockMap[comp.productId] ?? 0;
      const possibleFromComponent = Math.floor(stock / comp.quantityRequired);

      if (possibleFromComponent < maxPurchasableBundles) {
        maxPurchasableBundles = possibleFromComponent;
        bottleneckProductId = comp.productId;
      }
    }

    if (maxPurchasableBundles === Number.MAX_SAFE_INTEGER) {
      maxPurchasableBundles = 0;
    }

    totalStandaloneComponentsPrice = Math.round(totalStandaloneComponentsPrice * 100) / 100;
    const discountedBundlePrice = Math.round(
      (totalStandaloneComponentsPrice * (1 - bundle.bundleDiscountPercent / 100)) * 100
    ) / 100;

    return {
      bundleId: bundle.bundleId,
      maxPurchasableBundles,
      bottleneckProductId,
      totalStandaloneComponentsPrice,
      discountedBundlePrice
    };
  }

  public getBundle(bundleId: string): ProductBundleDTO | undefined {
    return this.bundles.get(bundleId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ProductBundlingEngineStateDTO {
    const record: Record<string, ProductBundleDTO> = {};
    this.bundles.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      bundles: record
    };
  }

  public importState(state: ProductBundlingEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.bundles.clear();
    Object.entries(state.bundles || {}).forEach(([k, v]) => {
      this.bundles.set(k, v);
    });
  }
}
