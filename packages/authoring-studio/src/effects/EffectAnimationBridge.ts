/**
 * EffectAnimationBridge.ts — Sprint S20 Animation Integration (ETAP 5)
 *
 * Integrates Effect & Mask Properties into existing S13 Motion System:
 * Effect/Mask Property → AnimationTimeline → PlaybackSession → RenderingEngine
 *
 * Zero secondary animation engine!
 * Maps animatable effect/mask properties directly to standard AnimationTimeline DTO tracks.
 */

import {
  AnimationClip,
  AnimationKeyframe,
  AnimationTimeline,
  PropertyAnimationTrack,
  TriggerType,
} from '../../../builder-core/src/animation/AnimationTypes';
import { Scene, Layer } from '../scene/SceneGraphModel';
import { EffectStackEngine } from './EffectStackEngine';

export type EffectAnimatableProperty =
  | 'effects.blur.radius'
  | 'effects.dropShadow.blur'
  | 'effects.dropShadow.offsetX'
  | 'effects.dropShadow.offsetY'
  | 'effects.dropShadow.opacity'
  | 'effects.glow.radius'
  | 'effects.glow.intensity'
  | 'effects.colorAdjustment.brightness'
  | 'effects.colorAdjustment.contrast'
  | 'effects.colorAdjustment.saturation'
  | 'effects.colorAdjustment.hue'
  | 'effects.opacity.opacity'
  | 'masks.opacity';

export class EffectAnimationBridge {
  /**
   * Creates a PropertyAnimationTrack for an animatable effect/mask property.
   */
  public static createEffectTrack(
    propertyKey: EffectAnimatableProperty,
    keyframes: AnimationKeyframe[]
  ): PropertyAnimationTrack {
    return {
      id: `track_${propertyKey}_${Date.now()}`,
      propertyKey,
      keyframes,
    };
  }

  /**
   * Builds an AnimationTimeline DTO for a target layer containing effect/mask tracks.
   */
  public static createEffectTimeline(
    layerId: string,
    tracks: PropertyAnimationTrack[],
    clipName: string = 'EffectAnimation',
    durationMs: number = 1000,
    triggerType: TriggerType = 'onLoad'
  ): AnimationTimeline {
    const clip: AnimationClip = {
      id: `clip_effect_${layerId}_${Date.now()}`,
      name: clipName,
      duration: durationMs,
      delay: 0,
      tracks,
    };

    return {
      id: `timeline_effect_${layerId}`,
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
   * Applies evaluated effect/mask property values onto the layer's stack inside Scene Graph.
   */
  public static applyEvaluatedEffectProperties(
    scene: Scene,
    layerId: string,
    evaluatedValues: Record<string, unknown>
  ): Scene {
    const layer = scene.layers[layerId];
    if (!layer) return scene;

    let updatedLayer: Layer = { ...layer };

    // 1. Blur radius
    if ('effects.blur.radius' in evaluatedValues && typeof evaluatedValues['effects.blur.radius'] === 'number') {
      const blurVal = evaluatedValues['effects.blur.radius'];
      const currentFx = updatedLayer.effectStack ?? [];
      const blurFx = currentFx.find((f) => f.type === 'blur');
      if (blurFx) {
        updatedLayer = EffectStackEngine.updateEffect(updatedLayer, blurFx.id, { radius: blurVal });
      }
    }

    // 2. DropShadow properties
    const currentFx = updatedLayer.effectStack ?? [];
    const dsFx = currentFx.find((f) => f.type === 'drop-shadow');
    if (dsFx) {
      const updates: Record<string, unknown> = {};
      if ('effects.dropShadow.blur' in evaluatedValues && typeof evaluatedValues['effects.dropShadow.blur'] === 'number') {
        updates.blur = evaluatedValues['effects.dropShadow.blur'];
      }
      if ('effects.dropShadow.offsetX' in evaluatedValues && typeof evaluatedValues['effects.dropShadow.offsetX'] === 'number') {
        updates.offsetX = evaluatedValues['effects.dropShadow.offsetX'];
      }
      if ('effects.dropShadow.offsetY' in evaluatedValues && typeof evaluatedValues['effects.dropShadow.offsetY'] === 'number') {
        updates.offsetY = evaluatedValues['effects.dropShadow.offsetY'];
      }
      if ('effects.dropShadow.opacity' in evaluatedValues && typeof evaluatedValues['effects.dropShadow.opacity'] === 'number') {
        updates.opacity = evaluatedValues['effects.dropShadow.opacity'];
      }
      if (Object.keys(updates).length > 0) {
        updatedLayer = EffectStackEngine.updateEffect(updatedLayer, dsFx.id, updates);
      }
    }

    // 3. Glow properties
    const glowFx = (updatedLayer.effectStack ?? []).find((f) => f.type === 'glow');
    if (glowFx) {
      const updates: Record<string, unknown> = {};
      if ('effects.glow.radius' in evaluatedValues && typeof evaluatedValues['effects.glow.radius'] === 'number') {
        updates.radius = evaluatedValues['effects.glow.radius'];
      }
      if ('effects.glow.intensity' in evaluatedValues && typeof evaluatedValues['effects.glow.intensity'] === 'number') {
        updates.intensity = evaluatedValues['effects.glow.intensity'];
      }
      if (Object.keys(updates).length > 0) {
        updatedLayer = EffectStackEngine.updateEffect(updatedLayer, glowFx.id, updates);
      }
    }

    // 4. ColorAdjustment properties
    const caFx = (updatedLayer.effectStack ?? []).find((f) => f.type === 'color-adjustment');
    if (caFx) {
      const updates: Record<string, unknown> = {};
      if ('effects.colorAdjustment.brightness' in evaluatedValues && typeof evaluatedValues['effects.colorAdjustment.brightness'] === 'number') {
        updates.brightness = evaluatedValues['effects.colorAdjustment.brightness'];
      }
      if ('effects.colorAdjustment.contrast' in evaluatedValues && typeof evaluatedValues['effects.colorAdjustment.contrast'] === 'number') {
        updates.contrast = evaluatedValues['effects.colorAdjustment.contrast'];
      }
      if ('effects.colorAdjustment.saturation' in evaluatedValues && typeof evaluatedValues['effects.colorAdjustment.saturation'] === 'number') {
        updates.saturation = evaluatedValues['effects.colorAdjustment.saturation'];
      }
      if ('effects.colorAdjustment.hue' in evaluatedValues && typeof evaluatedValues['effects.colorAdjustment.hue'] === 'number') {
        updates.hue = evaluatedValues['effects.colorAdjustment.hue'];
      }
      if (Object.keys(updates).length > 0) {
        updatedLayer = EffectStackEngine.updateEffect(updatedLayer, caFx.id, updates);
      }
    }

    // 5. Opacity effect
    const opFx = (updatedLayer.effectStack ?? []).find((f) => f.type === 'opacity');
    if (opFx && 'effects.opacity.opacity' in evaluatedValues && typeof evaluatedValues['effects.opacity.opacity'] === 'number') {
      updatedLayer = EffectStackEngine.updateEffect(updatedLayer, opFx.id, { opacity: evaluatedValues['effects.opacity.opacity'] });
    }

    // 6. Mask opacity
    if ('masks.opacity' in evaluatedValues && typeof evaluatedValues['masks.opacity'] === 'number') {
      const maskVal = evaluatedValues['masks.opacity'];
      const masks = updatedLayer.maskStack ?? [];
      if (masks.length > 0) {
        updatedLayer = EffectStackEngine.updateMask(updatedLayer, masks[0].id, { opacity: maskVal });
      }
    }

    return {
      ...scene,
      layers: {
        ...scene.layers,
        [layerId]: updatedLayer,
      },
    };
  }
}
