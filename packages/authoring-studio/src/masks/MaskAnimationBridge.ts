/**
 * MaskAnimationBridge.ts — Sprint S20 / G1-21 Mask Animation Integration
 *
 * Connects animatable Mask Properties directly into the core AnimationTimeline model:
 * Mask Property → AnimationTimeline → PlaybackSession → RenderingEngine
 *
 * Strictly adheres to DECISION-042 (Bridge delegation only, zero custom scheduler/runtime).
 * Headless model: NO DOM, NO React, ZERO browser APIs.
 */

import {
  AnimationClip,
  AnimationKeyframe,
  AnimationTimeline,
  PropertyAnimationTrack,
  TriggerType,
} from '../../../builder-core/src/animation/AnimationTypes';
import { Layer } from '../scene/SceneGraphModel';
import { MaskStackEngine, MaskAnimatableProperties } from './MaskStackEngine';

export type MaskAnimatableProperty =
  | 'masks.opacity'
  | 'masks.x'
  | 'masks.y'
  | 'masks.width'
  | 'masks.height'
  | 'masks.rotationDeg'
  | 'masks.scaleX'
  | 'masks.scaleY'
  | 'masks.skewX'
  | 'masks.skewY';

export class MaskAnimationBridge {
  /**
   * Creates a PropertyAnimationTrack for an animatable mask property.
   */
  public static createMaskTrack(
    propertyKey: MaskAnimatableProperty,
    keyframes: AnimationKeyframe[]
  ): PropertyAnimationTrack {
    return {
      id: `track_${propertyKey}_${Date.now()}`,
      propertyKey,
      keyframes,
    };
  }

  /**
   * Builds an AnimationTimeline DTO targeted to a specific layer and mask.
   */
  public static createMaskTimeline(
    layerId: string,
    maskId: string,
    tracks: PropertyAnimationTrack[],
    clipName: string = 'MaskAnimation',
    durationMs: number = 1000,
    triggerType: TriggerType = 'onLoad'
  ): AnimationTimeline {
    const clip: AnimationClip = {
      id: `clip_${maskId}_${Date.now()}`,
      name: clipName,
      duration: durationMs,
      delay: 0,
      tracks,
    };

    return {
      id: `timeline_mask_${maskId}_${Date.now()}`,
      targetNodeId: layerId,
      trigger: {
        type: triggerType,
      },
      playback: {
        repeatCount: 1,
        loop: false,
        direction: 'normal',
        fillMode: 'forwards',
      },
      clips: [clip],
    };
  }

  /**
   * Applies evaluated mask animated properties from a timeline to a target layer's mask stack.
   */
  public static applyMaskAnimationToLayer(
    layer: Layer,
    maskId: string,
    animProps: MaskAnimatableProperties
  ): Layer {
    const currentStack = layer.maskStack ?? [];
    const targetMask = currentStack.find((m) => m.id === maskId);
    if (!targetMask) return layer;

    const evaluated = MaskStackEngine.evaluateMaskAtTime(targetMask, animProps);
    return MaskStackEngine.updateMask(layer, maskId, evaluated);
  }
}
