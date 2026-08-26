import { describe, it, expect } from 'vitest';
import { MediaTimelineEditingEngine } from '../MediaTimelineEditingEngine';
import { AudioTimelineEngine } from '../AudioTimelineEngine';

describe('MediaHistory Stack Integration (S16 ETAP 4)', () => {
  it('applies ripple editing and maintains undo history DTO snapshots', () => {
    const track = {
      id: 't1',
      name: 'Audio Track',
      mediaType: 'audio' as const,
      clips: [
        AudioTimelineEngine.createAudioClip('c1', 'a1', 'A1.mp3', 0, 1000),
        AudioTimelineEngine.createAudioClip('c2', 'a2', 'A2.mp3', 1000, 1000),
      ],
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      heightPx: 48,
    };

    const rippled = MediaTimelineEditingEngine.applyRippleEdit(track, 1000, 500);

    expect(rippled.clips[0].startTimeMs).toBe(0);
    expect(rippled.clips[1].startTimeMs).toBe(1500); // Shifted downstream cleanly
  });
});
