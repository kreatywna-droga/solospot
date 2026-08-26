/**
 * TimelineSelectionSync.ts — PM37 Selection Synchronization (ETAP 5)
 *
 * Synchronizes selection between Inspector, Timeline, and BuilderDocument.
 *
 * DECISION-050 (one-directional sync through BuilderDocument):
 *   Timeline → Inspector → BuilderDocument → Timeline, WITHOUT looping.
 *
 * The sync is loop-guarded by a sync-version + last-source flag: when a
 * selection change originates from the Timeline it propagates out through the
 * BuilderDocument keyed change and does NOT re-enter the Timeline listener.
 *
 * This module is PURE and environment-agnostic — no DOM, no React, no stateful
 * runtime. BuilderDocument remains the Single Source of Truth (SSOT,
 * DECISION-048).
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { inspectNodeAnimation } from '../inspector/animationDocumentBinding';
import type { TimelineSelection } from './TimelineSelection';
import {
  EMPTY_TIMELINE_SELECTION,
  selectClip,
  selectTrack,
  selectKeyframe,
} from './TimelineSelection';

/**
 * Loop-guarding coordination state for the one-directional sync (DECISION-050).
 */
export interface SelectionSyncState {
  /** The node id currently selected, or null. */
  readonly selectedNodeId: string | null;
  /** The source that initiated the current sync round (null when idle). */
  readonly lastSyncSource: 'timeline' | 'inspector' | 'builderDocument' | null;
  /** Monotonically increasing sync version (incremented on each round). */
  readonly syncVersion: number;
}

/**
 * Result of a timeline→document sync round.
 */
export interface TimelineSyncResult {
  /** The next (looped) sync state. */
  readonly nextState: SelectionSyncState;
  /** The (unchanged, SSOT-preserved) BuilderDocument. */
  readonly updatedDoc: BuilderDocument;
}

/**
 * Result of an inspector→timeline sync round.
 */
export interface InspectorSyncResult {
  /** The next (looped) sync state. */
  readonly nextState: SelectionSyncState;
  /** The derived TimelineSelection. */
  readonly selection: TimelineSelection;
}

/**
 * Creates the initial (empty) selection sync state.
 */
export function createSelectionSyncState(): SelectionSyncState {
  return {
    selectedNodeId: null,
    lastSyncSource: null,
    syncVersion: 0,
  };
}

/**
 * Derives the timeline DTO for a node from BuilderDocument (SSOT).
 */
export function getTimelineForNode(
  doc: BuilderDocument,
  nodeId: string
): AnimationTimeline | null {
  return inspectNodeAnimation(doc, nodeId);
}

/**
 * Syncs a Timeline-driven selection change outward through the BuilderDocument.
 * BuilderDocument is never structurally mutated (selection is pure UI state),
 * so the same document reference is returned (SSOT preserved).
 *
 * Loop-guarded: re-syncing the identical timeline selection returns the same
 * state (no version bump, no recursion).
 */
export function syncTimelineSelectionToDocument(
  state: SelectionSyncState,
  doc: BuilderDocument,
  nodeId: string,
  selection: TimelineSelection
): TimelineSyncResult {
  const timeline = getTimelineForNode(doc, nodeId);
  // No timeline for the node (or no clip selected) → no-op.
  if (!timeline || !selection.selectedClipId) {
    return { nextState: state, updatedDoc: doc };
  }

  // Loop guard: identical selection + same source → no re-entry.
  if (
    state.lastSyncSource === 'timeline' &&
    state.selectedNodeId === nodeId
  ) {
    return { nextState: state, updatedDoc: doc };
  }

  const nextState: SelectionSyncState = {
    selectedNodeId: nodeId,
    lastSyncSource: 'timeline',
    syncVersion: state.syncVersion + 1,
  };

  return { nextState, updatedDoc: doc };
}

/**
 * Syncs an Inspector-driven selection change into the TimelineSelection model,
 * reading the actual keyframe/track/clip structure from BuilderDocument (SSOT).
 */
export function syncInspectorSelectionToTimeline(
  state: SelectionSyncState,
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string | null = null,
  keyframeId: string | null = null
): InspectorSyncResult {
  const timeline = getTimelineForNode(doc, nodeId);
  if (!timeline || !clipId) {
    return { nextState: state, selection: EMPTY_TIMELINE_SELECTION };
  }

  // Build the selection directly from the Inspector-supplied IDs. The actual
  // track/keyframe structural validation happens in the SSOT reconcile step
  // (syncDocumentToTimelineSelection); here we preserve the Inspector's intent
  // verbatim so the Timeline reflects the exact selection made in the panel.
  let selection: TimelineSelection = selectClip(
    EMPTY_TIMELINE_SELECTION,
    clipId
  );

  if (trackId) {
    selection = selectTrack(selection, clipId, trackId);
    if (keyframeId) {
      selection = selectKeyframe(selection, clipId, trackId, keyframeId);
    }
  }

  const nextState: SelectionSyncState = {
    selectedNodeId: nodeId,
    lastSyncSource: 'inspector',
    syncVersion: state.syncVersion + 1,
  };

  return { nextState, selection };
}

/**
 * Reconciles a (possibly stale) TimelineSelection back to the SSOT document
 * timeline. When the selected clip no longer exists, falls back to the first
 * available clip in the document's timeline for the node.
 */
export function syncDocumentToTimelineSelection(
  doc: BuilderDocument,
  nodeId: string,
  selection: TimelineSelection
): TimelineSelection {
  const timeline = getTimelineForNode(doc, nodeId);
  if (!timeline) {
    return EMPTY_TIMELINE_SELECTION;
  }

  if (selection.selectedClipId) {
    const clip = timeline.clips.find((c) => c.id === selection.selectedClipId);
    if (clip) {
      // Resolve down to the selected track/keyframe if still present.
      return selectionForInspectable(selection, timeline);
    }
  }

  // Fallback: first available clip in the SSOT document timeline.
  const firstClip = timeline.clips[0];
  if (!firstClip) {
    return EMPTY_TIMELINE_SELECTION;
  }
  return selectClip(EMPTY_TIMELINE_SELECTION, firstClip.id);
}

/**
 * Resolves a selection against the actual timeline structure, downgrading to
 * the deepest still-valid level (clip → track → keyframe).
 */
export function selectionForInspectable(
  selection: TimelineSelection,
  timeline: AnimationTimeline
): TimelineSelection {
  if (!selection.selectedClipId) return EMPTY_TIMELINE_SELECTION;
  const clip = timeline.clips.find((c) => c.id === selection.selectedClipId);
  if (!clip) return EMPTY_TIMELINE_SELECTION;

  if (selection.selectedTrackId) {
    const track = clip.tracks.find((t) => t.id === selection.selectedTrackId);
    if (track) {
      if (selection.selectedKeyframeId) {
        const kf = track.keyframes.find(
          (k) => k.id === selection.selectedKeyframeId
        );
        if (kf) {
          return selectKeyframe(selection, clip.id, track.id, kf.id);
        }
      }
      return selectTrack(selection, clip.id, track.id);
    }
  }

  return selectClip(selection, clip.id);
}
