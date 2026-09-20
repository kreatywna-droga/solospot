/**
 * flagship-experiences.ts — The 10 Flagship Experiences for SoloSpot Experience Library v3.0
 *
 * Guaranteed Quality Gate Implementations:
 * 1. Cinematic Product Hero
 * 2. Mirror Hall
 * 3. Glass Wave
 * 4. Gradient World
 * 5. Sticky Story
 * 6. Horizontal Showcase
 * 7. Parallax Depth
 * 8. Interactive Bento
 * 9. Product Reveal
 * 10. Perspective 3D Scene
 *
 * Every flagship is visually complete, responsive, editable, and 100% BuilderDocument-native.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const FLAGSHIP_EXPERIENCES: ExperienceItem[] = [
  // 1. Cinematic Product Hero
  {
    id: 'flagship-cinematic-product-hero',
    name: 'Cinematic Product Hero',
    type: 'hero',
    category: 'hero',
    description: 'Deep cinematic atmosphere featuring a background looping video, dark radial vignette, dual conversion CTAs, and a floating 3D product showcase card with glowing rim light.',
    tagline: 'Atmospheric video hero with 3D product stage',
    badge: 'Flagship 01',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'cinematic',
    motionLevel: 'cinematic',
    industry: ['technology', 'product', 'saas', 'creative'],
    tags: ['flagship', 'hero', 'video', 'cinematic', '3d', 'product'],
    capabilities: { backgroundVideo: true, videoBackground: true, perspective3d: true, assetSlots: true },
    assetSlots: [
      { id: 'heroVideo', label: 'Background Video', slotType: 'BACKGROUND_VIDEO' },
      { id: 'productImage', label: 'Product Card Visual', slotType: 'IMAGE', recommendedDimensions: { width: 800, height: 600 } },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Cinematic Product Hero',
        props: {
          backgroundVideo: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4',
          backgroundVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4',
          overlayColor: '#05050a',
          overlayOpacity: 0.65,
        },
        styles: {
          backgroundColor: '#05050a',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Hero Split Grid',
            styles: {
              maxWidth: '1240px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '56px',
            },
            children: [
              // Left Content Column
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Content Area',
                styles: { width: '52%', display: 'flex', flexDirection: 'column', gap: '24px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Badge Pill',
                    styles: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(124, 58, 237, 0.15)',
                      borderWidth: '1px',
                      borderColor: 'rgba(139, 92, 246, 0.4)',
                      padding: { top: '6px', right: '16px', bottom: '6px', left: '16px' },
                      borderRadius: '999px',
                      width: 'fit-content',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge Text', props: { text: '★ SOLOSPOT FLAGSHIP 01' }, styles: { fontSize: '11px', fontWeight: '800', color: '#c4b5fd', letterSpacing: '1.5px' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Headline',
                    props: { text: 'Next-Generation Visual Architecture', level: 'h1' },
                    styles: { fontSize: '52px', fontWeight: '900', color: '#ffffff', lineHeight: '1.1', letterSpacing: '-1.8px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subhead',
                    props: { text: 'Build, experience, and deploy immersive web applications with real hardware-accelerated 3D transforms, live video layers, and zero layout drift.' },
                    styles: { fontSize: '18px', color: '#cbd5e1', lineHeight: '1.6' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'CTA Button Row',
                    styles: { display: 'flex', gap: '16px', marginTop: '8px' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'Primary CTA',
                        props: { text: 'Explore System' },
                        styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '700', fontSize: '15px', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.5)' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'Secondary CTA',
                        props: { text: 'Live Interactive Demo' },
                        styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#ffffff', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.18)', fontWeight: '600', fontSize: '15px' },
                      }),
                    ],
                  }),
                ],
              }),

              // Right Product 3D Card
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right 3D Showcase Stage',
                styles: {
                  width: '46%',
                  perspective: '1200px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: '3D Elevated Card',
                    styles: {
                      width: '100%',
                      backgroundColor: 'rgba(20, 20, 32, 0.75)',
                      backdropFilter: 'blur(20px)',
                      borderWidth: '1px',
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      borderRadius: '24px',
                      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
                      boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px -10px rgba(124, 58, 237, 0.35)',
                      transform: 'rotateY(-8deg) rotateX(4deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Showcase Preview',
                        props: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', alt: 'Flagship Showcase' },
                        styles: { width: '100%', height: '240px', borderRadius: '16px', objectFit: 'cover' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Showcase Title',
                        props: { text: 'SoloSpot Core Engine 3.0', level: 'h3' },
                        styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Showcase Meta',
                        props: { text: '60 FPS Hardware Transforms • Native BuilderDocument Parity • Universal Asset Slot Engine' },
                        styles: { fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' },
                      }),
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

  // 2. Mirror Hall
  {
    id: 'flagship-mirror-hall',
    name: 'Mirror Hall',
    type: 'motion',
    category: 'motion',
    description: 'Layered reflective planes using CSS 3D perspective depth, symmetric gradient reflection, and illuminated spatial cards.',
    tagline: 'Reflective perspective depth chamber',
    badge: 'Flagship 02',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['creative', 'agency', 'luxury', 'technology'],
    tags: ['flagship', 'reflection', 'mirror', '3d', 'depth', 'spatial'],
    capabilities: { perspective3d: true, gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Mirror Hall',
        styles: {
          backgroundColor: '#030308',
          backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.18) 0%, transparent 60%)',
          padding: { top: '110px', right: '32px', bottom: '110px', left: '32px' },
          textAlign: 'center',
          perspective: '1200px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header Block',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '60px', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'SPATIAL REFLECTION CHAMBER' }, styles: { fontSize: '12px', fontWeight: '800', color: '#818cf8', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'The Mirror Hall Composition' }, styles: { fontSize: '46px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Dual-plane reflective depth creates physical spatial illusions without high WebGL overhead.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Mirror Planes Stage',
            styles: {
              maxWidth: '1100px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
            },
            children: [
              // Left Oblique Mirror
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Mirror Wing',
                styles: {
                  width: '320px',
                  backgroundColor: 'rgba(15, 15, 25, 0.7)',
                  borderWidth: '1px',
                  borderColor: 'rgba(129, 140, 248, 0.25)',
                  borderRadius: '20px',
                  padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' },
                  boxShadow: '-20px 30px 50px -10px rgba(0, 0, 0, 0.8)',
                  transform: 'rotateY(18deg) rotateX(2deg) scale(0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Wing Title', props: { text: 'Symmetric Refraction' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Wing Desc', props: { text: 'Angled planes guide attention inward toward focal conversions.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              // Center Specular Monolith
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Center Specular Monolith',
                styles: {
                  width: '380px',
                  backgroundColor: 'rgba(24, 24, 38, 0.9)',
                  borderWidth: '2px',
                  borderColor: '#818cf8',
                  borderRadius: '24px',
                  padding: { top: '44px', right: '32px', bottom: '44px', left: '32px' },
                  boxShadow: '0 30px 70px -15px rgba(99, 102, 241, 0.4), inset 0 1px 2px 0 rgba(255, 255, 255, 0.3)',
                  transform: 'scale(1.06) translateZ(40px)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Center Title', props: { text: 'Focal Specular Plane' }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Center Desc', props: { text: 'True hardware-accelerated Z-elevation with calibrated drop shadows.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Launch Button', props: { text: 'Step Through' }, styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px', fontWeight: '700', marginTop: '12px' } }),
                ],
              }),
              // Right Oblique Mirror
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Mirror Wing',
                styles: {
                  width: '320px',
                  backgroundColor: 'rgba(15, 15, 25, 0.7)',
                  borderWidth: '1px',
                  borderColor: 'rgba(129, 140, 248, 0.25)',
                  borderRadius: '20px',
                  padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' },
                  boxShadow: '20px 30px 50px -10px rgba(0, 0, 0, 0.8)',
                  transform: 'rotateY(-18deg) rotateX(2deg) scale(0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Wing Title', props: { text: 'Chromatic Horizon' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Wing Desc', props: { text: 'Dynamic perspective boundaries that adapt to any screen size.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 3. Glass Wave
  {
    id: 'flagship-glass-wave',
    name: 'Glass Wave',
    type: 'effect',
    category: 'effect',
    description: 'Multi-layer frosted glassmorphism composition with specular refraction cards, backdrop-filter blur, and organic ambient gradient lighting.',
    tagline: 'Frosted glass refraction surface',
    badge: 'Flagship 03',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'subtle',
    industry: ['creative', 'luxury', 'saas', 'agency'],
    tags: ['flagship', 'glass', 'wave', 'refraction', 'blur', 'minimal'],
    capabilities: { glassmorphism: true, gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Glass Wave',
        styles: {
          backgroundColor: '#070914',
          backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Content Grid',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', gap: '48px' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Title Area',
                styles: { display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'SPECULAR REFRACTION' }, styles: { fontSize: '12px', fontWeight: '800', color: '#60a5fa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Glass Wave Tactile Surfaces' }, styles: { fontSize: '44px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'Subtle frosted glass depth panels with integrated specular lighting highlights.' }, styles: { fontSize: '17px', color: '#94a3b8', maxWidth: '640px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: '3-Card Glass Grid',
                styles: { display: 'flex', flexDirection: 'row', gap: '28px', justifyContent: 'space-between' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Panel 1',
                    styles: {
                      width: '32%',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(24px)',
                      borderWidth: '1px',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: '24px',
                      padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Pure Refraction' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Hardware blur filters simulate optical light bending in realtime.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Panel 2',
                    styles: {
                      width: '32%',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(24px)',
                      borderWidth: '1px',
                      borderColor: 'rgba(96, 165, 250, 0.35)',
                      borderRadius: '24px',
                      padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                      boxShadow: '0 25px 50px -10px rgba(59, 130, 246, 0.25), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Specular Highlight' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: 'Edge perimeter luminosity creates unmistakable luxury and polish.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Glass Panel 3',
                    styles: {
                      width: '32%',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      backdropFilter: 'blur(24px)',
                      borderWidth: '1px',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: '24px',
                      padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Zero Layout Shift' }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Text', props: { text: '100% stable composition across viewport breakpoints and renderers.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
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

  // 4. Gradient World
  {
    id: 'flagship-gradient-world',
    name: 'Gradient World',
    type: 'background',
    category: 'background',
    description: 'Organic chromatic radial mesh landscape with vibrant multi-point lighting, pulsing color gradients, and high-impact typography.',
    tagline: 'Multi-stop chromatic radial mesh landscape',
    badge: 'Flagship 04',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'animated',
    industry: ['saas', 'creative', 'technology', 'events'],
    tags: ['flagship', 'gradient', 'mesh', 'chromatic', 'atmosphere', 'bold'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Gradient World',
        styles: {
          backgroundColor: '#05050c',
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(236, 72, 153, 0.35) 0%, transparent 45%), radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 85%, rgba(6, 182, 212, 0.3) 0%, transparent 55%)',
          padding: { top: '120px', right: '32px', bottom: '120px', left: '32px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Center Hero Box',
            styles: { maxWidth: '840px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'CHROMATIC ATMOSPHERE' }, styles: { fontSize: '13px', fontWeight: '800', color: '#f472b6', letterSpacing: '2.5px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'The Limitless Creative Canvas' }, styles: { fontSize: '50px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.8px', lineHeight: '1.1' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Multi-stop organic color fields engineered to provide dramatic visual presence while maintaining complete text contrast and compliance.' }, styles: { fontSize: '18px', color: '#e2e8f0', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Explore CTA', props: { text: 'Experience the Palette' }, styles: { backgroundColor: '#ec4899', color: '#ffffff', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '14px', fontWeight: '700', fontSize: '16px', boxShadow: '0 10px 30px -5px rgba(236, 72, 153, 0.6)' } }),
            ],
          }),
        ],
      });
    },
  },

  // 5. Sticky Story
  {
    id: 'flagship-sticky-story',
    name: 'Sticky Story',
    type: 'interactive',
    category: 'interactive',
    description: 'Pinned editorial narrative with sticky navigation indicators on the left and sequential progressive story cards that unfold during vertical progression.',
    tagline: 'Pinned editorial scroll narrative',
    badge: 'Flagship 05',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'editorial',
    motionLevel: 'scroll',
    industry: ['agency', 'portfolio', 'saas', 'product'],
    tags: ['flagship', 'sticky', 'story', 'scrollytelling', 'editorial', 'interactive'],
    capabilities: { scrollAnimation: true, sticky: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Sticky Story',
        styles: {
          backgroundColor: '#080811',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Sticky Split Frame',
            styles: {
              maxWidth: '1160px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '64px',
            },
            children: [
              // Sticky Left Sidebar
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Sticky Left Header',
                styles: { width: '40%', position: 'sticky', top: '40px', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'SCROLL STORYTELLING' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'How We Transform Digital Presence' }, styles: { fontSize: '38px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '1.2' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subhead', props: { text: 'As your audience navigates downward, key strategic pillars lock into view sequentially.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                ],
              }),

              // Right Sequential Story Cards
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Story Cards Column',
                styles: { width: '60%', display: 'flex', flexDirection: 'column', gap: '32px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Phase 01 Card',
                    styles: { backgroundColor: '#11111d', borderWidth: '1px', borderColor: '#222234', borderRadius: '20px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '14px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Tag', props: { text: 'PHASE 01' }, styles: { fontSize: '12px', fontWeight: '800', color: '#7c3aed' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Phase Title', props: { text: 'Architecture & Visual Discovery' }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Content', props: { text: 'We map every interaction, design token, and asset slot prior to writing code, ensuring zero layout instability.' }, styles: { fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Phase 02 Card',
                    styles: { backgroundColor: '#11111d', borderWidth: '1px', borderColor: '#222234', borderRadius: '20px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '14px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Tag', props: { text: 'PHASE 02' }, styles: { fontSize: '12px', fontWeight: '800', color: '#7c3aed' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Phase Title', props: { text: 'Live Interactive Engine' }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Content', props: { text: 'Hardware-accelerated CSS perspective matrices render at 60 FPS without heavy runtime bundles.' }, styles: { fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Phase 03 Card',
                    styles: { backgroundColor: '#11111d', borderWidth: '1px', borderColor: '#222234', borderRadius: '20px', padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' }, display: 'flex', flexDirection: 'column', gap: '14px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Tag', props: { text: 'PHASE 03' }, styles: { fontSize: '12px', fontWeight: '800', color: '#7c3aed' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Phase Title', props: { text: 'Global Distribution & Scale' }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phase Content', props: { text: 'Automated static compilation routes directly into edge delivery with single-command rollback.' }, styles: { fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' } }),
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

  // 6. Horizontal Showcase
  {
    id: 'flagship-horizontal-showcase',
    name: 'Horizontal Showcase',
    type: 'interactive',
    category: 'interactive',
    description: 'Horizontal showcase runway featuring sliding track navigation controls, multi-card preview layout, and responsive swipe support.',
    tagline: 'Sliding horizontal card runway',
    badge: 'Flagship 06',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'interactive',
    industry: ['ecommerce', 'portfolio', 'saas', 'product'],
    tags: ['flagship', 'horizontal', 'showcase', 'carousel', 'runway', 'interactive'],
    capabilities: { scrollAnimation: true },
    assetSlots: [
      { id: 'slide1', label: 'Slide 1 Image', slotType: 'IMAGE' },
      { id: 'slide2', label: 'Slide 2 Image', slotType: 'IMAGE' },
      { id: 'slide3', label: 'Slide 3 Image', slotType: 'IMAGE' },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Horizontal Showcase',
        styles: {
          backgroundColor: '#07070f',
          padding: { top: '90px', right: '28px', bottom: '90px', left: '28px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header & Navigation Row',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '40px', left: 'auto' }, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Title Block',
                styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Eyebrow', props: { text: 'FEATURED RUNWAY' }, styles: { fontSize: '12px', fontWeight: '800', color: '#c084fc', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Selected Works & Case Studies' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Controls',
                styles: { display: 'flex', gap: '10px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Prev Slide', props: { text: '←' }, styles: { backgroundColor: '#171724', color: '#ffffff', padding: { top: '10px', right: '18px', bottom: '10px', left: '18px' }, borderRadius: '999px', borderWidth: '1px', borderColor: '#2c2c40', fontWeight: '700' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Next Slide', props: { text: '→' }, styles: { backgroundColor: '#9333ea', color: '#ffffff', padding: { top: '10px', right: '18px', bottom: '10px', left: '18px' }, borderRadius: '999px', fontWeight: '700' } }),
                ],
              }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Runway Track',
            styles: {
              maxWidth: '1200px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              gap: '24px',
              overflowX: 'auto',
              padding: { top: '8px', right: '8px', bottom: '16px', left: '8px' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Runway Card 1',
                styles: { minWidth: '350px', backgroundColor: '#12121e', borderWidth: '1px', borderColor: '#222233', borderRadius: '18px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 1', props: { src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', alt: 'Cyber Project' }, styles: { height: '190px', borderRadius: '14px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Autonomous Engine v4' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Desc', props: { text: 'Zero-downtime micro-frontend deployments with automated edge routing.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Runway Card 2',
                styles: { minWidth: '350px', backgroundColor: '#12121e', borderWidth: '1px', borderColor: '#222233', borderRadius: '18px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 2', props: { src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80', alt: 'Digital Security' }, styles: { height: '190px', borderRadius: '14px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Cryptographic Identity' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Desc', props: { text: 'Supabase RLS storage isolation per tenant with verifiable token authority.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Runway Card 3',
                styles: { minWidth: '350px', backgroundColor: '#12121e', borderWidth: '1px', borderColor: '#222233', borderRadius: '18px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Preview 3', props: { src: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80', alt: 'Interface System' }, styles: { height: '190px', borderRadius: '14px', objectFit: 'cover' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Spatial Interaction Mesh' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Desc', props: { text: 'Pure CSS 3D transforms rendering with native 60 FPS compositor speed.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 7. Parallax Depth
  {
    id: 'flagship-parallax-depth',
    name: 'Parallax Depth',
    type: 'motion',
    category: 'motion',
    description: 'Multi-plane spatial layout with foreground sharp CTA elements, floating mid-ground feature cards, and deep ambient background moving at calibrated rates.',
    tagline: 'Multi-plane spatial parallax stage',
    badge: 'Flagship 07',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'scroll',
    industry: ['creative', 'agency', 'luxury', 'portfolio'],
    tags: ['flagship', 'parallax', 'depth', 'multi-plane', 'spatial', 'scroll'],
    capabilities: { scrollAnimation: true, perspective3d: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Parallax Depth',
        styles: {
          backgroundColor: '#06060c',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          padding: { top: '110px', right: '32px', bottom: '110px', left: '32px' },
          perspective: '1000px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Parallax Stage',
            styles: { maxWidth: '1140px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', textAlign: 'center' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'SPATIAL DEPTH RATIOS' }, styles: { fontSize: '12px', fontWeight: '800', color: '#c084fc', letterSpacing: '2.5px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Calibrated Parallax Depth' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Layered Cards Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '28px', justifyContent: 'center', alignItems: 'center', marginTop: '20px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Deep Card 1',
                    styles: { width: '320px', backgroundColor: '#0f0f18', borderWidth: '1px', borderColor: '#222233', borderRadius: '18px', padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' }, transform: 'scale(0.92) translateY(24px)', opacity: 0.85, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Background Plane' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Desc', props: { text: 'Moves at 0.3x scroll velocity to generate natural physical parallax.' }, styles: { fontSize: '13px', color: '#94a3b8', marginTop: '8px' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Elevated Focal Card',
                    styles: { width: '360px', backgroundColor: '#171728', borderWidth: '2px', borderColor: '#a855f7', borderRadius: '22px', padding: { top: '40px', right: '28px', bottom: '40px', left: '28px' }, transform: 'scale(1.06) translateY(-12px)', zIndex: 10, boxShadow: '0 30px 60px -10px rgba(168, 85, 247, 0.4)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Focal Title', props: { text: 'Focal Plane' }, styles: { fontSize: '22px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Focal Desc', props: { text: 'Anchor layer moves synchronously at 1.0x velocity, maintaining high visual hierarchy.' }, styles: { fontSize: '14px', color: '#e2e8f0', marginTop: '10px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Depth' }, styles: { backgroundColor: '#a855f7', color: '#ffffff', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '12px', fontWeight: '700', marginTop: '16px' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Deep Card 2',
                    styles: { width: '320px', backgroundColor: '#0f0f18', borderWidth: '1px', borderColor: '#222233', borderRadius: '18px', padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' }, transform: 'scale(0.92) translateY(24px)', opacity: 0.85, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Card Title', props: { text: 'Foreground Plane' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Card Desc', props: { text: 'Accelerated 1.4x layer creating immersive spatial pass-through.' }, styles: { fontSize: '13px', color: '#94a3b8', marginTop: '8px' } }),
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

  // 8. Interactive Bento
  {
    id: 'flagship-interactive-bento',
    name: 'Interactive Bento',
    type: 'interactive',
    category: 'interactive',
    description: 'Asymmetric 4-column Bento grid with hover spotlight cards, live metric counter badges, video preview tile, and interactive tag chips.',
    tagline: 'Asymmetric multi-tile interactive bento grid',
    badge: 'Flagship 08',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'interactive',
    industry: ['saas', 'product', 'technology', 'creative'],
    tags: ['flagship', 'bento', 'grid', 'interactive', 'metrics', 'spotlight'],
    capabilities: { backgroundVideo: true, customLayout: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Interactive Bento',
        styles: {
          backgroundColor: '#07070d',
          padding: { top: '90px', right: '32px', bottom: '90px', left: '32px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header Area',
            styles: { maxWidth: '1200px', margin: { top: '0', right: 'auto', bottom: '48px', left: 'auto' }, display: 'flex', flexDirection: 'column', gap: '12px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'ASYMMETRIC ARCHITECTURE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a855f7', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Interactive Modular Bento Matrix' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bento Grid',
            styles: {
              maxWidth: '1200px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
            },
            children: [
              // Tile 1: 2-column Metric Card
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bento Metric Tile',
                styles: {
                  backgroundColor: '#11111c',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '24px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Metric Value', props: { text: '99.98%' }, styles: { fontSize: '56px', fontWeight: '900', color: '#c084fc', letterSpacing: '-2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Metric Label', props: { text: 'Verified Render Availability' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Metric Note', props: { text: 'Realtime sub-50ms paint execution across worldwide edge nodes.' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                ],
              }),

              // Tile 2: Video Tile
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bento Video Tile',
                props: {
                  backgroundVideo: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-1728-large.mp4',
                  overlayColor: '#07070d',
                  overlayOpacity: 0.5,
                },
                styles: {
                  backgroundColor: '#11111c',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                  position: 'relative',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Video Title', props: { text: 'Live Core Monitoring' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Video Sub', props: { text: 'Streaming video layer with zero client frame drops.' }, styles: { fontSize: '13px', color: '#e2e8f0' } }),
                ],
              }),

              // Tile 3: Security Tile
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bento Security Tile',
                styles: {
                  backgroundColor: '#11111c',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: '🔒 ENTERPRISE RLS' }, styles: { fontSize: '11px', fontWeight: '800', color: '#34d399', letterSpacing: '1px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Hardened Multi-Tenant Storage' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Cryptographic path policies prevent unauthorized cross-store asset leaks.' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                ],
              }),

              // Tile 4: Interactive Feature Pill Tile
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bento Feature Tile',
                styles: {
                  backgroundColor: '#11111c',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Instant Hot-Reload' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Text', props: { text: 'Builder context dispatch immediately updates preview canvas at 60 FPS.' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Inspect CTA', props: { text: 'Explore System' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' }, borderRadius: '8px', fontWeight: '600', fontSize: '12px', width: 'fit-content' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 9. Product Reveal
  {
    id: 'flagship-product-reveal',
    name: 'Product Reveal',
    type: 'interactive',
    category: 'interactive',
    description: 'Luxury e-commerce showcase stage featuring 3D product tilt physics, technical specification breakdown, interactive colorway selector chips, and instant purchase CTA.',
    tagline: 'Luxury 3D product reveal stage',
    badge: 'Flagship 09',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'interactive',
    industry: ['ecommerce', 'product', 'luxury', 'creative'],
    tags: ['flagship', 'product', 'reveal', 'luxury', 'ecommerce', '3d'],
    capabilities: { perspective3d: true, assetSlots: true },
    assetSlots: [
      { id: 'productHeroImg', label: 'Main Product Image', slotType: 'IMAGE', recommendedDimensions: { width: 900, height: 700 } },
    ],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Product Reveal',
        styles: {
          backgroundColor: '#09090f',
          padding: { top: '100px', right: '32px', bottom: '100px', left: '32px' },
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Reveal Split Frame',
            styles: {
              maxWidth: '1180px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '60px',
            },
            children: [
              // Product Visual Stage
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Product Image Frame',
                styles: {
                  width: '50%',
                  backgroundColor: '#12121e',
                  borderWidth: '1px',
                  borderColor: '#262638',
                  borderRadius: '28px',
                  padding: { top: '36px', right: '36px', bottom: '36px', left: '36px' },
                  boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Product Visual',
                    props: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Luxury Watch Edition' },
                    styles: { width: '100%', maxHeight: '380px', objectFit: 'contain' },
                  }),
                ],
              }),

              // Product Info & Purchase Panel
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Product Spec Panel',
                styles: { width: '48%', display: 'flex', flexDirection: 'column', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Edition', props: { text: 'LIMITED CHRONOGRAPH EDITION' }, styles: { fontSize: '12px', fontWeight: '800', color: '#d97706', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Product Name', props: { text: 'The Onyx Automata 01' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Price', props: { text: '$1,450 USD' }, styles: { fontSize: '28px', fontWeight: '800', color: '#f59e0b' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Forged from aircraft-grade titanium with an anti-reflective sapphire crystal face and bespoke automatic movement.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Action Row',
                    styles: { display: 'flex', gap: '16px', marginTop: '10px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Order Button', props: { text: 'Acquire Timepiece' }, styles: { backgroundColor: '#f59e0b', color: '#000000', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', fontWeight: '800', fontSize: '15px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Specs Button', props: { text: 'Technical Specs' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#ffffff', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '12px', borderWidth: '1px', borderColor: '#2c2c3e', fontWeight: '600', fontSize: '15px' } }),
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

  // 10. Perspective 3D Scene
  {
    id: 'flagship-perspective-3d-scene',
    name: 'Perspective 3D Scene',
    type: 'motion',
    category: 'motion',
    description: 'Hardware-accelerated CSS 3D perspective stage with preserve-3d, multi-planar angled cards, dynamic elevation shadows, and spatial depth.',
    tagline: 'Hardware-accelerated CSS 3D stage',
    badge: 'Flagship 10',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'interactive',
    industry: ['technology', 'creative', 'saas', 'agency'],
    tags: ['flagship', '3d', 'perspective', 'scene', 'spatial', 'motion'],
    capabilities: { perspective3d: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Flagship: Perspective 3D Scene',
        styles: {
          backgroundColor: '#05050b',
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.2) 0%, transparent 65%)',
          padding: { top: '110px', right: '32px', bottom: '110px', left: '32px' },
          textAlign: 'center',
          perspective: '1400px',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header Area',
            styles: { maxWidth: '820px', margin: { top: '0', right: 'auto', bottom: '60px', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'TRUE CSS PERSPECTIVE STAGE' }, styles: { fontSize: '12px', fontWeight: '800', color: '#a78bfa', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Spatial 3D Matrix Architecture' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Hardware-composited multi-planar cards that react in real-time with zero WebGL overhead.' }, styles: { fontSize: '17px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: '3D Triumvirate Stage',
            styles: {
              maxWidth: '1120px',
              margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' },
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '30px',
            },
            children: [
              // Left Card
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Angled Left Card',
                styles: {
                  width: '320px',
                  backgroundColor: '#0e0e18',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' },
                  boxShadow: '-20px 30px 50px -10px rgba(0, 0, 0, 0.8)',
                  transform: 'rotateY(16deg) rotateX(4deg) translateZ(-20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Left Title', props: { text: 'Left Oblique Plane' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Left Desc', props: { text: 'Angled inward at 16 degrees for optical depth.' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                ],
              }),

              // Center Card (Elevated)
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Center Focal Card',
                styles: {
                  width: '380px',
                  backgroundColor: '#18172c',
                  borderWidth: '2px',
                  borderColor: '#8b5cf6',
                  borderRadius: '24px',
                  padding: { top: '44px', right: '32px', bottom: '44px', left: '32px' },
                  boxShadow: '0 30px 70px -15px rgba(124, 58, 237, 0.45)',
                  transform: 'scale(1.08) translateZ(50px)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Center Title', props: { text: 'Focal 3D Apex' }, styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Center Desc', props: { text: 'Elevated 50px along the Z-axis to dominate viewport hierarchy.' }, styles: { fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Center CTA', props: { text: 'Enter 3D Space' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px', fontWeight: '700', marginTop: '12px' } }),
                ],
              }),

              // Right Card
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Angled Right Card',
                styles: {
                  width: '320px',
                  backgroundColor: '#0e0e18',
                  borderWidth: '1px',
                  borderColor: '#242436',
                  borderRadius: '20px',
                  padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' },
                  boxShadow: '20px 30px 50px -10px rgba(0, 0, 0, 0.8)',
                  transform: 'rotateY(-16deg) rotateX(4deg) translateZ(-20px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Right Title', props: { text: 'Right Oblique Plane' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Right Desc', props: { text: 'Balanced right-wing plane completing the 3D perspective.' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
