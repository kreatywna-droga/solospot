/**
 * PreviewSelectionSync.ts — PM38 Tri-Directional Selection Synchronization (ETAP 4)
 *
 * Synchronizes selection state across:
 *   Timeline ↔ Inspector ↔ Preview Canvas
 *
 * Flow:
 *   Preview Element Click → Selects Node in BuilderDocument → Updates Timeline Clip & Inspector
 *   Timeline Keyframe/Clip Click → Selects Node & Keyframe → Updates Inspector & Preview Highlight
 *   Inspector Property Change → Mutates BuilderDocument (SSOT) → Refreshes Timeline & Preview
 *
 * DECISION-055: BuilderDocument remains Single Source of Truth (SSOT).
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { TimelineSelection } from '../timeline/TimelineSelection';
import { createTimelineSelection } from '../timeline/TimelineSelection';
import { inspectNodeAnimation } from '../inspector/animationDocumentBinding';

export type SelectionTargetSource = 'timeline' | 'inspector' | 'preview';

export interface TriSelectionState {
  readonly selectedNodeId: string | null;
  readonly timelineSelection: TimelineSelection;
  readonly highlightedElementId: string | null;
  readonly lastSource: SelectionTargetSource | null;
  readonly syncVersion: number;
}

export const INITIAL_TRI_SELECTION_STATE: TriSelectionState = {
  selectedNodeId: null,
  timelineSelection: createTimelineSelection(),
  highlightedElementId: null,
  lastSource: null,
  syncVersion: 0,
};

export function createTriSelectionState(
  partial: Partial<TriSelectionState> = {}
): TriSelectionState {
  return {
    ...INITIAL_TRI_SELECTION_STATE,
    ...partial,
  };
}

/**
 * Handles element selection originating from Preview Canvas/iframe.
 * Selects target node in BuilderDocument, inspects timeline clips, and updates Timeline + Inspector models.
 */
export function syncPreviewSelectionToStudio(
  state: TriSelectionState,
  doc: BuilderDocument,
  nodeId: string
): { nextState: TriSelectionState; selection: TimelineSelection } {
  const timeline = inspectNodeAnimation(doc, nodeId);
  const firstClipId = timeline?.clips[0]?.id ?? null;

  const selection = createTimelineSelection({
    selectedClipId: firstClipId,
    selectedTrackId: timeline?.clips[0]?.tracks[0]?.id ?? null,
    selectedKeyframeId: null,
  });

  const nextState: TriSelectionState = {
    selectedNodeId: nodeId,
    timelineSelection: selection,
    highlightedElementId: nodeId,
    lastSource: 'preview',
    syncVersion: state.syncVersion + 1,
  };

  return { nextState, selection };
}

/**
 * Handles selection originating from Timeline Editor (e.g. keyframe or clip click).
 * Updates active node highlight in Preview and property fields in Inspector.
 */
export function syncTimelineSelectionToPreview(
  state: TriSelectionState,
  nodeId: string,
  selection: TimelineSelection
): TriSelectionState {
  return {
    selectedNodeId: nodeId,
    timelineSelection: selection,
    highlightedElementId: nodeId,
    lastSource: 'timeline',
    syncVersion: state.syncVersion + 1,
  };
}

/**
 * Handles selection originating from Inspector panel.
 * Updates target node selection and timeline focus.
 */
export function syncInspectorSelectionToPreview(
  state: TriSelectionState,
  nodeId: string,
  clipId: string | null = null,
  keyframeId: string | null = null
): TriSelectionState {
  const selection = createTimelineSelection({
    selectedClipId: clipId,
    selectedKeyframeId: keyframeId,
  });

  return {
    selectedNodeId: nodeId,
    timelineSelection: selection,
    highlightedElementId: nodeId,
    lastSource: 'inspector',
    syncVersion: state.syncVersion + 1,
  };
}
