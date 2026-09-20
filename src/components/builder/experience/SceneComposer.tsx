/**
 * SceneComposer.tsx — Multi-Layer Visual Experience Composition
 *
 * Orchestrates multiple visual layers in a single scene:
 *   - Shader background layer
 *   - Gradient background layer
 *   - Particle layer
 *   - Video layer
 *   - 3D scene layer
 *   - Content layer
 *   - Post-processing overlay
 *
 * Each layer has z-index, visibility, opacity, and responsive behavior.
 * Layers are ordered by z-index and rendered in correct stacking order.
 */

'use client';

import React, { useRef, createContext, useContext } from 'react';
import type {
  CompositionLayer,
  ShaderConfig,
  InteractiveGradientConfig,
  ParticleConfig,
} from '@/lib/experience/ExperienceRuntimeTypes';
import type { PerformanceTier } from '@/lib/experience/ExperienceRuntimeTypes';
import { useShaderEngine } from '@/lib/experience/runtime/useShaderEngine';
import { useInteractiveGradient } from '@/lib/experience/runtime/useInteractiveGradient';
import { useParticleEngine } from '@/lib/experience/runtime/useParticleEngine';
import { useVideoScrub } from '@/lib/experience/runtime/useVideoScrub';
import { detectPerformanceTier } from '@/lib/experience/runtime/PerformanceTier';

interface SceneComposerContextValue {
  layers: CompositionLayer[];
  performanceTier: PerformanceTier;
}

const SceneComposerContext = createContext<SceneComposerContextValue | null>(null);

export function useSceneComposerContext() {
  return useContext(SceneComposerContext);
}

export interface SceneComposerProps {
  layers?: CompositionLayer[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  scrollProgress?: number;
  pointerX?: number;
  pointerY?: number;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function SceneComposer({
  layers = [],
  children,
  className = '',
  style = {},
  scrollProgress = 0,
  pointerX = 0,
  pointerY = 0,
  isPlaying = true,
  reducedMotion = false,
}: SceneComposerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const perfTier = detectPerformanceTier();

  const sortedLayers = [...layers]
    .filter(l => l.visible)
    .filter(l => {
      if (!l.performanceTier) return true;
      const tierOrder = { low: 0, medium: 1, high: 2 };
      return tierOrder[perfTier] >= tierOrder[l.performanceTier];
    })
    .sort((a, b) => a.zIndex - b.zIndex);

  const contextValue: SceneComposerContextValue = {
    layers: sortedLayers,
    performanceTier: perfTier,
  };

  return (
    <SceneComposerContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={style}
      >
        {sortedLayers.map((layer) => (
          <SceneLayer
            key={layer.id}
            layer={layer}
            containerRef={containerRef}
            pointerX={pointerX}
            pointerY={pointerY}
            scrollProgress={scrollProgress}
            isPlaying={isPlaying}
            reducedMotion={reducedMotion}
          />
        ))}
        <div className="relative z-20">
          {children}
        </div>
      </div>
    </SceneComposerContext.Provider>
  );
}

interface SceneLayerProps {
  layer: CompositionLayer;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pointerX: number;
  pointerY: number;
  scrollProgress: number;
  isPlaying: boolean;
  reducedMotion: boolean;
}

function SceneLayer({
  layer,
  containerRef,
  pointerX,
  pointerY,
  scrollProgress,
  isPlaying,
  reducedMotion,
}: SceneLayerProps) {
  const layerConfig = layer.config as Record<string, unknown>;

  switch (layer.type) {
    case 'shader':
      return (
        <ShaderLayer
          config={layerConfig as unknown as ShaderConfig}
          containerRef={containerRef}
          pointerX={pointerX}
          pointerY={pointerY}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
          opacity={layer.opacity}
        />
      );

    case 'gradient':
      return (
        <GradientLayer
          config={layerConfig as unknown as InteractiveGradientConfig}
          containerRef={containerRef}
          pointerX={pointerX}
          pointerY={pointerY}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
          opacity={layer.opacity}
        />
      );

    case 'particles':
      return (
        <ParticleLayer
          config={layerConfig as unknown as ParticleConfig}
          containerRef={containerRef}
          isPlaying={isPlaying}
          reducedMotion={reducedMotion}
          opacity={layer.opacity}
        />
      );

    default:
      return null;
  }
}

function ShaderLayer({
  config,
  containerRef,
  pointerX,
  pointerY,
  isPlaying,
  reducedMotion,
  opacity,
}: {
  config: ShaderConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pointerX: number;
  pointerY: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  opacity?: number;
}) {
  useShaderEngine({
    containerRef,
    config,
    pointerX,
    pointerY,
    isPlaying,
    reducedMotion,
  });

  return null;
}

function GradientLayer({
  config,
  containerRef,
  pointerX,
  pointerY,
  isPlaying,
  reducedMotion,
  opacity,
}: {
  config: InteractiveGradientConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pointerX: number;
  pointerY: number;
  isPlaying: boolean;
  reducedMotion: boolean;
  opacity?: number;
}) {
  useInteractiveGradient({
    containerRef,
    config,
    pointerX,
    pointerY,
    isPlaying,
    reducedMotion,
  });

  return null;
}

function ParticleLayer({
  config,
  containerRef,
  isPlaying,
  reducedMotion,
  opacity,
}: {
  config: ParticleConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  reducedMotion: boolean;
  opacity?: number;
}) {
  useParticleEngine({
    containerRef,
    config,
    isPlaying,
    reducedMotion,
  });

  return null;
}
