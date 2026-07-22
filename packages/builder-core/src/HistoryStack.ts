/**
 * HistoryStack — C6.1-B
 *
 * Generic, pure undo/redo history stack.
 *
 * Design decisions:
 *   - Generic over T (the snapshot type — typically BuilderDocument)
 *   - Stores full snapshots, not deltas, for simplicity
 *   - Immutable update pattern: all operations return a new HistoryStack
 *   - maxEntries prevents unbounded memory growth
 *   - Each entry carries a human-readable label (from commandLabel())
 *     for future "History" panel UI
 *
 * Usage:
 *   let stack = createHistoryStack<BuilderDocument>(50);
 *   stack = stack.push(doc, 'Add hero section');
 *   const result = stack.undo();
 *   if (result) { stack = result.stack; doc = result.state; }
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryEntry<T> {
  readonly id: string;
  readonly label: string;
  readonly timestamp: number;    // Unix ms
  readonly state: T;
}

export interface HistoryStack<T> {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly currentIndex: number;   // index of current state in entries
  readonly entries: ReadonlyArray<HistoryEntry<T>>;
  readonly maxEntries: number;

  /**
   * Push a new state onto the stack.
   * If we are not at the tip (i.e., some undos happened), the redo future
   * is discarded — same behaviour as every editor ever.
   */
  push(state: T, label: string): HistoryStack<T>;

  /**
   * Undo one step. Returns null if at the beginning.
   * Returns { stack, state } where state is the previous document.
   */
  undo(): { stack: HistoryStack<T>; state: T } | null;

  /**
   * Redo one step. Returns null if at the tip.
   */
  redo(): { stack: HistoryStack<T>; state: T } | null;

  /** Peek at the current state without changing the stack. */
  peek(): T | null;

  /** Clear all entries. */
  clear(): HistoryStack<T>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function generateEntryId(): string {
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createHistoryStack<T>(maxEntries = 50): HistoryStack<T> {
  return buildStack<T>([], -1, maxEntries);
}

function buildStack<T>(
  entries: ReadonlyArray<HistoryEntry<T>>,
  currentIndex: number,
  maxEntries: number
): HistoryStack<T> {
  return {
    entries,
    currentIndex,
    maxEntries,

    get canUndo() {
      return currentIndex > 0;
    },

    get canRedo() {
      return currentIndex < entries.length - 1;
    },

    push(state, label) {
      // Discard any redo-future (entries after currentIndex)
      const base = entries.slice(0, currentIndex + 1);

      const entry: HistoryEntry<T> = {
        id: generateEntryId(),
        label,
        timestamp: Date.now(),
        state,
      };

      // Trim to maxEntries
      const next = [...base, entry];
      const trimmed = next.length > maxEntries
        ? next.slice(next.length - maxEntries)
        : next;

      return buildStack<T>(trimmed, trimmed.length - 1, maxEntries);
    },

    undo() {
      if (currentIndex <= 0) return null;
      const prevIndex = currentIndex - 1;
      const prevState = entries[prevIndex].state;
      return {
        stack: buildStack<T>(entries, prevIndex, maxEntries),
        state: prevState,
      };
    },

    redo() {
      if (currentIndex >= entries.length - 1) return null;
      const nextIndex = currentIndex + 1;
      const nextState = entries[nextIndex].state;
      return {
        stack: buildStack<T>(entries, nextIndex, maxEntries),
        state: nextState,
      };
    },

    peek() {
      if (currentIndex < 0 || currentIndex >= entries.length) return null;
      return entries[currentIndex].state;
    },

    clear() {
      return createHistoryStack<T>(maxEntries);
    },
  };
}
