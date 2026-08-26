import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { createSelectionState } from '../../selection/SelectionModel';
import { CanvasKeyboardInteractionHandler } from '../CanvasKeyboardInteractionHandler';

describe('CanvasKeyboardInteractionHandler', () => {
  const layer1 = createLayer({
    id: 'l1',
    name: 'Layer 1',
    transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
  });
  const layer2 = createLayer({
    id: 'l2',
    name: 'Layer 2',
    transform: { x: 250, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
  });
  const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1, [layer2.id]: layer2 } });
  const selection = createSelectionState({ selectedNodeIds: ['l1'], primarySelectedId: 'l1', mode: 'single' });

  it('should process 1px arrow nudging', () => {
    const res = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'ArrowRight', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
      scene,
      selection
    );

    expect(res.handled).toBe(true);
    expect(res.actionType).toBe('NUDGE');
    expect(res.scene?.layers['l1'].transform.x).toBe(101);
  });

  it('should process 10px Shift-nudging', () => {
    const res = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'ArrowDown', ctrlKey: false, metaKey: false, shiftKey: true, altKey: false },
      scene,
      selection
    );

    expect(res.handled).toBe(true);
    expect(res.actionType).toBe('SHIFT_NUDGE');
    expect(res.scene?.layers['l1'].transform.y).toBe(110);
  });

  it('should handle Ctrl+D duplication shortcut', () => {
    const res = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'd', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      scene,
      selection
    );

    expect(res.handled).toBe(true);
    expect(res.actionType).toBe('DUPLICATE');
    expect(res.selection?.selectedNodeIds.length).toBe(1);
    expect(res.selection?.selectedNodeIds[0]).not.toBe('l1');
  });

  it('should handle Delete shortcut', () => {
    const res = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'Delete', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
      scene,
      selection
    );

    expect(res.handled).toBe(true);
    expect(res.actionType).toBe('DELETE');
    expect(res.scene?.layers['l1']).toBeUndefined();
    expect(res.selection?.selectedNodeIds).toEqual([]);
  });

  it('should handle Ctrl+G grouping and Ctrl+Shift+G ungrouping shortcuts', () => {
    const multiSel = createSelectionState({ selectedNodeIds: ['l1', 'l2'], mode: 'multi' });
    const groupRes = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'g', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false },
      scene,
      multiSel
    );

    expect(groupRes.handled).toBe(true);
    expect(groupRes.actionType).toBe('GROUP');
    expect(groupRes.selection?.selectedNodeIds.length).toBe(1);

    const ungroupRes = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'g', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false },
      groupRes.scene!,
      groupRes.selection!
    );

    expect(ungroupRes.handled).toBe(true);
    expect(ungroupRes.actionType).toBe('UNGROUP');
    expect(ungroupRes.selection?.selectedNodeIds.length).toBe(2);
  });

  it('should handle Ctrl+Alt alignment triggers', () => {
    const multiSel = createSelectionState({ selectedNodeIds: ['l1', 'l2'], mode: 'multi' });
    const alignRes = CanvasKeyboardInteractionHandler.handleKeyDown(
      { key: 'l', ctrlKey: true, metaKey: false, shiftKey: false, altKey: true },
      scene,
      multiSel
    );

    expect(alignRes.handled).toBe(true);
    expect(alignRes.actionType).toBe('ALIGN_ALIGN-LEFT');
  });
});
