/**
 * AnimationTriggerContext.test.ts — PM33 Serializable Trigger Context Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { createTriggerContext } from '../AnimationTriggerContext';

describe('PM33 — AnimationTriggerContext', () => {
  it('creates a complete context from an empty input with safe defaults', () => {
    const ctx = createTriggerContext();
    expect(ctx).toEqual({
      scrollY: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      isHovered: false,
      isClicked: false,
      visibilityRatio: 0,
    });
  });

  it('preserves provided values', () => {
    const ctx = createTriggerContext({
      scrollY: 120,
      viewportWidth: 800,
      viewportHeight: 600,
      isHovered: true,
      isClicked: true,
      visibilityRatio: 0.75,
    });
    expect(ctx.scrollY).toBe(120);
    expect(ctx.viewportWidth).toBe(800);
    expect(ctx.viewportHeight).toBe(600);
    expect(ctx.isHovered).toBe(true);
    expect(ctx.isClicked).toBe(true);
    expect(ctx.visibilityRatio).toBe(0.75);
  });

  it('clamps visibilityRatio to 0..1', () => {
    expect(createTriggerContext({ visibilityRatio: 2 }).visibilityRatio).toBe(1);
    expect(createTriggerContext({ visibilityRatio: -1 }).visibilityRatio).toBe(0);
  });

  it('is fully serializable (JSON round-trip)', () => {
    const ctx = createTriggerContext({
      scrollY: 42,
      viewportWidth: 1024,
      viewportHeight: 768,
      isHovered: true,
      isClicked: false,
      visibilityRatio: 0.5,
    });
    const round = JSON.parse(JSON.stringify(ctx)) as typeof ctx;
    expect(round).toEqual(ctx);
  });
});
