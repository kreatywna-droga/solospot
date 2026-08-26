'use client';

import * as React from 'react';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { TimelineSelection } from './TimelineSelection';
import type { TimelineViewModel } from './TimelinePanelAdapter';
import { toTimelinePanelViewModel } from './TimelinePanelAdapter';
import type { TimelineViewport } from './TimelineViewport';
import { timeToPixels } from './TimelineViewport';
import type { TimelineGrid } from './TimelineGrid';

/**
 * TimelinePanel — PM36 Timeline Editor Panel (DECISION-046)
 *
 * PURE PRESENTATION component. It renders the animation timeline data
 * (clips, tracks, keyframes, ruler/cursor) WITHOUT executing any animation.
 * There is NO Playback, NO Scheduler, NO Runtime, NO Trigger Engine, NO Preview.
 *
 * All state is passed in via props (controlled). Changes bubble up via callbacks.
 * The panel never stores its own copy of the data (DECISION-047).
 */

export interface TimelinePanelProps {
  /** The AnimationTimeline domain data being edited (from BuilderDocument SSOT). */
  readonly timeline: AnimationTimeline;
  /** The node id this timeline belongs to. */
  readonly nodeId: string;
  /** Current UI selection state (DECISION-048). */
  readonly selection: TimelineSelection;
  /** Viewport geometry. */
  readonly viewport?: Partial<TimelineViewport>;
  /** Called when the user requests to select a clip. */
  readonly onSelectClip: (clipId: string) => void;
  /** Called when the user requests to select a track. */
  readonly onSelectTrack: (clipId: string, trackId: string) => void;
  /** Called when the user requests to select a keyframe. */
  readonly onSelectKeyframe: (clipId: string, trackId: string, keyframeId: string) => void;
  /** Called when the user requests to add a clip. */
  readonly onAddClip: () => void;
  /** Called when the user requests to remove a clip. */
  readonly onRemoveClip: (clipId: string) => void;
  /** Called when the user requests to add a track to a clip. */
  readonly onAddTrack: (clipId: string) => void;
  /** Called when the user requests to add a keyframe to a track. */
  readonly onAddKeyframe: (clipId: string, trackId: string) => void;
}

/**
 * TimelinePanel — pure presentation of the timeline.
 * Renders a ruler, clip lanes, and selected track/keyframe highlights.
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  timeline,
  nodeId,
  selection,
  viewport,
  onSelectClip,
  onSelectTrack,
  onSelectKeyframe,
  onAddClip,
  onRemoveClip,
  onAddTrack,
  onAddKeyframe,
}) => {
  const vm = toTimelinePanelViewModel(nodeId, timeline, viewport);
  const grid: TimelineGrid = vm.grid;

  return (
    <div className="timeline-panel border rounded bg-slate-950 text-slate-100" data-testid="inspector-timeline-panel">
      {/* Ruler & Markers */}
      <div className="timeline-ruler flex items-end border-b border-slate-800 px-2 h-8 relative select-none" data-testid="timeline-ruler">
        {grid.ticks.map((tick) => (
          <span
            key={tick.timeMs}
            className="text-[10px] text-slate-400 tabular-nums"
            style={{ marginLeft: Math.max(0, tick.x - 12) }}
            data-testid="timeline-tick"
          >
            {tick.label}
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="timeline-toolbar flex items-center justify-between gap-2 px-2 py-1 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddClip}
            className="text-[11px] px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 font-medium"
            data-testid="timeline-add-clip"
          >
            + Clip
          </button>
          <span className="text-[11px] text-slate-400">
            {vm.timeline.clipCount} clip(s) · {vm.timeline.totalDuration}ms
          </span>
        </div>

        {/* Professional Pro Toolbar Actions */}
        <div className="flex items-center gap-1.5" data-testid="timeline-pro-toolbar">
          <button
            type="button"
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Toggle Curve Visibility"
            data-testid="timeline-toggle-curve"
          >
            📈 Curves
          </button>
          <button
            type="button"
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Ripple Editing Mode"
            data-testid="timeline-ripple-toggle"
          >
            🌊 Ripple
          </button>
          <button
            type="button"
            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-700 hover:bg-amber-800 text-amber-200"
            title="Add Timeline Marker"
            data-testid="timeline-add-marker"
          >
            📌 Marker
          </button>
        </div>
      </div>

      {/* Clip lanes */}
      <div className="timeline-clips space-y-1 px-2 py-2" data-testid="timeline-clips">
        {vm.timeline.clips.map((clip) => {
          const isClipSelected = selection.selectedClipId === clip.id;
          const left = timeToPixels(vm.viewport, clip.delay);
          const widthPx = Math.max(8, clip.duration * vm.viewport.pixelsPerMs);
          return (
            <div key={clip.id} className="timeline-clip-row">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectClip(clip.id)}
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    isClipSelected
                      ? 'bg-indigo-800 border-indigo-400'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                  }`}
                  data-testid="timeline-clip"
                >
                  {clip.name}
                </button>
                <span className="text-[10px] text-slate-500">
                  {clip.duration}ms · delay {clip.delay}ms · {clip.trackCount} track(s) · {clip.keyframeCount} kf
                </span>
                {isClipSelected && (
                  <button
                    type="button"
                    onClick={() => onRemoveClip(clip.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-red-900 hover:bg-red-800"
                    data-testid="timeline-remove-clip"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Track block inside selected clip */}
              {isClipSelected && (
                <div className="timeline-tracks mt-1 ml-6 space-y-1" data-testid="timeline-tracks">
                  {clip.tracks.map((track) => {
                    const isTrackSelected = selection.selectedTrackId === track.id;
                    return (
                      <div key={track.id} className="timeline-track-row">
                        <button
                          type="button"
                          onClick={() => onSelectTrack(clip.id, track.id)}
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            isTrackSelected
                              ? 'bg-emerald-800 border-emerald-400'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                          data-testid="timeline-track"
                        >
                          {track.propertyKey}
                        </button>
                        <span className="text-[10px] text-slate-500 ml-2">{track.keyframeCount} kf</span>

                        {/* Keyframe chips with interpolation indicators */}
                        <div className="timeline-keyframes inline-flex gap-1.5 ml-2" data-testid="timeline-keyframes">
                          {track.keyframes.map((kf) => {
                            const isKfSelected = selection.selectedKeyframeId === kf.id;
                            const indicator = kf.easingType === 'cubic-bezier' ? '∿' : kf.easingType === 'step-start' ? '▔' : '◇';
                            return (
                              <button
                                key={kf.id}
                                type="button"
                                onClick={() => onSelectKeyframe(clip.id, track.id, kf.id)}
                                className={`h-4 min-w-4 px-1 rounded flex items-center justify-center text-[9px] border font-bold ${
                                  isKfSelected
                                    ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-sm'
                                    : 'bg-slate-700 text-slate-200 border-slate-500 hover:bg-slate-600'
                                }`}
                                style={{
                                  marginLeft: `${Math.max(0, timeToPixels(vm.viewport, kf.timeOffset) - left)}px`,
                                }}
                                title={`${kf.timeOffset}ms · ${kf.easingType}`}
                                data-testid="timeline-keyframe"
                              >
                                {indicator}
                              </button>
                            );
                          })}
                        </div>
                        {isTrackSelected && (
                          <button
                            type="button"
                            onClick={() => onAddKeyframe(clip.id, track.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900 hover:bg-emerald-800 ml-2"
                            data-testid="timeline-add-keyframe"
                          >
                            + kf
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onAddTrack(clip.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600"
                    data-testid="timeline-add-track"
                  >
                    + Track
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TimelinePanel);
