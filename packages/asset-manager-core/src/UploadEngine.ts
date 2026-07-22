// UploadEngine.ts
// C8.2: Media Manager — upload engine

import { AssetStorage } from './AssetStorage';
import { Asset, AssetType } from './AssetTypes';

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error' | 'cancelled';

export interface UploadJob {
  readonly id: string;
  readonly file: File;
  readonly folderId: string;
  readonly progress: number;
  readonly status: UploadStatus;
  readonly error?: string;
  readonly asset?: Asset;
}

export interface UploadOptions {
  readonly chunkSize?: number; // bytes, default 5MB
  readonly maxRetries?: number; // default 3
  readonly retryDelay?: number; // ms, default 1000
  readonly onProgress?: (jobId: string, progress: number) => void;
  readonly onComplete?: (jobId: string, asset: Asset) => void;
  readonly onError?: (jobId: string, error: string) => void;
}

export class UploadEngine {
  private readonly storage: AssetStorage;
  private readonly jobs: Map<string, UploadJob> = new Map();
  private readonly abortControllers: Map<string, AbortController> = new Map();
  private readonly options: Required<UploadOptions>;

  constructor(storage: AssetStorage, options: UploadOptions = {}) {
    this.storage = storage;
    this.options = {
      chunkSize: options.chunkSize ?? 5 * 1024 * 1024, // 5MB
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      onProgress: options.onProgress ?? (() => {}),
      onComplete: options.onComplete ?? (() => {}),
      onError: options.onError ?? (() => {}),
    };
  }

  async upload(job: UploadJob): Promise<Asset> {
    const existing = this.jobs.get(job.id);
    if (existing?.status === 'uploading') {
      throw new Error(`Upload ${job.id} is already in progress`);
    }

    const updatedJob: UploadJob = {
      ...job,
      status: 'uploading',
      progress: 0,
    };
    this.jobs.set(job.id, updatedJob);

    const controller = new AbortController();
    this.abortControllers.set(job.id, controller);

    try {
      const asset = await this.uploadWithRetry(job.id, job.file, job.folderId, controller.signal);
      this.jobs.set(job.id, { ...updatedJob, status: 'done', progress: 100, asset });
      this.options.onComplete(job.id, asset);
      return asset;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      this.jobs.set(job.id, { ...updatedJob, status: 'error', error: message });
      this.options.onError(job.id, message);
      throw error;
    } finally {
      this.abortControllers.delete(job.id);
    }
  }

  cancel(jobId: string): boolean {
    const controller = this.abortControllers.get(jobId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(jobId);
    }
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, status: 'cancelled' });
      return true;
    }
    return false;
  }

  getJob(jobId: string): UploadJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): readonly UploadJob[] {
    return Array.from(this.jobs.values());
  }

  private async uploadWithRetry(
    jobId: string,
    file: File,
    folderId: string,
    signal: AbortSignal
  ): Promise<Asset> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }

        return await this.uploadFile(jobId, file, folderId, signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed');
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }
        if (attempt < this.options.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        }
      }
    }

    throw lastError || new Error('Upload failed');
  }

  private async uploadFile(
    jobId: string,
    file: File,
    folderId: string,
    signal: AbortSignal
  ): Promise<Asset> {
    const totalSize = file.size;
    let uploadedSize = 0;

    if (totalSize <= this.options.chunkSize) {
      const asset = await this.storage.upload(file as File | Buffer | ReadableStream<Uint8Array>, {
        contentType: file.type,
      });
      this.options.onProgress(jobId, 100);
      return {
        id: crypto.randomUUID(),
        type: this.detectAssetType(file.type),
        name: file.name,
        metadata: {
          fileSize: totalSize,
          mimeType: file.type,
        },
        storageKey: asset.storageKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const chunks: Blob[] = [];
    let offset = 0;
    while (offset < totalSize) {
      const chunk = file.slice(offset, offset + this.options.chunkSize);
      chunks.push(chunk);
      offset += this.options.chunkSize;
    }

    let uploaded = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (signal.aborted) {
        throw new Error('Upload cancelled');
      }

      const chunk = chunks[i];
      await this.storage.upload(chunk as File | Buffer | ReadableStream<Uint8Array>, {
        contentType: file.type,
      });

      uploaded += (chunk as Blob).size;
      const progress = Math.round((uploaded / totalSize) * 100);
      this.options.onProgress(jobId, progress);
    }

    const finalAsset = await this.storage.upload(file, {
      contentType: file.type,
    });

    return {
      id: crypto.randomUUID(),
      type: this.detectAssetType(file.type),
      name: file.name,
      metadata: {
        fileSize: totalSize,
        mimeType: file.type,
      },
      storageKey: finalAsset.storageKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private detectAssetType(mimeType: string): AssetType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('font')) return 'font';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
    return 'other';
  }
}
