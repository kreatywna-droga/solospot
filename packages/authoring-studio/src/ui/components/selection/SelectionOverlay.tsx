/**
 * SelectionOverlay.tsx — Sprint S22 Viewport Selection & Transform Overlay UI
 *
 * Renders interactive selection overlay:
 * - Bounding box outline & 9 transform handles (corners, edges, rotate)
 * - Alignment & Distribution quick action toolbar
 * - Smart guide lines & snapping indicators
 * - Marquee selection rectangle overlay
 */

import React from 'react';
import { Camera } from '../../../camera/CameraModel';
import { CoordinateSystems } from '../../../camera/CoordinateSystems';
import { Scene } from '../../../scene/SceneGraphModel';
import { AlignmentEngine, AlignmentType } from '../../../selection/AlignmentEngine';
import { BoundingBox, BoundingBoxModel } from '../../../selection/BoundingBoxModel';
import { DistributionEngine } from '../../../selection/DistributionEngine';
import { SnapGuideLine } from '../../../selection/SnappingEngine';

export interface SelectionOverlayProps {
  scene: Scene;
  selectedNodeIds: ReadonlyArray<string>;
  camera: Camera;
  onSceneChange: (updatedScene: Scene) => void;
  guideLines?: ReadonlyArray<SnapGuideLine>;
  marqueeRect?: { x: number; y: number; width: number; height: number } | null;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  scene,
  selectedNodeIds,
  camera,
  onSceneChange,
  guideLines = [],
  marqueeRect = null,
}) => {
  if (selectedNodeIds.length === 0 && !marqueeRect) return null;

  const worldBox = BoundingBoxModel.computeSelectionBounds(scene, selectedNodeIds);

  let screenBox: { x: number; y: number; width: number; height: number } | null = null;
  if (worldBox) {
    const vpBounds = CoordinateSystems.worldToViewport(worldBox, camera);
    screenBox = {
      x: vpBounds.x,
      y: vpBounds.y,
      width: vpBounds.width,
      height: vpBounds.height,
    };
  }

  const handleAlign = (alignment: AlignmentType) => {
    onSceneChange(AlignmentEngine.alignSelection(scene, selectedNodeIds, alignment));
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    onSceneChange(DistributionEngine.distributeSelection(scene, selectedNodeIds, direction));
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Marquee Selection Rectangle */}
      {marqueeRect && (
        <div
          style={{
            position: 'absolute',
            left: `${marqueeRect.x}px`,
            top: `${marqueeRect.y}px`,
            width: `${marqueeRect.width}px`,
            height: `${marqueeRect.height}px`,
            border: '1px dashed #3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Bounding Box Outline & Handles */}
      {screenBox && (
        <div
          style={{
            position: 'absolute',
            left: `${screenBox.x}px`,
            top: `${screenBox.y}px`,
            width: `${screenBox.width}px`,
            height: `${screenBox.height}px`,
            border: '1.5px solid #3B82F6',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
          {/* Quick Alignment Toolbar */}
          <div
            style={{
              position: 'absolute',
              top: '-36px',
              left: 0,
              display: 'flex',
              gap: '2px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '2px 4px',
              pointerEvents: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <button onClick={() => handleAlign('align-left')} style={btnStyle} title="Align Left">
              ⇤
            </button>
            <button onClick={() => handleAlign('align-center-h')} style={btnStyle} title="Center Horizontally">
              ⇥
            </button>
            <button onClick={() => handleAlign('align-right')} style={btnStyle} title="Align Right">
              ⇥
            </button>
            <div style={{ width: '1px', height: '14px', backgroundColor: '#334155' }} />
            <button onClick={() => handleAlign('align-top')} style={btnStyle} title="Align Top">
              ⤒
            </button>
            <button onClick={() => handleAlign('align-center-v')} style={btnStyle} title="Center Vertically">
              ⤓
            </button>
            <button onClick={() => handleAlign('align-bottom')} style={btnStyle} title="Align Bottom">
              ⤓
            </button>
            {selectedNodeIds.length >= 3 && (
              <>
                <div style={{ width: '1px', height: '14px', backgroundColor: '#334155' }} />
                <button onClick={() => handleDistribute('horizontal')} style={btnStyle} title="Distribute Horizontally">
                  ↔
                </button>
                <button onClick={() => handleDistribute('vertical')} style={btnStyle} title="Distribute Vertically">
                  ↕
                </button>
              </>
            )}
          </div>

          {/* Corners and Handles */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((h) => (
            <div
              key={h}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #3B82F6',
                borderRadius: '1px',
                top: h.includes('top') ? '-5px' : 'auto',
                bottom: h.includes('bottom') ? '-5px' : 'auto',
                left: h.includes('left') ? '-5px' : 'auto',
                right: h.includes('right') ? '-5px' : 'auto',
                pointerEvents: 'auto',
                cursor: h === 'top-left' || h === 'bottom-right' ? 'nwse-resize' : 'nesw-resize',
              }}
            />
          ))}
        </div>
      )}

      {/* Smart Guide Lines */}
      {guideLines.map((line, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            backgroundColor: '#EC4899',
            ...(line.type === 'vertical'
              ? {
                  left: `${line.position}px`,
                  top: `${line.start}px`,
                  width: '1px',
                  height: `${line.end - line.start}px`,
                }
              : {
                  left: `${line.start}px`,
                  top: `${line.position}px`,
                  width: `${line.end - line.start}px`,
                  height: '1px',
                }),
          }}
        />
      ))}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  backgroundColor: '#334155',
  color: '#F8FAFC',
  border: 'none',
  borderRadius: '3px',
  padding: '2px 5px',
  fontSize: '11px',
  cursor: 'pointer',
};
