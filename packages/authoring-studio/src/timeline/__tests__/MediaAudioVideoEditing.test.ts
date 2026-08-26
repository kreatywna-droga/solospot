import { describe, it, expect } from 'vitest';
import {
  msToFrame,
  frameToMs,
  snapToFrame,
  setFadeIn,
  setFadeOut,
  setVolume,
  setGainDb,
  toggleMute,
  computeCrossfade,
  setOpacity,
  setCrop,
  computeVideoThumbnailStripLayout,
} from '../MediaAudioVideoEditing';
import { AudioTimelineEngine } from '../AudioTimelineEngine';
import { VideoTimelineEngine } from '../VideoTimelineEngine';

describe('MediaAudioVideoEditing — Audio/Video Editing Utilities', () => {
  describe('Frame-Accurate Conversions', () => {
    it('converts milliseconds to frame indices accurately', () => {
      expect(msToFrame(0, 30)).toBe(0);
      expect(msToFrame(1000, 30)).toBe(30);
      expect(msToFrame(500, 30)).toBe(15);
      expect(msToFrame(1000, 60)).toBe(60);
    });

    it('converts frame indices to milliseconds accurately', () => {
      expect(frameToMs(0, 30)).toBe(0);
      expect(frameToMs(30, 30)).toBe(1000);
      expect(frameToMs(15, 30)).toBe(500);
    });

    it('snaps millisecond timestamp to nearest frame boundary', () => {
      // At 30fps, frame 1 = 33.33ms, frame 2 = 66.67ms
      expect(snapToFrame(30, 30)).toBe(33);
      expect(snapToFrame(70, 30)).toBe(67);
    });
  });

  describe('Audio Editing', () => {
    it('sets fade-in and fade-out durations on AudioMediaClip', () => {
      const clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Audio.mp3', 0, 5000);
      const fadedIn = setFadeIn(clip, 800);
      const fadedBoth = setFadeOut(fadedIn, 1200);

      expect(fadedBoth.audioSettings.fadeInMs).toBe(800);
      expect(fadedBoth.audioSettings.fadeOutMs).toBe(1200);
    });

    it('updates volume, gainDb, and mute status', () => {
      const clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Audio.mp3', 0, 5000);
      const vol = setVolume(clip, 0.75);
      const gain = setGainDb(vol, 6.0);
      const muted = toggleMute(gain);

      expect(muted.audioSettings.volume).toBe(0.75);
      expect(muted.audioSettings.gainDb).toBe(6.0);
      expect(muted.audioSettings.mute).toBe(true);
    });

    it('computes crossfade overlap between two overlapping audio clips', () => {
      const clipA = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Track1', 0, 3000);
      const clipB = AudioTimelineEngine.createAudioClip('c2', 'a2', 'Track2', 2000, 3000); // 1000ms overlap

      const crossfade = computeCrossfade(clipA, clipB, 'equalPower');
      expect(crossfade).not.toBeNull();
      expect(crossfade?.startTimeMs).toBe(2000);
      expect(crossfade?.durationMs).toBe(1000);
      expect(crossfade?.crossfadeType).toBe('equalPower');
    });

    it('returns null crossfade when clips do not overlap', () => {
      const clipA = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Track1', 0, 2000);
      const clipB = AudioTimelineEngine.createAudioClip('c2', 'a2', 'Track2', 3000, 2000);

      expect(computeCrossfade(clipA, clipB)).toBeNull();
    });
  });

  describe('Video Editing', () => {
    it('sets video opacity and crop dimensions', () => {
      const clip = VideoTimelineEngine.createVideoClip('v1', 'asset1', 'Video.mp4', 0, 10000);
      const transparent = setOpacity(clip, 0.5);
      const cropped = setCrop(transparent, 10, 15, 80, 70);

      expect(cropped.videoSettings.opacity).toBe(0.5);
      expect(cropped.videoSettings.cropX).toBe(10);
      expect(cropped.videoSettings.cropY).toBe(15);
      expect(cropped.videoSettings.cropWidth).toBe(80);
      expect(cropped.videoSettings.cropHeight).toBe(70);
    });

    it('computes video thumbnail strip layout for timeline UI rendering', () => {
      const clip = VideoTimelineEngine.createVideoClip('v1', 'asset1', 'Video.mp4', 0, 10000);
      const strip = computeVideoThumbnailStripLayout(clip, {
        thumbnailWidthPx: 100,
        trackWidthPx: 500,
        fps: 30,
      });

      expect(strip.length).toBe(5);
      expect(strip[0].xOffsetPx).toBe(0);
      expect(strip[1].xOffsetPx).toBe(100);
      expect(strip[4].xOffsetPx).toBe(400);
    });
  });
});
