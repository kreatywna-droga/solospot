/**
 * MediaTimelineModel.ts — Sprint S16 Media Timeline Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for Audio Clips, Video Clips, and Media Tracks.
 * Integrates with AnimationTimeline & BuilderDocument.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type MediaType = 'audio' | 'video';

export interface ClipTrimRange {
  readonly inPointMs: number;       // Start offset inside source asset (>= 0)
  readonly outPointMs: number;      // End offset inside source asset (> inPointMs)
  readonly sourceOffsetMs: number;  // Shift offset inside source media
}

export interface AudioClipSettings {
  readonly volume: number;      // Normalized volume [0, 1]
  readonly gainDb: number;      // Gain adjustment in dB (-60 to +12)
  readonly mute: boolean;        // Mute toggle
  readonly fadeInMs: number;    // Fade in duration in ms
  readonly fadeOutMs: number;   // Fade out duration in ms
}

export interface VideoClipSettings {
  readonly opacity: number;     // Normalized opacity [0, 1]
  readonly posterFrameTimeMs?: number; // Time offset for poster frame thumbnail
  readonly fitMode: 'contain' | 'cover' | 'fill' | 'none';
  readonly cropX: number;
  readonly cropY: number;
  readonly cropWidth: number;
  readonly cropHeight: number;
  readonly rotationDeg: number;
}

export interface ClipMarker {
  readonly id: string;
  readonly relativeTimeMs: number; // Offset relative to clip start time (0..durationMs)
  readonly label: string;
  readonly color?: string;
  readonly description?: string;
}

export interface CrossfadeRange {
  readonly clipIdA: string;
  readonly clipIdB: string;
  readonly startTimeMs: number;
  readonly durationMs: number;
  readonly crossfadeType: 'linear' | 'equalPower' | 'exponential';
}

export interface AudioMediaClip {
  readonly clipId: string;
  readonly assetId: string;
  readonly name: string;
  readonly mediaType: 'audio';
  readonly startTimeMs: number;   // Placement time on timeline playhead
  readonly durationMs: number;    // Active trimmed clip duration on timeline
  readonly trim: ClipTrimRange;
  readonly audioSettings: AudioClipSettings;
  readonly avGroupId?: string;    // AV link group ID for linked audio/video pair
  readonly clipMarkers?: readonly ClipMarker[];
}

export interface VideoMediaClip {
  readonly clipId: string;
  readonly assetId: string;
  readonly name: string;
  readonly mediaType: 'video';
  readonly startTimeMs: number;   // Placement time on timeline playhead
  readonly durationMs: number;    // Active trimmed clip duration on timeline
  readonly trim: ClipTrimRange;
  readonly videoSettings: VideoClipSettings;
  readonly audioSettings?: AudioClipSettings; // Embedded audio track settings
  readonly avGroupId?: string;    // AV link group ID for linked audio/video pair
  readonly clipMarkers?: readonly ClipMarker[];
}

export type MediaClip = AudioMediaClip | VideoMediaClip;

export interface MediaTrack {
  readonly id: string;
  readonly name: string;
  readonly mediaType: MediaType;
  readonly clips: readonly MediaClip[];
  readonly muted: boolean;
  readonly solo: boolean;
  readonly locked: boolean;
  readonly visible: boolean;
  readonly heightPx: number;
}

export interface MediaTimelineState {
  readonly tracks: readonly MediaTrack[];
}

export const INITIAL_MEDIA_TIMELINE_STATE: MediaTimelineState = {
  tracks: [],
};

export function createMediaTimelineState(
  initialTracks: readonly MediaTrack[] = []
): MediaTimelineState {
  return {
    tracks: [...initialTracks],
  };
}
