import React from 'react';

export interface GlobalSearchProps {
  onQueryChange?: (q: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onQueryChange }) => {
  return (
    <div data-testid="global-search-input" style={{ width: '100%' }}>
      <input
        type="text"
        placeholder="Type a command or search studio actions..."
        onChange={(e) => onQueryChange?.(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '14px', background: '#1e293b', color: '#fff', border: '1px solid #3b82f6' }}
      />
    </div>
  );
};
