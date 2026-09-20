/**
 * hero-expanded-experiences.ts — 14 High-Impact, Hand-Crafted Hero Experiences for SoloSpot v3.0
 *
 * Cinematic, split, product, typography-led, video, and reveal hero sections.
 * Zero duplicate loop generators — every experience is distinctly composed.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const expandedHeroExperiences: ExperienceItem[] = [
  // 1. Cinematic Split Video Hero
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
    contentVersion: '3.0.0',
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

  // 2. Editorial Typography Hero
  {
    id: 'hero-editorial-typography',
    name: 'Hero Editorial Typography',
    type: 'hero',
    category: 'hero',
    description: 'High-fashion editorial layout with oversized typography, sharp margins, and refined minimalist contrast.',
    tagline: 'Refined editorial typography master',
    badge: 'Editorial',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'editorial',
    motionLevel: 'subtle',
    industry: ['creative', 'agency', 'luxury', 'portfolio'],
    tags: ['hero', 'editorial', 'typography', 'minimal'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Editorial Typography',
        styles: { backgroundColor: '#09090b', padding: { top: '110px', right: '32px', bottom: '110px', left: '32px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Editorial Frame',
            styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', gap: '28px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Issue Number', props: { text: 'VOLUME 24 // ISSUE 03' }, styles: { fontSize: '11px', fontWeight: '800', color: '#a1a1aa', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Massive Title', props: { text: 'The Poetry of Functional Space' }, styles: { fontSize: '64px', fontWeight: '900', color: '#ffffff', lineHeight: '1.05', letterSpacing: '-2px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Lead Paragraph', props: { text: 'Exploring the subtle threshold where digital interaction becomes as tangible and evocative as physical architecture.' }, styles: { fontSize: '20px', color: '#71717a', maxWidth: '640px', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Read Manifesto', props: { text: 'Read the Manifesto →' }, styles: { backgroundColor: '#ffffff', color: '#000000', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '999px', fontWeight: '700', width: 'fit-content' } }),
            ],
          }),
        ],
      });
    },
  },

  // 3. Luxury Floating Product Hero
  {
    id: 'hero-luxury-floating-product',
    name: 'Hero Luxury Floating Product',
    type: 'hero',
    category: 'hero',
    description: 'Dark obsidian background with center-stage floating luxury product, gold accent lighting, and technical specifications.',
    tagline: 'High-end product centerpiece hero',
    badge: 'Luxury',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'subtle',
    industry: ['luxury', 'ecommerce', 'product'],
    tags: ['hero', 'luxury', 'product', 'gold', 'floating'],
    assetSlots: [
      { id: 'productAsset', label: 'Luxury Item Image', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Luxury Floating Product',
        styles: { backgroundColor: '#07070a', padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Product Stage',
            styles: { maxWidth: '850px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Tag', props: { text: 'BESPOKE TIMEPIECE' }, styles: { fontSize: '11px', fontWeight: '800', color: '#f59e0b', letterSpacing: '2.5px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Chronos Obsidian Reserve' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Product Image', props: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Luxury Watch' }, styles: { width: '380px', height: '280px', objectFit: 'contain', transform: 'scale(1.05)' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Price', props: { text: '$2,800 USD • Limited to 200 Pieces' }, styles: { fontSize: '16px', color: '#fbbf24', fontWeight: '700' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Order', props: { text: 'Acquire Reserve Allocation' }, styles: { backgroundColor: '#d97706', color: '#000000', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '800' } }),
            ],
          }),
        ],
      });
    },
  },

  // 4. Cyber Glow Terminal Hero
  {
    id: 'hero-cyber-glow-terminal',
    name: 'Hero Cyber Glow Terminal',
    type: 'hero',
    category: 'hero',
    description: 'Futuristic developer-first hero with terminal window, neon green highlights, and instant CLI command copy.',
    tagline: 'Developer terminal command hero',
    badge: 'Developer',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['technology', 'saas'],
    tags: ['hero', 'terminal', 'developer', 'cli', 'code'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Cyber Glow Terminal',
        styles: { backgroundColor: '#05070a', padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Terminal Hero Grid',
            styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', textAlign: 'center' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Engineered for Developers Who Ship' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Instant programmatic store provisioning with TypeScript SDK and global edge cache.' }, styles: { fontSize: '17px', color: '#94a3b8', maxWidth: '680px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Code Terminal Box',
                styles: { width: '100%', maxWidth: '640px', backgroundColor: '#090d14', borderWidth: '1px', borderColor: '#1e293b', borderRadius: '16px', padding: { top: '20px', right: '24px', bottom: '20px', left: '24px' }, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Line 1', props: { text: '$ npx solospot@latest init my-store --template=flagship' }, styles: { fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Line 2', props: { text: '✔ Created canonical BuilderDocument v3.0 [24ms]' }, styles: { fontSize: '13px', color: '#4ade80', fontFamily: 'monospace' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Line 3', props: { text: '✔ Deployed edge preview at https://my-store.solospot.app' }, styles: { fontSize: '13px', color: '#cbd5e1', fontFamily: 'monospace' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 5. Minimalist Studio Canvas
  {
    id: 'hero-minimalist-studio-canvas',
    name: 'Hero Minimalist Studio Canvas',
    type: 'hero',
    category: 'hero',
    description: 'Clean architectural canvas focusing entirely on precision typography, generous whitespace, and pure content clarity.',
    tagline: 'Quiet architectural studio hero',
    badge: 'Minimal',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'static',
    industry: ['creative', 'agency', 'portfolio'],
    tags: ['hero', 'minimal', 'studio', 'clean', 'whitespace'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Minimalist Studio Canvas',
        styles: { backgroundColor: '#0a0a0c', padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Column',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Studio Title', props: { text: 'We design systems that endure beyond trends.' }, styles: { fontSize: '52px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1.8px', lineHeight: '1.15' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Studio Subhead', props: { text: 'SoloSpot Studio crafts custom digital brand flagships with singular technical focus and disciplined aesthetic simplicity.' }, styles: { fontSize: '18px', color: '#a1a1aa', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Inquire CTA', props: { text: 'Start a Project Conversation' }, styles: { backgroundColor: 'transparent', color: '#ffffff', padding: { top: '12px', right: '24px', bottom: '12px', left: '0' }, borderWidth: '0 0 1px 0', borderColor: '#ffffff', fontWeight: '700', width: 'fit-content' } }),
            ],
          }),
        ],
      });
    },
  },

  // 6. Bento Metric Stage Hero
  {
    id: 'hero-bento-metric-stage',
    name: 'Hero Bento Metric Stage',
    type: 'hero',
    category: 'hero',
    description: 'Combines hero headline with a compact 3-tile metric bento row directly in the hero viewport.',
    tagline: 'Metric-driven conversion hero',
    badge: 'SaaS',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['saas', 'finance', 'technology'],
    tags: ['hero', 'metrics', 'bento', 'saas', 'stats'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Bento Metric Stage',
        styles: { backgroundColor: '#090912', padding: { top: '90px', right: '28px', bottom: '90px', left: '28px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Hero Stack',
            styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '36px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'The Visual Standard for Modern SaaS' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bento Metric Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '20px', width: '100%', justifyContent: 'center' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Metric 1',
                    styles: { width: '33%', backgroundColor: '#131320', borderRadius: '16px', padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' }, borderWidth: '1px', borderColor: '#222234' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Val 1', props: { text: '10x' }, styles: { fontSize: '36px', fontWeight: '900', color: '#a855f7' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label 1', props: { text: 'Faster deployment cycle' }, styles: { fontSize: '13px', color: '#94a3b8', marginTop: '6px' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Metric 2',
                    styles: { width: '33%', backgroundColor: '#131320', borderRadius: '16px', padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' }, borderWidth: '1px', borderColor: '#222234' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Val 2', props: { text: '99.9%' }, styles: { fontSize: '36px', fontWeight: '900', color: '#38bdf8' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label 2', props: { text: 'Uptime SLA guarantee' }, styles: { fontSize: '13px', color: '#94a3b8', marginTop: '6px' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Metric 3',
                    styles: { width: '33%', backgroundColor: '#131320', borderRadius: '16px', padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' }, borderWidth: '1px', borderColor: '#222234' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Val 3', props: { text: '0ms' }, styles: { fontSize: '36px', fontWeight: '900', color: '#4ade80' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label 3', props: { text: 'Cold start latency' }, styles: { fontSize: '13px', color: '#94a3b8', marginTop: '6px' } }),
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

  // 7. 3D Depth Mockup Hero
  {
    id: 'hero-3d-depth-mockup',
    name: 'Hero 3D Depth Mockup',
    type: 'hero',
    category: 'hero',
    description: 'Angled perspective mockup showcasing software application interface with calibrated drop shadows.',
    tagline: 'Angled software mockup hero',
    badge: '3D Mockup',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['saas', 'product', 'technology'],
    tags: ['hero', '3d', 'mockup', 'software', 'perspective'],
    capabilities: { perspective3d: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: 3D Depth Mockup',
        styles: { backgroundColor: '#06060c', padding: { top: '100px', right: '28px', bottom: '100px', left: '28px' }, perspective: '1200px' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Stage Frame',
            styles: { maxWidth: '1100px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', textAlign: 'center' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Visual Command Center' }, styles: { fontSize: '46px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Mockup Window Frame',
                styles: { width: '100%', maxWidth: '880px', backgroundColor: '#131320', borderRadius: '20px', borderWidth: '1px', borderColor: '#2b2b3e', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.9), 0 0 30px -5px rgba(124,58,237,0.3)', transform: 'rotateX(8deg) scale(0.98)', overflow: 'hidden' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Mockup Screen', props: { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80', alt: 'Software Screen' }, styles: { width: '100%', height: '360px', objectFit: 'cover' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 8. Infinite Marquee Header
  {
    id: 'hero-infinite-marquee-header',
    name: 'Hero Infinite Marquee Header',
    type: 'hero',
    category: 'hero',
    description: 'Oversized bold headline anchored by a horizontal scrolling trust ticker showcasing prestigious brands.',
    tagline: 'Brand marquee trust hero',
    badge: 'Brand Trust',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'animated',
    industry: ['agency', 'saas', 'enterprise'],
    tags: ['hero', 'marquee', 'brand', 'logos', 'social-proof'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Infinite Marquee Header',
        styles: { backgroundColor: '#080812', padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Hero Stack',
            styles: { maxWidth: '900px', margin: { top: '0', right: 'auto', bottom: '40px', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Main Headline', props: { text: 'Trusted by Leaders in Modern Web Tech' }, styles: { fontSize: '46px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Over 5,000 teams use SoloSpot to architect, preview, and deploy mission-critical sites.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Logo Ticker Row',
            styles: { maxWidth: '1000px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#10101c', borderRadius: '16px', padding: { top: '20px', right: '24px', bottom: '20px', left: '24px' }, borderWidth: '1px', borderColor: '#202030' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Partner 1', props: { text: 'VERTEX' }, styles: { fontSize: '18px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Partner 2', props: { text: 'STRATA' }, styles: { fontSize: '18px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Partner 3', props: { text: 'NEXUS' }, styles: { fontSize: '18px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Partner 4', props: { text: 'AURA' }, styles: { fontSize: '18px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '2px' } }),
            ],
          }),
        ],
      });
    },
  },

  // 9. Radial Spotlight Stage
  {
    id: 'hero-radial-spotlight-stage',
    name: 'Hero Radial Spotlight Stage',
    type: 'hero',
    category: 'hero',
    description: 'High-contrast center spotlight lighting effect focusing user attention directly on key message.',
    tagline: 'Radial spotlight focus hero',
    badge: 'Spotlight',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['creative', 'product', 'saas'],
    tags: ['hero', 'spotlight', 'radial', 'lighting'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Radial Spotlight Stage',
        styles: {
          backgroundColor: '#050508',
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
          padding: { top: '110px', right: '32px', bottom: '110px', left: '32px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Focus Box',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Illuminate Your Digital Horizon' }, styles: { fontSize: '50px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Dynamic light fields create unforgettable visual impact without degrading performance.' }, styles: { fontSize: '18px', color: '#cbd5e1' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Illuminating' }, styles: { backgroundColor: '#a855f7', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700' } }),
            ],
          }),
        ],
      });
    },
  },

  // 10. Mobile App Showcase Hero
  {
    id: 'hero-mobile-app-showcase',
    name: 'Hero Mobile App Showcase',
    type: 'hero',
    category: 'hero',
    description: 'Dual mobile phone frame previews with App Store and Google Play conversion badges.',
    tagline: 'Dual mobile app preview hero',
    badge: 'Mobile App',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['saas', 'product', 'ecommerce'],
    tags: ['hero', 'mobile', 'app', 'ios', 'android'],
    assetSlots: [
      { id: 'mobileScreen1', label: 'App Screen 1', slotType: 'IMAGE' },
      { id: 'mobileScreen2', label: 'App Screen 2', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Mobile App Showcase',
        styles: { backgroundColor: '#070710', padding: { top: '90px', right: '28px', bottom: '90px', left: '28px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Split Frame',
            styles: { maxWidth: '1160px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '48px' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Content',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Your Entire Workflow in Your Pocket' }, styles: { fontSize: '44px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Realtime notifications, offline document drafting, and biometric auth.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Store Badges',
                    styles: { display: 'flex', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'iOS', props: { text: ' App Store' }, styles: { backgroundColor: '#181826', color: '#ffffff', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '10px', borderWidth: '1px', borderColor: '#2e2e42' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Android', props: { text: '▶ Google Play' }, styles: { backgroundColor: '#181826', color: '#ffffff', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '10px', borderWidth: '1px', borderColor: '#2e2e42' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Phone Mockup',
                styles: { width: '45%', display: 'flex', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Mobile Mockup', props: { src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80', alt: 'App on Phone' }, styles: { width: '280px', height: '420px', objectFit: 'cover', borderRadius: '32px', borderWidth: '4px', borderColor: '#262638' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 11. Dynamic Lead Form Hero
  {
    id: 'hero-dynamic-lead-form',
    name: 'Hero Dynamic Lead Form',
    type: 'hero',
    category: 'hero',
    description: 'High-converting SaaS onboarding hero with an embedded email input field and instant access trigger.',
    tagline: 'Embedded conversion input hero',
    badge: 'Conversion',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['saas', 'services', 'education'],
    tags: ['hero', 'lead', 'form', 'email', 'conversion'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Dynamic Lead Form',
        styles: { backgroundColor: '#070710', padding: { top: '100px', right: '28px', bottom: '100px', left: '28px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Form Stack',
            styles: { maxWidth: '780px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Start Building Experiences in 60 Seconds' }, styles: { fontSize: '46px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'No credit card required. Free sandbox tenant ready immediately upon signup.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Form Input Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '10px', width: '100%', maxWidth: '480px', backgroundColor: '#131320', padding: { top: '6px', right: '6px', bottom: '6px', left: '16px' }, borderRadius: '14px', borderWidth: '1px', borderColor: '#262638' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email Placeholder', props: { text: 'name@company.com' }, styles: { color: '#64748b', fontSize: '14px', alignSelf: 'center', flex: '1' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Submit CTA', props: { text: 'Get Started' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '10px', fontWeight: '700' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 12. Asymmetrical Creator Studio
  {
    id: 'hero-asymmetrical-creator-studio',
    name: 'Hero Asymmetrical Creator Studio',
    type: 'hero',
    category: 'hero',
    description: 'Dynamic offset grid designed for creators, agencies, and modern design collectives.',
    tagline: 'Asymmetric creative studio showcase',
    badge: 'Creator',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'creative',
    motionLevel: 'subtle',
    industry: ['creative', 'agency', 'portfolio'],
    tags: ['hero', 'asymmetric', 'creator', 'studio', 'portfolio'],
    assetSlots: [
      { id: 'creatorImage', label: 'Creator Showcase Image', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Asymmetrical Creator Studio',
        styles: { backgroundColor: '#0a0a10', padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Asymmetric Split',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '56px' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Text Area',
                styles: { width: '55%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'We Build Unapologetically Bold Brands' }, styles: { fontSize: '50px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px', lineHeight: '1.1' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Merging identity, motion, and web engineering to create digital flagships that command industry respect.' }, styles: { fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'View Selected Works' }, styles: { backgroundColor: '#ffffff', color: '#000000', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '800', width: 'fit-content' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Media Tile',
                styles: { width: '45%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Hero Image', props: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', alt: 'Creative Visual' }, styles: { width: '100%', height: '360px', objectFit: 'cover' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 13. High-Tech SaaS Reveal
  {
    id: 'hero-high-tech-saas-reveal',
    name: 'Hero High-Tech SaaS Reveal',
    type: 'hero',
    category: 'hero',
    description: 'Futuristic enterprise SaaS launchpad with live security pills, performance telemetry, and instant trial entry.',
    tagline: 'Enterprise SaaS launchpad hero',
    badge: 'Enterprise',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['saas', 'technology', 'enterprise'],
    tags: ['hero', 'saas', 'enterprise', 'security', 'tech'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: High-Tech SaaS Reveal',
        styles: { backgroundColor: '#06060c', padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Reveal Column',
            styles: { maxWidth: '860px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: '⚡️ ENTERPRISE ENGINE READY' }, styles: { fontSize: '11px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1.5px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Total Observability for Modern Web Architecture' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Unified telemetry, cryptographic tenant isolation, and instant zero-downtime rollbacks.' }, styles: { fontSize: '18px', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Request Enterprise Access' }, styles: { backgroundColor: '#0284c7', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700' } }),
            ],
          }),
        ],
      });
    },
  },

  // 14. Clean Light E-Commerce
  {
    id: 'hero-clean-light-e-commerce',
    name: 'Hero Clean Light E-Commerce',
    type: 'hero',
    category: 'hero',
    description: 'Crisp editorial e-commerce hero with light background, product carousel card, and promotional badge.',
    tagline: 'Clean light e-commerce collection hero',
    badge: 'Storefront',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'light',
    motionLevel: 'subtle',
    industry: ['ecommerce', 'product'],
    tags: ['hero', 'ecommerce', 'light', 'storefront', 'fashion'],
    assetSlots: [
      { id: 'collectionImg', label: 'Collection Image', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Hero: Clean Light E-Commerce',
        styles: { backgroundColor: '#f8fafc', padding: { top: '90px', right: '32px', bottom: '90px', left: '32px' } },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'E-Commerce Split',
            styles: { maxWidth: '1160px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '48px' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Storefront Copy',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'AUTUMN / WINTER 2026' }, styles: { fontSize: '12px', fontWeight: '800', color: '#7c3aed', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Refined Essentials for Modern Living' }, styles: { fontSize: '46px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px', lineHeight: '1.15' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Crafted from sustainable organic materials designed to endure seasons.' }, styles: { fontSize: '17px', color: '#475569' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Shop CTA', props: { text: 'Shop the Collection' }, styles: { backgroundColor: '#0f172a', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', width: 'fit-content' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Product Image',
                styles: { width: '45%', borderRadius: '24px', overflow: 'hidden' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Collection Visual', props: { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', alt: 'Apparel Collection' }, styles: { width: '100%', height: '380px', objectFit: 'cover', borderRadius: '24px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
