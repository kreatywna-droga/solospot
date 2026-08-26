/**
 * VectorLayersPanel.tsx — G1-32 Visual Document Structure & Layer Management UI
 *
 * Renders the visual layer hierarchy tree for the Vector Editing Subsystem.
 * Supports:
 * - Top-to-bottom z-index visual node list rendering
 * - Bi-directional selection synchronization with Canvas and Inspector
 * - Single-click visibility (eye) toggle button
 * - Single-click lock (padlock) toggle button
 * - Layer z-order reordering actions (Bring Forward, Send Backward, Bring to Front, Send to Back)
 * - Double-click inline node name editing
 * - Group node hierarchy expand / collapse visualization
 */

import React, { useState } from 'react';
import { VectorNode } from '../../../vector/VectorDomainModel';
import { VectorDocumentSnapshot } from '../../../vector/VectorWorkspaceController';
import { LayerReorderAction } from '../../../vector/VectorEditingEngine';

export interface VectorLayersPanelProps {
  /** Current document snapshot containing nodes and selectedIds */
  readonly snapshot: VectorDocumentSnapshot;
  /** Callback fired when user selects nodes in the layer list */
  readonly onSelectNodes: (nodeIds: ReadonlyArray<string>) => void;
  /** Callback fired when user reorders layer z-index */
  readonly onReorderLayer: (direction: LayerReorderAction) => void;
  /** Callback fired when user toggles node lock state */
  readonly onToggleLock: () => void;
  /** Callback fired when user toggles node visibility state */
  readonly onToggleVisibility: () => void;
  /** Callback fired when user renames a node */
  readonly onRenameNode: (nodeId: string, newName: string) => void;
}

export const VectorLayersPanel: React.FC<VectorLayersPanelProps> = ({
  snapshot,
  onSelectNodes,
  onReorderLayer,
  onToggleLock,
  onToggleVisibility,
  onRenameNode,
}) => {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Display nodes in reverse z-index order (top-most layer displayed first in list)
  const displayNodes = [...snapshot.nodes].reverse();

  const handleRowClick = (nodeId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Toggle multi-selection
      const isSelected = snapshot.selectedIds.includes(nodeId);
      const nextSelection = isSelected
        ? snapshot.selectedIds.filter((id: string) => id !== nodeId)
        : [...snapshot.selectedIds, nodeId];
      onSelectNodes(nextSelection);
    } else {
      // Single selection
      onSelectNodes([nodeId]);
    }
  };

  const handleStartRename = (node: VectorNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingNodeId(node.id);
    setEditNameText(node.name || node.type);
  };

  const handleSaveRename = (nodeId: string) => {
    if (editNameText.trim().length > 0) {
      onRenameNode(nodeId, editNameText.trim());
    }
    setEditingNodeId(null);
  };

  const toggleGroupCollapse = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getNodeTypeIcon = (type: VectorNode['type']) => {
    switch (type) {
      case 'rectangle':
        return '🔲';
      case 'ellipse':
        return '⚪';
      case 'polygon':
        return '🔺';
      case 'line':
        return '➖';
      case 'path':
        return '🖋️';
      case 'group':
        return '📁';
      default:
        return '📄';
    }
  };

  return (
    <div
      className="vector-layers-panel"
      data-testid="vector-layers-panel"
      style={{
        width: '260px',
        backgroundColor: '#1e1e24',
        color: '#e0e0e0',
        borderRight: '1px solid #2d2d35',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2d2d35',
          fontWeight: 600,
          letterSpacing: '0.5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>WARSTWY ({snapshot.nodes.length})</span>
        {/* Layer Quick Controls */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            title="Bring to Front"
            onClick={() => onReorderLayer('bringToFront')}
            style={actionButtonStyle}
          >
            ⏫
          </button>
          <button
            title="Bring Forward"
            onClick={() => onReorderLayer('bringForward')}
            style={actionButtonStyle}
          >
            🔼
          </button>
          <button
            title="Send Backward"
            onClick={() => onReorderLayer('sendBackward')}
            style={actionButtonStyle}
          >
            🔽
          </button>
          <button
            title="Send to Back"
            onClick={() => onReorderLayer('sendToBack')}
            style={actionButtonStyle}
          >
            ⏬
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {displayNodes.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              color: '#808090',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            Brak warstw w dokumencie
          </div>
        ) : (
          displayNodes.map((node) => {
            const isSelected = snapshot.selectedIds.includes(node.id);
            const isEditing = editingNodeId === node.id;
            const isGroup = node.type === 'group';
            const isCollapsed = collapsedGroups[node.id];

            return (
              <div
                key={node.id}
                data-testid={`layer-row-${node.id}`}
                onClick={(e) => handleRowClick(node.id, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  backgroundColor: isSelected ? '#2b384e' : 'transparent',
                  borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  opacity: node.visible ? 1 : 0.4,
                }}
              >
                {/* Group Expand/Collapse Toggle */}
                {isGroup && (
                  <span
                    onClick={(e) => toggleGroupCollapse(node.id, e)}
                    style={{ marginRight: '6px', fontSize: '10px' }}
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                )}

                {/* Node Icon */}
                <span style={{ marginRight: '8px', fontSize: '14px' }}>
                  {getNodeTypeIcon(node.type)}
                </span>

                {/* Node Name / Rename Input */}
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editNameText}
                      autoFocus
                      onChange={(e) => setEditNameText(e.target.value)}
                      onBlur={() => handleSaveRename(node.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(node.id);
                        if (e.key === 'Escape') setEditingNodeId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: '#121216',
                        color: '#fff',
                        border: '1px solid #4f46e5',
                        borderRadius: '3px',
                        padding: '2px 4px',
                        fontSize: '12px',
                        width: '90%',
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => handleStartRename(node, e)}
                      style={{
                        color: isSelected ? '#ffffff' : '#c5c5d0',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {node.name || `${node.type} (${node.id.slice(0, 6)})`}
                    </span>
                  )}
                </div>

                {/* Lock Padlock Toggle Button */}
                <button
                  title={node.locked ? 'Unlock Layer' : 'Lock Layer'}
                  data-testid={`lock-btn-${node.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) onSelectNodes([node.id]);
                    onToggleLock();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: node.locked ? '#f59e0b' : '#606070',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '2px 4px',
                    marginRight: '4px',
                  }}
                >
                  {node.locked ? '🔒' : '🔓'}
                </button>

                {/* Visibility Eye Toggle Button */}
                <button
                  title={node.visible ? 'Hide Layer' : 'Show Layer'}
                  data-testid={`visibility-btn-${node.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) onSelectNodes([node.id]);
                    onToggleVisibility();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: node.visible ? '#10b981' : '#606070',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '2px 4px',
                  }}
                >
                  {node.visible ? '👁️' : '🕶️'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const actionButtonStyle: React.CSSProperties = {
  backgroundColor: '#2b2b36',
  color: '#c5c5d0',
  border: '1px solid #3b3b48',
  borderRadius: '4px',
  width: '24px',
  height: '24px',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  fontSize: '11px',
};
