import React from 'react';
import type { WorkspaceLayoutModel } from '../../WorkspaceLayout';
import { WorkspaceHost } from './WorkspaceHost';
import { DARK_THEME_COLOR_SCHEME } from '../../ThemeContracts';

export interface StudioShellProps {
  layout: WorkspaceLayoutModel;
  children?: React.ReactNode;
}

export const StudioShell: React.FC<StudioShellProps> = ({ layout, children }) => {
  return (
    <div
      data-testid="studio-shell"
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: DARK_THEME_COLOR_SCHEME.background,
        color: DARK_THEME_COLOR_SCHEME.textPrimary,
        overflow: 'hidden',
      }}
    >
      <WorkspaceHost layout={layout} />
      {children}
    </div>
  );
};
