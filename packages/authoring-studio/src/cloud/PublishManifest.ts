/**
 * PublishManifest.ts — PM44 Publishing Manifest Model (ETAP 1)
 *
 * DECISION-085: Publishing Pipeline operuje wyłącznie na manifestach i artefaktach.
 *
 * Publishing manifest DTO specifications.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface PublishManifest {
  readonly publishId: string;
  readonly projectId: string;
  readonly version: string;
  readonly profileId: string;
  readonly channelId: string; // e.g. "alpha", "beta", "production"
  readonly publisherUserId: string;
  readonly publishedAt: number;
  readonly artifactChecksum: string;
}

export function validatePublishManifest(manifest: PublishManifest | null): boolean {
  if (!manifest) return false;
  if (!manifest.publishId || manifest.publishId.trim().length === 0) return false;
  if (!manifest.projectId || manifest.projectId.trim().length === 0) return false;
  if (!manifest.version || manifest.version.trim().length === 0) return false;
  return true;
}
