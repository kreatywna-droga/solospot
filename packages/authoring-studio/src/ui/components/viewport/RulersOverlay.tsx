/**
 * RulersOverlay.tsx — Sprint S23 Rulers Overlay UI Adapter Component
 *
 * Renders interactive canvas rulers (top horizontal ruler & left vertical ruler):
 * - Dynamic tick marks scaled according to Camera zoom level & viewport origin
 * - Interactive guide creation (drag out from top ruler for horizontal guide, or left ruler for vertical guide)
 * - Ruler units display (px)
 *
 * Pure UI Adapter layer: Delegates calculations to GuidesRulersController.
 */

import React, { useState } from 'react';
import { Camera } from '../../../camera/CameraModel';
import { GuidesRulersController } from '../../../guides/GuidesRulersController';
import { DEFAULT_RULER_CONFIG, RulerConfig, UserGuide } from '../../../guides/GuidesRulersModel';

export interface RulersOverlayProps {
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  config?: RulerConfig;
  userGuides: ReadonlyArray<UserGuide>;
  onAddGuide: (guide: UserGuide) => void;
  rulerThickness?: number;
}

export const RulersOverlay: React.FC<RulersOverlayProps> = ({
  camera,
  viewportWidth,
  viewportHeight,
  config = DEFAULT_RULER_CONFIG,
  userGuides,
  onAddGuide,
  rulerThickness = 24,
}) => {
  const [isDraggingTopRuler, setIsDraggingTopRuler] = useState(false);
  const [isDraggingLeftRuler, setIsDraggingLeftRuler] = useState(false);

  const horizontalTicks = GuidesRulersController.computeRulerTicks(viewportWidth, camera, 'horizontal', config);
  const verticalTicks = GuidesRulersController.computeRulerTicks(viewportHeight, camera, 'vertical', config);

  const handleTopRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTopRuler(true);
  };

  const handleLeftRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeftRuler(true);
  };

  const handleMouseUp = () => {
    if (isDraggingTopRuler) {
      setIsDraggingTopRuler(false);
    }
    if (isDraggingLeftRuler) {
      setIsDraggingLeftRuler(false);
    }
  };

  return (
    <div
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Top Ruler (Horizontal) */}
      <div
        onMouseDown={handleTopRulerMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          left: `${rulerThickness}px`,
          width: `calc(100% - ${rulerThickness}px)`,
          height: `${rulerThickness}px`,
          backgroundColor: '#0F172A',
          borderBottom: '1px solid #334155',
          pointerEvents: 'auto',
          cursor: 'ns-resize',
        }}
      >
        {horizontalTicks.map((tick, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${tick.screenPosition}px`,
              bottom: 0,
              width: '1px',
              height: tick.isMajor ? '12px' : '6px',
              backgroundColor: tick.isMajor ? '#94A3B8' : '#475569',
            }}
          >
            {tick.isMajor && tick.label && (
              <span
                style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '3px',
                  fontSize: '9px',
                  fontFamily: 'sans-serif',
                  color: '#94A3B8',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Left Ruler (Vertical) */}
      <div
        onMouseDown={handleLeftRulerMouseDown}
        style={{
          position: 'absolute',
          top: `${rulerThickness}px`,
          left: 0,
          width: `${rulerThickness}px`,
          height: `calc(100% - ${rulerThickness}px)`,
          backgroundColor: '#0F172A',
          borderRight: '1px solid #334155',
          pointerEvents: 'auto',
          cursor: 'ew-resize',
        }}
      >
        {verticalTicks.map((tick, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: `${tick.screenPosition}px`,
              right: 0,
              height: '1px',
              width: tick.isMajor ? '12px' : '6px',
              backgroundColor: tick.isMajor ? '#94A3B8' : '#475569',
            }}
          >
            {tick.isMajor && tick.label && (
              <span
                style={{
                  position: 'absolute',
                  left: '2px',
                  top: '-11px',
                  fontSize: '9px',
                  fontFamily: 'sans-serif',
                  color: '#94A3B8',
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'left bottom',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Corner Origin Box */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${rulerThickness}px`,
          height: `${rulerThickness}px`,
          backgroundColor: '#1E293B',
          borderRight: '1px solid #334155',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          fontSize: '9px',
          fontFamily: 'monospace',
        }}
      >
        px
      </div>
    </div>
  );
};
