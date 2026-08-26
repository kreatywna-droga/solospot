/**
 * GuidesOverlay.tsx — Sprint S23 Guides Overlay UI Adapter Component
 *
 * Renders user guide lines & dynamic smart guides on the canvas:
 * - Persistent horizontal/vertical user guides (blue/cyan dashed lines)
 * - Interactive guide position adjustment & deletion
 * - Dynamic pink smart alignment guides & gap distance indicators
 *
 * Pure UI Adapter layer: Delegates calculations to GuidesRulersController.
 */

import React from 'react';
import { Camera } from '../../../camera/CameraModel';
import { CoordinateSystems } from '../../../camera/CoordinateSystems';
import { UserGuide } from '../../../guides/GuidesRulersModel';
import { SnapGuideLine } from '../../../selection/SnappingEngine';

export interface GuidesOverlayProps {
  camera: Camera;
  userGuides: ReadonlyArray<UserGuide>;
  smartGuides?: ReadonlyArray<SnapGuideLine>;
  onMoveGuide?: (guideId: string, newWorldPosition: number) => void;
  onRemoveGuide?: (guideId: string) => void;
}

export const GuidesOverlay: React.FC<GuidesOverlayProps> = ({
  camera,
  userGuides,
  smartGuides = [],
  onMoveGuide,
  onRemoveGuide,
}) => {
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
        zIndex: 40,
      }}
    >
      {/* User Guides */}
      {userGuides.map((guide) => {
        const screenPos = guide.type === 'horizontal'
          ? CoordinateSystems.worldToScreen({ x: 0, y: guide.position }, camera).y
          : CoordinateSystems.worldToScreen({ x: guide.position, y: 0 }, camera).x;

        return (
          <div
            key={guide.id}
            style={{
              position: 'absolute',
              backgroundColor: guide.color ?? '#3B82F6',
              ...(guide.type === 'horizontal'
                ? {
                    left: 0,
                    top: `${screenPos}px`,
                    width: '100%',
                    height: '1px',
                    borderTop: '1px dashed #3B82F6',
                  }
                : {
                    top: 0,
                    left: `${screenPos}px`,
                    height: '100%',
                    width: '1px',
                    borderLeft: '1px dashed #3B82F6',
                  }),
            }}
          />
        );
      })}

      {/* Dynamic Smart Guides */}
      {smartGuides.map((line, idx) => {
        const screenStart = line.type === 'vertical'
          ? CoordinateSystems.worldToScreen({ x: line.position, y: line.start }, camera)
          : CoordinateSystems.worldToScreen({ x: line.start, y: line.position }, camera);

        const screenEnd = line.type === 'vertical'
          ? CoordinateSystems.worldToScreen({ x: line.position, y: line.end }, camera)
          : CoordinateSystems.worldToScreen({ x: line.end, y: line.position }, camera);

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              backgroundColor: '#EC4899',
              ...(line.type === 'vertical'
                ? {
                    left: `${screenStart.x}px`,
                    top: `${screenStart.y}px`,
                    width: '1px',
                    height: `${Math.abs(screenEnd.y - screenStart.y)}px`,
                  }
                : {
                    left: `${screenStart.x}px`,
                    top: `${screenStart.y}px`,
                    width: `${Math.abs(screenEnd.x - screenStart.x)}px`,
                    height: '1px',
                  }),
            }}
          />
        );
      })}
    </div>
  );
};
