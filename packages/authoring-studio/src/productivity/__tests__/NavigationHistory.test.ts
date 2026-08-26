import { describe, it, expect } from 'vitest';
import {
  createNavigationHistoryState,
  pushNavigationRecord,
  goBack,
  goForward,
  getCurrentNavigation,
} from '../NavigationHistory';

describe('NavigationHistory (Sprint S6)', () => {
  it('pushes records and navigates back and forward', () => {
    let state = createNavigationHistoryState(5);
    
    state = pushNavigationRecord(state, 'panel-1');
    state = pushNavigationRecord(state, 'panel-2');
    state = pushNavigationRecord(state, 'panel-3');
    
    expect(state.history).toHaveLength(3);
    expect(state.currentIndex).toBe(2);
    expect(getCurrentNavigation(state)?.panelId).toBe('panel-3');

    // Go Back
    state = goBack(state);
    expect(state.currentIndex).toBe(1);
    expect(getCurrentNavigation(state)?.panelId).toBe('panel-2');

    // Go Forward
    state = goForward(state);
    expect(state.currentIndex).toBe(2);
    expect(getCurrentNavigation(state)?.panelId).toBe('panel-3');
  });

  it('truncates future history when pushing from middle', () => {
    let state = createNavigationHistoryState();
    state = pushNavigationRecord(state, 'p1');
    state = pushNavigationRecord(state, 'p2');
    state = pushNavigationRecord(state, 'p3');

    state = goBack(state); // back to p2
    
    // Now push p4, p3 should be dropped
    state = pushNavigationRecord(state, 'p4');
    expect(state.history).toHaveLength(3);
    expect(state.history[2].panelId).toBe('p4');
    expect(state.currentIndex).toBe(2);
  });
});
