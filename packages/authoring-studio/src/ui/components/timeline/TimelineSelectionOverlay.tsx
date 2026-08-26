import React from 'react';

export interface TimelineSelectionOverlayProps {
  selectedKeyframeIds: ReadonlyArray<string>;
}

export const TimelineSelectionOverlay: React.FC<TimelineSelectionOverlayProps> = ({ selectedKeyframeIds }) => {
  if (selectedKeyframeIds.length === 0) return null;
  return (
    <div data-testid="timeline-selection-overlay" style={{ fontSize: '10px', color: '#3b82f6', opacity: 0.8 }}>
      Selected ({selectedKeyframeIds.length}) keyframes
    </div>
  );
};
