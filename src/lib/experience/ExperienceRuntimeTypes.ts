/**
 * ExperienceRuntimeTypes.ts — SoloSpot Experience Runtime Engine v2.0
 *
 * Canonical, serializable domain types for the shared Experience Runtime Engine.
 * Usable across:
 *   - Experience Library Cards (scale-to-fit preview)
 *   - Experience Detail Modal (live interactive simulation)
 *   - Builder Canvas (interactive live editing)
 *   - Published Storefront (live shopper runtime)
 *
 * v2.0 adds: shader backgrounds, interactive gradients, GPU particles,
 * pointer signals, performance tiers, resource tracking, composition layers.
 */

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export type MotionType =
  | 'float'
  | 'pulse'
  | 'breathe'
  | 'drift'
  | 'orbit'
  | 'rotate'
  | 'stagger'
  | 'reveal'
  | 'wave'
  | 'morph'
  | 'none';

export interface MotionConfig {
  type: MotionType;
  speed?: number;
  intensity?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
  delay?: number;
}

// ---------------------------------------------------------------------------
// Pointer
// ---------------------------------------------------------------------------

export type PointerInteractionType =
  | 'tilt'
  | 'spotlight'
  | 'parallax'
  | 'magnetic'
  | 'glow'
  | 'perspective'
  | 'none';

export interface PointerConfig {
  type: PointerInteractionType;
  strength?: number;
  maxAngle?: number;
  perspective?: number;
  radius?: number;
  color?: string;
}

// Shared mutable pointer signal — NOT React state
export interface PointerSignal {
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  velocityX: number;
  velocityY: number;
  isHovered: boolean;
  lastUpdate: number;
}

// ---------------------------------------------------------------------------
// Scroll
// ---------------------------------------------------------------------------

export type ScrollInteractionType =
  | 'sticky-story'
  | 'horizontal-showcase'
  | 'parallax-depth'
  | 'timeline-scrub'
  | 'reveal'
  | 'none';

export interface ScrollDriverConfig {
  type: ScrollInteractionType;
  steps?: number;
  pinDuration?: number;
  horizontalFactor?: number;
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

export type BackgroundEffectType =
  | 'aurora'
  | 'mesh-gradient'
  | 'ambient-blobs'
  | 'glowing-orb'
  | 'stars'
  | 'particles'
  | 'video'
  | 'static-gradient'
  | 'shader'
  | 'interactive-gradient'
  | 'none';

export interface BackgroundConfig {
  type: BackgroundEffectType;
  colors?: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
  videoUrl?: string;
  posterUrl?: string;
  shader?: ShaderConfig;
  gradient?: InteractiveGradientConfig;
}

// ---------------------------------------------------------------------------
// Shader Background (v2.0)
// ---------------------------------------------------------------------------

export type ShaderPreset =
  | 'aurora-noise'
  | 'fluid-warp'
  | 'nebula'
  | 'plasma'
  | 'digital-rain'
  | 'custom';

export interface ShaderConfig {
  preset: ShaderPreset;
  fragmentSource?: string;
  uniforms?: Record<string, ShaderUniform>;
  colors?: string[];
  colorA?: string;
  colorB?: string;
  colorC?: string;
  speed?: number;
  intensity?: number;
  distortion?: number;
  scale?: number;
  pointerInfluence?: number;
}

export interface ShaderUniform {
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'sampler2D';
  value: number | number[] | HTMLImageElement;
}

// ---------------------------------------------------------------------------
// Interactive Gradient (v2.0)
// ---------------------------------------------------------------------------

export interface InteractiveGradientConfig {
  colors: string[];
  pointerStrength?: number;
  speed?: number;
  softness?: number;
  distortion?: number;
  resolution?: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Particles (v2.0)
// ---------------------------------------------------------------------------

export interface ParticleConfig {
  count: number;
  size?: number;
  speed?: number;
  spread?: number;
  depth?: number;
  opacity?: number;
  color?: string;
  pointerInfluence?: number;
  attractRepel?: 'attract' | 'repell' | 'none';
}

// ---------------------------------------------------------------------------
// 3D Scene
// ---------------------------------------------------------------------------

export interface Scene3DLayer {
  id: string;
  selector?: string;
  depthZ: number;
  scaleFactor?: number;
  rotationFactor?: number;
}

export interface Scene3DConfig {
  perspective?: number;
  transformStyle?: 'preserve-3d' | 'flat';
  layers?: Scene3DLayer[];
  reflection?: boolean;
  reflectionOpacity?: number;
}

// ---------------------------------------------------------------------------
// Carousel
// ---------------------------------------------------------------------------

export interface CarouselConfig {
  itemCount: number;
  initialIndex?: number;
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  loop?: boolean;
  gap?: number;
  snap?: boolean;
  showNavigation?: boolean;
  showPagination?: boolean;
}

// ---------------------------------------------------------------------------
// Visual Effects
// ---------------------------------------------------------------------------

export type VisualEffectType =
  | 'glass'
  | 'liquid-morph'
  | 'reflection'
  | 'vignette'
  | 'grain'
  | 'glow-border'
  | 'bloom'
  | 'chromatic-aberration'
  | 'none';

// ---------------------------------------------------------------------------
// Performance Tier
// ---------------------------------------------------------------------------

export type PerformanceTier = 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Composition Layer (v2.0)
// ---------------------------------------------------------------------------

export interface CompositionLayer {
  id: string;
  type: 'shader' | 'gradient' | 'particles' | 'three' | 'video' | 'content';
  zIndex: number;
  visible: boolean;
  opacity?: number;
  config: unknown;
  responsive?: {
    desktop?: Partial<CompositionLayer>;
    tablet?: Partial<CompositionLayer>;
    mobile?: Partial<CompositionLayer>;
  };
  performanceTier?: PerformanceTier;
}

// ---------------------------------------------------------------------------
// Scene Config (v2.0)
// ---------------------------------------------------------------------------

export interface ExperienceSceneConfig {
  version: '1.0.0' | '2.0.0';
  motion?: MotionConfig;
  pointer?: PointerConfig;
  scroll?: ScrollDriverConfig;
  background?: BackgroundConfig;
  scene3d?: Scene3DConfig;
  carousel?: CarouselConfig;
  particles?: ParticleConfig;
  composition?: CompositionLayer[];
  effects?: VisualEffectType[];
  reducedMotionFallback?: boolean;
  performanceTier?: PerformanceTier;
}

// ---------------------------------------------------------------------------
// Runtime State
// ---------------------------------------------------------------------------

export interface ExperienceRuntimeState {
  isPlaying: boolean;
  isInteractive: boolean;
  pointer: {
    x: number;
    y: number;
    rawX: number;
    rawY: number;
    isHovered: boolean;
  };
  scrollProgress: number;
  activeSlideIndex: number;
  reducedMotion: boolean;
  performanceTier: PerformanceTier;
}

// ---------------------------------------------------------------------------
// Resource Tracking (v2.0)
// ---------------------------------------------------------------------------

export type ResourceType =
  | 'webgl-context'
  | 'webgl-texture'
  | 'webgl-buffer'
  | 'webgl-program'
  | 'webgl-render-target'
  | 'canvas-2d'
  | 'video-element'
  | 'animation-frame'
  | 'event-listener'
  | 'three-scene'
  | 'three-mesh'
  | 'three-material'
  | 'three-texture'
  | 'three-geometry';

export interface TrackedResource {
  id: string;
  type: ResourceType;
  createdAt: number;
  size?: number;
  dispose: () => void;
}
