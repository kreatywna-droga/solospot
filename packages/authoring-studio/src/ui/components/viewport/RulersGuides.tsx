/**
 * RulersGuides.tsx — Sprint S21 Viewport Rulers, Grid & Guides Overlay (ETAP 7)
 *
 * Viewport Rulers, Grid, Guides & Safe Area Overlay Controls:
 * - Pixel Rulers toggle
 * - Grid Overlay toggle (8px / 16px grid)
 * - Snap-to-Grid configuration
 * - Guide lines rendering & management
 * - Safe Area bounds overlay (16:9 / 4:3)
 */

import React, { useState } from 'react';
import { Camera } from '../../../camera/CameraModel';

export interface RulersGuidesConfig {
  showRulers: boolean;
  showGrid: boolean;
  gridSize: number; // e.g. 8 or 16
  snapToGrid: boolean;
  showGuides: boolean;
  showSafeArea: boolean;
  aspectRatio: '16:9' | '4:3' | '1:1';
}

export interface RulersGuidesProps {
  camera: Camera;
  config: RulersGuidesConfig;
  onConfigChange: (updatedConfig: RulersGuidesConfig) => void;
}

export const RulersGuides: React.FC<RulersGuidesProps> = ({
  config,
  onConfigChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>📐 View Options</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '12px',
            width: '220px',
            zIndex: 100,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: '#F8FAFC',
            fontSize: '12px',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Show Rulers:</span>
            <input
              type="checkbox"
              checked={config.showRulers}
              onChange={(e) => onConfigChange({ ...config, showRulers: e.target.checked })}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Show Grid:</span>
            <input
              type="checkbox"
              checked={config.showGrid}
              onChange={(e) => onConfigChange({ ...config, showGrid: e.target.checked })}
            />
          </label>

          {config.showGrid && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Grid Size:</span>
              <select
                value={config.gridSize}
                onChange={(e) => onConfigChange({ ...config, gridSize: Number(e.target.value) })}
                style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '3px', padding: '2px 6px', fontSize: '11px' }}
              >
                <option value={8}>8px</option>
                <option value={16}>16px</option>
                <option value={32}>32px</option>
                <option value={64}>64px</option>
              </select>
            </label>
          )}

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Snap to Grid:</span>
            <input
              type="checkbox"
              checked={config.snapToGrid}
              onChange={(e) => onConfigChange({ ...config, snapToGrid: e.target.checked })}
            />
          </label>

          <div style={{ height: '1px', backgroundColor: '#1E293B', margin: '4px 0' }} />

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Show Guides:</span>
            <input
              type="checkbox"
              checked={config.showGuides}
              onChange={(e) => onConfigChange({ ...config, showGuides: e.target.checked })}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>Safe Area:</span>
            <input
              type="checkbox"
              checked={config.showSafeArea}
              onChange={(e) => onConfigChange({ ...config, showSafeArea: e.target.checked })}
            />
          </label>

          {config.showSafeArea && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>Aspect Ratio:</span>
              <select
                value={config.aspectRatio}
                onChange={(e) => onConfigChange({ ...config, aspectRatio: e.target.value as any })}
                style={{ backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '3px', padding: '2px 6px', fontSize: '11px' }}
              >
                <option value="16:9">16:9 (Widescreen)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
};
