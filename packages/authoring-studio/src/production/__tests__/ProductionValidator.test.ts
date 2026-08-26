import { describe, it, expect } from 'vitest';
import { validateProductionTimeline } from '../AnimationProductionValidator';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-prod',
    tenantId: 'tenant-prod',
    metadata: { storeName: 'Prod Test', storeSlug: 'prod', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-prod',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-valid-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

describe('AnimationProductionValidator (PM41, ETAP 8 & DECISION-074)', () => {
  it('validates a correct production timeline without errors (DECISION-074)', () => {
    const doc = buildDoc();
    const timeline: AnimationTimeline = {
      id: 'tl-prod-valid',
      targetNodeId: 'sec-valid-node',
      trigger: { type: 'onLoad' },
      playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
      clips: [
        {
          id: 'clip-1',
          name: 'Fade',
          duration: 500,
          delay: 0,
          tracks: [
            {
              id: 'tr-1',
              propertyKey: 'opacity',
              keyframes: [
                { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
                { id: 'kf-2', timeOffset: 500, value: 1, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    const result = validateProductionTimeline(doc, timeline);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing target node and ID collisions', () => {
    const doc = buildDoc();
    const timeline: AnimationTimeline = {
      id: 'tl-prod-invalid',
      targetNodeId: 'sec-non-existent', // missing node
      trigger: { type: 'onLoad' },
      playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
      clips: [
        {
          id: 'clip-dup',
          name: 'Clip 1',
          duration: -100, // invalid duration
          delay: 0,
          tracks: [
            {
              id: 'clip-dup', // duplicate ID collision
              propertyKey: 'opacity',
              keyframes: [],
            },
          ],
        },
      ],
    };

    const result = validateProductionTimeline(doc, timeline);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_TARGET_NODE')).toBe(true);
    expect(result.errors.some((e) => e.code === 'INVALID_DURATION')).toBe(true);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(true);
  });
});
