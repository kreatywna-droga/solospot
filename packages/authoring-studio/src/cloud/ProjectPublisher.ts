/**
 * ProjectPublisher.ts — PM44 Project Publisher (ETAP 1)
 *
 * DECISION-085: Publishing Pipeline operuje wyłącznie na manifestach i artefaktach.
 *
 * Pure DTO project publisher orchestrating publish manifests and release packages.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { PublishManifest } from './PublishManifest';
import { validatePublishManifest } from './PublishManifest';
import { DEFAULT_PUBLISH_PROFILE, type PublishProfile, type ReleaseChannelName } from './PublishProfiles';

export interface PublishResult {
  readonly manifest: PublishManifest;
  readonly success: boolean;
  readonly artifactPayload: unknown;
}

export function publishProject(
  projectId: string,
  version: string,
  publisherUserId: string,
  artifactPayload: unknown,
  channelId: ReleaseChannelName = 'production',
  profile: PublishProfile = DEFAULT_PUBLISH_PROFILE
): PublishResult {
  const publishId = `pub-${projectId}-${version}-${Date.now()}`;
  const manifest: PublishManifest = {
    publishId,
    projectId,
    version,
    profileId: profile.id,
    channelId,
    publisherUserId,
    publishedAt: Date.now(),
    artifactChecksum: `chk-${Math.floor(Math.random() * 1000000)}`,
  };

  if (!validatePublishManifest(manifest)) {
    throw new Error(`Invalid publish manifest generated for project "${projectId}"`);
  }

  return {
    manifest,
    success: true,
    artifactPayload,
  };
}
