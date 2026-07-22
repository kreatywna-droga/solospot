import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { Asset, AssetType, AssetMetadata } from '../../asset-manager-core/src/AssetTypes';
import { MediaDocument } from '../../asset-manager-core/src/AssetTypes';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export type { Asset, AssetType, AssetMetadata, MediaDocument };

export interface AssetReference {
  id: string;
  type: AssetType;
  name: string;
  url?: string;
}

export class AssetIntegration {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {
    this.currentProject = project;
  }

  uploadAsset(file: File, metadata: Partial<AssetMetadata> = {}): Asset {
    const asset: Asset = {
      id: `asset-${Date.now()}`,
      type: this.getAssetType(file.type),
      name: file.name,
      metadata: {
        fileSize: file.size,
        mimeType: file.type,
        ...metadata
      },
      storageKey: `uploads/${file.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentAssets = (this.currentProject.assets as Record<string, Asset>) || {};
    const updatedAssets = {
      ...currentAssets,
      [asset.id]: asset
    };

    this.currentProject = {
      ...this.currentProject,
      assets: updatedAssets
    };

    this.workspace.updateProject(this.currentProject);
    return asset;
  }

  getAsset(id: string): Asset | undefined {
    return (this.currentProject.assets as Record<string, Asset>)?.[id];
  }

  listAssets(): Asset[] {
    const assets = this.currentProject.assets;
    if (!assets || typeof assets !== 'object') return [];
    return Object.values(assets as Record<string, Asset>);
  }

  linkAssetToComponent(componentId: string, propName: string, assetId: string): void {
    const asset = this.getAsset(assetId);
    if (!asset) return;

    const updatedAssets = {
      ...(this.currentProject.assets as Record<string, Asset>),
      [asset.id]: asset
    };

    this.currentProject = {
      ...this.currentProject,
      assets: updatedAssets
    };

    this.workspace.updateProject(this.currentProject);
  }

  getMediaDocument(tenantId: string): MediaDocument | null {
    const result: MediaDocument = {
      id: `media-${tenantId}`,
      tenantId,
      rootFolderId: `root-${tenantId}`,
      folders: [],
      assets: this.listAssets(),
      collections: [],
      tags: [],
      permissions: []
    };

    return result;
  }

  toPackage(): TemplateManifestData {
    return {
      manifest: this.currentProject.manifest,
      pages: this.currentProject.template,
      sections: {},
      components: this.currentProject.components,
      themes: this.currentProject.theme,
      assets: this.currentProject.assets,
      commerce: this.currentProject.commerce,
      runtime: this.currentProject.runtime
    };
  }

  private getAssetType(mimeType: string): AssetType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('font')) return 'font';
    return 'other';
  }
}