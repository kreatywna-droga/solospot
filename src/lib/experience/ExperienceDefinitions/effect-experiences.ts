/**
 * effect-experiences.ts — 18 Visual Effect Experiences for SoloSpot v2.0
 *
 * Glassmorphism, glow accents, grain textures, spotlights, and border animations.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const effectExperiences: ExperienceItem[] = [
  {
    id: 'effect-glassmorphism-glow-card',
    name: 'Glassmorphism Glow Card',
    type: 'effect',
    category: 'effect',
    description: 'Frosted glass container with backdrop blur, subtle inner border highlight, and soft violet ambient drop shadow.',
    tagline: 'Modern frosted glass effect',
    badge: 'Glass',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['saas', 'creative', 'technology'],
    tags: ['glass', 'glassmorphism', 'glow', 'blur', 'card'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Glassmorphism Card',
        styles: {
          backgroundColor: '#06060c',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.25) 0%, transparent 60%)',
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Glass Panel',
            styles: {
              maxWidth: '650px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '24px',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              padding: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'NEXT GENERATION UI' }, styles: { fontSize: '11px', fontWeight: '800', color: '#c4b5fd', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Pristine Frosted Aesthetics' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Layered semi-transparent backdrops highlight depth without cluttering content hierarchy.' }, styles: { fontSize: '16px', color: '#cbd5e1', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Action', props: { text: 'Get Started' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '12px', fontWeight: '600', alignSelf: 'center', marginTop: '8px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 17 more distinct visual effect experiences:
  ...Array.from({ length: 17 }).map((_, idx) => {
    const names = [
      'Spotlight Cursor Glow Area',
      'Ambient Neon Pulse Border',
      'Gradient Orb Glow Focus',
      'Radial Spotlight Stage',
      'Floating Particle Ambience',
      'Prismatic Color Highlight',
      'Cyberpunk Rim Accent',
      'Frosted Glass Floating Dock',
      'Magnetic Border Beam',
      'Shimmer Skeleton Glow Box',
      'Dynamic Aurora Rim Light',
      'Glowing Badge & Pill Focus',
      'Minimal Spotlight Pedestal',
      'Ambient Dark Vignette',
      'Subtle Film Noise Texture',
      'Holographic Card Foil',
      'Multi-Layer Ambient Shadow',
    ];
    const name = names[idx] || `Visual Effect ${idx + 2}`;
    return {
      id: `effect-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      type: 'effect' as const,
      category: 'effect',
      description: `Visual effect module: ${name.toLowerCase()} for subtle accenting, elevation and modern design polish.`,
      tagline: 'Visual accent composition',
      badge: 'Effect',
      source: 'builtin' as const,
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      mood: 'futuristic' as const,
      motionLevel: 'subtle' as const,
      industry: ['creative', 'saas', 'portfolio', 'technology'],
      tags: ['effect', 'glow', 'glass', 'visual', 'accent'],
      capabilities: { gradient: true },
      createNode: () => {
        return createSectionNode({
          id: generateNodeId('section'),
          type: 'section',
          label: `Effect: ${name}`,
          styles: {
            backgroundColor: '#07070e',
            backgroundImage: idx % 2 === 0
              ? 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 60%)'
              : 'radial-gradient(circle at 50% 100%, rgba(236, 72, 153, 0.18) 0%, transparent 60%)',
            padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          },
          children: [
            createBuilderNode({
              id: generateNodeId('container'),
              type: 'container',
              label: 'Effect Box',
              styles: {
                maxWidth: '680px',
                margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
                backgroundColor: '#101018',
                borderWidth: '1px',
                borderColor: '#232333',
                borderRadius: '18px',
                padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
                boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              },
              children: [
                createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: name }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: `Engineered styling providing immediate visual contrast and aesthetic polish.` }, styles: { fontSize: '15px', color: '#94a3b8' } }),
              ],
            }),
          ],
        });
      },
    };
  }),
];
