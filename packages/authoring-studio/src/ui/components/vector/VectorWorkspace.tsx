/**
 * VectorWorkspace.tsx — Sprint S18 Vector Workspace (ETAP 6/G1-24)
 *
 * The root component for the isolated Vector editing mode.
 * Ties together Toolbar (UI) -> WorkspaceController (State) -> RenderingBridge (Canvas).
 *
 * Rendering pipeline:
 *   VectorNode[] → VectorRenderingBridge.buildRenderCommands() → RendererCommand[]
 *   → CanvasRenderer.executeCommands() (via CanvasRenderSurface adapter)
 *
 * State management:
 *   React useState holds VectorWorkspaceState (snapshot + historyStack).
 *   All mutations go through pure functional VectorWorkspaceController.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { VectorToolbar } from './VectorToolbar';
import { VectorInspectorPanel } from './VectorInspectorPanel';
import { VectorLayersPanel } from './VectorLayersPanel';
import {
  VectorWorkspaceState,
  createVectorWorkspaceState,
  executeBooleanOperation,
  undoVectorAction,
  redoVectorAction,
  selectNodes,
  updateNode,
  reorderSelectedNodes,
  alignSelectedNodes,
  groupSelectedNodes,
  ungroupSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  deleteSelectedNodes,
  copySelectedNodes,
  cutSelectedNodes,
  pasteClipboard,
  resizeSelectedNodes,
  flipSelectedNodes,
  rotateSelectedNodes,
  distributeSelectedNodes,
  selectAllNodes,
  deselectAllNodes,
  addNode,
  toggleSelectedNodesLock,
  toggleSelectedNodesVisibility,
  selectNodesInMarquee,
} from '../../../vector/VectorWorkspaceController';
import { VectorRenderingBridge } from '../../../rendering/VectorRenderingBridge';
import { CanvasRenderSurface } from '../../../rendering/CanvasRenderSurface';
import { CanvasRenderer } from '../../../rendering/CanvasRenderer';
import { RenderCommandExecutor } from '../../../rendering/RenderCommandExecutor';
import { RendererCommand } from '../../../rendering/RendererCommand';
import { BooleanOperation } from '../../../vector/VectorBooleanEngine';
import { VectorNode, createRectangleNode, createEllipseNode } from '../../../vector/VectorDomainModel';
import { VectorGeometry, ResizeHandle, BoundingBox2D } from '../../../vector/VectorGeometry';
import { VectorEditingEngine } from '../../../vector/VectorEditingEngine';
import { VectorSvgExporter } from '../../../vector/VectorSvgExporter';

export interface VectorWorkspaceProps {
  initialNodes?: VectorNode[];
}

export const VectorWorkspace: React.FC<VectorWorkspaceProps> = ({ initialNodes }) => {
  const [workspaceState, setWorkspaceState] = useState<VectorWorkspaceState>(() => {
    const nodes = initialNodes || [
      createRectangleNode('rect1', 100, 100, 200, 200),
      createEllipseNode('ellipse1', 250, 150, 180, 180),
    ];
    return createVectorWorkspaceState(nodes, [nodes[0].id]);
  });

  const [activeTool, setActiveTool] = useState<string>('select');

  // Drag interaction state
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize' | 'marquee'>('none');
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [marqueeCurrentPos, setMarqueeCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [dragInitialState, setDragInitialState] = useState<VectorWorkspaceState | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const surfaceRef = useRef<CanvasRenderSurface | null>(null);

  // --- RENDERER INITIALIZATION ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const surface = new CanvasRenderSurface(
      canvasRef.current,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    const renderer = new CanvasRenderer();
    renderer.initialize(surface);

    surfaceRef.current = surface;
    rendererRef.current = renderer;

    return () => {
      renderer.destroy();
      surfaceRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // --- RENDERING INTEGRATION ---
  useEffect(() => {
    const renderer = rendererRef.current;
    const surface = surfaceRef.current;
    if (!renderer || !surface || !renderer.isInitialized) return;

    const allCommands: RendererCommand[] = [];

    workspaceState.snapshot.nodes.forEach(node => {
      if (!node.visible) return;
      const commands = VectorRenderingBridge.buildRenderCommands(node);
      allCommands.push(...commands);

      // Highlight selection overlay & 8 resize handles for selected shapes
      if (workspaceState.snapshot.selectedIds.includes(node.id)) {
        const bounds = VectorGeometry.computeBoundingBox(node);
        allCommands.push(
          { type: 'SAVE' },
          {
            type: 'DRAW_RECT',
            nodeId: `${node.id}_sel`,
            bounds,
            strokeStyle: '#0ea5e9',
            strokeWidth: 2,
          },
        );

        // Render 8 handle squares
        const handles = VectorGeometry.getResizeHandlePositions(bounds);
        for (const h of handles) {
          allCommands.push({
            type: 'DRAW_RECT',
            nodeId: `${node.id}_h_${h.handle}`,
            bounds: { x: h.x - 4, y: h.y - 4, width: 8, height: 8 },
            fillStyle: '#ffffff',
            strokeStyle: '#0ea5e9',
            strokeWidth: 1.5,
          });
        }

        allCommands.push({ type: 'RESTORE' });
      }
    });

    // Render marquee selection rectangle overlay if active
    if (dragMode === 'marquee' && marqueeCurrentPos) {
      const marqueeBounds = VectorGeometry.normalizeRect(dragStartPos, marqueeCurrentPos);
      if (marqueeBounds.width > 0 || marqueeBounds.height > 0) {
        allCommands.push(
          { type: 'SAVE' },
          {
            type: 'DRAW_RECT',
            nodeId: 'marquee_overlay',
            bounds: marqueeBounds,
            fillStyle: 'rgba(14, 165, 233, 0.12)',
            strokeStyle: '#0ea5e9',
            strokeWidth: 1.5,
          },
          { type: 'RESTORE' }
        );
      }
    }

    surface.clear();
    RenderCommandExecutor.executeCommands(renderer, allCommands, 0, Date.now());
  }, [workspaceState.snapshot, dragMode, dragStartPos, marqueeCurrentPos]);

  // --- DISPATCHERS ---

  const handleBooleanOperation = useCallback((operation: BooleanOperation) => {
    setWorkspaceState(prevState => executeBooleanOperation(prevState, operation));
  }, []);

  const handleReorderNodes = useCallback((action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    setWorkspaceState(prevState => reorderSelectedNodes(prevState, action));
  }, []);

  const handleAlignNodes = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    setWorkspaceState(prevState => alignSelectedNodes(prevState, alignment));
  }, []);

  const handleDistributeNodes = useCallback((axis: 'horizontal' | 'vertical') => {
    setWorkspaceState(prevState => distributeSelectedNodes(prevState, axis));
  }, []);

  const handleUndo = useCallback(() => {
    setWorkspaceState(prevState => undoVectorAction(prevState));
  }, []);

  const handleRedo = useCallback(() => {
    setWorkspaceState(prevState => redoVectorAction(prevState));
  }, []);

  const handleGroupSelected = useCallback(() => {
    setWorkspaceState(prevState => groupSelectedNodes(prevState));
  }, []);

  const handleUngroupSelected = useCallback(() => {
    setWorkspaceState(prevState => ungroupSelectedNodes(prevState));
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    setWorkspaceState(prevState => duplicateSelectedNodes(prevState));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setWorkspaceState(prevState => deleteSelectedNodes(prevState));
  }, []);

  const handleCopySelected = useCallback(() => {
    setWorkspaceState(prevState => copySelectedNodes(prevState));
  }, []);

  const handleCutSelected = useCallback(() => {
    setWorkspaceState(prevState => cutSelectedNodes(prevState));
  }, []);

  const handlePasteSelected = useCallback(() => {
    setWorkspaceState(prevState => pasteClipboard(prevState));
  }, []);

  const handleSelectShapeTool = useCallback((shapeType: 'rectangle' | 'ellipse' | 'polygon' | 'line' | 'path') => {
    const id = `${shapeType}_${Date.now().toString(36)}`;
    const newShape = VectorEditingEngine.createShape(id, shapeType, 200, 200, 150, 120);
    setWorkspaceState(prev => addNode(prev, newShape));
    setActiveTool('select');
  }, []);

  const handleExportSvg = useCallback(() => {
    const svgString = VectorSvgExporter.exportToSvgString(workspaceState.snapshot);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-export-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [workspaceState.snapshot]);

  // --- MOUSE DRAG & HANDLE RESIZE INTERACTION ---

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const { x, y } = coords;
    const { nodes, selectedIds } = workspaceState.snapshot;

    // 1. Test handle hit if single shape is selected
    if (selectedIds.length === 1) {
      const selectedNode = nodes.find(n => n.id === selectedIds[0]);
      if (selectedNode) {
        const bounds = VectorGeometry.computeBoundingBox(selectedNode);
        const hitHandle = VectorGeometry.hitTestResizeHandles({ x, y }, bounds, 12);
        if (hitHandle) {
          setDragMode('resize');
          setActiveHandle(hitHandle);
          setDragStartPos({ x, y });
          setDragInitialState(workspaceState);
          return;
        }
      }
    }

    // 2. Reverse hit-test shapes (topmost first)
    let hitId: string | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.visible === false || n.locked || (n.opacity !== undefined && n.opacity <= 0)) continue;
      if (VectorGeometry.pointInShape({ x, y }, n)) {
        hitId = n.id;
        break;
      }
    }

    if (hitId) {
      let nextState = workspaceState;
      if (e.shiftKey) {
        const currentSel = workspaceState.snapshot.selectedIds;
        const newSel = currentSel.includes(hitId)
          ? currentSel.filter(id => id !== hitId)
          : [...currentSel, hitId];
        nextState = selectNodes(workspaceState, newSel);
      } else if (!selectedIds.includes(hitId)) {
        nextState = selectNodes(workspaceState, [hitId]);
      }

      setWorkspaceState(nextState);
      setDragMode('move');
      setDragStartPos({ x, y });
      setDragInitialState(nextState);
    } else {
      // Empty canvas click -> initiate marquee drag selection
      let baseState = workspaceState;
      if (!e.shiftKey) {
        baseState = deselectAllNodes(workspaceState);
      }
      setWorkspaceState(baseState);
      setDragMode('marquee');
      setDragStartPos({ x, y });
      setMarqueeCurrentPos({ x, y });
      setDragInitialState(baseState);
    }
  }, [workspaceState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragMode === 'none' || !dragInitialState) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const dx = coords.x - dragStartPos.x;
    const dy = coords.y - dragStartPos.y;

    if (dragMode === 'move') {
      const movedState = moveSelectedNodes(dragInitialState, dx, dy);
      setWorkspaceState(movedState);
    } else if (dragMode === 'resize' && activeHandle) {
      const resizedState = resizeSelectedNodes(dragInitialState, activeHandle, dx, dy, e.shiftKey);
      setWorkspaceState(resizedState);
    } else if (dragMode === 'marquee') {
      setMarqueeCurrentPos({ x: coords.x, y: coords.y });
      const marqueeBounds = VectorGeometry.normalizeRect(dragStartPos, coords);
      const selectedState = selectNodesInMarquee(dragInitialState, marqueeBounds, {
        additive: e.shiftKey,
      });
      setWorkspaceState(selectedState);
    }
  }, [dragMode, dragInitialState, dragStartPos, activeHandle]);

  const handleMouseUp = useCallback(() => {
    setDragMode('none');
    setActiveHandle(null);
    setDragInitialState(null);
    setMarqueeCurrentPos(null);
  }, []);

  // --- KEYBOARD SHORTCUTS INTEGRATION ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setWorkspaceState(prev => deselectAllNodes(prev));
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setWorkspaceState(prev => selectAllNodes(prev));
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) handleUngroupSelected();
        else handleGroupSelected();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCutSelected();
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteSelected();
      } else if (e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          setWorkspaceState(prev => moveSelectedNodes(prev, dx, dy));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    handleGroupSelected,
    handleUngroupSelected,
    handleDuplicateSelected,
    handleCopySelected,
    handleCutSelected,
    handlePasteSelected,
  ]);

  const selectedNodes = workspaceState.snapshot.nodes.filter(n =>
    workspaceState.snapshot.selectedIds.includes(n.id)
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white" data-testid="vector-workspace">
      {/* TOOLBAR */}
      <div className="flex-none p-2 border-b border-slate-800">
        <VectorToolbar
          activeTool={activeTool}
          onSelectShapeTool={handleSelectShapeTool}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={handleUngroupSelected}
          onBooleanOperation={handleBooleanOperation}
          onReorderNodes={handleReorderNodes}
          onAlignNodes={handleAlignNodes}
          canUndo={workspaceState.historyStack.canUndo}
          canRedo={workspaceState.historyStack.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          selectedNodesCount={workspaceState.snapshot.selectedIds.length}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LAYERS PANEL */}
        <VectorLayersPanel
          snapshot={workspaceState.snapshot}
          onSelectNodes={(nodeIds) => {
            setWorkspaceState(prev => selectNodes(prev, [...nodeIds]));
          }}
          onReorderLayer={(direction) => {
            setWorkspaceState(prev => reorderSelectedNodes(prev, direction));
          }}
          onToggleLock={() => {
            setWorkspaceState(prev => toggleSelectedNodesLock(prev));
          }}
          onToggleVisibility={() => {
            setWorkspaceState(prev => toggleSelectedNodesVisibility(prev));
          }}
          onRenameNode={(nodeId, newName) => {
            setWorkspaceState(prev => {
              const node = prev.snapshot.nodes.find(n => n.id === nodeId);
              if (!node) return prev;
              return updateNode(prev, { ...node, name: newName });
            });
          }}
        />

        {/* CANVAS WORKSPACE */}
        <div className="flex-1 relative overflow-auto bg-slate-900 p-8 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-white shadow-xl cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            data-testid="vector-canvas"
          />
        </div>

        {/* INSPECTOR PANEL */}
        <div className="flex-none w-72 border-l border-slate-800 p-2">
          <VectorInspectorPanel
            selectedNode={selectedNodes.length === 1 ? selectedNodes[0] : null}
            selectedNodes={selectedNodes}
            onUpdateNode={(node) => {
              setWorkspaceState(prev => updateNode(prev, node));
            }}
          />
        </div>
      </div>
    </div>
  );
};

