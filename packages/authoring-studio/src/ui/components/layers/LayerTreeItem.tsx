/**
 * LayerTreeItem.tsx — Sprint S19 Professional Layers UX (ETAP 6)
 *
 * Tree row component representing a single Layer or LayerGroup.
 * Supports nesting depth, inline renaming, lock/visibility toggles,
 * solo/isolate triggers, and selection state.
 */

import React, { useState } from 'react';
import { Layer } from '../../../scene/SceneGraphModel';

export interface LayerTreeItemProps {
  layer: Layer;
  depth: number;
  isSelected: boolean;
  isExpanded?: boolean;
  onSelect: (layerId: string, multiSelect: boolean) => void;
  onToggleExpand?: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onToggleSolo: (layerId: string) => void;
  onToggleIsolate: (layerId: string) => void;
  onRename: (layerId: string, newName: string) => void;
}

export const LayerTreeItem: React.FC<LayerTreeItemProps> = ({
  layer,
  depth,
  isSelected,
  isExpanded = true,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onToggleSolo,
  onToggleIsolate,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== layer.name) {
      onRename(layer.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(layer.name);
      setIsEditing(false);
    }
  };

  const getLayerTypeIcon = (type: string) => {
    switch (type) {
      case 'group':
        return '📁';
      case 'vector':
        return '📐';
      case 'text':
        return '🔤';
      case 'image':
      case 'media':
        return '🖼️';
      case 'container':
      case 'section':
        return '📦';
      default:
        return '📄';
    }
  };

  return (
    <div
      id={`layer-item-${layer.id}`}
      onClick={(e) => onSelect(layer.id, e.shiftKey || e.metaKey || e.ctrlKey)}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      className={`group flex items-center justify-between h-8 pr-2 text-xs border-b border-slate-800/50 cursor-pointer select-none transition-colors ${
        isSelected
          ? 'bg-indigo-600/30 text-indigo-100 font-medium border-l-2 border-l-indigo-500'
          : 'text-slate-300 hover:bg-slate-800/60'
      }`}
    >
      {/* Left side: Expand arrow + Icon + Layer Name */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {layer.type === 'group' ? (
          <button
            id={`layer-expand-btn-${layer.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(layer.id);
            }}
            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="text-sm">{getLayerTypeIcon(layer.type)}</span>

        {isEditing ? (
          <input
            id={`layer-rename-input-${layer.id}`}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-slate-900 border border-indigo-500 rounded px-1 text-xs text-white focus:outline-none"
          />
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            className="truncate font-sans text-xs tracking-tight"
            title={layer.name}
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Right side: Quick Action Controls */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
        {/* Solo Button */}
        <button
          id={`layer-solo-btn-${layer.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSolo(layer.id);
          }}
          className={`w-5 h-5 text-[10px] font-bold rounded flex items-center justify-center transition-colors ${
            layer.solo
              ? 'bg-amber-500 text-slate-950 font-extrabold'
              : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
          }`}
          title="Toggle Solo mode"
        >
          S
        </button>

        {/* Isolate Button */}
        <button
          id={`layer-isolate-btn-${layer.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleIsolate(layer.id);
          }}
          className={`w-5 h-5 text-[10px] font-bold rounded flex items-center justify-center transition-colors ${
            layer.isolate
              ? 'bg-cyan-500 text-slate-950 font-extrabold'
              : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800'
          }`}
          title="Toggle Isolation mode"
        >
          I
        </button>

        {/* Lock Toggle */}
        <button
          id={`layer-lock-btn-${layer.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(layer.id);
          }}
          className={`w-5 h-5 flex items-center justify-center text-xs transition-colors ${
            layer.locked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
          }`}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>

        {/* Visibility Toggle */}
        <button
          id={`layer-visibility-btn-${layer.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(layer.id);
          }}
          className={`w-5 h-5 flex items-center justify-center text-xs transition-colors ${
            layer.visible ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-400'
          }`}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? '👁️' : '🙈'}
        </button>
      </div>
    </div>
  );
};
