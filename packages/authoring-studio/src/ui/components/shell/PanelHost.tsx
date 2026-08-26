import React from 'react';
import type { PanelDescriptor } from '../../PanelRegistry';
import { STANDARD_DESIGN_TOKENS } from '../../DesignTokens';

export interface PanelHostProps {
  panel: PanelDescriptor;
  children?: React.ReactNode;
  onClose?: () => void;
}

export const PanelHost: React.FC<PanelHostProps> = ({ panel, children, onClose }) => {
  return (
    <div
      data-testid={`panel-host-${panel.panelId}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minWidth: panel.minWidth,
        minHeight: panel.minHeight,
        fontFamily: STANDARD_DESIGN_TOKENS.fontFamilySans,
        fontSize: STANDARD_DESIGN_TOKENS.fontSizeMd,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${STANDARD_DESIGN_TOKENS.spacingXs} ${STANDARD_DESIGN_TOKENS.spacingSm}`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontWeight: 600,
        }}
      >
        <span>{panel.title}</span>
        {panel.isCloseable && onClose && (
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: STANDARD_DESIGN_TOKENS.spacingSm }}>
        {children}
      </div>
    </div>
  );
};
