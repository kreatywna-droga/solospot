// AssetTypes.ts
export type AssetType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'font'
  | 'archive'
  | 'other';

export interface AssetMetadata {
  width?: number; // for images/video
  height?: number; // for images/video
  duration?: number; // for video/audio in seconds
  fileSize?: number; // in bytes
  mimeType?: string;
  // Additional metadata can be added per type
  [key: string]: any;
}

export interface Asset {
  id: string; // Unique identifier (UUID recommended)
  type: AssetType;
  name: string; // Original filename or display name
  description?: string;
  tags?: string[]; // For search/categorization
  metadata: AssetMetadata;
  storageKey: string; // Key used in storage backend
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Versioning support for future enhancement
  version?: number;
}

// Events for asset lifecycle
export enum AssetEventType {
  UPLOADED = 'asset.uploaded',
  UPDATED = 'asset.updated',
  DELETED = 'asset.deleted',
  ACCESSED = 'asset.accessed'
}

export interface AssetEvent {
  type: AssetEventType;
  assetId: string;
  timestamp: string; // ISO timestamp
  userId?: string; // Who performed the action
  // Event-specific data
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// C8.1 — Media Domain extensions
// ---------------------------------------------------------------------------

export interface MediaFolder {
  readonly id: string;
  readonly tenantId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface MediaCollection {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly description?: string;
  readonly assetIds: readonly string[];
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface MediaTag {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly color?: string;
  readonly assetCount: number;
}

export interface MediaPermission {
  readonly tenantId: string;
  readonly userId: string;
  readonly canRead: boolean;
  readonly canWrite: boolean;
  readonly canDelete: boolean;
}

export interface MediaDocument {
  readonly id: string;
  readonly tenantId: string;
  readonly rootFolderId: string;
  readonly folders: MediaFolder[];
  readonly assets: Asset[];
  readonly collections: MediaCollection[];
  readonly tags: MediaTag[];
  readonly permissions: MediaPermission[];
}

export type MediaAsset = Asset;