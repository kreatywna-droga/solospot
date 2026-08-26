/**
 * TimelineAuthoringExtensions.ts — Sprint S14 Professional Timeline UX Extensions
 *
 * Extends the timeline authoring system with track grouping, markers, keyframe interpolation indicators,
 * range selection, clipboard copy/paste, and ripple editing.
 * Works strictly with AnimationTimeline DTOs.
 */

import type {
  AnimationKeyframe as Keyframe,
  PropertyAnimationTrack as Track,
  AnimationClip as Clip,
  AnimationTimeline,
} from '../../../builder-core/src/animation/AnimationTypes';

export interface TimelineMarker {
  readonly id: string;
  readonly timeMs: number;
  readonly label: string;
  readonly color?: string;
}

export interface TrackGroup {
  readonly id: string;
  readonly name: string;
  readonly trackIds: readonly string[];
  readonly collapsed: boolean;
}

export interface KeyframeClipboardData {
  readonly propertyKey: string;
  readonly keyframes: readonly Keyframe[];
}

export class TimelineAuthoringExtensions {
  /**
   * Adds a new timeline marker at specified time in ms.
   */
  public static addMarker(markers: readonly TimelineMarker[], timeMs: number, label: string = 'Marker'): TimelineMarker[] {
    const newMarker: TimelineMarker = {
      id: `marker_${Date.now()}`,
      timeMs,
      label,
      color: '#f59e0b',
    };
    return [...markers, newMarker].sort((a, b) => a.timeMs - b.timeMs);
  }

  /**
   * Removes a timeline marker by id.
   */
  public static removeMarker(markers: readonly TimelineMarker[], markerId: string): TimelineMarker[] {
    return markers.filter((m) => m.id !== markerId);
  }

  /**
   * Toggles collapsed state of a track group.
   */
  public static toggleGroupCollapse(groups: readonly TrackGroup[], groupId: string): TrackGroup[] {
    return groups.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  }

  /**
   * Performs ripple editing on a track: shifts all keyframes at or after pivot time by deltaMs.
   */
  public static applyRippleEdit(track: Track, pivotTimeMs: number, deltaMs: number): Track {
    const updatedKeyframes = track.keyframes.map((kf) => {
      if (kf.timeOffset >= pivotTimeMs) {
        return {
          ...kf,
          timeOffset: Math.max(0, kf.timeOffset + deltaMs),
        };
      }
      return kf;
    });

    return {
      ...track,
      keyframes: updatedKeyframes.sort((a, b) => a.timeOffset - b.timeOffset),
    };
  }

  /**
   * Copies selected keyframes DTO to clipboard data.
   */
  public static copyKeyframes(track: Track, selectedKfIds: readonly string[]): KeyframeClipboardData {
    const selected = track.keyframes.filter((kf) => selectedKfIds.includes(kf.id));
    return {
      propertyKey: track.propertyKey,
      keyframes: selected,
    };
  }

  /**
   * Pastes keyframes from clipboard into track at target targetTimeMs playhead offset.
   */
  public static pasteKeyframes(track: Track, clipboard: KeyframeClipboardData, targetTimeMs: number): Track {
    if (clipboard.keyframes.length === 0) return track;
    const baseOffset = clipboard.keyframes[0].timeOffset;

    const newKeyframes = clipboard.keyframes.map((kf) => ({
      ...kf,
      id: `kf_paste_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timeOffset: targetTimeMs + (kf.timeOffset - baseOffset),
    }));

    return {
      ...track,
      keyframes: [...track.keyframes, ...newKeyframes].sort((a, b) => a.timeOffset - b.timeOffset),
    };
  }

  /**
   * Returns a visual interpolation indicator icon or text label for keyframe easing.
   */
  public static getEasingIndicator(easingType?: string): { symbol: string; label: string } {
    switch (easingType) {
      case 'cubic-bezier':
      case 'ease-in-out':
        return { symbol: '∿', label: 'Bézier' };
      case 'linear':
        return { symbol: '╱', label: 'Linear' };
      case 'step-start':
      case 'step-end':
        return { symbol: '▔', label: 'Step' };
      case 'spring':
      case 'bounce':
        return { symbol: '⌇', label: 'Physics' };
      default:
        return { symbol: '◇', label: 'Default' };
    }
  }
}
