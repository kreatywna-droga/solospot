import React from 'react';

export interface TimelinePlayheadProps {
  currentTimeMs: number;
}

export const TimelinePlayhead: React.FC<TimelinePlayheadProps> = ({ currentTimeMs }) => {
  return (
    <div
      data-testid="timeline-playhead"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '20%',
        width: '2px',
        backgroundColor: '#ef4444',
        zIndex: 10,
      }}
    >
      <span style={{ fontSize: '9px', backgroundColor: '#ef4444', color: '#fff', padding: '1px 3px' }}>
        {currentTimeMs}ms
      </span>
    </div>
  );
};
