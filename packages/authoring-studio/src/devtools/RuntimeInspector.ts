/**
 * RuntimeInspector.ts — Sprint S1 Runtime Inspector Model (ETAP 1)
 *
 * Models for inspecting runtime execution state descriptors without executing runtime logic.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface RuntimeStateDescriptor {
  readonly activeTimelineId: string | null;
  readonly transportMode: 'stopped' | 'playing' | 'paused' | 'seeking';
  readonly currentTimeMs: number;
  readonly fps: number;
  readonly activeClipCount: number;
  readonly activeTrackCount: number;
}

export function inspectRuntimeState(
  timelineId: string | null = null,
  transportMode: 'stopped' | 'playing' | 'paused' | 'seeking' = 'stopped',
  currentTimeMs: number = 0
): RuntimeStateDescriptor {
  return {
    activeTimelineId: timelineId,
    transportMode,
    currentTimeMs,
    fps: 60,
    activeClipCount: timelineId ? 1 : 0,
    activeTrackCount: timelineId ? 2 : 0,
  };
}
