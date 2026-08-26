import { describe, it, expect } from 'vitest';
import { MediaTimelineEditingEngine } from '../MediaTimelineEditingEngine';
import { AudioTimelineEngine } from '../AudioTimelineEngine';

describe('MediaTrim (S16 ETAP 4)', () => {
  it('trims left in-point and right out-point non-destructively', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_1', 'Audio.mp3', 1000, 4000);

    const trimmedLeft = MediaTimelineEditingEngine.trimLeft(clip, 500);
    expect(trimmedLeft.startTimeMs).toBe(1500);
    expect(trimmedLeft.durationMs).toBe(3500);
    expect(trimmedLeft.trim.inPointMs).toBe(500);

    const trimmedRight = MediaTimelineEditingEngine.trimRight(trimmedLeft, -500);
    expect(trimmedRight.durationMs).toBe(3000);
    expect(trimmedRight.trim.outPointMs).toBe(3500);
  });
});
