/**
 * effect-experiences.ts — 18 Distinct Visual Effect Experiences for SoloSpot v3.0
 *
 * Glassmorphism, glow accents, grain textures, spotlights, and border animations.
 * Zero duplicate loop generators — every experience is distinctly composed.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const effectExperiences: ExperienceItem[] = [
  // 1. Glassmorphism Glow Card
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
    contentVersion: '3.0.0',
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
              backdropFilter: 'blur(20px)',
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

  // 2. Spotlight Cursor Glow Area
  {
    id: 'effect-spotlight-cursor-glow-area',
    name: 'Spotlight Cursor Glow Area',
    type: 'effect',
    category: 'effect',
    description: 'Dynamic illumination zone focusing high-intensity light on interactive core assets.',
    tagline: 'Illuminated focal zone',
    badge: 'Spotlight',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['creative', 'product', 'saas'],
    tags: ['spotlight', 'glow', 'illumination', 'lighting'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Spotlight Area',
        styles: {
          backgroundColor: '#040407',
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.28) 0%, transparent 60%)',
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Illuminated Frame',
            styles: { maxWidth: '700px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Targeted Visual Luminosity' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Subtle light gradients gently guide the user eye to prime interactions.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 3. Ambient Neon Pulse Border
  {
    id: 'effect-ambient-neon-pulse-border',
    name: 'Ambient Neon Pulse Border',
    type: 'effect',
    category: 'effect',
    description: 'Card with electric neon magenta perimeter and high-contrast ambient drop shadow.',
    tagline: 'Electric neon glowing border',
    badge: 'Neon',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['technology', 'gaming', 'creative'],
    tags: ['neon', 'border', 'pulse', 'glow'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Neon Border',
        styles: { backgroundColor: '#06060c', padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Neon Card',
            styles: {
              maxWidth: '640px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: '#0c0c16',
              borderWidth: '2px',
              borderColor: '#ec4899',
              borderRadius: '20px',
              padding: { top: '36px', right: '36px', bottom: '36px', left: '36px' },
              boxShadow: '0 0 35px -5px rgba(236, 72, 153, 0.4), inset 0 0 15px -5px rgba(236, 72, 153, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'High-Impact Perimeter Glow' }, styles: { fontSize: '30px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Perimeter luminescence draws immediate focus to flagship conversion targets.' }, styles: { fontSize: '15px', color: '#fbcfe8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 4. Gradient Orb Glow Focus
  {
    id: 'effect-gradient-orb-glow-focus',
    name: 'Gradient Orb Glow Focus',
    type: 'effect',
    category: 'effect',
    description: 'Multi-color radial orb blurred behind a central feature badge.',
    tagline: 'Multi-color blurred orb focus',
    badge: 'Orb',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'subtle',
    industry: ['creative', 'saas'],
    tags: ['orb', 'gradient', 'blur', 'focus'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Orb Focus',
        styles: {
          backgroundColor: '#05050a',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.25) 0%, rgba(124, 58, 237, 0.2) 40%, transparent 70%)',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Orb Content',
            styles: { maxWidth: '680px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Chromatic Halo Focus' }, styles: { fontSize: '36px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Soft diffused background orbs deliver warmth without taking away from text clarity.' }, styles: { fontSize: '16px', color: '#e2e8f0' } }),
            ],
          }),
        ],
      });
    },
  },

  // 5. Prismatic Color Highlight
  {
    id: 'effect-prismatic-color-highlight',
    name: 'Prismatic Color Highlight',
    type: 'effect',
    category: 'effect',
    description: 'Prismatic rainbow spectral border highlight across a dark glass container.',
    tagline: 'Spectral prismatic rim highlight',
    badge: 'Prism',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['creative', 'luxury'],
    tags: ['prismatic', 'rainbow', 'spectral', 'highlight'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Prismatic Highlight',
        styles: { backgroundColor: '#07070e', padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Prism Card',
            styles: {
              maxWidth: '660px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: '#10101a',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '22px',
              padding: { top: '36px', right: '36px', bottom: '36px', left: '36px' },
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Spectral Edge Refraction' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Delicate light dispersion along container boundaries.' }, styles: { fontSize: '15px', color: '#cbd5e1' } }),
            ],
          }),
        ],
      });
    },
  },

  // 6. Frosted Glass Floating Dock
  {
    id: 'effect-frosted-glass-floating-dock',
    name: 'Frosted Glass Floating Dock',
    type: 'effect',
    category: 'effect',
    description: 'Floating bottom navigation dock with frosted glass blur and pill icons.',
    tagline: 'Floating glass dock bar',
    badge: 'Dock',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'subtle',
    industry: ['saas', 'product'],
    tags: ['dock', 'floating', 'glass', 'toolbar'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Floating Dock',
        styles: { backgroundColor: '#070710', padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Floating Dock Bar',
            styles: {
              maxWidth: '520px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: 'rgba(24, 24, 38, 0.75)',
              backdropFilter: 'blur(20px)',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Item 1', props: { text: 'Home' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, borderRadius: '999px', fontSize: '13px', fontWeight: '700' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Item 2', props: { text: 'Explore' }, styles: { backgroundColor: 'transparent', color: '#94a3b8', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, fontSize: '13px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Item 3', props: { text: 'Studio' }, styles: { backgroundColor: 'transparent', color: '#94a3b8', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, fontSize: '13px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Item 4', props: { text: 'Settings' }, styles: { backgroundColor: 'transparent', color: '#94a3b8', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, fontSize: '13px' } }),
            ],
          }),
        ],
      });
    },
  },

  // 7. Shimmer Skeleton Glow Box
  {
    id: 'effect-shimmer-skeleton-glow-box',
    name: 'Shimmer Skeleton Glow Box',
    type: 'effect',
    category: 'effect',
    description: 'Subtle pulsating light sweep across an information block.',
    tagline: 'Pulsing shimmer light sweep',
    badge: 'Shimmer',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['technology', 'saas'],
    tags: ['shimmer', 'skeleton', 'sweep', 'glow'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Shimmer Box',
        styles: { backgroundColor: '#07070d', padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, textAlign: 'center' },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Shimmer Card',
            styles: {
              maxWidth: '640px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: '#11111a',
              borderWidth: '1px',
              borderColor: '#252535',
              borderRadius: '20px',
              padding: { top: '36px', right: '32px', bottom: '36px', left: '32px' },
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Dynamic Shimmer Sweep' }, styles: { fontSize: '28px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Simulates live system polling and real-time document sync.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 8. Minimal Spotlight Pedestal
  {
    id: 'effect-minimal-spotlight-pedestal',
    name: 'Minimal Spotlight Pedestal',
    type: 'effect',
    category: 'effect',
    description: 'Sleek dark pedestal with top light beam and minimalist copy.',
    tagline: 'Minimalist illuminated pedestal',
    badge: 'Pedestal',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'static',
    industry: ['luxury', 'product'],
    tags: ['pedestal', 'spotlight', 'minimal', 'lighting'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Spotlight Pedestal',
        styles: {
          backgroundColor: '#050508',
          backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Pedestal Box',
            styles: { maxWidth: '620px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Elevated Exhibition' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Curated focal elevation for single-product spotlights.' }, styles: { fontSize: '15px', color: '#a1a1aa' } }),
            ],
          }),
        ],
      });
    },
  },
  // 9. Holographic CRT Scanlines
  {
    id: 'effect-holographic-crt-scanlines',
    name: 'Holographic CRT Scanlines',
    type: 'effect',
    category: 'effect',
    description: 'Cyberpunk display panel with retro CRT raster lines, cyan chromatic aberration, and phosphor glow.',
    tagline: 'Retro CRT phosphor effect',
    badge: 'Scanlines',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['gaming', 'crypto', 'technology'],
    tags: ['crt', 'scanlines', 'holographic', 'cyberpunk', 'retro'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: CRT Scanlines',
        styles: {
          backgroundColor: '#020b08',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 136, 0.04) 0px, rgba(0, 255, 136, 0.04) 2px, transparent 2px, transparent 4px)',
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Scanline Terminal Box',
            styles: {
              maxWidth: '680px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              borderWidth: '1px',
              borderColor: 'rgba(0, 255, 136, 0.3)',
              borderRadius: '16px',
              padding: { top: '36px', right: '32px', bottom: '36px', left: '32px' },
              boxShadow: '0 0 40px rgba(0, 255, 136, 0.15), inset 0 0 20px rgba(0, 255, 136, 0.05)',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'CRT Heading', props: { text: 'SYS.DIAGNOSTICS // V3.4' }, styles: { fontSize: '24px', fontWeight: '800', color: '#00ff88', fontFamily: 'monospace' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'CRT Desc', props: { text: 'Sub-system integrity 100%. Raster synchronization locked at 120Hz refresh cycle.' }, styles: { fontSize: '14px', color: '#6ee7b7', marginTop: '10px', fontFamily: 'monospace' } }),
            ],
          }),
        ],
      });
    },
  },
  // 10. Neon Border Glow Pulse
  {
    id: 'effect-neon-border-pulse',
    name: 'Neon Border Glow Pulse',
    type: 'effect',
    category: 'effect',
    description: 'Vivid neon border illumination with multi-stop radial backdrop lighting and high contrast styling.',
    tagline: 'High-contrast neon perimeter',
    badge: 'Neon Glow',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'vibrant',
    motionLevel: 'animated',
    industry: ['creative', 'gaming', 'agency'],
    tags: ['neon', 'border', 'glow', 'pulse', 'vibrant'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Neon Border Pulse',
        styles: {
          backgroundColor: '#0a0512',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Neon Frame',
            styles: {
              maxWidth: '640px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: '#120a22',
              borderRadius: '24px',
              borderWidth: '2px',
              borderColor: '#ec4899',
              boxShadow: '0 0 35px rgba(236, 72, 153, 0.45), inset 0 0 15px rgba(236, 72, 153, 0.2)',
              padding: { top: '40px', right: '36px', bottom: '40px', left: '36px' },
              textAlign: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Neon Title', props: { text: 'Electrified Neon Frame' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Neon Sub', props: { text: 'Deep perimeter resonance designed to draw intense visual focus.' }, styles: { fontSize: '15px', color: '#f472b6', marginTop: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 11. Frosted Prismatic Refraction
  {
    id: 'effect-frosted-prismatic-refraction',
    name: 'Frosted Prismatic Refraction',
    type: 'effect',
    category: 'effect',
    description: 'Iridescent chromatic frosted glass with spectrum color shifts and multi-angle light diffusion.',
    tagline: 'Iridescent spectrum glass',
    badge: 'Prismatic',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'subtle',
    industry: ['luxury', 'design', 'fashion'],
    tags: ['prismatic', 'refraction', 'iridescent', 'glass', 'frosted'],
    capabilities: { glassmorphism: true, gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Frosted Prismatic Refraction',
        styles: {
          backgroundColor: '#070710',
          backgroundImage: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(236, 72, 153, 0.12), rgba(234, 179, 8, 0.12))',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Prismatic Glass Panel',
            styles: {
              maxWidth: '660px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(30px)',
              borderRadius: '26px',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.2)',
              padding: { top: '44px', right: '40px', bottom: '44px', left: '40px' },
              textAlign: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Prism Title', props: { text: 'Prismatic Light Splitting' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Prism Desc', props: { text: 'Spectral color dispersal that gives digital surfaces crystalline depth.' }, styles: { fontSize: '15px', color: '#e2e8f0', marginTop: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 12. Aurora Glow Veil
  {
    id: 'effect-aurora-glow-veil',
    name: 'Aurora Glow Veil',
    type: 'effect',
    category: 'effect',
    description: 'Atmospheric curtain of flowing emerald and indigo light reminiscent of polar aurora borealis.',
    tagline: 'Flowing aurora luminescence',
    badge: 'Aurora',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'vibrant',
    motionLevel: 'animated',
    industry: ['creative', 'travel', 'entertainment'],
    tags: ['aurora', 'borealis', 'glow', 'veil', 'luminescence'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Aurora Glow Veil',
        styles: {
          backgroundColor: '#03080e',
          backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(16, 185, 129, 0.3) 0%, rgba(99, 102, 241, 0.25) 45%, transparent 75%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Aurora Box',
            styles: { maxWidth: '700px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Aurora Title', props: { text: 'Atmospheric Aurora Veil' }, styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Aurora Desc', props: { text: 'Subtle atmospheric luminescence illuminating foreground typography with natural radiance.' }, styles: { fontSize: '16px', color: '#93c5fd', marginTop: '14px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 13. Duotone Film Grain Canvas
  {
    id: 'effect-duotone-film-grain',
    name: 'Duotone Film Grain Canvas',
    type: 'effect',
    category: 'effect',
    description: 'High-contrast monochromatic editorial texture simulating analog film grain and print contrast.',
    tagline: 'Monochrome analog grain',
    badge: 'Film Grain',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'static',
    industry: ['editorial', 'fashion', 'architecture'],
    tags: ['duotone', 'grain', 'film', 'analog', 'editorial'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Duotone Film Grain',
        styles: {
          backgroundColor: '#0e0e0e',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Editorial Canvas',
            styles: {
              maxWidth: '720px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              borderWidth: '1px',
              borderColor: '#2a2a2a',
              backgroundColor: '#141414',
              padding: { top: '48px', right: '44px', bottom: '48px', left: '44px' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Mono Eyebrow', props: { text: 'ISSUE NO. 04 / ANALOG RECORD' }, styles: { fontSize: '11px', fontWeight: '700', color: '#888888', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Mono Title', props: { text: 'The Tactile Digital Surface' }, styles: { fontSize: '36px', fontWeight: '800', color: '#f5f5f5', marginTop: '14px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Mono Desc', props: { text: 'Restoring tangible sensory nuance to modern web compositions with calculated noise distribution.' }, styles: { fontSize: '15px', color: '#999999', marginTop: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 14. Liquid Morphing Blur Accent
  {
    id: 'effect-liquid-morphing-blur',
    name: 'Liquid Morphing Blur Accent',
    type: 'effect',
    category: 'effect',
    description: 'Dynamic organic fluid blur pods floating behind clean elevated content surfaces.',
    tagline: 'Organic fluid ambient blur',
    badge: 'Liquid Blur',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'vibrant',
    motionLevel: 'animated',
    industry: ['design', 'agency', 'saas'],
    tags: ['liquid', 'blur', 'morphing', 'organic', 'ambient'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Liquid Morphing Blur',
        styles: {
          backgroundColor: '#050508',
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(244, 63, 94, 0.25) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.25) 0%, transparent 50%)',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Surface Card',
            styles: {
              maxWidth: '650px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: 'rgba(15, 15, 25, 0.7)',
              backdropFilter: 'blur(20px)',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: { top: '40px', right: '36px', bottom: '40px', left: '36px' },
              textAlign: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Liquid Title', props: { text: 'Fluid Ambient Depth' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Liquid Desc', props: { text: 'Layered organic fluid blobs create continuous visual rhythm behind sharp interactive controls.' }, styles: { fontSize: '15px', color: '#cbd5e1', marginTop: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 15. Specular Metallic Sheen
  {
    id: 'effect-specular-metallic-sheen',
    name: 'Specular Metallic Sheen',
    type: 'effect',
    category: 'effect',
    description: 'Precision brushed metallic surface with specular light reflection edges and brushed chrome gradient.',
    tagline: 'Precision metallic specular',
    badge: 'Metallic',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'subtle',
    industry: ['automotive', 'hardware', 'luxury'],
    tags: ['metallic', 'specular', 'chrome', 'brushed', 'sheen'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Specular Metallic Sheen',
        styles: {
          backgroundColor: '#0c0d10',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Metallic Inset Plate',
            styles: {
              maxWidth: '680px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundImage: 'linear-gradient(145deg, #1c1e24 0%, #0d0e12 100%)',
              borderWidth: '1px',
              borderColor: '#3a3e4c',
              borderRadius: '22px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              padding: { top: '44px', right: '40px', bottom: '44px', left: '40px' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Metal Title', props: { text: 'Aerospace-Grade Precision' }, styles: { fontSize: '30px', fontWeight: '800', color: '#e5e7eb' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Metal Desc', props: { text: 'Engineered specular highlights mirroring machined titanium and anodized aluminum chassis.' }, styles: { fontSize: '15px', color: '#9ca3af', marginTop: '10px' } }),
            ],
          }),
        ],
      });
    },
  },
  // 16. Cyberpunk Glitch Accent
  {
    id: 'effect-cyberpunk-glitch-accent',
    name: 'Cyberpunk Glitch Accent',
    type: 'effect',
    category: 'effect',
    description: 'High-energy cyber aesthetic featuring contrasting neon chromatic offsets and sharp geometric panels.',
    tagline: 'High-contrast cybernetic styling',
    badge: 'Cyber Glitch',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'animated',
    industry: ['gaming', 'esports', 'crypto'],
    tags: ['cyberpunk', 'glitch', 'neon', 'esports', 'accent'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Effect: Cyberpunk Glitch',
        styles: {
          backgroundColor: '#08080e',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(244, 63, 94, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)',
          padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Glitch Stage',
            styles: {
              maxWidth: '680px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              backgroundColor: '#0f101a',
              borderWidth: '2px',
              borderColor: '#06b6d4',
              borderRadius: '16px',
              boxShadow: '4px 4px 0 #f43f5e, -2px -2px 0 #06b6d4',
              padding: { top: '36px', right: '32px', bottom: '36px', left: '32px' },
              textAlign: 'center',
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Glitch Eyebrow', props: { text: 'PROTOCOL OVERRIDE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#06b6d4', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Glitch Title', props: { text: 'CYBERNETIC MATRIX' }, styles: { fontSize: '38px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', marginTop: '10px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Glitch Desc', props: { text: 'Asymmetric offset box-shadows produce iconic chromatic aberration with zero raster image overhead.' }, styles: { fontSize: '14px', color: '#cbd5e1', marginTop: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
];

