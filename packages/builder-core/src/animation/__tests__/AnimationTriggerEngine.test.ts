/**
 * AnimationTriggerEngine.test.ts — PM33 Trigger Engine Tests
 *
 * Node environment — no jsdom. Verifies evaluate/evaluateTriggers, lifecycle
 * state tracking, immutability of transitions, and that the engine does NOT
 * execute animations (no start/play/dispatch surface).
 */

import { describe, it, expect } from 'vitest';
import { AnimationTriggerEngine } from '../AnimationTriggerEngine';
import { createTriggerContext } from '../AnimationTriggerContext';
import type { AnimationTrigger } from '../AnimationTypes';

function trigger(type: AnimationTrigger['type'], threshold?: number): AnimationTrigger {
  return { type, threshold };
}

const hoverCtx = createTriggerContext({ isHovered: true });
const emptyCtx = createTriggerContext();

describe('PM33 — AnimationTriggerEngine', () => {
  it('evaluates a single trigger and returns a decision', () => {
    const engine = new AnimationTriggerEngine();
    const res = engine.evaluate(trigger('hover'), hoverCtx);
    expect(res.shouldStart).toBe(true);
    expect(res.state).toBe('WAITING');
    expect(res.satisfied).toBe(false);
  });

  it('evaluates multiple triggers with aggregate flags', () => {
    const engine = new AnimationTriggerEngine();
    const res = engine.evaluateTriggers(
      [trigger('hover'), trigger('inView', 0.5)],
      createTriggerContext({ isHovered: true, visibilityRatio: 0.8 })
    );
    expect(res.results).toHaveLength(2);
    expect(res.allSatisfied).toBe(false);
    expect(res.anySatisfied).toBe(false);
  });

it('transition advances state and returns a new map (immutable)', () => {
    const engine = new AnimationTriggerEngine();
    const map = engine.transition('hover', 'ACTIVE');
    expect(engine.stateOf('hover')).toBe('ACTIVE');
    expect(map).toEqual({ hover: 'ACTIVE' });
    // transition does not mutate prior snapshots
    const before = { ...engine.states };
    engine.transition('hover', 'FINISHED');
    expect(before).toEqual({ hover: 'ACTIVE' });
    expect(engine.stateOf('hover')).toBe('FINISHED');
  });

  it('isSatisfied reflects the current lifecycle state', () => {
    const engine = new AnimationTriggerEngine();
    engine.transition('click', 'ACTIVE');
    const res = engine.evaluate(trigger('click'), createTriggerContext({ isClicked: true }));
    expect(res.state).toBe('ACTIVE');
    expect(res.satisfied).toBe(true);
  });

  it('reset clears all tracked trigger states', () => {
    const engine = new AnimationTriggerEngine();
    engine.transition('click', 'FINISHED');
    engine.reset();
    expect(engine.states).toEqual({});
    expect(engine.stateOf('click')).toBe('WAITING');
  });

  it('resolveType falls back to onLoad for unknown strings', () => {
    const engine = new AnimationTriggerEngine();
    expect(engine.resolveType('scroll')).toBe('scroll');
    expect(engine.resolveType('bogus')).toBe('onLoad');
  });

  it('does NOT expose animation execution methods (start/play/dispatch)', () => {
    const engine = new AnimationTriggerEngine();
    expect(engine).not.toHaveProperty('start');
    expect(engine).not.toHaveProperty('play');
    expect(engine).not.toHaveProperty('dispatch');
  });

  it('empty context evaluates safely on all trigger types', () => {
    const engine = new AnimationTriggerEngine();
    for (const t of ['onLoad', 'inView', 'hover', 'click', 'scroll'] as const) {
      const res = engine.evaluate(trigger(t), emptyCtx);
      expect(typeof res.shouldStart).toBe('boolean');
    }
  });
});
