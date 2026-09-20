/**
 * CapabilityEngine.ts — Validation, Defaults, and Execution Contracts for SoloSpot Experience Runtime
 */

import type {
  ExperienceSceneConfig,
  MotionConfig,
  PointerConfig,
  ScrollDriverConfig,
  BackgroundConfig,
  Scene3DConfig,
  CarouselConfig,
} from '../ExperienceRuntimeTypes';

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  type: 'none',
  speed: 1.0,
  intensity: 1.0,
  direction: 'normal',
};

export const DEFAULT_POINTER_CONFIG: PointerConfig = {
  type: 'none',
  strength: 1.0,
  maxAngle: 12,
  perspective: 1200,
  radius: 350,
  color: 'rgba(139, 92, 246, 0.25)',
};

export const DEFAULT_SCROLL_CONFIG: ScrollDriverConfig = {
  type: 'none',
  steps: 3,
  pinDuration: 1200,
  horizontalFactor: 1.0,
};

export const DEFAULT_BACKGROUND_CONFIG: BackgroundConfig = {
  type: 'none',
  speed: 1.0,
  blur: 60,
  opacity: 0.8,
  colors: ['#7c3aed', '#3b82f6', '#ec4899', '#06b6d4'],
};

export const DEFAULT_SCENE3D_CONFIG: Scene3DConfig = {
  perspective: 1200,
  transformStyle: 'preserve-3d',
  reflection: false,
  reflectionOpacity: 0.25,
};

export const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  itemCount: 3,
  initialIndex: 0,
  autoplay: false,
  autoplayIntervalMs: 4000,
  loop: true,
  gap: 24,
  snap: true,
  showNavigation: true,
  showPagination: true,
};

/**
 * Validates and normalizes an ExperienceSceneConfig.
 */
export function normalizeSceneConfig(raw?: Partial<ExperienceSceneConfig> | null): ExperienceSceneConfig {
  if (!raw) {
    return {
      version: '1.0.0',
      motion: DEFAULT_MOTION_CONFIG,
      pointer: DEFAULT_POINTER_CONFIG,
      scroll: DEFAULT_SCROLL_CONFIG,
      background: DEFAULT_BACKGROUND_CONFIG,
      scene3d: DEFAULT_SCENE3D_CONFIG,
      effects: [],
      reducedMotionFallback: true,
    };
  }

  return {
    version: '1.0.0',
    motion: raw.motion ? { ...DEFAULT_MOTION_CONFIG, ...raw.motion } : undefined,
    pointer: raw.pointer ? { ...DEFAULT_POINTER_CONFIG, ...raw.pointer } : undefined,
    scroll: raw.scroll ? { ...DEFAULT_SCROLL_CONFIG, ...raw.scroll } : undefined,
    background: raw.background ? { ...DEFAULT_BACKGROUND_CONFIG, ...raw.background } : undefined,
    scene3d: raw.scene3d ? { ...DEFAULT_SCENE3D_CONFIG, ...raw.scene3d } : undefined,
    carousel: raw.carousel ? { ...DEFAULT_CAROUSEL_CONFIG, ...raw.carousel } : undefined,
    effects: raw.effects || [],
    reducedMotionFallback: raw.reducedMotionFallback ?? true,
  };
}

/**
 * Returns an array of active capability badges for UI rendering.
 */
export function getActiveCapabilityNames(config: ExperienceSceneConfig): string[] {
  const caps: string[] = [];
  if (config.background && config.background.type !== 'none') {
    caps.push(`Background: ${config.background.type}`);
  }
  if (config.pointer && config.pointer.type !== 'none') {
    caps.push(`Pointer: ${config.pointer.type}`);
  }
  if (config.motion && config.motion.type !== 'none') {
    caps.push(`Motion: ${config.motion.type}`);
  }
  if (config.scene3d && config.scene3d.transformStyle === 'preserve-3d') {
    caps.push('3D Space');
  }
  if (config.carousel && config.carousel.itemCount > 1) {
    caps.push('Interactive Carousel');
  }
  if (config.scroll && config.scroll.type !== 'none') {
    caps.push(`Scroll: ${config.scroll.type}`);
  }
  if (config.effects && config.effects.length > 0) {
    caps.push(...config.effects.map(e => `Effect: ${e}`));
  }
  return caps;
}
