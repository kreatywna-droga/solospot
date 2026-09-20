/**
 * v2-validation-experiences.ts — Flagship Validation Experiences for Phase 1-3 Primitives
 */

import {
  createSectionNode,
  createBuilderNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const V2_VALIDATION_EXPERIENCES: ExperienceItem[] = [
  {
    id: 'v2-aurora-field',
    name: 'Aurora Field',
    type: 'background',
    category: 'background',
    description: 'Live WebGL aurora shader background with noise-based procedural animation and real-time pointer influence.',
    tagline: 'WebGL aurora shader with pointer influence',
    badge: 'v2 Validation',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'cinematic',
    motionLevel: 'animated',
    industry: ['creative', 'technology', 'agency', 'saas'],
    tags: ['v2', 'shader', 'webgl', 'aurora', 'pointer', 'validation'],
    capabilities: { gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      background: {
        type: 'shader',
        shader: {
          preset: 'aurora-noise',
          colorA: '#7c3aed',
          colorB: '#3b82f6',
          colorC: '#ec4899',
          speed: 1.0,
          intensity: 1.2,
          distortion: 1.0,
          pointerInfluence: 0.5,
        },
        opacity: 1.0,
      },
      pointer: {
        type: 'spotlight',
        radius: 400,
        color: 'rgba(139, 92, 246, 0.2)',
      },
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2: Aurora Field',
        props: {
          experienceConfig: {
            version: '2.0.0',
            background: {
              type: 'shader',
              shader: {
                preset: 'aurora-noise',
                colorA: '#7c3aed',
                colorB: '#3b82f6',
                colorC: '#ec4899',
                speed: 1.0,
                intensity: 1.2,
                distortion: 1.0,
                pointerInfluence: 0.5,
              },
              opacity: 1.0,
            },
            pointer: {
              type: 'spotlight',
              radius: 400,
              color: 'rgba(139, 92, 246, 0.2)',
            },
          },
        },
        styles: {
          backgroundColor: '#05050c',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '600px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Content',
            styles: {
              maxWidth: '800px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10,
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'WEBGL SHADER ENGINE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Aurora Field', level: 'h1' }, styles: { fontSize: '56px', fontWeight: '900', color: '#ffffff', letterSpacing: '-2px', lineHeight: '1.1' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Live procedural aurora rendered via raw WebGL fragment shader. Move your pointer to influence the noise field in real-time.' }, styles: { fontSize: '17px', color: '#cbd5e1', lineHeight: '1.7', maxWidth: '560px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Shader Runtime' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.5)' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'v2-particle-galaxy',
    name: 'Particle Galaxy',
    type: 'effect',
    category: 'effect',
    description: 'Canvas 2D particle system with pointer-driven attraction, performance-tier-based count capping, and resource lifecycle tracking.',
    tagline: 'GPU-friendly particles with pointer physics',
    badge: 'v2 Validation',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'dark',
    motionLevel: 'animated',
    industry: ['technology', 'creative', 'saas', 'portfolio'],
    tags: ['v2', 'particles', 'canvas', 'pointer', 'physics', 'validation'],
    capabilities: {},
    runtimeConfig: {
      version: '2.0.0',
      particles: {
        count: 350,
        size: 2.5,
        speed: 0.8,
        spread: 1.2,
        depth: 1.0,
        opacity: 0.9,
        color: '#818cf8',
        pointerInfluence: 1.5,
        attractRepel: 'attract',
      },
      background: {
        type: 'static-gradient',
        colors: ['#06060e', '#0a0a18', '#050510'],
        opacity: 1.0,
      },
      pointer: { type: 'none' },
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2: Particle Galaxy',
        props: {
          experienceConfig: {
            version: '2.0.0',
            particles: {
              count: 350,
              size: 2.5,
              speed: 0.8,
              spread: 1.2,
              depth: 1.0,
              opacity: 0.9,
              color: '#818cf8',
              pointerInfluence: 1.5,
              attractRepel: 'attract',
            },
            background: {
              type: 'static-gradient',
              colors: ['#06060e', '#0a0a18', '#050510'],
              opacity: 1.0,
            },
            pointer: { type: 'none' },
          },
        },
        styles: {
          backgroundColor: '#06060e',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
          minHeight: '600px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Content',
            styles: {
              maxWidth: '800px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 10,
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'PARTICLE RUNTIME' }, styles: { fontSize: '12px', fontWeight: '800', color: '#818cf8', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Particle Galaxy', level: 'h1' }, styles: { fontSize: '56px', fontWeight: '900', color: '#ffffff', letterSpacing: '-2px', lineHeight: '1.1' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: '350 particles rendered via Canvas 2D through the shared render loop. Pointer proximity attracts particles. Count auto-scales by device tier.' }, styles: { fontSize: '17px', color: '#cbd5e1', lineHeight: '1.7', maxWidth: '560px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Particle Runtime' }, styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.5)' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'v2-glass-wave',
    name: 'Glass Wave v2',
    type: 'effect',
    category: 'effect',
    description: 'Fluid-warp WebGL shader background combined with CSS glassmorphism cards and pointer-responsive distortion.',
    tagline: 'Fluid warp shader with glassmorphism',
    badge: 'v2 Validation',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'minimal',
    motionLevel: 'animated',
    industry: ['creative', 'luxury', 'saas', 'agency'],
    tags: ['v2', 'shader', 'glass', 'fluid', 'composition', 'validation'],
    capabilities: { glassmorphism: true, gradient: true },
    runtimeConfig: {
      version: '2.0.0',
      background: {
        type: 'shader',
        shader: {
          preset: 'fluid-warp',
          colorA: '#06b6d4',
          colorB: '#8b5cf6',
          colorC: '#ec4899',
          speed: 0.8,
          intensity: 1.0,
          distortion: 1.2,
          pointerInfluence: 0.6,
        },
        opacity: 0.9,
      },
      pointer: { type: 'tilt', maxAngle: 8 },
      effects: ['glass'],
    },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'V2: Glass Wave',
        props: {
          experienceConfig: {
            version: '2.0.0',
            background: {
              type: 'shader',
              shader: {
                preset: 'fluid-warp',
                colorA: '#06b6d4',
                colorB: '#8b5cf6',
                colorC: '#ec4899',
                speed: 0.8,
                intensity: 1.0,
                distortion: 1.2,
                pointerInfluence: 0.6,
              },
              opacity: 0.9,
            },
            pointer: { type: 'tilt', maxAngle: 8 },
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
            label: 'Content Grid',
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
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'FLUID-WARP SHADER' }, styles: { fontSize: '12px', fontWeight: '800', color: '#22d3ee', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Glass Wave v2' }, styles: { fontSize: '44px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'WebGL fluid-warp shader behind frosted glassmorphism surfaces.' }, styles: { fontSize: '17px', color: '#94a3b8', maxWidth: '600px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Glass Cards',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 1',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'WebGL Shader' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Raw GLSL fragment shaders running on the GPU.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 2',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(34, 211, 238, 0.3)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Pointer Response' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Real-time pointer influence on shader distortion fields.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Card 3',
                    styles: { flex: '1', backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Glass Composition' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Shader engine composing with CSS backdrop-filter effects.' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
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
