/**
 * TimelineCurveAuthoringController.ts — Sprint S24 Easing Curve Authoring Controller
 *
 * Pure headless controller for visual curve & easing authoring:
 * - Setting preset easing curves (linear, ease, ease-in, ease-out, ease-in-out)
 * - Custom cubic-bezier control point editing (x1, y1, x2, y2)
 * - Interactive tangent/handle dragging (P1/P2 handles)
 * - Direct keyframe value updates
 * - Extracting Bezier control points for UI visual curve rendering
 *
 * Delegates directly to TimelineEasingEditor.ts and timelineDocumentBinding.ts.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import {
  BezierControlPoints,
  createCustomCubicBezierEasingCurve,
  createPresetEasingCurve,
  EasingPresetName,
  extractBezierControlPoints,
} from './TimelineEasingEditor';
import { KeyframeRef } from './TimelineKeyframeAuthoring';
import { inspectNodeAnimation } from '../inspector/animationDocumentBinding';
import {
  setKeyframeEasing,
  setKeyframeValue,
} from './timelineDocumentBinding';

export class TimelineCurveAuthoringController {
  /**
   * Applies an easing preset (e.g. 'ease-in', 'ease-out', 'linear') to a keyframe in BuilderDocument.
   */
  public static setKeyframeEasingPreset(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef,
    preset: EasingPresetName
  ): BuilderDocument {
    const easing = createPresetEasingCurve(preset);
    return setKeyframeEasing(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId, easing);
  }

  /**
   * Sets custom cubic-bezier control points (x1, y1, x2, y2) on a keyframe in BuilderDocument.
   */
  public static setCustomCubicBezier(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef,
    points: BezierControlPoints
  ): BuilderDocument {
    const easing = createCustomCubicBezierEasingCurve(points);
    return setKeyframeEasing(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId, easing);
  }

  /**
   * Interactively updates either P1 handle (x1, y1) or P2 handle (x2, y2) of a keyframe curve.
   */
  public static updateBezierTangentHandles(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef,
    handle: 'P1' | 'P2',
    newX: number,
    newY: number
  ): BuilderDocument {
    const currentPoints = this.extractKeyframeEasingPoints(doc, nodeId, ref);
    const updatedPoints: BezierControlPoints =
      handle === 'P1'
        ? { ...currentPoints, x1: newX, y1: newY }
        : { ...currentPoints, x2: newX, y2: newY };

    return this.setCustomCubicBezier(doc, nodeId, ref, updatedPoints);
  }

  /**
   * Directly sets the interpolated numeric/string value on a keyframe.
   */
  public static setDirectKeyframeValue(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef,
    newValue: unknown
  ): BuilderDocument {
    return setKeyframeValue(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId, newValue);
  }

  /**
   * Extracts Bezier control points for UI rendering from a keyframe's easing curve.
   */
  public static extractKeyframeEasingPoints(
    doc: BuilderDocument,
    nodeId: string,
    ref: KeyframeRef
  ): BezierControlPoints {
    const timeline = inspectNodeAnimation(doc, nodeId);
    if (timeline) {
      for (const clip of timeline.clips) {
        if (clip.id === ref.clipId) {
          for (const track of clip.tracks) {
            if (track.id === ref.trackId) {
              const kf = track.keyframes.find((k) => k.id === ref.keyframeId);
              if (kf) return extractBezierControlPoints(kf.easing);
            }
          }
        }
      }
    }
    return { x1: 0, y1: 0, x2: 1, y2: 1 };
  }
}
