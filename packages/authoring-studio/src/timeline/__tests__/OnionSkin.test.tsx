import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { OnionSkinOverlay } from '../../ui/components/preview/OnionSkinOverlay';
import { generateOnionSkinDescriptors, createOnionSkinConfig } from '../TimelineOnionSkin';

describe('OnionSkin & Ghost Frames (S14 ETAP 5)', () => {
  it('generates previous and next frame descriptors with opacity falloff', () => {
    const config = createOnionSkinConfig({
      enabled: true,
      prevFramesCount: 2,
      nextFramesCount: 2,
      stepDurationMs: 100,
      baseOpacity: 0.4,
    });

    const descriptors = generateOnionSkinDescriptors(500, config);
    expect(descriptors.length).toBe(4);

    const prevFrames = descriptors.filter((d) => d.isPrevious);
    const nextFrames = descriptors.filter((d) => !d.isPrevious);

    expect(prevFrames.length).toBe(2);
    expect(nextFrames.length).toBe(2);
    expect(prevFrames[0].opacity).toBeGreaterThan(prevFrames[1].opacity);
  });

  it('renders OnionSkinOverlay component with ghost frame poses', () => {
    const mockEvalTransform = vi.fn().mockReturnValue({
      positionX: 100,
      positionY: 50,
      scaleX: 1,
      scaleY: 1,
      rotationZ: 0,
      skewX: 0,
      skewY: 0,
      pivotX: 0,
      pivotY: 0,
      opacity: 1,
    });

    render(
      <OnionSkinOverlay
        currentTimeMs={500}
        config={{ enabled: true, prevFramesCount: 2, nextFramesCount: 2 }}
        evaluateTransformAtTime={mockEvalTransform}
      />
    );

    expect(screen.getByTestId('onion-skin-overlay')).toBeDefined();
    expect(screen.getByTestId('ghost-frame--1')).toBeDefined();
    expect(screen.getByTestId('ghost-frame-1')).toBeDefined();
    expect(mockEvalTransform).toHaveBeenCalled();
  });
});
