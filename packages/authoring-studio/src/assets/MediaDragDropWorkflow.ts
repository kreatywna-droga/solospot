/**
 * MediaDragDropWorkflow.ts — Sprint S25 Professional Drag & Drop Workflow
 *
 * Orchestrates drag-and-drop from the Asset Browser onto Canvas or the
 * Media Timeline, producing lightweight drop intents that bind only `assetId`
 * references — binary payload never reaches `BuilderDocument`.
 *
 * Canvas targets reuse the S15 `CanvasAssetPlacementEngine`; Media Timeline
 * targets reuse the S16 `MediaTimelineModel` DTOs (AudioMediaClip /
 * VideoMediaClip). NO second placement engine, NO second media-timeline model.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem, AssetRegistryState } from './AnimationAssetRegistry';
import { getAssetById } from './AnimationAssetRegistry';
import { bindAssetReference, type AssetReferenceLink } from './AnimationAssetReference';
import {
  CanvasAssetPlacementEngine,
  type CanvasAssetNodePlacement,
  type FrameFitMode,
} from './CanvasAssetPlacementEngine';
import type {
  AudioMediaClip,
  VideoMediaClip,
  MediaClip,
  ClipTrimRange,
  AudioClipSettings,
  VideoClipSettings,
} from '../timeline/MediaTimelineModel';
import { readAssetPayload, detectAssetMediaType } from './assetPayload';

export type MediaDropTargetKind = 'canvas' | 'mediaTimeline';

export interface CanvasDropIntent {
  readonly target: 'canvas';
  readonly placement: CanvasAssetNodePlacement;
  readonly referenceLink: AssetReferenceLink;
}

export interface MediaTimelineDropIntent {
  readonly target: 'mediaTimeline';
  readonly mediaType: 'audio' | 'video';
  readonly clip: MediaClip;
  readonly trackId: string;
  readonly referenceLink: AssetReferenceLink;
}

export type AssetDropIntent = CanvasDropIntent | MediaTimelineDropIntent;

/**
 * Resolves which media target an asset supports. Returns `null` for
 * non-placeable assets (or for timeline-only assets).
 */
export function resolveMediaTargetForAsset(
  item: AnimationAssetItem
): 'canvas' | 'audio' | 'video' | null {
  const kind = detectAssetMediaType(item);
  if (kind === 'video') return 'video';
  if (kind === 'audio') return 'audio';
  // image/svg/fonts can be placed on canvas; only audio/video ride the timeline.
  return kind === 'image' || kind === 'svg' || kind === 'font' ? 'canvas' : null;
}

/**
 * Builds a Canvas drop intent — placement node + assetId reference link.
 * Reuses `CanvasAssetPlacementEngine.createPlacement`.
 */
export function createCanvasDropIntent(
  assetId: string,
  mediaType: CanvasAssetNodePlacement['type'],
  x: number = 100,
  y: number = 100,
  width: number = 300,
  height: number = 200,
  fitMode: FrameFitMode = 'cover'
): CanvasDropIntent {
  const { placement, linkState } = CanvasAssetPlacementEngine.createPlacement(
    assetId,
    mediaType,
    x,
    y,
    width,
    height,
    fitMode
  );

  return {
    target: 'canvas',
    placement,
    referenceLink: linkState.links[0],
  };
}

function defaultTrim(durationMs?: number): ClipTrimRange {
  const d = durationMs ?? 0;
  return { inPointMs: 0, outPointMs: Math.max(d, 1), sourceOffsetMs: 0 };
}

function defaultAudioSettings(): AudioClipSettings {
  return { volume: 1, gainDb: 0, mute: false, fadeInMs: 0, fadeOutMs: 0 };
}

function defaultVideoSettings(widthPx?: number, heightPx?: number): VideoClipSettings {
  return {
    opacity: 1,
    posterFrameTimeMs: 0,
    fitMode: 'contain',
    cropX: 0,
    cropY: 0,
    cropWidth: widthPx ?? 0,
    cropHeight: heightPx ?? 0,
    rotationDeg: 0,
  };
}

/**
 * Builds a Media Timeline drop intent — media clip DTO + assetId reference
 * link. Reuses `MediaTimelineModel` DTO shapes (AudioMediaClip / VideoMediaClip).
 */
export function createMediaTimelineDropIntent(
  item: AnimationAssetItem,
  mediaType: 'audio' | 'video',
  startTimeMs: number,
  name: string,
  trackId: string,
  durationOverrideMs?: number
): MediaTimelineDropIntent {
  const { extracted } = readAssetPayload(item);
  const durationMs = durationOverrideMs ?? extracted?.durationMs ?? item.metadata.preview.durationMs ?? 0;
  const clipId = `clip_${item.metadata.assetId}_${startTimeMs}`;

  let clip: MediaClip;
  if (mediaType === 'audio') {
    const audioClip: AudioMediaClip = {
      clipId,
      assetId: item.metadata.assetId,
      name,
      mediaType: 'audio',
      startTimeMs,
      durationMs: Math.max(durationMs, 1),
      trim: defaultTrim(durationMs),
      audioSettings: defaultAudioSettings(),
    };
    clip = audioClip;
  } else {
    const videoClip: VideoMediaClip = {
      clipId,
      assetId: item.metadata.assetId,
      name,
      mediaType: 'video',
      startTimeMs,
      durationMs: Math.max(durationMs, 1),
      trim: defaultTrim(durationMs),
      videoSettings: defaultVideoSettings(extracted?.widthPx, extracted?.heightPx),
      audioSettings: defaultAudioSettings(),
    };
    clip = videoClip;
  }

  const referenceLink = bindAssetReference(
    { links: [] },
    item.metadata.assetId,
    'AnimationTimeline',
    clipId,
    'assetId'
  ).links[0];

  return { target: 'mediaTimeline', mediaType, clip, trackId, referenceLink };
}

/**
 * Creates a replacement drop intent for an existing canvas placement —
 * rebinds the node to a new assetId while preserving the existing transform.
 * Reuses `CanvasAssetPlacementEngine.replaceAsset`.
 */
export function replaceExistingPlacement(
  placement: CanvasAssetNodePlacement,
  replacementAssetId: string
): CanvasAssetNodePlacement {
  return CanvasAssetPlacementEngine.replaceAsset(placement, replacementAssetId);
}

/**
 * Convenience: resolves an asset from the registry and produces the most
 * appropriate drop intent for the requested target, returning `null` when the
 * asset cannot satisfy the requested target.
 */
export function resolveAssetDropIntent(
  registryState: AssetRegistryState,
  assetId: string,
  target: AssetDropIntent['target'],
  opts: { x?: number; y?: number; width?: number; height?: number; startTimeMs?: number; trackId?: string }
): AssetDropIntent | null {
  const item = getAssetById(registryState, assetId);
  if (!item) return null;

  if (target === 'canvas') {
    const kind = detectAssetMediaType(item);
    const type = kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'image';
    return createCanvasDropIntent(assetId, type, opts.x, opts.y, opts.width, opts.height);
  }

  const mediaTarget = resolveMediaTargetForAsset(item);
  if (mediaTarget === 'audio') {
    return createMediaTimelineDropIntent(item, 'audio', opts.startTimeMs ?? 0, item.metadata.name, opts.trackId ?? 'track_1');
  }
  if (mediaTarget === 'video') {
    return createMediaTimelineDropIntent(item, 'video', opts.startTimeMs ?? 0, item.metadata.name, opts.trackId ?? 'track_1');
  }
  return null;
}

