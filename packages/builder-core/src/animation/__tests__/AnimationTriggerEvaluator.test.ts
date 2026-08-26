/**
 * AnimationTriggerEvaluator.test.ts — PM33 Pure Trigger Evaluator Tests
 *
 * Node environment — no jsdom. Covers the pure `shouldStart` decision logic
 * plus edge cases requested by Architect (scroll at/below threshold,
 * visibility 0/1, empty context, unknown trigger type).
 */

import { describe, it, expect } from 'vitest';
import {
  shouldStart,
  evaluateTrigger,
  resolveTriggerType,
} from '../AnimationTriggerEvaluator';
import { createTriggerContext } from '../AnimationTriggerContext';
import type { AnimationTrigger } from '../AnimationTypes';

function trigger(type: AnimationTrigger['type'], threshold?: number): AnimationTrigger {
  return { type, threshold };
}

const empty = createTriggerContext();

describe('PM33 — AnimationTriggerEvaluator (pure shouldStart)', () => {
  it('onLoad always starts', () => {
    expect(shouldStart(trigger('onLoad'), empty)).toBe(true);
  });

  it('hover → true when hovered, false otherwise', () => {
    expect(shouldStart(trigger('hover'), createTriggerContext({ isHovered: true }))).toBe(true);
    expect(shouldStart(trigger('hover'), createTriggerContext({ isHovered: false }))).toBe(false);
    expect(shouldStart(trigger('hover'), empty)).toBe(false);
  });

  it('click → true when clicked, false otherwise', () => {
    expect(shouldStart(trigger('click'), createTriggerContext({ isClicked: true }))).toBe(true);
    expect(shouldStart(trigger('click'), createTriggerContext({ isClicked: false }))).toBe(false);
    expect(shouldStart(trigger('click'), empty)).toBe(false);
  });

  it('inView fires exactly at the threshold', () => {
    const ctx = createTriggerContext({ visibilityRatio: 0.5 });
    expect(shouldStart(trigger('inView', 0.5), ctx)).toBe(true);
  });

  it('inView fires below/above threshold', () => {
    const below = createTriggerContext({ visibilityRatio: 0.4 });
    const above = createTriggerContext({ visibilityRatio: 0.9 });
    const t = trigger('inView', 0.5);
    expect(shouldStart(t, below)).toBe(false);
    expect(shouldStart(t, above)).toBe(true);
  });

  it('inView uses default threshold 0.5 when none provided', () => {
    expect(shouldStart(trigger('inView'), createTriggerContext({ visibilityRatio: 0.5 }))).toBe(true);
    expect(shouldStart(trigger('inView'), createTriggerContext({ visibilityRatio: 0.49 }))).toBe(false);
  });

  it('visibility 0 → false, visibility 1 → true', () => {
    expect(shouldStart(trigger('inView', 0.5), createTriggerContext({ visibilityRatio: 0 }))).toBe(false);
    expect(shouldStart(trigger('inView', 0.5), createTriggerContext({ visibilityRatio: 1 }))).toBe(true);
  });

  it('scroll fires exactly at the threshold', () => {
    expect(shouldStart(trigger('scroll', 200), createTriggerContext({ scrollY: 200 }))).toBe(true);
  });

  it('scroll fires below/above threshold', () => {
    const above = createTriggerContext({ scrollY: 300 });
    const below = createTriggerContext({ scrollY: 150 });
    const t = trigger('scroll', 200);
    expect(shouldStart(t, above)).toBe(true);
    expect(shouldStart(t, below)).toBe(false);
  });

  it('scroll uses default threshold 0 when none provided', () => {
    expect(shouldStart(trigger('scroll'), createTriggerContext({ scrollY: 0 }))).toBe(true);
    expect(shouldStart(trigger('scroll'), createTriggerContext({ scrollY: 5 }))).toBe(true);
  });

  it('unknown trigger type never starts (safe fallback)', () => {
    const unknown = { type: 'unknown' as AnimationTrigger['type'], threshold: 1 };
    expect(shouldStart(unknown, createTriggerContext({ isHovered: true, isClicked: true, visibilityRatio: 1, scrollY: 9999 }))).toBe(false);
  });

  it('evaluateTrigger returns the resolved type and decision', () => {
    const res = evaluateTrigger(trigger('hover'), createTriggerContext({ isHovered: true }));
    expect(res.shouldStart).toBe(true);
    expect(res.type).toBe('hover');
  });

  it('resolveTriggerType normalizes known types and falls back for unknown', () => {
    expect(resolveTriggerType('onLoad')).toBe('onLoad');
    expect(resolveTriggerType('inView')).toBe('inView');
    expect(resolveTriggerType('hover')).toBe('hover');
    expect(resolveTriggerType('click')).toBe('click');
    expect(resolveTriggerType('scroll')).toBe('scroll');
    expect(resolveTriggerType('whatever')).toBe('onLoad');
  });
});
