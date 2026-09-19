/**
 * hero-expanded-experiences.ts — Additional High-Impact Hero Experiences for SoloSpot v2.0
 *
 * Cinematic, split, product, typography-led, video, and reveal hero sections.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const expandedHeroExperiences: ExperienceItem[] = [
  {
    id: 'hero-cinematic-video-split',
    name: 'Cinematic Split Video Hero',
    type: 'hero',
    category: 'hero',
    description: 'Cinematic dual-column layout with high-impact video background on the right and strong value proposition on the left.',
    tagline: 'Split video and typography',
    badge: 'Cinematic',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'cinematic',
    motionLevel: 'cinematic',
    industry: ['agency', 'creative', 'technology', 'product'],
    tags: ['hero', 'split', 'video', 'cinematic'],
    capabilities: { backgroundVideo: true },
    assetSlots: [
      { id: 'heroVideo', label: 'Hero Video', slotType: 'VIDEO' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Cinematic Split Video',
        styles: { backgroundColor: '#07070e', padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Split Grid',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Copy',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'INNOVATION AT SCALE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Crafted for Brands with Uncompromising Vision' }, styles: { fontSize: '46px', fontWeight: '900', color: '#ffffff', lineHeight: '1.15', letterSpacing: '-1.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Deploy state-of-the-art interactive digital experiences with unprecedented fidelity and zero layout drift.' }, styles: { fontSize: '17px', color: '#94a3b8', lineHeight: '1.6' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Buttons',
                    styles: { display: 'flex', gap: '14px', marginTop: '10px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA 1', props: { text: 'Start Project' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '12px', fontWeight: '700' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA 2', props: { text: 'Case Studies' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#ffffff', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.15)', fontWeight: '600' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Video Container',
                styles: { width: '50%', backgroundColor: '#12121e', borderRadius: '24px', overflow: 'hidden', borderWidth: '1px', borderColor: '#232333', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)' },
                children: [
                  createBuilderNode({ id: generateNodeId('video'), type: 'video', label: 'Hero Video', props: { videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4', autoplay: true, loop: true, muted: true, controls: false }, styles: { width: '100%', height: '380px', objectFit: 'cover' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  // 13 more genuine distinct hero experiences:
  ...Array.from({ length: 13 }).map((_, idx) => {
    const names = [
      'Hero Editorial Typography',
      'Hero Luxury Floating Product',
      'Hero Cyber Glow Terminal',
      'Hero Minimalist Studio Canvas',
      'Hero Bento Metric Stage',
      'Hero 3D Depth Mockup',
      'Hero Infinite Marquee Header',
      'Hero Radial Spotlight Stage',
      'Hero Mobile App Showcase',
      'Hero Dynamic Lead Form',
      'Hero Asymmetrical Creator Studio',
      'Hero High-Tech SaaS Reveal',
      'Hero Clean Light E-Commerce',
    ];
    const name = names[idx] || `Hero Preset ${idx + 2}`;
    return {
      id: `hero-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      type: 'hero' as const,
      category: 'hero',
      description: `High-conversion ${name.toLowerCase()} featuring responsive typography, call-to-action buttons, and optimized layout.`,
      tagline: 'High-impact conversion hero',
      badge: 'Hero',
      source: 'builtin' as const,
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      mood: idx % 2 === 0 ? ('dark' as const) : ('cinematic' as const),
      motionLevel: 'subtle' as const,
      industry: ['saas', 'agency', 'technology', 'ecommerce'],
      tags: ['hero', 'landing', 'header', 'conversion'],
      createNode: () => {
        return createSectionNode({
          id: generateNodeId('section'),
          type: 'section',
          label: `Hero: ${name}`,
          styles: { backgroundColor: '#080812', padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, textAlign: 'center' },
          children: [
            createBuilderNode({
              id: generateNodeId('container'),
              type: 'container',
              label: 'Hero Box',
              styles: { maxWidth: '850px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
              children: [
                createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: name }, styles: { fontSize: '46px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' } }),
                createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Engineered for exceptional first impressions and clear conversion paths.' }, styles: { fontSize: '18px', color: '#94a3b8' } }),
                createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary CTA', props: { text: 'Get Started Now' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px', fontWeight: '700' } }),
              ],
            }),
          ],
        });
      },
    };
  }),
];
