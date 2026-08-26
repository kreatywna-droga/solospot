/**
 * StorefrontMerchantProductImportExportEngine.ts — Sprint G1-98 Merchant Product Import & Export Engine (Night Shift Level 60)
 *
 * Provides pure TypeScript, headless CSV and JSON product catalog import/export operations,
 * schema validation, SKU duplicate detection, batch error reporting, and export formatting.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface ImportProductRowDTO {
  readonly sku: string;
  readonly title: string;
  readonly description?: string;
  readonly price: number;
  readonly currency?: string;
  readonly category?: string;
  readonly stockQuantity?: number;
  readonly status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

export interface ImportErrorDTO {
  readonly rowNumber: number;
  readonly sku: string;
  readonly errorReason: string;
}

export interface ProductImportSummaryDTO {
  readonly tenantId: string;
  readonly totalRowsProcessed: number;
  readonly importedCount: number;
  readonly skippedDuplicatesCount: number;
  readonly errorCount: number;
  readonly errors: ReadonlyArray<ImportErrorDTO>;
  readonly timestampMs: number;
}

export interface MerchantImportExportEngineStateDTO {
  readonly tenantId: string;
  readonly catalog: Record<string, ImportProductRowDTO>; // SKU -> Product
}

export class StorefrontMerchantProductImportExportEngine {
  private readonly tenantId: string;
  private catalog: Map<string, ImportProductRowDTO> = new Map(); // sku -> Product

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Imports product records from a JSON array or object structure.
   */
  public importFromJson(
    records: ReadonlyArray<ImportProductRowDTO>,
    options?: { overwriteExisting?: boolean }
  ): ProductImportSummaryDTO {
    if (!Array.isArray(records)) {
      throw new Error('Import payload must be an array of product records');
    }

    const overwrite = options?.overwriteExisting ?? false;
    const errors: ImportErrorDTO[] = [];
    let importedCount = 0;
    let skippedDuplicatesCount = 0;

    records.forEach((row, idx) => {
      const rowNumber = idx + 1;
      if (!row.sku || row.sku.trim().length === 0) {
        errors.push({ rowNumber, sku: '', errorReason: 'Missing required SKU' });
        return;
      }
      if (!row.title || row.title.trim().length === 0) {
        errors.push({ rowNumber, sku: row.sku, errorReason: 'Missing required product title' });
        return;
      }
      if (typeof row.price !== 'number' || row.price < 0) {
        errors.push({ rowNumber, sku: row.sku, errorReason: 'Price must be a non-negative number' });
        return;
      }

      const normalizedSku = row.sku.trim().toUpperCase();
      const existing = this.catalog.has(normalizedSku);

      if (existing && !overwrite) {
        skippedDuplicatesCount++;
        return;
      }

      const normalizedProduct: ImportProductRowDTO = {
        sku: normalizedSku,
        title: row.title.trim(),
        description: row.description?.trim(),
        price: row.price,
        currency: (row.currency || 'USD').toUpperCase(),
        category: row.category?.trim() || 'General',
        stockQuantity: row.stockQuantity ?? 0,
        status: row.status || 'ACTIVE'
      };

      this.catalog.set(normalizedSku, normalizedProduct);
      importedCount++;
    });

    return {
      tenantId: this.tenantId,
      totalRowsProcessed: records.length,
      importedCount,
      skippedDuplicatesCount,
      errorCount: errors.length,
      errors,
      timestampMs: Date.now()
    };
  }

  /**
   * Imports product records from a raw CSV string payload.
   */
  public importFromCsv(csvContent: string, options?: { overwriteExisting?: boolean }): ProductImportSummaryDTO {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('CSV content cannot be empty');
    }

    const lines = csvContent.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      throw new Error('CSV content must include header line and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('sku');
    const titleIdx = headers.indexOf('title');
    const priceIdx = headers.indexOf('price');
    const descIdx = headers.indexOf('description');
    const catIdx = headers.indexOf('category');
    const stockIdx = headers.indexOf('stock');

    if (skuIdx === -1 || titleIdx === -1 || priceIdx === -1) {
      throw new Error('CSV header must contain at least "sku", "title", and "price" columns');
    }

    const records: ImportProductRowDTO[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      records.push({
        sku: parts[skuIdx] || '',
        title: parts[titleIdx] || '',
        price: parseFloat(parts[priceIdx]) || 0,
        description: descIdx !== -1 ? parts[descIdx] : undefined,
        category: catIdx !== -1 ? parts[catIdx] : undefined,
        stockQuantity: stockIdx !== -1 ? parseInt(parts[stockIdx], 10) || 0 : 0
      });
    }

    return this.importFromJson(records, options);
  }

  /**
   * Exports catalog to JSON array format.
   */
  public exportToJson(): ReadonlyArray<ImportProductRowDTO> {
    return Array.from(this.catalog.values());
  }

  /**
   * Exports catalog to CSV string format.
   */
  public exportToCsv(): string {
    const products = this.exportToJson();
    const headers = ['sku', 'title', 'price', 'currency', 'category', 'stock', 'status'];
    const rows = products.map(p =>
      [p.sku, `"${p.title}"`, p.price, p.currency, p.category, p.stockQuantity, p.status].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  public getProductBySku(sku: string): ImportProductRowDTO | undefined {
    return this.catalog.get(sku.trim().toUpperCase());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): MerchantImportExportEngineStateDTO {
    const record: Record<string, ImportProductRowDTO> = {};
    this.catalog.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      catalog: record
    };
  }

  public importState(state: MerchantImportExportEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.catalog.clear();
    Object.entries(state.catalog || {}).forEach(([k, v]) => {
      this.catalog.set(k, v);
    });
  }
}
