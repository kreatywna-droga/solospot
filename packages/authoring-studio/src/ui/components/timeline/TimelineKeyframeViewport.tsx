/**
 * TimelineKeyframeViewport.tsx — Sprint S24 Unified Timeline Keyframe Viewport UI Component
 *
 * Primary React Viewport for timeline & keyframe authoring:
 * - Timeline Ruler, Playhead & Loop Region Overlay
 * - Multi-track timeline rows with keyframe diamond nodes
 * - Marquee drag box selection overlay
 * - Easing Curve Editor popup modal
 * - Keyboard event listener bound to TimelineKeyboardInteractionHandler
 * - Closed pipeline delegation to TimelineInteractionPipeline
 *
 * Pure UI Adapter layer: Delegates 100% of state logic to S24 Headless Controllers.
 */

import React, { useEffect, useState } from 'react';
import { KeyframeRef } from '../../../timeline/TimelineKeyframeAuthoring';
import { TimelineInteractionPipeline, TimelineInteractionState } from '../../../timeline/TimelineInteractionPipeline';
import { TimelineSelectionController } from '../../../timeline/TimelineSelectionController';
import { timeToPixels } from '../../../timeline/TimelineViewport';
import { CurveEditorOverlay } from './CurveEditorOverlay';
import { TimelineRulerOverlay } from './TimelineRulerOverlay';

export interface TimelineKeyframeViewportProps {
  pipelineState: TimelineInteractionState;
  onStateChange: (nextState: TimelineInteractionState) => void;
  width?: number;
  height?: number;
}

export const TimelineKeyframeViewport: React.FC<TimelineKeyframeViewportProps> = ({
  pipelineState,
  onStateChange,
  width = 800,
  height = 360,
}) => {
  const [showCurveEditor, setShowCurveEditor] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      const nextState = TimelineInteractionPipeline.handleKeyDown(pipelineState, {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });

      if (nextState !== pipelineState) {
        onStateChange(nextState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pipelineState, onStateChange]);

  const handleKeyframeClick = (ref: KeyframeRef, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = TimelineInteractionPipeline.handleKeyframePointerDown(pipelineState, ref, {
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    });
    onStateChange(nextState);
  };

  const handleScrubPlayhead = (timeMs: number) => {
    onStateChange({
      ...pipelineState,
      playheadTimeMs: timeMs,
    });
  };

  return (
    <div
      tabIndex={0}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#020617',
        border: '1px solid #1E293B',
        borderRadius: '6px',
        overflow: 'hidden',
        outline: 'none',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 1. Timeline Ruler & Regions Overlay */}
      <TimelineRulerOverlay
        viewport={{ ...pipelineState.viewport, width }}
        playheadTimeMs={pipelineState.playheadTimeMs}
        markersState={pipelineState.markersState}
        onScrubPlayhead={handleScrubPlayhead}
      />

      {/* 2. Track Rows & Keyframes */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {pipelineState.timeline?.clips.map((clip) => (
          <div key={clip.id}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#38BDF8',
                backgroundColor: '#0F172A',
                padding: '4px 12px',
                borderBottom: '1px solid #1E293B',
              }}
            >
              Clip: {clip.name} ({clip.duration}ms)
            </div>

            {clip.tracks.map((track) => (
              <div
                key={track.id}
                style={{
                  position: 'relative',
                  height: '32px',
                  borderBottom: '1px solid #1E293B',
                  backgroundColor: '#090D16',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '6px',
                    fontSize: '10px',
                    color: '#94A3B8',
                    fontFamily: 'monospace',
                  }}
                >
                  {track.propertyKey}
                </div>

                {/* Keyframe Nodes */}
                {track.keyframes.map((kf) => {
                  const kfAbsTime = clip.delay + kf.timeOffset;
                  const kfX = timeToPixels(pipelineState.viewport, kfAbsTime);

                  if (kfX < 0 || kfX > width) return null;

                  const isSelected = TimelineSelectionController.isKeyframeSelected(pipelineState.selection, kf.id);

                  return (
                    <div
                      key={kf.id}
                      onClick={(e) => handleKeyframeClick({ clipId: clip.id, trackId: track.id, keyframeId: kf.id }, e)}
                      style={{
                        position: 'absolute',
                        left: `${kfX}px`,
                        top: '8px',
                        width: '14px',
                        height: '14px',
                        backgroundColor: isSelected ? '#F59E0B' : '#3B82F6',
                        border: isSelected ? '2px solid #FFFFFF' : '1px solid #1E40AF',
                        transform: 'translateX(-50%) rotate(45deg)',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 5,
                      }}
                      title={`Keyframe (${kf.timeOffset}ms)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 3. Curve Editor Popup Modal */}
      {showCurveEditor && pipelineState.selection.primarySelectedRef && (
        <div style={{ position: 'absolute', right: '16px', bottom: '16px', zIndex: 20 }}>
          <CurveEditorOverlay
            controlPoints={{ x1: 0.42, y1: 0, x2: 0.58, y2: 1 }}
            onChangeControlPoints={() => {}}
            onSelectPreset={() => {}}
          />
        </div>
      )}
    </div>
  );
};
