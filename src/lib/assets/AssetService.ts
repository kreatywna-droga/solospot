import { AssetValidator, type FileToValidate } from './AssetValidator';
import { getAssetStorage, type IAssetStorageProvider } from './AssetStorage';
import { AssetRepository } from './AssetRepository';
import { StoreRepository } from '../store/StoreRepository';
import type { AssetRecord, AssetFilterOptions, AssetMetadata } from './AssetTypes';

export class AssetService {
  private readonly repo: AssetRepository;
  private readonly storeRepo: StoreRepository;
  private readonly storage: IAssetStorageProvider;

  constructor(
    repo?: AssetRepository,
    storage?: IAssetStorageProvider,
    storeRepo?: StoreRepository
  ) {
    this.repo = repo || new AssetRepository();
    this.storage = storage || getAssetStorage();
    this.storeRepo = storeRepo || new StoreRepository();
  }

  async uploadAsset(
    tenantId: string,
    storeId: string,
    file: FileToValidate,
    customMetadata?: AssetMetadata
  ): Promise<AssetRecord> {
    if (!tenantId) throw new Error('Brak identyfikatora tenanta (Tenant ID required).');
    if (!storeId) throw new Error('Brak identyfikatora sklepu (Store ID required).');

    // 1. Validate file content, size and MIME
    const validation = AssetValidator.validate(file);
    if (!validation.valid || !validation.type || !validation.mimeType || !validation.sanitizedFilename) {
      throw new Error(`Walidacja pliku nie powiodła się: ${validation.error || 'Nieznany błąd'}`);
    }

    const assetId = crypto.randomUUID();
    const filename = `${assetId}-${validation.sanitizedFilename}`;
    const storagePath = `${tenantId}/${storeId}/${filename}`;

    // 2. Upload to storage provider
    const uploadResult = await this.storage.upload(
      file.buffer,
      storagePath,
      validation.mimeType
    );

    // 3. Persist metadata in repository
    const record = await this.repo.createAsset({
      tenantId,
      storeId,
      filename,
      originalName: validation.sanitizedFilename,
      mimeType: validation.mimeType,
      size: uploadResult.size,
      storagePath: uploadResult.storagePath,
      publicUrl: uploadResult.publicUrl,
      type: validation.type,
      metadata: {
        ...(customMetadata || {}),
        sanitizedOriginalName: validation.sanitizedFilename,
      },
    });

    return record;
  }

  async listAssets(
    tenantId: string,
    storeId: string,
    options?: AssetFilterOptions
  ): Promise<AssetRecord[]> {
    if (!tenantId || !storeId) throw new Error('Tenant ID and Store ID required');
    return this.repo.listAssets(tenantId, storeId, options);
  }

  async getAsset(
    tenantId: string,
    storeId: string,
    assetId: string
  ): Promise<AssetRecord | null> {
    if (!tenantId || !storeId || !assetId) return null;
    return this.repo.getAsset(tenantId, storeId, assetId);
  }

  async deleteAsset(
    tenantId: string,
    storeId: string,
    assetId: string,
    force = false
  ): Promise<{ success: boolean; error?: string }> {
    const asset = await this.repo.getAsset(tenantId, storeId, assetId);
    if (!asset) {
      return { success: false, error: 'Asset nie został znaleziony' };
    }

    // Reference protection: check if store pages use this asset
    if (!force) {
      const store = await this.storeRepo.getStore(storeId, tenantId);
      if (store && store.config?.pages) {
        const pagesJson = JSON.stringify(store.config.pages);
        if (
          pagesJson.includes(asset.id) ||
          pagesJson.includes(asset.publicUrl) ||
          pagesJson.includes(asset.storagePath)
        ) {
          return {
            success: false,
            error: 'ASSET_IN_USE: Ten asset jest aktualnie używany na stronach sklepu. Użyj force=true, aby wymusić usunięcie.',
          };
        }
      }
    }

    // Delete from storage
    try {
      await this.storage.delete(asset.storagePath);
    } catch (err: any) {
      console.warn('[AssetService] Storage deletion warning:', err.message);
    }

    // Delete from DB
    await this.repo.deleteAsset(tenantId, storeId, assetId);
    return { success: true };
  }

  async replaceAsset(
    tenantId: string,
    storeId: string,
    assetId: string,
    newFile: FileToValidate
  ): Promise<AssetRecord> {
    const existing = await this.repo.getAsset(tenantId, storeId, assetId);
    if (!existing) {
      throw new Error('Asset nie istnieje');
    }

    const validation = AssetValidator.validate(newFile);
    if (!validation.valid || !validation.type || !validation.mimeType || !validation.sanitizedFilename) {
      throw new Error(`Walidacja nowego pliku nie powiodła się: ${validation.error}`);
    }

    // Overwrite storage
    const uploadResult = await this.storage.upload(
      newFile.buffer,
      existing.storagePath,
      validation.mimeType
    );

    const updated = await this.repo.updateAsset(tenantId, storeId, assetId, {
      originalName: validation.sanitizedFilename,
      size: uploadResult.size,
      publicUrl: uploadResult.publicUrl,
      metadata: {
        ...existing.metadata,
        replacedAt: new Date().toISOString(),
      },
    });

    if (!updated) {
      throw new Error('Nie udało się zaktualizować metadanych assetu');
    }

    return updated;
  }
}
