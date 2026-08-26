/**
 * TimelineRulerOverlay.tsx — Sprint S24 Timeline Ruler & Regions Overlay UI Component
 *
 * Renders timeline time ruler ticks, active playhead line, loop region bounds, and timeline markers:
 * - Time ruler tick marks scaled by TimelineViewport.pixelsPerMs
 * - Interactive playhead scrubber line
 * - Loop region (loop start time to loop end time)
 * - Named timeline markers flags & labels
 *
 * Pure UI Adapter layer: Delegates calculations to TimelineViewController & TimelineMarkersRegionsController.
 */

import React from 'react';
import { MarkersRegionsState, TimelineMarker } from '../../../timeline/TimelineMarkersRegionsModel';
import { TimelineViewport, timeToPixels, pixelsToTime, visibleTimeRange } from '../../../timeline/TimelineViewport';

export interface TimelineRulerOverlayProps {
  viewport: TimelineViewport;
  playheadTimeMs: number;
  markersState: MarkersRegionsState;
  onScrubPlayhead?: (timeMs: number) => void;
  height?: number;
}

export const TimelineRulerOverlay: React.FC<TimelineRulerOverlayProps> = ({
  viewport,
  playheadTimeMs,
  markersState,
  onScrubPlayhead,
  height = 36,
}) => {
  const stepMs = 100;
  const { startMs: visStartMs, endMs: visEndMs } = visibleTimeRange(viewport);
  const startMs = Math.floor(visStartMs / stepMs) * stepMs;
  const endMs = visEndMs + stepMs;

  const ticks: { timeMs: number; xPx: number; isMajor: boolean }[] = [];
  for (let t = startMs; t <= endMs; t += stepMs) {
    const x = timeToPixels(viewport, t);
    if (x >= 0 && x <= viewport.width) {
      ticks.push({ timeMs: t, xPx: x, isMajor: t % 500 === 0 });
    }
  }

  const playheadX = timeToPixels(viewport, playheadTimeMs);

  const loopStartPx = timeToPixels(viewport, markersState.loopRegion.startTimeMs);
  const loopEndPx = timeToPixels(viewport, markersState.loopRegion.endTimeMs);

  const handleRulerMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const timeMs = pixelsToTime(viewport, clickX);
    if (onScrubPlayhead) {
      onScrubPlayhead(timeMs);
    }
  };

  return (
    <div
      onMouseDown={handleRulerMouseDown}
      style={{
        position: 'relative',
        width: `${viewport.width}px`,
        height: `${height}px`,
        backgroundColor: '#0F172A',
        borderBottom: '1px solid #334155',
        userSelect: 'none',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Loop Region Highlight Bar */}
      {markersState.loopRegion.enabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${loopStartPx}px`,
            width: `${Math.max(0, loopEndPx - loopStartPx)}px`,
            height: '100%',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderLeft: '2px solid #3B82F6',
            borderRight: '2px solid #3B82F6',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Ruler Ticks */}
      {ticks.map((tick, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${tick.xPx}px`,
            bottom: 0,
            width: '1px',
            height: tick.isMajor ? '14px' : '8px',
            backgroundColor: tick.isMajor ? '#94A3B8' : '#475569',
          }}
        >
          {tick.isMajor && (
            <span
              style={{
                position: 'absolute',
                top: '-14px',
                left: '3px',
                fontSize: '9px',
                fontFamily: 'monospace',
                color: '#94A3B8',
                whiteSpace: 'nowrap',
              }}
            >
              {tick.timeMs}ms
            </span>
          )}
        </div>
      ))}

      {/* Timeline Markers Flags */}
      {markersState.markers.map((marker) => {
        const markerX = timeToPixels(viewport, marker.timeMs);
        if (markerX < 0 || markerX > viewport.width) return null;

        return (
          <div
            key={marker.id}
            style={{
              position: 'absolute',
              left: `${markerX}px`,
              top: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              backgroundColor: marker.color ?? '#EC4899',
              color: '#FFFFFF',
              fontSize: '9px',
              padding: '1px 4px',
              borderRadius: '2px',
              transform: 'translateX(-50%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
            title={`${marker.label} (${marker.timeMs}ms)`}
          >
            <span>🚩</span>
            <span>{marker.label}</span>
          </div>
        );
      })}

      {/* Scrubber Playhead Line */}
      {playheadX >= 0 && playheadX <= viewport.width && (
        <div
          style={{
            position: 'absolute',
            left: `${playheadX}px`,
            top: 0,
            width: '2px',
            height: '100%',
            backgroundColor: '#EF4444',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-4px',
              width: '10px',
              height: '10px',
              backgroundColor: '#EF4444',
              borderRadius: '50%',
            }}
          />
        </div>
      )}
    </div>
  );
};
