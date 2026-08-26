import React from 'react';

export interface MultiSelectionInspectorProps {
  selectedCount?: number;
}

export const MultiSelectionInspector: React.FC<MultiSelectionInspectorProps> = ({ selectedCount = 0 }) => {
  if (selectedCount <= 1) return null;
  return (
    <div data-testid="multi-selection-inspector" style={{ padding: '8px', border: '1px dashed #3b82f6' }}>
      <span>Batch Inspector ({selectedCount} items selected)</span>
    </div>
  );
};
