/**
 * AnimationValidator.ts — PM29 Domain Validation Engine
 *
 * Pure validation logic for Animation timelines, tracks, clips, and keyframes.
 * Zero external dependencies, zero side effects.
 */

import type { AnimationTimeline, AnimationClip, PropertyAnimationTrack, AnimationKeyframe } from './AnimationTypes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class AnimationValidator {
  /**
   * Validates a complete AnimationTimeline structure.
   */
  public static validateTimeline(timeline: AnimationTimeline): ValidationResult {
    const errors: string[] = [];

    if (!timeline.id || typeof timeline.id !== 'string') {
      errors.push('Timeline must have a valid string id.');
    }

    if (!timeline.targetNodeId || typeof timeline.targetNodeId !== 'string') {
      errors.push('Timeline must specify a valid targetNodeId.');
    }

    if (!Array.isArray(timeline.clips)) {
      errors.push('Timeline clips must be an array.');
    } else {
      timeline.clips.forEach((clip, index) => {
        const clipResult = this.validateClip(clip);
        if (!clipResult.valid) {
          clipResult.errors.forEach((err) => errors.push(`Clip[${index}]: ${err}`));
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates an AnimationClip structure.
   */
  public static validateClip(clip: AnimationClip): ValidationResult {
    const errors: string[] = [];

    if (!clip.id) errors.push('Clip must have an id.');
    if (typeof clip.duration !== 'number' || clip.duration <= 0) {
      errors.push('Clip duration must be a positive number in milliseconds.');
    }

    if (typeof clip.delay !== 'number' || clip.delay < 0) {
      errors.push('Clip delay must be a non-negative number in milliseconds.');
    }

    if (!Array.isArray(clip.tracks)) {
      errors.push('Clip tracks must be an array.');
    } else {
      clip.tracks.forEach((track, index) => {
        const trackResult = this.validateTrack(track, clip.duration);
        if (!trackResult.valid) {
          trackResult.errors.forEach((err) => errors.push(`Track[${index}]: ${err}`));
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a PropertyAnimationTrack structure.
   */
  public static validateTrack(track: PropertyAnimationTrack, maxDuration: number): ValidationResult {
    const errors: string[] = [];

    if (!track.id) errors.push('Track must have an id.');
    if (!track.propertyKey || typeof track.propertyKey !== 'string') {
      errors.push('Track must specify a valid propertyKey.');
    }

    if (!Array.isArray(track.keyframes) || track.keyframes.length === 0) {
      errors.push('Track must contain at least one keyframe.');
    } else {
      let prevTime = -1;
      track.keyframes.forEach((kf, index) => {
        const kfResult = this.validateKeyframe(kf, maxDuration);
        if (!kfResult.valid) {
          kfResult.errors.forEach((err) => errors.push(`Keyframe[${index}]: ${err}`));
        }
        if (kf.timeOffset < prevTime) {
          errors.push(`Keyframe[${index}] timeOffset (${kf.timeOffset}ms) is smaller than previous keyframe (${prevTime}ms). Must be sorted chronologically.`);
        }
        prevTime = kf.timeOffset;
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates an individual AnimationKeyframe.
   */
  public static validateKeyframe(kf: AnimationKeyframe, maxDuration: number): ValidationResult {
    const errors: string[] = [];

    if (!kf.id) errors.push('Keyframe must have an id.');
    if (typeof kf.timeOffset !== 'number' || kf.timeOffset < 0 || kf.timeOffset > maxDuration) {
      errors.push(`Keyframe timeOffset must be between 0 and clip duration (${maxDuration}ms). Got ${kf.timeOffset}ms.`);
    }

    if (kf.value === undefined) {
      errors.push('Keyframe value cannot be undefined.');
    }

    if (!kf.easing || typeof kf.easing.type !== 'string') {
      errors.push('Keyframe must specify a valid easing curve.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
