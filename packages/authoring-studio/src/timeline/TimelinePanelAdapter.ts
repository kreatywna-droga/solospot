/**
 * TimelinePanelAdapter.ts — PM36 Timeline Panel Adapter (ETAP 4)
 *
 * Creates ONLY the DTOs (view models) the Timeline Panel needs to render.
 * Contains NO Runtime logic — no Playback, no Scheduler, no Trigger Engine.
 * It is a pure pure mapping from AnimationTimeline → UI view model.
 *
 * NO DOM, NO window, NO requestAnimationFrame, NO setTimeout/setInterval.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { buildTimelineGrid } from './TimelineGrid';
import type { TimelineViewport } from './TimelineViewport';
import { createTimelineViewport } from './TimelineViewport';

export interface TimelineKeyframeViewModel {
  readonly id: string;
  readonly timeOffset: number;
  readonly easingType: string;
}

export interface TimelineTrackViewModel {
  readonly id: string;
  readonly propertyKey: string;
  readonly keyframeCount: number;
  readonly keyframes: ReadonlyArray<TimelineKeyframeViewModel>;
}

export interface TimelineClipViewModel {
  readonly id: string;
  readonly name: string;
  readonly duration: number;
  readonly delay: number;
  readonly trackCount: number;
  readonly keyframeCount: number;
  readonly tracks: ReadonlyArray<TimelineTrackViewModel>;
}

export interface TimelineViewModel {
  readonly nodeId: string;
  readonly clips: ReadonlyArray<TimelineClipViewModel>;
  readonly clipCount: number;
  readonly totalDuration: number;
}

export interface TimelinePanelViewModel {
  readonly timeline: TimelineViewModel;
  readonly viewport: TimelineViewport;
  readonly grid: ReturnType<typeof buildTimelineGrid>;
}

export function toTimelineClipViewModel(
  timeline: AnimationTimeline
): TimelineClipViewModel[] {
  return timeline.clips.map((clip) => {
    const tracks: TimelineTrackViewModel[] = clip.tracks.map((track) => ({
      id: track.id,
      propertyKey: track.propertyKey,
      keyframeCount: track.keyframes.length,
      keyframes: track.keyframes.map((kf) => ({
        id: kf.id,
        timeOffset: kf.timeOffset,
        easingType: kf.easing.type,
      })),
    }));
    const keyframeCount = tracks.reduce((sum, t) => sum + t.keyframeCount, 0);
    return {
      id: clip.id,
      name: clip.name,
      duration: clip.duration,
      delay: clip.delay,
      trackCount: clip.tracks.length,
      keyframeCount,
      tracks,
    };
  });
}

export function toTimelineTrackViewModel(
  timeline: AnimationTimeline,
  clipId: string
): TimelineTrackViewModel[] {
  const clip = timeline.clips.find((c) => c.id === clipId);
  if (!clip) return [];
  return clip.tracks.map((track) => ({
    id: track.id,
    propertyKey: track.propertyKey,
    keyframeCount: track.keyframes.length,
    keyframes: track.keyframes.map((kf) => ({
      id: kf.id,
      timeOffset: kf.timeOffset,
      easingType: kf.easing.type,
    })),
  }));
}

export function toTimelineKeyframeViewModel(
  timeline: AnimationTimeline,
  clipId: string,
  trackId: string
): TimelineKeyframeViewModel[] {
  const clip = timeline.clips.find((c) => c.id === clipId);
  if (!clip) return [];
  const track = clip.tracks.find((t) => t.id === trackId);
  if (!track) return [];
  return track.keyframes.map((kf) => ({
    id: kf.id,
    timeOffset: kf.timeOffset,
    easingType: kf.easing.type,
  }));
}

export function toTimelineViewModel(
  nodeId: string,
  timeline: AnimationTimeline
): TimelineViewModel {
  const clips = toTimelineClipViewModel(timeline);
  const totalDuration = clips.reduce((sum, c) => sum + c.duration + c.delay, 0);
  return {
    nodeId,
    clips,
    clipCount: clips.length,
    totalDuration,
  };
}

export function toTimelinePanelViewModel(
  nodeId: string,
  timeline: AnimationTimeline,
  viewport: Partial<TimelineViewport> = {}
): TimelinePanelViewModel {
  const resolvedViewport = createTimelineViewport(viewport);
  return {
    timeline: toTimelineViewModel(nodeId, timeline),
    viewport: resolvedViewport,
    grid: buildTimelineGrid(resolvedViewport),
  };
}
