/**
 * TimelineSmartGuides.ts — PM40 Timeline Smart Guides (ETAP 1)
 *
 * DECISION-063: Timeline Smart Guides pozostają wyłącznie modelem danych.
 *
 * Pure data model for visual alignment guides, spacing guides, and snap candidates.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

export type SmartGuideType = 'alignment' | 'spacing' | 'clip_edge';

export interface SmartGuideLine {
  readonly id: string;
  readonly type: SmartGuideType;
  readonly positionMs: number;
  readonly label?: string;
  readonly sourceIds: ReadonlyArray<string>;
}

export interface SpacingGuide {
  readonly startMs: number;
  readonly endMs: number;
  readonly gapMs: number;
}

export interface SnapCandidate {
  readonly timeMs: number;
  readonly sourceId: string;
  readonly label: string;
  readonly type: SmartGuideType;
}

export interface SmartGuidesState {
  readonly activeGuides: ReadonlyArray<SmartGuideLine>;
  readonly activeSpacings: ReadonlyArray<SpacingGuide>;
  readonly enabled: boolean;
}

export const INITIAL_SMART_GUIDES_STATE: SmartGuidesState = {
  activeGuides: [],
  activeSpacings: [],
  enabled: true,
};

export function createSmartGuidesState(
  partial: Partial<SmartGuidesState> = {}
): SmartGuidesState {
  return {
    ...INITIAL_SMART_GUIDES_STATE,
    ...partial,
  };
}

/**
 * Solves alignment candidates across target keyframe/clip positions.
 */
export function findSnapCandidates(
  targetPositions: ReadonlyArray<{ id: string; timeMs: number; label: string; type?: SmartGuideType }>
): ReadonlyArray<SnapCandidate> {
  return targetPositions.map((pos) => ({
    timeMs: pos.timeMs,
    sourceId: pos.id,
    label: pos.label,
    type: pos.type ?? 'alignment',
  }));
}

/**
 * Computes active visual guide lines for candidate positions within proximity threshold.
 */
export function computeSmartGuides(
  currentTimeMs: number,
  candidates: ReadonlyArray<SnapCandidate>,
  thresholdMs: number = 10
): SmartGuidesState {
  const matchingCandidates = candidates.filter(
    (c) => Math.abs(c.timeMs - currentTimeMs) <= thresholdMs
  );

  const activeGuides: SmartGuideLine[] = matchingCandidates.map((c) => ({
    id: `guide-${c.sourceId}-${c.timeMs}`,
    type: c.type,
    positionMs: c.timeMs,
    label: c.label,
    sourceIds: [c.sourceId],
  }));

  return {
    enabled: true,
    activeGuides,
    activeSpacings: [],
  };
}
