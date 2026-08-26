/**
 * NavigationHistory.ts — Sprint S6 Navigation History
 *
 * Tracks the user's navigational path through the application (panels, open documents)
 * to support backward/forward productivity workflows.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface NavigationRecord {
  readonly recordId: string;
  readonly panelId: string;
  readonly contextId?: string; // e.g. opened project ID or specific view
  readonly timestampMs: number;
}

export interface NavigationHistoryState {
  readonly history: ReadonlyArray<NavigationRecord>;
  readonly currentIndex: number; // Pointer to the current position in history
  readonly maxCapacity: number;
}

export function createNavigationHistoryState(maxCapacity: number = 50): NavigationHistoryState {
  return { history: [], currentIndex: -1, maxCapacity };
}

export function pushNavigationRecord(
  state: NavigationHistoryState,
  panelId: string,
  contextId?: string
): NavigationHistoryState {
  const record: NavigationRecord = {
    recordId: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    panelId,
    contextId,
    timestampMs: Date.now(),
  };

  // If we were not at the end of the history, truncate the future
  const currentHistory = state.currentIndex < state.history.length - 1
    ? state.history.slice(0, state.currentIndex + 1)
    : state.history;

  const nextHistory = [...currentHistory, record];
  
  // Truncate from beginning if we exceed capacity
  const trimmed = nextHistory.length > state.maxCapacity
    ? nextHistory.slice(nextHistory.length - state.maxCapacity)
    : nextHistory;

  return {
    ...state,
    history: trimmed,
    currentIndex: trimmed.length - 1,
  };
}

export function goBack(state: NavigationHistoryState): NavigationHistoryState {
  if (state.currentIndex > 0) {
    return { ...state, currentIndex: state.currentIndex - 1 };
  }
  return state;
}

export function goForward(state: NavigationHistoryState): NavigationHistoryState {
  if (state.currentIndex < state.history.length - 1) {
    return { ...state, currentIndex: state.currentIndex + 1 };
  }
  return state;
}

export function getCurrentNavigation(state: NavigationHistoryState): NavigationRecord | null {
  if (state.currentIndex >= 0 && state.currentIndex < state.history.length) {
    return state.history[state.currentIndex];
  }
  return null;
}
