/**
 * TimelineKeyboardInteractionHandler.ts — Sprint S24 Timeline Keyboard Interaction Handler
 *
 * Pure headless keyboard event processor for timeline keyframe authoring:
 * - Arrow Left/Right keyframe time nudging (1ms default, 10ms with Shift)
 * - Jump to prev/next keyframe (J / K or Shift + ArrowLeft/Right)
 * - Copy / Paste keyframes (Ctrl/Cmd + C / Ctrl/Cmd + V)
 * - Duplicate keyframes (Ctrl/Cmd + D)
 * - Delete keyframes (Delete / Backspace)
 * - Select All keyframes (Ctrl/Cmd + A)
 * - Deselect All keyframes (Escape)
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { KeyframeClipboardPayload } from './TimelineClipboard';
import { TimelineKeyframeController } from './TimelineKeyframeController';
import { TimelineMultiSelectionState } from './TimelineMultiSelection';
import { TimelineSelectionController } from './TimelineSelectionController';

export interface TimelineKeyboardEventParams {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

export interface TimelineKeyboardActionResult {
  readonly handled: boolean;
  readonly actionType: string;
  readonly doc?: BuilderDocument;
  readonly selection?: TimelineMultiSelectionState;
  readonly clipboardPayload?: KeyframeClipboardPayload;
  readonly playheadJumpTimeMs?: number;
}

export class TimelineKeyboardInteractionHandler {
  /**
   * Processes a raw keyboard event parameter object and returns updated document, selection, or playhead jump target.
   */
  public static handleKeyDown(
    event: TimelineKeyboardEventParams,
    doc: BuilderDocument,
    nodeId: string,
    timeline: AnimationTimeline | null,
    selection: TimelineMultiSelectionState,
    clipboardPayload?: KeyframeClipboardPayload | null,
    playheadTimeMs: number = 0
  ): TimelineKeyboardActionResult {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // 1. Deselect All — Escape
    if (event.key === 'Escape') {
      const nextSelection = TimelineSelectionController.deselectAllKeyframes();
      return { handled: true, actionType: 'DESELECT_ALL', selection: nextSelection };
    }

    // 2. Select All — Ctrl/Cmd + A
    if (isCtrlOrCmd && key === 'a' && timeline) {
      const nextSelection = TimelineSelectionController.selectAllKeyframes(timeline);
      return { handled: true, actionType: 'SELECT_ALL', selection: nextSelection };
    }

    // 3. Copy Keyframes — Ctrl/Cmd + C
    if (isCtrlOrCmd && key === 'c') {
      if (selection.selectedKeyframeRefs.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      const copiedPayload = TimelineKeyframeController.copyKeyframes(doc, nodeId, selection.selectedKeyframeRefs);
      return { handled: true, actionType: 'COPY', clipboardPayload: copiedPayload };
    }

    // 4. Paste Keyframes — Ctrl/Cmd + V
    if (isCtrlOrCmd && key === 'v') {
      if (!clipboardPayload || clipboardPayload.keyframes.length === 0 || !timeline || timeline.clips.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      const targetClip = timeline.clips[0];
      const targetTrack = targetClip.tracks[0];
      if (!targetClip || !targetTrack) return { handled: false, actionType: 'NONE' };

      const updatedDoc = TimelineKeyframeController.pasteKeyframes(
        doc,
        nodeId,
        targetClip.id,
        targetTrack.id,
        clipboardPayload,
        playheadTimeMs
      );

      return { handled: true, actionType: 'PASTE', doc: updatedDoc };
    }

    // 5. Duplicate Keyframes — Ctrl/Cmd + D
    if (isCtrlOrCmd && key === 'd') {
      if (selection.selectedKeyframeRefs.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      const primaryRef = selection.primarySelectedRef ?? selection.selectedKeyframeRefs[0];
      const updatedDoc = TimelineKeyframeController.duplicateKeyframes(
        doc,
        nodeId,
        primaryRef.clipId,
        primaryRef.trackId,
        selection.selectedKeyframeRefs,
        50
      );

      return { handled: true, actionType: 'DUPLICATE', doc: updatedDoc };
    }

    // 6. Delete Keyframes — Delete / Backspace
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selection.selectedKeyframeRefs.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      const updatedDoc = TimelineKeyframeController.deleteKeyframes(doc, nodeId, selection.selectedKeyframeRefs);
      const nextSelection = TimelineSelectionController.deselectAllKeyframes();

      return { handled: true, actionType: 'DELETE', doc: updatedDoc, selection: nextSelection };
    }

    // 7. Arrow Nudging (1ms default, 10ms with Shift)
    if (key === 'arrowleft' || key === 'arrowright') {
      if (selection.selectedKeyframeRefs.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      const step = event.shiftKey ? 10 : 1;
      const delta = key === 'arrowleft' ? -step : step;

      const updatedDoc = TimelineKeyframeController.batchMoveKeyframes(
        doc,
        nodeId,
        selection.selectedKeyframeRefs,
        delta
      );

      return { handled: true, actionType: event.shiftKey ? 'SHIFT_NUDGE' : 'NUDGE', doc: updatedDoc };
    }

    // 8. Jump to Prev/Next Keyframe (J / K)
    if (key === 'j' || key === 'k') {
      if (!timeline) return { handled: false, actionType: 'NONE' };

      const allOffsets: number[] = [];
      for (const clip of timeline.clips) {
        for (const track of clip.tracks) {
          for (const kf of track.keyframes) {
            allOffsets.push(clip.delay + kf.timeOffset);
          }
        }
      }

      allOffsets.sort((a, b) => a - b);

      if (key === 'j') {
        // Prev keyframe
        const prev = allOffsets.filter((t) => t < playheadTimeMs).pop();
        if (prev !== undefined) {
          return { handled: true, actionType: 'JUMP_PREV', playheadJumpTimeMs: prev };
        }
      } else {
        // Next keyframe
        const next = allOffsets.find((t) => t > playheadTimeMs);
        if (next !== undefined) {
          return { handled: true, actionType: 'JUMP_NEXT', playheadJumpTimeMs: next };
        }
      }
    }

    return { handled: false, actionType: 'NONE' };
  }
}
