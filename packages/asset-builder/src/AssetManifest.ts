import { AssetManifest, AssetManifestEntry, PageManifestEntry } from './AssetTypes';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

export function createAssetManifest(params: {
  version?: string;
  buildId?: string;
  runtimeVersion?: string;
  assets?: ReadonlyArray<AssetManifestEntry>;
  pages?: ReadonlyArray<PageManifestEntry>;
  metadata?: Record<string, unknown>;
}): AssetManifest {
  const generatedAt = new Date().toISOString();
  const assets = params.assets || [];
  const pages = params.pages || [];
  const integrity: Record<string, string> = {};
  
  for (const asset of assets) {
    integrity[asset.path] = asset.hash;
  }

  return {
    version: params.version || '1.0.0',
    buildId: params.buildId || `build_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    runtimeVersion: params.runtimeVersion || '1.0.0',
    assets,
    pages,
    integrity,
    generatedAt,
    metadata: params.metadata || {},
  };
}

export function createManifestArtifact(manifest: AssetManifest): PublishArtifact {
  const contentStr = JSON.stringify(manifest, null, 2);
  const encoder = new TextEncoder();
  const contentBytes = encoder.encode(contentStr);
  return {
    path: 'manifest.json',
    contentType: 'application/json',
    content: contentBytes,
    size: contentBytes.byteLength,
    hash: manifest.buildId,
  };
}
