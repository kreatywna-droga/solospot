/**
 * MediaAudioVideoEditing.ts — Sprint S26 Professional Audio/Video Editing Utilities
 *
 * Provides pure headless editing operations for:
 * - Audio: fades, crossfades, volume, gain, mute toggles
 * - Video: frame-accurate positioning (ms <-> frame), crop, opacity, thumbnail strip layout
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import {
  AudioMediaClip,
  VideoMediaClip,
  MediaClip,
  CrossfadeRange,
} from './MediaTimelineModel';

export const DEFAULT_FRAME_RATE = 30; // 30 fps default frame rate

// ============================================================================
// Frame Rate & Accurate Time Conversion Utilities
// ============================================================================

/**
 * Converts timestamp in milliseconds to frame index at specified FPS.
 */
export function msToFrame(ms: number, fps: number = DEFAULT_FRAME_RATE): number {
  const safeMs = Math.max(0, ms);
  const safeFps = Math.max(1, fps);
  return Math.round((safeMs / 1000) * safeFps);
}

/**
 * Converts frame index to exact timestamp in milliseconds at specified FPS.
 */
export function frameToMs(frame: number, fps: number = DEFAULT_FRAME_RATE): number {
  const safeFrame = Math.max(0, frame);
  const safeFps = Math.max(1, fps);
  return Math.round((safeFrame / safeFps) * 1000);
}

/**
 * Snaps millisecond timestamp to the nearest exact frame boundary.
 */
export function snapToFrame(ms: number, fps: number = DEFAULT_FRAME_RATE): number {
  const frame = msToFrame(ms, fps);
  return frameToMs(frame, fps);
}

// ============================================================================
// Professional Audio Editing Utilities
// ============================================================================

/**
 * Sets fade-in duration for an AudioMediaClip in milliseconds.
 */
export function setFadeIn(clip: AudioMediaClip, fadeInMs: number): AudioMediaClip {
  const safeFadeIn = Math.max(0, Math.min(clip.durationMs, fadeInMs));
  return {
    ...clip,
    audioSettings: {
      ...clip.audioSettings,
      fadeInMs: safeFadeIn,
    },
  };
}

/**
 * Sets fade-out duration for an AudioMediaClip in milliseconds.
 */
export function setFadeOut(clip: AudioMediaClip, fadeOutMs: number): AudioMediaClip {
  const safeFadeOut = Math.max(0, Math.min(clip.durationMs, fadeOutMs));
  return {
    ...clip,
    audioSettings: {
      ...clip.audioSettings,
      fadeOutMs: safeFadeOut,
    },
  };
}

/**
 * Updates normalized volume [0, 1] for an AudioMediaClip.
 */
export function setVolume(clip: AudioMediaClip, volume: number): AudioMediaClip {
  const safeVolume = Math.max(0, Math.min(1.0, volume));
  return {
    ...clip,
    audioSettings: {
      ...clip.audioSettings,
      volume: safeVolume,
    },
  };
}

/**
 * Updates gain adjustment in dB (-60 dB to +12 dB) for an AudioMediaClip.
 */
export function setGainDb(clip: AudioMediaClip, gainDb: number): AudioMediaClip {
  const safeGain = Math.max(-60, Math.min(12, gainDb));
  return {
    ...clip,
    audioSettings: {
      ...clip.audioSettings,
      gainDb: safeGain,
    },
  };
}

/**
 * Toggles mute status on an AudioMediaClip.
 */
export function toggleMute(clip: AudioMediaClip, muted?: boolean): AudioMediaClip {
  const isMuted = muted !== undefined ? muted : !clip.audioSettings.mute;
  return {
    ...clip,
    audioSettings: {
      ...clip.audioSettings,
      mute: isMuted,
    },
  };
}

/**
 * Calculates declarative crossfade overlap between two adjacent clips on the same track.
 */
export function computeCrossfade(
  clipA: MediaClip,
  clipB: MediaClip,
  crossfadeType: 'linear' | 'equalPower' | 'exponential' = 'equalPower'
): CrossfadeRange | null {
  const endA = clipA.startTimeMs + clipA.durationMs;
  const startB = clipB.startTimeMs;

  // Check if clip A and clip B overlap
  if (endA <= startB || clipB.startTimeMs < clipA.startTimeMs) {
    return null; // No overlap or out of order
  }

  const overlapStart = Math.max(clipA.startTimeMs, startB);
  const overlapEnd = Math.min(endA, clipB.startTimeMs + clipB.durationMs);
  const overlapDuration = overlapEnd - overlapStart;

  if (overlapDuration <= 0) return null;

  return {
    clipIdA: clipA.clipId,
    clipIdB: clipB.clipId,
    startTimeMs: overlapStart,
    durationMs: overlapDuration,
    crossfadeType,
  };
}

// ============================================================================
// Professional Video Editing Utilities
// ============================================================================

/**
 * Updates normalized opacity [0, 1] for a VideoMediaClip.
 */
export function setOpacity(clip: VideoMediaClip, opacity: number): VideoMediaClip {
  const safeOpacity = Math.max(0, Math.min(1.0, opacity));
  return {
    ...clip,
    videoSettings: {
      ...clip.videoSettings,
      opacity: safeOpacity,
    },
  };
}

/**
 * Updates crop dimensions (percentage / pixels) for a VideoMediaClip.
 */
export function setCrop(
  clip: VideoMediaClip,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number
): VideoMediaClip {
  return {
    ...clip,
    videoSettings: {
      ...clip.videoSettings,
      cropX: Math.max(0, cropX),
      cropY: Math.max(0, cropY),
      cropWidth: Math.max(1, cropWidth),
      cropHeight: Math.max(1, cropHeight),
    },
  };
}

export interface VideoThumbnailFrameDTO {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly xOffsetPx: number;
}

export interface VideoThumbnailStripConfig {
  readonly thumbnailWidthPx: number;
  readonly trackWidthPx: number;
  readonly fps?: number;
}

/**
 * Computes deterministic thumbnail strip layout for video track rendering.
 */
export function computeVideoThumbnailStripLayout(
  clip: VideoMediaClip,
  config: VideoThumbnailStripConfig
): readonly VideoThumbnailFrameDTO[] {
  const thumbWidth = Math.max(20, config.thumbnailWidthPx);
  const trackWidth = Math.max(thumbWidth, config.trackWidthPx);
  const fps = config.fps ?? DEFAULT_FRAME_RATE;

  const count = Math.max(1, Math.floor(trackWidth / thumbWidth));
  const timeStepMs = clip.durationMs / count;

  const thumbnails: VideoThumbnailFrameDTO[] = [];

  for (let i = 0; i < count; i++) {
    const rawTimeMs = clip.trim.inPointMs + i * timeStepMs;
    const timestampMs = snapToFrame(rawTimeMs, fps);
    const frameIndex = msToFrame(timestampMs, fps);

    thumbnails.push({
      frameIndex,
      timestampMs,
      xOffsetPx: i * thumbWidth,
    });
  }

  return thumbnails;
}
