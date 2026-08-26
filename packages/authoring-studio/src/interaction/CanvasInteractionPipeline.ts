/**
 * CanvasInteractionPipeline.ts — Sprint S23 Closed Interaction Pipeline Engine
 *
 * Implements the mandatory closed 5-step interaction architecture:
 * Screen Space → InteractionCoordinateMapper → World Space → Selection/Transform → HistoryStack → BuilderDocument
 *
 * Guarantees zero duplicate SSOT, zero duplicate transform engine, zero secondary history stack.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BuilderDocument, HistoryStack } from '../../../builder-core/src';
import { Camera } from '../camera/CameraModel';
import { Scene } from '../scene/SceneGraphModel';
import { BoundingBoxModel } from '../selection/BoundingBoxModel';
import { CanvasSelectionController } from '../selection/CanvasSelectionController';
import { CanvasSnappingController, SnappingConfig } from '../selection/CanvasSnappingController';
import { InteractionCoordinateMapper } from '../selection/InteractionCoordinateMapper';
import { SelectionState } from '../selection/SelectionModel';
import { TransformHandles } from '../selection/TransformHandles';
import { TransformHistoryBinding } from '../selection/TransformHistoryBinding';
import { TransformHandleType, TransformInteractionEngine } from '../selection/TransformInteractionEngine';
import { CanvasNavigationController } from '../navigation/CanvasNavigationController';
import { CanvasKeyboardInteractionHandler, KeyboardEventParams } from './CanvasKeyboardInteractionHandler';
import { UserGuide } from '../guides/GuidesRulersModel';

export interface CanvasInteractionState {
  readonly scene: Scene;
  readonly selection: SelectionState;
  readonly camera: Camera;
  readonly document: BuilderDocument;
  readonly historyStack: HistoryStack<BuilderDocument>;
  readonly userGuides: ReadonlyArray<UserGuide>;
  readonly snappingConfig: SnappingConfig;
}

export class CanvasInteractionPipeline {
  /**
   * Processes a pointer down event at screen position (screenX, screenY).
   * Maps Screen Space -> World Space -> Selection state update.
   */
  public static handlePointerDown(
    state: CanvasInteractionState,
    screenPoint: { x: number; y: number },
    modifiers: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean }
  ): { state: CanvasInteractionState; interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN'; activeHandle?: TransformHandleType } {
    const worldPoint = InteractionCoordinateMapper.screenToWorld(screenPoint, state.camera);

    // 1. Check if pointer hits a transform handle on active selection bounding box
    const selectionBounds = BoundingBoxModel.computeSelectionBounds(state.scene, state.selection.selectedNodeIds);
    if (selectionBounds) {
      const activeHandle = TransformHandles.hitTestHandles(selectionBounds, worldPoint);
      if (activeHandle) {
        return {
          state: {
            ...state,
            selection: { ...state.selection, activeHandle },
          },
          interactionType: 'HANDLE',
          activeHandle,
        };
      }
    }

    // 2. Check if pointer hits a scene layer object
    const hitNode = BoundingBoxModel.hitTestScene(state.scene, worldPoint);
    if (hitNode) {
      let nextSelection = state.selection;

      if (modifiers.shiftKey) {
        // Additive selection
        nextSelection = CanvasSelectionController.additiveSelect(state.selection, hitNode.id);
      } else if (modifiers.altKey || modifiers.ctrlKey) {
        // Subtractive selection
        nextSelection = CanvasSelectionController.subtractiveSelect(state.selection, hitNode.id);
      } else {
        // Single select unless node is already selected (to allow dragging multi-selection)
        if (!state.selection.selectedNodeIds.includes(hitNode.id)) {
          nextSelection = CanvasSelectionController.additiveSelect(CanvasSelectionController.deselectAll(), hitNode.id);
        }
      }

      return {
        state: { ...state, selection: nextSelection },
        interactionType: 'SELECT',
      };
    }

    // 3. Pointer clicked empty background -> start Marquee selection
    const marqueeSelection = CanvasSelectionController.startMarquee(worldPoint);
    return {
      state: { ...state, selection: marqueeSelection },
      interactionType: 'MARQUEE',
    };
  }

  /**
   * Processes a pointer move / drag event.
   * Screen Space -> World Space -> Snapping -> Transform / Marquee -> Updated State.
   */
  public static handlePointerMove(
    state: CanvasInteractionState,
    screenPoint: { x: number; y: number },
    prevScreenPoint: { x: number; y: number },
    interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN',
    modifiers: { shiftKey: boolean; altKey: boolean }
  ): { state: CanvasInteractionState; guideLines: ReadonlyArray<any> } {
    const worldPoint = InteractionCoordinateMapper.screenToWorld(screenPoint, state.camera);
    const prevWorldPoint = InteractionCoordinateMapper.screenToWorld(prevScreenPoint, state.camera);

    const rawDx = worldPoint.x - prevWorldPoint.x;
    const rawDy = worldPoint.y - prevWorldPoint.y;

    if (interactionType === 'PAN') {
      const updatedCamera = CanvasNavigationController.pan(state.camera, screenPoint.x - prevScreenPoint.x, screenPoint.y - prevScreenPoint.y);
      return { state: { ...state, camera: updatedCamera }, guideLines: [] };
    }

    if (interactionType === 'MARQUEE') {
      const updatedSelection = CanvasSelectionController.updateMarquee(state.selection, state.scene, worldPoint);
      return { state: { ...state, selection: updatedSelection }, guideLines: [] };
    }

    if (interactionType === 'HANDLE' && state.selection.activeHandle) {
      const handle = state.selection.activeHandle;
      let updatedScene = state.scene;

      if (handle === 'rotate') {
        const bounds = BoundingBoxModel.computeSelectionBounds(state.scene, state.selection.selectedNodeIds);
        if (bounds) {
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;
          const angleRad = Math.atan2(worldPoint.y - centerY, worldPoint.x - centerX);
          let deltaDeg = (angleRad * 180) / Math.PI;

          // Constrain angle to 15deg steps if Shift is held
          if (modifiers.shiftKey) {
            deltaDeg = Math.round(deltaDeg / 15) * 15;
          }

          updatedScene = TransformInteractionEngine.rotateSelection(state.scene, state.selection.selectedNodeIds, deltaDeg);
        }
      } else {
        // Resize handle drag with aspect ratio lock (Shift) and center scale (Alt)
        updatedScene = TransformInteractionEngine.resizeSelection(
          state.scene,
          state.selection.selectedNodeIds,
          handle,
          rawDx,
          rawDy,
          modifiers.shiftKey,
          modifiers.altKey
        );
      }

      return { state: { ...state, scene: updatedScene }, guideLines: [] };
    }

    if (interactionType === 'SELECT' && state.selection.selectedNodeIds.length > 0) {
      // Move active selection with snapping
      const bounds = BoundingBoxModel.computeSelectionBounds(state.scene, state.selection.selectedNodeIds);
      if (!bounds) return { state, guideLines: [] };

      const snapResult = CanvasSnappingController.snapDelta(
        state.scene,
        state.selection.selectedNodeIds,
        bounds,
        rawDx,
        rawDy,
        state.userGuides,
        state.snappingConfig
      );

      const updatedScene = TransformInteractionEngine.moveSelection(
        state.scene,
        state.selection.selectedNodeIds,
        snapResult.snappedDx,
        snapResult.snappedDy
      );

      return {
        state: { ...state, scene: updatedScene },
        guideLines: snapResult.guideLines,
      };
    }

    return { state, guideLines: [] };
  }

  /**
   * Processes pointer up event (finalizing interaction and committing to HistoryStack<BuilderDocument>).
   */
  public static handlePointerUp(
    state: CanvasInteractionState,
    interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN',
    actionLabel: string = 'Canvas Transform'
  ): CanvasInteractionState {
    let nextSelection = state.selection;
    if (interactionType === 'MARQUEE') {
      nextSelection = CanvasSelectionController.endMarquee(state.selection);
    } else if (interactionType === 'HANDLE') {
      nextSelection = { ...state.selection, activeHandle: null };
    }

    // Push updated state to single HistoryStack
    const nextHistory = TransformHistoryBinding.pushTransformState(state.historyStack, state.document, actionLabel);

    return {
      ...state,
      selection: nextSelection,
      historyStack: nextHistory,
    };
  }

  /**
   * Processes keyboard events via CanvasKeyboardInteractionHandler and commits document edits to HistoryStack.
   */
  public static handleKeyDown(
    state: CanvasInteractionState,
    event: KeyboardEventParams
  ): CanvasInteractionState {
    const result = CanvasKeyboardInteractionHandler.handleKeyDown(event, state.scene, state.selection);
    if (!result.handled) return state;

    const nextScene = result.scene ?? state.scene;
    const nextSelection = result.selection ?? state.selection;
    const nextHistory = TransformHistoryBinding.pushTransformState(
      state.historyStack,
      state.document,
      `Keyboard ${result.actionType}`
    );

    return {
      ...state,
      scene: nextScene,
      selection: nextSelection,
      historyStack: nextHistory,
    };
  }
}
