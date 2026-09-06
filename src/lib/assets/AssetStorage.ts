import { getServiceSupabase, isSupabaseConfigured, isSupabaseServiceConfigured } from '../supabase';
import fs from 'node:fs';
import path from 'node:path';

export interface StorageUploadResult {
  storagePath: string;
  publicUrl: string;
  size: number;
}

export interface IAssetStorageProvider {
  upload(
    buffer: Uint8Array,
    storagePath: string,
    mimeType: string
  ): Promise<StorageUploadResult>;

  delete(storagePath: string): Promise<void>;

  getPublicUrl(storagePath: string): Promise<string>;
}

export function formatStorageError(error: any, bucket = 'assets', storagePath = '', operation = 'upload'): string {
  if (!error) return `Supabase storage ${operation} failed: Nieznany błąd (bucket: '${bucket}', path: '${storagePath}')`;

  const rawMsg = typeof error.message === 'string' ? error.message.trim() : '';
  const rawCode = (error as any).statusCode || (error as any).status;
  const rawError = (error as any).error;
  const name = error.name || 'StorageError';

  // Extract meaningful message, never accepting literal "<none>" or empty string
  let meaningfulReason = '';
  if (rawMsg && rawMsg !== '<none>') {
    meaningfulReason = rawMsg;
  } else if (rawError && typeof rawError === 'string' && rawError.trim() !== '<none>') {
    meaningfulReason = rawError.trim();
  } else if (rawCode) {
    if (String(rawCode) === '401' || String(rawCode) === '403') {
      meaningfulReason = 'Brak autoryzacji Supabase Storage — zweryfikuj klucz SUPABASE_SERVICE_ROLE_KEY';
    } else if (String(rawCode) === '404') {
      meaningfulReason = `Bucket '${bucket}' nie istnieje w projekcie Supabase`;
    } else {
      meaningfulReason = `Błąd HTTP ${rawCode}`;
    }
  } else {
    meaningfulReason = name || 'Błąd operacji storage';
  }

  const parts = [
    `SupabaseAssetStorage ${operation} failed: ${meaningfulReason}`,
    `[bucket: '${bucket}'`,
    rawCode ? `status: ${rawCode}` : null,
    rawError && rawError !== meaningfulReason ? `error: ${rawError}` : null,
    `path: '${storagePath}']`,
  ].filter(Boolean);

  return parts.join(', ');
}

export class SupabaseAssetStorage implements IAssetStorageProvider {
  private readonly bucket = 'store-assets';
  private bucketChecked = false;

  private async ensureBucket(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const supabase = getServiceSupabase();
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.warn('[SupabaseAssetStorage] listBuckets warning:', listError.message);
      }
      const exists = buckets?.some((b: any) => b.name === this.bucket);
      if (!exists && !listError) {
        const { error: createError } = await supabase.storage.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024,
        });
        if (createError) {
          console.warn('[SupabaseAssetStorage] createBucket warning:', createError.message);
        }
      }
      this.bucketChecked = true;
    } catch (err: any) {
      console.warn('[SupabaseAssetStorage] ensureBucket caught exception:', err?.message);
      this.bucketChecked = true;
    }
  }

  async upload(
    buffer: Uint8Array,
    storagePath: string,
    mimeType: string
  ): Promise<StorageUploadResult> {
    await this.ensureBucket();
    const supabase = getServiceSupabase();

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(formatStorageError(error, this.bucket, storagePath, 'upload'));
    }

    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: data.publicUrl,
      size: buffer.length,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const supabase = getServiceSupabase();
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      throw new Error(`SupabaseAssetStorage delete failed: ${error.message}`);
    }
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    const supabase = getServiceSupabase();
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }
}

export class LocalPersistentAssetStorage implements IAssetStorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(process.cwd(), 'public', 'uploads');
  }

  async upload(
    buffer: Uint8Array,
    storagePath: string,
    _mimeType: string
  ): Promise<StorageUploadResult> {
    const fullPath = path.join(this.baseDir, storagePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);

    // Normalize forward slashes for URL
    const urlPath = storagePath.replace(/\\/g, '/');
    const publicUrl = `/uploads/${urlPath}`;

    return {
      storagePath,
      publicUrl,
      size: buffer.length,
    };
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async getPublicUrl(storagePath: string): Promise<string> {
    const urlPath = storagePath.replace(/\\/g, '/');
    return `/uploads/${urlPath}`;
  }
}

let activeStorage: IAssetStorageProvider | null = null;

export function getAssetStorage(): IAssetStorageProvider {
  if (activeStorage) return activeStorage;
  if (isSupabaseServiceConfigured()) {
    activeStorage = new SupabaseAssetStorage();
  } else {
    activeStorage = new LocalPersistentAssetStorage();
  }
  return activeStorage;
}

export function setAssetStorageForTesting(storage: IAssetStorageProvider | null): void {
  activeStorage = storage;
}
