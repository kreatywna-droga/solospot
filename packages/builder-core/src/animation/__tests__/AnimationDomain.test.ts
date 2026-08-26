/**
 * AnimationDomain.test.ts — PM29 Domain Layer Unit Tests
 *
 * Node environment — no jsdom required.
 * Verifies AnimationTypes, AnimationValidator, and AnimationSerializer.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import { AnimationValidator } from '../AnimationValidator';
import { AnimationSerializer } from '../AnimationSerializer';

function createValidTimeline(): AnimationTimeline {
  return {
    id: 'timeline-1',
    targetNodeId: 'node-sec-hero',
    trigger: { type: 'inView', threshold: 0.5 },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip-fade-in',
        name: 'Fade In',
        duration: 1000,
        delay: 0,
        tracks: [
          {
            id: 'track-opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf-1', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
            ],
          },
        ],
      },
    ],
  };
}

describe('PM29 — Animation Engine Domain Layer', () => {
  it('should validate a valid timeline structure', () => {
    const timeline = createValidTimeline();
    const result = AnimationValidator.validateTimeline(timeline);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject a timeline with invalid duration or unchronological keyframes', () => {
    const invalidTimeline = createValidTimeline();
    invalidTimeline.clips[0].tracks[0].keyframes[1].timeOffset = -100; // invalid time offset

    const result = AnimationValidator.validateTimeline(invalidTimeline);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should serialize and deserialize a valid timeline without loss of precision', () => {
    const timeline = createValidTimeline();
    const json = AnimationSerializer.serialize(timeline);
    expect(typeof json).toBe('string');

    const deserialized = AnimationSerializer.deserialize(json);
    expect(deserialized.id).toBe(timeline.id);
    expect(deserialized.clips[0].duration).toBe(1000);
    expect(deserialized.clips[0].tracks[0].keyframes).toHaveLength(2);
  });

  it('returns responsive timeline wrapper structure correctly', () => {
    const timeline = createValidTimeline();
    const responsive = AnimationSerializer.toResponsiveTimeline(timeline);
    expect(responsive.desktop).toBeDefined();
    expect(responsive.desktop.id).toBe('timeline-1');
  });
});
