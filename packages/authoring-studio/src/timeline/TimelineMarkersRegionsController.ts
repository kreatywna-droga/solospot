/**
 * TimelineMarkersRegionsController.ts — Sprint S24 Markers & Loop Regions Controller
 *
 * Pure headless controller for:
 * - Adding, moving, removing, locking, and renaming timeline markers
 * - Setting and toggling timeline loop regions (start time, end time, enable/disable)
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import {
  createMarkersRegionsState,
  LoopRegion,
  MarkersRegionsState,
  TimelineMarker,
} from './TimelineMarkersRegionsModel';

export class TimelineMarkersRegionsController {
  /**
   * Creates a new TimelineMarker DTO object.
   */
  public static createMarker(params: {
    id?: string;
    timeMs: number;
    label: string;
    color?: string;
    locked?: boolean;
    description?: string;
  }): TimelineMarker {
    return {
      id: params.id ?? `marker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timeMs: Math.max(0, params.timeMs),
      label: params.label,
      color: params.color ?? '#EC4899',
      locked: params.locked ?? false,
      description: params.description,
    };
  }

  /**
   * Appends or updates a timeline marker immutably in state.
   */
  public static addMarker(
    state: MarkersRegionsState,
    marker: TimelineMarker
  ): MarkersRegionsState {
    const filtered = state.markers.filter((m) => m.id !== marker.id);
    const updated = [...filtered, marker].sort((a, b) => a.timeMs - b.timeMs);
    return createMarkersRegionsState({ ...state, markers: updated });
  }

  /**
   * Moves an unlocked timeline marker to a new time offset in ms.
   */
  public static moveMarker(
    state: MarkersRegionsState,
    markerId: string,
    newTimeMs: number
  ): MarkersRegionsState {
    const updated = state.markers
      .map((m) => (m.id === markerId && !m.locked ? { ...m, timeMs: Math.max(0, newTimeMs) } : m))
      .sort((a, b) => a.timeMs - b.timeMs);

    return createMarkersRegionsState({ ...state, markers: updated });
  }

  /**
   * Removes a timeline marker by ID immutably.
   */
  public static removeMarker(
    state: MarkersRegionsState,
    markerId: string
  ): MarkersRegionsState {
    return createMarkersRegionsState({
      ...state,
      markers: state.markers.filter((m) => m.id !== markerId),
    });
  }

  /**
   * Toggles lock state of a timeline marker.
   */
  public static toggleLockMarker(
    state: MarkersRegionsState,
    markerId: string
  ): MarkersRegionsState {
    const updated = state.markers.map((m) => (m.id === markerId ? { ...m, locked: !m.locked } : m));
    return createMarkersRegionsState({ ...state, markers: updated });
  }

  /**
   * Configures timeline loop region start & end times and optional enabled status.
   */
  public static setLoopRegion(
    state: MarkersRegionsState,
    startTimeMs: number,
    endTimeMs: number,
    enabled: boolean = true
  ): MarkersRegionsState {
    const start = Math.max(0, Math.min(startTimeMs, endTimeMs));
    const end = Math.max(start + 1, Math.max(startTimeMs, endTimeMs));

    const loopRegion: LoopRegion = {
      enabled,
      startTimeMs: start,
      endTimeMs: end,
    };

    return createMarkersRegionsState({ ...state, loopRegion });
  }

  /**
   * Toggles active state of loop region.
   */
  public static toggleLoopRegion(
    state: MarkersRegionsState,
    enabled?: boolean
  ): MarkersRegionsState {
    const nextEnabled = enabled !== undefined ? enabled : !state.loopRegion.enabled;
    return createMarkersRegionsState({
      ...state,
      loopRegion: { ...state.loopRegion, enabled: nextEnabled },
    });
  }
}
