/**
 * MediaClipMarkers.ts — Sprint S26 Headless Clip Markers & Timeline Region Engine
 *
 * Handles clip-anchored markers, relative clip timestamps, and marker synchronization.
 * Clip markers move automatically with the clip on the timeline playhead.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { ClipMarker, MediaClip } from './MediaTimelineModel';

/**
 * Creates a new ClipMarker anchored relative to a clip's start time (0..durationMs).
 */
export function createClipMarker(params: {
  id?: string;
  relativeTimeMs: number;
  label: string;
  color?: string;
  description?: string;
}): ClipMarker {
  return {
    id: params.id ?? `clip_marker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    relativeTimeMs: Math.max(0, params.relativeTimeMs),
    label: params.label,
    color: params.color ?? '#3B82F6',
    description: params.description,
  };
}

/**
 * Adds or updates a clip marker immutably on an Audio or Video clip.
 */
export function addClipMarker<T extends MediaClip>(clip: T, marker: ClipMarker): T {
  const existing = clip.clipMarkers ?? [];
  const filtered = existing.filter((m) => m.id !== marker.id);
  const updated = [...filtered, marker].sort((a, b) => a.relativeTimeMs - b.relativeTimeMs);

  return {
    ...clip,
    clipMarkers: updated,
  } as T;
}

/**
 * Removes a clip marker immutably by marker ID.
 */
export function removeClipMarker<T extends MediaClip>(clip: T, markerId: string): T {
  if (!clip.clipMarkers || clip.clipMarkers.length === 0) return clip;

  return {
    ...clip,
    clipMarkers: clip.clipMarkers.filter((m) => m.id !== markerId),
  } as T;
}

/**
 * Moves a clip marker to a new relative time within the clip duration.
 */
export function moveClipMarker<T extends MediaClip>(
  clip: T,
  markerId: string,
  newRelativeTimeMs: number
): T {
  if (!clip.clipMarkers || clip.clipMarkers.length === 0) return clip;

  const safeTime = Math.max(0, Math.min(clip.durationMs, newRelativeTimeMs));
  const updated = clip.clipMarkers
    .map((m) => (m.id === markerId ? { ...m, relativeTimeMs: safeTime } : m))
    .sort((a, b) => a.relativeTimeMs - b.relativeTimeMs);

  return {
    ...clip,
    clipMarkers: updated,
  } as T;
}

/**
 * Converts a clip marker's relative timestamp to absolute playhead time in milliseconds.
 */
export function getAbsoluteMarkerTime(clip: MediaClip, marker: ClipMarker): number {
  return clip.startTimeMs + marker.relativeTimeMs;
}

/**
 * Finds all clip markers that fall within a given absolute timeline range [startMs, endMs].
 */
export function findClipMarkersInTimelineRange(
  clip: MediaClip,
  startMs: number,
  endMs: number
): readonly ClipMarker[] {
  if (!clip.clipMarkers || clip.clipMarkers.length === 0) return [];

  return clip.clipMarkers.filter((marker) => {
    const absTime = getAbsoluteMarkerTime(clip, marker);
    return absTime >= startMs && absTime <= endMs;
  });
}
