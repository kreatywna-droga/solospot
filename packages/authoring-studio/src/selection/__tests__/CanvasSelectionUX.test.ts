import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { CanvasSelectionController } from '../CanvasSelectionController';
import { createSelectionState } from '../SelectionModel';

describe('CanvasSelectionController', () => {
  const layer1 = createLayer({ id: 'l1', name: 'Layer 1', transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 } });
  const layer2 = createLayer({ id: 'l2', name: 'Layer 2', transform: { x: 150, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 } });
  const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1, [layer2.id]: layer2 } });

  it('should handle marquee selection workflow', () => {
    const startState = CanvasSelectionController.startMarquee({ x: 0, y: 0 });
    expect(startState.mode).toBe('marquee');

    const updatedState = CanvasSelectionController.updateMarquee(startState, scene, { x: 120, y: 120 });
    expect(updatedState.selectedNodeIds).toContain('l1');

    const endedState = CanvasSelectionController.endMarquee(updatedState);
    expect(endedState.marquee).toBeNull();
    expect(endedState.selectedNodeIds).toEqual(['l1']);
  });

  it('should perform additive selection', () => {
    let sel = createSelectionState({ selectedNodeIds: ['l1'] });
    sel = CanvasSelectionController.additiveSelect(sel, 'l2');
    expect(sel.selectedNodeIds).toEqual(['l1', 'l2']);
    expect(sel.mode).toBe('multi');
  });

  it('should perform subtractive selection', () => {
    let sel = createSelectionState({ selectedNodeIds: ['l1', 'l2'] });
    sel = CanvasSelectionController.subtractiveSelect(sel, 'l1');
    expect(sel.selectedNodeIds).toEqual(['l2']);
    expect(sel.mode).toBe('single');
  });

  it('should select all and deselect all visible layers', () => {
    const allSelected = CanvasSelectionController.selectAll(scene);
    expect(allSelected.selectedNodeIds).toEqual(['l1', 'l2']);

    const deselected = CanvasSelectionController.deselectAll();
    expect(deselected.selectedNodeIds).toEqual([]);
    expect(deselected.mode).toBe('none');
  });

  it('should group and ungroup selection', () => {
    const grouped = CanvasSelectionController.groupSelection(scene, ['l1', 'l2']);
    const groupId = grouped.selection.selectedNodeIds[0];
    expect(grouped.selection.selectedNodeIds).toHaveLength(1);

    const ungrouped = CanvasSelectionController.ungroupSelection(grouped.scene, [groupId]);
    expect(ungrouped.selection.selectedNodeIds).toContain('l1');
    expect(ungrouped.selection.selectedNodeIds).toContain('l2');
  });
});
