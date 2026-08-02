/**
 * SelectionEvents — C16.4
 *
 * Event-driven notifications for Selection state changes.
 *
 * Architecture:
 *   SelectionEngine.reduceSelection() → returns new state
 *   ↓
 *   If state changed, emit SelectionEvent
 *   ↓
 *   Inspector, Layers, MiniMap, AI, Analytics, Collaboration subscribe
 *
 * This decouples consumers from the reducer.
 * Consumers never poll state — they react to events.
 */

import { SelectionState } from './CanvasState';

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type SelectionEventType =
  | 'SELECTION_CHANGED'         // any selection change
  | 'PRIMARY_SELECTION_CHANGED' // primarySelectionId changed
  | 'SELECTION_CLEARED'         // all deselected
  | 'SELECTION_MODE_CHANGED'    // SINGLE ↔ MULTI ↔ RANGE ↔ BOX
  | 'HOVER_CHANGED'             // hoveredId changed
  | 'BREADCRUMBS_CHANGED';      // breadcrumbs changed

export interface SelectionEvent {
  readonly type: SelectionEventType;
  readonly state: SelectionState;
  readonly prevState: SelectionState;
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

export type SelectionEventHandler = (event: SelectionEvent) => void;

export interface SelectionEventBus {
  subscribe(handler: SelectionEventHandler): () => void;
  unsubscribe(handler: SelectionEventHandler): void;
  emit(event: SelectionEvent): void;
  clear(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSelectionEventBus(): SelectionEventBus {
  const handlers = new Set<SelectionEventHandler>();

  return {
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    unsubscribe(handler) {
      handlers.delete(handler);
    },

    emit(event) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch {
          // Isolate consumer errors — one broken subscriber
          // must not crash the entire bus.
        }
      });
    },

    clear() {
      handlers.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Event detection — compares two SelectionState snapshots
// and emits appropriate events
// ---------------------------------------------------------------------------

export function detectSelectionEvents(
  prev: SelectionState,
  next: SelectionState,
  bus: SelectionEventBus
): void {
  const now = Date.now();

  // Selection changed (any)
  const selectionChanged = prev.selectedIds !== next.selectedIds
    || prev.primarySelectionId !== next.primarySelectionId;

  if (selectionChanged) {
    // Primary changed
    if (prev.primarySelectionId !== next.primarySelectionId) {
      bus.emit({
        type: 'PRIMARY_SELECTION_CHANGED',
        state: next,
        prevState: prev,
        timestamp: now,
      });
    }

    // Cleared
    if (prev.selectedIds.length > 0 && next.selectedIds.length === 0) {
      bus.emit({
        type: 'SELECTION_CLEARED',
        state: next,
        prevState: prev,
        timestamp: now,
      });
    }

    // General changes
    bus.emit({
      type: 'SELECTION_CHANGED',
      state: next,
      prevState: prev,
      timestamp: now,
    });
  }

  // Mode changed
  if (prev.selectionMode !== next.selectionMode) {
    bus.emit({
      type: 'SELECTION_MODE_CHANGED',
      state: next,
      prevState: prev,
      timestamp: now,
    });
  }

  // Hover changed
  if (prev.hoveredId !== next.hoveredId) {
    bus.emit({
      type: 'HOVER_CHANGED',
      state: next,
      prevState: prev,
      timestamp: now,
    });
  }

  // Breadcrumbs changed
  if (prev.breadcrumbs !== next.breadcrumbs) {
    bus.emit({
      type: 'BREADCRUMBS_CHANGED',
      state: next,
      prevState: prev,
      timestamp: now,
    });
  }
}

