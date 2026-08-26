/**
 * AnimationSerialization.test.ts — PM35 ETAP 4/5 Serialization Verification
 *
 * Verifies deterministic BuilderDocument → AnimationTimeline DTO → BuilderDocument
 * round-trip with ZERO data loss, ZERO mutation, and deterministic serialization.
 *
 * DCISION-045 — BuilderDocument is the Single Source of Truth for animation data.
 *
 * Pure Node environment (vitest) — no jsdom required.
 */

import { describe, it, expect } from 'vitest';
import { AnimationSerializer } from '../../../../builder-core/src/animation/AnimationSerializer';
import { AnimationValidator } from '../../../../builder-core/src/animation/AnimationValidator';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import {
  applyAnimationToNode,
  inspectNodeAnimation,
} from '../animationDocumentBinding';

function createTestDocument(): BuilderDocument {
  return {
    id: 'store-serial',
    tenantId: 'tenant-serial',
    version: 1,
    createdAt: 1000,
    updatedAt: 1000,
    isDirty: false,
    metadata: { storeName: 'Serial Store', storeSlug: 'serial', locale: 'en', currency: 'USD' },
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
}

function createComplexTimeline(): AnimationTimeline {
  return {
    id: 'timeline-complex',
    targetNodeId: 'sec-hero',
    trigger: { type: 'inView', threshold: 0.75, targetElementId: 'sec-hero' },
    playback: {
      repeatCount: 'infinite',
      loop: true,
      fillMode: 'both',
      direction: 'alternate',
      speed: 1.5,
    },
    clips: [
      {
        id: 'clip-1',
        name: 'Fade In',
        duration: 1200,
        delay: 150,
        tracks: [
          {
            id: 'track-opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
              { id: 'kf-1', timeOffset: 600, value: 0.5, easing: { type: 'linear' } },
              { id: 'kf-2', timeOffset: 1200, value: 1, easing: { type: 'ease-in' } },
            ],
          },
          {
            id: 'track-translate',
            propertyKey: 'transform.translateY',
            keyframes: [
              { id: 'kf-t0', timeOffset: 0, value: 20, easing: { type: 'cubic-bezier', controlPoints: [0.25, 0.1, 0.25, 1] } },
              { id: 'kf-t1', timeOffset: 1200, value: 0, easing: { type: 'spring', stiffness: 100, damping: 10 } },
            ],
          },
        ],
      },
    ],
  };
}

describe('AnimationSerialization (PM35)', () => {
  it('serializes and deserializes a timeline without data loss', () => {
    const timeline = createComplexTimeline();
    const json = AnimationSerializer.serialize(timeline);
    const restored = AnimationSerializer.deserialize(json);

    expect(restored).toEqual(timeline);
    expect(restored.id).toBe('timeline-complex');
    expect(restored.clips).toHaveLength(1);
    expect(restored.clips[0].tracks).toHaveLength(2);
    expect(restored.clips[0].tracks[0].keyframes).toHaveLength(3);
    expect(restored.clips[0].tracks[1].keyframes[0].easing).toEqual({
      type: 'cubic-bezier',
      controlPoints: [0.25, 0.1, 0.25, 1],
    });
  });

  it('produces deterministic serialization output (key order stable)', () => {
    const a = createComplexTimeline();
    const b = createComplexTimeline();
    expect(AnimationSerializer.serialize(a)).toBe(AnimationSerializer.serialize(b));
  });

  it('deserialized timeline passes domain validation', () => {
    const timeline = createComplexTimeline();
    const restored = AnimationSerializer.deserialize(AnimationSerializer.serialize(timeline));
    const validation = AnimationValidator.validateTimeline(restored);
    expect(validation.valid).toBe(true);
  });

  it('rejects serialization of an invalid timeline', () => {
    const invalid = createComplexTimeline();
    // Force invalid: negative delay
    const broken: AnimationTimeline = {
      ...invalid,
      clips: [{ ...invalid.clips[0], delay: -5 }],
    };
    expect(() => AnimationSerializer.serialize(broken)).toThrow();
  });

  it('round-trips BuilderDocument → AnimationTimeline DTO → BuilderDocument with no data loss (DECISION-045)', () => {
    const doc = createTestDocument();
    const timeline = createComplexTimeline();

    const applied = applyAnimationToNode(doc, 'sec-hero', timeline);
    const inspected = inspectNodeAnimation(applied, 'sec-hero');
    expect(inspected).not.toBeNull();

    // Serialize the inspected DTO, then deserialize.
    const json = AnimationSerializer.serialize(inspected!);
    const restored = AnimationSerializer.deserialize(json);

    // Apply the restored DTO back onto the document.
    const roundtripDoc = applyAnimationToNode(applied, 'sec-hero', restored);
    const finalTimeline = inspectNodeAnimation(roundtripDoc, 'sec-hero');

    expect(finalTimeline).toEqual(timeline);
    expect(finalTimeline?.clips[0].tracks[0].keyframes[2].value).toBe(1);
    expect(finalTimeline?.playback.repeatCount).toBe('infinite');
    expect(finalTimeline?.playback.direction).toBe('alternate');
    expect(finalTimeline?.trigger.threshold).toBe(0.75);
  });

  it('does not mutate the source document or timeline (no side effects)', () => {
    const doc = createTestDocument();
    const timeline = createComplexTimeline();

    const docSnapshot = JSON.stringify(doc);
    const timelineSnapshot = JSON.stringify(timeline);

    const applied = applyAnimationToNode(doc, 'sec-hero', timeline);
    const inspected = inspectNodeAnimation(applied, 'sec-hero');
    const json = AnimationSerializer.serialize(inspected!);
    AnimationSerializer.deserialize(json);

    // Original inputs unchanged.
    expect(JSON.stringify(doc)).toBe(docSnapshot);
    expect(JSON.stringify(timeline)).toBe(timelineSnapshot);
  });
});
