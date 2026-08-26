import { describe, it, expect } from 'vitest';
import { AudioTimelineEngine } from '../AudioTimelineEngine';

describe('AudioTimelineEngine (S16 ETAP 2)', () => {
  it('creates audio clip DTO and evaluates playback volume and fade multiplier', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_audio_1', 'BGM.mp3', 1000, 5000);
    const updated = AudioTimelineEngine.updateAudioSettings(clip, { volume: 0.8, fadeInMs: 1000 });

    // Active playback in fade-in window (500ms into clip)
    const stateInFade = AudioTimelineEngine.evaluateAudioPlayback(updated, 1500);
    expect(stateInFade.isActive).toBe(true);
    expect(stateInFade.effectiveVolume).toBeCloseTo(0.4, 1);

    // Inactive playback before clip start
    const stateBefore = AudioTimelineEngine.evaluateAudioPlayback(updated, 500);
    expect(stateBefore.isActive).toBe(false);
    expect(stateBefore.effectiveVolume).toBe(0);
  });

  it('computes waveform DTO amplitude array', () => {
    const clip = AudioTimelineEngine.createAudioClip('c1', 'asset_audio_1', 'BGM.mp3', 0, 3000);
    const waveform = AudioTimelineEngine.computeWaveformDTO(clip, 20);

    expect(waveform.clipId).toBe('c1');
    expect(waveform.barsCount).toBe(20);
    expect(waveform.amplitudes.length).toBe(20);
    expect(waveform.amplitudes[0]).toBeGreaterThanOrEqual(0);
  });
});
