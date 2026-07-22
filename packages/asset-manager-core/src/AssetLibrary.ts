// AssetLibrary.ts
import { Asset, AssetType } from './AssetTypes';
import { AssetStorage } from './AssetStorage';

/**
 * AssetLibrary provides a collection-based interface for managing assets.
 * Simple implementation focused on core operations: upload, delete, list, search.
 */
export interface AssetLibrary {
  /**
   * Upload a new asset to the library
   * @param file File data to upload
   * @param metadata Optional metadata (name, type, etc.)
   * @returns Promise resolving to the created Asset
   */
  upload(file: File | Buffer | ReadableStream<Uint8Array>, metadata?: {
    name?: string;
    type?: AssetType;
    [key: string]: any;
  }): Promise<Asset>;

  /**
   * Delete an asset from the library by ID
   * @param id Asset ID to delete
   * @returns Promise resolving to true if deleted
   */
  delete(id: string): Promise<boolean>;

  /**
   * List assets with optional filtering
   * @param options Filter and pagination options
   * @returns Promise resolving to array of Assets
   */
  list(options?: {
    type?: AssetType;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]>;

  /**
   * Search assets by name or metadata
   * @param query Search term
   * @param options Search options
   * @returns Promise resolving to array of matching Assets
   */
  search(query: string, options?: {
    type?: AssetType;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]>;

  /**
   * Get asset by ID
   * @param id Asset ID
   * @returns Promise resolving to Asset or null if not found
   */
  getById(id: string): Promise<Asset | null>;

  /**
   * Get count of assets
   * @param options Filter options
   * @returns Promise resolving to count
   */
  count(options?: { type?: AssetType }): Promise<number>;
}

/**
 * Simple in-memory implementation for development/testing
 */
export class MemoryAssetLibrary implements AssetLibrary {
  protected assets: Map<string, Asset> = new Map();
  private storage: AssetStorage;

  constructor(storage: AssetStorage) {
    this.storage = storage;
  }

  async upload(file: File | Buffer | ReadableStream<Uint8Array>, metadata?: {
    name?: string;
    type?: AssetType;
    [key: string]: any;
  }): Promise<Asset> {
    // Upload to storage first
    const storageResult = await this.storage.upload(file, {
      contentType: metadata?.contentType
    });

    // Create asset record
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const asset: Asset = {
      id,
      type: metadata?.type || 'other', // Default to 'other' if not specified
      name: metadata?.name || 'unnamed',
      description: metadata?.description,
      tags: metadata?.tags,
      metadata: {
        width: metadata?.width,
        height: metadata?.height,
        duration: metadata?.duration,
        fileSize: storageResult.size,
        mimeType: metadata?.contentType,
        ...metadata
      },
      storageKey: storageResult.storageKey,
      createdAt: now,
      updatedAt: now
    };

    this.assets.set(id, asset);
    return asset;
  }

  async delete(id: string): Promise<boolean> {
    const asset = await this.getById(id);
    if (!asset) return false;

    // Delete from storage
    await this.storage.delete(asset.storageKey);
    
    // Remove from library
    this.assets.delete(id);
    return true;
  }

  async list(options?: {
    type?: AssetType;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]> {
    let results = Array.from(this.assets.values());

    // Filter by type
    if (options?.type) {
      results = results.filter(asset => asset.type === options.type);
    }

    // Apply pagination
    const start = options?.offset ?? 0;
    const limit = options?.limit;
    const end = limit !== undefined ? start + limit : results.length;
    return results.slice(start, end);
  }

  async search(query: string, options?: {
    type?: AssetType;
    limit?: number;
    offset?: number;
  }): Promise<Asset[]> {
    const lowerQuery = query.toLowerCase();
    let results = await this.list(options);

    return results.filter(asset => 
      asset.name.toLowerCase().includes(lowerQuery) ||
      (asset.description && asset.description.toLowerCase().includes(lowerQuery))
    );
  }

  async getById(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null;
  }

  async count(options?: { type?: AssetType }): Promise<number> {
    let count = 0;
    for (const asset of this.assets.values()) {
      if (options?.type && asset.type !== options.type) continue;
      count++;
    }
    return count;
  }
}

// ---------------------------------------------------------------------------
// C8.1 — Media Domain extensions
// ---------------------------------------------------------------------------

import { MediaFolder, MediaCollection, MediaTag, MediaPermission, MediaDocument } from './AssetTypes';

export interface MediaLibrary extends AssetLibrary {
  // Folder operations
  createFolder(folder: MediaFolder): Promise<MediaFolder>;
  getFolder(id: string): Promise<MediaFolder | null>;
  listFolders(parentId: string | null): Promise<MediaFolder[]>;
  deleteFolder(id: string): Promise<boolean>;

  // Collection operations
  createCollection(collection: Omit<MediaCollection, 'id' | 'createdAt'>): Promise<MediaCollection>;
  getCollection(id: string): Promise<MediaCollection | null>;
  listCollections(): Promise<MediaCollection[]>;
  deleteCollection(id: string): Promise<boolean>;

  // Tag operations
  createTag(tag: Omit<MediaTag, 'id' | 'assetCount'>): Promise<MediaTag>;
  getTags(): Promise<MediaTag[]>;
  tagAsset(assetId: string, tagId: string): Promise<void>;
  untagAsset(assetId: string, tagId: string): Promise<void>;

  // Permission operations
  setPermission(permission: MediaPermission): Promise<void>;
  getPermissions(tenantId: string): Promise<MediaPermission[]>;

  // Document operations
  getDocument(tenantId: string): Promise<MediaDocument | null>;
}

export class MemoryMediaLibrary extends MemoryAssetLibrary implements MediaLibrary {
  private folders: Map<string, MediaFolder> = new Map();
  private collections: Map<string, MediaCollection> = new Map();
  private tags: Map<string, MediaTag> = new Map();
  private permissions: Map<string, MediaPermission> = new Map();
  private rootFolderId: string;

  constructor(storage: AssetStorage, rootFolderId: string = 'root') {
    super(storage);
    this.rootFolderId = rootFolderId;
  }

  // Folder operations
  async createFolder(folder: MediaFolder): Promise<MediaFolder> {
    this.folders.set(folder.id, folder);
    return folder;
  }

  async getFolder(id: string): Promise<MediaFolder | null> {
    return this.folders.get(id) || null;
  }

  async listFolders(parentId: string | null): Promise<MediaFolder[]> {
    return Array.from(this.folders.values()).filter(f => f.parentId === parentId);
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.folders.delete(id);
  }

  // Collection operations
  async createCollection(collection: Omit<MediaCollection, 'id' | 'createdAt'>): Promise<MediaCollection> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newCollection: MediaCollection = {
      ...collection,
      id,
      createdAt: now,
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async getCollection(id: string): Promise<MediaCollection | null> {
    return this.collections.get(id) || null;
  }

  async listCollections(): Promise<MediaCollection[]> {
    return Array.from(this.collections.values());
  }

  async deleteCollection(id: string): Promise<boolean> {
    return this.collections.delete(id);
  }

  // Tag operations
  async createTag(tag: Omit<MediaTag, 'id' | 'assetCount'>): Promise<MediaTag> {
    const id = crypto.randomUUID();
    const newTag: MediaTag = {
      ...tag,
      id,
      assetCount: 0,
    };
    this.tags.set(id, newTag);
    return newTag;
  }

  async getTags(): Promise<MediaTag[]> {
    return Array.from(this.tags.values());
  }

  async tagAsset(assetId: string, tagId: string): Promise<void> {
    const asset = await this.getById(assetId);
    if (asset) {
      asset.tags = [...(asset.tags || []), tagId];
    }
  }

  async untagAsset(assetId: string, tagId: string): Promise<void> {
    const asset = await this.getById(assetId);
    if (asset && asset.tags) {
      asset.tags = asset.tags.filter(t => t !== tagId);
    }
  }

  // Permission operations
  async setPermission(permission: MediaPermission): Promise<void> {
    const key = `${permission.tenantId}:${permission.userId}`;
    this.permissions.set(key, permission);
  }

  async getPermissions(tenantId: string): Promise<MediaPermission[]> {
    return Array.from(this.permissions.values()).filter(p => p.tenantId === tenantId);
  }

  // Document operations
  async getDocument(tenantId: string): Promise<MediaDocument | null> {
    const folders = Array.from(this.folders.values()).filter(f => f.tenantId === tenantId);
    const assets = Array.from(this.assets.values());
    const collections = Array.from(this.collections.values()).filter(c => c.tenantId === tenantId);
    const tags = Array.from(this.tags.values()).filter(t => t.tenantId === tenantId);
    const permissions = await this.getPermissions(tenantId);

    return {
      id: tenantId,
      tenantId,
      rootFolderId: this.rootFolderId,
      folders,
      assets,
      collections,
      tags,
      permissions,
    };
  }
}