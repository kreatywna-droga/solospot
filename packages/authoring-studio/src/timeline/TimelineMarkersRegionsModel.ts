/**
 * TimelineMarkersRegionsModel.ts — Sprint S24 Markers & Loop Regions Model
 *
 * Headless DTO data structures for:
 * - Timeline Markers (named, colored, locked, time position)
 * - LoopRegion (loop start time, loop end time, enable/disable loop)
 * - MarkersRegionsState
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface TimelineMarker {
  readonly id: string;
  readonly timeMs: number;
  readonly label: string;
  readonly color?: string;
  readonly locked: boolean;
  readonly description?: string;
}

export interface LoopRegion {
  readonly enabled: boolean;
  readonly startTimeMs: number;
  readonly endTimeMs: number;
}

export const DEFAULT_LOOP_REGION: LoopRegion = {
  enabled: false,
  startTimeMs: 0,
  endTimeMs: 1000,
};

export interface MarkersRegionsState {
  readonly markers: ReadonlyArray<TimelineMarker>;
  readonly loopRegion: LoopRegion;
}

export const INITIAL_MARKERS_REGIONS_STATE: MarkersRegionsState = {
  markers: [],
  loopRegion: DEFAULT_LOOP_REGION,
};

export function createMarkersRegionsState(
  partial: Partial<MarkersRegionsState> = {}
): MarkersRegionsState {
  return {
    ...INITIAL_MARKERS_REGIONS_STATE,
    ...partial,
  };
}
