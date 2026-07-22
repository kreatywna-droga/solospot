// LocalAssetStorage.ts
import { AssetStorage, StorageConfig } from '../AssetStorage';
import { Asset } from '../AssetTypes';

/**
 * LocalAssetStorage is a reference implementation of AssetStorage that stores
 * assets in memory (for development/testing purposes).
 * 
 * In a production environment, this would be replaced with implementations
 * for S3, Google Cloud Storage, Azure Blob Storage, Cloudflare R2, etc.
 * 
 * Key characteristics:
 * - Stores assets in memory (not persistent across restarts)
 * - Generates mock URLs for development
 * - Supports basic file operations
 * - Thread-safe for single-process usage
 */
export class LocalAssetStorage implements AssetStorage {
  private storage: Map<string, {
    data: Uint8Array;
    size: number;
    contentType?: string;
    lastModified: string;
    metadata: Record<string, any>;
  }>;
  
  private basePath: string;

  constructor(config: StorageConfig = {}) {
    this.basePath = config.basePath || '';
    this.storage = new Map();
    
    // In a real implementation, this would initialize connection to
    // local filesystem, S3, etc.
  }

  async upload(
    file: File | Buffer | ReadableStream<Uint8Array>,
    metadata?: {
      contentType?: string;
      [key: string]: any;
    }
  ): Promise<{
    storageKey: string;
    size: number;
    checksum?: string;
  }> {
    // Convert file to buffer
    let buffer: Uint8Array;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      buffer = new Uint8Array(file);
    } else if (ReadableStream && typeof file.getReader === 'function') {
      // Convert readable stream to Uint8Array
      const chunks: Uint8Array[] = [];
      const reader = file.getReader();
      let result;
      while (!(result = await reader.read()).done) {
        chunks.push(result.value);
      }
      buffer = new Uint8Array(
        chunks.reduce((acc, chunk) => {
          const temp = new Uint8Array(acc.length + chunk.length);
          temp.set(acc, 0);
          temp.set(chunk, acc.length);
          return temp;
        }, new Uint8Array(0))
      );
    } else {
      throw new Error('Unsupported file type for upload');
    }

    // Generate storage key (timestamp + random for uniqueness)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    let extension = 'bin';
    
    if (metadata?.contentType) {
      extension = this.getExtensionFromMimeType(metadata.contentType);
    }
    
    // Create filename - use original name if provided, otherwise generate
    let filename: string;
    if (metadata?.fileName) {
      filename = metadata.fileName;
    } else {
      filename = `asset-${timestamp}-${random}.${extension}`;
    }
    const storageKey = `${this.basePath}${this.basePath ? '/' : ''}${filename}`;

    // Store the file data
    this.storage.set(storageKey, {
      data: buffer,
      size: buffer.length,
      contentType: metadata?.contentType,
      lastModified: new Date().toISOString(),
      metadata: metadata?.customMetadata || {}
    });

    return {
      storageKey,
      size: buffer.length
      // In a real implementation, we might calculate a checksum here
    };
  }

  async download(storageKey: string): Promise<Uint8Array> {
    const item = this.storage.get(storageKey);
    if (!item) {
      throw new Error(`Asset not found: ${storageKey}`);
    }
    return item.data;
  }

  async delete(storageKey: string): Promise<void> {
    if (!this.storage.has(storageKey)) {
      throw new Error(`Asset not found: ${storageKey}`);
    }
    this.storage.delete(storageKey);
  }

  async getUrl(storageKey: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    [key: string]: any;
  }): Promise<string> {
    const item = this.storage.get(storageKey);
    if (!item) {
      throw new Error(`Asset not found: ${storageKey}`);
    }

    // In a real implementation, this would generate a signed URL or 
    // return a CDN URL with transformation parameters
    // For local dev, we'll return a mock URL
    
    const baseUrl = 'http://localhost:3000/_assets';
    let url = `${baseUrl}/${encodeURIComponent(storageKey)}`;
    
    // Add transformation parameters as query string
    const params = new URLSearchParams();
    if (options?.width) params.set('w', String(options.width));
    if (options?.height) params.set('h', String(options.height));
    if (options?.quality) params.set('q', String(options.quality));
    if (options?.format) params.set('f', options.format);
    
    // Add any custom parameters
    for (const [key, value] of Object.entries(options || {})) {
      if (!['width', 'height', 'quality', 'format'].includes(key)) {
        params.set(key, String(value));
      }
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return url;
  }

  async exists(storageKey: string): Promise<boolean> {
    return this.storage.has(storageKey);
  }

  async getMetadata(storageKey: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: string;
    [key: string]: any;
  }> {
    const item = this.storage.get(storageKey);
    if (!item) {
      throw new Error(`Asset not found: ${storageKey}`);
    }
    
    return {
      size: item.size,
      contentType: item.contentType,
      lastModified: item.lastModified,
      ...item.metadata
    };
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const source = this.storage.get(sourceKey);
    if (!source) {
      throw new Error(`Source asset not found: ${sourceKey}`);
    }
    
    this.storage.set(destinationKey, {
      ...source,
      lastModified: new Date().toISOString()
    });
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    await this.copy(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/x-icon': 'ico',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/mp4': 'm4a',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/json': 'json',
      'application/xml': 'xml',
      'application/zip': 'zip',
      'application/octet-stream': 'bin'
    };
    
    return map[mimeType.toLowerCase()] || 'bin';
  }

  async invalidateCache(storageKey: string): Promise<void> {
    console.log(`[LocalAssetStorage] Cache invalidated for ${storageKey}`);
  }

  async createVersion(storageKey: string, version: string): Promise<string> {
    const versionedKey = `${storageKey}?v=${version}`;
    await this.copy(storageKey, versionedKey);
    return versionedKey;
  }
}