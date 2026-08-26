import { describe, expect, it } from 'vitest';
import { createSelectionState, DEFAULT_SELECTION_STATE } from '../SelectionModel';

describe('SelectionModel DTOs', () => {
  it('should initialize with default selection state', () => {
    expect(DEFAULT_SELECTION_STATE.selectedNodeIds).toEqual([]);
    expect(DEFAULT_SELECTION_STATE.primarySelectedId).toBeNull();
    expect(DEFAULT_SELECTION_STATE.mode).toBe('none');
  });

  it('should create single selection state', () => {
    const state = createSelectionState({ selectedNodeIds: ['node1'] });
    expect(state.selectedNodeIds).toEqual(['node1']);
    expect(state.primarySelectedId).toBe('node1');
    expect(state.mode).toBe('single');
  });

  it('should create multi selection state', () => {
    const state = createSelectionState({ selectedNodeIds: ['n1', 'n2', 'n3'] });
    expect(state.selectedNodeIds.length).toBe(3);
    expect(state.primarySelectedId).toBe('n1');
    expect(state.mode).toBe('multi');
  });
});
