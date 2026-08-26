import React from 'react';
import { GlobalSearch } from './GlobalSearch';
import { QuickActions } from './QuickActions';

export interface CommandPaletteDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CommandPaletteDialog: React.FC<CommandPaletteDialogProps> = ({ isOpen = false, onClose }) => {
  if (!isOpen) return null;
  return (
    <div
      data-testid="command-palette-dialog"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '100px',
        zIndex: 1000,
      }}
    >
      <div style={{ width: '600px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3>Command Palette (Ctrl+Shift+P)</h3>
          <button onClick={onClose}>×</button>
        </div>
        <GlobalSearch />
        <QuickActions />
      </div>
    </div>
  );
};
