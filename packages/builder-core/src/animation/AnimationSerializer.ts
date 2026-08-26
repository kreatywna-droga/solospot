/**
 * AnimationSerializer.ts — PM29 DTO & Serialization Layer
 *
 * Provides pure JSON serialization, deserialization, and schema migration
 * helpers for Animation timelines.
 */

import type { AnimationTimeline, ResponsiveAnimationTimeline } from './AnimationTypes';
import { AnimationValidator } from './AnimationValidator';

export class AnimationSerializer {
  /**
   * Serializes an AnimationTimeline to a JSON string.
   */
  public static serialize(timeline: AnimationTimeline): string {
    const validation = AnimationValidator.validateTimeline(timeline);
    if (!validation.valid) {
      throw new Error(`Cannot serialize invalid timeline: ${validation.errors.join(', ')}`);
    }
    return JSON.stringify(timeline, null, 2);
  }

  /**
   * Deserializes a JSON string into an AnimationTimeline object.
   */
  public static deserialize(jsonString: string): AnimationTimeline {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`JSON parse error during animation timeline deserialization: ${(e as Error).message}`);
    }

    const timeline = parsed as AnimationTimeline;
    const validation = AnimationValidator.validateTimeline(timeline);
    if (!validation.valid) {
      throw new Error(`Deserialized timeline is invalid: ${validation.errors.join(', ')}`);
    }

    return timeline;
  }

  /**
   * Wraps a single timeline into a ResponsiveAnimationTimeline structure.
   */
  public static toResponsiveTimeline(desktopTimeline: AnimationTimeline): ResponsiveAnimationTimeline {
    return {
      desktop: desktopTimeline,
    };
  }
}
