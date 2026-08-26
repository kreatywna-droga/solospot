import { describe, it, expect } from 'vitest';
import { executeFullInteractiveUserFlow } from '../InteractiveUserFlows';
import type { BuilderDocument } from '../../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../../builder-core/src/animation/AnimationTypes';

function makeDoc(): BuilderDocument {
  return {
    id: 'doc-flow-1',
    tenantId: 'tenant-1',
    version: 1,
    isDirty: false,
    pages: [],
    metadata: { storeName: 'FlowTest', storeSlug: 'flow-test', locale: 'en', currency: 'USD' },
    theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
    updatedAt: Date.now(),
  } as unknown as BuilderDocument;
}

function makeTimeline(): AnimationTimeline {
  return {
    id: 'tl-flow-1',
    targetNodeId: 'sec-1',
    clips: [
      {
        id: 'clip-1',
        name: 'Fade In',
        delay: 0,
        duration: 1000,
        easing: 'ease-in-out',
        tracks: [
          {
            id: 'track-1',
            property: 'opacity',
            keyframes: [
              { id: 'kf-1', timeOffset: 0, value: 0, easing: 'linear' },
              { id: 'kf-2', timeOffset: 1000, value: 1, easing: 'linear' },
            ],
          },
        ],
      },
    ],
  } as unknown as AnimationTimeline;
}

describe('InteractiveUserFlows (Sprint S4, ETAP 6)', () => {
  it('executes full Create → Edit → Export → Publish flow successfully', () => {
    const doc = makeDoc();
    const timeline = makeTimeline();

    const result = executeFullInteractiveUserFlow(doc, timeline, 'test-user');

    expect(result.isFlowSuccessful).toBe(true);
    expect(result.finalDocument.version).toBeGreaterThan(doc.version);
    expect(result.exportJson).toContain('tl-flow-1');
    expect(result.publishResult.success).toBe(true);
    expect(result.publishResult.manifest.projectId).toBe('doc-flow-1');
  });
});
