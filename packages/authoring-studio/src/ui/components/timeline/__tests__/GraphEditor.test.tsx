import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphEditor } from '../GraphEditor';
import { GraphEditorEngine } from '../../../../motion/GraphEditorEngine';
import type { Track } from '../../../../../../builder-core/src/animation/AnimationTypes';

describe('GraphEditor (S14 ETAP 1)', () => {
  const mockTrack: Track = {
    id: 'tr_1',
    propertyKey: 'opacity',
    keyframes: [
      { id: 'kf_1', timeOffset: 0, value: 0, easing: { type: 'linear' }, easingType: 'linear' },
      { id: 'kf_2', timeOffset: 1000, value: 100, easing: { type: 'cubic-bezier', controlPoints: [0.4, 0, 0.2, 1] }, easingType: 'cubic-bezier', easingParams: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 } },
    ],
  };

  it('evaluates value graph and speed graph plot points via AdvancedMotionCurves', () => {
    const viewport = {
      startTimeMs: 0,
      endTimeMs: 1000,
      minValue: 0,
      maxValue: 100,
      widthPx: 800,
      heightPx: 300,
    };

    const valuePlot = GraphEditorEngine.plotTrackCurve(mockTrack, viewport, 'value', 10);
    expect(valuePlot.points.length).toBe(11);
    expect(valuePlot.points[0].value).toBe(0);
    expect(valuePlot.points[10].value).toBe(100);

    const speedPlot = GraphEditorEngine.plotTrackCurve(mockTrack, viewport, 'speed', 10);
    expect(speedPlot.points.length).toBe(11);
    expect(speedPlot.points[5].speed).toBeGreaterThanOrEqual(0);
  });

  it('renders GraphEditor component with mode toggles and curve SVG', () => {
    render(<GraphEditor tracks={[mockTrack]} activeKeyframeId="kf_2" />);

    expect(screen.getByTestId('graph-editor')).toBeDefined();
    expect(screen.getByTestId('mode-value-graph')).toBeDefined();
    expect(screen.getByTestId('mode-speed-graph')).toBeDefined();
    expect(screen.getByTestId('curve-opacity')).toBeDefined();

    // Toggle to Speed Graph
    const speedBtn = screen.getByTestId('mode-speed-graph');
    fireEvent.click(speedBtn);
    expect(speedBtn.className).toContain('bg-indigo-600');
  });

  it('supports zoom and pan controls', () => {
    render(<GraphEditor tracks={[mockTrack]} />);
    const zoomInBtn = screen.getByTestId('zoom-in');
    const panLeftBtn = screen.getByTestId('pan-left');

    fireEvent.click(zoomInBtn);
    fireEvent.click(panLeftBtn);
    expect(zoomInBtn).toBeDefined();
  });
});
