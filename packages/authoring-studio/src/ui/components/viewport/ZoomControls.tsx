/**
 * ZoomControls.tsx — Sprint S21 Professional Viewport UX (ETAP 7)
 *
 * Viewport Zoom & Navigation Bar:
 * - Zoom Level readout & dropdown (25%, 50%, 100%, 200%, Fit to Content, Fit Selection)
 * - Zoom In / Out / Reset View buttons
 * - Rotate View control & Reset Rotation
 * - Pan tool mode toggle
 */

import React from 'react';
import { Camera, CameraBounds } from '../../../camera/CameraModel';
import { CameraOperationsEngine } from '../../../camera/CameraOperationsEngine';

export interface ZoomControlsProps {
  camera: Camera;
  onCameraChange: (updatedCamera: Camera) => void;
  contentBounds?: CameraBounds;
  selectionBounds?: CameraBounds;
  isPanActive?: boolean;
  onTogglePan?: (active: boolean) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  camera,
  onCameraChange,
  contentBounds,
  selectionBounds,
  isPanActive = false,
  onTogglePan,
}) => {
  const zoomPercent = Math.round(camera.transform.zoom * 100);

  const handleZoomIn = () => {
    onCameraChange(CameraOperationsEngine.zoomCamera(camera, 1.25));
  };

  const handleZoomOut = () => {
    onCameraChange(CameraOperationsEngine.zoomCamera(camera, 0.8));
  };

  const handleReset = () => {
    onCameraChange(CameraOperationsEngine.resetView(camera));
  };

  const handleFitContent = () => {
    if (contentBounds) {
      onCameraChange(CameraOperationsEngine.fitToContent(camera, contentBounds));
    }
  };

  const handleFitSelection = () => {
    if (selectionBounds) {
      onCameraChange(CameraOperationsEngine.fitSelection(camera, selectionBounds));
    }
  };

  const handleRotate = (delta: number) => {
    onCameraChange(CameraOperationsEngine.rotateCamera(camera, delta));
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '4px 8px',
        color: '#F8FAFC',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Pan Tool Toggle */}
      {onTogglePan && (
        <button
          onClick={() => onTogglePan(!isPanActive)}
          style={{
            background: isPanActive ? '#3B82F6' : '#334155',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          title="Pan Tool (Space + Drag)"
        >
          ✋ Pan
        </button>
      )}

      <div style={{ width: '1px', height: '16px', backgroundColor: '#334155' }} />

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        style={{
          background: '#334155',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        title="Zoom Out (-)"
      >
        −
      </button>

      {/* Zoom Dropdown Select */}
      <select
        value={zoomPercent}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'fit-content') {
            handleFitContent();
          } else if (val === 'fit-selection') {
            handleFitSelection();
          } else {
            const factor = Number(val) / 100 / camera.transform.zoom;
            onCameraChange(CameraOperationsEngine.zoomCamera(camera, factor));
          }
        }}
        style={{
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          border: '1px solid #334155',
          borderRadius: '4px',
          padding: '4px 6px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        <option value={25}>25%</option>
        <option value={50}>50%</option>
        <option value={75}>75%</option>
        <option value={100}>100% (1:1)</option>
        <option value={150}>150%</option>
        <option value={200}>200%</option>
        <option value={400}>400%</option>
        {contentBounds && <option value="fit-content">Fit to Content</option>}
        {selectionBounds && <option value="fit-selection">Fit Selection</option>}
      </select>

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        style={{
          background: '#334155',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
        title="Zoom In (+)"
      >
        +
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: '#334155' }} />

      {/* View Rotation Controls */}
      <button
        onClick={() => handleRotate(-15)}
        style={{ background: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '11px' }}
        title="Rotate Left 15°"
      >
        ↺ 15°
      </button>

      {camera.transform.rotationDeg !== 0 && (
        <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>
          {Math.round(camera.transform.rotationDeg)}°
        </span>
      )}

      <button
        onClick={() => handleRotate(15)}
        style={{ background: '#334155', color: '#F8FAFC', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '11px' }}
        title="Rotate Right 15°"
      >
        ↻ 15°
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: '#334155' }} />

      {/* Reset View Button */}
      <button
        onClick={handleReset}
        style={{
          background: '#334155',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '11px',
        }}
        title="Reset View (100% & 0°)"
      >
        Reset View
      </button>
    </div>
  );
};
