import React from 'react';
import type { WorkspaceLayoutModel } from '../../WorkspaceLayout';
import { DockLayoutHost } from './DockLayoutHost';

export interface WorkspaceHostProps {
  layout: WorkspaceLayoutModel;
}

export const WorkspaceHost: React.FC<WorkspaceHostProps> = ({ layout }) => {
  return (
    <div data-testid="workspace-host" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {layout.showPrimaryToolbar && (
        <div data-testid="workspace-toolbar" style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span>{layout.name}</span>
        </div>
      )}
      <DockLayoutHost dockLayout={layout.dockLayout} />
      {layout.showStatusBar && (
        <div data-testid="workspace-statusbar" style={{ padding: '4px 8px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span>Ready — Preset: {layout.activePresetId}</span>
        </div>
      )}
    </div>
  );
};
