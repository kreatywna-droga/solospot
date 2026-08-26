import { describe, it, expect } from 'vitest';
import { VideoTimelineEngine } from '../VideoTimelineEngine';

describe('VideoTimelineEngine (S16 ETAP 3)', () => {
  it('creates video clip DTO and evaluates video frame playback', () => {
    const clip = VideoTimelineEngine.createVideoClip('c1', 'asset_video_1', 'Video.mp4', 2000, 4000);
    const updated = VideoTimelineEngine.updateVideoSettings(clip, { opacity: 0.9, cropX: 10 });

    // Active playback at 3000ms (1000ms offset inside clip)
    const activeState = VideoTimelineEngine.evaluateVideoPlayback(updated, 3000);
    expect(activeState.isActive).toBe(true);
    expect(activeState.assetFrameTimeMs).toBe(1000);
    expect(activeState.opacity).toBe(0.9);
    expect(activeState.cropX).toBe(10);

    // Inactive playback after clip end
    const inactiveState = VideoTimelineEngine.evaluateVideoPlayback(updated, 7000);
    expect(inactiveState.isActive).toBe(false);
    expect(inactiveState.opacity).toBe(0);
  });
});
