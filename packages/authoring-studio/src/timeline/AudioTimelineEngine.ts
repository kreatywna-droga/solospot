/**
 * AudioTimelineEngine.ts — Sprint S16 Audio Workflow Engine (ETAP 2)
 *
 * Handles audio clip calculations (duration, in/out points, gain, volume, mute, fade-in/fade-out),
 * audio playback position resolution, and waveform amplitude DTO generation.
 * Pure headless domain calculations.
 */

import { AudioMediaClip, AudioClipSettings } from './MediaTimelineModel';

export interface AudioPlaybackState {
  readonly isActive: boolean;
  readonly assetId: string;
  readonly assetTimeMs: number;
  readonly effectiveVolume: number;
  readonly isMuted: boolean;
}

export interface AudioWaveformDTO {
  readonly clipId: string;
  readonly barsCount: number;
  readonly amplitudes: readonly number[];
}

export class AudioTimelineEngine {
  /**
   * Creates a default AudioMediaClip DTO.
   */
  public static createAudioClip(
    clipId: string,
    assetId: string,
    name: string,
    startTimeMs: number,
    totalDurationMs: number
  ): AudioMediaClip {
    return {
      clipId,
      assetId,
      name,
      mediaType: 'audio',
      startTimeMs: Math.max(0, startTimeMs),
      durationMs: totalDurationMs,
      trim: {
        inPointMs: 0,
        outPointMs: totalDurationMs,
        sourceOffsetMs: 0,
      },
      audioSettings: {
        volume: 1.0,
        gainDb: 0,
        mute: false,
        fadeInMs: 0,
        fadeOutMs: 0,
      },
    };
  }

  /**
   * Resolves audio playback state (asset position, effective volume, mute) at playhead time t.
   */
  public static evaluateAudioPlayback(
    clip: AudioMediaClip,
    playheadTimeMs: number,
    isTrackMuted: boolean = false
  ): AudioPlaybackState {
    const isMuted = clip.audioSettings.mute || isTrackMuted;

    if (playheadTimeMs < clip.startTimeMs || playheadTimeMs >= clip.startTimeMs + clip.durationMs) {
      return {
        isActive: false,
        assetId: clip.assetId,
        assetTimeMs: 0,
        effectiveVolume: 0,
        isMuted,
      };
    }

    const clipOffset = playheadTimeMs - clip.startTimeMs;
    const assetTimeMs = clip.trim.inPointMs + clipOffset;

    // Calculate fade in / fade out volume multiplier
    let fadeMultiplier = 1.0;
    if (clip.audioSettings.fadeInMs > 0 && clipOffset < clip.audioSettings.fadeInMs) {
      fadeMultiplier = clipOffset / clip.audioSettings.fadeInMs;
    } else if (
      clip.audioSettings.fadeOutMs > 0 &&
      clipOffset > clip.durationMs - clip.audioSettings.fadeOutMs
    ) {
      const remainingMs = clip.durationMs - clipOffset;
      fadeMultiplier = Math.max(0, remainingMs / clip.audioSettings.fadeOutMs);
    }

    // Convert gainDb to linear multiplier (10^(dB/20))
    const gainMultiplier = Math.pow(10, clip.audioSettings.gainDb / 20);
    const effectiveVolume = isMuted ? 0 : clip.audioSettings.volume * fadeMultiplier * gainMultiplier;

    return {
      isActive: true,
      assetId: clip.assetId,
      assetTimeMs,
      effectiveVolume: Number(effectiveVolume.toFixed(3)),
      isMuted,
    };
  }

  /**
   * Updates audio clip volume, gain, mute, fade-in, and fade-out settings.
   */
  public static updateAudioSettings(
    clip: AudioMediaClip,
    settings: Partial<AudioClipSettings>
  ): AudioMediaClip {
    return {
      ...clip,
      audioSettings: {
        ...clip.audioSettings,
        ...settings,
      },
    };
  }

  /**
   * Computes normalized waveform amplitude DTO for rendering timeline audio waveforms.
   */
  public static computeWaveformDTO(
    clip: AudioMediaClip,
    barsCount: number = 60
  ): AudioWaveformDTO {
    const amplitudes: number[] = [];
    const step = (clip.trim.outPointMs - clip.trim.inPointMs) / Math.max(1, barsCount);

    for (let i = 0; i < barsCount; i++) {
      const t = clip.trim.inPointMs + i * step;
      // Synthetic deterministic amplitude pattern based on sample time
      const base = Math.abs(Math.sin((t / 1000) * Math.PI * 2));
      const noise = (Math.sin((t / 100) * Math.PI) + 1) * 0.15;
      amplitudes.push(Number(Math.min(1.0, base * 0.7 + noise).toFixed(3)));
    }

    return {
      clipId: clip.clipId,
      barsCount,
      amplitudes,
    };
  }
}
