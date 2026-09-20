/**
 * v2-phase8-flagships.ts — Flagship Validation Experiences for Phase 4-6 Primitives
 *
 * Validates: spring motion, text motion, scroll choreography, 3D scene,
 * post-processing effects, and video scrub via the shared Experience Runtime Engine.
 */

import {
  createSectionNode,
  createBuilderNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';
import type { ExperienceSceneConfig } from '../ExperienceRuntimeTypes';

export const V2_PHASE8_FLAGSHIP_EXPERIENCES: ExperienceItem[] = [
  // 1. Crystal Wave — 3D crystal shards with spring entrance, scroll-driven parallax, vignette
  {
    id: 'v2-f8-crystal-wave',
    name: 'Crystal Wave',
    type: 'section',
    category: '3d-scene',
    description:
      '3D crystal shards with spring-physics entrance animation, scroll-driven parallax depth layers, and a cinematic vignette overlay.',
    tagline: 'Spring-animated crystal shards in parallax depth',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'cinematic',
    motionLevel: 'cinematic',
    industry: ['creative', 'technology', 'luxury', 'agency'],
    tags: [
      'v2',
      'phase8',
      'spring',
      '3d-scene',
      'parallax',
      'vignette',
      'crystal',
      'flagship',
    ],
    capabilities: { perspective3d: true, scrollAnimation: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      scene3d: {
        perspective: 1200,
        transformStyle: 'preserve-3d',
        layers: [
          {
            id: 'crystal-shard-1',
            depthZ: 200,
            scaleFactor: 1.1,
            rotationFactor: 0.4,
          },
          {
            id: 'crystal-shard-2',
            depthZ: 400,
            scaleFactor: 0.9,
            rotationFactor: 0.6,
          },
          {
            id: 'crystal-shard-3',
            depthZ: 600,
            scaleFactor: 0.75,
            rotationFactor: 0.8,
          },
        ],
      },
      motion: {
        type: 'reveal',
        speed: 1.8,
        intensity: 1.4,
        direction: 'normal',
      },
      scroll: {
        type: 'parallax-depth',
        steps: 4,
      },
      background: {
        type: 'static-gradient',
        colors: ['#050510', '#0c0a20', '#08061a'],
        opacity: 1.0,
      },
      effects: ['vignette'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Crystal Wave',
        props: {
          experienceConfig: {
            version: '2.0.0',
            scene3d: {
              perspective: 1200,
              transformStyle: 'preserve-3d',
              layers: [
                { id: 'crystal-shard-1', depthZ: 200, scaleFactor: 1.1, rotationFactor: 0.4 },
                { id: 'crystal-shard-2', depthZ: 400, scaleFactor: 0.9, rotationFactor: 0.6 },
                { id: 'crystal-shard-3', depthZ: 600, scaleFactor: 0.75, rotationFactor: 0.8 },
              ],
            },
            motion: { type: 'reveal', speed: 1.8, intensity: 1.4, direction: 'normal' },
            scroll: { type: 'parallax-depth', steps: 4 },
            background: { type: 'static-gradient', colors: ['#050510', '#0c0a20', '#08061a'], opacity: 1.0 },
            effects: ['vignette'],
          },
        },
        styles: {
          backgroundColor: '#050510',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '800px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Crystal Stage',
            styles: {
              maxWidth: '1100px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10,
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: '3D CRYSTAL ENGINE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Crystal Wave', level: 'h1' }, styles: { fontSize: '56px', fontWeight: '900', color: '#ffffff', letterSpacing: '-2px', lineHeight: '1.1' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Multi-layer 3D crystal shards with spring-physics entrance, scroll-driven parallax depth, and cinematic vignette overlay.' }, styles: { fontSize: '17px', color: '#cbd5e1', lineHeight: '1.7', maxWidth: '560px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Crystal Runtime' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.5)' } }),
            ],
          }),
        ],
      });
    },
  },

  // 2. Liquid Narrative — Scroll-pinned story, text reveal, fluid shader, particles
  {
    id: 'v2-f8-liquid-narrative',
    name: 'Liquid Narrative',
    type: 'section',
    category: 'scroll-story',
    description:
      'Scroll-pinned editorial narrative with word-by-word text reveal, fluid-warp WebGL shader background, and floating particle overlay.',
    tagline: 'Scroll-pinned story with fluid shader atmosphere',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'editorial',
    motionLevel: 'scroll',
    industry: ['agency', 'portfolio', 'saas', 'creative'],
    tags: [
      'v2',
      'phase8',
      'scroll',
      'sticky-story',
      'text-reveal',
      'shader',
      'fluid-warp',
      'particles',
      'flagship',
    ],
    capabilities: { scrollAnimation: true, sticky: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      scroll: {
        type: 'sticky-story',
        steps: 5,
        pinDuration: 1400,
      },
      background: {
        type: 'shader',
        shader: {
          preset: 'fluid-warp',
          colorA: '#06b6d4',
          colorB: '#8b5cf6',
          colorC: '#ec4899',
          speed: 0.7,
          intensity: 1.0,
          distortion: 1.2,
          pointerInfluence: 0.4,
        },
        opacity: 0.85,
      },
      motion: {
        type: 'reveal',
        speed: 1.2,
        intensity: 1.0,
      },
      particles: {
        count: 200,
        size: 1.8,
        speed: 0.5,
        spread: 1.5,
        depth: 0.8,
        opacity: 0.6,
        color: '#818cf8',
        pointerInfluence: 0.6,
      },
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Liquid Narrative',
        props: {
          experienceConfig: {
            version: '2.0.0',
            scroll: { type: 'sticky-story', steps: 5, pinDuration: 1400 },
            background: {
              type: 'shader',
              shader: { preset: 'fluid-warp', colorA: '#06b6d4', colorB: '#8b5cf6', colorC: '#ec4899', speed: 0.7, intensity: 1.0, distortion: 1.2, pointerInfluence: 0.4 },
              opacity: 0.85,
            },
            motion: { type: 'reveal', speed: 1.2, intensity: 1.0 },
            particles: { count: 200, size: 1.8, speed: 0.5, spread: 1.5, depth: 0.8, opacity: 0.6, color: '#818cf8', pointerInfluence: 0.6 },
          },
        },
        styles: {
          backgroundColor: '#060610',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Sticky Story Frame',
            styles: {
              maxWidth: '1100px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              gap: '64px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Sticky Left Header',
                styles: { width: '40%', position: 'sticky', top: '40px', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'FLUID-WARP NARRATIVE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#22d3ee', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Liquid Narrative Scroll' }, styles: { fontSize: '38px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1.2' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'A five-step scroll-pinned story with word-by-word text reveal over a live WebGL fluid-warp background.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Story Steps Column',
                styles: { width: '60%', display: 'flex', flexDirection: 'column', gap: '24px' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Step 1', styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'CHAPTER 01' }, styles: { fontSize: '11px', fontWeight: '800', color: '#06b6d4', letterSpacing: '1.5px' } }),
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'The Fluid Canvas' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'WebGL fragment shaders warp a chromatic gradient field in real-time.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  ]}),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Step 2', styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'CHAPTER 02' }, styles: { fontSize: '11px', fontWeight: '800', color: '#8b5cf6', letterSpacing: '1.5px' } }),
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Word-by-Word Reveal' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'Text lines materialize progressively as scroll position advances through each pinned section.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  ]}),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Step 3', styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px' }, children: [
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'CHAPTER 03' }, styles: { fontSize: '11px', fontWeight: '800', color: '#ec4899', letterSpacing: '1.5px' } }),
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Particle Atmosphere' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: '200 depth-sorted particles drift through the shader background for spatial richness.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  ]}),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 3. Product Reveal 3D — 3D product showcase, scroll rotation, gradient, glow
  {
    id: 'v2-f8-product-reveal-3d',
    name: 'Product Reveal 3D',
    type: 'section',
    category: '3d-scene',
    description:
      '3D product showcase with scroll-timeline-driven rotation, interactive gradient background, and glow-border post-processing.',
    tagline: 'Scroll-scrubbed 3D product stage with glow effects',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'futuristic',
    motionLevel: 'scroll',
    industry: ['product', 'ecommerce', 'technology', 'saas'],
    tags: [
      'v2',
      'phase8',
      '3d-scene',
      'product',
      'scroll',
      'timeline-scrub',
      'interactive-gradient',
      'glow',
      'flagship',
    ],
    capabilities: { perspective3d: true, scrollAnimation: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      scene3d: {
        perspective: 1000,
        transformStyle: 'preserve-3d',
        layers: [
          {
            id: 'product-stage',
            depthZ: 0,
            scaleFactor: 1.0,
            rotationFactor: 1.0,
          },
        ],
      },
      scroll: {
        type: 'timeline-scrub',
        pinDuration: 1600,
      },
      background: {
        type: 'interactive-gradient',
        gradient: {
          colors: ['#0f0524', '#1a0a3e', '#0d0820'],
          pointerStrength: 0.8,
          speed: 0.6,
          softness: 1.2,
          resolution: 'medium',
        },
        opacity: 1.0,
      },
      motion: {
        type: 'rotate',
        speed: 0.9,
        intensity: 1.0,
        direction: 'alternate',
      },
      effects: ['glow-border', 'bloom'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Product Reveal 3D',
        props: {
          experienceConfig: {
            version: '2.0.0',
            scene3d: {
              perspective: 1000,
              transformStyle: 'preserve-3d',
              layers: [{ id: 'product-stage', depthZ: 0, scaleFactor: 1.0, rotationFactor: 1.0 }],
            },
            scroll: { type: 'timeline-scrub', pinDuration: 1600 },
            background: {
              type: 'interactive-gradient',
              gradient: { colors: ['#0f0524', '#1a0a3e', '#0d0820'], pointerStrength: 0.8, speed: 0.6, softness: 1.2, resolution: 'medium' },
              opacity: 1.0,
            },
            motion: { type: 'rotate', speed: 0.9, intensity: 1.0, direction: 'alternate' },
            effects: ['glow-border', 'bloom'],
          },
        },
        styles: {
          backgroundColor: '#0a0618',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Product Stage Layout',
            styles: {
              maxWidth: '1200px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '56px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Content',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: '3D PRODUCT STAGE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a855f7', letterSpacing: '3px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Product Reveal 3D', level: 'h1' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px', lineHeight: '1.1' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Scroll-timeline-driven 3D product rotation with interactive gradient background and glow-border post-processing.' }, styles: { fontSize: '17px', color: '#cbd5e1', lineHeight: '1.7', maxWidth: '500px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Reveal Product' }, styles: { backgroundColor: '#a855f7', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px -4px rgba(168, 85, 247, 0.5)' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: '3D Product Card',
                styles: {
                  width: '50%',
                  perspective: '1000px',
                  display: 'flex',
                  justifyContent: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Rotating Product Surface',
                    styles: {
                      width: '380px',
                      height: '380px',
                      backgroundColor: 'rgba(15, 5, 36, 0.8)',
                      backdropFilter: 'blur(20px)',
                      borderWidth: '1px',
                      borderColor: 'rgba(168, 85, 247, 0.4)',
                      borderRadius: '24px',
                      boxShadow: '0 0 60px -10px rgba(168, 85, 247, 0.35), inset 0 1px 2px 0 rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Product Visual', props: { src: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80', alt: '3D Product' }, styles: { width: '280px', height: '280px', borderRadius: '16px', objectFit: 'cover' } }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 4. Glass Wave Stage — Floating glass cards, spring morph, interactive gradient, pointer tilt
  {
    id: 'v2-f8-glass-wave-stage',
    name: 'Glass Wave Stage',
    type: 'section',
    category: 'interactive',
    description:
      'Multiple floating glass cards with spring-physics morph motion, interactive gradient background, pointer-driven tilt at 1.5x strength, and ambient particles.',
    tagline: 'Spring-physics glass cards with interactive gradient',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'minimal',
    motionLevel: 'interactive',
    industry: ['creative', 'luxury', 'saas', 'agency'],
    tags: [
      'v2',
      'phase8',
      'glass',
      'spring',
      'morph',
      'interactive-gradient',
      'pointer-tilt',
      'particles',
      'flagship',
    ],
    capabilities: { glassmorphism: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      motion: {
        type: 'morph',
        speed: 1.3,
        intensity: 1.2,
      },
      pointer: {
        type: 'tilt',
        strength: 1.5,
        maxAngle: 12,
      },
      background: {
        type: 'interactive-gradient',
        gradient: {
          colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'],
          pointerStrength: 1.0,
          speed: 0.8,
          softness: 1.0,
          distortion: 0.6,
          resolution: 'high',
        },
        opacity: 0.9,
      },
      particles: {
        count: 150,
        size: 1.5,
        speed: 0.4,
        spread: 1.2,
        depth: 0.6,
        opacity: 0.5,
        color: '#67e8f9',
        pointerInfluence: 1.0,
      },
      effects: ['glass'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Glass Wave Stage',
        props: {
          experienceConfig: {
            version: '2.0.0',
            motion: { type: 'morph', speed: 1.3, intensity: 1.2 },
            pointer: { type: 'tilt', strength: 1.5, maxAngle: 12 },
            background: {
              type: 'interactive-gradient',
              gradient: { colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'], pointerStrength: 1.0, speed: 0.8, softness: 1.0, distortion: 0.6, resolution: 'high' },
              opacity: 0.9,
            },
            particles: { count: 150, size: 1.5, speed: 0.4, spread: 1.2, depth: 0.6, opacity: 0.5, color: '#67e8f9', pointerInfluence: 1.0 },
            effects: ['glass'],
          },
        },
        styles: {
          backgroundColor: '#070914',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Glass Stage Content',
            styles: {
              maxWidth: '1100px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              position: 'relative',
              zIndex: 10,
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Title Area',
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'SPRING GLASS COMPOSITION' }, styles: { fontSize: '12px', fontWeight: '800', color: '#22d3ee', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Glass Wave Stage' }, styles: { fontSize: '44px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Floating glassmorphism cards driven by spring-physics morph motion with interactive gradient and pointer-responsive tilt.' }, styles: { fontSize: '17px', color: '#94a3b8', maxWidth: '600px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Glass Cards Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 1',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Spring Morph' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Spring-physics morph animation drives fluid card transitions and entrance states.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 2',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(34, 211, 238, 0.3)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Pointer Tilt 1.5x' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Enhanced pointer strength creates pronounced tilt response on glass surfaces.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 3',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Interactive Gradient' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'High-resolution interactive gradient responds to pointer with 1.0x strength.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 5. Cosmic Scroll — Parallax star field, depth layers, speed multiplier, vignette + grain
  {
    id: 'v2-f8-cosmic-scroll',
    name: 'Cosmic Scroll',
    type: 'section',
    category: 'scroll-story',
    description:
      'Parallax star field with four depth layers, scroll-driven speed multiplier, nebula WebGL shader background, and combined vignette plus film-grain post-processing.',
    tagline: 'Four-layer parallax star field with nebula shader',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'dark',
    motionLevel: 'scroll',
    industry: ['technology', 'creative', 'portfolio', 'agency'],
    tags: [
      'v2',
      'phase8',
      'scroll',
      'parallax',
      'star-field',
      'nebula',
      'shader',
      'vignette',
      'grain',
      'particles',
      'flagship',
    ],
    capabilities: { scrollAnimation: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      scroll: {
        type: 'parallax-depth',
        steps: 4,
      },
      background: {
        type: 'shader',
        shader: {
          preset: 'nebula',
          colorA: '#1e1b4b',
          colorB: '#312e81',
          colorC: '#4338ca',
          speed: 0.5,
          intensity: 1.2,
          distortion: 0.8,
          pointerInfluence: 0.3,
        },
        opacity: 0.9,
      },
      particles: {
        count: 400,
        size: 1.2,
        speed: 0.3,
        spread: 2.0,
        depth: 1.5,
        opacity: 0.8,
        color: '#c7d2fe',
        pointerInfluence: 0.2,
      },
      motion: {
        type: 'float',
        speed: 0.6,
        intensity: 0.8,
      },
      effects: ['vignette', 'grain'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Cosmic Scroll',
        props: {
          experienceConfig: {
            version: '2.0.0',
            scroll: { type: 'parallax-depth', steps: 4 },
            background: {
              type: 'shader',
              shader: { preset: 'nebula', colorA: '#1e1b4b', colorB: '#312e81', colorC: '#4338ca', speed: 0.5, intensity: 1.2, distortion: 0.8, pointerInfluence: 0.3 },
              opacity: 0.9,
            },
            particles: { count: 400, size: 1.2, speed: 0.3, spread: 2.0, depth: 1.5, opacity: 0.8, color: '#c7d2fe', pointerInfluence: 0.2 },
            motion: { type: 'float', speed: 0.6, intensity: 0.8 },
            effects: ['vignette', 'grain'],
          },
        },
        styles: {
          backgroundColor: '#050510',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '800px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Cosmic Content',
            styles: {
              maxWidth: '1000px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10,
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'NEBULA SHADER ENGINE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#818cf8', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Cosmic Scroll', level: 'h1' }, styles: { fontSize: '56px', fontWeight: '900', color: '#ffffff', letterSpacing: '-2px', lineHeight: '1.1' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Four-layer parallax star field with nebula WebGL shader, scroll-driven speed multiplier, vignette, and film-grain overlay.' }, styles: { fontSize: '17px', color: '#cbd5e1', lineHeight: '1.7', maxWidth: '560px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Depth Layer Indicators',
                styles: { display: 'flex', flexDirection: 'row', gap: '16px', marginTop: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Layer 1', styles: { width: '80px', height: '4px', backgroundColor: '#312e81', borderRadius: '2px' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Layer 2', styles: { width: '80px', height: '4px', backgroundColor: '#4338ca', borderRadius: '2px' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Layer 3', styles: { width: '80px', height: '4px', backgroundColor: '#6366f1', borderRadius: '2px' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Layer 4', styles: { width: '80px', height: '4px', backgroundColor: '#818cf8', borderRadius: '2px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Enter the Cosmos' }, styles: { backgroundColor: '#4338ca', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px -4px rgba(67, 56, 202, 0.5)' } }),
            ],
          }),
        ],
      });
    },
  },

  // 6. Sticky Perspective — Scroll-pinned sections, perspective shifts, text slide, aurora
  {
    id: 'v2-f8-sticky-perspective',
    name: 'Sticky Perspective',
    type: 'section',
    category: 'scroll-story',
    description:
      'Scroll-pinned sections with perspective camera shifts, word-by-word text slide reveal, wave motion animation, and aurora shader background.',
    tagline: 'Perspective-shifting sticky scroll with aurora',
    badge: 'Phase 8 Flagship',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'futuristic',
    motionLevel: 'scroll',
    industry: ['technology', 'creative', 'agency', 'portfolio'],
    tags: [
      'v2',
      'phase8',
      'scroll',
      'sticky-story',
      'perspective',
      'text-slide',
      'wave-motion',
      'aurora',
      'flagship',
    ],
    capabilities: { scrollAnimation: true, sticky: true, perspective3d: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      scroll: {
        type: 'sticky-story',
        steps: 4,
        pinDuration: 1200,
      },
      pointer: {
        type: 'perspective',
        perspective: 800,
      },
      motion: {
        type: 'wave',
        speed: 1.0,
        intensity: 1.0,
      },
      background: {
        type: 'aurora',
        colors: ['#6366f1', '#a855f7', '#3b82f6', '#14b8a6'],
        speed: 1.2,
        blur: 70,
        opacity: 0.85,
      },
      effects: ['vignette'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2 Phase8: Sticky Perspective',
        props: {
          experienceConfig: {
            version: '2.0.0',
            scroll: { type: 'sticky-story', steps: 4, pinDuration: 1200 },
            pointer: { type: 'perspective', perspective: 800 },
            motion: { type: 'wave', speed: 1.0, intensity: 1.0 },
            background: {
              type: 'aurora',
              colors: ['#6366f1', '#a855f7', '#3b82f6', '#14b8a6'],
              speed: 1.2,
              blur: 70,
              opacity: 0.85,
            },
            effects: ['vignette'],
          },
        },
        styles: {
          backgroundColor: '#06060c',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Perspective Story Frame',
            styles: {
              maxWidth: '1100px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              gap: '64px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Sticky Header',
                styles: { width: '40%', position: 'sticky', top: '40px', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'PERSPECTIVE SCROLL' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Sticky Perspective' }, styles: { fontSize: '38px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1.2' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Four scroll-pinned perspective sections with camera shifts, text slide reveal, and aurora atmosphere.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Perspective Steps',
                styles: { width: '60%', display: 'flex', flexDirection: 'column', gap: '28px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Perspective Step 1',
                    styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(99,102,241,0.25)', borderRadius: '20px', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px', transform: 'perspective(800px) rotateY(2deg)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'PERSPECTIVE 01' }, styles: { fontSize: '11px', fontWeight: '800', color: '#6366f1', letterSpacing: '1.5px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Camera Shift Forward' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'Perspective camera advances into the scene on initial scroll trigger.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Perspective Step 2',
                    styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(168,85,247,0.25)', borderRadius: '20px', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px', transform: 'perspective(800px) rotateY(-2deg)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'PERSPECTIVE 02' }, styles: { fontSize: '11px', fontWeight: '800', color: '#a855f7', letterSpacing: '1.5px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Text Slide Reveal' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'Headline text slides in from the left with spring easing as the section pins.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Perspective Step 3',
                    styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(59,130,246,0.25)', borderRadius: '20px', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px', transform: 'perspective(800px) rotateY(3deg)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'PERSPECTIVE 03' }, styles: { fontSize: '11px', fontWeight: '800', color: '#3b82f6', letterSpacing: '1.5px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Wave Motion Pulse' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'Wave-type motion animates the perspective cards with rhythmic pulsing motion.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Perspective Step 4',
                    styles: { backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', borderWidth: '1px', borderColor: 'rgba(20,184,166,0.25)', borderRadius: '20px', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px', transform: 'perspective(800px) rotateY(-1deg)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Tag', props: { text: 'PERSPECTIVE 04' }, styles: { fontSize: '11px', fontWeight: '800', color: '#14b8a6', letterSpacing: '1.5px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step Title', props: { text: 'Aurora Atmosphere' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Text', props: { text: 'Full-spectrum aurora shader background completes the immersive perspective environment.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
