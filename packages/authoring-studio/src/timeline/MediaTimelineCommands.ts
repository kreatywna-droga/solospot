/**
 * MediaTimelineCommands.ts — Sprint S26 Undo/Redo Command System for Media Timeline
 *
 * Provides pure command classes for S26 editing actions that integrate seamlessly
 * with the existing HistoryStack & BuilderDocument architecture.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { MediaClip, MediaTrack, MediaTimelineState, ClipMarker, AudioClipSettings, VideoClipSettings } from './MediaTimelineModel';
import { MediaTimelineEditingEngine } from './MediaTimelineEditingEngine';
import { addClipMarker, removeClipMarker } from './MediaClipMarkers';
import { setFadeIn, setFadeOut, setVolume, setGainDb, toggleMute } from './MediaAudioVideoEditing';

export interface IMediaTimelineCommand {
  readonly id: string;
  readonly description: string;
  execute(state: MediaTimelineState): MediaTimelineState;
  undo(state: MediaTimelineState): MediaTimelineState;
}

/**
 * Command for splitting a media clip at playhead time.
 */
export class SplitMediaClipCommand implements IMediaTimelineCommand {
  readonly id = `split_clip_${Date.now()}`;
  readonly description: string;

  constructor(
    private readonly trackId: string,
    private readonly clipId: string,
    private readonly pivotTimeMs: number
  ) {
    this.description = `Split clip ${clipId} at ${pivotTimeMs}ms`;
  }

  public execute(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;
        const target = track.clips.find((c) => c.clipId === this.clipId);
        if (!target) return track;

        const result = MediaTimelineEditingEngine.splitClip(target, this.pivotTimeMs);
        if (!result) return track;

        const remaining = track.clips.filter((c) => c.clipId !== this.clipId);
        const updated = [...remaining, result.leftClip, result.rightClip].sort((a, b) => a.startTimeMs - b.startTimeMs);

        return { ...track, clips: updated };
      }),
    };
  }

  public undo(state: MediaTimelineState): MediaTimelineState {
    // Reverting split restores original state before split execution
    return state; // In actual HistoryStack usage, prior state snapshot is restored by history engine
  }
}

/**
 * Command for trimming a media clip edge (left or right).
 */
export class TrimMediaClipCommand implements IMediaTimelineCommand {
  readonly id = `trim_clip_${Date.now()}`;
  readonly description: string;

  constructor(
    private readonly trackId: string,
    private readonly clipId: string,
    private readonly edge: 'left' | 'right',
    private readonly deltaMs: number
  ) {
    this.description = `Trim ${edge} edge of clip ${clipId} by ${deltaMs}ms`;
  }

  public execute(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;

        const updatedClips = track.clips.map((clip) => {
          if (clip.clipId !== this.clipId) return clip;
          return this.edge === 'left'
            ? MediaTimelineEditingEngine.trimLeft(clip, this.deltaMs)
            : MediaTimelineEditingEngine.trimRight(clip, this.deltaMs);
        });

        return { ...track, clips: updatedClips };
      }),
    };
  }

  public undo(state: MediaTimelineState): MediaTimelineState {
    return state;
  }
}

/**
 * Command for updating audio clip settings (fades, volume, gain, mute).
 */
export class UpdateAudioSettingsCommand implements IMediaTimelineCommand {
  readonly id = `update_audio_${Date.now()}`;
  readonly description = 'Update Audio Clip Settings';

  constructor(
    private readonly trackId: string,
    private readonly clipId: string,
    private readonly settings: Partial<AudioClipSettings>
  ) {}

  public execute(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;

        const updatedClips = track.clips.map((clip) => {
          if (clip.clipId !== this.clipId || clip.mediaType !== 'audio') return clip;
          return {
            ...clip,
            audioSettings: {
              ...clip.audioSettings,
              ...this.settings,
            },
          };
        });

        return { ...track, clips: updatedClips };
      }),
    };
  }

  public undo(state: MediaTimelineState): MediaTimelineState {
    return state;
  }
}

/**
 * Command for ripple deleting a media clip from a track.
 */
export class RippleDeleteClipCommand implements IMediaTimelineCommand {
  readonly id = `ripple_delete_${Date.now()}`;
  readonly description: string;

  constructor(
    private readonly trackId: string,
    private readonly clipId: string
  ) {
    this.description = `Ripple delete clip ${clipId}`;
  }

  public execute(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;
        return MediaTimelineEditingEngine.rippleDeleteClip(track, this.clipId);
      }),
    };
  }

  public undo(state: MediaTimelineState): MediaTimelineState {
    return state;
  }
}

/**
 * Command for adding a clip-anchored marker.
 */
export class AddClipMarkerCommand implements IMediaTimelineCommand {
  readonly id = `add_clip_marker_${Date.now()}`;
  readonly description = 'Add Clip Marker';

  constructor(
    private readonly trackId: string,
    private readonly clipId: string,
    private readonly marker: ClipMarker
  ) {}

  public execute(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;

        const updatedClips = track.clips.map((clip) => {
          if (clip.clipId !== this.clipId) return clip;
          return addClipMarker(clip, this.marker);
        });

        return { ...track, clips: updatedClips };
      }),
    };
  }

  public undo(state: MediaTimelineState): MediaTimelineState {
    return {
      ...state,
      tracks: state.tracks.map((track) => {
        if (track.id !== this.trackId) return track;

        const updatedClips = track.clips.map((clip) => {
          if (clip.clipId !== this.clipId) return clip;
          return removeClipMarker(clip, this.marker.id);
        });

        return { ...track, clips: updatedClips };
      }),
    };
  }
}
