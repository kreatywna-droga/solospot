import React from 'react';
import type { DockLayoutState } from '../../DockManager';
import { PanelHost } from './PanelHost';
import { STANDARD_STUDIO_PANELS } from '../../PanelRegistry';

export interface DockLayoutHostProps {
  dockLayout: DockLayoutState;
  onPanelSelect?: (nodeId: string, panelId: string) => void;
}

export const DockLayoutHost: React.FC<DockLayoutHostProps> = ({ dockLayout, onPanelSelect }) => {
  return (
    <div data-testid="dock-layout-host" style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}>
      {dockLayout.nodes.map((node) => {
        const activePanelDesc = STANDARD_STUDIO_PANELS.find((p) => p.panelId === node.activePanelId);
        return (
          <div
            key={node.nodeId}
            data-testid={`dock-node-${node.nodeId}`}
            style={{
              flex: node.splitRatio,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', padding: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {node.panelIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => onPanelSelect?.(node.nodeId, pid)}
                  style={{
                    fontWeight: pid === node.activePanelId ? 'bold' : 'normal',
                    opacity: pid === node.activePanelId ? 1 : 0.6,
                    cursor: 'pointer',
                  }}
                >
                  {pid}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              {activePanelDesc && <PanelHost panel={activePanelDesc} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
