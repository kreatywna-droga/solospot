/**
 * history-stack.test.ts — C6.1-E
 *
 * Tests:
 *   - push
 *   - undo / redo
 *   - canUndo / canRedo flags
 *   - maxEntries trimming
 *   - redo-future discard after push
 *   - peek
 *   - clear
 */

import { describe, it, expect } from 'vitest';
import { createHistoryStack } from '../HistoryStack';

// ---------------------------------------------------------------------------
// push
// ---------------------------------------------------------------------------

describe('HistoryStack.push', () => {
  it('starts empty (canUndo = false, canRedo = false)', () => {
    const stack = createHistoryStack<string>();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
    expect(stack.peek()).toBeNull();
  });

  it('push single entry', () => {
    const s1 = createHistoryStack<number>().push(1, 'init');
    expect(s1.entries).toHaveLength(1);
    expect(s1.currentIndex).toBe(0);
    expect(s1.peek()).toBe(1);
    expect(s1.canUndo).toBe(false);
    expect(s1.canRedo).toBe(false);
  });

  it('push multiple entries increases stack', () => {
    let s = createHistoryStack<number>();
    s = s.push(1, 'one').push(2, 'two').push(3, 'three');
    expect(s.entries).toHaveLength(3);
    expect(s.currentIndex).toBe(2);
    expect(s.peek()).toBe(3);
    expect(s.canUndo).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------

describe('HistoryStack.undo', () => {
  it('undo returns previous state', () => {
    let s = createHistoryStack<string>().push('a', 'A').push('b', 'B');
    const result = s.undo();
    expect(result).not.toBeNull();
    expect(result!.state).toBe('a');
    expect(result!.stack.currentIndex).toBe(0);
    expect(result!.stack.canUndo).toBe(false);
    expect(result!.stack.canRedo).toBe(true);
  });

  it('undo at beginning returns null', () => {
    const s = createHistoryStack<string>().push('a', 'A');
    expect(s.undo()).toBeNull();
  });

  it('multiple undos', () => {
    let s = createHistoryStack<number>()
      .push(10, 'ten')
      .push(20, 'twenty')
      .push(30, 'thirty');

    const r1 = s.undo()!;
    expect(r1.state).toBe(20);
    const r2 = r1.stack.undo()!;
    expect(r2.state).toBe(10);
    expect(r2.stack.undo()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// redo
// ---------------------------------------------------------------------------

describe('HistoryStack.redo', () => {
  it('redo returns next state after undo', () => {
    const base = createHistoryStack<string>().push('a', 'A').push('b', 'B');
    const undone = base.undo()!;
    const redone = undone.stack.redo()!;
    expect(redone.state).toBe('b');
    expect(redone.stack.canRedo).toBe(false);
    expect(redone.stack.canUndo).toBe(true);
  });

  it('redo at tip returns null', () => {
    const s = createHistoryStack<number>().push(1, 'one');
    expect(s.redo()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// redo-future discard
// ---------------------------------------------------------------------------

describe('HistoryStack redo-future discard', () => {
  it('pushing after undo discards redo future', () => {
    let s = createHistoryStack<number>()
      .push(1, 'one')
      .push(2, 'two')
      .push(3, 'three');

    // Stack: [1,2,3], currentIndex=2
    // Undo once → currentIndex=1, state=2; entry[2]=(state=3) is the redo-future
    const afterUndo = s.undo()!.stack;
    expect(afterUndo.canRedo).toBe(true);

    // Push discards redo-future (3), appends 99 → entries: [1, 2, 99]
    const afterPush = afterUndo.push(99, 'ninety-nine');
    expect(afterPush.canRedo).toBe(false);
    expect(afterPush.peek()).toBe(99);
    expect(afterPush.entries).toHaveLength(3); // [1, 2, 99]
    expect(afterPush.entries[2].state).toBe(99);
    expect(afterPush.entries.find(e => e.state === 3)).toBeUndefined(); // (3) discarded
  });
});

// ---------------------------------------------------------------------------
// maxEntries trimming
// ---------------------------------------------------------------------------

describe('HistoryStack maxEntries', () => {
  it('trims to maxEntries', () => {
    let s = createHistoryStack<number>(3);
    s = s.push(1, 'one').push(2, 'two').push(3, 'three').push(4, 'four');
    expect(s.entries).toHaveLength(3);
    expect(s.peek()).toBe(4);
    // oldest entry (1) should be gone
    expect(s.entries[0].state).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// peek
// ---------------------------------------------------------------------------

describe('HistoryStack.peek', () => {
  it('returns null for empty stack', () => {
    expect(createHistoryStack<string>().peek()).toBeNull();
  });

  it('returns current state', () => {
    const s = createHistoryStack<string>().push('x', 'X');
    expect(s.peek()).toBe('x');
  });

  it('peek after undo returns earlier state', () => {
    const s = createHistoryStack<number>().push(1, 'one').push(2, 'two');
    const undone = s.undo()!.stack;
    expect(undone.peek()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('HistoryStack.clear', () => {
  it('empties the stack', () => {
    const s = createHistoryStack<string>().push('a', 'A').push('b', 'B');
    const cleared = s.clear();
    expect(cleared.entries).toHaveLength(0);
    expect(cleared.canUndo).toBe(false);
    expect(cleared.canRedo).toBe(false);
    expect(cleared.peek()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Entry labels
// ---------------------------------------------------------------------------

describe('HistoryStack entry labels', () => {
  it('stores label for each entry', () => {
    const s = createHistoryStack<number>()
      .push(1, 'Add hero')
      .push(2, 'Move section');
    expect(s.entries[0].label).toBe('Add hero');
    expect(s.entries[1].label).toBe('Move section');
  });
});
