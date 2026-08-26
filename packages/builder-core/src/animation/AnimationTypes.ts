/**
 * AnimationTypes.ts — PM29 Animation Engine Domain Model
 *
 * Pure domain interfaces and type definitions for Animation Engine.
 * NO runtime playback, NO DOM manipulation, NO requestAnimationFrame, NO UI components.
 */

export type FillMode = 'none' | 'forwards' | 'backwards' | 'both';
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
export type TriggerType = 'onLoad' | 'inView' | 'hover' | 'click' | 'scroll';

export interface EasingCurve {
  type: 'linear' | 'ease-in' | 'ease-out' | 'cubic-bezier' | 'spring';
  controlPoints?: [number, number, number, number];
  stiffness?: number;
  damping?: number;
}

export interface AnimationKeyframe<T = unknown> {
  id: string;
  timeOffset: number; // Offset in milliseconds from clip start (>= 0)
  value: T;
  easing: EasingCurve;
  easingType?: string; // compatibility alias
  easingParams?: unknown; // compatibility alias
}

export type Keyframe<T = unknown> = AnimationKeyframe<T>;

export interface PropertyAnimationTrack {
  id: string;
  propertyKey: string; // e.g. 'opacity', 'transform.translateY', 'borderColor'
  property?: string;
  keyframes: AnimationKeyframe[];
}

export type Track = PropertyAnimationTrack;

export interface AnimationClip {
  id: string;
  name: string;
  duration: number; // w ms (> 0)
  delay: number;    // w ms (>= 0)
  tracks: PropertyAnimationTrack[];
}

export interface AnimationTrigger {
  readonly type: TriggerType;
  readonly threshold?: number; // For inView/scroll (0.0 - 1.0)
  readonly targetElementId?: string;
}

export interface PlaybackOptions {
  repeatCount: number | 'infinite';
  loop: boolean;
  fillMode: FillMode;
  direction: AnimationDirection;
  speed?: number; // Default 1.0
}

export interface AnimationTimeline {
  id: string;
  targetNodeId: string;
  clips: AnimationClip[];
  trigger: AnimationTrigger;
  playback: PlaybackOptions;
}

export type ResponsiveAnimationTimeline = {
  desktop: AnimationTimeline;
  tablet?: AnimationTimeline;
  mobile?: AnimationTimeline;
};
