import * as React from 'react';
import { MotionPath, MotionPathWaypoint } from '../../../motion/MotionPathEvaluator';
import { MotionPathEditorEngine } from '../../../motion/MotionPathEditorEngine';

export interface MotionPathEditorProps {
  /** The spatial MotionPath being edited. */
  readonly path: MotionPath;
  /** Current animation progress t in [0, 1] for live preview indicator. */
  readonly previewProgress?: number;
  /** Canvas width in pixels. */
  readonly width?: number;
  /** Canvas height in pixels. */
  readonly height?: number;
  /** Callback fired when the path is modified (dispatches command to BuilderDocument). */
  readonly onUpdatePath: (updatedPath: MotionPath) => void;
}

export const MotionPathEditor: React.FC<MotionPathEditorProps> = ({
  path,
  previewProgress = 0,
  width = 800,
  height = 600,
  onUpdatePath,
}) => {
  const [selectedWaypointId, setSelectedWaypointId] = React.useState<string | null>(null);

  // Compute SVG Path D string from waypoints
  const pathString = React.useMemo(() => {
    if (path.waypoints.length === 0) return '';
    let d = `M ${path.waypoints[0].position.x} ${path.waypoints[0].position.y}`;

    for (let i = 0; i < path.waypoints.length - 1; i++) {
      const current = path.waypoints[i];
      const next = path.waypoints[i + 1];

      const cp1X = current.position.x + (current.handleOut?.x || 0);
      const cp1Y = current.position.y + (current.handleOut?.y || 0);
      const cp2X = next.position.x + (next.handleIn?.x || 0);
      const cp2Y = next.position.y + (next.handleIn?.y || 0);

      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.position.x} ${next.position.y}`;
    }

    if (path.closed) d += ' Z';
    return d;
  }, [path]);

  // Compute preview indicator pose
  const previewPose = React.useMemo(() => {
    return MotionPathEditorEngine.evaluatePathPreview(path, previewProgress);
  }, [path, previewProgress]);

  // Actions
  const handleReversePath = () => {
    const reversed = MotionPathEditorEngine.reversePath(path);
    onUpdatePath(reversed);
  };

  const handleSplitSegment = () => {
    const split = MotionPathEditorEngine.splitPathSegment(path, 0);
    onUpdatePath(split);
  };

  const handleWaypointMouseDown = (wpId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWaypointId(wpId);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!selectedWaypointId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updated = MotionPathEditorEngine.moveWaypoint(path, selectedWaypointId, Math.round(x), Math.round(y));
    onUpdatePath(updated);
  };

  const handleSvgMouseUp = () => {
    setSelectedWaypointId(null);
  };

  return (
    <div className="motion-path-editor relative w-full h-full" data-testid="motion-path-editor">
      {/* Path Action Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 backdrop-blur rounded px-2 py-1 shadow">
        <span className="text-xs font-semibold text-slate-300">Motion Path:</span>
        <button
          type="button"
          onClick={handleReversePath}
          className="text-xs px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          data-testid="btn-reverse-path"
        >
          Reverse Path
        </button>
        <button
          type="button"
          onClick={handleSplitSegment}
          className="text-xs px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          data-testid="btn-split-path"
        >
          Split Path
        </button>
      </div>

      {/* SVG Path Layer */}
      <svg
        width={width}
        height={height}
        className="w-full h-full block cursor-crosshair select-none"
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
      >
        {/* Main Spline Path */}
        <path d={pathString} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="6 3" data-testid="motion-path-spline" />

        {/* Preview Object Indicator */}
        <g transform={`translate(${previewPose.x}, ${previewPose.y}) rotate(${(previewPose.angleRad * 180) / Math.PI})`}>
          <polygon points="0,-8 14,0 0,8" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" data-testid="path-preview-indicator" />
        </g>

        {/* Waypoints & Tangent Handles */}
        {path.waypoints.map((wp) => {
          const isSelected = wp.id === selectedWaypointId;

          return (
            <g key={wp.id} className="waypoint-group">
              {/* Tangent Handles */}
              {wp.handleIn && (
                <>
                  <line
                    x1={wp.position.x}
                    y1={wp.position.y}
                    x2={wp.position.x + wp.handleIn.x}
                    y2={wp.position.y + wp.handleIn.y}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <circle cx={wp.position.x + wp.handleIn.x} cy={wp.position.y + wp.handleIn.y} r="3.5" fill="#cbd5e1" />
                </>
              )}
              {wp.handleOut && (
                <>
                  <line
                    x1={wp.position.x}
                    y1={wp.position.y}
                    x2={wp.position.x + wp.handleOut.x}
                    y2={wp.position.y + wp.handleOut.y}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                  <circle cx={wp.position.x + wp.handleOut.x} cy={wp.position.y + wp.handleOut.y} r="3.5" fill="#cbd5e1" />
                </>
              )}

              {/* Waypoint Point Node */}
              <circle
                cx={wp.position.x}
                cy={wp.position.y}
                r={isSelected ? '7' : '5'}
                fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                stroke="#475569"
                strokeWidth="2"
                onMouseDown={(e) => handleWaypointMouseDown(wp.id, e)}
                data-testid={`waypoint-${wp.id}`}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MotionPathEditor;
