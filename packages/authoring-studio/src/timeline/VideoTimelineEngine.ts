/**
 * VideoTimelineEngine.ts — Sprint S16 Video Workflow Engine (ETAP 3)
 *
 * Handles video clip calculations (duration, trim, in/out points, source range, poster frame,
 * opacity, transform/crop) and frame playback position resolution.
 * Pure headless domain calculations.
 */

import { VideoMediaClip, VideoClipSettings } from './MediaTimelineModel';

export interface VideoFramePlaybackState {
  readonly isActive: boolean;
  readonly assetId: string;
  readonly assetFrameTimeMs: number;
  readonly opacity: number;
  readonly posterFrameTimeMs?: number;
  readonly cropX: number;
  readonly cropY: number;
  readonly cropWidth: number;
  readonly cropHeight: number;
}

export class VideoTimelineEngine {
  /**
   * Creates a default VideoMediaClip DTO.
   */
  public static createVideoClip(
    clipId: string,
    assetId: string,
    name: string,
    startTimeMs: number,
    totalDurationMs: number
  ): VideoMediaClip {
    return {
      clipId,
      assetId,
      name,
      mediaType: 'video',
      startTimeMs: Math.max(0, startTimeMs),
      durationMs: totalDurationMs,
      trim: {
        inPointMs: 0,
        outPointMs: totalDurationMs,
        sourceOffsetMs: 0,
      },
      videoSettings: {
        opacity: 1.0,
        posterFrameTimeMs: 0,
        fitMode: 'cover',
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
        rotationDeg: 0,
      },
    };
  }

  /**
   * Resolves video frame playback state (asset frame time offset, opacity, crop) at playhead time t.
   */
  public static evaluateVideoPlayback(
    clip: VideoMediaClip,
    playheadTimeMs: number,
    isTrackVisible: boolean = true
  ): VideoFramePlaybackState {
    if (!isTrackVisible || playheadTimeMs < clip.startTimeMs || playheadTimeMs >= clip.startTimeMs + clip.durationMs) {
      return {
        isActive: false,
        assetId: clip.assetId,
        assetFrameTimeMs: 0,
        opacity: 0,
        cropX: clip.videoSettings.cropX,
        cropY: clip.videoSettings.cropY,
        cropWidth: clip.videoSettings.cropWidth,
        cropHeight: clip.videoSettings.cropHeight,
      };
    }

    const clipOffset = playheadTimeMs - clip.startTimeMs;
    const assetFrameTimeMs = clip.trim.inPointMs + clipOffset;

    return {
      isActive: true,
      assetId: clip.assetId,
      assetFrameTimeMs,
      opacity: clip.videoSettings.opacity,
      posterFrameTimeMs: clip.videoSettings.posterFrameTimeMs,
      cropX: clip.videoSettings.cropX,
      cropY: clip.videoSettings.cropY,
      cropWidth: clip.videoSettings.cropWidth,
      cropHeight: clip.videoSettings.cropHeight,
    };
  }

  /**
   * Updates video clip settings (opacity, posterFrameTimeMs, fitMode, crop, rotation).
   */
  public static updateVideoSettings(
    clip: VideoMediaClip,
    settings: Partial<VideoClipSettings>
  ): VideoMediaClip {
    return {
      ...clip,
      videoSettings: {
        ...clip.videoSettings,
        ...settings,
      },
    };
  }
}
