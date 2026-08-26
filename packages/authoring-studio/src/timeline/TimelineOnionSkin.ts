/**
 * TimelineOnionSkin.ts — PM40 Onion Skin Data Model (ETAP 3)
 *
 * DECISION-065: Onion Skin jest wyłącznie opisem danych.
 *
 * Pure data description model for Onion Skinning preview frames.
 *
 * Does NOT render.
 * Does NOT invoke RuntimeBridge.
 * NO DOM, NO React, NO requestAnimationFrame.
 */

export interface OnionSkinFrameDescriptor {
  readonly relativeFrameIndex: number;
  readonly timeOffsetMs: number;
  readonly opacity: number;
  readonly colorTint: string;
  readonly isPrevious: boolean;
}

export interface OnionSkinConfig {
  readonly enabled: boolean;
  readonly prevFramesCount: number;
  readonly nextFramesCount: number;
  readonly stepDurationMs: number;
  readonly baseOpacity: number;
  readonly prevColorTint: string;
  readonly nextColorTint: string;
}

export const DEFAULT_ONION_SKIN_CONFIG: OnionSkinConfig = {
  enabled: false,
  prevFramesCount: 2,
  nextFramesCount: 2,
  stepDurationMs: 100,
  baseOpacity: 0.4,
  prevColorTint: '#ef4444', // red tint for previous frames
  nextColorTint: '#3b82f6', // blue tint for next frames
};

export function createOnionSkinConfig(
  partial: Partial<OnionSkinConfig> = {}
): OnionSkinConfig {
  return {
    ...DEFAULT_ONION_SKIN_CONFIG,
    ...partial,
  };
}

/**
 * Generates data descriptors for active onion skin frames relative to current playhead time.
 */
export function generateOnionSkinDescriptors(
  currentTimeMs: number,
  config: OnionSkinConfig = DEFAULT_ONION_SKIN_CONFIG
): ReadonlyArray<OnionSkinFrameDescriptor> {
  if (!config.enabled) return [];

  const descriptors: OnionSkinFrameDescriptor[] = [];

  // Generate previous frames descriptors
  for (let i = 1; i <= config.prevFramesCount; i++) {
    const opacityFactor = 1 - (i - 1) / Math.max(1, config.prevFramesCount);
    descriptors.push({
      relativeFrameIndex: -i,
      timeOffsetMs: Math.max(0, currentTimeMs - i * config.stepDurationMs),
      opacity: Math.max(0.05, config.baseOpacity * opacityFactor),
      colorTint: config.prevColorTint,
      isPrevious: true,
    });
  }

  // Generate next frames descriptors
  for (let i = 1; i <= config.nextFramesCount; i++) {
    const opacityFactor = 1 - (i - 1) / Math.max(1, config.nextFramesCount);
    descriptors.push({
      relativeFrameIndex: i,
      timeOffsetMs: currentTimeMs + i * config.stepDurationMs,
      opacity: Math.max(0.05, config.baseOpacity * opacityFactor),
      colorTint: config.nextColorTint,
      isPrevious: false,
    });
  }

  return descriptors.sort((a, b) => a.timeOffsetMs - b.timeOffsetMs);
}
