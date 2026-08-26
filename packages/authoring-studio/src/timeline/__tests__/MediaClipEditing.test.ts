import { describe, it, expect } from 'vitest';
import { MediaTimelineEditingEngine } from '../MediaTimelineEditingEngine';
import { AudioTimelineEngine } from '../AudioTimelineEngine';

describe('MediaClipEditing (S16 ETAP 4)', () => {
  it('moves clip with grid snapping', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_1', 'Audio.mp3', 100, 2000);
    const moved = MediaTimelineEditingEngine.moveClip(clip, 245, 100);

    expect(moved.startTimeMs).toBe(200); // snapped to nearest 100ms grid
  });

  it('duplicates clip downstream', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_1', 'Audio.mp3', 500, 2000);
    const dup = MediaTimelineEditingEngine.duplicateClip(clip);

    expect(dup.clipId).not.toBe(clip.clipId);
    expect(dup.startTimeMs).toBe(2600); // 500 + 2000 + 100 offset
  });
});
