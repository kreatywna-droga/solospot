// AssetStorage.ts
import { Asset } from './AssetTypes';

/**
 * AssetStorage abstracts the actual storage mechanism for asset binaries.
 * This allows us to switch between local storage, S3, Google Cloud Storage,
 * Azure Blob Storage, or custom CDNs without changing the asset management logic.
 */
export interface AssetStorage {
  /**
   * Upload asset binary data and return storage key/reference
   * @param file File data to upload
   * @param metadata Optional metadata (content type, etc.)
   * @returns Promise resolving to storage information
   */
  upload(
    file: File | Buffer | ReadableStream<Uint8Array>,
    metadata?: {
      contentType?: string;
      [key: string]: any;
    }
  ): Promise<{
    storageKey: string; // Key to use for storage/retrieval
    size: number; // File size in bytes
    checksum?: string; // Optional hash for integrity verification
  }>;

  /**
   * Download asset binary data by storage key
   * @param storageKey The key returned from upload()
   * @returns Promise resolving to the file data
   */
  download(storageKey: string): Promise<Uint8Array>;

  /**
   * Delete asset binary data
   * @param storageKey The key returned from upload()
   * @returns Promise resolving when deletion is complete
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Get public URL for asset (may be signed URL or public CDN URL)
   * This is where CDN integration happens - the storage implementation
   * knows how to generate the correct URL for its backend
   * @param storageKey The key returned from upload()
   * @param options Transformation options (resize, format, etc.)
   * @returns Promise resolving to publicly accessible URL
   */
  getUrl(storageKey: string, options?: {
    width?: number;
    height?: number;
    quality?: number; // 0-100 for images
    format?: string; // 'webp', 'jpg', 'png', etc.
    // For images: resize, crop, format conversion
    // For video: timestamp, quality, format
  }): Promise<string>;

  /**
   * Check if asset exists in storage
   * @param storageKey The key to check
   * @returns Promise resolving to true if file exists
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Get metadata about stored asset (size, etc.)
   * @param storageKey The key to query
   * @returns Promise resolving to file metadata
   */
  getMetadata(storageKey: string): Promise<{
    size: number;
    contentType?: string;
    lastModified?: string; // ISO timestamp
    // Storage-specific metadata
    [key: string]: any;
  }>;

  /**
   * Copy a file within the same storage bucket
   * @param sourceKey Source storage key
   * @param destinationKey Destination storage key
   * @returns Promise resolving when copy is complete
   */
  copy(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Move/rename a file within the same storage bucket
   * @param sourceKey Source storage key
   * @param destinationKey Destination storage key
   * @returns Promise resolving when move is complete
   */
  move(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Invalidate cache for a specific asset (CDN purge)
   * @param storageKey The key to invalidate
   * @returns Promise resolving when cache is invalidated
   */
  invalidateCache(storageKey: string): Promise<void>;

  /**
   * Create a versioned copy of an asset
   * @param storageKey The key to version
   * @param version Version identifier
   * @returns Promise resolving to new storage key
   */
  createVersion(storageKey: string, version: string): Promise<string>;
}

/**
 * Configuration for different storage implementations
 */
export interface StorageConfig {
  // Common options
  basePath?: string; // Prefix for all storage keys
  // Provider-specific options would go here in actual implementations
  // For example: region, bucketName, accessKey, etc. for S3
  [key: string]: any;
}

/**
 * Factory function for creating storage instances
 * In a real implementation, this would select the appropriate
 * storage driver based on configuration and environment variables
 */
export class StorageFactory {
  /**
   * Create a storage instance based on the provided type and config
   * @param type Storage type ('local', 's3', 'gcs', 'azure', 'r2', etc.)
   * @param config Configuration for the storage provider
   * @returns AssetStorage implementation
   */
  static async create(type: string, config: StorageConfig = {}): Promise<AssetStorage> {
    switch (type.toLowerCase()) {
      case 'local': {
        const module = await import('./providers/LocalAssetStorage');
        return new module.LocalAssetStorage(config);
      }
      case 'memory': {
        const module = await import('./providers/LocalAssetStorage');
        return new module.LocalAssetStorage({ ...config, basePath: 'mem:' });
      }
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}