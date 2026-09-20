/**
 * experience-presets.ts — Curated Library of Visual Experience Presets
 *
 * Complete ExperienceSceneConfig presets insertable via the Builder UI.
 * Each preset includes metadata, thumbnail preview, and a full runtime config.
 */

import type { ExperienceSceneConfig } from '@/lib/experience/ExperienceRuntimeTypes';

export interface ExperiencePreset {
  id: string;
  name: string;
  description: string;
  category: 'gradient' | 'shader' | 'particles' | '3d' | 'composition';
  thumbnail: string;
  config: ExperienceSceneConfig;
}

export const EXPERIENCE_PRESETS: ExperiencePreset[] = [
  // ─── Gradient ──────────────────────────────────────────────────────────────
  {
    id: 'preset-aurora-borealis',
    name: 'Aurora Borealis',
    description: 'Interactive aurora gradient that reacts to pointer movement, evoking northern lights.',
    category: 'gradient',
    thumbnail: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #10b981 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'interactive-gradient',
        colors: ['#7c3aed', '#06b6d4', '#10b981'],
        gradient: {
          colors: ['#7c3aed', '#06b6d4', '#10b981'],
          pointerStrength: 0.8,
          speed: 0.8,
          softness: 0.7,
          resolution: 'high',
        },
      },
      pointer: {
        type: 'tilt',
        strength: 0.6,
        maxAngle: 15,
      },
      effects: ['vignette'],
      reducedMotionFallback: true,
      performanceTier: 'high',
    },
  },
  {
    id: 'preset-deep-ocean',
    name: 'Deep Ocean',
    description: 'Static aurora gradient with deep blue and teal tones for a calm, immersive atmosphere.',
    category: 'gradient',
    thumbnail: 'linear-gradient(180deg, #0c4a6e 0%, #1e3a5f 50%, #164e63 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'static-gradient',
        colors: ['#0c4a6e', '#1e3a5f', '#164e63'],
        gradient: {
          colors: ['#0c4a6e', '#1e3a5f', '#164e63'],
          speed: 0.5,
          softness: 0.9,
          resolution: 'medium',
        },
      },
      effects: ['vignette'],
      reducedMotionFallback: true,
      performanceTier: 'medium',
    },
  },
  {
    id: 'preset-sunset-glow',
    name: 'Sunset Glow',
    description: 'Interactive mesh gradient with warm sunset hues and fluid pointer-driven motion.',
    category: 'gradient',
    thumbnail: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'interactive-gradient',
        colors: ['#f97316', '#ec4899', '#8b5cf6'],
        gradient: {
          colors: ['#f97316', '#ec4899', '#8b5cf6'],
          pointerStrength: 1,
          speed: 1,
          softness: 0.6,
          distortion: 0.3,
          resolution: 'high',
        },
      },
      pointer: {
        type: 'parallax',
        strength: 0.5,
      },
      effects: ['bloom'],
      reducedMotionFallback: true,
      performanceTier: 'high',
    },
  },

  // ─── Shader ────────────────────────────────────────────────────────────────
  {
    id: 'preset-plasma-dream',
    name: 'Plasma Dream',
    description: 'GPU-driven plasma shader with vibrant color cycling and high visual impact.',
    category: 'shader',
    thumbnail: 'linear-gradient(135deg, #a855f7 0%, #ec4899 33%, #f97316 66%, #facc15 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'shader',
        opacity: 0.9,
        speed: 1.2,
        shader: {
          preset: 'plasma',
          colorA: '#a855f7',
          colorB: '#ec4899',
          colorC: '#f97316',
          speed: 1.2,
          intensity: 1,
          scale: 1,
        },
      },
      pointer: {
        type: 'spotlight',
        strength: 0.4,
        radius: 300,
        color: '#a855f7',
      },
      reducedMotionFallback: true,
      performanceTier: 'high',
    },
  },
  {
    id: 'preset-digital-matrix',
    name: 'Digital Matrix',
    description: 'Falling digital rain shader with subtle green glow and cyberpunk aesthetic.',
    category: 'shader',
    thumbnail: 'linear-gradient(180deg, #000000 0%, #052e16 50%, #22c55e 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'shader',
        opacity: 0.7,
        speed: 0.8,
        shader: {
          preset: 'digital-rain',
          colorA: '#22c55e',
          colorB: '#166534',
          colorC: '#052e16',
          speed: 0.8,
          intensity: 0.7,
          scale: 1.2,
          pointerInfluence: 0.5,
        },
      },
      pointer: {
        type: 'glow',
        strength: 0.3,
        radius: 200,
        color: '#22c55e',
      },
      effects: ['glow-border'],
      reducedMotionFallback: true,
      performanceTier: 'medium',
    },
  },

  // ─── Particles ─────────────────────────────────────────────────────────────
  {
    id: 'preset-stardust',
    name: 'Stardust',
    description: 'High-density floating star particles with depth-based parallax for a cosmic feel.',
    category: 'particles',
    thumbnail: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #1e1b4b 60%, #000000 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'static-gradient',
        colors: ['#000000', '#1e1b4b', '#020617'],
        gradient: {
          colors: ['#000000', '#1e1b4b', '#020617'],
          speed: 0.3,
          softness: 1,
        },
      },
      particles: {
        count: 400,
        size: 2,
        speed: 0.5,
        depth: 1.5,
        color: '#ffffff',
        opacity: 0.8,
        spread: 1,
      },
      pointer: {
        type: 'parallax',
        strength: 0.3,
      },
      effects: ['bloom'],
      reducedMotionFallback: true,
      performanceTier: 'high',
    },
  },
  {
    id: 'preset-firefly-night',
    name: 'Firefly Night',
    description: 'Gentle firefly particles that respond to pointer proximity with warm amber glow.',
    category: 'particles',
    thumbnail: 'radial-gradient(circle at 40% 60%, #fbbf24 0%, #78350f 40%, #000000 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'static-gradient',
        colors: ['#000000', '#1c1917', '#0c0a09'],
        gradient: {
          colors: ['#000000', '#1c1917', '#0c0a09'],
          speed: 0.2,
          softness: 1,
        },
      },
      particles: {
        count: 150,
        size: 4,
        speed: 0.3,
        color: '#fbbf24',
        pointerInfluence: 2,
        opacity: 0.9,
        spread: 0.8,
        attractRepel: 'attract',
      },
      pointer: {
        type: 'glow',
        strength: 0.6,
        radius: 250,
        color: '#fbbf24',
      },
      effects: ['bloom'],
      reducedMotionFallback: true,
      performanceTier: 'medium',
    },
  },

  // ─── 3D ────────────────────────────────────────────────────────────────────
  {
    id: 'preset-product-showcase',
    name: 'Product Showcase',
    description: 'Auto-rotating 3D scene with soft directional lighting and gradient background for product displays.',
    category: '3d',
    thumbnail: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    config: {
      version: '2.0.0',
      background: {
        type: 'static-gradient',
        colors: ['#1a1a2e', '#16213e', '#0f3460'],
        gradient: {
          colors: ['#1a1a2e', '#16213e', '#0f3460'],
          speed: 0.2,
          softness: 0.8,
        },
      },
      scene3d: {
        perspective: 1200,
        transformStyle: 'preserve-3d',
        layers: [
          {
            id: 'product-model',
            selector: '.product-3d-model',
            depthZ: 0,
            scaleFactor: 1,
            rotationFactor: 1,
          },
          {
            id: 'product-shadow',
            selector: '.product-shadow',
            depthZ: -100,
            scaleFactor: 1.1,
            rotationFactor: 0.3,
          },
        ],
        reflection: true,
        reflectionOpacity: 0.15,
      },
      pointer: {
        type: 'perspective',
        strength: 0.4,
        perspective: 1000,
      },
      motion: {
        type: 'rotate',
        speed: 0.3,
        intensity: 0.5,
        direction: 'alternate',
      },
      effects: ['vignette'],
      reducedMotionFallback: true,
      performanceTier: 'high',
    },
  },
];

export function getPresetById(id: string): ExperiencePreset | undefined {
  return EXPERIENCE_PRESETS.find((preset) => preset.id === id);
}

export function getPresetsByCategory(
  category: ExperiencePreset['category'],
): ExperiencePreset[] {
  return EXPERIENCE_PRESETS.filter((preset) => preset.category === category);
}
