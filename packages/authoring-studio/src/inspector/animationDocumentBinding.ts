/**
 * animationDocumentBinding.ts — PM35 BuilderDocument SSOT Animation Binding
 *
 * Implements single source of truth (SSOT) binding between BuilderDocument nodes and
 * builder-core AnimationTimeline domain structures.
 *
 * ARCHITECTURAL INVARIANT (DECISION-044):
 *   BuilderDocument is the single source of truth for AnimationTimeline editing.
 *   Inspector reads/edits configuration data ONLY; execution remains in builder-core.
 *
 * NO DOM, NO window, NO document, NO PlaybackController, NO RuntimeScheduler.
 */

import type {
  BuilderDocument,
  SectionNode,
} from '../../../builder-core/src/BuilderDocument';
import type {
  AnimationTimeline,
  TriggerType,
  EasingCurve,
  FillMode,
  AnimationDirection,
} from '../../../builder-core/src/animation/AnimationTypes';

/**
 * Finds a node by ID recursively within a BuilderDocument.
 */
export function findNodeById(
  nodes: SectionNode[],
  nodeId: string
): SectionNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Immutably updates a node by ID recursively within a list of SectionNodes.
 */
export function updateNodeById(
  nodes: SectionNode[],
  nodeId: string,
  updater: (node: SectionNode) => SectionNode
): SectionNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeById(node.children, nodeId, updater),
      };
    }
    return node;
  });
}

/**
 * Inspects and extracts the AnimationTimeline domain model for a node in a BuilderDocument.
 * Reads from canonical `animationTimeline` (DECISION-044) with fallback to legacy `_animationTimeline`.
 */
export function inspectNodeAnimation(
  doc: BuilderDocument,
  nodeId: string
): AnimationTimeline | null {
  for (const page of doc.pages) {
    const node = findNodeById(page.sections, nodeId);
    if (node && node.props) {
      const timeline = node.props.animationTimeline ?? node.props._animationTimeline;
      if (timeline) {
        return timeline as AnimationTimeline;
      }
    }
  }
  return null;
}

/**
 * Maps an AnimationTimeline domain object to Inspector 2.0 flat values dictionary.
 */
export function animationTimelineToInspectorValues(
  timeline: AnimationTimeline
): Record<string, unknown> {
  const firstClip = timeline.clips[0];
  const firstTrack = firstClip?.tracks[0];
  const firstEasing = firstTrack?.keyframes[0]?.easing?.type ?? 'ease-out';

  return {
    'animation.trigger.type': timeline.trigger.type,
    'animation.trigger.threshold': timeline.trigger.threshold ?? 0.5,
    'animation.playback.duration': firstClip?.duration ?? 1000,
    'animation.playback.delay': firstClip?.delay ?? 0,
    'animation.playback.easing': firstEasing,
    'animation.playback.repeatCount': String(timeline.playback.repeatCount),
    'animation.playback.fillMode': timeline.playback.fillMode,
    'animation.playback.direction': timeline.playback.direction,
  };
}

/**
 * Constructs an AnimationTimeline domain object from an Inspector values dictionary.
 */
export function inspectorValuesToAnimationTimeline(
  nodeId: string,
  values: Record<string, unknown>
): AnimationTimeline {
  const triggerType = (values['animation.trigger.type'] as TriggerType) ?? 'onLoad';
  const threshold = Number(values['animation.trigger.threshold'] ?? 0.5);

  const duration = Number(values['animation.playback.duration'] ?? 1000);
  const delay = Number(values['animation.playback.delay'] ?? 0);
  const easingType = (values['animation.playback.easing'] as EasingCurve['type']) ?? 'ease-out';

  const rawRepeat = values['animation.playback.repeatCount'];
  const repeatCount = rawRepeat === 'infinite' ? 'infinite' : Number(rawRepeat ?? 1);
  const fillMode = (values['animation.playback.fillMode'] as FillMode) ?? 'forwards';
  const direction = (values['animation.playback.direction'] as AnimationDirection) ?? 'normal';

  const easing: EasingCurve = { type: easingType };

  return {
    id: `timeline-${nodeId}`,
    targetNodeId: nodeId,
    trigger: {
      type: triggerType,
      threshold,
      targetElementId: nodeId,
    },
    playback: {
      repeatCount,
      loop: repeatCount === 'infinite',
      fillMode,
      direction,
    },
    clips: [
      {
        id: `clip-${nodeId}`,
        name: 'Default Clip',
        duration,
        delay,
        tracks: [
          {
            id: `track-${nodeId}-opacity`,
            propertyKey: 'opacity',
            keyframes: [
              { id: `kf-${nodeId}-0`, timeOffset: 0, value: 0, easing },
              { id: `kf-${nodeId}-1`, timeOffset: duration, value: 1, easing },
            ],
          },
        ],
      },
    ],
  };
}

export function createDefaultTimeline(nodeId: string): AnimationTimeline {
  return inspectorValuesToAnimationTimeline(nodeId, {});
}

/**
 * Immutably applies an AnimationTimeline to a target node within a BuilderDocument.
 * Persists under canonical `animationTimeline` SSOT key (DECISION-044).
 */
export function applyAnimationToNode(
  doc: BuilderDocument,
  nodeId: string,
  timeline: AnimationTimeline
): BuilderDocument {
  const updatedPages = doc.pages.map((page) => ({
    ...page,
    sections: updateNodeById(page.sections, nodeId, (node) => ({
      ...node,
      props: {
        ...node.props,
        animationTimeline: timeline,
        ...animationTimelineToInspectorValues(timeline),
      },
    })),
  }));

  return {
    ...doc,
    version: doc.version + 1,
    updatedAt: Date.now(),
    pages: updatedPages,
  };
}

/**
 * Lossless DTO patcher (F-04): Immutably updates a single property on an existing AnimationTimeline.
 * Preserves ALL existing clips, tracks, keyframes, and custom playback options (e.g. speed).
 */
export function patchAnimationTimeline(
  timeline: AnimationTimeline,
  fieldId: string,
  value: unknown
): AnimationTimeline {
  switch (fieldId) {
    case 'animation.trigger.type':
      return {
        ...timeline,
        trigger: { ...timeline.trigger, type: value as TriggerType },
      };
    case 'animation.trigger.threshold':
      return {
        ...timeline,
        trigger: { ...timeline.trigger, threshold: Number(value) },
      };
    case 'animation.playback.duration': {
      const dur = Number(value);
      const updatedClips = timeline.clips.map((clip, idx) => {
        if (idx !== 0) return clip;
        return {
          ...clip,
          duration: dur,
          tracks: clip.tracks.map((track) => ({
            ...track,
            keyframes: track.keyframes.map((kf, kfIdx) => {
              if (kfIdx === track.keyframes.length - 1) {
                return { ...kf, timeOffset: dur };
              }
              return kf;
            }),
          })),
        };
      });
      return { ...timeline, clips: updatedClips };
    }
    case 'animation.playback.delay': {
      const del = Number(value);
      const updatedClips = timeline.clips.map((clip, idx) =>
        idx === 0 ? { ...clip, delay: del } : clip
      );
      return { ...timeline, clips: updatedClips };
    }
    case 'animation.playback.easing': {
      const easingType = value as EasingCurve['type'];
      const updatedClips = timeline.clips.map((clip, idx) => {
        if (idx !== 0) return clip;
        return {
          ...clip,
          tracks: clip.tracks.map((track) => ({
            ...track,
            keyframes: track.keyframes.map((kf) => ({
              ...kf,
              easing: { type: easingType },
            })),
          })),
        };
      });
      return { ...timeline, clips: updatedClips };
    }
    case 'animation.playback.repeatCount': {
      const rawRepeat = value;
      const repeatCount = rawRepeat === 'infinite' ? 'infinite' : Number(rawRepeat ?? 1);
      return {
        ...timeline,
        playback: {
          ...timeline.playback,
          repeatCount,
          loop: repeatCount === 'infinite',
        },
      };
    }
    case 'animation.playback.fillMode':
      return {
        ...timeline,
        playback: { ...timeline.playback, fillMode: value as FillMode },
      };
    case 'animation.playback.direction':
      return {
        ...timeline,
        playback: { ...timeline.playback, direction: value as AnimationDirection },
      };
    default:
      return timeline;
  }
}

/**
 * Convenience helper: immutably updates an animation property on a node within a BuilderDocument.
 * Performs lossless DTO patch when an existing timeline exists (F-04).
 */
export function applyAnimationInspectorChange(
  doc: BuilderDocument,
  nodeId: string,
  fieldId: string,
  value: unknown
): BuilderDocument {
  const existingTimeline = inspectNodeAnimation(doc, nodeId);
  if (existingTimeline) {
    const patchedTimeline = patchAnimationTimeline(existingTimeline, fieldId, value);
    return applyAnimationToNode(doc, nodeId, patchedTimeline);
  }
  const defaultValues = { [fieldId]: value };
  const newTimeline = inspectorValuesToAnimationTimeline(nodeId, defaultValues);
  return applyAnimationToNode(doc, nodeId, newTimeline);
}
