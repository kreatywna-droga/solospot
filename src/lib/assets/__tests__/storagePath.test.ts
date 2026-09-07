import { describe, it, expect } from 'vitest';
import {
  buildStoragePath,
  sanitizeFilename,
  storagePathOwnedByTenant,
  storagePathOwnedByStore,
  formatDirectUploadError,
  STORE_ASSETS_BUCKET,
} from '../storagePath';

describe('storagePath (browser <-> server storage contract)', () => {
  it('Exports the stable store-assets bucket constant', () => {
    expect(STORE_ASSETS_BUCKET).toBe('store-assets');
  });

  it('buildStoragePath prefixes tenantId and storeId folders', () => {
    expect(buildStoragePath('tenant-1', 'store-1', 'hero.png')).toBe('tenant-1/store-1/hero.png');
  });

  it('sanitizeFilename strips unsafe characters', () => {
    expect(sanitizeFilename('../us er?.png')).toBe('.._us_er_.png');
    expect(sanitizeFilename('a b?c#d>e.png')).toBe('a_b_c_d_e.png');
  });

  it('buildStoragePath sanitizes the filename segment', () => {
    const p = buildStoragePath('tenant-1', 'store-1', 'my file?.png');
    expect(p).toBe('tenant-1/store-1/my_file_.png');
  });

  it('storagePathOwnedByTenant accepts own tenant prefix only', () => {
    expect(storagePathOwnedByTenant('tenant-1/store-1/a.png', 'tenant-1')).toBe(true);
    expect(storagePathOwnedByTenant('tenant-2/store-1/a.png', 'tenant-1')).toBe(false);
    expect(storagePathOwnedByTenant('tenant-12/store-1/a.png', 'tenant-1')).toBe(false);
  });

  it('storagePathOwnedByStore requires tenant AND store prefix (cross-tenant + cross-store rejected)', () => {
    expect(storagePathOwnedByStore('tenant-1/store-1/a.png', 'tenant-1', 'store-1')).toBe(true);
    expect(storagePathOwnedByStore('tenant-2/store-1/a.png', 'tenant-1', 'store-1')).toBe(false);
    expect(storagePathOwnedByStore('tenant-1/store-2/a.png', 'tenant-1', 'store-1')).toBe(false);
    expect(storagePathOwnedByStore('tenant-1/store-12/a.png', 'tenant-1', 'store-1')).toBe(false);
  });

  it('formatDirectUploadError maps RLS errors to an actionable UX message (no SQL/migration hint)', () => {
    const msg = formatDirectUploadError({ message: 'new row violates row-level security policy' });
    expect(msg).toBe('Brak uprawnień do zapisania pliku. Sprawdź sesję i uprawnienia sklepu.');
    expect(msg).not.toContain('RLS');
    expect(msg).not.toContain('0018_assets_storage_rls.sql');
    expect(msg).not.toContain('polit');
  });

  it('formatDirectUploadError passes through unknown messages', () => {
    expect(formatDirectUploadError({ message: 'something else' })).toBe('something else');
  });
});