import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationTriggerEngine } from '../AnimationTriggerEngine';
import { AnimationPlaybackController } from '../AnimationPlaybackController';
import { AnimationTriggerBridge } from '../AnimationTriggerBridge';
import { createHoverMessage } from '../AnimationPreviewContract';
import { AnimationRuntimePreviewAdapter } from '../AnimationRuntimePreviewAdapter';

describe('AnimationTriggerBridge', () => {
  let engine: AnimationTriggerEngine;
  let adapter: AnimationRuntimePreviewAdapter;
  let bridge: AnimationTriggerBridge;
  let controller: AnimationPlaybackController;

  beforeEach(() => {
    engine = new AnimationTriggerEngine();
    adapter = new AnimationRuntimePreviewAdapter(engine);
    bridge = new AnimationTriggerBridge();
    controller = new AnimationPlaybackController({ duration: 1000 });
  });

  it('binds trigger ID to playback controller and starts playback on trigger activation', () => {
    adapter.registerTrigger('trg-1', { type: 'hover' });
    bridge.bind('trg-1', controller);

    expect(controller.status).toBe('idle');

    const result = adapter.processMessage(createHoverMessage('btn-cta', true));
    const startedIds = bridge.handleReport(result.evaluationReport);

    expect(startedIds).toContain('trg-1');
    expect(controller.status).toBe('playing');
  });

  it('unbinds trigger ID', () => {
    adapter.registerTrigger('trg-1', { type: 'hover' });
    bridge.bind('trg-1', controller);
    bridge.unbind('trg-1');

    const result = adapter.processMessage(createHoverMessage('btn-cta', true));
    const startedIds = bridge.handleReport(result.evaluationReport);

    expect(startedIds).toEqual([]);
    expect(controller.status).toBe('idle');
  });

  it('resets bound controllers', () => {
    adapter.registerTrigger('trg-1', { type: 'hover' });
    bridge.bind('trg-1', controller);

    const result = adapter.processMessage(createHoverMessage('btn-cta', true));
    bridge.handleReport(result.evaluationReport);

    expect(controller.status).toBe('playing');

    bridge.resetAll();
    expect(controller.status).toBe('idle');
  });
});
