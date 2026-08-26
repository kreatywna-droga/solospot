/**
 * ViewportSelectionModel.test.ts — Sprint S31 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createViewportSelectionState,
  setHoveredNode,
  selectNode,
  clearSelection,
} from '../ViewportSelectionModel';
import type { CanvasRenderableNode } from '../ViewportCanvasAdapter';

const mockNodes: CanvasRenderableNode[] = [
  {
    nodeId: 'node-1',
    type: 'card',
    label: 'Card 1',
    layoutRect: { x: 0, y: 0, width: 100, height: 100 },
    viewportRect: { x: 0, y: 0, width: 100, height: 100 },
    isSelected: true,
    isPrimarySelected: true,
    isHovered: false,
  },
];

describe('ViewportSelectionModel', () => {
  it('manages hovered node state and bridges with S22 selection', () => {
    let state = createViewportSelectionState({ renderableNodes: mockNodes });
    expect(state.hoveredNodeId).toBeNull();
    expect(state.s22SelectionState.selectedNodeIds).toHaveLength(0);

    state = setHoveredNode(state, 'node-1', mockNodes);
    expect(state.hoveredNodeId).toBe('node-1');

    state = selectNode(state, 'node-1', false, mockNodes);
    expect(state.s22SelectionState.selectedNodeIds).toEqual(['node-1']);
    expect(state.highlightRects).toHaveLength(1);
    expect(state.highlightRects[0].nodeId).toBe('node-1');

    state = clearSelection(state, mockNodes);
    expect(state.s22SelectionState.selectedNodeIds).toHaveLength(0);
    expect(state.highlightRects).toHaveLength(0);
  });
});
