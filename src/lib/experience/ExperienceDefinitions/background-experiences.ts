/**
 * background-experiences.ts — 22 Distinct Atmospheric Background Experiences for SoloSpot v3.0
 *
 * Distinct atmospheric backdrops, ambient video, gradient meshes, and dynamic textures.
 * Zero duplicate loop generators — each experience has unique gradients, composition, and colors.
 */

import {
  BuilderNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';
import type { ExperienceItem } from '../ExperienceTypes';

export const backgroundExperiences: ExperienceItem[] = [
  // 1. Aurora Borealis Mesh
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
    contentVersion: '3.0.0',
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

  // 2. Ambient Cosmos Video Background
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
    contentVersion: '3.0.0',
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

  // 3. Cyber Neon Grid
  {
    id: 'background-cyber-neon-grid',
    name: 'Cyber Neon Grid',
    type: 'background',
    category: 'background',
    description: 'Electric synthwave grid floor fading into a deep obsidian sky with neon cyan horizon lighting.',
    tagline: 'Neon perspective grid floor',
    badge: 'Retro',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['technology', 'gaming', 'creative'],
    tags: ['cyber', 'grid', 'neon', 'synthwave'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Cyber Neon Grid',
        styles: {
          backgroundColor: '#05050f',
          backgroundImage: 'linear-gradient(to bottom, #05050f 0%, rgba(6, 182, 212, 0.15) 60%, rgba(236, 72, 153, 0.25) 100%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Neon Box',
            styles: { maxWidth: '780px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Next-Gen Cyber Infrastructure' }, styles: { fontSize: '44px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'High-energy neon atmosphere designed for tech-forward launches.' }, styles: { fontSize: '17px', color: '#38bdf8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 4. Dark Nebula Particles
  {
    id: 'background-dark-nebula-particles',
    name: 'Dark Nebula Particles',
    type: 'background',
    category: 'background',
    description: 'Deep cosmic indigo nebula clouds with scattered star points and ambient purple glow.',
    tagline: 'Deep space cosmic nebula',
    badge: 'Atmosphere',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['technology', 'creative', 'saas'],
    tags: ['nebula', 'space', 'cosmos', 'particles'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Dark Nebula',
        styles: {
          backgroundColor: '#030308',
          backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(147, 51, 234, 0.25) 0%, transparent 50%), radial-gradient(circle at 25% 75%, rgba(79, 70, 229, 0.2) 0%, transparent 50%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nebula Frame',
            styles: { maxWidth: '750px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Beyond the Known Horizon' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Galactic atmosphere crafted for exploratory and visionary ventures.' }, styles: { fontSize: '16px', color: '#c4b5fd' } }),
            ],
          }),
        ],
      });
    },
  },

  // 5. Glassmorphism Blur Backdrop
  {
    id: 'background-glassmorphism-blur',
    name: 'Glassmorphism Blur Backdrop',
    type: 'background',
    category: 'background',
    description: 'Multi-layer frosted glass backdrop with subtle refraction borders and ambient color bleeding.',
    tagline: 'Frosted glassmorphism background',
    badge: 'Glass',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'subtle',
    industry: ['saas', 'agency', 'luxury'],
    tags: ['glass', 'blur', 'frosted', 'minimal'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Glassmorphism Blur',
        styles: {
          backgroundColor: '#0a0a14',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.18) 0%, transparent 70%)',
          padding: { top: '100px', right: '28px', bottom: '100px', left: '28px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Frosted Container',
            styles: { maxWidth: '800px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '24px', padding: { top: '48px', right: '36px', bottom: '48px', left: '36px' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Tactile Glass Clarity' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Pure optical depth blending foreground and background seamlessly.' }, styles: { fontSize: '16px', color: '#cbd5e1' } }),
            ],
          }),
        ],
      });
    },
  },

  // 6. Spotlight Radial Glow
  {
    id: 'background-spotlight-radial-glow',
    name: 'Spotlight Radial Glow',
    type: 'background',
    category: 'background',
    description: 'High-contrast focused lighting spotlight directed from the upper ceiling onto the stage.',
    tagline: 'Top-down spotlight stage',
    badge: 'Focus',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'static',
    industry: ['creative', 'product', 'luxury'],
    tags: ['spotlight', 'radial', 'glow', 'lighting'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Spotlight Glow',
        styles: {
          backgroundColor: '#040407',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.22) 0%, rgba(124, 58, 237, 0.1) 40%, transparent 70%)',
          padding: { top: '110px', right: '24px', bottom: '110px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Spotlight Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Center Stage Precision' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Directing visitor gaze with mathematical luminosity balance.' }, styles: { fontSize: '16px', color: '#a1a1aa' } }),
            ],
          }),
        ],
      });
    },
  },

  // 7. Ocean Wave Gradient
  {
    id: 'background-ocean-wave-gradient',
    name: 'Ocean Wave Gradient',
    type: 'background',
    category: 'background',
    description: 'Deep maritime gradient shifting from abyssal navy into vivid cyan-teal highlights.',
    tagline: 'Deep oceanic teal gradient',
    badge: 'Maritime',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'subtle',
    industry: ['saas', 'health', 'technology'],
    tags: ['ocean', 'wave', 'teal', 'cyan', 'blue'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Ocean Wave',
        styles: {
          backgroundColor: '#061325',
          backgroundImage: 'linear-gradient(135deg, #061325 0%, #0d3b66 50%, #0077b6 100%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Wave Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Fluid Stability at Depth' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Calm and steady maritime color palettes build user trust and credibility.' }, styles: { fontSize: '16px', color: '#90e0ef' } }),
            ],
          }),
        ],
      });
    },
  },

  // 8. Golden Horizon Sunset
  {
    id: 'background-golden-horizon-sunset',
    name: 'Golden Horizon Sunset',
    type: 'background',
    category: 'background',
    description: 'Warm obsidian and amber gold dusk gradient evoking evening golden hour radiance.',
    tagline: 'Warm golden hour dusk horizon',
    badge: 'Warmth',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'subtle',
    industry: ['hospitality', 'luxury', 'creative'],
    tags: ['gold', 'sunset', 'warm', 'amber', 'luxury'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Golden Horizon',
        styles: {
          backgroundColor: '#0a0805',
          backgroundImage: 'radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.15) 40%, #0a0805 85%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Gold Frame',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Warmth, Prestige & Craft' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Infuse high-end hospitality and luxury offerings with ambient sunset warmth.' }, styles: { fontSize: '16px', color: '#fde68a' } }),
            ],
          }),
        ],
      });
    },
  },

  // 9. Midnight Constellation
  {
    id: 'background-midnight-constellation',
    name: 'Midnight Constellation',
    type: 'background',
    category: 'background',
    description: 'Pitch black midnight sky with deep indigo edge vignettes for maximum high-contrast content popping.',
    tagline: 'Deep midnight indigo backdrop',
    badge: 'Midnight',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'static',
    industry: ['saas', 'technology', 'portfolio'],
    tags: ['midnight', 'dark', 'black', 'constellation'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Midnight',
        styles: {
          backgroundColor: '#020205',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #080814 0%, #020205 100%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Midnight Frame',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Midnight Contrast Standard' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Optimized for OLED displays with true zero-black levels.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 10. High-Tech Digital Matrix
  {
    id: 'background-high-tech-digital-matrix',
    name: 'High-Tech Digital Matrix',
    type: 'background',
    category: 'background',
    description: 'Emerald green phosphor accents across deep slate simulating advanced telemetry screens.',
    tagline: 'Terminal matrix telemetry background',
    badge: 'Telemetry',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['technology', 'security', 'saas'],
    tags: ['matrix', 'emerald', 'code', 'security'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Digital Matrix',
        styles: {
          backgroundColor: '#030806',
          backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Matrix Frame',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Encrypted Telemetry Grid' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Engineered for cybersecurity and high-throughput monitoring systems.' }, styles: { fontSize: '16px', color: '#6ee7b7' } }),
            ],
          }),
        ],
      });
    },
  },

  // 11. Abstract Fluid Wash
  {
    id: 'background-abstract-fluid-wash',
    name: 'Abstract Fluid Wash',
    type: 'background',
    category: 'background',
    description: 'Soft organic chromatic wash blending rose, violet, and electric blue hues.',
    tagline: 'Organic chromatic fluid backdrop',
    badge: 'Creative',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'creative',
    motionLevel: 'subtle',
    industry: ['creative', 'agency', 'events'],
    tags: ['fluid', 'chromatic', 'wash', 'abstract'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Fluid Wash',
        styles: {
          backgroundColor: '#07050e',
          backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(236, 72, 153, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.25) 0%, transparent 50%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Wash Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Artistic Fluid Dynamics' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Expressive gradient layers bringing warmth and personality to agency portfolios.' }, styles: { fontSize: '16px', color: '#fbcfe8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 12. Deep Purple Aura
  {
    id: 'background-deep-purple-aura',
    name: 'Deep Purple Aura',
    type: 'background',
    category: 'background',
    description: 'Royal violet atmospheric glow centered directly behind main content elements.',
    tagline: 'Royal purple centered aura',
    badge: 'Popular',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'subtle',
    industry: ['saas', 'creative', 'technology'],
    tags: ['purple', 'aura', 'glow', 'violet'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Purple Aura',
        styles: {
          backgroundColor: '#06050e',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 65%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Aura Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'The Signature SoloSpot Glow' }, styles: { fontSize: '44px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Rich violet light field elevating modern tech and creator platforms.' }, styles: { fontSize: '17px', color: '#ddd6fe' } }),
            ],
          }),
        ],
      });
    },
  },

  // 13. Carbon Fiber Monolith
  {
    id: 'background-carbon-fiber-monolith',
    name: 'Carbon Fiber Monolith',
    type: 'background',
    category: 'background',
    description: 'Industrial high-tensile matte charcoal backdrop with brushed titanium precision accents.',
    tagline: 'Matte carbon industrial texture',
    badge: 'Carbon',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'static',
    industry: ['technology', 'automotive', 'product'],
    tags: ['carbon', 'industrial', 'matte', 'monolith'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Carbon Fiber',
        styles: {
          backgroundColor: '#08080a',
          backgroundImage: 'linear-gradient(45deg, #0b0b0e 25%, transparent 25%), linear-gradient(-45deg, #0b0b0e 25%, transparent 25%)',
          backgroundSize: '8px 8px',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Carbon Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Precision Carbon Matrix' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Subtle micro-grid texture conveys durability, precision, and engineering excellence.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 14. Emerald Luxury Marble
  {
    id: 'background-emerald-luxury-marble',
    name: 'Emerald Luxury Marble',
    type: 'background',
    category: 'background',
    description: 'Rich dark imperial emerald with gold specular highlights designed for premium brands.',
    tagline: 'Imperial emerald marble background',
    badge: 'Imperial',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'luxury',
    motionLevel: 'subtle',
    industry: ['luxury', 'hospitality', 'finance'],
    tags: ['emerald', 'marble', 'luxury', 'jade'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Emerald Marble',
        styles: {
          backgroundColor: '#02100a',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.22) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(5, 150, 105, 0.15) 0%, transparent 60%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Emerald Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Imperial Emerald Reserve' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Conveys prosperity, heritage, and quiet luxury.' }, styles: { fontSize: '16px', color: '#a7f3d0' } }),
            ],
          }),
        ],
      });
    },
  },

  // 15. Retro Grid Synthwave
  {
    id: 'background-retro-grid-synthwave',
    name: 'Retro Grid Synthwave',
    type: 'background',
    category: 'background',
    description: 'Nostalgic 1980s synthwave horizon with horizontal sunset banding.',
    tagline: 'Outrun retro synthwave atmosphere',
    badge: 'Synthwave',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'playful',
    motionLevel: 'subtle',
    industry: ['creative', 'gaming', 'events'],
    tags: ['synthwave', 'retro', '80s', 'outrun'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Retro Synthwave',
        styles: {
          backgroundColor: '#0a0217',
          backgroundImage: 'linear-gradient(180deg, #0a0217 0%, rgba(217, 70, 239, 0.25) 50%, rgba(244, 63, 94, 0.35) 100%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Synth Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Neon Sunset Velocity' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'High-energy nostalgic aesthetic for events and gaming streams.' }, styles: { fontSize: '16px', color: '#f5d0fe' } }),
            ],
          }),
        ],
      });
    },
  },

  // 16. Architectural Studio Shadow
  {
    id: 'background-architectural-studio-shadow',
    name: 'Architectural Studio Shadow',
    type: 'background',
    category: 'background',
    description: 'Clean gallery grey with subtle linear shadow gradients simulating sunlight through floor-to-ceiling windows.',
    tagline: 'Window sunlight shadow gradient',
    badge: 'Gallery',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'minimal',
    motionLevel: 'static',
    industry: ['creative', 'portfolio', 'agency'],
    tags: ['studio', 'shadow', 'architecture', 'clean'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Studio Shadow',
        styles: {
          backgroundColor: '#09090b',
          backgroundImage: 'linear-gradient(115deg, #0f0f13 0%, #09090b 60%)',
          padding: { top: '110px', right: '28px', bottom: '110px', left: '28px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Studio Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Refined Monochromatic Light' }, styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Subtle shadow casting evokes high-end architectural atelier space.' }, styles: { fontSize: '16px', color: '#a1a1aa' } }),
            ],
          }),
        ],
      });
    },
  },

  // 17. Minimal Charcoal Grain
  {
    id: 'background-minimal-charcoal-grain',
    name: 'Minimal Charcoal Grain',
    type: 'background',
    category: 'background',
    description: 'Fine-grain matte charcoal canvas for high-focus editorial articles and case studies.',
    tagline: 'Matte charcoal editorial canvas',
    badge: 'Charcoal',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'dark',
    motionLevel: 'static',
    industry: ['portfolio', 'agency', 'creative'],
    tags: ['charcoal', 'grain', 'matte', 'editorial'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Charcoal Grain',
        styles: {
          backgroundColor: '#0c0c0f',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Charcoal Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Quiet Editorial Precision' }, styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Zero eye fatigue matte background optimized for extended reading sessions.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
        ],
      });
    },
  },

  // 18. Pristine Ice Frost
  {
    id: 'background-pristine-ice-frost',
    name: 'Pristine Ice Frost',
    type: 'background',
    category: 'background',
    description: 'Cold arctic glint gradient with crystalline cyan highlights.',
    tagline: 'Arctic crystalline frost backdrop',
    badge: 'Frost',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'subtle',
    industry: ['health', 'technology', 'saas'],
    tags: ['frost', 'ice', 'arctic', 'cyan'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Ice Frost',
        styles: {
          backgroundColor: '#040810',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.22) 0%, transparent 60%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Frost Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Crystalline Arctic Purity' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Crisp cold tones convey freshness, clinical precision, and computational speed.' }, styles: { fontSize: '16px', color: '#bae6fd' } }),
            ],
          }),
        ],
      });
    },
  },

  // 19. Quantum Geometric Mesh
  {
    id: 'background-quantum-geometric-mesh',
    name: 'Quantum Geometric Mesh',
    type: 'background',
    category: 'background',
    description: 'High-tech multi-frequency radial mesh with intersecting focal points.',
    tagline: 'Multi-frequency quantum mesh',
    badge: 'Quantum',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['technology', 'saas'],
    tags: ['quantum', 'mesh', 'geometry', 'network'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Quantum Mesh',
        styles: {
          backgroundColor: '#05050e',
          backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Quantum Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Multi-Node Quantum Architecture' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Decentralized interconnected node aesthetics for web3 and distributed systems.' }, styles: { fontSize: '16px', color: '#c7d2fe' } }),
            ],
          }),
        ],
      });
    },
  },

  // 20. Solar Flare Radiant
  {
    id: 'background-solar-flare-radiant',
    name: 'Solar Flare Radiant',
    type: 'background',
    category: 'background',
    description: 'Dramatic solar corona energy arc radiating from upper corner.',
    tagline: 'Solar corona flare illumination',
    badge: 'Solar',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'bold',
    motionLevel: 'animated',
    industry: ['creative', 'events', 'energy'],
    tags: ['solar', 'flare', 'radiant', 'energy'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Solar Flare',
        styles: {
          backgroundColor: '#080503',
          backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.35) 0%, rgba(234, 88, 12, 0.15) 45%, transparent 70%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Solar Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Uncapped Radiant Power' }, styles: { fontSize: '44px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'High-heat solar flare lighting conveying unstoppable forward momentum.' }, styles: { fontSize: '16px', color: '#fed7aa' } }),
            ],
          }),
        ],
      });
    },
  },

  // 21. Twilight Indigo Shimmer
  {
    id: 'background-twilight-indigo-shimmer',
    name: 'Twilight Indigo Shimmer',
    type: 'background',
    category: 'background',
    description: 'Soft evening twilight with balanced lavender and indigo ambient tones.',
    tagline: 'Evening twilight lavender shimmer',
    badge: 'Twilight',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'elegant',
    motionLevel: 'subtle',
    industry: ['creative', 'hospitality', 'agency'],
    tags: ['twilight', 'indigo', 'lavender', 'evening'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Twilight Shimmer',
        styles: {
          backgroundColor: '#070612',
          backgroundImage: 'linear-gradient(160deg, #070612 0%, #17152d 50%, #2e2a56 100%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Twilight Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Atmospheric Twilight Harmony' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'A soothing evening gradient designed for creative studios and boutique services.' }, styles: { fontSize: '16px', color: '#e0e7ff' } }),
            ],
          }),
        ],
      });
    },
  },

  // 22. Cyberpunk City Lights
  {
    id: 'background-cyberpunk-city-lights',
    name: 'Cyberpunk City Lights',
    type: 'background',
    category: 'background',
    description: 'Neon teal and hot pink rim lighting evoking rain-slicked nocturnal city streets.',
    tagline: 'Nocturnal metropolis neon rim lights',
    badge: 'Cyberpunk',
    source: 'builtin',
    schemaVersion: '2.0.0',
    contentVersion: '3.0.0',
    mood: 'futuristic',
    motionLevel: 'animated',
    industry: ['entertainment', 'gaming', 'creative'],
    tags: ['cyberpunk', 'city', 'neon', 'nocturnal'],
    capabilities: { gradient: true },
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Background: Cyberpunk Lights',
        styles: {
          backgroundColor: '#05030a',
          backgroundImage: 'radial-gradient(circle at 10% 90%, rgba(236, 72, 153, 0.35) 0%, transparent 50%), radial-gradient(circle at 90% 10%, rgba(20, 184, 166, 0.35) 0%, transparent 50%)',
          padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' },
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Cyber City Box',
            styles: { maxWidth: '720px', margin: { top: '0', right: 'auto', bottom: '0', left: 'auto' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Nocturnal Digital Metropolis' }, styles: { fontSize: '44px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Dual-frequency chromatic lighting simulating vibrant nocturnal life.' }, styles: { fontSize: '16px', color: '#fbcfe8' } }),
            ],
          }),
        ],
      });
    },
  },
];
