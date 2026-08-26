/**
 * TimelineInteractionPipeline.ts — Sprint S24 Closed Timeline Interaction Pipeline Engine
 *
 * Implements the mandatory closed 5-step timeline interaction pipeline architecture:
 * Timeline UI → S24 Keyframe Interaction → S13 Motion / AnimationTimeline → HistoryStack → BuilderDocument
 *
 * Guarantees zero duplicate SSOT, zero secondary timeline engine, zero secondary history stack.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BuilderDocument, HistoryStack } from '../../../builder-core/src';
import { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { KeyframeClipboardPayload } from './TimelineClipboard';
import { executeTimelineTransaction } from './TimelineHistoryBinding';
import { KeyframeRef } from './TimelineKeyframeAuthoring';
import { TimelineKeyboardInteractionHandler, TimelineKeyboardEventParams } from './TimelineKeyboardInteractionHandler';
import { TimelineKeyframeController } from './TimelineKeyframeController';
import { MarkersRegionsState } from './TimelineMarkersRegionsModel';
import { TimelineMarkersRegionsController } from './TimelineMarkersRegionsController';
import { TimelineMultiSelectionState } from './TimelineMultiSelection';
import { TimelineSelectionController } from './TimelineSelectionController';
import { TimelineViewport } from './TimelineViewport';

export interface TimelineInteractionState {
  readonly doc: BuilderDocument;
  readonly nodeId: string;
  readonly timeline: AnimationTimeline | null;
  readonly selection: TimelineMultiSelectionState;
  readonly viewport: TimelineViewport;
  readonly markersState: MarkersRegionsState;
  readonly historyStack: HistoryStack<BuilderDocument>;
  readonly playheadTimeMs: number;
  readonly clipboardPayload?: KeyframeClipboardPayload | null;
}

export class TimelineInteractionPipeline {
  /**
   * Processes keyframe click / pointer down event.
   */
  public static handleKeyframePointerDown(
    state: TimelineInteractionState,
    ref: KeyframeRef,
    modifiers: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }
  ): TimelineInteractionState {
    let nextSelection = state.selection;

    if (modifiers.shiftKey && state.selection.primarySelectedRef && state.timeline) {
      nextSelection = TimelineSelectionController.rangeSelect(
        state.selection,
        state.timeline,
        ref.clipId,
        ref.trackId,
        state.selection.primarySelectedRef,
        ref
      );
    } else if (modifiers.ctrlKey || modifiers.metaKey) {
      nextSelection = TimelineSelectionController.toggleKeyframe(state.selection, ref);
    } else {
      nextSelection = TimelineSelectionController.selectSingleKeyframe(ref.clipId, ref.trackId, ref.keyframeId);
    }

    return {
      ...state,
      selection: nextSelection,
    };
  }

  /**
   * Processes drag moving keyframes by deltaMs.
   */
  public static handleKeyframeDrag(
    state: TimelineInteractionState,
    deltaMs: number
  ): TimelineInteractionState {
    if (state.selection.selectedKeyframeRefs.length === 0 || deltaMs === 0) return state;

    const updatedDoc = TimelineKeyframeController.batchMoveKeyframes(
      state.doc,
      state.nodeId,
      state.selection.selectedKeyframeRefs,
      deltaMs
    );

    return {
      ...state,
      doc: updatedDoc,
    };
  }

  /**
   * Finalizes drag / keyframe edit interaction and commits to HistoryStack<BuilderDocument>.
   */
  public static commitTimelineChange(
    state: TimelineInteractionState,
    actionLabel: string = 'Keyframe Edit'
  ): TimelineInteractionState {
    const tx = executeTimelineTransaction(
      state.historyStack,
      state.doc,
      (d) => d,
      actionLabel
    );

    return {
      ...state,
      doc: tx.document,
      historyStack: tx.historyStack,
    };
  }

  /**
   * Processes keyboard events via TimelineKeyboardInteractionHandler and commits changes to HistoryStack.
   */
  public static handleKeyDown(
    state: TimelineInteractionState,
    event: TimelineKeyboardEventParams
  ): TimelineInteractionState {
    const result = TimelineKeyboardInteractionHandler.handleKeyDown(
      event,
      state.doc,
      state.nodeId,
      state.timeline,
      state.selection,
      state.clipboardPayload,
      state.playheadTimeMs
    );

    if (!result.handled) return state;

    let nextState = state;

    if (result.doc) {
      const tx = executeTimelineTransaction(
        state.historyStack,
        result.doc,
        (d) => d,
        `Timeline Keyboard ${result.actionType}`
      );
      nextState = { ...nextState, doc: tx.document, historyStack: tx.historyStack };
    }

    if (result.selection) {
      nextState = { ...nextState, selection: result.selection };
    }

    if (result.clipboardPayload !== undefined) {
      nextState = { ...nextState, clipboardPayload: result.clipboardPayload };
    }

    if (result.playheadJumpTimeMs !== undefined) {
      nextState = { ...nextState, playheadTimeMs: result.playheadJumpTimeMs };
    }

    return nextState;
  }

  /**
   * Adds a new timeline marker.
   */
  public static handleAddMarker(
    state: TimelineInteractionState,
    timeMs: number,
    label: string
  ): TimelineInteractionState {
    const marker = TimelineMarkersRegionsController.createMarker({ timeMs, label });
    const nextMarkersState = TimelineMarkersRegionsController.addMarker(state.markersState, marker);

    return {
      ...state,
      markersState: nextMarkersState,
    };
  }

  /**
   * Configures timeline loop region.
   */
  public static handleSetLoopRegion(
    state: TimelineInteractionState,
    startTimeMs: number,
    endTimeMs: number,
    enabled: boolean = true
  ): TimelineInteractionState {
    const nextMarkersState = TimelineMarkersRegionsController.setLoopRegion(
      state.markersState,
      startTimeMs,
      endTimeMs,
      enabled
    );

    return {
      ...state,
      markersState: nextMarkersState,
    };
  }
}
