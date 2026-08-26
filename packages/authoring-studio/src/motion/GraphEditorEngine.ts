/**
 * GraphEditorEngine.ts — Sprint S14 Graph Editor Domain Engine
 *
 * Provides pure mathematical evaluation and graph geometry for the Graph Editor.
 * Evaluates Value Graphs and Speed Graphs (velocity numerical derivatives) using S13 AdvancedMotionCurves.
 * Zero duplicate evaluators — strictly delegates easing/derivatives to AdvancedMotionCurves.
 */

import { AdvancedMotionCurves } from './AdvancedMotionCurves';
import type { AnimationKeyframe, PropertyAnimationTrack } from '../../../builder-core/src/animation/AnimationTypes';

export type GraphMode = 'value' | 'speed';
export type TangentMode = 'auto' | 'smooth' | 'linear' | 'step';

export interface GraphViewport {
  readonly startTimeMs: number;
  readonly endTimeMs: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface GraphPoint {
  readonly timeMs: number;
  readonly value: number;
  readonly speed: number;
  readonly xPx: number;
  readonly yPx: number;
}

export interface CurvePlotData {
  readonly trackId: string;
  readonly propertyKey: string;
  readonly color: string;
  readonly points: readonly GraphPoint[];
}

export interface KeyframeTangentHandle {
  readonly keyframeId: string;
  readonly timeMs: number;
  readonly value: number;
  readonly handleIn: { x: number; y: number };
  readonly handleOut: { x: number; y: number };
  readonly tangentMode: TangentMode;
}

export class GraphEditorEngine {
  /**
   * Transforms a time in ms to pixel X coordinate.
   */
  public static timeToPx(timeMs: number, viewport: GraphViewport): number {
    const range = viewport.endTimeMs - viewport.startTimeMs || 1;
    return ((timeMs - viewport.startTimeMs) / range) * viewport.widthPx;
  }

  /**
   * Transforms a pixel X coordinate to time in ms.
   */
  public static pxToTime(xPx: number, viewport: GraphViewport): number {
    const range = viewport.endTimeMs - viewport.startTimeMs;
    return viewport.startTimeMs + (xPx / viewport.widthPx) * range;
  }

  /**
   * Transforms a numeric value to pixel Y coordinate (inverted Y axis).
   */
  public static valueToPx(val: number, viewport: GraphViewport): number {
    const range = viewport.maxValue - viewport.minValue || 1;
    return viewport.heightPx - ((val - viewport.minValue) / range) * viewport.heightPx;
  }

  /**
   * Transforms a pixel Y coordinate to numeric value.
   */
  public static pxToValue(yPx: number, viewport: GraphViewport): number {
    const range = viewport.maxValue - viewport.minValue;
    return viewport.maxValue - (yPx / viewport.heightPx) * range;
  }

  /**
   * Evaluates plot points for a track across the viewport time range using S13 AdvancedMotionCurves.
   */
  public static plotTrackCurve(
    track: PropertyAnimationTrack,
    viewport: GraphViewport,
    mode: GraphMode = 'value',
    samples: number = 100,
    color: string = '#6366f1'
  ): CurvePlotData {
    const points: GraphPoint[] = [];
    const step = (viewport.endTimeMs - viewport.startTimeMs) / Math.max(1, samples);

    for (let i = 0; i <= samples; i++) {
      const tMs = viewport.startTimeMs + i * step;
      const val = this.evaluateTrackValueAtTime(track, tMs);
      const speed = this.evaluateTrackSpeedAtTime(track, tMs);

      const displayVal = mode === 'speed' ? speed : val;
      const xPx = this.timeToPx(tMs, viewport);
      const yPx = this.valueToPx(displayVal, viewport);

      points.push({
        timeMs: tMs,
        value: val,
        speed,
        xPx,
        yPx,
      });
    }

    return {
      trackId: track.id,
      propertyKey: track.propertyKey,
      color,
      points,
    };
  }

  /**
   * Evaluates the property value at a specific time in ms across track keyframes.
   */
  public static evaluateTrackValueAtTime(track: PropertyAnimationTrack, timeMs: number): number {
    if (track.keyframes.length === 0) return 0;
    const getNumVal = (kf: AnimationKeyframe<unknown>): number =>
      typeof kf.value === 'number' ? kf.value : Number(kf.value) || 0;

    if (track.keyframes.length === 1) return getNumVal(track.keyframes[0]);

    const kfs = [...track.keyframes].sort((a, b) => a.timeOffset - b.timeOffset);

    if (timeMs <= kfs[0].timeOffset) return getNumVal(kfs[0]);
    if (timeMs >= kfs[kfs.length - 1].timeOffset) return getNumVal(kfs[kfs.length - 1]);

    for (let i = 0; i < kfs.length - 1; i++) {
      const kfStart = kfs[i];
      const kfEnd = kfs[i + 1];

      if (timeMs >= kfStart.timeOffset && timeMs <= kfEnd.timeOffset) {
        const duration = kfEnd.timeOffset - kfStart.timeOffset;
        if (duration === 0) return getNumVal(kfStart);

        const normalizedT = (timeMs - kfStart.timeOffset) / duration;
        const easedT = this.evaluateKeyframeEasing(kfStart, normalizedT);
        const vStart = getNumVal(kfStart);
        const vEnd = getNumVal(kfEnd);

        return vStart + (vEnd - vStart) * easedT;
      }
    }

    return getNumVal(kfs[0]);
  }

  /**
   * Evaluates the track speed (numerical velocity derivative |df/dt|) at a specific time in ms.
   */
  public static evaluateTrackSpeedAtTime(track: PropertyAnimationTrack, timeMs: number, deltaMs: number = 2): number {
    const t1 = Math.max(0, timeMs - deltaMs);
    const t2 = timeMs + deltaMs;
    const v1 = this.evaluateTrackValueAtTime(track, t1);
    const v2 = this.evaluateTrackValueAtTime(track, t2);
    const dt = t2 - t1;
    if (dt <= 0) return 0;
    return Math.abs((v2 - v1) / dt) * 1000;
  }

  /**
   * Evaluates normalized easing using S13 AdvancedMotionCurves.
   */
  public static evaluateKeyframeEasing(kf: AnimationKeyframe<unknown>, t: number): number {
    return AdvancedMotionCurves.evaluateProgression(t, kf.easing);
  }

  /**
   * Adjusts viewport zoom & pan coordinates.
   */
  public static zoomViewport(viewport: GraphViewport, factor: number, anchorPx: number = viewport.widthPx / 2): GraphViewport {
    const anchorTime = this.pxToTime(anchorPx, viewport);
    const range = (viewport.endTimeMs - viewport.startTimeMs) * factor;
    const half = range / 2;

    return {
      ...viewport,
      startTimeMs: Math.max(0, anchorTime - half),
      endTimeMs: anchorTime + half,
    };
  }

  /**
   * Pans the viewport by pixel delta.
   */
  public static panViewport(viewport: GraphViewport, deltaPx: number): GraphViewport {
    const timeDelta = (deltaPx / viewport.widthPx) * (viewport.endTimeMs - viewport.startTimeMs);
    return {
      ...viewport,
      startTimeMs: Math.max(0, viewport.startTimeMs - timeDelta),
      endTimeMs: viewport.endTimeMs - timeDelta,
    };
  }

  /**
   * Generates tangent handle DTO for keyframes based on mode (`auto`, `smooth`, `linear`, `step`).
   */
  public static generateTangentHandle(
    keyframe: AnimationKeyframe<unknown>,
    prevKf?: AnimationKeyframe<unknown>,
    nextKf?: AnimationKeyframe<unknown>,
    mode: TangentMode = 'smooth'
  ): KeyframeTangentHandle {
    const getNum = (kf?: AnimationKeyframe<unknown>): number =>
      kf ? (typeof kf.value === 'number' ? kf.value : Number(kf.value) || 0) : 0;

    const val = getNum(keyframe);
    let handleIn = { x: -20, y: 0 };
    let handleOut = { x: 20, y: 0 };

    if (mode === 'linear' || keyframe.easing?.type === 'linear') {
      handleIn = { x: -25, y: 0 };
      handleOut = { x: 25, y: 0 };
    } else if (mode === 'auto' && prevKf && nextKf) {
      const slope = (getNum(nextKf) - getNum(prevKf)) / (nextKf.timeOffset - prevKf.timeOffset || 1);
      handleIn = { x: -30, y: -slope * 10 };
      handleOut = { x: 30, y: slope * 10 };
    } else if (keyframe.easing?.type === 'cubic-bezier' && keyframe.easing.controlPoints) {
      const [x1, y1, x2, y2] = keyframe.easing.controlPoints;
      handleIn = { x: -(x1 * 40), y: -(y1 * 40) };
      handleOut = { x: x2 * 40, y: y2 * 40 };
    }

    return {
      keyframeId: keyframe.id,
      timeMs: keyframe.timeOffset,
      value: val,
      handleIn,
      handleOut,
      tangentMode: mode,
    };
  }
}
