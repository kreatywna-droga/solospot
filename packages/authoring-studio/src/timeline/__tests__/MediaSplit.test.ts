import { describe, it, expect } from 'vitest';
import { MediaTimelineEditingEngine } from '../MediaTimelineEditingEngine';
import { AudioTimelineEngine } from '../AudioTimelineEngine';

describe('MediaSplit (S16 ETAP 4)', () => {
  it('splits clip into left and right clips at playhead pivot time', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_1', 'Audio.mp3', 0, 4000);
    const split = MediaTimelineEditingEngine.splitClip(clip, 1500);

    expect(split).not.toBeNull();
    expect(split!.leftClip.startTimeMs).toBe(0);
    expect(split!.leftClip.durationMs).toBe(1500);
    expect(split!.leftClip.trim.outPointMs).toBe(1500);

    expect(split!.rightClip.startTimeMs).toBe(1500);
    expect(split!.rightClip.durationMs).toBe(2500);
    expect(split!.rightClip.trim.inPointMs).toBe(1500);
  });

  it('returns null if pivot time is outside clip range', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_1', 'Audio.mp3', 1000, 2000);
    expect(MediaTimelineEditingEngine.splitClip(clip, 500)).toBeNull();
    expect(MediaTimelineEditingEngine.splitClip(clip, 3500)).toBeNull();
  });
});
