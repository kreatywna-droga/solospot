'use client';

/**
 * ExperienceRuntimeScene.tsx — SoloSpot Experience Runtime Engine v1.0 Compositor
 *
 * The canonical runtime compositor that interprets ExperienceSceneConfig and renders:
 *   - Motion backgrounds (aurora, mesh-gradient, glowing blobs, ambient video)
 *   - High-performance pointer interactions (tilt, spotlight, depth response)
 *   - CSS 3D perspective stage with translateZ layer separation
 *   - Real drag/touch/snap interactive carousel physics
 *   - Scroll storytelling & horizontal showcase progress
 *   - Isolated Error Boundary ensuring Studio stability
 */

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import type { ExperienceSceneConfig } from '@/lib/experience/ExperienceRuntimeTypes';
import { normalizeSceneConfig } from '@/lib/experience/runtime/CapabilityEngine';
import { usePointerEngine } from '@/lib/experience/runtime/usePointerEngine';
import { usePointerSignal } from '@/lib/experience/runtime/usePointerSignal';
import { useMotionEngine } from '@/lib/experience/runtime/useMotionEngine';
import { ExperienceBackgroundLayer } from '@/lib/experience/runtime/useBackgroundEngine';
import { useScrollDriver } from '@/lib/experience/runtime/useScrollDriver';
import { useDepth3DEngine } from '@/lib/experience/runtime/useDepth3DEngine';
import { useInteractiveCarousel } from '@/lib/experience/runtime/useInteractiveCarousel';
import { useShaderEngine } from '@/lib/experience/runtime/useShaderEngine';
import { useInteractiveGradient } from '@/lib/experience/runtime/useInteractiveGradient';
import { useParticleEngine } from '@/lib/experience/runtime/useParticleEngine';
import { detectPerformanceTier } from '@/lib/experience/runtime/PerformanceTier';

// Context for child components
interface ExperienceRuntimeContextValue {
  isPlaying: boolean;
  isInteractive: boolean;
  carouselActiveIndex: number;
  goToNextSlide: () => void;
  goToPrevSlide: () => void;
  goToSlide: (index: number) => void;
  carouselItemCount: number;
  scrollProgress: number;
  activeStoryStep: number;
}

const ExperienceRuntimeContext = createContext<ExperienceRuntimeContextValue | null>(null);

export function useExperienceRuntimeContext() {
  return useContext(ExperienceRuntimeContext);
}

// Error Boundary for fault isolation
interface ErrorBoundaryState {
  hasError: boolean;
  error?: string;
}

class ExperienceErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[ExperienceRuntime] Caught error in scene:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full p-4 rounded-xl bg-[#D9A86C]/20 border border-[#D9A86C]/30 text-xs text-[#F2C27F]">
          <span className="font-semibold">Experience Runtime Fallback:</span> Running in safe mode.
          {this.props.children}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface ExperienceRuntimeSceneProps {
  config?: Partial<ExperienceSceneConfig> | null;
  isPlaying?: boolean;
  isInteractive?: boolean;
  scrollProgress?: number; // 0 to 100 from simulated slider
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ExperienceRuntimeScene({
  config: rawConfig,
  isPlaying = true,
  isInteractive = true,
  scrollProgress: simulatedScrollProgress,
  children,
  className = '',
  style = {},
}: ExperienceRuntimeSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [perfTier] = useState(() => detectPerformanceTier());

  // Normalize config with safe defaults
  const config = normalizeSceneConfig(rawConfig);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 0. Shared pointer signal (v2.0 — feeds shader, gradient, particles without React state)
  const { signal: pointerSignal } = usePointerSignal({
    containerRef,
    config: config.pointer,
    isInteractive,
    reducedMotion,
  });

  // 1. Legacy pointer interaction engine (tilt, spotlight, cursor variables)
  usePointerEngine({
    containerRef,
    config: config.pointer,
    isInteractive,
    reducedMotion,
  });

  // 2. Motion engine (keyframe styles & animation states)
  const { motionStyles } = useMotionEngine({
    config: config.motion,
    isPlaying,
    reducedMotion,
  });

  // 3. Scroll driver (horizontal showcase & sticky story step)
  const { scrollProgress, activeStep } = useScrollDriver({
    containerRef,
    config: config.scroll,
    simulatedProgress: simulatedScrollProgress,
  });

  // 4. 3D depth stage (perspective & preserve-3d)
  const { stageStyles } = useDepth3DEngine({
    config: config.scene3d,
    reducedMotion,
  });

  // 5. Interactive carousel engine
  const carousel = useInteractiveCarousel({
    containerRef,
    config: config.carousel,
    isInteractive,
  });

  // 6. WebGL Shader Background (v2.0)
  const isShaderBackground = Boolean(config.background?.type === 'shader' && config.background?.shader);
  useShaderEngine({
    containerRef,
    config: config.background?.shader,
    pointerX: pointerSignal.current.x,
    pointerY: pointerSignal.current.y,
    isPlaying: isPlaying && isShaderBackground,
    reducedMotion,
  });

  // 7. Interactive Gradient Background (v2.0)
  const isGradientBackground = Boolean(config.background?.type === 'interactive-gradient' && config.background?.gradient);
  useInteractiveGradient({
    containerRef,
    config: config.background?.gradient,
    pointerX: pointerSignal.current.x,
    pointerY: pointerSignal.current.y,
    isPlaying: isPlaying && isGradientBackground,
    reducedMotion,
  });

  // 8. Particle Runtime (v2.0)
  useParticleEngine({
    containerRef,
    config: config.particles,
    pointerSignal,
    isPlaying,
    reducedMotion,
  });

  const contextValue: ExperienceRuntimeContextValue = {
    isPlaying,
    isInteractive,
    carouselActiveIndex: carousel.activeIndex,
    goToNextSlide: carousel.goToNext,
    goToPrevSlide: carousel.goToPrev,
    goToSlide: carousel.goToIndex,
    carouselItemCount: carousel.itemCount,
    scrollProgress,
    activeStoryStep: activeStep,
  };

  const isSpotlightActive = config.pointer?.type === 'spotlight' || config.pointer?.type === 'glow';
  const spotlightColor = config.pointer?.color || 'rgba(139, 92, 246, 0.18)';
  const spotlightRadius = config.pointer?.radius || 350;

  // When shader or interactive-gradient engine handles background, suppress CSS background layer
  const useWebGLBackground = isShaderBackground || isGradientBackground;

  return (
    <ExperienceErrorBoundary>
      <ExperienceRuntimeContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          className={`solospot-experience-scene relative overflow-hidden ${className}`}
          style={{
            ...stageStyles,
            ...style,
          }}
        >
          {/* Dynamic Motion Background Layer (CSS-based, skipped when WebGL engine handles background) */}
          {config.background && config.background.type !== 'none' && !useWebGLBackground && (
            <ExperienceBackgroundLayer
              config={config.background}
              isPlaying={isPlaying}
              reducedMotion={reducedMotion}
            />
          )}

          {/* Pointer Spotlight / Glow Overlay */}
          {isSpotlightActive && isInteractive && !reducedMotion && (
            <div
              className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
              style={{
                background: `radial-gradient(${spotlightRadius}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 70%)`,
              }}
            />
          )}

          {/* Main Content Stage with Motion and 3D Tilt Driver */}
          <div
            className="solospot-scene-content relative z-20 w-full"
            style={{
              ...motionStyles,
              transform: config.pointer?.type === 'tilt' && !reducedMotion
                ? 'perspective(1200px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))'
                : undefined,
              transformStyle: config.scene3d?.transformStyle || undefined,
              transition: isInteractive ? 'transform 0.1s ease-out' : undefined,
            }}
          >
            {children}
          </div>

          {/* Optional Stage Reflection Plane */}
          {config.scene3d?.reflection && !reducedMotion && (
            <div
              className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none z-10"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                opacity: config.scene3d.reflectionOpacity ?? 0.3,
              }}
            />
          )}
        </div>
      </ExperienceRuntimeContext.Provider>
    </ExperienceErrorBoundary>
  );
}
