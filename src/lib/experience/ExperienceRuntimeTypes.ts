/**
 * ExperienceRuntimeTypes.ts — SoloSpot Experience Runtime Engine v1.0
 *
 * Canonical, serializable domain types for the shared Experience Runtime Engine.
 * Usable across:
 *   - Experience Library Cards (scale-to-fit preview)
 *   - Experience Detail Modal (live interactive simulation)
 *   - Builder Canvas (interactive live editing)
 *   - Published Storefront (live shopper runtime)
 */

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

export type PointerInteractionType =
  | 'tilt'
  | 'spotlight'
  | 'parallax'
  | 'magnetic'
  | 'glow'
  | 'perspective'
  | 'none';

export type ScrollInteractionType =
  | 'sticky-story'
  | 'horizontal-showcase'
  | 'parallax-depth'
  | 'timeline-scrub'
  | 'reveal'
  | 'none';

export type BackgroundEffectType =
  | 'aurora'
  | 'mesh-gradient'
  | 'ambient-blobs'
  | 'glowing-orb'
  | 'stars'
  | 'particles'
  | 'video'
  | 'static-gradient'
  | 'none';

export type VisualEffectType =
  | 'glass'
  | 'liquid-morph'
  | 'reflection'
  | 'vignette'
  | 'grain'
  | 'glow-border'
  | 'none';

export interface MotionConfig {
  type: MotionType;
  speed?: number; // duration multiplier, default 1.0
  intensity?: number; // scale/distance multiplier, default 1.0
  direction?: 'normal' | 'reverse' | 'alternate';
  delay?: number; // seconds
}

export interface PointerConfig {
  type: PointerInteractionType;
  strength?: number; // default 1.0
  maxAngle?: number; // degrees, default 15
  perspective?: number; // px, default 1000
  radius?: number; // spotlight radius px, default 300
  color?: string; // spotlight/glow color
}

export interface ScrollDriverConfig {
  type: ScrollInteractionType;
  steps?: number; // number of story steps or showcase slides
  pinDuration?: number; // virtual scroll distance in px (e.g. 1500)
  horizontalFactor?: number; // translation multiplier
}

export interface BackgroundConfig {
  type: BackgroundEffectType;
  colors?: string[]; // array of hex or rgba colors
  speed?: number; // animation speed multiplier
  blur?: number; // backdrop / effect blur in px
  opacity?: number; // 0 to 1
  videoUrl?: string; // for video backgrounds
  posterUrl?: string;
}

export interface Scene3DLayer {
  id: string;
  selector?: string;
  depthZ: number; // positive = towards viewer, negative = deeper into screen
  scaleFactor?: number;
  rotationFactor?: number;
}

export interface Scene3DConfig {
  perspective?: number; // px, e.g. 1200
  transformStyle?: 'preserve-3d' | 'flat';
  layers?: Scene3DLayer[];
  reflection?: boolean;
  reflectionOpacity?: number;
}

export interface CarouselConfig {
  itemCount: number;
  initialIndex?: number;
  autoplay?: boolean;
  autoplayIntervalMs?: number;
  loop?: boolean;
  gap?: number; // px, default 24
  snap?: boolean;
  showNavigation?: boolean;
  showPagination?: boolean;
}

export interface ExperienceSceneConfig {
  version: '1.0.0';
  motion?: MotionConfig;
  pointer?: PointerConfig;
  scroll?: ScrollDriverConfig;
  background?: BackgroundConfig;
  scene3d?: Scene3DConfig;
  carousel?: CarouselConfig;
  effects?: VisualEffectType[];
  reducedMotionFallback?: boolean;
}

export interface ExperienceRuntimeState {
  isPlaying: boolean;
  isInteractive: boolean;
  pointer: {
    x: number; // -1 to 1 normalized
    y: number; // -1 to 1 normalized
    rawX: number;
    rawY: number;
    isHovered: boolean;
  };
  scrollProgress: number; // 0.0 to 1.0
  activeSlideIndex: number;
  reducedMotion: boolean;
}
