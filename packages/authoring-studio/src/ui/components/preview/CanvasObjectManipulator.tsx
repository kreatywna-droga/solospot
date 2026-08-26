'use client';

import * as React from 'react';
import { CanvasTransformGizmo, RectBounds, HandleType } from '../../../rendering/CanvasTransformGizmo';

export interface CanvasObjectManipulatorProps {
  /** Array of bounding boxes for currently selected objects on Canvas. */
  readonly selectedBounds: readonly RectBounds[];
  /** Grid snap size in pixels (0 for disabled). */
  readonly gridSize?: number;
  /** Width in pixels of stage. */
  readonly stageWidth?: number;
  /** Height in pixels of stage. */
  readonly stageHeight?: number;
  /** Callback fired when bounds are manipulated by user gesture. */
  readonly onUpdateBounds: (updatedBounds: readonly RectBounds[]) => void;
  /** Callback when user triggers an alignment operation. */
  readonly onAlign?: (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

export const CanvasObjectManipulator: React.FC<CanvasObjectManipulatorProps> = ({
  selectedBounds,
  gridSize = 10,
  stageWidth = 800,
  stageHeight = 600,
  onUpdateBounds,
  onAlign,
}) => {
  const [activeHandle, setActiveHandle] = React.useState<HandleType | 'move' | null>(null);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);

  // Compute aggregated container bounds
  const containerBounds = React.useMemo(() => {
    return CanvasTransformGizmo.computeMultiSelectionBounds(selectedBounds);
  }, [selectedBounds]);

  // Compute handles
  const handles = React.useMemo(() => {
    if (selectedBounds.length === 0) return [];
    return CanvasTransformGizmo.generateHandles(containerBounds);
  }, [selectedBounds, containerBounds]);

  if (selectedBounds.length === 0) return null;

  // Alignment Toolbar Trigger
  const handleAlignClick = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const aligned = CanvasTransformGizmo.alignBounds(selectedBounds, mode);
    onUpdateBounds(aligned);
    if (onAlign) onAlign(mode);
  };

  // Dragging Handlers
  const handleMouseDown = (type: HandleType | 'move', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHandle(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeHandle || !dragStart) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (activeHandle === 'move') {
      const moved = selectedBounds.map((b) => CanvasTransformGizmo.translate(b, dx, dy, gridSize));
      onUpdateBounds(moved);
    } else if (activeHandle === 'rotation') {
      const rotated = selectedBounds.map((b) => CanvasTransformGizmo.rotate(b, e.clientX, e.clientY));
      onUpdateBounds(rotated);
    } else {
      const scaled = selectedBounds.map((b) => CanvasTransformGizmo.scale(b, activeHandle, dx, dy));
      onUpdateBounds(scaled);
    }
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    setDragStart(null);
  };

  return (
    <div
      className="canvas-manipulator absolute inset-0 pointer-events-none select-none"
      style={{ width: stageWidth, height: stageHeight }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      data-testid="canvas-object-manipulator"
    >
      {/* Alignment Toolbar (visible when multi-selected) */}
      {selectedBounds.length > 1 && (
        <div className="absolute top-2 right-2 pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-700 backdrop-blur rounded px-2 py-1 shadow z-20">
          <span className="text-xs font-semibold text-slate-300 mr-1">Align:</span>
          {(['left', 'center', 'right', 'top', 'middle', 'bottom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleAlignClick(mode)}
              className="text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 capitalize"
              data-testid={`align-${mode}`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* Bounding Box Box */}
      <div
        className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-auto cursor-move"
        style={{
          left: containerBounds.x,
          top: containerBounds.y,
          width: containerBounds.width,
          height: containerBounds.height,
          transform: `rotate(${containerBounds.rotationDeg}deg)`,
        }}
        onMouseDown={(e) => handleMouseDown('move', e)}
        data-testid="transform-bounding-box"
      >
        {/* Rotation Link Line */}
        <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-indigo-400" />

        {/* Transform Handles */}
        {handles.map((h) => {
          const isRotation = h.type === 'rotation';
          return (
            <div
              key={h.type}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                isRotation
                  ? 'w-4 h-4 rounded-full bg-amber-400 border-2 border-amber-200 cursor-grab hover:scale-125'
                  : 'w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm hover:scale-125'
              }`}
              style={{
                left: h.x - containerBounds.x,
                top: h.y - containerBounds.y,
                cursor: h.cursor,
              }}
              onMouseDown={(e) => handleMouseDown(h.type, e)}
              data-testid={`handle-${h.type}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CanvasObjectManipulator;
