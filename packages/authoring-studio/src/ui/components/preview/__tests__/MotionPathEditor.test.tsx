import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MotionPathEditor } from '../MotionPathEditor';
import { MotionPathEditorEngine } from '../../../../motion/MotionPathEditorEngine';
import type { MotionPath } from '../../../../motion/MotionPathEvaluator';

describe('MotionPathEditor (S14 ETAP 2)', () => {
  const mockPath: MotionPath = {
    id: 'path_1',
    waypoints: [
      { id: 'wp_0', position: { x: 50, y: 100 }, handleOut: { x: 20, y: 0 } },
      { id: 'wp_1', position: { x: 200, y: 300 }, handleIn: { x: -20, y: 0 } },
    ],
    closed: false,
  };

  it('reverses path waypoint order via MotionPathEditorEngine', () => {
    const reversed = MotionPathEditorEngine.reversePath(mockPath);
    expect(reversed.waypoints.length).toBe(2);
    expect(reversed.waypoints[0].position.x).toBe(200);
    expect(reversed.waypoints[1].position.x).toBe(50);
  });

  it('splits path segment by adding midpoint waypoint', () => {
    const split = MotionPathEditorEngine.splitPathSegment(mockPath, 0);
    expect(split.waypoints.length).toBe(3);
    expect(split.waypoints[1].position.x).toBe(125);
    expect(split.waypoints[1].position.y).toBe(200);
  });

  it('renders MotionPathEditor with waypoints and spline path', () => {
    const onUpdate = vi.fn();
    render(<MotionPathEditor path={mockPath} onUpdatePath={onUpdate} />);

    expect(screen.getByTestId('motion-path-editor')).toBeDefined();
    expect(screen.getByTestId('motion-path-spline')).toBeDefined();
    expect(screen.getByTestId('waypoint-wp_0')).toBeDefined();

    // Trigger reverse path button
    const btnReverse = screen.getByTestId('btn-reverse-path');
    fireEvent.click(btnReverse);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
