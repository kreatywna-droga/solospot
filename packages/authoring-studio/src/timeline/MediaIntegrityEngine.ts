/**
 * MediaIntegrityEngine.ts — Sprint S26 Media Timeline Integrity & Relink Engine
 *
 * Detects missing or unlinked media assets across timeline clips using S15/S25 Asset Registry.
 * Provides clip relinking and automatic timeline integrity repair.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { MediaClip, MediaTimelineState } from './MediaTimelineModel';
import { AssetRegistryState, getAsset } from '../assets/AnimationAssetRegistry';

export interface MissingAssetClipRef {
  readonly trackId: string;
  readonly clipId: string;
  readonly clipName: string;
  readonly missingAssetId: string;
}

export interface MediaTimelineIntegrityReport {
  readonly isValid: boolean;
  readonly totalClipsCount: number;
  readonly validClipsCount: number;
  readonly missingAssetClips: readonly MissingAssetClipRef[];
}

/**
 * Scans a MediaTimelineState for clips referencing missing asset IDs in the AnimationAssetRegistry.
 */
export function checkMediaTimelineIntegrity(
  state: MediaTimelineState,
  registry: AssetRegistryState
): MediaTimelineIntegrityReport {
  const missingAssetClips: MissingAssetClipRef[] = [];
  let totalClipsCount = 0;
  let validClipsCount = 0;

  for (const track of state.tracks) {
    for (const clip of track.clips) {
      totalClipsCount++;
      const asset = getAsset(registry, clip.assetId);

      if (!asset) {
        missingAssetClips.push({
          trackId: track.id,
          clipId: clip.clipId,
          clipName: clip.name,
          missingAssetId: clip.assetId,
        });
      } else {
        validClipsCount++;
      }
    }
  }

  return {
    isValid: missingAssetClips.length === 0,
    totalClipsCount,
    validClipsCount,
    missingAssetClips,
  };
}

/**
 * Relinks a MediaClip to a new assetId.
 */
export function relinkClipAsset<T extends MediaClip>(clip: T, newAssetId: string): T {
  return {
    ...clip,
    assetId: newAssetId,
  } as T;
}

/**
 * Immutably updates all clips referencing an old missing assetId with a new replacement assetId.
 */
export function relinkTimelineAsset(
  state: MediaTimelineState,
  oldAssetId: string,
  newAssetId: string
): MediaTimelineState {
  const nextTracks = state.tracks.map((track) => {
    const updatedClips = track.clips.map((clip) => {
      if (clip.assetId === oldAssetId) {
        return relinkClipAsset(clip, newAssetId);
      }
      return clip;
    });

    return {
      ...track,
      clips: updatedClips,
    };
  });

  return {
    ...state,
    tracks: nextTracks,
  };
}
