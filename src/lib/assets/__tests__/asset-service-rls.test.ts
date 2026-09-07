import { describe, it, expect, vi } from 'vitest';
import { AssetService } from '../AssetService';
import { buildStoragePath } from '../storagePath';

function createFakeStorage() {
  return {
    upload: vi.fn(async (_buffer: Uint8Array, storagePath: string) => ({
      storagePath,
      publicUrl: `https://test.supabase.co/storage/v1/object/public/store-assets/${storagePath}`,
      size: 1024,
    })),
    delete: vi.fn(async () => undefined),
    getPublicUrl: vi.fn(async (storagePath: string) => `https://test.supabase.co/${storagePath}`),
  };
}

function createFakeRepo() {
  return {
    createAsset: vi.fn(async (input: any) => ({
      id: 'asset-1',
      tenantId: input.tenantId,
      storeId: input.storeId,
      filename: input.filename,
      originalName: input.originalName || input.filename,
      mimeType: input.mimeType,
      size: input.size,
      storagePath: input.storagePath,
      publicUrl: input.publicUrl,
      type: input.type,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    getAsset: vi.fn(async () => null),
    listAssets: vi.fn(async () => []),
    deleteAsset: vi.fn(async () => true),
    updateAsset: vi.fn(async () => null),
  };
}

const VALID_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

describe('AssetService RLS/authorization contract', () => {
  it('createAssetRecord rejects storage paths outside the tenant folder (cross-tenant)', async () => {
    const repo = createFakeRepo();
    const service = new AssetService(repo as any, createFakeStorage() as any, {} as any);

    await expect(
      service.createAssetRecord('tenant-1', 'store-1', {
        filename: 'a.png',
        originalName: 'a.png',
        mimeType: 'image/png',
        size: 100,
        storagePath: 'other-tenant/store-1/a.png',
        publicUrl: 'https://x',
        type: 'image',
      })
    ).rejects.toThrow(/Nieautoryzowana ścieżka storage/);
    expect(repo.createAsset).not.toHaveBeenCalled();
  });

  it('createAssetRecord rejects storage paths crossing store boundaries', async () => {
    const repo = createFakeRepo();
    const service = new AssetService(repo as any, createFakeStorage() as any, {} as any);

    await expect(
      service.createAssetRecord('tenant-1', 'store-1', {
        filename: 'a.png',
        originalName: 'a.png',
        mimeType: 'image/png',
        size: 100,
        storagePath: 'tenant-1/other-store/a.png',
        publicUrl: 'https://x',
        type: 'image',
      })
    ).rejects.toThrow(/Nieautoryzowana ścieżka storage/);
  });

  it('createAssetRecord accepts a tenant-and-store owned storage path', async () => {
    const repo = createFakeRepo();
    const service = new AssetService(repo as any, createFakeStorage() as any, {} as any);

    const record = await service.createAssetRecord('tenant-1', 'store-1', {
      filename: 'a.png',
      originalName: 'a.png',
      mimeType: 'image/png',
      size: 100,
      storagePath: 'tenant-1/store-1/a.png',
      publicUrl: 'https://x',
      type: 'image',
    });

    expect(record.storagePath).toBe('tenant-1/store-1/a.png');
    expect(repo.createAsset).toHaveBeenCalledTimes(1);
  });

  it('uploadAsset writes object under the tenant+store path contract', async () => {
    const storage = createFakeStorage();
    const repo = createFakeRepo();
    const service = new AssetService(repo as any, storage as any, {} as any);

    await service.uploadAsset('tenant-1', 'store-1', {
      name: 'hero.png',
      size: VALID_PNG.length,
      type: 'image/png',
      buffer: VALID_PNG,
    });

    const uploadArg = storage.upload.mock.calls[0][1] as string;
    expect(uploadArg).toMatch(/^tenant-1\/store-1\/[0-9a-f-]{36}-hero\.png$/);
    expect(uploadArg).toBe(buildStoragePath('tenant-1', 'store-1', uploadArg.split('/').pop()!));
  });
});