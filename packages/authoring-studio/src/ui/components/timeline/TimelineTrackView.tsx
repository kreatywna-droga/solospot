import React from 'react';

export interface TimelineTrackViewProps {
  trackId: string;
  propertyKey: string;
  keyframeNames: ReadonlyArray<string>;
}

export const TimelineTrackView: React.FC<TimelineTrackViewProps> = ({ trackId, propertyKey, keyframeNames }) => {
  return (
    <div data-testid={`timeline-track-${trackId}`} style={{ padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
      <span style={{ fontWeight: 600, width: '100px' }}>{propertyKey}</span>
      <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
        {keyframeNames.map((k, i) => (
          <span key={i} style={{ backgroundColor: '#8b5cf6', padding: '2px 4px', borderRadius: '3px', fontSize: '10px' }}>
            {k}
          </span>
        ))}
      </div>
    </div>
  );
};
