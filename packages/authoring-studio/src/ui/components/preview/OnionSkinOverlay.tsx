'use client';

import * as React from 'react';
import {
  OnionSkinConfig,
  DEFAULT_ONION_SKIN_CONFIG,
  generateOnionSkinDescriptors,
  OnionSkinFrameDescriptor,
} from '../../../timeline/TimelineOnionSkin';
import { Transform2DAnimation, Transform2DState } from '../../../motion/Transform2DAnimation';

export interface OnionSkinOverlayProps {
  /** Current playhead time in ms. */
  readonly currentTimeMs: number;
  /** Onion skin configuration (range, step duration, opacity, tints). */
  readonly config?: Partial<OnionSkinConfig>;
  /** Function evaluating 2D transform state of target node at given time in ms. */
  readonly evaluateTransformAtTime: (timeMs: number) => Transform2DState;
  /** Base bounding box size of the node (width, height). */
  readonly nodeSize?: { width: number; height: number };
  /** Stage width in pixels. */
  readonly stageWidth?: number;
  /** Stage height in pixels. */
  readonly stageHeight?: number;
}

export const OnionSkinOverlay: React.FC<OnionSkinOverlayProps> = ({
  currentTimeMs,
  config: partialConfig,
  evaluateTransformAtTime,
  nodeSize = { width: 100, height: 100 },
  stageWidth = 800,
  stageHeight = 600,
}) => {
  const config: OnionSkinConfig = React.useMemo(() => {
    return { ...DEFAULT_ONION_SKIN_CONFIG, ...partialConfig, enabled: true };
  }, [partialConfig]);

  const descriptors = React.useMemo(() => {
    return generateOnionSkinDescriptors(currentTimeMs, config);
  }, [currentTimeMs, config]);

  if (!config.enabled || descriptors.length === 0) return null;

  return (
    <div
      className="onion-skin-overlay absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ width: stageWidth, height: stageHeight }}
      data-testid="onion-skin-overlay"
    >
      {descriptors.map((desc: OnionSkinFrameDescriptor) => {
        const transformState = evaluateTransformAtTime(desc.timeOffsetMs);
        const matrix = Transform2DAnimation.calculateTransformMatrix(transformState);

        return (
          <div
            key={`${desc.isPrevious ? 'prev' : 'next'}_${desc.relativeFrameIndex}`}
            className="ghost-frame-pose absolute border-2 border-dashed rounded transition-opacity"
            style={{
              width: nodeSize.width,
              height: nodeSize.height,
              opacity: desc.opacity,
              borderColor: desc.colorTint,
              backgroundColor: `${desc.colorTint}15`,
              transform: `matrix(${matrix[0]}, ${matrix[1]}, ${matrix[2]}, ${matrix[3]}, ${matrix[4]}, ${matrix[5]})`,
            }}
            data-testid={`ghost-frame-${desc.relativeFrameIndex}`}
          >
            <span
              className="absolute top-1 left-1 text-[9px] font-bold px-1 rounded text-slate-900"
              style={{ backgroundColor: desc.colorTint }}
            >
              {desc.relativeFrameIndex > 0 ? `+${desc.relativeFrameIndex}` : desc.relativeFrameIndex}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OnionSkinOverlay;
