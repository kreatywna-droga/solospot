import React from 'react';
import { TimelineRuler } from './TimelineRuler';
import { TimelinePlayhead } from './TimelinePlayhead';
import { TimelineTrackView } from './TimelineTrackView';
import { TimelineSelectionOverlay } from './TimelineSelectionOverlay';

export interface TimelineCanvasProps {
  durationMs?: number;
  currentTimeMs?: number;
  selectedKeyframeIds?: ReadonlyArray<string>;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  durationMs = 2000,
  currentTimeMs = 0,
  selectedKeyframeIds = [],
}) => {
  return (
    <div data-testid="timeline-canvas" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <TimelineRuler durationMs={durationMs} zoom={1.0} />
      <TimelinePlayhead currentTimeMs={currentTimeMs} />
      <TimelineSelectionOverlay selectedKeyframeIds={selectedKeyframeIds} />
      <div style={{ marginTop: '10px' }}>
        <TimelineTrackView trackId="t1" propertyKey="opacity" keyframeNames={['0ms (0)', '1000ms (1)']} />
        <TimelineTrackView trackId="t2" propertyKey="transform.scale" keyframeNames={['0ms (1.0)', '1500ms (1.2)']} />
      </div>
    </div>
  );
};
