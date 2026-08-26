/**
 * MediaSyncCoordinator.ts — Sprint S16 Audio/Video Sync Coordinator (ETAP 5)
 *
 * Synchronizes audio clips, video frames, property tracks, and canvas render updates
 * to the single active PlaybackSession playhead position.
 * Zero playhead drift.
 */

import { MediaTimelineState, MediaTrack } from './MediaTimelineModel';
import { AudioTimelineEngine, AudioPlaybackState } from './AudioTimelineEngine';
import { VideoTimelineEngine, VideoFramePlaybackState } from './VideoTimelineEngine';

import { msToFrame, frameToMs, DEFAULT_FRAME_RATE } from './MediaAudioVideoEditing';

export interface SynchronizedFrameState {
  readonly playheadTimeMs: number;
  readonly playheadFrame: number;
  readonly fps: number;
  readonly activeAudioStates: readonly AudioPlaybackState[];
  readonly activeVideoStates: readonly VideoFramePlaybackState[];
}

export class MediaSyncCoordinator {
  private state: MediaTimelineState;
  private currentPlayheadTimeMs: number = 0;
  private fps: number = DEFAULT_FRAME_RATE;

  constructor(state: MediaTimelineState = { tracks: [] }, fps: number = DEFAULT_FRAME_RATE) {
    this.state = state;
    this.fps = Math.max(1, fps);
  }

  /**
   * Configures target frames-per-second (FPS) for frame-accurate playhead sync.
   */
  public setFps(fps: number): void {
    this.fps = Math.max(1, fps);
  }

  public getFps(): number {
    return this.fps;
  }

  /**
   * Sets current playhead position in ms and calculates synchronized audio/video frame states.
   */
  public setPlayheadTime(playheadTimeMs: number): SynchronizedFrameState {
    this.currentPlayheadTimeMs = Math.max(0, playheadTimeMs);
    return this.evaluateCurrentFrame();
  }

  /**
   * Sets playhead position by frame index.
   */
  public setPlayheadFrame(frame: number): SynchronizedFrameState {
    const timeMs = frameToMs(frame, this.fps);
    return this.setPlayheadTime(timeMs);
  }

  /**
   * Returns current playhead position in ms.
   */
  public getCurrentPlayheadTimeMs(): number {
    return this.currentPlayheadTimeMs;
  }

  /**
   * Returns current playhead frame index.
   */
  public getCurrentPlayheadFrame(): number {
    return msToFrame(this.currentPlayheadTimeMs, this.fps);
  }

  /**
   * Evaluates active audio playback states and video frame states for all tracks at current playhead position.
   */
  public evaluateCurrentFrame(): SynchronizedFrameState {
    const activeAudioStates: AudioPlaybackState[] = [];
    const activeVideoStates: VideoFramePlaybackState[] = [];

    // Evaluate audio and video tracks
    for (const track of this.state.tracks) {
      if (track.mediaType === 'audio') {
        for (const clip of track.clips) {
          if (clip.mediaType === 'audio') {
            const audioState = AudioTimelineEngine.evaluateAudioPlayback(clip, this.currentPlayheadTimeMs, track.muted);
            if (audioState.isActive) {
              activeAudioStates.push(audioState);
            }
          }
        }
      } else if (track.mediaType === 'video') {
        for (const clip of track.clips) {
          if (clip.mediaType === 'video') {
            const videoState = VideoTimelineEngine.evaluateVideoPlayback(clip, this.currentPlayheadTimeMs, track.visible);
            if (videoState.isActive) {
              activeVideoStates.push(videoState);
            }
          }
        }
      }
    }

    return {
      playheadTimeMs: this.currentPlayheadTimeMs,
      playheadFrame: this.getCurrentPlayheadFrame(),
      fps: this.fps,
      activeAudioStates,
      activeVideoStates,
    };
  }

  /**
   * Updates internal MediaTimelineState reference.
   */
  public updateTimelineState(nextState: MediaTimelineState): void {
    this.state = nextState;
  }
}
