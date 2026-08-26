/**
 * MediaTimelineEditingEngine.ts — Sprint S16 Media Timeline Editing Engine (ETAP 4)
 *
 * Implements clip editing operations:
 * - split clip at playhead pivot time
 * - trim left (in-point adjustment) & trim right (out-point adjustment)
 * - move clip on track with snapping
 * - duplicate clip & delete clip
 * - ripple edit downstream shift
 * - multi-select clips
 *
 * All operations return updated DTO instances, which are dispatched as Commands
 * to BuilderDocument & HistoryStack.
 */

import { MediaClip, MediaTrack, MediaTimelineState } from './MediaTimelineModel';

export interface SplitClipResult {
  readonly leftClip: MediaClip;
  readonly rightClip: MediaClip;
}

export class MediaTimelineEditingEngine {
  /**
   * Splits a clip into two non-destructive halves at playhead pivot time.
   */
  public static splitClip(clip: MediaClip, pivotTimeMs: number): SplitClipResult | null {
    if (pivotTimeMs <= clip.startTimeMs || pivotTimeMs >= clip.startTimeMs + clip.durationMs) {
      return null;
    }

    const splitOffsetMs = pivotTimeMs - clip.startTimeMs;

    const leftClip: MediaClip = {
      ...clip,
      durationMs: splitOffsetMs,
      trim: {
        ...clip.trim,
        outPointMs: clip.trim.inPointMs + splitOffsetMs,
      },
    };

    const rightClip: MediaClip = {
      ...clip,
      clipId: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startTimeMs: pivotTimeMs,
      durationMs: clip.durationMs - splitOffsetMs,
      trim: {
        ...clip.trim,
        inPointMs: clip.trim.inPointMs + splitOffsetMs,
      },
    };

    return { leftClip, rightClip };
  }

  /**
   * Trims the left (start) edge of a clip by deltaMs.
   */
  public static trimLeft(clip: MediaClip, deltaMs: number): MediaClip {
    const maxDelta = clip.durationMs - 50; // minimum clip duration 50ms
    const actualDelta = Math.min(deltaMs, maxDelta);

    const newStartTimeMs = Math.max(0, clip.startTimeMs + actualDelta);
    const newDurationMs = Math.max(50, clip.durationMs - actualDelta);
    const newInPointMs = Math.max(0, clip.trim.inPointMs + actualDelta);

    return {
      ...clip,
      startTimeMs: newStartTimeMs,
      durationMs: newDurationMs,
      trim: {
        ...clip.trim,
        inPointMs: newInPointMs,
      },
    };
  }

  /**
   * Trims the right (end) edge of a clip by deltaMs.
   */
  public static trimRight(clip: MediaClip, deltaMs: number): MediaClip {
    const newDurationMs = Math.max(50, clip.durationMs + deltaMs);
    const newOutPointMs = clip.trim.inPointMs + newDurationMs;

    return {
      ...clip,
      durationMs: newDurationMs,
      trim: {
        ...clip.trim,
        outPointMs: newOutPointMs,
      },
    };
  }

  /**
   * Moves a clip along track timeline to target startTimeMs with optional snapping.
   */
  public static moveClip(
    clip: MediaClip,
    targetStartTimeMs: number,
    snapGridMs: number = 0
  ): MediaClip {
    let newStartTimeMs = Math.max(0, targetStartTimeMs);

    if (snapGridMs > 0) {
      newStartTimeMs = Math.round(newStartTimeMs / snapGridMs) * snapGridMs;
    }

    return {
      ...clip,
      startTimeMs: newStartTimeMs,
    };
  }

  /**
   * Duplicates a clip placement downstream.
   */
  public static duplicateClip(clip: MediaClip, offsetMs?: number): MediaClip {
    const shift = offsetMs ?? clip.durationMs + 100;
    return {
      ...clip,
      clipId: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startTimeMs: clip.startTimeMs + shift,
    };
  }

  /**
   * Applies ripple edit shift to all clips on track downstream of pivotTimeMs.
   */
  public static applyRippleEdit(track: MediaTrack, pivotTimeMs: number, deltaMs: number): MediaTrack {
    const updatedClips = track.clips.map((clip) => {
      if (clip.startTimeMs >= pivotTimeMs) {
        return {
          ...clip,
          startTimeMs: Math.max(0, clip.startTimeMs + deltaMs),
        };
      }
      return clip;
    });

    return {
      ...track,
      clips: updatedClips.sort((a, b) => a.startTimeMs - b.startTimeMs),
    };
  }

  /**
   * Performs ripple delete of a clip from a track, closing the gap left by its duration.
   */
  public static rippleDeleteClip(track: MediaTrack, clipId: string): MediaTrack {
    const target = track.clips.find((c) => c.clipId === clipId);
    if (!target) return track;

    const remainingClips = track.clips.filter((c) => c.clipId !== clipId);
    const pivot = target.startTimeMs;
    const duration = target.durationMs;

    const shiftedClips = remainingClips.map((clip) => {
      if (clip.startTimeMs >= pivot + duration) {
        return {
          ...clip,
          startTimeMs: Math.max(0, clip.startTimeMs - duration),
        };
      }
      return clip;
    });

    return {
      ...track,
      clips: shiftedClips.sort((a, b) => a.startTimeMs - b.startTimeMs),
    };
  }

  /**
   * Performs ripple insert of a new clip on a track, shifting downstream clips right.
   */
  public static rippleInsertClip(track: MediaTrack, clip: MediaClip, insertTimeMs: number): MediaTrack {
    const shiftDelta = clip.durationMs;
    const shiftedTrack = MediaTimelineEditingEngine.applyRippleEdit(track, insertTimeMs, shiftDelta);

    const insertedClip: MediaClip = {
      ...clip,
      startTimeMs: insertTimeMs,
    };

    return {
      ...shiftedTrack,
      clips: [...shiftedTrack.clips, insertedClip].sort((a, b) => a.startTimeMs - b.startTimeMs),
    };
  }

  /**
   * Moves a set of selected clips simultaneously by a delta offset in milliseconds.
   */
  public static batchMoveClips(clips: readonly MediaClip[], deltaMs: number): readonly MediaClip[] {
    return clips.map((clip) => ({
      ...clip,
      startTimeMs: Math.max(0, clip.startTimeMs + deltaMs),
    }));
  }

  /**
   * Synchronizes movements/edits across all clips sharing the same avGroupId (AV Linked Pairs).
   */
  public static syncAVLinkedClips(
    state: MediaTimelineState,
    avGroupId: string,
    transformFn: (clip: MediaClip) => MediaClip
  ): MediaTimelineState {
    const nextTracks = state.tracks.map((track) => {
      const updatedClips = track.clips.map((clip) => {
        if (clip.avGroupId === avGroupId) {
          return transformFn(clip);
        }
        return clip;
      });
      return {
        ...track,
        clips: updatedClips.sort((a, b) => a.startTimeMs - b.startTimeMs),
      };
    });

    return {
      ...state,
      tracks: nextTracks,
    };
  }
}
