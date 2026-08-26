/**
 * timelineDocumentBinding.ts — PM36 Timeline Document Binding (DECISION-047)
 *
 * Immutable, declarative mutations of AnimationTimeline stored in BuilderDocument (SSOT).
 * Every operation returns a NEW BuilderDocument — never mutates the input.
 * The Timeline Editor never stores its own copy of the data; it always reads from
 * and writes back to BuilderDocument.
 *
 * NO DOM, NO window, NO requestAnimationFrame, NO setTimeout/setInterval,
 * NO PlaybackController, NO RuntimeScheduler, NO Trigger Engine.
 */

import type {
  BuilderDocument,
  SectionNode,
} from '../../../builder-core/src/BuilderDocument';
import type {
  AnimationTimeline,
  AnimationClip,
  PropertyAnimationTrack,
  AnimationKeyframe,
  EasingCurve,
} from '../../../builder-core/src/animation/AnimationTypes';

import {
  findNodeById,
  updateNodeById,
  inspectNodeAnimation,
  applyAnimationToNode,
} from '../inspector/animationDocumentBinding';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateTimeline(
  doc: BuilderDocument,
  nodeId: string,
  updater: (timeline: AnimationTimeline) => AnimationTimeline
): BuilderDocument {
  const current = inspectNodeAnimation(doc, nodeId);
  if (!current) return doc;
  return applyAnimationToNode(doc, nodeId, updater(current));
}

function updateClip(
  timeline: AnimationTimeline,
  clipId: string,
  updater: (clip: AnimationClip) => AnimationClip
): AnimationTimeline {
  return {
    ...timeline,
    clips: timeline.clips.map((clip) =>
      clip.id === clipId ? updater(clip) : clip
    ),
  };
}

function updateTrack(
  clip: AnimationClip,
  trackId: string,
  updater: (track: PropertyAnimationTrack) => PropertyAnimationTrack
): AnimationClip {
  return {
    ...clip,
    tracks: clip.tracks.map((track) =>
      track.id === trackId ? updater(track) : track
    ),
  };
}

function updateKeyframe(
  track: PropertyAnimationTrack,
  keyframeId: string,
  updater: (kf: AnimationKeyframe) => AnimationKeyframe
): PropertyAnimationTrack {
  return {
    ...track,
    keyframes: track.keyframes.map((kf) =>
      kf.id === keyframeId ? updater(kf) : kf
    ),
  };
}

function sortKeyframes(track: PropertyAnimationTrack): PropertyAnimationTrack {
  return {
    ...track,
    keyframes: [...track.keyframes].sort((a, b) => a.timeOffset - b.timeOffset),
  };
}

// ---------------------------------------------------------------------------
// Clip operations
// ---------------------------------------------------------------------------

export function addClip(
  doc: BuilderDocument,
  nodeId: string,
  clip: AnimationClip
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) => ({
    ...timeline,
    clips: [...timeline.clips, clip],
  }));
}

export function removeClip(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) => ({
    ...timeline,
    clips: timeline.clips.filter((clip) => clip.id !== clipId),
  }));
}

export function moveClip(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  newIndex: number
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) => {
    const fromIndex = timeline.clips.findIndex((clip) => clip.id === clipId);
    if (fromIndex === -1) return timeline;
    const clips = [...timeline.clips];
    const [moved] = clips.splice(fromIndex, 1);
    const target = Math.max(0, Math.min(newIndex, clips.length));
    clips.splice(target, 0, moved);
    return { ...timeline, clips };
  });
}

export function resizeClip(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  duration: number
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) => ({
      ...clip,
      duration: Math.max(1, Math.round(duration)),
    }))
  );
}

// ---------------------------------------------------------------------------
// Track operations
// ---------------------------------------------------------------------------

export function addTrack(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  track: PropertyAnimationTrack
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) => ({
      ...clip,
      tracks: [...clip.tracks, track],
    }))
  );
}

export function removeTrack(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) => ({
      ...clip,
      tracks: clip.tracks.filter((track) => track.id !== trackId),
    }))
  );
}

// ---------------------------------------------------------------------------
// Keyframe operations
// ---------------------------------------------------------------------------

export function moveKeyframe(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeId: string,
  newTimeOffset: number
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) =>
      updateTrack(clip, trackId, (track) =>
        sortKeyframes(
          updateKeyframe(track, keyframeId, (kf) => ({
            ...kf,
            timeOffset: Math.max(0, Math.round(newTimeOffset)),
          }))
        )
      )
    )
  );
}

export function addKeyframe(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframe: AnimationKeyframe
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) =>
      updateTrack(clip, trackId, (track) => sortKeyframes({
        ...track,
        keyframes: [...track.keyframes, keyframe],
      }))
    )
  );
}

export function deleteKeyframe(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeId: string
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) =>
      updateTrack(clip, trackId, (track) => ({
        ...track,
        keyframes: track.keyframes.filter((kf) => kf.id !== keyframeId),
      }))
    )
  );
}

// ---------------------------------------------------------------------------
// Keyframe value / easing mutation
// ---------------------------------------------------------------------------

export function setKeyframeValue(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeId: string,
  value: unknown
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) =>
      updateTrack(clip, trackId, (track) =>
        updateKeyframe(track, keyframeId, (kf) => ({ ...kf, value }))
      )
    )
  );
}

export function setKeyframeEasing(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeId: string,
  easing: EasingCurve
): BuilderDocument {
  return updateTimeline(doc, nodeId, (timeline) =>
    updateClip(timeline, clipId, (clip) =>
      updateTrack(clip, trackId, (track) =>
        updateKeyframe(track, keyframeId, (kf) => ({ ...kf, easing }))
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Read helpers (non-mutating)
// ---------------------------------------------------------------------------

export function getClip(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string
): AnimationClip | null {
  const timeline = inspectNodeAnimation(doc, nodeId);
  if (!timeline) return null;
  return timeline.clips.find((clip) => clip.id === clipId) ?? null;
}

export function getTrack(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string
): PropertyAnimationTrack | null {
  const clip = getClip(doc, nodeId, clipId);
  if (!clip) return null;
  return clip.tracks.find((track) => track.id === trackId) ?? null;
}

export function getKeyframe(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeId: string
): AnimationKeyframe | null {
  const track = getTrack(doc, nodeId, clipId, trackId);
  if (!track) return null;
  return track.keyframes.find((kf) => kf.id === keyframeId) ?? null;
}

// Re-export traversal helpers for convenience.
export { findNodeById, updateNodeById, applyAnimationToNode };

// Re-export type of SectionNode for consumers.
export type { SectionNode };
