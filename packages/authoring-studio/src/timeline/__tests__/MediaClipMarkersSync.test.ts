import { describe, it, expect } from 'vitest';
import {
  createClipMarker,
  addClipMarker,
  removeClipMarker,
  moveClipMarker,
  getAbsoluteMarkerTime,
  findClipMarkersInTimelineRange,
} from '../MediaClipMarkers';
import { MediaTimelineEditingEngine } from '../MediaTimelineEditingEngine';
import { MediaSyncCoordinator } from '../MediaSyncCoordinator';
import { AudioTimelineEngine } from '../AudioTimelineEngine';
import { VideoTimelineEngine } from '../VideoTimelineEngine';
import { createMediaTimelineState } from '../MediaTimelineModel';

describe('MediaClipMarkers & AV Sync Engine', () => {
  describe('Clip Markers', () => {
    it('creates, adds, moves, and removes clip markers', () => {
      let clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Song.mp3', 1000, 5000);
      const marker = createClipMarker({ relativeTimeMs: 500, label: 'Chorus' });

      clip = addClipMarker(clip, marker);
      expect(clip.clipMarkers).toHaveLength(1);
      expect(clip.clipMarkers![0].label).toBe('Chorus');

      // Absolute time on timeline = startTimeMs (1000) + relativeTimeMs (500) = 1500
      expect(getAbsoluteMarkerTime(clip, clip.clipMarkers![0])).toBe(1500);

      // Move marker within clip to 2000ms relative (3000ms absolute)
      clip = moveClipMarker(clip, marker.id, 2000);
      expect(getAbsoluteMarkerTime(clip, clip.clipMarkers![0])).toBe(3000);

      // Remove marker
      clip = removeClipMarker(clip, marker.id);
      expect(clip.clipMarkers).toHaveLength(0);
    });

    it('finds clip markers within an absolute timeline range', () => {
      let clip = VideoTimelineEngine.createVideoClip('v1', 'a1', 'Video.mp4', 2000, 10000);
      const m1 = createClipMarker({ id: 'm1', relativeTimeMs: 1000, label: 'Intro' }); // Abs: 3000ms
      const m2 = createClipMarker({ id: 'm2', relativeTimeMs: 5000, label: 'Action' }); // Abs: 7000ms

      clip = addClipMarker(clip, m1);
      clip = addClipMarker(clip, m2);

      const inRange = findClipMarkersInTimelineRange(clip, 2500, 5000);
      expect(inRange).toHaveLength(1);
      expect(inRange[0].id).toBe('m1');
    });
  });

  describe('AV Linked Clips & Synchronized Operations', () => {
    it('synchronizes transformations across clips with matching avGroupId', () => {
      let videoClip = VideoTimelineEngine.createVideoClip('v1', 'asset_video', 'Scene.mp4', 0, 5000);
      let audioClip = AudioTimelineEngine.createAudioClip('a1', 'asset_video', 'Scene_Audio', 0, 5000);

      videoClip = { ...videoClip, avGroupId: 'av_group_1' };
      audioClip = { ...audioClip, avGroupId: 'av_group_1' };

      const state = createMediaTimelineState([
        { id: 't1', name: 'Video Track', mediaType: 'video', clips: [videoClip], muted: false, solo: false, locked: false, visible: true, heightPx: 80 },
        { id: 't2', name: 'Audio Track', mediaType: 'audio', clips: [audioClip], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      // Move both linked clips by 1500ms together
      const updatedState = MediaTimelineEditingEngine.syncAVLinkedClips(state, 'av_group_1', (clip) =>
        MediaTimelineEditingEngine.moveClip(clip, 1500)
      );

      expect(updatedState.tracks[0].clips[0].startTimeMs).toBe(1500);
      expect(updatedState.tracks[1].clips[0].startTimeMs).toBe(1500);
    });

    it('performs ripple delete of clip and closes gap', () => {
      const c1 = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Clip 1', 0, 1000);
      const c2 = AudioTimelineEngine.createAudioClip('c2', 'a2', 'Clip 2', 1000, 2000);
      const c3 = AudioTimelineEngine.createAudioClip('c3', 'a3', 'Clip 3', 3000, 1000);

      const track = { id: 't1', name: 'Audio Track', mediaType: 'audio' as const, clips: [c1, c2, c3], muted: false, solo: false, locked: false, visible: true, heightPx: 60 };

      // Ripple delete c2 (duration 2000ms at startTime 1000ms)
      const rippledTrack = MediaTimelineEditingEngine.rippleDeleteClip(track, 'c2');

      expect(rippledTrack.clips).toHaveLength(2);
      expect(rippledTrack.clips[0].clipId).toBe('c1');
      expect(rippledTrack.clips[0].startTimeMs).toBe(0);
      expect(rippledTrack.clips[1].clipId).toBe('c3');
      // c3 was at 3000ms, shifted left by c2 duration (2000ms) -> 1000ms
      expect(rippledTrack.clips[1].startTimeMs).toBe(1000);
    });
  });

  describe('FPS Context in MediaSyncCoordinator', () => {
    it('evaluates playhead frame indices accurately in MediaSyncCoordinator', () => {
      const videoClip = VideoTimelineEngine.createVideoClip('v1', 'asset_1', 'Video.mp4', 0, 5000);
      const state = createMediaTimelineState([
        { id: 't1', name: 'Video Track', mediaType: 'video', clips: [videoClip], muted: false, solo: false, locked: false, visible: true, heightPx: 80 },
      ]);

      const coordinator = new MediaSyncCoordinator(state, 30);
      const frameState = coordinator.setPlayheadFrame(45); // 45 frames @ 30fps = 1500ms

      expect(frameState.playheadTimeMs).toBe(1500);
      expect(frameState.playheadFrame).toBe(45);
      expect(frameState.fps).toBe(30);
      expect(frameState.activeVideoStates).toHaveLength(1);
      expect(frameState.activeVideoStates[0].assetFrameTimeMs).toBe(1500);
    });
  });
});
