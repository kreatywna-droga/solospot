/**
 * useBackgroundEngine.tsx — Dynamic Motion Background Compositor Layer
 *
 * Renders living motion backgrounds:
 *   - aurora: drifting multi-radial polar lights
 *   - mesh-gradient: smooth organic gradient mesh
 *   - ambient-blobs: glowing blurred orbital light sources
 *   - glowing-orb: centered spotlight core
 *   - video: hardware-accelerated looping ambient video
 */

import React from 'react';
import type { BackgroundConfig } from '../ExperienceRuntimeTypes';

interface BackgroundEngineProps {
  config?: BackgroundConfig;
  isPlaying?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export function ExperienceBackgroundLayer({
  config,
  isPlaying = true,
  reducedMotion = false,
  className = '',
}: BackgroundEngineProps) {
  if (!config || config.type === 'none') {
    return null;
  }

  const speed = config.speed ?? 1.0;
  const opacity = config.opacity ?? 0.85;
  const blur = config.blur ?? 60;
  const playState = isPlaying ? 'running' : 'paused';
  const colors = config.colors && config.colors.length >= 2
    ? config.colors
    : ['#7c3aed', '#3b82f6', '#ec4899', '#06b6d4'];

  // Video Background
  if (config.type === 'video' && config.videoUrl) {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
        <video
          src={config.videoUrl}
          poster={config.posterUrl}
          autoPlay={isPlaying}
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-black/60 pointer-events-none"
          style={{ opacity: 1 - opacity * 0.5 }}
        />
      </div>
    );
  }

  // Aurora Effect
  if (config.type === 'aurora') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        style={{ opacity }}
      >
        <div
          className="absolute -inset-[30%] opacity-70"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 25% 30%, ${colors[0]}88 0%, transparent 70%),
                         radial-gradient(ellipse 50% 60% at 75% 40%, ${colors[1]}88 0%, transparent 70%),
                         radial-gradient(ellipse 70% 60% at 50% 80%, ${colors[2 % colors.length]}66 0%, transparent 70%)`,
            filter: `blur(${blur}px)`,
            animation: reducedMotion ? 'none' : `solospot-aurora-shift ${Math.max(6, 16 / speed)}s ease-in-out infinite alternate`,
            animationPlayState: playState,
          }}
        />
      </div>
    );
  }

  // Mesh Gradient
  if (config.type === 'mesh-gradient') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        style={{ opacity }}
      >
        <div
          className="absolute -inset-[20%]"
          style={{
            background: `linear-gradient(135deg, ${colors[0]}44, transparent 50%),
                         radial-gradient(circle at 80% 20%, ${colors[1]}55 0%, transparent 40%),
                         radial-gradient(circle at 20% 80%, ${colors[2 % colors.length]}55 0%, transparent 40%),
                         radial-gradient(circle at 50% 50%, ${colors[3 % colors.length]}33 0%, transparent 50%)`,
            filter: `blur(${blur * 0.7}px)`,
            animation: reducedMotion ? 'none' : `solospot-mesh-drift ${Math.max(8, 20 / speed)}s ease infinite alternate`,
            animationPlayState: playState,
          }}
        />
      </div>
    );
  }

  // Ambient Floating Blobs
  if (config.type === 'ambient-blobs') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        style={{ opacity }}
      >
        <div
          className="absolute w-96 h-96 rounded-full top-[10%] left-[15%]"
          style={{
            background: colors[0],
            filter: `blur(${blur}px)`,
            opacity: 0.45,
            animation: reducedMotion ? 'none' : `solospot-blob-float-1 ${Math.max(4, 10 / speed)}s ease-in-out infinite alternate`,
            animationPlayState: playState,
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full bottom-[15%] right-[20%]"
          style={{
            background: colors[1],
            filter: `blur(${blur}px)`,
            opacity: 0.4,
            animation: reducedMotion ? 'none' : `solospot-blob-float-2 ${Math.max(5, 12 / speed)}s ease-in-out infinite alternate`,
            animationPlayState: playState,
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full top-[45%] right-[35%]"
          style={{
            background: colors[2 % colors.length],
            filter: `blur(${blur}px)`,
            opacity: 0.35,
            animation: reducedMotion ? 'none' : `solospot-blob-float-3 ${Math.max(6, 14 / speed)}s ease-in-out infinite alternate`,
            animationPlayState: playState,
          }}
        />
      </div>
    );
  }

  // Glowing Orb / Spotlight Core
  if (config.type === 'glowing-orb') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center ${className}`}
        style={{ opacity }}
      >
        <div
          className="w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors[0]}77 0%, ${colors[1]}33 40%, transparent 70%)`,
            filter: `blur(${blur}px)`,
            animation: reducedMotion ? 'none' : `solospot-pulse ${Math.max(3, 8 / speed)}s ease-in-out infinite`,
            animationPlayState: playState,
          }}
        />
      </div>
    );
  }

  // Static Gradient / Fallback
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${colors[0]}33 0%, transparent 70%)`,
        opacity,
      }}
    />
  );
}
