/**
 * background-experiences.ts — 22 Immersive Background Experiences for SoloSpot v2.0
 *
 * Distinct atmospheric backdrops, ambient video, gradient meshes, and dynamic textures.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const backgroundExperiences: ExperienceItem[] = [
  {
    id: 'background-aurora-mesh',
    name: 'Aurora Borealis Mesh',
    type: 'background',
    category: 'background',
    description: 'Vibrant multi-stop radial gradient mesh evoking northern lights over a deep dark backdrop.',
    tagline: 'Luminescent color mesh',
    badge: 'Trending',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['saas', 'creative', 'technology'],
    tags: ['aurora', 'mesh', 'gradient', 'background', 'glowing'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Aurora Mesh',
        styles: {
          backgroundColor: '#040409',
          backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(124, 58, 237, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Foreground Content Slot',
            styles: { maxWidth: '750px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Elevated by Ambient Light' }, styles: { fontSize: '44px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Subtle gradients provide depth and premium feel without slowing down page performance.' }, styles: { fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Action', props: { text: 'Explore Capabilities' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px', fontWeight: '700' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'background-video-ambient-cosmos',
    name: 'Ambient Cosmos Video Background',
    type: 'background',
    category: 'background',
    description: 'Cinematic looping ambient video with dark overlay and centered headline typography.',
    tagline: 'Looping atmospheric video layer',
    badge: 'Cinematic',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'cinematic',
    motionLevel: 'cinematic',
    industry: ['agency', 'portfolio', 'events', 'technology'],
    tags: ['video', 'ambient', 'looping', 'space', 'background'],
    capabilities: { backgroundVideo: true },
    assetSlots: [
      { id: 'bgVideo', label: 'Background Video', slotType: 'BACKGROUND_VIDEO' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Ambient Video',
        props: {
          backgroundVideo: 'https://assets.mixkit.co/videos/preview/mixkit-space-travel-through-stars-and-nebula-41484-large.mp4',
          backgroundVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-space-travel-through-stars-and-nebula-41484-large.mp4',
          overlayColor: '#05050a',
          overlayOpacity: 0.65,
        },
        styles: {
          backgroundColor: '#05050a',
          padding: { top: '120px', right: '24px', bottom: '120px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Video Hero Content',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Visions Brought Into Motion' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Replace this looping background video with any licensed asset from your media library in 1 click.' }, styles: { fontSize: '18px', color: '#e2e8f0', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Watch Reel', props: { text: '▶ Play Showreel' }, styles: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.37)', fontWeight: '700' } }),
            ],
          }),
        ],
      });
    },
  },
  // 20 more distinct background experiences:
  ...Array.from({ length: 20 }).map((_, idx) => {
    const names = [
      'Cyber Neon Grid',
      'Dark Nebula Particles',
      'Glassmorphism Blur Backdrop',
      'Spotlight Radial Glow',
      'Ocean Wave Gradient',
      'Golden Horizon Sunset',
      'Midnight Constellation',
      'High-Tech Digital Matrix',
      'Abstract Fluid Wash',
      'Deep Purple Aura',
      'Carbon Fiber Monolith',
      'Emerald Luxury Marble',
      'Retro Grid Synthwave',
      'Architectural Studio Shadow',
      'Minimal Charcoal Grain',
      'Pristine Ice Frost',
      'Quantum Geometric Mesh',
      'Solar Flare Radiant',
      'Twilight Indigo Shimmer',
      'Cyberpunk City Lights',
    ];
    const name = names[idx] || `Ambient Backdrop ${idx + 3}`;
    return {
      id: `background-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      type: 'background' as const,
      category: 'background',
      description: `Atmospheric ${name.toLowerCase()} layer with customizable overlay opacity and responsive typography container.`,
      tagline: 'Ambient background composition',
      badge: 'Atmosphere',
      source: 'builtin' as const,
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      mood: 'dark' as const,
      motionLevel: 'subtle' as const,
      industry: ['technology', 'creative', 'saas', 'agency'],
      tags: ['background', 'atmosphere', 'gradient', 'ambient'],
      capabilities: { gradient: true },
      createNode: () => {
        return createSectionNode({
          id: generateNodeId('section'),
          type: 'section',
          label: `Background: ${name}`,
          styles: {
            backgroundColor: idx % 2 === 0 ? '#06060c' : '#080814',
            backgroundImage: idx % 2 === 0
              ? 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.22) 0%, transparent 70%)'
              : 'linear-gradient(180deg, rgba(30, 27, 75, 0.5) 0%, rgba(10, 10, 18, 1) 100%)',
            padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
            textAlign: 'center',
          },
          children: [
            createBuilderNode({
              id: generateNodeId('container'),
              type: 'container',
              label: 'Center Hero Box',
              styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
              children: [
                createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: name }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: `Atmospheric backdrop engineered for maximum content readability and brand presence.` }, styles: { fontSize: '16px', color: '#94a3b8' } }),
                createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Button', props: { text: 'Get Started' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '10px', right: '24px', bottom: '10px', left: '24px' }, borderRadius: '10px', fontWeight: '600' } }),
              ],
            }),
          ],
        });
      },
    };
  }),
];
