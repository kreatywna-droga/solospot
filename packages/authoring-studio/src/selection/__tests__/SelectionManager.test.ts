import { describe, expect, it } from 'vitest';
import { createScene, createLayer } from '../../scene/SceneGraphModel';
import { SelectionManager } from '../SelectionManager';
import { DEFAULT_SELECTION_STATE } from '../SelectionModel';

describe('SelectionManager State Manager', () => {
  it('should select single node ID', () => {
    const s1 = SelectionManager.selectSingle(DEFAULT_SELECTION_STATE, 'node_A');
    expect(s1.selectedNodeIds).toEqual(['node_A']);
    expect(s1.mode).toBe('single');
  });

  it('should toggle multi-selection when shift clicking', () => {
    let state = SelectionManager.selectSingle(DEFAULT_SELECTION_STATE, 'node_A');
    state = SelectionManager.toggleSelect(state, 'node_B');

    expect(state.selectedNodeIds).toEqual(['node_A', 'node_B']);
    expect(state.mode).toBe('multi');

    // Deselect node_A
    state = SelectionManager.toggleSelect(state, 'node_A');
    expect(state.selectedNodeIds).toEqual(['node_B']);
    expect(state.mode).toBe('single');
  });

  it('should clear selection state', () => {
    let state = SelectionManager.selectSingle(DEFAULT_SELECTION_STATE, 'node_A');
    state = SelectionManager.clearSelection();

    expect(state.selectedNodeIds).toEqual([]);
    expect(state.mode).toBe('none');
  });

  it('should select scene nodes intersecting with marquee box', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const scene = createScene({ id: 's1', layers: { [l1.id]: l1 } });

    const marquee = { startX: 0, startY: 0, currentX: 200, currentY: 200 };
    const sel = SelectionManager.selectByMarquee(scene, marquee);

    expect(sel.selectedNodeIds).toContain('l1');
  });
});
