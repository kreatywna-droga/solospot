/**
 * AnimationTriggerState.test.ts — PM33 Trigger State Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import {
  createTriggerStateMap,
  createTriggerState,
  transitionTriggerState,
  getTriggerState,
  isTriggerSatisfied,
} from '../AnimationTriggerState';

describe('PM33 — AnimationTriggerState', () => {
  it('creates an empty state map by default', () => {
    const map = createTriggerStateMap();
    expect(map).toEqual({});
  });

  it('creates a single trigger state entry', () => {
    const entry = createTriggerState('onLoad', 'ACTIVE');
    expect(entry).toEqual({ onLoad: 'ACTIVE' });
  });

  it('defaults a created trigger state to WAITING', () => {
    const entry = createTriggerState('hover');
    expect(entry).toEqual({ hover: 'WAITING' });
  });

  it('transition returns a new map without mutating the input', () => {
    const initial = createTriggerStateMap();
    const next = transitionTriggerState(initial, 'click', 'ACTIVE');
    expect(next).toEqual({ click: 'ACTIVE' });
    expect(initial).toEqual({});
  });

  it('getTriggerState returns WAITING for an unknown key', () => {
    expect(getTriggerState(createTriggerStateMap(), 'scroll')).toBe('WAITING');
  });

  it('getTriggerState returns the stored state for a known key', () => {
    const map = transitionTriggerState(createTriggerStateMap(), 'inView', 'FINISHED');
    expect(getTriggerState(map, 'inView')).toBe('FINISHED');
  });

  it('only ACTIVE is considered satisfied', () => {
    expect(isTriggerSatisfied('ACTIVE')).toBe(true);
    expect(isTriggerSatisfied('WAITING')).toBe(false);
    expect(isTriggerSatisfied('FINISHED')).toBe(false);
    expect(isTriggerSatisfied('PAUSED')).toBe(false);
  });
});
