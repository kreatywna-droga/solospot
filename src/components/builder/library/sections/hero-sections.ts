import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem, SectionCategory } from '../SectionTemplatesData';

type HeroSection = SectionTemplateItem & { category: 'hero' };

export const heroSections: HeroSection[] = [
  {
    id: 'hero-centered',
    name: 'Centered Hero',
    category: 'hero',
    description: 'Strong centered headline with subtitle, dual CTA buttons, and subtle gradient background.',
    preview: 'bg-gradient-to-b from-[#8B5CF6]/[0.15] to-[#06060c] p-4 text-center',
    tags: ['centered', 'gradient', 'cta', 'minimal'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      const secId = generateNodeId('section');
      return createSectionNode({
        id: secId, type: 'section', label: 'Hero: Centered',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#090912', backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.25) 0%, transparent 70%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Hero Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The Future of Digital Commerce' }, styles: { fontSize: '48px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1.5px', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Build, scale, and optimize your online business with unprecedented speed and zero technical barriers.' }, styles: { fontSize: '18px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '620px' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Button Group', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: { top: '12px', right: '0px', bottom: '0px', left: '0px' } },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary CTA', props: { text: 'Start Free Trial', href: '#start' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Secondary CTA', props: { text: 'Watch Demo', href: '#demo' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontWeight: '600', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.12)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-split-image',
    name: 'Split Hero — Text + Image',
    category: 'hero',
    description: 'Two-column layout with headline, description, and CTA on the left, hero image on the right.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4 items-center',
    tags: ['split', 'image', 'two-column', 'business'],
    style: 'modern',
    industry: ['business', 'consulting', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Split Media',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#07070f' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Split Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '40px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Left Column', styles: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', width: '50%' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: '⚡ VERSION 2.0 NOW AVAILABLE' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.1)', padding: { top: '6px', right: '12px', bottom: '6px', left: '12px' }, borderRadius: '9999px', letterSpacing: '1px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Everything You Need to Sell More' }, styles: { fontSize: '42px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'An autonomous platform combining advanced creation studio, fast payments, and analytics in one seamless experience.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Build Your Store Free', href: '#register' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Right Column', styles: { width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Hero Image', props: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', alt: 'Platform Dashboard' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-video-ambient',
    name: 'Video Background Hero',
    category: 'hero',
    description: 'Dynamic video background with dark overlay and bold typography on the foreground.',
    preview: 'bg-black p-4 text-center',
    tags: ['video', 'ambient', 'fullscreen', 'cinematic'],
    style: 'cinematic',
    industry: ['creative', 'agency', 'photography'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Video Ambient',
        styles: { padding: { top: '110px', right: '24px', bottom: '110px', left: '24px' }, backgroundColor: '#000000', videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4', videoAutoplay: true, videoLoop: true, videoMuted: true, overlayColor: '#050508', overlayOpacity: 0.6, textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Video Hero Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '860px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Cinematic Headline', props: { text: 'Create Experiences That Delight Customers' }, styles: { fontSize: '54px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Explore', props: { text: 'Discover Possibilities', href: '#explore' }, styles: { backgroundColor: '#ffffff', color: '#000000', fontWeight: '800', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '9999px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-fullscreen-dark',
    name: 'Fullscreen Dark Hero',
    category: 'hero',
    description: 'Immersive fullscreen hero with dark gradient overlay and large typography.',
    preview: 'bg-gradient-to-br from-black to-[#1a0a2e] p-4 text-center',
    tags: ['fullscreen', 'dark', 'immersive', 'luxury'],
    style: 'dark',
    industry: ['luxury', 'fashion', 'architecture'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Fullscreen Dark',
        styles: { padding: { top: '120px', right: '24px', bottom: '120px', left: '24px' }, backgroundImage: 'linear-gradient(135deg, #000000 0%, #1a0a2e 50%, #0a0a14 100%)', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dark Hero Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'EXCLUSIVE COLLECTION 2026' }, styles: { fontSize: '12px', fontWeight: '700', color: '#a78bfa', letterSpacing: '3px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Redefine Your Aesthetic' }, styles: { fontSize: '60px', fontWeight: '900', lineHeight: '1.05', color: '#ffffff', letterSpacing: '-2px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Where timeless elegance meets bold contemporary vision.' }, styles: { fontSize: '18px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '500px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Explore Collection', href: '#collection' }, styles: { backgroundColor: '#ffffff', color: '#000000', fontWeight: '700', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '0px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-gradient-mesh',
    name: 'Gradient Mesh Hero',
    category: 'hero',
    description: 'Vibrant gradient mesh background with floating elements and modern typography.',
    preview: 'bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 p-4 text-center',
    tags: ['gradient', 'mesh', 'vibrant', 'startup'],
    style: 'bold',
    industry: ['startup', 'saas', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Gradient Mesh',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundImage: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 25%, #a855f7 50%, #d946ef 75%, #4c1d95 100%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Mesh Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Ship Faster Than Ever Before' }, styles: { fontSize: '52px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'The modern development platform that turns ideas into production-ready applications in minutes, not months.' }, styles: { fontSize: '18px', lineHeight: '1.6', color: 'rgba(255,255,255,0.85)', maxWidth: '600px' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Buttons', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Get Started', props: { text: 'Start Building Free', href: '#start' }, styles: { backgroundColor: '#ffffff', color: '#4c1d95', fontWeight: '800', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Docs', props: { text: 'Read Documentation', href: '#docs' }, styles: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: '600', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.3)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-split-reverse',
    name: 'Split Hero — Image Left',
    category: 'hero',
    description: 'Reversed split layout with large hero image on left and content on right.',
    preview: 'bg-[#080812] p-4 flex gap-4 items-center',
    tags: ['split', 'image-left', 'two-column'],
    style: 'modern',
    industry: ['technology', 'saas', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Split Reversed',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#080812' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Split Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Image Column', styles: { width: '55%', display: 'flex', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Hero Image', props: { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80', alt: 'Team collaboration' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Content Column', styles: { width: '45%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'TRUSTED BY 10,000+ TEAMS' }, styles: { fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '1.5px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Collaborate Better, Ship Faster' }, styles: { fontSize: '40px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Streamline your workflow with real-time collaboration, automated deployments, and integrated monitoring.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Free Trial', href: '#trial' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-minimal-white',
    name: 'Minimal White Hero',
    category: 'hero',
    description: 'Clean white background with refined typography and subtle accents.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'white', 'clean', 'elegant'],
    style: 'minimal',
    industry: ['architecture', 'interior-design', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Minimal White',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundColor: '#ffffff', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '720px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Design That Speaks for Itself' }, styles: { fontSize: '48px', fontWeight: '800', lineHeight: '1.15', color: '#111827', letterSpacing: '-1px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'We craft architectural experiences that blend form and function into spaces that inspire.' }, styles: { fontSize: '17px', lineHeight: '1.7', color: '#6b7280', maxWidth: '540px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'View Our Work', href: '#portfolio' }, styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '8px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-editorial',
    name: 'Editorial Hero',
    category: 'hero',
    description: 'Magazine-style hero with asymmetric layout and editorial typography.',
    preview: 'bg-[#f5f0eb] p-4 text-left',
    tags: ['editorial', 'magazine', 'asymmetric', 'fashion'],
    style: 'editorial',
    industry: ['fashion', 'magazine', 'editorial'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Editorial',
        styles: { padding: { top: '80px', right: '40px', bottom: '80px', left: '40px' }, backgroundColor: '#f5f0eb' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Editorial Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '40px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Text Column', styles: { width: '45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Issue', props: { text: 'ISSUE 47 — SPRING 2026' }, styles: { fontSize: '11px', fontWeight: '700', color: '#9a3412', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The Art of Living Well' }, styles: { fontSize: '44px', fontWeight: '800', lineHeight: '1.15', color: '#1c1917', letterSpacing: '-0.5px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Exploring the intersection of design, culture, and the modern lifestyle through the lens of visionary creators.' }, styles: { fontSize: '16px', lineHeight: '1.7', color: '#57534e' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Read More', props: { text: 'Read the Story', href: '#story' }, styles: { backgroundColor: '#1c1917', color: '#ffffff', fontWeight: '600', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '0px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Image Column', styles: { width: '55%', display: 'flex', alignItems: 'stretch' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Editorial Image', props: { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80', alt: 'Fashion editorial' }, styles: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-product-showcase',
    name: 'Product Showcase Hero',
    category: 'hero',
    description: 'Product-focused hero with large product image, specs, and purchase CTA.',
    preview: 'bg-gradient-to-b from-[#0c0c1d] to-[#06060c] p-4 text-center',
    tags: ['product', 'ecommerce', 'showcase'],
    style: 'modern',
    industry: ['ecommerce', 'technology', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Product Showcase',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundImage: 'linear-gradient(180deg, #0c0c1d 0%, #06060c 100%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Product Hero', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'New Badge', props: { text: 'NEW RELEASE' }, styles: { fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '2px', backgroundColor: 'rgba(34,197,94,0.1)', padding: { top: '6px', right: '16px', bottom: '6px', left: '16px' }, borderRadius: '9999px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Product Name', props: { text: 'ProHeadphones Ultra' }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Tagline', props: { text: 'Immersive sound. Zero compromise. 48-hour battery.' }, styles: { fontSize: '18px', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Product Image', props: { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Headphones' }, styles: { width: '100%', maxWidth: '500px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' }, borderRadius: '20px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Buy Now', props: { text: 'Order Now — $299', href: '#buy' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-split-gradient',
    name: 'Split Hero — Gradient Overlay',
    category: 'hero',
    description: 'Full-width hero image with gradient overlay from left, text and CTA on overlay.',
    preview: 'bg-gradient-to-r from-violet-950 to-transparent p-4',
    tags: ['split', 'gradient', 'image', 'overlay'],
    style: 'bold',
    industry: ['real-estate', 'automotive', 'luxury'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Gradient Split',
        styles: { padding: { top: '100px', right: '40px', bottom: '100px', left: '60px' }, backgroundImage: 'linear-gradient(to right, #1e0533 0%, rgba(30,5,51,0.95) 40%, rgba(30,5,51,0.6) 70%, transparent 100%), url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', maxWidth: '500px' },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Find Your Dream Home' }, styles: { fontSize: '46px', fontWeight: '800', lineHeight: '1.15', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Premium properties in the most sought-after locations. Expert guidance from search to closing.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: 'rgba(255,255,255,0.75)' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Browse Properties', href: '#properties' }, styles: { backgroundColor: '#f59e0b', color: '#000000', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '8px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-asymmetric',
    name: 'Asymmetric Hero',
    category: 'hero',
    description: 'Off-center layout with overlapping elements and creative typography.',
    preview: 'bg-[#0a0a14] p-4 text-left',
    tags: ['asymmetric', 'creative', 'overlapping'],
    style: 'creative',
    industry: ['creative', 'agency', 'art'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Asymmetric',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundColor: '#0a0a14', position: 'relative' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Asymmetric Layout', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '60px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Left Content', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'We Don\'t Follow Trends — We Set Them' }, styles: { fontSize: '44px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff', letterSpacing: '-1px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'A creative studio at the intersection of technology and artistry. We build brands that leave lasting impressions.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'See Our Work', href: '#work' }, styles: { backgroundColor: '#ec4899', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '9999px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Right Media', styles: { width: '50%', display: 'flex', gap: '16px', alignItems: 'flex-start' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image 1', props: { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', alt: 'Creative work 1' }, styles: { width: '55%', borderRadius: '16px', marginTop: '40px' } }),
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image 2', props: { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', alt: 'Creative work 2' }, styles: { width: '45%', borderRadius: '16px', marginTop: '-20px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-countdown',
    name: 'Countdown Hero',
    category: 'hero',
    description: 'Event or launch hero with countdown timer style and urgency messaging.',
    preview: 'bg-[#0c0c1d] p-4 text-center',
    tags: ['countdown', 'event', 'launch', 'urgency'],
    style: 'bold',
    industry: ['events', 'startup', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Countdown',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.2) 0%, transparent 70%), #0c0c1d', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Countdown Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'LAUNCHING MARCH 15, 2026' }, styles: { fontSize: '12px', fontWeight: '700', color: '#ec4899', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Something Big Is Coming' }, styles: { fontSize: '52px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Be the first to experience the next generation of digital creation tools. Join the waitlist for exclusive early access.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Timer Blocks', styles: { display: 'flex', gap: '16px', justifyContent: 'center' },
                children: ['42', '08', '15', '33'].map((val, i) => createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Timer ${['Days','Hours','Minutes','Seconds'][i]}`, styles: { width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' },
                  children: [
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: val }, styles: { fontSize: '28px', fontWeight: '800', color: '#ffffff' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label', props: { text: ['Days','Hours','Min','Sec'][i] }, styles: { fontSize: '10px', color: '#64748b', fontWeight: '600' } }),
                  ],
                })),
              }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Join Waitlist', props: { text: 'Join the Waitlist', href: '#waitlist' }, styles: { backgroundColor: '#ec4899', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '9999px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-testimonial',
    name: 'Testimonial Hero',
    category: 'hero',
    description: 'Hero featuring a large customer quote with star rating and attribution.',
    preview: 'bg-[#090912] p-4 text-center',
    tags: ['testimonial', 'quote', 'social-proof', 'trust'],
    style: 'modern',
    industry: ['saas', 'consulting', 'business'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Testimonial',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundColor: '#090912', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Testimonial Hero', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '24px', color: '#fbbf24' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Quote', props: { text: '"This platform increased our conversion rate by 340% in just three months."' }, styles: { fontSize: '32px', fontWeight: '700', lineHeight: '1.3', color: '#ffffff', fontStyle: 'italic' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author', props: { text: 'Sarah Chen — VP of Marketing, TechCorp' }, styles: { fontSize: '14px', color: '#a78bfa', fontWeight: '600' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'See Results Like These', href: '#results' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'hero-stats',
    name: 'Stats Hero',
    category: 'hero',
    description: 'Data-driven hero with large statistics numbers and supporting text.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['stats', 'data', 'numbers', 'social-proof'],
    style: 'modern',
    industry: ['technology', 'saas', 'finance'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Hero: Stats',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#0a0a14', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stats Hero', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', maxWidth: '1000px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The Numbers Speak for Themselves' }, styles: { fontSize: '42px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stats Grid', styles: { display: 'flex', gap: '40px', justifyContent: 'center' },
                children: [
                  { num: '10K+', label: 'Active Users' },
                  { num: '99.9%', label: 'Uptime' },
                  { num: '340%', label: 'Avg. ROI' },
                  { num: '< 500ms', label: 'Load Time' },
                ].map(s => createBuilderNode({ id: generateNodeId('container'), type: 'container', label: s.label, styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '160px' },
                  children: [
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Stat Number', props: { text: s.num }, styles: { fontSize: '36px', fontWeight: '900', color: '#7c3aed' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stat Label', props: { text: s.label }, styles: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' } }),
                  ],
                })),
              }),
            ],
          }),
        ],
      });
    },
  },
];
