import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type NewsletterSection = SectionTemplateItem & { category: 'newsletter' };

export const newsletterSections: NewsletterSection[] = [
  {
    id: 'newsletter-centered',
    name: 'Centered Newsletter',
    category: 'newsletter',
    description: 'Centered newsletter signup with headline, description, and email input with button.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['centered', 'email', 'signup', 'clean'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Newsletter: Centered',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0a0a14',
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Newsletter Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '560px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Stay in the Loop' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Get weekly insights on design, development, and growing your business. No spam, unsubscribe anytime.' }, styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '440px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Input Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '8px', width: '100%', maxWidth: '480px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email Input', props: { text: 'Enter your email' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#64748b', fontSize: '14px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '10px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'newsletter-split',
    name: 'Split Newsletter',
    category: 'newsletter',
    description: 'Two-column layout with newsletter content on the left and an image on the right.',
    preview: 'bg-[#0c0c1d] p-4 flex gap-4',
    tags: ['split', 'image', 'two-column', 'visual'],
    style: 'modern',
    industry: ['business', 'media', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Newsletter: Split',
        styles: {
          padding: { top: '80px', right: '40px', bottom: '80px', left: '40px' },
          backgroundColor: '#0c0c1d',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Split Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '60px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left - Content',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'NEWSLETTER' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Get Smarter Every Week' }, styles: { fontSize: '34px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Join 12,000+ professionals who receive curated insights on technology, leadership, and innovation every Friday.' }, styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Input Row',
                    styles: { display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'you@company.com' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#64748b', fontSize: '14px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Join Free', href: '#join' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '10px' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Social Proof', props: { text: '✓ No spam  ·  ✓ Unsubscribe anytime  ·  ✓ Free forever' }, styles: { fontSize: '12px', color: '#64748b', marginTop: '4px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right - Image',
                styles: { width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Newsletter Image', props: { src: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&q=80', alt: 'Newsletter' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'newsletter-minimal',
    name: 'Minimal Newsletter',
    category: 'newsletter',
    description: 'Clean inline newsletter with simple text input and subtle styling on white.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'inline', 'clean', 'white'],
    style: 'minimal',
    industry: ['architecture', 'design', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Newsletter: Minimal',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' },
          backgroundColor: '#f9fafb',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '500px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Subscribe to our newsletter' }, styles: { fontSize: '28px', fontWeight: '700', color: '#111827' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Weekly updates on design thinking and creative process.' }, styles: { fontSize: '14px', color: '#6b7280' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Input Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '8px', width: '100%', maxWidth: '440px', marginTop: '4px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'your@email.com' }, styles: { flex: '1', backgroundColor: '#ffffff', borderWidth: '1px', borderColor: '#d1d5db', borderRadius: '8px', padding: { top: '12px', right: '14px', bottom: '12px', left: '14px' }, color: '#9ca3af', fontSize: '14px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '600', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '8px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'newsletter-gradient',
    name: 'Gradient Newsletter',
    category: 'newsletter',
    description: 'Vibrant gradient background with bold headline and newsletter signup.',
    preview: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-center',
    tags: ['gradient', 'bold', 'colorful', 'vibrant'],
    style: 'bold',
    industry: ['startup', 'saas', 'creative'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Newsletter: Gradient',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Gradient Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '560px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Don\'t Miss a Thing' }, styles: { fontSize: '40px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Subscribe to our newsletter and be the first to know about new features, tips, and exclusive offers.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Input Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '8px', width: '100%', maxWidth: '480px', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'your@email.com' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.3)', borderRadius: '12px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#ffffff', fontSize: '14px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#ffffff', color: '#7c3aed', fontWeight: '800', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '12px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Note', props: { text: 'Join 8,000+ subscribers. Unsubscribe anytime.' }, styles: { fontSize: '12px', color: 'rgba(255,255,255,0.7)' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'newsletter-card',
    name: 'Newsletter Card',
    category: 'newsletter',
    description: 'Newsletter signup enclosed in a card with dark background and subtle border.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['card', 'contained', 'bordered', 'elegant'],
    style: 'modern',
    industry: ['technology', 'business', 'saas'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Newsletter: Card',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0a0a14',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Card Wrapper',
            styles: {
              maxWidth: '600px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderWidth: '1px',
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: { top: '48px', right: '40px', bottom: '48px', left: '40px' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Card Content',
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Icon', props: { text: '✉' }, styles: { fontSize: '36px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Join Our Newsletter' }, styles: { fontSize: '28px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Weekly curated content delivered straight to your inbox. Stay ahead of the curve.' }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '400px' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Input Row',
                    styles: { display: 'flex', flexDirection: 'row', gap: '8px', width: '100%', marginTop: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'Email address' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: { top: '12px', right: '14px', bottom: '12px', left: '14px' }, color: '#64748b', fontSize: '13px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '10px' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Privacy', props: { text: 'We respect your privacy. Unsubscribe at any time.' }, styles: { fontSize: '12px', color: '#475569', marginTop: '4px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
