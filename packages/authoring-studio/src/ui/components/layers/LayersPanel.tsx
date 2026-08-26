/**
 * LayersPanel.tsx — Sprint S19 Professional Layers UX (ETAP 6)
 *
 * Full-featured Layers Panel UI Component:
 * - Hierarchy tree view
 * - Search & type filtering
 * - Reordering (Bring Forward / Send Backward / To Front / To Back)
 * - Grouping & Ungrouping
 * - Visibility, Lock, Solo, Isolate toggles
 * - Opacity control & Blend mode selector
 * - Single / Multi selection
 * - Integrated with SceneHistoryBinding and LayerOperationsEngine
 *
 * UI is 100% reactive to Scene state; zero 2nd source of truth.
 */

import React, { useMemo, useState } from 'react';
import {
  BlendMode,
  Layer,
  LayerType,
  Scene,
  createLayer,
} from '../../../scene/SceneGraphModel';
import { LayerOperationsEngine } from '../../../scene/LayerOperationsEngine';
import { LayerSearchFilter } from './LayerSearchFilter';
import { LayerTreeItem } from './LayerTreeItem';

export interface LayersPanelProps {
  scene: Scene;
  onSceneChange: (updatedScene: Scene) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  scene,
  onSceneChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(Object.keys(scene.layers)));
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<LayerType | 'all'>('all');

  const selectedLayer = selectedIds.length === 1 ? scene.layers[selectedIds[0]] : null;

  // Filtered layer set calculation
  const filteredLayerIds = useMemo(() => {
    return Object.keys(scene.layers).filter((id) => {
      const layer = scene.layers[id];
      if (!layer) return false;

      // Filter by name search
      if (searchQuery && !layer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Filter by layer type
      if (typeFilter !== 'all' && layer.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [scene.layers, searchQuery, typeFilter]);

  const handleSelect = (layerId: string, multiSelect: boolean) => {
    if (multiSelect) {
      if (selectedIds.includes(layerId)) {
        setSelectedIds(selectedIds.filter((id) => id !== layerId));
      } else {
        setSelectedIds([...selectedIds, layerId]);
      }
    } else {
      setSelectedIds([layerId]);
    }
  };

  const handleToggleExpand = (groupId: string) => {
    const next = new Set(expandedGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setExpandedGroupIds(next);
  };

  const handleCreateLayer = () => {
    const newId = `layer_${Date.now()}`;
    const newLayer = createLayer({ id: newId, name: `Layer_${newId.slice(-4)}` });
    const updated = LayerOperationsEngine.createLayer(scene, newLayer);
    onSceneChange(updated);
    setSelectedIds([newId]);
  };

  const handleGroupSelected = () => {
    if (selectedIds.length === 0) return;
    const groupId = `group_${Date.now()}`;
    const updated = LayerOperationsEngine.groupLayers(scene, groupId, selectedIds);
    onSceneChange(updated);
    setSelectedIds([groupId]);
  };

  const handleUngroupSelected = () => {
    if (selectedIds.length !== 1) return;
    const targetId = selectedIds[0];
    if (scene.layers[targetId]?.type === 'group') {
      const updated = LayerOperationsEngine.ungroupLayers(scene, targetId);
      onSceneChange(updated);
      setSelectedIds([]);
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    let currentScene = scene;
    const newSelected: string[] = [];

    for (const id of selectedIds) {
      const res = LayerOperationsEngine.duplicateLayer(currentScene, id);
      currentScene = res.scene;
      if (res.duplicatedId) newSelected.push(res.duplicatedId);
    }

    onSceneChange(currentScene);
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    let currentScene = scene;
    for (const id of selectedIds) {
      currentScene = LayerOperationsEngine.deleteLayer(currentScene, id);
    }
    onSceneChange(currentScene);
    setSelectedIds([]);
  };

  const handleReorder = (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    if (selectedIds.length !== 1) return;
    const updated = LayerOperationsEngine.reorderLayer(scene, selectedIds[0], action);
    onSceneChange(updated);
  };

  const handleToggleVisibility = (layerId: string) => {
    const updated = LayerOperationsEngine.toggleVisibility(scene, layerId);
    onSceneChange(updated);
  };

  const handleToggleLock = (layerId: string) => {
    const updated = LayerOperationsEngine.toggleLock(scene, layerId);
    onSceneChange(updated);
  };

  const handleToggleSolo = (layerId: string) => {
    const updated = LayerOperationsEngine.toggleSolo(scene, layerId);
    onSceneChange(updated);
  };

  const handleToggleIsolate = (layerId: string) => {
    const updated = LayerOperationsEngine.toggleIsolate(scene, layerId);
    onSceneChange(updated);
  };

  const handleRename = (layerId: string, newName: string) => {
    const updated = LayerOperationsEngine.renameLayer(scene, layerId, newName);
    onSceneChange(updated);
  };

  const handleOpacityChange = (opacity: number) => {
    if (selectedIds.length === 0) return;
    let currentScene = scene;
    for (const id of selectedIds) {
      currentScene = LayerOperationsEngine.setOpacity(currentScene, id, opacity);
    }
    onSceneChange(currentScene);
  };

  const handleBlendModeChange = (blendMode: BlendMode) => {
    if (selectedIds.length === 0) return;
    let currentScene = scene;
    for (const id of selectedIds) {
      currentScene = LayerOperationsEngine.setBlendMode(currentScene, id, blendMode);
    }
    onSceneChange(currentScene);
  };

  // Render tree recursively
  const renderTree = (layerId: string, depth: number): React.ReactNode => {
    const layer = scene.layers[layerId];
    if (!layer) return null;

    if (searchQuery || typeFilter !== 'all') {
      if (!filteredLayerIds.includes(layerId)) return null;
    }

    const isExpanded = expandedGroupIds.has(layerId);

    return (
      <React.Fragment key={layer.id}>
        <LayerTreeItem
          layer={layer}
          depth={depth}
          isSelected={selectedIds.includes(layer.id)}
          isExpanded={isExpanded}
          onSelect={handleSelect}
          onToggleExpand={handleToggleExpand}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onToggleSolo={handleToggleSolo}
          onToggleIsolate={handleToggleIsolate}
          onRename={handleRename}
        />
        {layer.type === 'group' && isExpanded && layer.childIds && (
          <div>
            {layer.childIds.map((childId) => renderTree(childId, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div id="layers-panel" className="w-80 h-full flex flex-col bg-slate-950 border-r border-slate-800 text-slate-100 font-sans select-none">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-2.5 bg-slate-900 border-b border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Layers</h3>
        <div className="flex items-center gap-1">
          <button
            id="layer-add-btn"
            onClick={handleCreateLayer}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
            title="Create New Layer"
          >
            + New
          </button>
          <button
            id="layer-undo-btn"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 text-xs"
            title="Undo"
          >
            ↩
          </button>
          <button
            id="layer-redo-btn"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30 text-xs"
            title="Redo"
          >
            ↪
          </button>
        </div>
      </div>

      {/* Layer Operations Toolbar */}
      <div className="flex items-center justify-around p-1.5 bg-slate-900/60 border-b border-slate-800 text-xs">
        <button
          id="layer-group-btn"
          onClick={handleGroupSelected}
          disabled={selectedIds.length === 0}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
          title="Group Selected"
        >
          Group
        </button>
        <button
          id="layer-ungroup-btn"
          onClick={handleUngroupSelected}
          disabled={selectedIds.length !== 1 || scene.layers[selectedIds[0]]?.type !== 'group'}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
          title="Ungroup"
        >
          Ungroup
        </button>
        <button
          id="layer-duplicate-btn"
          onClick={handleDuplicateSelected}
          disabled={selectedIds.length === 0}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
          title="Duplicate"
        >
          Duplicate
        </button>
        <button
          id="layer-delete-btn"
          onClick={handleDeleteSelected}
          disabled={selectedIds.length === 0}
          className="px-2 py-1 rounded hover:bg-red-900/40 text-red-400 disabled:opacity-30"
          title="Delete"
        >
          Delete
        </button>
      </div>

      {/* Z-Order Controls */}
      <div className="flex items-center justify-around p-1 bg-slate-900/40 border-b border-slate-800 text-[11px] text-slate-400">
        <button id="layer-reorder-front" onClick={() => handleReorder('bringToFront')} disabled={selectedIds.length !== 1} className="hover:text-white disabled:opacity-30">Top</button>
        <button id="layer-reorder-forward" onClick={() => handleReorder('bringForward')} disabled={selectedIds.length !== 1} className="hover:text-white disabled:opacity-30">Up</button>
        <button id="layer-reorder-backward" onClick={() => handleReorder('sendBackward')} disabled={selectedIds.length !== 1} className="hover:text-white disabled:opacity-30">Down</button>
        <button id="layer-reorder-back" onClick={() => handleReorder('sendToBack')} disabled={selectedIds.length !== 1} className="hover:text-white disabled:opacity-30">Bottom</button>
      </div>

      {/* Search & Filter */}
      <LayerSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypeFilter={typeFilter}
        onFilterChange={setTypeFilter}
      />

      {/* Selected Layer Properties Control Bar */}
      {selectedLayer && (
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 text-xs flex flex-col gap-2">
          {/* Opacity Control */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Opacity:</span>
            <input
              id="layer-opacity-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedLayer.opacity}
              onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <span className="w-8 text-right font-mono text-slate-200">{Math.round(selectedLayer.opacity * 100)}%</span>
          </div>

          {/* Blend Mode Control */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">Blend Mode:</span>
            <select
              id="layer-blendmode-select"
              value={selectedLayer.blendMode}
              onChange={(e) => handleBlendModeChange(e.target.value as BlendMode)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
            </select>
          </div>
        </div>
      )}

      {/* Layer Tree Container */}
      <div id="layer-tree-container" className="flex-1 overflow-y-auto py-1">
        {scene.rootLayerIds.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">No layers in scene.</div>
        ) : (
          scene.rootLayerIds.map((id) => renderTree(id, 0))
        )}
      </div>
    </div>
  );
};
