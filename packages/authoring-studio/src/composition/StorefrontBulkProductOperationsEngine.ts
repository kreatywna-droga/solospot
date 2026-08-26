/**
 * StorefrontBulkProductOperationsEngine.ts — Sprint G1-99 Bulk Product Catalog Operations Engine (Night Shift Level 61)
 *
 * Provides pure TypeScript, headless bulk product operations for large-scale merchant catalog management.
 * Supports bulk activation, archiving, price adjustments (percentage or fixed delta), category reassignments,
 * and bulk inventory adjustments.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type BulkActionType =
  | 'BULK_ACTIVATE'
  | 'BULK_ARCHIVE'
  | 'BULK_PRICE_PERCENT_CHANGE'
  | 'BULK_PRICE_FIXED_DELTA'
  | 'BULK_CATEGORY_ASSIGNMENT'
  | 'BULK_INVENTORY_ADJUSTMENT';

export interface CatalogItemDTO {
  readonly sku: string;
  readonly title: string;
  readonly price: number;
  readonly category: string;
  readonly inventoryCount: number;
  readonly status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  readonly updatedAtMs: number;
}

export interface BulkOperationRequestDTO {
  readonly action: BulkActionType;
  readonly targetSkus: ReadonlyArray<string>;
  readonly priceAdjustmentPercent?: number; // e.g. 10 for +10%, -15 for -15%
  readonly priceAdjustmentFixedDelta?: number; // e.g. +5.00, -2.50
  readonly targetCategory?: string;
  readonly inventoryDelta?: number; // e.g. +50, -10
}

export interface BulkOperationFailureDTO {
  readonly sku: string;
  readonly reason: string;
}

export interface BulkOperationResultDTO {
  readonly tenantId: string;
  readonly action: BulkActionType;
  readonly totalTargeted: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly updatedSkus: ReadonlyArray<string>;
  readonly failures: ReadonlyArray<BulkOperationFailureDTO>;
  readonly timestampMs: number;
}

export interface BulkProductOperationsEngineStateDTO {
  readonly tenantId: string;
  readonly catalog: Record<string, CatalogItemDTO>;
}

export class StorefrontBulkProductOperationsEngine {
  private readonly tenantId: string;
  private catalog: Map<string, CatalogItemDTO> = new Map(); // sku -> CatalogItemDTO

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers catalog items into the bulk operation engine memory.
   */
  public registerCatalogItems(items: ReadonlyArray<Partial<CatalogItemDTO> & { sku: string; title: string }>): void {
    const now = Date.now();
    for (const item of items) {
      const sku = item.sku.trim().toUpperCase();
      const catalogItem: CatalogItemDTO = {
        sku,
        title: item.title,
        price: item.price ?? 0,
        category: item.category ?? 'Uncategorized',
        inventoryCount: item.inventoryCount ?? 0,
        status: item.status ?? 'ACTIVE',
        updatedAtMs: now
      };
      this.catalog.set(sku, catalogItem);
    }
  }

  /**
   * Executes a bulk operational task across target SKUs.
   */
  public executeBulkOperation(request: BulkOperationRequestDTO): BulkOperationResultDTO {
    const { action, targetSkus } = request;
    if (!action || !Array.isArray(targetSkus) || targetSkus.length === 0) {
      throw new Error('Invalid bulk operation parameters: action and targetSkus are required');
    }

    const updatedSkus: string[] = [];
    const failures: BulkOperationFailureDTO[] = [];
    const now = Date.now();

    for (const rawSku of targetSkus) {
      const sku = rawSku.trim().toUpperCase();
      const existing = this.catalog.get(sku);

      if (!existing) {
        failures.push({ sku, reason: `SKU ${sku} not found in merchant catalog` });
        continue;
      }

      let updatedItem: CatalogItemDTO = { ...existing, updatedAtMs: now };

      switch (action) {
        case 'BULK_ACTIVATE':
          updatedItem = { ...updatedItem, status: 'ACTIVE' };
          break;

        case 'BULK_ARCHIVE':
          updatedItem = { ...updatedItem, status: 'ARCHIVED' };
          break;

        case 'BULK_PRICE_PERCENT_CHANGE':
          if (request.priceAdjustmentPercent === undefined) {
            failures.push({ sku, reason: 'priceAdjustmentPercent parameter is required for percentage updates' });
            continue;
          }
          const factor = 1 + request.priceAdjustmentPercent / 100;
          const newPricePct = Math.max(0, Math.round(existing.price * factor * 100) / 100);
          updatedItem = { ...updatedItem, price: newPricePct };
          break;

        case 'BULK_PRICE_FIXED_DELTA':
          if (request.priceAdjustmentFixedDelta === undefined) {
            failures.push({ sku, reason: 'priceAdjustmentFixedDelta parameter is required for fixed delta updates' });
            continue;
          }
          const newPriceFixed = Math.max(0, Math.round((existing.price + request.priceAdjustmentFixedDelta) * 100) / 100);
          updatedItem = { ...updatedItem, price: newPriceFixed };
          break;

        case 'BULK_CATEGORY_ASSIGNMENT':
          if (!request.targetCategory) {
            failures.push({ sku, reason: 'targetCategory parameter is required for category assignment' });
            continue;
          }
          updatedItem = { ...updatedItem, category: request.targetCategory.trim() };
          break;

        case 'BULK_INVENTORY_ADJUSTMENT':
          if (request.inventoryDelta === undefined) {
            failures.push({ sku, reason: 'inventoryDelta parameter is required for inventory adjustments' });
            continue;
          }
          const newStock = Math.max(0, existing.inventoryCount + request.inventoryDelta);
          updatedItem = { ...updatedItem, inventoryCount: newStock };
          break;

        default:
          failures.push({ sku, reason: `Unsupported bulk action: ${action}` });
          continue;
      }

      this.catalog.set(sku, updatedItem);
      updatedSkus.push(sku);
    }

    return {
      tenantId: this.tenantId,
      action,
      totalTargeted: targetSkus.length,
      successCount: updatedSkus.length,
      failureCount: failures.length,
      updatedSkus,
      failures,
      timestampMs: now
    };
  }

  public getCatalogItem(sku: string): CatalogItemDTO | undefined {
    return this.catalog.get(sku.trim().toUpperCase());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): BulkProductOperationsEngineStateDTO {
    const record: Record<string, CatalogItemDTO> = {};
    this.catalog.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      catalog: record
    };
  }

  public importState(state: BulkProductOperationsEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.catalog.clear();
    Object.entries(state.catalog || {}).forEach(([k, v]) => {
      this.catalog.set(k, v);
    });
  }
}
