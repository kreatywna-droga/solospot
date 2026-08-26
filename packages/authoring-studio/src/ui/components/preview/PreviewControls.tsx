import React from 'react';

export interface PreviewControlsProps {
  onScaleChange?: (scale: number) => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({ onScaleChange }) => {
  return (
    <div data-testid="preview-controls" style={{ display: 'flex', gap: '8px', padding: '4px' }}>
      <button onClick={() => onScaleChange?.(0.5)}>50%</button>
      <button onClick={() => onScaleChange?.(1.0)}>100%</button>
      <button onClick={() => onScaleChange?.(1.5)}>150%</button>
    </div>
  );
};
