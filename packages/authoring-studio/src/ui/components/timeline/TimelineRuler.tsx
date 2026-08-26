import React from 'react';

export interface TimelineRulerProps {
  durationMs: number;
  zoom: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ durationMs }) => {
  return (
    <div data-testid="timeline-ruler" style={{ height: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
      <span style={{ fontSize: '10px', opacity: 0.7 }}>0ms</span>
      <span style={{ fontSize: '10px', opacity: 0.7, float: 'right' }}>{durationMs}ms</span>
    </div>
  );
};
