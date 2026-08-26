/**
 * TimelineClipboard.ts — PM39 Timeline Clipboard Operations (ETAP 5)
 *
 * DECISION-060: Clipboard operuje wyłącznie na DTO.
 *
 * Provides Copy, Cut, Paste, and Duplicate for Keyframes, Tracks, and Clips.
 * All clipboard payloads are pure DTOs.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type {
  AnimationClip,
  PropertyAnimationTrack,
  AnimationKeyframe,
} from '../../../builder-core/src/animation/AnimationTypes';
import {
  getKeyframe,
  getTrack,
  getClip,
  addKeyframe,
  addTrack,
  addClip,
  deleteKeyframe,
  removeTrack,
  removeClip,
} from './timelineDocumentBinding';
import type { KeyframeRef } from './TimelineKeyframeAuthoring';

export type ClipboardPayloadType = 'keyframes' | 'tracks' | 'clips';

export interface KeyframeClipboardPayload {
  readonly type: 'keyframes';
  readonly keyframes: ReadonlyArray<AnimationKeyframe>;
}

export interface TrackClipboardPayload {
  readonly type: 'tracks';
  readonly tracks: ReadonlyArray<PropertyAnimationTrack>;
}

export interface ClipClipboardPayload {
  readonly type: 'clips';
  readonly clips: ReadonlyArray<AnimationClip>;
}

export type TimelineClipboardPayload =
  | KeyframeClipboardPayload
  | TrackClipboardPayload
  | ClipClipboardPayload;

/**
 * Copies keyframes from BuilderDocument into a pure DTO clipboard payload.
 */
export function copyKeyframesToClipboard(
  doc: BuilderDocument,
  nodeId: string,
  keyframeRefs: ReadonlyArray<KeyframeRef>
): KeyframeClipboardPayload {
  const keyframes: AnimationKeyframe[] = [];

  for (const ref of keyframeRefs) {
    const kf = getKeyframe(doc, nodeId, ref.clipId, ref.trackId, ref.keyframeId);
    if (kf) {
      keyframes.push({ ...kf });
    }
  }

  return {
    type: 'keyframes',
    keyframes,
  };
}

/**
 * Cuts keyframes from BuilderDocument (copies DTOs and deletes originals from doc).
 */
export function cutKeyframesToClipboard(
  doc: BuilderDocument,
  nodeId: string,
  keyframeRefs: ReadonlyArray<KeyframeRef>
): { updatedDoc: BuilderDocument; payload: KeyframeClipboardPayload } {
  const payload = copyKeyframesToClipboard(doc, nodeId, keyframeRefs);
  let updatedDoc = doc;

  for (const ref of keyframeRefs) {
    updatedDoc = deleteKeyframe(updatedDoc, nodeId, ref.clipId, ref.trackId, ref.keyframeId);
  }

  return { updatedDoc, payload };
}

/**
 * Pastes keyframes from clipboard payload into a target clip & track at targetTimeOffset.
 */
export function pasteKeyframesFromClipboard(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  payload: KeyframeClipboardPayload,
  targetTimeOffset: number = 0
): BuilderDocument {
  let updatedDoc = doc;
  const baseOffset = payload.keyframes[0]?.timeOffset ?? 0;

  for (let i = 0; i < payload.keyframes.length; i++) {
    const original = payload.keyframes[i];
    const newId = `kf-paste-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
    const relativeTime = original.timeOffset - baseOffset;
    const pastedKeyframe: AnimationKeyframe = {
      ...original,
      id: newId,
      timeOffset: Math.max(0, Math.round(targetTimeOffset + relativeTime)),
    };

    updatedDoc = addKeyframe(updatedDoc, nodeId, clipId, trackId, pastedKeyframe);
  }

  return updatedDoc;
}

/**
 * Duplicates a keyframe payload directly in place.
 */
export function duplicateKeyframePayload(
  doc: BuilderDocument,
  nodeId: string,
  clipId: string,
  trackId: string,
  keyframeRefs: ReadonlyArray<KeyframeRef>,
  timeOffsetShift: number = 100
): BuilderDocument {
  const payload = copyKeyframesToClipboard(doc, nodeId, keyframeRefs);
  if (payload.keyframes.length === 0) return doc;

  const targetTime = (payload.keyframes[0]?.timeOffset ?? 0) + timeOffsetShift;
  return pasteKeyframesFromClipboard(doc, nodeId, clipId, trackId, payload, targetTime);
}
