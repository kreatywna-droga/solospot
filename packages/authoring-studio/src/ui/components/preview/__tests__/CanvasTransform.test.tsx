import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasObjectManipulator } from '../CanvasObjectManipulator';
import { CanvasTransformGizmo, RectBounds } from '../../../../rendering/CanvasTransformGizmo';

describe('CanvasTransformGizmo & Manipulator (S14 ETAP 3)', () => {
  const boundsA: RectBounds = { x: 100, y: 100, width: 200, height: 150, rotationDeg: 0 };
  const boundsB: RectBounds = { x: 400, y: 200, width: 100, height: 100, rotationDeg: 0 };

  it('computes aggregated multi-selection bounding box', () => {
    const multi = CanvasTransformGizmo.computeMultiSelectionBounds([boundsA, boundsB]);
    expect(multi.x).toBe(100);
    expect(multi.y).toBe(100);
    expect(multi.width).toBe(400); // 500 - 100
    expect(multi.height).toBe(200); // 300 - 100
  });

  it('aligns multiple bounding boxes according to alignment mode', () => {
    const alignedLeft = CanvasTransformGizmo.alignBounds([boundsA, boundsB], 'left');
    expect(alignedLeft[0].x).toBe(100);
    expect(alignedLeft[1].x).toBe(100);

    const alignedTop = CanvasTransformGizmo.alignBounds([boundsA, boundsB], 'top');
    expect(alignedTop[0].y).toBe(100);
    expect(alignedTop[1].y).toBe(100);
  });

  it('renders CanvasObjectManipulator with transform handles and alignment toolbar', () => {
    const onUpdate = vi.fn();
    render(<CanvasObjectManipulator selectedBounds={[boundsA, boundsB]} onUpdateBounds={onUpdate} />);

    expect(screen.getByTestId('canvas-object-manipulator')).toBeDefined();
    expect(screen.getByTestId('transform-bounding-box')).toBeDefined();
    expect(screen.getByTestId('handle-top-left')).toBeDefined();
    expect(screen.getByTestId('handle-rotation')).toBeDefined();
    expect(screen.getByTestId('align-left')).toBeDefined();

    // Trigger alignment button click
    const btnAlignLeft = screen.getByTestId('align-left');
    fireEvent.click(btnAlignLeft);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
