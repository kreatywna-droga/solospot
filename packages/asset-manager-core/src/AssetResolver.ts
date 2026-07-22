// AssetResolver.ts
import { AssetType } from './AssetTypes';
import { AssetReference } from './AssetReference';
import { AssetStorage } from './AssetStorage';
import { AssetLibrary } from './AssetLibrary';

/**
 * AssetResolver is the critical component that turns AssetReferences
 * into actual usable URLs. This is where the indirection pays off:
 * 
 * Instead of storing "https://cdn.example.com/images/logo-v1.png" everywhere,
 * we store { id: "logo-123", type: "image" } and resolve it when needed.
 * 
 * This allows us to:
 * - Change CDN providers without updating content
 * - Implement versioning/cache-busting strategies
 * - Serve different images based on user agent (WebP vs JPEG)
 * - Resize/crop images on-the-fly
 * - Switch storage backends (local -> S3 -> etc)
 */
export interface AssetResolver {
  /**
   * Resolve an AssetReference to a public URL
   * @param reference What asset we want
   * @param options Transformation options (resize, format, etc.)
   * @returns Publicly accessible URL for the asset
   */
  resolve(reference: AssetReference, options?: {
    width?: number;
    height?: number;
    quality?: number; // 0-100 for images
    format?: string; // 'webp', 'jpg', 'png', etc.
    // Allow for future extensions
    [key: string]: any;
  }): Promise<string>;

  /**
   * Resolve multiple assets at once (for batch operations)
   */
  resolveAll(references: AssetReference[], options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): Promise<string[]>;

  /**
   * Get the underlying storage for direct operations
   * (useful for uploads, deletions, etc.)
   */
  getStorage(): AssetStorage;

  /**
   * Get the library for metadata/query operations
   */
  getLibrary(): AssetLibrary;
}

/**
 * Basic implementation of AssetResolver that combines
 * a storage backend and library
 */
export class SimpleAssetResolver implements AssetResolver {
  constructor(
    private storage: AssetStorage,
    private library: AssetLibrary
  ) {}

  async resolve(reference: AssetReference, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): Promise<string> {
    // Get asset metadata to find storage key
    const asset = await this.library.getById(reference.id);
    if (!asset) {
      throw new Error(`Asset not found: ${reference.id}`);
    }

    // Verify type matches
    if (asset.type !== reference.type) {
      throw new Error(`Asset type mismatch: expected ${reference.type}, got ${asset.type}`);
    }

    // Delegate to storage for URL generation
    return this.storage.getUrl(asset.storageKey, options);
  }

  async resolveAll(references: AssetReference[], options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): Promise<string[]> {
    const promises = references.map(ref => this.resolve(ref, options));
    return Promise.all(promises);
  }

  getStorage(): AssetStorage {
    return this.storage;
  }

  getLibrary(): AssetLibrary {
    return this.library;
  }
}