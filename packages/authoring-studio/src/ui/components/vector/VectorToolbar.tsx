/**
 * VectorToolbar.tsx — Sprint S18 Vector Toolbar UI Component (ETAP 6 / G1-27)
 *
 * Toolbar for vector shape insertion, boolean CSG operations,
 * layer reordering (bring to front, send to back), alignment tools, and undo/redo history controls.
 */

import React from 'react';
import { LayerReorderAction, AlignmentType } from '../../../vector/VectorEditingEngine';

export interface VectorToolbarProps {
  onSelectShapeTool: (shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'line' | 'path') => void;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onBooleanOperation?: (op: 'union' | 'subtract' | 'intersect' | 'xor') => void;
  onReorderNodes?: (action: LayerReorderAction) => void;
  onAlignNodes?: (alignment: AlignmentType) => void;
  activeTool?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExportSvg?: () => void;
  selectedNodesCount?: number;
}

export const VectorToolbar: React.FC<VectorToolbarProps> = ({
  onSelectShapeTool,
  onGroupSelected,
  onUngroupSelected,
  onBooleanOperation,
  onReorderNodes,
  onAlignNodes,
  activeTool = 'select',
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExportSvg,
  selectedNodesCount = 0,
}) => {
  return (
    <div
      className="vector-toolbar flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl text-white text-xs select-none"
      data-testid="vector-toolbar"
    >
      {/* SHAPE TOOLS */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`px-2.5 py-1.5 rounded transition-colors font-medium ${
            activeTool === 'rectangle' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          onClick={() => onSelectShapeTool('rectangle')}
          title="Rectangle Tool (R)"
          data-testid="tool-rectangle"
        >
          <span className="inline-block mr-1">▢</span> Rect
        </button>

        <button
          type="button"
          className={`px-2.5 py-1.5 rounded transition-colors font-medium ${
            activeTool === 'ellipse' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          onClick={() => onSelectShapeTool('ellipse')}
          title="Ellipse Tool (O)"
          data-testid="tool-ellipse"
        >
          <span className="inline-block mr-1">◯</span> Ellipse
        </button>

        <button
          type="button"
          className={`px-2.5 py-1.5 rounded transition-colors font-medium ${
            activeTool === 'polygon' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          onClick={() => onSelectShapeTool('polygon')}
          title="Polygon / Star Tool (P)"
          data-testid="tool-polygon"
        >
          <span className="inline-block mr-1">⬡</span> Polygon
        </button>

        <button
          type="button"
          className={`px-2.5 py-1.5 rounded transition-colors font-medium ${
            activeTool === 'line' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          onClick={() => onSelectShapeTool('line')}
          title="Line Tool (L)"
          data-testid="tool-line"
        >
          <span className="inline-block mr-1">╱</span> Line
        </button>

        <button
          type="button"
          className={`px-2.5 py-1.5 rounded transition-colors font-medium ${
            activeTool === 'path' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
          onClick={() => onSelectShapeTool('path')}
          title="Path Tool (V)"
          data-testid="tool-path"
        >
          <span className="inline-block mr-1">✒</span> Path
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700 mx-1" />

      {/* LAYER REORDER CONTROLS */}
      {onReorderNodes && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={selectedNodesCount === 0}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onReorderNodes('bringToFront')}
            title="Bring to Front"
            data-testid="btn-bring-to-front"
          >
            ⤊ Front
          </button>
          <button
            type="button"
            disabled={selectedNodesCount === 0}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onReorderNodes('bringForward')}
            title="Bring Forward"
            data-testid="btn-bring-forward"
          >
            ↑ Forward
          </button>
          <button
            type="button"
            disabled={selectedNodesCount === 0}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onReorderNodes('sendBackward')}
            title="Send Backward"
            data-testid="btn-send-backward"
          >
            ↓ Backward
          </button>
          <button
            type="button"
            disabled={selectedNodesCount === 0}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onReorderNodes('sendToBack')}
            title="Send to Back"
            data-testid="btn-send-to-back"
          >
            ⤋ Back
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-slate-700 mx-1" />

      {/* ALIGNMENT CONTROLS */}
      {onAlignNodes && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('left')}
            title="Align Left"
            data-testid="btn-align-left"
          >
            ⇤ Left
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('center')}
            title="Align Center"
            data-testid="btn-align-center"
          >
            ⇥ Center ⇤
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('right')}
            title="Align Right"
            data-testid="btn-align-right"
          >
            ⇥ Right
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('top')}
            title="Align Top"
            data-testid="btn-align-top"
          >
            ⤓ Top
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('middle')}
            title="Align Middle"
            data-testid="btn-align-middle"
          >
            ⇵ Middle
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onAlignNodes('bottom')}
            title="Align Bottom"
            data-testid="btn-align-bottom"
          >
            ⤒ Bottom
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-slate-700 mx-1" />

      {/* CSG BOOLEAN OPERATIONS */}
      {onBooleanOperation && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onBooleanOperation('union')}
            title="Union Shapes"
            data-testid="btn-boolean-union"
          >
            Union
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onBooleanOperation('subtract')}
            title="Subtract Shapes"
            data-testid="btn-boolean-subtract"
          >
            Subtract
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onBooleanOperation('intersect')}
            title="Intersect Shapes"
            data-testid="btn-boolean-intersect"
          >
            Intersect
          </button>
          <button
            type="button"
            disabled={selectedNodesCount < 2}
            className="px-2 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            onClick={() => onBooleanOperation('xor')}
            title="Exclude Shapes (XOR)"
            data-testid="btn-boolean-xor"
          >
            XOR
          </button>
        </div>
      )}

      <div className="h-4 w-px bg-slate-700 mx-1" />

      {/* UNDO / REDO CONTROLS */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canUndo}
          className="px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          data-testid="btn-undo"
        >
          ↺ Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          className="px-2.5 py-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          data-testid="btn-redo"
        >
          ↻ Redo
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700 mx-1" />

      {/* EXPORT SVG CONTROL */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm"
          onClick={onExportSvg}
          title="Export as SVG"
          data-testid="btn-export-svg"
        >
          <span className="inline-block mr-1">💾</span> Export SVG
        </button>
      </div>

      {selectedNodesCount > 0 && (
        <span className="ml-auto text-xs text-slate-400 font-mono" data-testid="selected-count">
          {selectedNodesCount} selected
        </span>
      )}
    </div>
  );
};
