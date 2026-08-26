/**
 * MediaPreviewAdapter.ts — Sprint S16 Media Preview Boundary Adapter (ETAP 7)
 *
 * Connects Media Clips (audio & video) to existing PlaybackSession & RenderingEngine
 * infrastructure without creating a secondary playback engine or scheduler.
 * Zero WebGL/WebGPU, zero duplicate canvas renderers.
 */

import { MediaClip, AudioMediaClip, VideoMediaClip } from '../timeline/MediaTimelineModel';
import { AudioTimelineEngine, AudioPlaybackState } from '../timeline/AudioTimelineEngine';
import { VideoTimelineEngine, VideoFramePlaybackState } from '../timeline/VideoTimelineEngine';

export interface MediaPreviewRenderFrame {
  readonly playheadTimeMs: number;
  readonly activeAudioStreams: readonly AudioPlaybackState[];
  readonly activeVideoFrames: readonly VideoFramePlaybackState[];
}

export class MediaPreviewAdapter {
  /**
   * Adapts media clip DTOs to existing RenderingEngine playback frame at playhead position t.
   */
  public static adaptMediaFrame(
    clips: readonly MediaClip[],
    playheadTimeMs: number
  ): MediaPreviewRenderFrame {
    const activeAudioStreams: AudioPlaybackState[] = [];
    const activeVideoFrames: VideoFramePlaybackState[] = [];

    for (const clip of clips) {
      if (clip.mediaType === 'audio') {
        const audioState = AudioTimelineEngine.evaluateAudioPlayback(clip as AudioMediaClip, playheadTimeMs);
        if (audioState.isActive) {
          activeAudioStreams.push(audioState);
        }
      } else if (clip.mediaType === 'video') {
        const videoState = VideoTimelineEngine.evaluateVideoPlayback(clip as VideoMediaClip, playheadTimeMs);
        if (videoState.isActive) {
          activeVideoFrames.push(videoState);
        }
      }
    }

    return {
      playheadTimeMs,
      activeAudioStreams,
      activeVideoFrames,
    };
  }
}
