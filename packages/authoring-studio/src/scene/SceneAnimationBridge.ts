/**
 * SceneAnimationBridge.ts — Sprint S19 Animation Integration (ETAP 5)
 *
 * Integrates Layer Properties into the existing S13 Motion System:
 * Layer Properties → S13 Motion System → AnimationTimeline → PlaybackSession
 *
 * Zero secondary animation engine!
 * Maps layer animatable properties (opacity, position, scale, rotation, blendMode, visibility)
 * directly to standard AnimationTimeline DTO tracks.
 */

import {
  AnimationClip,
  AnimationKeyframe,
  AnimationTimeline,
  PropertyAnimationTrack,
  TriggerType,
} from '../../../builder-core/src/animation/AnimationTypes';
import { BlendMode, Scene } from './SceneGraphModel';

export type LayerAnimatableProperty =
  | 'opacity'
  | 'transform.x'
  | 'transform.y'
  | 'transform.scaleX'
  | 'transform.scaleY'
  | 'transform.rotationDeg'
  | 'blendMode'
  | 'visible';

export class SceneAnimationBridge {
  /**
   * Builds an AnimationTimeline for a target layer ID.
   */
  public static createLayerTimeline(
    layerId: string,
    tracks: PropertyAnimationTrack[],
    clipName: string = 'LayerAnimation',
    durationMs: number = 1000,
    triggerType: TriggerType = 'onLoad'
  ): AnimationTimeline {
    const clip: AnimationClip = {
      id: `clip_${layerId}_${Date.now()}`,
      name: clipName,
      duration: durationMs,
      delay: 0,
      tracks,
    };

    return {
      id: `timeline_${layerId}`,
      targetNodeId: layerId,
      clips: [clip],
      trigger: {
        type: triggerType,
        targetElementId: layerId,
      },
      playback: {
        repeatCount: 1,
        loop: false,
        fillMode: 'forwards',
        direction: 'normal',
        speed: 1.0,
      },
    };
  }

  /**
   * Builds a PropertyAnimationTrack for a specific layer property key.
   */
  public static createPropertyTrack(
    propertyKey: LayerAnimatableProperty,
    keyframes: AnimationKeyframe[]
  ): PropertyAnimationTrack {
    return {
      id: `track_${propertyKey}_${Date.now()}`,
      propertyKey,
      keyframes,
    };
  }

  /**
   * Applies animated property updates (from S13 Motion System evaluation) onto Scene layer DTOs.
   */
  public static applyEvaluatedProperties(
    scene: Scene,
    layerId: string,
    evaluatedValues: Record<string, unknown>
  ): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    let updated = { ...layer };

    if ('opacity' in evaluatedValues && typeof evaluatedValues.opacity === 'number') {
      updated = { ...updated, opacity: evaluatedValues.opacity };
    }

    if ('blendMode' in evaluatedValues && typeof evaluatedValues.blendMode === 'string') {
      updated = { ...updated, blendMode: evaluatedValues.blendMode as BlendMode };
    }

    if ('visible' in evaluatedValues && typeof evaluatedValues.visible === 'boolean') {
      updated = { ...updated, visible: evaluatedValues.visible };
    }

    let transformUpdated = { ...updated.transform };
    let hasTransformChange = false;

    if ('transform.x' in evaluatedValues && typeof evaluatedValues['transform.x'] === 'number') {
      transformUpdated = { ...transformUpdated, x: evaluatedValues['transform.x'] };
      hasTransformChange = true;
    }

    if ('transform.y' in evaluatedValues && typeof evaluatedValues['transform.y'] === 'number') {
      transformUpdated = { ...transformUpdated, y: evaluatedValues['transform.y'] };
      hasTransformChange = true;
    }

    if ('transform.scaleX' in evaluatedValues && typeof evaluatedValues['transform.scaleX'] === 'number') {
      transformUpdated = { ...transformUpdated, scaleX: evaluatedValues['transform.scaleX'] };
      hasTransformChange = true;
    }

    if ('transform.scaleY' in evaluatedValues && typeof evaluatedValues['transform.scaleY'] === 'number') {
      transformUpdated = { ...transformUpdated, scaleY: evaluatedValues['transform.scaleY'] };
      hasTransformChange = true;
    }

    if ('transform.rotationDeg' in evaluatedValues && typeof evaluatedValues['transform.rotationDeg'] === 'number') {
      transformUpdated = { ...transformUpdated, rotationDeg: evaluatedValues['transform.rotationDeg'] };
      hasTransformChange = true;
    }

    if (hasTransformChange) {
      updated = { ...updated, transform: transformUpdated };
    }

    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: updated,
      },
    };
  }
}
