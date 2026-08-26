import { describe, it, expect, vi } from 'vitest';
import { AuthoringStudioSyncBridge } from '../AuthoringStudioSyncBridge';
import { createBuilderDocument, type BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

describe('AuthoringStudioSyncBridge 2-Way Sync (S14 ETAP 6)', () => {
  const mockDoc: BuilderDocument = createBuilderDocument({
    id: 'doc_mock',
    tenantId: 'tenant_mock',
    metadata: { storeName: 'Mock', storeSlug: 'mock', locale: 'en', currency: 'USD' },
  });
  const mockTimeline: AnimationTimeline = {
    id: 'tl1',
    targetNodeId: 'layer1',
    clips: [],
    trigger: { type: 'onLoad' },
    playback: {
      repeatCount: 1,
      loop: false,
      fillMode: 'none',
      direction: 'normal',
    },
  };

  it('notifies subscribers on Inspector property changes', () => {
    const bridge = new AuthoringStudioSyncBridge(mockDoc, mockTimeline);
    const listener = vi.fn();
    bridge.subscribe(listener);

    bridge.notifyInspectorChange('node_1', 'opacity', 0.8);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INSPECTOR_PROP_CHANGED',
        nodeId: 'node_1',
        propertyKey: 'opacity',
        value: 0.8,
      }),
      mockDoc
    );
  });

  it('notifies subscribers on Canvas drag gestures and Timeline updates', () => {
    const bridge = new AuthoringStudioSyncBridge(mockDoc, mockTimeline);
    const listener = vi.fn();
    bridge.subscribe(listener);

    bridge.notifyCanvasGestureTransform('node_1', 'positionX', 250);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CANVAS_GESTURE_TRANSFORM', nodeId: 'node_1', propertyKey: 'positionX', value: 250 }),
      mockDoc
    );

    bridge.notifyTimelineKeyframeUpdate('node_1', 'rotationZ', 45, 300);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TIMELINE_KEYFRAME_UPDATED', nodeId: 'node_1', propertyKey: 'rotationZ', value: 45, timeMs: 300 }),
      mockDoc
    );
  });
});
