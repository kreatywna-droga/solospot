import { getServiceSupabase, isSupabaseConfigured } from '../supabase';
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

export class SupabaseAssetStorage implements IAssetStorageProvider {
  private readonly bucket = 'store-assets';
  private bucketChecked = false;

  private async ensureBucket(): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const supabase = getServiceSupabase();
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b: any) => b.name === this.bucket);
      if (!exists) {
        await supabase.storage.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024,
        });
      }
      this.bucketChecked = true;
    } catch {
      // Best-effort check; continue if bucket already exists or permissions permit
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
      throw new Error(`SupabaseAssetStorage upload failed: ${error.message}`);
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
  if (isSupabaseConfigured()) {
    activeStorage = new SupabaseAssetStorage();
  } else {
    activeStorage = new LocalPersistentAssetStorage();
  }
  return activeStorage;
}

export function setAssetStorageForTesting(storage: IAssetStorageProvider | null): void {
  activeStorage = storage;
}
