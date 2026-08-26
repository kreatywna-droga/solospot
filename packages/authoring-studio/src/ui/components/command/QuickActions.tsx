import React from 'react';

export interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div data-testid="quick-actions-bar" style={{ display: 'flex', gap: '8px', padding: '8px' }}>
      <button onClick={() => onActionClick?.('save')}>💾 Quick Save</button>
      <button onClick={() => onActionClick?.('export')}>📦 Quick Export</button>
      <button onClick={() => onActionClick?.('sync')}>☁️ Cloud Sync</button>
    </div>
  );
};
