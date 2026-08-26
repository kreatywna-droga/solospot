import { describe, it, expect } from 'vitest';
import { MediaSyncCoordinator } from '../MediaSyncCoordinator';
import { AudioTimelineEngine } from '../AudioTimelineEngine';
import { VideoTimelineEngine } from '../VideoTimelineEngine';

describe('MediaSyncCoordinator (S16 ETAP 5)', () => {
  it('synchronizes audio and video playback positions to single playhead time', () => {
    const audioClip = AudioTimelineEngine.createAudioClip('c_audio', 'asset_a', 'BGM.mp3', 0, 5000);
    const videoClip = VideoTimelineEngine.createVideoClip('c_video', 'asset_v', 'Video.mp4', 1000, 4000);

    const coordinator = new MediaSyncCoordinator({
      tracks: [
        { id: 't1', name: 'Audio 1', mediaType: 'audio', clips: [audioClip], muted: false, solo: false, locked: false, visible: true, heightPx: 48 },
        { id: 't2', name: 'Video 1', mediaType: 'video', clips: [videoClip], muted: false, solo: false, locked: false, visible: true, heightPx: 48 },
      ],
    });

    // Evaluate frame at playhead 2000ms
    const frameState = coordinator.setPlayheadTime(2000);
    expect(frameState.playheadTimeMs).toBe(2000);
    expect(frameState.activeAudioStates.length).toBe(1);
    expect(frameState.activeAudioStates[0].assetTimeMs).toBe(2000);

    expect(frameState.activeVideoStates.length).toBe(1);
    expect(frameState.activeVideoStates[0].assetFrameTimeMs).toBe(1000); // 2000 - 1000 startTime
  });
});
