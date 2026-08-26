import { describe, it, expect } from 'vitest';
import { ANIMATION_PROPERTY_FIELDS } from '../registry/animationPropertyFields';
import {
  inspectNodeAnimation,
  applyAnimationToNode,
  animationTimelineToInspectorValues,
  inspectorValuesToAnimationTimeline,
} from '../animationDocumentBinding';
import { createAnimationPanelAdapterState, validateAnimationFieldValue } from '../panels/AnimationPanelAdapter';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

describe('AnimationInspectorIntegration (PM35)', () => {
  it('registers all required animation property fields with valid metadata', () => {
    expect(ANIMATION_PROPERTY_FIELDS.length).toBeGreaterThanOrEqual(8);
    const fieldIds = ANIMATION_PROPERTY_FIELDS.map((f) => f.id);

    expect(fieldIds).toContain('animation.trigger.type');
    expect(fieldIds).toContain('animation.trigger.threshold');
    expect(fieldIds).toContain('animation.playback.duration');
    expect(fieldIds).toContain('animation.playback.delay');
    expect(fieldIds).toContain('animation.playback.easing');
    expect(fieldIds).toContain('animation.playback.repeatCount');
    expect(fieldIds).toContain('animation.playback.fillMode');
    expect(fieldIds).toContain('animation.playback.direction');
  });

  it('validates property field input correctly', () => {
    expect(validateAnimationFieldValue('animation.trigger.type', 'hover')).toEqual({ valid: true });
    expect(validateAnimationFieldValue('animation.trigger.type', 'invalid-type')).toHaveProperty('valid', false);

    expect(validateAnimationFieldValue('animation.playback.duration', 1200)).toEqual({ valid: true });
    expect(validateAnimationFieldValue('animation.playback.duration', -50)).toHaveProperty('valid', false);
  });

  it('performs Document Round-trip Serialization (BuilderDocument SSOT DECISION-044)', () => {
    // 1. Setup initial BuilderDocument
    const doc: BuilderDocument = {
      id: 'store-1',
      tenantId: 'tenant-1',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
      isDirty: false,
      metadata: { storeName: 'Test Store', storeSlug: 'test', locale: 'en', currency: 'USD' },
      theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
      pages: [
        {
          id: 'page-home',
          slug: '/',
          name: 'Home',
          isHome: true,
          seo: {},
          sections: [
            {
              id: 'sec-hero',
              type: 'hero',
              label: 'Hero Banner',
              order: 0,
              visible: true,
              locked: false,
              children: [],
              props: { title: 'Welcome' },
            },
          ],
        },
      ],
    };

    // 2. Create initial AnimationTimeline domain object
    const initialTimeline: AnimationTimeline = {
      id: 'timeline-sec-hero',
      targetNodeId: 'sec-hero',
      trigger: { type: 'inView', threshold: 0.75, targetElementId: 'sec-hero' },
      playback: { repeatCount: 2, loop: false, fillMode: 'forwards', direction: 'normal' },
      clips: [
        {
          id: 'clip-sec-hero',
          name: 'Fade In',
          duration: 800,
          delay: 200,
          tracks: [
            {
              id: 'track-opacity',
              propertyKey: 'opacity',
              keyframes: [
                { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
                { id: 'kf-1', timeOffset: 800, value: 1, easing: { type: 'ease-out' } },
              ],
            },
          ],
        },
      ],
    };

    // 3. Apply animation to BuilderDocument
    const updatedDoc = applyAnimationToNode(doc, 'sec-hero', initialTimeline);

    // 4. Extract AnimationTimeline back from BuilderDocument (SSOT)
    const inspectedTimeline = inspectNodeAnimation(updatedDoc, 'sec-hero');
    expect(inspectedTimeline).not.toBeNull();
    expect(inspectedTimeline?.targetNodeId).toBe('sec-hero');

    // 5. Convert domain timeline -> Inspector values
    const inspectorValues = animationTimelineToInspectorValues(inspectedTimeline!);
    expect(inspectorValues['animation.trigger.type']).toBe('inView');
    expect(inspectorValues['animation.playback.duration']).toBe(800);

    // 6. Convert Inspector values -> domain timeline
    const reconstructedTimeline = inspectorValuesToAnimationTimeline('sec-hero', inspectorValues);

    // 7. Apply reconstructed timeline back to document
    const roundtripDoc = applyAnimationToNode(updatedDoc, 'sec-hero', reconstructedTimeline);
    const finalTimeline = inspectNodeAnimation(roundtripDoc, 'sec-hero');

    // 8. Round-trip assertions
    expect(finalTimeline?.targetNodeId).toBe(initialTimeline.targetNodeId);
    expect(finalTimeline?.trigger.type).toBe(initialTimeline.trigger.type);
    expect(finalTimeline?.clips[0].duration).toBe(initialTimeline.clips[0].duration);
    expect(finalTimeline?.clips[0].delay).toBe(initialTimeline.clips[0].delay);
  });

  it('creates panel adapter state with default property values', () => {
    const adapterState = createAnimationPanelAdapterState();
    expect(adapterState.fields.length).toBeGreaterThan(0);
    expect(adapterState.values['animation.trigger.type']).toBe('onLoad');
    expect(adapterState.values['animation.playback.duration']).toBe(1000);
  });
});
