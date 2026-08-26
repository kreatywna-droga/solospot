/**
 * TimelineKeyframeAuthoring.ts — PM39 Keyframe Authoring UX (ETAP 2)
 *
 * DECISION-059: Wszystkie operacje Timeline są immutable.
 *
 * Provides batch keyframe operations:
 *   - Drag & drop single / multi-keyframe movement
 *   - Keyframe duplication
 *   - Keyframe batch deletion
 *   - Constrained time adjustment
 *
 * Every mutation returns a NEW BuilderDocument SSOT instance.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationKeyframe } from '../../../builder-core/src/animation/AnimationTypes';
import {
  moveKeyframe,
  addKeyframe,
  deleteKeyframe,
  getKeyframe,
} from './timelineDocumentBinding';

export interface KeyframeRef {
  readonly clipId: string;
  readonly trackId: string;
  readonly keyframeId: string;
}

/**
 * Moves multiple keyframes by a delta time offset in milliseconds.
 * Returns a new BuilderDocument (SSOT).
 */
export function moveMultipleKeyframes(
  doc: BuilderDocument,
  nodeId: string,
  keyframeRefs: ReadonlyArray<KeyframeRef>,
  deltaTimeMs: number
): BuilderDocument {
  let updated = doc;

  for (const ref of keyframeRefs) {
    const kf = getKeyframe(updated, nodeId, ref.clipId, ref.trackId, ref.keyframeId);
    if (kf) {
      const nextOffset = Math.max(0, Math.round(kf.timeOffset + deltaTimeMs));
      updated = moveKeyframe(
        updated,
        nodeId,
        ref.clipId,
        ref.trackId,
        ref.keyframeId,
        nextOffset
      );
    }
  }

  return updated;
}

/**
 * Duplicates a keyframe by ID with an optional time offset shift.
 * Returns a new BuilderDocument (SSOT).
 */
export function duplicateKeyframe(
  doc: BuilderDocument,
  nodeId: string,
  ref: KeyframeRef,
  timeShiftMs: number = 100
): { updatedDoc: BuilderDocument; newKeyframeId: string | null } {
  const original = getKeyframe(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId);
  if (!original) {
    return { updatedDoc: doc, newKeyframeId: null };
  }

  const newKeyframeId = `kf-dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const duplicate: AnimationKeyframe = {
    ...original,
    id: newKeyframeId,
    timeOffset: Math.max(0, Math.round(original.timeOffset + timeShiftMs)),
  };

  const updatedDoc = addKeyframe(doc, nodeId, ref.clipId, ref.trackId, duplicate);
  return { updatedDoc, newKeyframeId };
}

/**
 * Deletes a batch of keyframes across multiple tracks/clips.
 * Returns a new BuilderDocument (SSOT).
 */
export function deleteKeyframesBatch(
  doc: BuilderDocument,
  nodeId: string,
  keyframeRefs: ReadonlyArray<KeyframeRef>
): BuilderDocument {
  let updated = doc;

  for (const ref of keyframeRefs) {
    updated = deleteKeyframe(
      updated,
      nodeId,
      ref.clipId,
      ref.trackId,
      ref.keyframeId
    );
  }

  return updated;
}

/**
 * Drags a keyframe to a target time offset with optional snapping constraint.
 */
export function dragKeyframeConstrained(
  doc: BuilderDocument,
  nodeId: string,
  ref: KeyframeRef,
  targetTimeOffset: number,
  snapResolver?: (timeMs: number) => number
): BuilderDocument {
  const rawTime = Math.max(0, Math.round(targetTimeOffset));
  const finalTime = snapResolver ? snapResolver(rawTime) : rawTime;

  return moveKeyframe(
    doc,
    nodeId,
    ref.clipId,
    ref.trackId,
    ref.keyframeId,
    finalTime
  );
}
