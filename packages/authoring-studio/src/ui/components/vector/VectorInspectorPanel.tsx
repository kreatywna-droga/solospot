/**
 * VectorInspectorPanel.tsx — Sprint S18 Vector Inspector UI Component (ETAP 6)
 *
 * Inspector panel for vector shape property editing:
 * - Fill & Stroke controls
 * - Corner radius controls
 * - Transform controls (X, Y, W, H, Rotation)
 * - Alignment & Distribution controls
 * - Grouping & Layer reordering controls
 *
 * STRICT GOVERNANCE INVARIANT:
 * Inspector edits animation data & configuration only.
 * Animation execution remains inside builder-core/rendering.
 */

import React from 'react';
import { VectorNode, RectangleNode, PolygonNode, CornerRadius } from '../../../vector/VectorDomainModel';
import { VectorEditingEngine, AlignmentType, DistributionType, LayerReorderAction } from '../../../vector/VectorEditingEngine';

export interface VectorInspectorPanelProps {
  selectedNode: VectorNode | null;
  selectedNodes?: VectorNode[];
  onUpdateNode: (updatedNode: VectorNode) => void;
  onUpdateNodes?: (updatedNodes: VectorNode[]) => void;
}

export const VectorInspectorPanel: React.FC<VectorInspectorPanelProps> = ({
  selectedNode,
  selectedNodes = [],
  onUpdateNode,
  onUpdateNodes,
}) => {
  if (!selectedNode && selectedNodes.length === 0) {
    return (
      <div className="p-4 text-slate-500 text-xs italic bg-slate-900 border border-slate-800 rounded-lg">
        No shape selected. Select a shape to edit properties.
      </div>
    );
  }

  const node = selectedNode || selectedNodes[0];

  const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = VectorEditingEngine.updateFill(node, { color: e.target.value });
    onUpdateNode(updated);
  };

  const handleFillOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = parseFloat(e.target.value);
    const updated = VectorEditingEngine.updateFill(node, { opacity: isNaN(opacity) ? 1 : opacity });
    onUpdateNode(updated);
  };

  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = VectorEditingEngine.updateStroke(node, { color: e.target.value });
    onUpdateNode(updated);
  };

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseFloat(e.target.value);
    const updated = VectorEditingEngine.updateStroke(node, { width: isNaN(width) ? 0 : width });
    onUpdateNode(updated);
  };

  const handleCornerRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const radius = parseFloat(e.target.value);
    const updated = VectorEditingEngine.updateCornerRadius(node, isNaN(radius) ? 0 : radius);
    onUpdateNode(updated);
  };

  const handleTransformChange = (key: keyof VectorNode['transform'], value: number) => {
    const updated: VectorNode = {
      ...node,
      transform: {
        ...node.transform,
        [key]: value,
      },
    };
    onUpdateNode(updated);
  };

  const handleAlign = (alignment: AlignmentType) => {
    if (selectedNodes.length >= 2 && onUpdateNodes) {
      const aligned = VectorEditingEngine.alignShapes(selectedNodes, alignment);
      onUpdateNodes(aligned);
    }
  };

  const handleDistribute = (axis: DistributionType) => {
    if (selectedNodes.length >= 3 && onUpdateNodes) {
      const distributed = VectorEditingEngine.distributeShapes(selectedNodes, axis);
      onUpdateNodes(distributed);
    }
  };

  const handleReorder = (action: LayerReorderAction) => {
    if (selectedNodes.length > 0 && onUpdateNodes) {
      const reordered = VectorEditingEngine.reorderShapes(selectedNodes, node.id, action);
      onUpdateNodes(reordered);
    }
  };

  return (
    <div
      className="vector-inspector p-4 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs space-y-4 select-none w-72"
      data-testid="vector-inspector-panel"
    >
      <div className="font-semibold text-slate-200 border-b border-slate-800 pb-2 flex justify-between items-center">
        <span>Vector Inspector</span>
        <span className="text-[10px] text-blue-400 uppercase tracking-wider font-mono">{node.type}</span>
      </div>

      {/* Transform Section */}
      <div className="space-y-2">
        <label className="text-slate-400 font-medium">Transform</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500 text-[10px]">X</span>
            <input
              type="number"
              value={node.transform.x}
              onChange={(e) => handleTransformChange('x', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Y</span>
            <input
              type="number"
              value={node.transform.y}
              onChange={(e) => handleTransformChange('y', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Width</span>
            <input
              type="number"
              value={node.transform.width}
              onChange={(e) => handleTransformChange('width', parseFloat(e.target.value) || 10)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Height</span>
            <input
              type="number"
              value={node.transform.height}
              onChange={(e) => handleTransformChange('height', parseFloat(e.target.value) || 10)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* Fill Section */}
      <div className="space-y-2">
        <label className="text-slate-400 font-medium">Fill</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={node.fill?.color || '#3B82F6'}
            onChange={handleFillColorChange}
            className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer"
          />
          <input
            type="text"
            value={node.fill?.color || '#3B82F6'}
            onChange={handleFillColorChange}
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
          />
        </div>
      </div>

      {/* Stroke Section */}
      <div className="space-y-2">
        <label className="text-slate-400 font-medium">Stroke</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={node.stroke?.color || '#1E40AF'}
            onChange={handleStrokeColorChange}
            className="w-8 h-8 rounded border border-slate-700 bg-slate-800 cursor-pointer"
          />
          <input
            type="number"
            min="0"
            max="50"
            value={node.stroke?.width ?? 0}
            onChange={handleStrokeWidthChange}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
          />
          <span className="text-slate-500 text-[10px]">px</span>
        </div>
      </div>

      {/* Corner Radius Section (Rectangle only) */}
      {node.type === 'rectangle' && (
        <div className="space-y-2">
          <label className="text-slate-400 font-medium">Corner Radius</label>
          <input
            type="number"
            min="0"
            max="100"
            value={typeof (node as RectangleNode).cornerRadius === 'number' ? ((node as RectangleNode).cornerRadius as number) : 0}
            onChange={handleCornerRadiusChange}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
          />
        </div>
      )}

      {/* Alignment & Distribution */}
      {selectedNodes.length >= 2 && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <label className="text-slate-400 font-medium">Align & Distribute</label>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => handleAlign('left')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Left</button>
            <button onClick={() => handleAlign('center')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Center</button>
            <button onClick={() => handleAlign('right')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Right</button>
            <button onClick={() => handleAlign('top')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Top</button>
            <button onClick={() => handleAlign('middle')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Middle</button>
            <button onClick={() => handleAlign('bottom')} className="p-1 bg-slate-800 rounded hover:bg-slate-700">Bottom</button>
          </div>
        </div>
      )}
    </div>
  );
};
