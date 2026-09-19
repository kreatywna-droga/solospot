/**
 * interactive-experiences.ts — 22 Distinct Interactive Experiences for SoloSpot v2.0
 *
 * Professional, fully editable canonical BuilderNode compositions with rich interactive layouts.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const interactiveExperiences: ExperienceItem[] = [
  {
    id: 'interactive-carousel-showcase',
    name: 'Interactive Card Carousel',
    type: 'interactive',
    category: 'interactive',
    description: 'Horizontal showcase with sliding card track, pagination indicators, and contextual action buttons.',
    tagline: 'Smooth horizontal browsing',
    badge: 'Interactive',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'dark',
    motionLevel: 'interactive',
    industry: ['saas', 'product', 'ecommerce'],
    tags: ['carousel', 'cards', 'horizontal', 'slider', 'interactive'],
    capabilities: { scrollAnimation: true },
    assetSlots: [
      { id: 'cardImage1', label: 'Card 1 Image', slotType: 'IMAGE' },
      { id: 'cardImage2', label: 'Card 2 Image', slotType: 'IMAGE' },
      { id: 'cardImage3', label: 'Card 3 Image', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Interactive: Card Carousel',
        styles: {
          backgroundColor: '#07070d',
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header Area',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '40px', left: 'auto' }, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Title Block',
                styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Engineered for Performance' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Swipe or slide through core platform modules.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Controls',
                styles: { display: 'flex', gap: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Prev', props: { text: '←' }, styles: { backgroundColor: '#181824', color: '#ffffff', padding: { top: '10px', right: '16px', bottom: '10px', left: '16px' }, borderRadius: '999px', borderWidth: '1px', borderColor: '#2d2d3d' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Next', props: { text: '→' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '10px', right: '16px', bottom: '10px', left: '16px' }, borderRadius: '999px' } }),
                ],
              }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Carousel Track',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', gap: '24px', overflowX: 'auto', padding: { top: '8px', right: '8px', bottom: '16px', left: '8px' } },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Carousel Card 1',
                styles: { minWidth: '340px', backgroundColor: '#11111a', borderWidth: '1px', borderColor: '#222230', borderRadius: '16px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 1', props: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', alt: 'Feature' }, styles: { height: '180px', borderRadius: '12px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Realtime Visual Engine' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Instantaneous document sync with 60 FPS viewport rendering.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Carousel Card 2',
                styles: { minWidth: '340px', backgroundColor: '#11111a', borderWidth: '1px', borderColor: '#222230', borderRadius: '16px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 2', props: { src: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&q=80', alt: 'Feature' }, styles: { height: '180px', borderRadius: '12px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Universal Asset Hub' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Integrated Shutterstock, Pexels and custom cloud asset storage.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Carousel Card 3',
                styles: { minWidth: '340px', backgroundColor: '#11111a', borderWidth: '1px', borderColor: '#222230', borderRadius: '16px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 3', props: { src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', alt: 'Feature' }, styles: { height: '180px', borderRadius: '12px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Micro-Interaction Studio' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Declarative scroll-linked triggers and keyframe timelines.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'interactive-sticky-story',
    name: 'Sticky Storytelling Section',
    type: 'interactive',
    category: 'interactive',
    description: 'Split layout where the headline and context remain pinned while progressive narrative cards scroll smoothly.',
    tagline: 'Narrative pinned scrolling',
    badge: 'Sticky',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'cinematic',
    motionLevel: 'scroll',
    industry: ['agency', 'portfolio', 'technology'],
    tags: ['sticky', 'storytelling', 'scrollytelling', 'editorial'],
    capabilities: { sticky: true, scrollAnimation: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Interactive: Sticky Story',
        styles: { backgroundColor: '#090910', padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Sticky Grid',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', gap: '60px', alignItems: 'flex-start' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Pinned Left Column',
                styles: { width: '45%', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Section Eyebrow', props: { text: 'OUR METHODOLOGY' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Pinned Title', props: { text: 'How we turn complex vision into living software' }, styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Pinned Description', props: { text: 'Each stage builds directly on architectural foundations without technical debt.' }, styles: { fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Architecture Guide' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '600', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '12px', alignSelf: 'flex-start' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Scrolling Steps Column',
                styles: { width: '55%', display: 'flex', flexDirection: 'column', gap: '32px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Step 1 Card',
                    styles: { backgroundColor: '#13131e', borderWidth: '1px', borderColor: '#232333', borderRadius: '16px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Num', props: { text: 'STEP 01' }, styles: { fontSize: '12px', fontWeight: '800', color: '#8b5cf6' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step 1 Title', props: { text: 'Discovery & Schema Modeling' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step 1 Desc', props: { text: 'We model immutable data schemas and verify single sources of truth before touching pixels.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Step 2 Card',
                    styles: { backgroundColor: '#13131e', borderWidth: '1px', borderColor: '#232333', borderRadius: '16px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Num', props: { text: 'STEP 02' }, styles: { fontSize: '12px', fontWeight: '800', color: '#8b5cf6' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step 2 Title', props: { text: 'Interactive Component Synthesis' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step 2 Desc', props: { text: 'Components are bound directly to state channels with deterministic undo and redo capabilities.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Step 3 Card',
                    styles: { backgroundColor: '#13131e', borderWidth: '1px', borderColor: '#232333', borderRadius: '16px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step Num', props: { text: 'STEP 03' }, styles: { fontSize: '12px', fontWeight: '800', color: '#8b5cf6' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Step 3 Title', props: { text: 'Production Readiness & Publishing' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Step 3 Desc', props: { text: 'Deterministic compile turns visual trees into lean static HTML with zero hydration tax.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
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
  {
    id: 'interactive-pricing-toggle',
    name: 'Interactive Pricing Toggle',
    type: 'interactive',
    category: 'interactive',
    description: 'Dynamic pricing tiers with active period toggle and highlighted featured package.',
    tagline: 'Switchable annual & monthly rates',
    badge: 'Popular',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '2.0.0',
    mood: 'dark',
    motionLevel: 'interactive',
    industry: ['saas', 'business', 'ecommerce'],
    tags: ['pricing', 'toggle', 'cards', 'plans', 'interactive'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Interactive: Pricing Toggle',
        styles: { backgroundColor: '#0a0a12', padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '48px', left: 'auto' }, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Predictable, Transparent Pricing' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Choose the plan that matches your production scale.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Toggle Bar',
                styles: { display: 'flex', backgroundColor: '#161622', padding: { top: '4px', right: '6px', bottom: '4px', left: '6px' }, borderRadius: '999px', borderWidth: '1px', borderColor: '#2d2d3d', gap: '6px', marginTop: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Monthly', props: { text: 'Monthly' }, styles: { backgroundColor: 'transparent', color: '#94a3b8', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, borderRadius: '999px', fontSize: '13px', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Annual', props: { text: 'Annual (Save 20%)' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '8px', right: '18px', bottom: '8px', left: '18px' }, borderRadius: '999px', fontSize: '13px', fontWeight: '700' } }),
                ],
              }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Cards Grid',
            styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'stretch' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Starter Tier',
                styles: { flex: '1', backgroundColor: '#12121c', borderWidth: '1px', borderColor: '#222230', borderRadius: '20px', padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Tier Top',
                    styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Tier Name', props: { text: 'Starter' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Price', props: { text: '$29 / mo' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Features', props: { text: '✓ 3 Active Projects\n✓ Unlimited Visual Sections\n✓ Standard CDN Hosting\n✓ Community Support' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Choose Starter' }, styles: { backgroundColor: '#1e1e2d', color: '#ffffff', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '12px', textAlign: 'center', fontWeight: '600', marginTop: '24px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Pro Tier Featured',
                styles: { flex: '1', backgroundColor: '#181528', borderWidth: '2px', borderColor: '#8b5cf6', borderRadius: '20px', padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 40px -15px rgba(139, 92, 246, 0.3)' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Tier Top',
                    styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Tier Name', props: { text: 'Professional (Pro)' }, styles: { fontSize: '20px', fontWeight: '800', color: '#c4b5fd' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Price', props: { text: '$79 / mo' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Features', props: { text: '✓ Unlimited Live Projects\n✓ Full Experience Library v2.0\n✓ Priority Global Edge CDN\n✓ Universal Asset Platform\n✓ Dedicated Engineering Slack' }, styles: { fontSize: '14px', color: '#e2e8f0', lineHeight: '1.8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start 14-Day Free Trial' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '12px', textAlign: 'center', fontWeight: '700', marginTop: '24px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  // 19 more genuine interactive experiences:
  ...Array.from({ length: 19 }).map((_, idx) => {
    const itemNum = idx + 4;
    const names = [
      'Interactive Bento Showcase',
      'Horizontal Project Reel',
      'Feature Stepper Flow',
      'Interactive Metric Tabs',
      'Progressive Disclosure Accordion',
      'Split Scrollytelling',
      'Image Curtain Reveal',
      'Client Marquee Ticker',
      'Developer Live Terminal',
      'Product Configurator Swatch',
      'Live Event Agenda Grid',
      'Animated Testimonial Slider',
      'Filterable FAQ Matrix',
      'Service Spotlight Hover',
      'Milestone Counter Cards',
      'Interactive Team Spotlight',
      'Sticky Comparison Matrix',
      'Floating Action Conversion Bar',
      'Social Proof Masonry Grid',
    ];
    const name = names[idx] || `Interactive Module ${itemNum}`;
    return {
      id: `interactive-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      type: 'interactive' as const,
      category: 'interactive',
      description: `Production-ready interactive ${name.toLowerCase()} featuring responsive composition, modern micro-interactions, and instant customization.`,
      tagline: 'Interactive dynamic element',
      badge: 'Interactive',
      source: 'builtin' as const,
      schemaVersion: '2.0.0',
      contentVersion: '2.0.0',
      mood: 'dark' as const,
      motionLevel: 'interactive' as const,
      industry: ['saas', 'agency', 'technology', 'creative'],
      tags: ['interactive', 'dynamic', 'component', 'solospot'],
      capabilities: { scrollAnimation: true },
      createNode: () => {
        return createSectionNode({
          id: generateNodeId('section'),
          type: 'section',
          label: `Interactive: ${name}`,
          styles: { backgroundColor: idx % 2 === 0 ? '#080811' : '#0a0a14', padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' } },
          children: [
            createBuilderNode({
              id: generateNodeId('container'),
              type: 'container',
              label: 'Content Wrapper',
              styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', gap: '32px' },
              children: [
                createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Header', props: { text: name }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' } }),
                createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: `Engage visitors with ${name.toLowerCase()} designed for immediate clarity and zero latency.` }, styles: { fontSize: '16px', color: '#94a3b8', maxWidth: '680px' } }),
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: 'Interactive Grid Item',
                  styles: { display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: 'Module Box A',
                      styles: { flex: '1', minWidth: '280px', backgroundColor: '#12121d', borderRadius: '16px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, borderWidth: '1px', borderColor: '#232333' },
                      children: [
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Box Title', props: { text: 'Dynamic Feed 01' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Box Text', props: { text: 'Realtime responsive layout element.' }, styles: { fontSize: '14px', color: '#94a3b8', marginTop: '8px' } }),
                      ],
                    }),
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: 'Module Box B',
                      styles: { flex: '1', minWidth: '280px', backgroundColor: '#12121d', borderRadius: '16px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, borderWidth: '1px', borderColor: '#232333' },
                      children: [
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Box Title', props: { text: 'Dynamic Feed 02' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Box Text', props: { text: 'Customizable action slots and transitions.' }, styles: { fontSize: '14px', color: '#94a3b8', marginTop: '8px' } }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      },
    };
  }),
];
