/**
 * CanvasInteractionViewport.tsx — Sprint S23 Canvas Interaction Viewport UI Adapter Component
 *
 * Professional interactive canvas viewport component uniting:
 * - S21 Multi-viewport camera rendering & zoom controls
 * - S22 SelectionOverlay, transform handles & alignment toolbar
 * - S23 RulersOverlay & GuidesOverlay
 * - Wheel zoom-to-cursor & middle-click / space-drag canvas panning
 * - Marquee drag selection overlay
 * - Closed 5-step interaction coordinate pipeline
 */

import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '../../../camera/CameraModel';
import { UserGuide } from '../../../guides/GuidesRulersModel';
import { CanvasInteractionPipeline, CanvasInteractionState } from '../../../interaction/CanvasInteractionPipeline';
import { Scene } from '../../../scene/SceneGraphModel';
import { SnapGuideLine } from '../../../selection/SnappingEngine';
import { GuidesOverlay } from './GuidesOverlay';
import { RulersOverlay } from './RulersOverlay';
import { SelectionOverlay } from '../selection/SelectionOverlay';
import { ZoomControls } from './ZoomControls';
import { CanvasNavigationController } from '../../../navigation/CanvasNavigationController';

export interface CanvasInteractionViewportProps {
  initialState: CanvasInteractionState;
  onStateChange: (updatedState: CanvasInteractionState) => void;
  width?: number;
  height?: number;
  showRulers?: boolean;
  showGuides?: boolean;
}

export const CanvasInteractionViewport: React.FC<CanvasInteractionViewportProps> = ({
  initialState,
  onStateChange,
  width = 1920,
  height = 1080,
  showRulers = true,
  showGuides = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CanvasInteractionState>(initialState);
  const [activeInteraction, setActiveInteraction] = useState<'NONE' | 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN'>('NONE');
  const [prevScreenPoint, setPrevScreenPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeSmartGuides, setActiveSmartGuides] = useState<ReadonlyArray<SnapGuideLine>>([]);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const updateState = (nextState: CanvasInteractionState) => {
    setState(nextState);
    onStateChange(nextState);
  };

  // 1. Wheel Zoom-To-Cursor
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      const updatedCamera = CanvasNavigationController.zoomToCursor(state.camera, screenPoint, factor);

      updateState({ ...state, camera: updatedCamera });
    } else if (e.shiftKey) {
      // Horizontal pan
      e.preventDefault();
      const updatedCamera = CanvasNavigationController.pan(state.camera, -e.deltaY, 0);
      updateState({ ...state, camera: updatedCamera });
    } else {
      // Vertical pan
      const updatedCamera = CanvasNavigationController.pan(state.camera, 0, -e.deltaY);
      updateState({ ...state, camera: updatedCamera });
    }
  };

  // 2. Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const isMiddleClick = e.button === 1 || e.buttons === 4 || e.shiftKey;

    if (isMiddleClick) {
      setActiveInteraction('PAN');
      setPrevScreenPoint(screenPoint);
      return;
    }

    const result = CanvasInteractionPipeline.handlePointerDown(state, screenPoint, {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey,
    });

    setActiveInteraction(result.interactionType);
    setPrevScreenPoint(screenPoint);
    updateState(result.state);
  };

  // 3. Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeInteraction === 'NONE' || !prevScreenPoint) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const result = CanvasInteractionPipeline.handlePointerMove(
      state,
      screenPoint,
      prevScreenPoint,
      activeInteraction,
      { shiftKey: e.shiftKey, altKey: e.altKey }
    );

    setPrevScreenPoint(screenPoint);
    setActiveSmartGuides(result.guideLines);
    updateState(result.state);
  };

  // 4. Pointer Up
  const handlePointerUp = () => {
    if (activeInteraction !== 'NONE') {
      const nextState = CanvasInteractionPipeline.handlePointerUp(state, activeInteraction);
      setActiveInteraction('NONE');
      setPrevScreenPoint(null);
      setActiveSmartGuides([]);
      updateState(nextState);
    }
  };

  // 5. Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input elements
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const nextState = CanvasInteractionPipeline.handleKeyDown(state, {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });

      if (nextState !== state) {
        updateState(nextState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const handleAddGuide = (newGuide: UserGuide) => {
    updateState({
      ...state,
      userGuides: [...state.userGuides, newGuide],
    });
  };

  const handleSceneChange = (updatedScene: Scene) => {
    updateState({ ...state, scene: updatedScene });
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#020617',
        overflow: 'hidden',
        cursor: activeInteraction === 'PAN' ? 'grab' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Rulers Overlay */}
      {showRulers && (
        <RulersOverlay
          camera={state.camera}
          viewportWidth={width}
          viewportHeight={height}
          userGuides={state.userGuides}
          onAddGuide={handleAddGuide}
        />
      )}

      {/* Guides Overlay */}
      {showGuides && (
        <GuidesOverlay
          camera={state.camera}
          userGuides={state.userGuides}
          smartGuides={activeSmartGuides}
        />
      )}

      {/* Selection & Transform Overlay */}
      <SelectionOverlay
        scene={state.scene}
        selectedNodeIds={state.selection.selectedNodeIds}
        camera={state.camera}
        onSceneChange={handleSceneChange}
        guideLines={activeSmartGuides}
        marqueeRect={
          state.selection.marquee
            ? {
                x: Math.min(state.selection.marquee.startX, state.selection.marquee.currentX),
                y: Math.min(state.selection.marquee.startY, state.selection.marquee.currentY),
                width: Math.abs(state.selection.marquee.currentX - state.selection.marquee.startX),
                height: Math.abs(state.selection.marquee.currentY - state.selection.marquee.startY),
              }
            : null
        }
      />

      {/* Bottom Floating Navigation Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 100,
        }}
      >
        <ZoomControls
          camera={state.camera}
          onCameraChange={(updatedCamera) => updateState({ ...state, camera: updatedCamera })}
        />
      </div>
    </div>
  );
};
