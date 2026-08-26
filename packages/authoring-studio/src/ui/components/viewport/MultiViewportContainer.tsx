/**
 * MultiViewportContainer.tsx — Sprint S21 Multi-Canvas Layout Container (ETAP 7)
 *
 * Renders Multi-Viewport layout modes (Single, Split Vertical, Split Horizontal, Quad, PiP).
 * All viewports reference the single SSOT BuilderDocument / SceneGraphModel and single CanvasRenderer backend.
 */

import React from 'react';
import { MultiViewportLayout, MultiViewportLayoutMode, ViewportConfiguration } from '../../../camera/ViewportModel';

export interface MultiViewportContainerProps {
  layout: MultiViewportLayout;
  onLayoutChange: (updatedLayout: MultiViewportLayout) => void;
  renderViewportContent: (viewport: ViewportConfiguration) => React.ReactNode;
}

export const MultiViewportContainer: React.FC<MultiViewportContainerProps> = ({
  layout,
  onLayoutChange,
  renderViewportContent,
}) => {
  const handleModeChange = (mode: MultiViewportLayoutMode) => {
    onLayoutChange({
      ...layout,
      layoutMode: mode,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#0F172A' }}>
      {/* Viewport Layout Mode Selector Header */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>Multi-Viewport Workspace</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['single', 'split-vertical', 'split-horizontal', 'quad', 'pip'] as MultiViewportLayoutMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              style={{
                backgroundColor: layout.layoutMode === mode ? '#3B82F6' : '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {mode.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Container for Layout Modes */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {layout.layoutMode === 'single' && (
          <div style={{ width: '100%', height: '100%' }}>
            {layout.viewports[0] && renderViewportContent(layout.viewports[0])}
          </div>
        )}

        {layout.layoutMode === 'split-vertical' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: '100%', gap: '2px', backgroundColor: '#334155' }}>
            <div style={{ backgroundColor: '#0F172A' }}>{layout.viewports[0] && renderViewportContent(layout.viewports[0])}</div>
            <div style={{ backgroundColor: '#0F172A' }}>{layout.viewports[1] ? renderViewportContent(layout.viewports[1]) : layout.viewports[0] && renderViewportContent(layout.viewports[0])}</div>
          </div>
        )}

        {layout.layoutMode === 'split-horizontal' && (
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: '2px', backgroundColor: '#334155' }}>
            <div style={{ backgroundColor: '#0F172A' }}>{layout.viewports[0] && renderViewportContent(layout.viewports[0])}</div>
            <div style={{ backgroundColor: '#0F172A' }}>{layout.viewports[1] ? renderViewportContent(layout.viewports[1]) : layout.viewports[0] && renderViewportContent(layout.viewports[0])}</div>
          </div>
        )}

        {layout.layoutMode === 'quad' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: '2px', backgroundColor: '#334155' }}>
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} style={{ backgroundColor: '#0F172A' }}>
                {renderViewportContent(layout.viewports[idx] ?? layout.viewports[0])}
              </div>
            ))}
          </div>
        )}

        {layout.layoutMode === 'pip' && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {layout.viewports[0] && renderViewportContent(layout.viewports[0])}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '280px',
                height: '180px',
                border: '2px solid #3B82F6',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                backgroundColor: '#0F172A',
              }}
            >
              {renderViewportContent(layout.viewports[1] ?? layout.viewports[0])}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
