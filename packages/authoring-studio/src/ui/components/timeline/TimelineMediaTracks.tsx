'use client';

import * as React from 'react';
import type { MediaTrack, MediaClip } from '../../../timeline/MediaTimelineModel';
import { AudioTimelineEngine } from '../../../timeline/AudioTimelineEngine';

export interface TimelineMediaTracksProps {
  /** Array of media tracks (audio & video). */
  readonly tracks: readonly MediaTrack[];
  /** Current playhead time in ms. */
  readonly playheadTimeMs?: number;
  /** Width in pixels per second zoom factor. */
  readonly pxPerSec?: number;
  /** Callback fired when a clip trim or move is triggered. */
  readonly onClipChange?: (trackId: string, updatedClip: MediaClip) => void;
  /** Callback when user selects a clip. */
  readonly onSelectClip?: (trackId: string, clipId: string) => void;
}

export const TimelineMediaTracks: React.FC<TimelineMediaTracksProps> = ({
  tracks,
  playheadTimeMs = 0,
  pxPerSec = 100,
  onClipChange,
  onSelectClip,
}) => {
  const [selectedClipId, setSelectedClipId] = React.useState<string | null>(null);

  const msToPx = (ms: number) => (ms / 1000) * pxPerSec;

  return (
    <div className="timeline-media-tracks flex flex-col gap-2 bg-slate-950 p-2 text-slate-100 border-t border-slate-800 select-none" data-testid="timeline-media-tracks">
      {tracks.map((track) => (
        <div key={track.id} className="media-track flex items-center border border-slate-800 rounded bg-slate-900 overflow-hidden" style={{ height: track.heightPx || 48 }} data-testid={`track-${track.id}`}>
          {/* Track Header Controls */}
          <div className="track-header w-36 px-2 flex items-center justify-between bg-slate-950 border-r border-slate-800 text-xs font-semibold">
            <span className="truncate text-slate-300" title={track.name}>
              {track.mediaType === 'audio' ? '🎵' : '🎬'} {track.name}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`text-[10px] px-1 rounded font-bold ${track.muted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                data-testid={`mute-btn-${track.id}`}
              >
                M
              </button>
              <button
                type="button"
                className={`text-[10px] px-1 rounded font-bold ${track.solo ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                data-testid={`solo-btn-${track.id}`}
              >
                S
              </button>
            </div>
          </div>

          {/* Track Clips Canvas Stage */}
          <div className="track-clips-stage relative flex-1 h-full bg-slate-900/50 overflow-hidden">
            {track.clips.map((clip) => {
              const leftPx = msToPx(clip.startTimeMs);
              const widthPx = Math.max(20, msToPx(clip.durationMs));
              const isSelected = clip.clipId === selectedClipId;
              const isAudio = clip.mediaType === 'audio';

              const waveform = isAudio ? AudioTimelineEngine.computeWaveformDTO(clip, 30) : null;

              return (
                <div
                  key={clip.clipId}
                  onClick={() => {
                    setSelectedClipId(clip.clipId);
                    if (onSelectClip) onSelectClip(track.id, clip.clipId);
                  }}
                  className={`media-clip-block absolute top-1 bottom-1 rounded border overflow-hidden cursor-pointer flex flex-col justify-between p-1 transition-colors ${
                    isAudio
                      ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-200'
                      : 'bg-indigo-950/80 border-indigo-600/70 text-indigo-200'
                  } ${isSelected ? 'ring-2 ring-amber-400 border-amber-400' : ''}`}
                  style={{ left: leftPx, width: widthPx }}
                  data-testid={`clip-${clip.clipId}`}
                >
                  {/* Clip Header Label */}
                  <div className="flex items-center justify-between text-[10px] font-semibold truncate">
                    <span className="truncate">{clip.name}</span>
                    <span className="text-[9px] opacity-75">{Math.round(clip.durationMs)}ms</span>
                  </div>

                  {/* Waveform / Thumbnail Overlay */}
                  {isAudio && waveform && (
                    <svg className="w-full h-4 block opacity-60" preserveAspectRatio="none">
                      {waveform.amplitudes.map((amp, idx) => {
                        const x = (idx / waveform.amplitudes.length) * 100;
                        const h = amp * 100;
                        return (
                          <line
                            key={idx}
                            x1={`${x}%`}
                            y1={`${50 - h / 2}%`}
                            x2={`${x}%`}
                            y2={`${50 + h / 2}%`}
                            stroke="#34d399"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </svg>
                  )}

                  {/* Trim Handles */}
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-white/20 hover:bg-amber-400 cursor-ew-resize" data-testid={`trim-left-${clip.clipId}`} />
                  <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-white/20 hover:bg-amber-400 cursor-ew-resize" data-testid={`trim-right-${clip.clipId}`} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineMediaTracks;
