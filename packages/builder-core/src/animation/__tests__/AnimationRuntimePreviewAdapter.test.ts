import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationTriggerEngine } from '../AnimationTriggerEngine';
import { AnimationRuntimePreviewAdapter } from '../AnimationRuntimePreviewAdapter';
import {
  createHoverMessage,
  createClickMessage,
  createIntersectionMessage,
  createScrollMessage,
  createViewportResizeMessage,
} from '../AnimationPreviewContract';

describe('AnimationRuntimePreviewAdapter', () => {
  let engine: AnimationTriggerEngine;
  let adapter: AnimationRuntimePreviewAdapter;

  beforeEach(() => {
    engine = new AnimationTriggerEngine();
    adapter = new AnimationRuntimePreviewAdapter(engine);
  });

  it('processes HOVER message and triggers registered hover animation', () => {
    adapter.registerTrigger('trg-hover', { type: 'hover' });

    const msg = createHoverMessage('btn-cta', true);
    const result = adapter.processMessage(msg);

    expect(result.context.isHovered).toBe(true);
    expect(result.evaluationReport.activatedTriggerIds).toContain('trg-hover');
    expect(result.evaluationReport.states['trg-hover']).toBe('ACTIVE');
  });

  it('processes CLICK message and triggers registered click animation', () => {
    adapter.registerTrigger('trg-click', { type: 'click' });

    const msg = createClickMessage('card-item');
    const result = adapter.processMessage(msg);

    expect(result.context.isClicked).toBe(true);
    expect(result.evaluationReport.activatedTriggerIds).toContain('trg-click');
  });

  it('processes INTERSECTION message and triggers inView animation', () => {
    adapter.registerTrigger('trg-inview', { type: 'inView', threshold: 0.7 });

    const msg = createIntersectionMessage('features-grid', 0.85);
    const result = adapter.processMessage(msg);

    expect(result.context.visibilityRatio).toBe(0.85);
    expect(result.evaluationReport.activatedTriggerIds).toContain('trg-inview');
  });

  it('processes SCROLL message and updates scroll context', () => {
    adapter.registerTrigger('trg-scroll', { type: 'scroll', threshold: 300 });

    const msg = createScrollMessage(300, 0.45);
    const result = adapter.processMessage(msg);

    expect(result.context.scrollY).toBe(300);
    expect(result.evaluationReport.activatedTriggerIds).toContain('trg-scroll');
  });

  it('processes VIEWPORT_RESIZE message', () => {
    const msg = createViewportResizeMessage(375, 667);
    const result = adapter.processMessage(msg);

    expect(result.context.viewportWidth).toBe(375);
    expect(result.context.viewportHeight).toBe(667);
  });

  it('resets engine and context', () => {
    adapter.registerTrigger('trg-hover', { type: 'hover' });
    adapter.processMessage(createHoverMessage('btn-cta', true));

    adapter.reset();

    expect(adapter.context.isHovered).toBe(false);
    expect(engine.stateOf('trg-hover')).toBe('WAITING');
  });
});
