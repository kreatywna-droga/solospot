/**
 * CameraAnimationBridge.ts — Sprint S21 Camera Animation Integration (ETAP 6)
 *
 * Integrates Camera Properties into existing S13 Motion System:
 * Camera Properties → AnimationTimeline → PlaybackSession → RenderingEngine
 *
 * Zero secondary animation engine!
 * Maps animatable camera properties directly to standard AnimationTimeline DTO tracks.
 */

import {
  AnimationClip,
  AnimationKeyframe,
  AnimationTimeline,
  EasingCurve,
  PropertyAnimationTrack,
  TriggerType,
} from '../../../builder-core/src/animation/AnimationTypes';
import { Camera } from './CameraModel';

export type CameraAnimatableProperty =
  | 'camera.position.x'
  | 'camera.position.y'
  | 'camera.zoom'
  | 'camera.rotationDeg';

export class CameraAnimationBridge {
  /**
   * Builds a PropertyAnimationTrack for an animatable camera property.
   */
  public static createCameraTrack(
    propertyKey: CameraAnimatableProperty,
    keyframes: ReadonlyArray<
      | AnimationKeyframe
      | { id?: string; time?: number; timeOffset?: number; value: unknown; easing?: EasingCurve | string }
    >
  ): PropertyAnimationTrack {
    const normalizedKeyframes: AnimationKeyframe[] = keyframes.map((k, idx) => ({
      id: k.id ?? `kf_${idx}`,
      timeOffset: k.timeOffset ?? (k as any).time ?? 0,
      value: k.value,
      easing: typeof k.easing === 'string'
        ? { type: k.easing as any }
        : (k.easing ?? { type: 'linear' }),
    }));

    return {
      id: `track_${propertyKey}_${Date.now()}`,
      propertyKey,
      keyframes: normalizedKeyframes,
    };
  }

  /**
   * Builds an AnimationTimeline DTO for a target Camera ID.
   */
  public static createCameraTimeline(
    cameraId: string,
    tracks: PropertyAnimationTrack[],
    clipName: string = 'CameraAnimation',
    durationMs: number = 1000,
    triggerType: TriggerType = 'onLoad'
  ): AnimationTimeline {
    const clip: AnimationClip = {
      id: `clip_cam_${cameraId}_${Date.now()}`,
      name: clipName,
      duration: durationMs,
      delay: 0,
      tracks,
    };

    return {
      id: `timeline_cam_${cameraId}`,
      targetNodeId: cameraId,
      clips: [clip],
      trigger: {
        type: triggerType,
        targetElementId: cameraId,
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
   * Applies evaluated camera property values onto a Camera instance.
   */
  public static applyEvaluatedCameraProperties(
    camera: Camera,
    evaluatedValues: Record<string, unknown>
  ): Camera {
    let newX = camera.transform.position.x;
    let newY = camera.transform.position.y;
    let newZoom = camera.transform.zoom;
    let newRot = camera.transform.rotationDeg;

    if ('camera.position.x' in evaluatedValues && typeof evaluatedValues['camera.position.x'] === 'number') {
      newX = evaluatedValues['camera.position.x'];
    }

    if ('camera.position.y' in evaluatedValues && typeof evaluatedValues['camera.position.y'] === 'number') {
      newY = evaluatedValues['camera.position.y'];
    }

    if ('camera.zoom' in evaluatedValues && typeof evaluatedValues['camera.zoom'] === 'number') {
      newZoom = evaluatedValues['camera.zoom'];
    }

    if ('camera.rotationDeg' in evaluatedValues && typeof evaluatedValues['camera.rotationDeg'] === 'number') {
      newRot = evaluatedValues['camera.rotationDeg'];
    }

    return {
      ...camera,
      transform: {
        position: { ...camera.transform.position, x: newX, y: newY },
        zoom: newZoom,
        rotationDeg: newRot,
      },
    };
  }
}
