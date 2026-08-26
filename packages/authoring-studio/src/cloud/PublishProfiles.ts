/**
 * PublishProfiles.ts & ReleaseChannels.ts — PM44 Publishing Profiles & Release Channels (ETAP 1)
 *
 * DECISION-085: Publishing Pipeline operuje wyłącznie na manifestach i artefaktach.
 *
 * Publishing profile descriptors and release channels.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ReleaseChannelName = 'alpha' | 'beta' | 'staging' | 'production';

export interface ReleaseChannel {
  readonly id: ReleaseChannelName;
  readonly name: string;
  readonly requiresApproval: boolean;
}

export interface PublishProfile {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly defaultChannel: ReleaseChannelName;
  readonly minifyArtifacts: boolean;
  readonly includeSourceMaps: boolean;
}

export const STANDARD_RELEASE_CHANNELS: ReadonlyArray<ReleaseChannel> = [
  { id: 'alpha', name: 'Alpha Channel', requiresApproval: false },
  { id: 'beta', name: 'Beta Channel', requiresApproval: false },
  { id: 'staging', name: 'Staging Channel', requiresApproval: true },
  { id: 'production', name: 'Production Channel', requiresApproval: true },
];

export const DEFAULT_PUBLISH_PROFILE: PublishProfile = {
  id: 'profile-standard',
  name: 'Standard Studio Publish',
  description: 'Standard publishing profile for Web Factor Studio projects',
  defaultChannel: 'production',
  minifyArtifacts: true,
  includeSourceMaps: false,
};
