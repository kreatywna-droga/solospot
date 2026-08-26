'use client';

import * as React from 'react';
import type { Track } from '../../../../../builder-core/src/animation/AnimationTypes';
import {
  GraphEditorEngine,
  GraphMode,
  GraphViewport,
  TangentMode,
  CurvePlotData,
} from '../../../motion/GraphEditorEngine';

export interface GraphEditorProps {
  /** Tracks selected for graph editing (multi-curve selection supported). */
  readonly tracks: readonly Track[];
  /** Active track id selected for keyframe handle editing. */
  readonly activeTrackId?: string;
  /** Active keyframe id selected in graph editor. */
  readonly activeKeyframeId?: string;
  /** Width in pixels of the canvas host. */
  readonly width?: number;
  /** Height in pixels of the canvas host. */
  readonly height?: number;
  /** Callback fired when keyframe tangent or interpolation changes. */
  readonly onChangeInterpolation?: (trackId: string, keyframeId: string, mode: TangentMode) => void;
  /** Callback when user selects a keyframe on the graph. */
  readonly onSelectKeyframe?: (trackId: string, keyframeId: string) => void;
}

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

export const GraphEditor: React.FC<GraphEditorProps> = ({
  tracks,
  activeTrackId,
  activeKeyframeId,
  width = 800,
  height = 300,
  onChangeInterpolation,
  onSelectKeyframe,
}) => {
  const [graphMode, setGraphMode] = React.useState<GraphMode>('value');
  const [tangentMode, setTangentMode] = React.useState<TangentMode>('smooth');
  const [viewport, setViewport] = React.useState<GraphViewport>({
    startTimeMs: 0,
    endTimeMs: 2000,
    minValue: -50,
    maxValue: 150,
    widthPx: width,
    heightPx: height,
  });

  // Sync props width/height to viewport
  React.useEffect(() => {
    setViewport((prev) => ({ ...prev, widthPx: width, heightPx: height }));
  }, [width, height]);

  // Compute curve plots for all selected tracks
  const curves: CurvePlotData[] = React.useMemo(() => {
    return tracks.map((tr, index) => {
      const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
      return GraphEditorEngine.plotTrackCurve(tr, viewport, graphMode, 120, color);
    });
  }, [tracks, viewport, graphMode]);

  // Handle Zoom In/Out
  const handleZoom = (factor: number) => {
    setViewport((prev) => GraphEditorEngine.zoomViewport(prev, factor));
  };

  // Handle Pan Left/Right
  const handlePan = (deltaPx: number) => {
    setViewport((prev) => GraphEditorEngine.panViewport(prev, deltaPx));
  };

  // Handle Interpolation Mode Change
  const handleInterpolationClick = (mode: TangentMode) => {
    setTangentMode(mode);
    if (activeTrackId && activeKeyframeId && onChangeInterpolation) {
      onChangeInterpolation(activeTrackId, activeKeyframeId, mode);
    }
  };

  return (
    <div className="graph-editor border rounded bg-slate-950 text-slate-100 p-2 flex flex-col gap-2" data-testid="graph-editor">
      {/* Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Graph Mode:</span>
          <button
            type="button"
            onClick={() => setGraphMode('value')}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              graphMode === 'value' ? 'bg-indigo-600 font-medium' : 'bg-slate-800 hover:bg-slate-700'
            }`}
            data-testid="mode-value-graph"
          >
            Value Graph
          </button>
          <button
            type="button"
            onClick={() => setGraphMode('speed')}
            className={`text-xs px-2.5 py-1 rounded transition-colors ${
              graphMode === 'speed' ? 'bg-indigo-600 font-medium' : 'bg-slate-800 hover:bg-slate-700'
            }`}
            data-testid="mode-speed-graph"
          >
            Speed Graph
          </button>
        </div>

        {/* Interpolation / Tangent controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Tangent:</span>
          {(['auto', 'smooth', 'linear', 'step'] as TangentMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleInterpolationClick(mode)}
              className={`text-xs px-2 py-0.5 rounded capitalize ${
                tangentMode === mode ? 'bg-emerald-600 font-medium' : 'bg-slate-800 hover:bg-slate-700'
              }`}
              data-testid={`tangent-${mode}`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Zoom / Pan controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoom(0.8)}
            className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
            title="Zoom In"
            data-testid="zoom-in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom(1.25)}
            className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
            title="Zoom Out"
            data-testid="zoom-out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => handlePan(-40)}
            className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
            title="Pan Left"
            data-testid="pan-left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handlePan(40)}
            className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded"
            title="Pan Right"
            data-testid="pan-right"
          >
            →
          </button>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative w-full overflow-hidden bg-slate-900 rounded border border-slate-800" style={{ height }}>
        <svg width={width} height={height} className="w-full h-full block">
          {/* Grid lines */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeDasharray="4 4" />
          <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#334155" strokeDasharray="4 4" />

          {/* Curves */}
          {curves.map((curve) => {
            if (curve.points.length < 2) return null;
            const pathD = curve.points.reduce((acc, pt, idx) => {
              return `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.xPx.toFixed(1)},${pt.yPx.toFixed(1)}`;
            }, '');

            return (
              <g key={curve.trackId} data-testid={`curve-${curve.propertyKey}`}>
                <path d={pathD} fill="none" stroke={curve.color} strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Keyframe Nodes & Tangent Handles */}
          {tracks.map((track) =>
            track.keyframes.map((kf, i) => {
              const x = GraphEditorEngine.timeToPx(kf.timeOffset, viewport);
              const val = graphMode === 'speed' ? GraphEditorEngine.evaluateTrackSpeedAtTime(track, kf.timeOffset) : kf.value;
              const numVal = typeof val === 'number' ? val : Number(val) || 0;
              const y = GraphEditorEngine.valueToPx(numVal, viewport);
              const isSelected = kf.id === activeKeyframeId;

              const handle = GraphEditorEngine.generateTangentHandle(kf, track.keyframes[i - 1], track.keyframes[i + 1], tangentMode);

              return (
                <g key={kf.id} className="keyframe-node cursor-pointer">
                  {/* Tangent lines */}
                  {isSelected && (
                    <>
                      <line
                        x1={x}
                        y1={y}
                        x2={x + handle.handleIn.x}
                        y2={y + handle.handleIn.y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      <circle cx={x + handle.handleIn.x} cy={y + handle.handleIn.y} r="3" fill="#cbd5e1" />
                      <line
                        x1={x}
                        y1={y}
                        x2={x + handle.handleOut.x}
                        y2={y + handle.handleOut.y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      <circle cx={x + handle.handleOut.x} cy={y + handle.handleOut.y} r="3" fill="#cbd5e1" />
                    </>
                  )}

                  {/* Node point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '6' : '4'}
                    fill={isSelected ? '#f59e0b' : '#38bdf8'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    onClick={() => onSelectKeyframe && onSelectKeyframe(track.id, kf.id)}
                    data-testid={`graph-kf-${kf.id}`}
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

export default GraphEditor;
