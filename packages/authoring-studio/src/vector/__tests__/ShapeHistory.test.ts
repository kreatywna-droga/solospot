import { describe, it, expect } from 'vitest';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import { createRectangleNode, VectorNode } from '../VectorDomainModel';
import { VectorEditingEngine } from '../VectorEditingEngine';

describe('ETAP 2 — ShapeHistory Integration', () => {
  it('pushes shape mutation states to HistoryStack and supports undo/redo', () => {
    let docState: VectorNode[] = [];
    let history = createHistoryStack<VectorNode[]>(50);

    // Initial state
    history = history.push(docState, 'Initial State');

    // 1. Create rectangle
    const rect = createRectangleNode('r1', 10, 10, 100, 100);
    docState = [...docState, rect];
    history = history.push(docState, 'Add Rectangle');

    expect(history.canUndo).toBe(true);
    expect(history.peek()).toHaveLength(1);

    // 2. Move rectangle
    const moved = VectorEditingEngine.moveShape(rect, 50, 50);
    docState = [moved];
    history = history.push(docState, 'Move Rectangle');

    expect(history.peek()![0].transform.x).toBe(60);

    // 3. Undo move
    const undoRes1 = history.undo();
    expect(undoRes1).not.toBeNull();
    if (undoRes1) {
      history = undoRes1.stack;
      docState = undoRes1.state;
    }
    expect(docState[0].transform.x).toBe(10);

    // 4. Undo create
    const undoRes2 = history.undo();
    expect(undoRes2).not.toBeNull();
    if (undoRes2) {
      history = undoRes2.stack;
      docState = undoRes2.state;
    }
    expect(docState).toHaveLength(0);

    // 5. Redo create
    const redoRes1 = history.redo();
    expect(redoRes1).not.toBeNull();
    if (redoRes1) {
      history = redoRes1.stack;
      docState = redoRes1.state;
    }
    expect(docState).toHaveLength(1);
  });
});
