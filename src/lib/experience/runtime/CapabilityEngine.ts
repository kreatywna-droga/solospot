/**
 * CapabilityEngine.ts — Validation, Defaults, and Execution Contracts for SoloSpot Experience Runtime v2.0
 */

import type {
  ExperienceSceneConfig,
  MotionConfig,
  PointerConfig,
  ScrollDriverConfig,
  BackgroundConfig,
  Scene3DConfig,
  CarouselConfig,
  ParticleConfig,
  ShaderConfig,
  InteractiveGradientConfig,
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

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  count: 200,
  size: 3,
  speed: 1,
  spread: 1,
  depth: 1,
  opacity: 0.8,
  color: '#ffffff',
  pointerInfluence: 0,
  attractRepel: 'none',
};

export const DEFAULT_SHADER_CONFIG: ShaderConfig = {
  preset: 'aurora-noise',
  colorA: '#7c3aed',
  colorB: '#3b82f6',
  colorC: '#ec4899',
  speed: 1.0,
  intensity: 1.0,
  distortion: 1.0,
  scale: 1.0,
  pointerInfluence: 0.5,
};

export const DEFAULT_GRADIENT_CONFIG: InteractiveGradientConfig = {
  colors: ['#7c3aed', '#3b82f6', '#ec4899', '#06b6d4'],
  pointerStrength: 1.0,
  speed: 1.0,
  softness: 1.0,
  distortion: 0.5,
  resolution: 'medium',
};

/**
 * Validates and normalizes an ExperienceSceneConfig to v2.0.
 */
export function normalizeSceneConfig(raw?: Partial<ExperienceSceneConfig> | null): ExperienceSceneConfig {
  if (!raw) {
    return {
      version: '2.0.0',
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
    version: '2.0.0',
    motion: raw.motion ? { ...DEFAULT_MOTION_CONFIG, ...raw.motion } : undefined,
    pointer: raw.pointer ? { ...DEFAULT_POINTER_CONFIG, ...raw.pointer } : undefined,
    scroll: raw.scroll ? { ...DEFAULT_SCROLL_CONFIG, ...raw.scroll } : undefined,
    background: raw.background ? normalizeBackgroundConfig(raw.background) : undefined,
    scene3d: raw.scene3d ? { ...DEFAULT_SCENE3D_CONFIG, ...raw.scene3d } : undefined,
    carousel: raw.carousel ? { ...DEFAULT_CAROUSEL_CONFIG, ...raw.carousel } : undefined,
    particles: raw.particles ? { ...DEFAULT_PARTICLE_CONFIG, ...raw.particles } : undefined,
    composition: raw.composition,
    effects: raw.effects || [],
    reducedMotionFallback: raw.reducedMotionFallback ?? true,
    performanceTier: raw.performanceTier,
  };
}

function normalizeBackgroundConfig(raw: Partial<BackgroundConfig>): BackgroundConfig {
  const base = { ...DEFAULT_BACKGROUND_CONFIG, ...raw };
  if (raw.type === 'shader' && raw.shader) {
    base.shader = { ...DEFAULT_SHADER_CONFIG, ...raw.shader };
  }
  if (raw.type === 'interactive-gradient' && raw.gradient) {
    base.gradient = { ...DEFAULT_GRADIENT_CONFIG, ...raw.gradient };
  }
  return base;
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
  if (config.particles && config.particles.count > 0) {
    caps.push(`Particles: ${config.particles.count}`);
  }
  if (config.background?.type === 'shader') {
    caps.push('WebGL Shader');
  }
  if (config.background?.type === 'interactive-gradient') {
    caps.push('Interactive Gradient');
  }
  if (config.effects && config.effects.length > 0) {
    caps.push(...config.effects.map(e => `Effect: ${e}`));
  }
  return caps;
}
