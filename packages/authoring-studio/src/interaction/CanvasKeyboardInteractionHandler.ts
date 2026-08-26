/**
 * CanvasKeyboardInteractionHandler.ts — Sprint S23 Canvas Keyboard Interaction Handler
 *
 * Pure headless keyboard event handler supporting:
 * - arrow nudging (1px default)
 * - Shift-nudge (10px step)
 * - modifier-based transform constraints (Shift aspect ratio lock, Alt center scale)
 * - duplicate shortcut (Ctrl/Cmd + D)
 * - delete shortcut (Delete / Backspace)
 * - group / ungroup shortcuts (Ctrl/Cmd + G / Ctrl/Cmd + Shift + G)
 * - select all / deselect all (Ctrl/Cmd + A / Escape)
 * - align / distribute keyboard command triggers
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene } from '../scene/SceneGraphModel';
import { LayerOperationsEngine } from '../scene/LayerOperationsEngine';
import { AlignmentEngine, AlignmentType } from '../selection/AlignmentEngine';
import { CanvasSelectionController } from '../selection/CanvasSelectionController';
import { DistributionEngine } from '../selection/DistributionEngine';
import { SelectionState } from '../selection/SelectionModel';
import { TransformInteractionEngine } from '../selection/TransformInteractionEngine';

export interface KeyboardEventParams {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
}

export interface KeyboardActionResult {
  readonly handled: boolean;
  readonly actionType: string;
  readonly scene?: Scene;
  readonly selection?: SelectionState;
}

export class CanvasKeyboardInteractionHandler {
  /**
   * Processes a raw keyboard event parameter object and returns updated scene/selection or handled flag.
   */
  public static handleKeyDown(
    event: KeyboardEventParams,
    scene: Scene,
    selection: SelectionState
  ): KeyboardActionResult {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // 1. Deselect All — Escape
    if (event.key === 'Escape') {
      const updatedSelection = CanvasSelectionController.deselectAll();
      return { handled: true, actionType: 'DESELECT_ALL', selection: updatedSelection };
    }

    // 2. Select All — Ctrl/Cmd + A
    if (isCtrlOrCmd && key === 'a') {
      const updatedSelection = CanvasSelectionController.selectAll(scene);
      return { handled: true, actionType: 'SELECT_ALL', selection: updatedSelection };
    }

    // 3. Duplicate — Ctrl/Cmd + D
    if (isCtrlOrCmd && key === 'd') {
      if (selection.selectedNodeIds.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      let updatedScene = scene;
      const duplicatedIds: string[] = [];

      for (const id of selection.selectedNodeIds) {
        const dupResult = LayerOperationsEngine.duplicateLayer(updatedScene, id);
        updatedScene = dupResult.scene;
        if (dupResult.duplicatedId) {
          duplicatedIds.push(dupResult.duplicatedId);
        }
      }

      const updatedSelection = CanvasSelectionController.additiveSelect(
        CanvasSelectionController.deselectAll(),
        duplicatedIds[0] ?? ''
      );
      const finalSelection = duplicatedIds.length > 1
        ? { ...updatedSelection, selectedNodeIds: duplicatedIds, mode: 'multi' as const }
        : updatedSelection;

      return { handled: true, actionType: 'DUPLICATE', scene: updatedScene, selection: finalSelection };
    }

    // 4. Group / Ungroup — Ctrl/Cmd + G / Ctrl/Cmd + Shift + G
    if (isCtrlOrCmd && key === 'g') {
      if (event.shiftKey) {
        // Ungroup
        const result = CanvasSelectionController.ungroupSelection(scene, selection.selectedNodeIds);
        return { handled: true, actionType: 'UNGROUP', scene: result.scene, selection: result.selection };
      } else {
        // Group
        const result = CanvasSelectionController.groupSelection(scene, selection.selectedNodeIds);
        return { handled: true, actionType: 'GROUP', scene: result.scene, selection: result.selection };
      }
    }

    // 5. Delete — Delete / Backspace
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selection.selectedNodeIds.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }
      let updatedScene = scene;
      for (const id of selection.selectedNodeIds) {
        updatedScene = LayerOperationsEngine.deleteLayer(updatedScene, id);
      }
      const updatedSelection = CanvasSelectionController.deselectAll();
      return { handled: true, actionType: 'DELETE', scene: updatedScene, selection: updatedSelection };
    }

    // 6. Arrow Nudging & Shift-Nudge
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      if (selection.selectedNodeIds.length === 0) {
        return { handled: false, actionType: 'NONE' };
      }

      const step = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (key === 'arrowleft') dx = -step;
      if (key === 'arrowright') dx = step;
      if (key === 'arrowup') dy = -step;
      if (key === 'arrowdown') dy = step;

      const updatedScene = TransformInteractionEngine.moveSelection(scene, selection.selectedNodeIds, dx, dy);
      return {
        handled: true,
        actionType: event.shiftKey ? 'SHIFT_NUDGE' : 'NUDGE',
        scene: updatedScene,
      };
    }

    // 7. Align & Distribute Commands — Ctrl/Cmd + Alt + Key
    if (isCtrlOrCmd && event.altKey) {
      let alignment: AlignmentType | null = null;
      let distributeDir: 'horizontal' | 'vertical' | null = null;

      switch (key) {
        case 'l': alignment = 'align-left'; break;
        case 'c': alignment = 'align-center-h'; break;
        case 'r': alignment = 'align-right'; break;
        case 't': alignment = 'align-top'; break;
        case 'm': alignment = 'align-center-v'; break;
        case 'b': alignment = 'align-bottom'; break;
        case 'h': distributeDir = 'horizontal'; break;
        case 'v': distributeDir = 'vertical'; break;
      }

      if (alignment) {
        const updatedScene = AlignmentEngine.alignSelection(scene, selection.selectedNodeIds, alignment);
        return { handled: true, actionType: `ALIGN_${alignment.toUpperCase()}`, scene: updatedScene };
      }

      if (distributeDir) {
        const updatedScene = DistributionEngine.distributeSelection(scene, selection.selectedNodeIds, distributeDir);
        return { handled: true, actionType: `DISTRIBUTE_${distributeDir.toUpperCase()}`, scene: updatedScene };
      }
    }

    return { handled: false, actionType: 'NONE' };
  }
}
