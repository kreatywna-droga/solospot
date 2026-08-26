/**
 * MotionPresetBridge.ts — Sprint S13 Motion Presets Integration Bridge
 *
 * Applies predefined motion animation presets (FadeIn, BounceIn, SlideInRight, Spin, Pulse)
 * as immutable DTO transformations onto AnimationTimeline and BuilderDocument.
 * Connects S13 motion system to PM41 AnimationPresetLibrary.
 *
 * NO DOM, NO React, NO window.
 */

import { AnimationClip, AnimationTimeline, PropertyAnimationTrack } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { getPresetDefinition, listPresetDefinitions } from '../production/AnimationPresetLibrary';

export type BuiltinMotionPresetId =
  | 'fade-in'
  | 'bounce-in'
  | 'slide-in-right'
  | 'spin'
  | 'pulse';

export interface MotionPresetApplyOptions {
  readonly targetNodeId: string;
  readonly durationMs?: number;
  readonly delayMs?: number;
}

export class MotionPresetBridge {
  public static createPresetTimeline(
    presetId: BuiltinMotionPresetId,
    options: MotionPresetApplyOptions
  ): AnimationTimeline {
    const duration = options.durationMs ?? 1000;
    const delay = options.delayMs ?? 0;
    const { targetNodeId } = options;

    let tracks: PropertyAnimationTrack[] = [];

    switch (presetId) {
      case 'fade-in':
        tracks = [
          {
            id: `tr_${targetNodeId}_opacity`,
            propertyKey: 'opacity',
            property: 'opacity',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
              { id: 'kf_1', timeOffset: duration, value: 1, easing: { type: 'ease-out' } },
            ],
          },
        ];
        break;

      case 'bounce-in':
        tracks = [
          {
            id: `tr_${targetNodeId}_scale`,
            propertyKey: 'scaleX',
            property: 'scaleX',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'spring' } },
              { id: 'kf_1', timeOffset: duration, value: 1, easing: { type: 'spring' } },
            ],
          },
        ];
        break;

      case 'slide-in-right':
        tracks = [
          {
            id: `tr_${targetNodeId}_x`,
            propertyKey: 'x',
            property: 'x',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 500, easing: { type: 'ease-out' } },
              { id: 'kf_1', timeOffset: duration, value: 0, easing: { type: 'ease-out' } },
            ],
          },
        ];
        break;

      case 'spin':
        tracks = [
          {
            id: `tr_${targetNodeId}_rot`,
            propertyKey: 'rotation',
            property: 'rotation',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf_1', timeOffset: duration, value: 360, easing: { type: 'linear' } },
            ],
          },
        ];
        break;

      case 'pulse':
        tracks = [
          {
            id: `tr_${targetNodeId}_scaleX`,
            propertyKey: 'scaleX',
            property: 'scaleX',
            keyframes: [
              { id: 'kf_0', timeOffset: 0, value: 1.0, easing: { type: 'ease-out' } },
              { id: 'kf_1', timeOffset: Math.floor(duration / 2), value: 1.2, easing: { type: 'ease-out' } },
              { id: 'kf_2', timeOffset: duration, value: 1.0, easing: { type: 'ease-out' } },
            ],
          },
        ];
        break;
    }

    const clip: AnimationClip = {
      id: `clip_${presetId}_${Date.now()}`,
      name: `Preset ${presetId}`,
      delay,
      duration,
      tracks,
    };

    return {
      id: `tl_${targetNodeId}_${presetId}`,
      targetNodeId,
      trigger: { type: 'onLoad' },
      playback: {
        repeatCount: 1,
        loop: false,
        fillMode: 'forwards',
        direction: 'normal',
      },
      clips: [clip],
    };
  }

  public static getPM41PresetDefinitions() {
    return listPresetDefinitions();
  }

  public static getPM41PresetById(id: string) {
    return getPresetDefinition(id);
  }
}
