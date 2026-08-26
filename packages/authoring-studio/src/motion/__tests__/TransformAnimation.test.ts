import { describe, expect, it } from 'vitest';
import { Transform2DAnimation } from '../Transform2DAnimation';

describe('Transform2DAnimation Matrix Engine (S13 ETAP 2)', () => {
  it('computes 2D affine transformation matrices including Pos, Scale, Rotation, Skew, and Anchor Point', () => {
    const matIdentity = Transform2DAnimation.computeLocalMatrix({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      scaleX: 1,
      scaleY: 1,
      rotationDeg: 0,
      skewXDeg: 0,
      skewYDeg: 0,
      anchorX: 0.5,
      anchorY: 0.5,
    });

    expect(matIdentity).toEqual([1, 0, 0, 1, 0, 0]);

    // Position translation
    const matTrans = Transform2DAnimation.computeLocalMatrix({
      x: 100,
      y: 200,
      width: 100,
      height: 100,
    });
    expect(matTrans[4]).toBe(100);
    expect(matTrans[5]).toBe(200);

    // Scale with anchor point (0.5, 0.5)
    const matScale = Transform2DAnimation.computeLocalMatrix({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      scaleX: 2.0,
      scaleY: 2.0,
      anchorX: 0.5,
      anchorY: 0.5,
    });
    expect(matScale[0]).toBe(2);
    expect(matScale[3]).toBe(2);
    // Center at (100,100): after scaling by 2, origin shifts to -100
    expect(matScale[4]).toBe(-100);
    expect(matScale[5]).toBe(-100);

    // Rotation and Skew
    const matComplex = Transform2DAnimation.computeLocalMatrix({
      x: 50,
      y: 50,
      rotationDeg: 45,
      skewXDeg: 15,
    });
    expect(matComplex.length).toBe(6);
  });
});
