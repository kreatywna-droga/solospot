export const STORE_ASSETS_BUCKET = 'store-assets';

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 120);
}

export function buildStoragePath(tenantId: string, storeId: string, filename: string): string {
  return `${tenantId}/${storeId}/${sanitizeFilename(filename)}`;
}

export function storagePathOwnedByTenant(storagePath: string, tenantId: string): boolean {
  return storagePath.startsWith(`${tenantId}/`);
}

export function storagePathOwnedByStore(storagePath: string, tenantId: string, storeId: string): boolean {
  return storagePath.startsWith(`${tenantId}/${storeId}/`);
}

export function formatDirectUploadError(error: { message?: string }): string {
  const message = error?.message ?? 'Nieznany błąd'
  if (/row-level security|row level security|new row violates/i.test(message)) {
    return 'Odmowa zapisu do storage: brak uprawnień RLS (polityka bazy danych). Uruchom migrację 0018_assets_storage_rls.sql i zaloguj się ponownie.'
  }
  if (/invalid api key|unauthorized|authentication/i.test(message)) {
    return 'Brak autoryzacji. Zaloguj się ponownie.'
  }
  if (/bucket not found|storage bucket/i.test(message)) {
    return 'Bucket storage "store-assets" nie istnieje. Skontaktuj się z administratorem.'
  }
  if (/payload too large|413/i.test(message)) {
    return 'Plik przekracza dozwolony rozmiar w storage (50 MB).'
  }
  return message
}