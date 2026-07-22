import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

export type AssetType = 'stylesheet' | 'javascript' | 'image' | 'font' | 'document' | 'manifest' | 'other';

export interface AssetManifestEntry {
  readonly path: string;
  readonly originalPath: string;
  readonly type: AssetType;
  readonly contentType: string;
  readonly size: number;
  readonly hash: string;
}

export interface PageManifestEntry {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly path: string;
  readonly title?: string;
  readonly description?: string;
}

export interface AssetManifest {
  readonly version: string;
  readonly buildId: string;
  readonly runtimeVersion: string;
  readonly assets: ReadonlyArray<AssetManifestEntry>;
  readonly pages: ReadonlyArray<PageManifestEntry>;
  readonly integrity: Record<string, string>;
  readonly generatedAt: string;
  readonly metadata?: Record<string, unknown>;
}
