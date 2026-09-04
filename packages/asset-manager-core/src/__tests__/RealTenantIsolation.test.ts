import { describe, it, expect, beforeEach } from 'vitest';
import { AssetService } from '../../../../src/lib/assets/AssetService';
import { AssetRepository, clearInMemoryAssets } from '../../../../src/lib/assets/AssetRepository';
import type { IAssetStorageProvider, StorageUploadResult } from '../../../../src/lib/assets/AssetStorage';

class IsolatedStorage implements IAssetStorageProvider {
  public store: Map<string, Uint8Array> = new Map();

  async upload(buffer: Uint8Array, storagePath: string): Promise<StorageUploadResult> {
    this.store.set(storagePath, buffer);
    return {
      storagePath,
      publicUrl: `https://cdn.solospot.pl/${storagePath}`,
      size: buffer.length,
    };
  }

  async delete(storagePath: string): Promise<void> {
    this.store.delete(storagePath);
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    return `https://cdn.solospot.pl/${storagePath}`;
  }
}

describe('Stage 9 — Cryptographic and Data-level Tenant Isolation', () => {
  let service: AssetService;
  let storage: IsolatedStorage;

  beforeEach(() => {
    clearInMemoryAssets();
    storage = new IsolatedStorage();
    service = new AssetService(new AssetRepository(), storage);
  });

  it('guarantees Tenant A and Tenant B total isolation across upload, read, list, and delete', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // 1. Tenant A uploads private asset
    const assetA = await service.uploadAsset('tenant-A', 'store-A', {
      name: 'tenantA-doc.png',
      size: png.length,
      type: 'image/png',
      buffer: png,
    });

    // Verify storage key is prefixed with Tenant A namespace
    expect(assetA.storagePath.startsWith('tenant-A/store-A/')).toBe(true);
    expect(storage.store.has(assetA.storagePath)).toBe(true);

    // 2. Tenant B lists assets -> Must be empty
    const tenantBList = await service.listAssets('tenant-B', 'store-B');
    expect(tenantBList.length).toBe(0);
    expect(tenantBList.some(x => x.id === assetA.id)).toBe(false);

    // 3. Tenant B tries direct read of Tenant A asset -> Denied / null
    const tenantBTryRead = await service.getAsset('tenant-B', 'store-B', assetA.id);
    expect(tenantBTryRead).toBeNull();

    // 4. Tenant B tries to delete Tenant A asset -> Denied
    const tenantBTryDelete = await service.deleteAsset('tenant-B', 'store-B', assetA.id);
    expect(tenantBTryDelete.success).toBe(false);

    // Tenant A's storage remains intact
    expect(storage.store.has(assetA.storagePath)).toBe(true);

    // 5. Tenant A reads own asset -> Success
    const tenantARead = await service.getAsset('tenant-A', 'store-A', assetA.id);
    expect(tenantARead).not.toBeNull();
    expect(tenantARead?.id).toBe(assetA.id);
    expect(tenantARead?.originalName).toBe('tenantA-doc.png');
  });
});
