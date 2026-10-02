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
import type { ExperienceSceneConfig, ExperienceRuntimeSceneProps } from '@/lib/experience/ExperienceRuntimeTypes';
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

// Sub-components for isolated layer canvas lifecycles
function LayerShaderBackground({
  config,
  pointerSignal,
  isPlaying,
  reducedMotion,
}: {
  config?: import('@/lib/experience/ExperienceRuntimeTypes').ShaderConfig;
  pointerSignal: React.RefObject<import('@/lib/experience/ExperienceRuntimeTypes').PointerSignal>;
  isPlaying: boolean;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useShaderEngine({
    containerRef,
    config,
    pointerX: pointerSignal.current.x,
    pointerY: pointerSignal.current.y,
    isPlaying: isPlaying && !!config,
    reducedMotion,
  });
  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

function LayerParticleField({
  config,
  pointerSignal,
  isPlaying,
  reducedMotion,
}: {
  config?: import('@/lib/experience/ExperienceRuntimeTypes').ParticleConfig;
  pointerSignal: React.RefObject<import('@/lib/experience/ExperienceRuntimeTypes').PointerSignal>;
  isPlaying: boolean;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useParticleEngine({
    containerRef,
    config,
    pointerSignal,
    isPlaying,
    reducedMotion,
  });
  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
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
  const hasComposableLayers = Boolean(config.layers && config.layers.length > 0);

  // Composable layer resolvers (v3.0)
  const bgLayer = config.layers?.find(l => l.role === 'background' && l.visible !== false);
  const effectiveBackground = bgLayer?.background || config.background;

  const particleLayer = config.layers?.find(l => l.role === 'particles' && l.visible !== false);
  const effectiveParticles = particleLayer?.particles || config.particles;

  const spatialLayer = config.layers?.find(l => l.role === 'spatial-3d' && l.visible !== false);
  const effectiveScene3D = spatialLayer?.scene3d || config.scene3d;

  const motionLayer = config.layers?.find(l => l.motion && l.visible !== false);
  const effectiveMotion = motionLayer?.motion || config.motion;

  const pointerLayer = config.layers?.find(l => l.pointer && l.visible !== false);
  const effectivePointer = pointerLayer?.pointer || config.pointer;

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 0. Shared pointer signal (v2.0 / v3.0 — feeds shader, gradient, particles without React state)
  const { signal: pointerSignal } = usePointerSignal({
    containerRef,
    config: effectivePointer,
    isInteractive,
    reducedMotion,
  });

  // 1. Pointer interaction engine (tilt, spotlight, cursor variables)
  usePointerEngine({
    containerRef,
    config: effectivePointer,
    isInteractive,
    reducedMotion,
  });

  // 2. Motion engine (keyframe styles & animation states)
  const { motionStyles } = useMotionEngine({
    config: effectiveMotion,
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
    config: effectiveScene3D,
    reducedMotion,
  });

  // 5. Interactive carousel engine
  const carousel = useInteractiveCarousel({
    containerRef,
    config: config.carousel,
    isInteractive,
  });

  // Legacy single-pipeline WebGL engines (active when not using layered compositing)
  const isLegacyShaderBg = !hasComposableLayers && Boolean(effectiveBackground?.type === 'shader' && effectiveBackground?.shader);
  useShaderEngine({
    containerRef,
    config: effectiveBackground?.shader,
    pointerX: pointerSignal.current.x,
    pointerY: pointerSignal.current.y,
    isPlaying: isPlaying && isLegacyShaderBg,
    reducedMotion,
  });

  const isLegacyGradientBg = !hasComposableLayers && Boolean(effectiveBackground?.type === 'interactive-gradient' && effectiveBackground?.gradient);
  useInteractiveGradient({
    containerRef,
    config: effectiveBackground?.gradient,
    pointerX: pointerSignal.current.x,
    pointerY: pointerSignal.current.y,
    isPlaying: isPlaying && isLegacyGradientBg,
    reducedMotion,
  });

  const isLegacyParticles = !hasComposableLayers && Boolean(effectiveParticles && effectiveParticles.count > 0);
  useParticleEngine({
    containerRef,
    config: isLegacyParticles ? effectiveParticles : undefined,
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

  const isSpotlightActive = effectivePointer?.type === 'spotlight' || effectivePointer?.type === 'glow';
  const spotlightColor = effectivePointer?.color || 'rgba(139, 92, 246, 0.18)';
  const spotlightRadius = effectivePointer?.radius || 350;

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
          {/* COMPOSABLE LAYER STACK (v3.0) */}
          {hasComposableLayers && config.layers?.map((layer) => {
            const isVisible = layer.visible !== false;
            const layerOpacity = layer.opacity ?? 1;
            const blendMode = layer.blendMode || 'normal';

            if (!isVisible) return null;

            // Background Layer
            if (layer.role === 'background' && layer.background) {
              const isShader = layer.background.type === 'shader' && layer.background.shader;
              return (
                <div
                  key={layer.id}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    zIndex: layer.zIndex,
                    opacity: layerOpacity,
                    mixBlendMode: blendMode as any,
                  }}
                >
                  {isShader ? (
                    <LayerShaderBackground
                      config={layer.background.shader}
                      pointerSignal={pointerSignal}
                      isPlaying={isPlaying}
                      reducedMotion={reducedMotion}
                    />
                  ) : layer.background.type !== 'none' ? (
                    <ExperienceBackgroundLayer
                      config={layer.background}
                      isPlaying={isPlaying}
                      reducedMotion={reducedMotion}
                    />
                  ) : null}
                </div>
              );
            }

            // Particles Layer
            if (layer.role === 'particles' && layer.particles) {
              return (
                <div
                  key={layer.id}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    zIndex: layer.zIndex,
                    opacity: layerOpacity,
                    mixBlendMode: blendMode as any,
                  }}
                >
                  <LayerParticleField
                    config={layer.particles}
                    pointerSignal={pointerSignal}
                    isPlaying={isPlaying}
                    reducedMotion={reducedMotion}
                  />
                </div>
              );
            }

            // Overlay / Spotlight Layer
            if (layer.role === 'overlay') {
              const pConfig = layer.pointer || effectivePointer;
              const sColor = pConfig?.color || spotlightColor;
              const sRadius = pConfig?.radius || spotlightRadius;
              return (
                <div
                  key={layer.id}
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    zIndex: layer.zIndex,
                    opacity: layerOpacity,
                    mixBlendMode: blendMode as any,
                    background: isInteractive && !reducedMotion
                      ? `radial-gradient(${sRadius}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${sColor}, transparent 70%)`
                      : undefined,
                  }}
                />
              );
            }

            // Content Stage Layer
            if (layer.role === 'content') {
              return (
                <div
                  key={layer.id}
                  className="solospot-scene-content relative w-full"
                  style={{
                    zIndex: layer.zIndex,
                    opacity: layerOpacity,
                    mixBlendMode: blendMode as any,
                    ...motionStyles,
                    transform: effectivePointer?.type === 'tilt' && !reducedMotion
                      ? 'perspective(1200px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))'
                      : undefined,
                    transformStyle: effectiveScene3D?.transformStyle || undefined,
                    transition: isInteractive ? 'transform 0.1s ease-out' : undefined,
                  }}
                >
                  {children}
                </div>
              );
            }

            // Spatial 3D Reflection Plane
            if (layer.role === 'spatial-3d' && layer.scene3d?.reflection && !reducedMotion) {
              return (
                <div
                  key={layer.id}
                  className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none"
                  style={{
                    zIndex: layer.zIndex,
                    opacity: layer.scene3d.reflectionOpacity ?? 0.3,
                    mixBlendMode: blendMode as any,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  }}
                />
              );
            }

            return null;
          })}

          {/* LEGACY FALLBACK RENDERING (When config.layers is not set) */}
          {!hasComposableLayers && (
            <>
              {effectiveBackground && effectiveBackground.type !== 'none' && !isLegacyShaderBg && !isLegacyGradientBg && (
                <ExperienceBackgroundLayer
                  config={effectiveBackground}
                  isPlaying={isPlaying}
                  reducedMotion={reducedMotion}
                />
              )}

              {isSpotlightActive && isInteractive && !reducedMotion && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(${spotlightRadius}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 70%)`,
                  }}
                />
              )}

              <div
                className="solospot-scene-content relative z-20 w-full"
                style={{
                  ...motionStyles,
                  transform: effectivePointer?.type === 'tilt' && !reducedMotion
                    ? 'perspective(1200px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))'
                    : undefined,
                  transformStyle: effectiveScene3D?.transformStyle || undefined,
                  transition: isInteractive ? 'transform 0.1s ease-out' : undefined,
                }}
              >
                {children}
              </div>

              {config.scene3d?.reflection && !reducedMotion && (
                <div
                  className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    opacity: config.scene3d.reflectionOpacity ?? 0.3,
                  }}
                />
              )}
            </>
          )}
        </div>
      </ExperienceRuntimeContext.Provider>
    </ExperienceErrorBoundary>
  );
}
