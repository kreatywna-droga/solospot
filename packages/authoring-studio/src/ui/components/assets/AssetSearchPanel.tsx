import React from 'react';

export interface AssetSearchPanelProps {
  onQueryChange?: (query: string) => void;
}

export const AssetSearchPanel: React.FC<AssetSearchPanelProps> = ({ onQueryChange }) => {
  return (
    <div data-testid="asset-search-panel" style={{ padding: '4px' }}>
      <input
        type="text"
        placeholder="Filter assets by tag or name..."
        onChange={(e) => onQueryChange?.(e.target.value)}
        style={{ width: '100%', padding: '6px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
      />
    </div>
  );
};
