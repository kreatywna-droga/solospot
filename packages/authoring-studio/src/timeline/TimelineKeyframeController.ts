/**
 * TimelineKeyframeController.ts — Sprint S24 Keyframe Manipulation Controller
 *
 * Pure headless controller orchestrating keyframe editing operations:
 * - single keyframe move (time offset drag)
 * - batch move multiple keyframes (preserving relative time intervals)
 * - copy keyframes to DTO payload
 * - paste keyframes to clip & track at target playhead time
 * - duplicate keyframes in-place or shifted
 * - delete keyframes
 *
 * Delegates directly to timelineDocumentBinding.ts and TimelineClipboard.ts.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import {
  copyKeyframesToClipboard,
  duplicateKeyframePayload,
  KeyframeClipboardPayload,
  pasteKeyframesFromClipboard,
} from './TimelineClipboard';
import { KeyframeRef, moveMultipleKeyframes } from './TimelineKeyframeAuthoring';
import { deleteKeyframe, moveKeyframe } from './timelineDocumentBinding';

export class TimelineKeyframeController {
  /**
   * Moves a single keyframe to a new time offset (ms) within its track.
   */
  public static moveKeyframe(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef,
    newTimeOffset: number
  ): BuilderDocument {
    return moveKeyframe(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId, newTimeOffset);
  }

  /**
   * Moves multiple selected keyframes simultaneously by a delta time offset (ms).
   * Preserves relative time intervals between selected keyframes.
   */
  public static batchMoveKeyframes(
    doc: BuilderDocument,
    nodeId: string,
    refs: ReadonlyArray<KeyframeRef>,
    deltaMs: number
  ): BuilderDocument {
    return moveMultipleKeyframes(doc, nodeId, refs, deltaMs);
  }

  /**
   * Copies selected keyframes to a pure DTO clipboard payload.
   */
  public static copyKeyframes(
    doc: BuilderDocument,
    nodeId: string,
    refs: ReadonlyArray<KeyframeRef>
  ): KeyframeClipboardPayload {
    return copyKeyframesToClipboard(doc, nodeId, refs);
  }

  /**
   * Pastes keyframes from a clipboard payload into a target clip & track at targetTimeOffset (ms).
   */
  public static pasteKeyframes(
    doc: BuilderDocument,
    nodeId: string,
    clipId: string,
    trackId: string,
    payload: KeyframeClipboardPayload,
    targetTimeOffset: number = 0
  ): BuilderDocument {
    return pasteKeyframesFromClipboard(doc, nodeId, clipId, trackId, payload, targetTimeOffset);
  }

  /**
   * Duplicates selected keyframes in-place or shifted by offsetShiftMs.
   */
  public static duplicateKeyframes(
    doc: BuilderDocument,
    nodeId: string,
    clipId: string,
    trackId: string,
    refs: ReadonlyArray<KeyframeRef>,
    offsetShiftMs: number = 100
  ): BuilderDocument {
    return duplicateKeyframePayload(doc, nodeId, clipId, trackId, refs, offsetShiftMs);
  }

  /**
   * Deletes selected keyframes from BuilderDocument.
   */
  public static deleteKeyframes(
    doc: BuilderDocument,
    nodeId: string,
    refs: ReadonlyArray<KeyframeRef>
  ): BuilderDocument {
    let updatedDoc = doc;

    for (const ref of refs) {
      updatedDoc = deleteKeyframe(updatedDoc, nodeId, ref.clipId, ref.trackId, ref.keyframeId);
    }

    return updatedDoc;
  }
}
