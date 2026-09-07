import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type CTASection = SectionTemplateItem & { category: 'cta' };

export const ctaSections: CTASection[] = [
  {
    id: 'cta-banner',
    name: 'CTA: Gradient Banner',
    category: 'cta',
    description: 'Eye-catching gradient banner with bold headline, subtitle, and action button.',
    preview: 'bg-gradient-to-r from-[#8B5CF6]/20 to-fuchsia-950/50 p-4 text-center',
    tags: ['banner', 'gradient', 'bold'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Banner',
        styles: { padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' }, backgroundColor: '#090914', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Card', styles: { padding: { top: '48px', right: '40px', bottom: '48px', left: '40px' }, borderRadius: '24px', backgroundImage: 'linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(217, 70, 239, 0.25) 100%)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Ready to Transform Your Business?' }, styles: { fontSize: '40px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Join 10,000+ teams already building the future. Start your free trial today — no credit card required.' }, styles: { fontSize: '17px', lineHeight: '1.6', color: '#e2e8f0', maxWidth: '560px' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Buttons', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary CTA', props: { text: 'Start Free Trial', href: '#start' }, styles: { backgroundColor: '#ffffff', color: '#000000', fontWeight: '800', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '12px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Secondary CTA', props: { text: 'Talk to Sales', href: '#sales' }, styles: { backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', fontWeight: '600', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.25)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-split',
    name: 'CTA: Split with Image',
    category: 'cta',
    description: 'Two-column CTA with compelling text on the left and an image on the right.',
    preview: 'bg-[#06060c] p-4 flex gap-4',
    tags: ['split', 'image', 'two-column'],
    style: 'modern',
    industry: ['business', 'consulting', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Split',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Split Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Text Side', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'GET STARTED TODAY' }, styles: { fontSize: '12px', fontWeight: '700', color: '#22c55e', letterSpacing: '1.5px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Stop Waiting. Start Building.' }, styles: { fontSize: '38px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Launch your project in minutes with our intuitive platform. Everything you need, nothing you don\'t.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stats Row', styles: { display: 'flex', gap: '32px', marginTop: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stat 1', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: '10K+' }, styles: { fontSize: '24px', fontWeight: '800', color: '#7c3aed' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label', props: { text: 'Active Users' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                        ],
                      }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stat 2', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: '99.9%' }, styles: { fontSize: '24px', fontWeight: '800', color: '#7c3aed' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label', props: { text: 'Uptime' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                        ],
                      }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Building Free', href: '#start' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px', marginTop: '8px', alignSelf: 'flex-start' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Image Side', styles: { width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'CTA Image', props: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', alt: 'Platform dashboard' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-minimal',
    name: 'CTA: Minimal White',
    category: 'cta',
    description: 'Clean minimal centered CTA on white background with refined typography.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'white', 'clean'],
    style: 'minimal',
    industry: ['consulting', 'architecture', 'legal'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Minimal',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#ffffff', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Let\'s Work Together' }, styles: { fontSize: '40px', fontWeight: '800', color: '#111827', lineHeight: '1.2' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Have a project in mind? We\'d love to hear about it. Reach out and let\'s create something extraordinary.' }, styles: { fontSize: '17px', lineHeight: '1.7', color: '#6b7280' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Buttons', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary', props: { text: 'Get in Touch', href: '#contact' }, styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '10px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Secondary', props: { text: 'View Portfolio', href: '#portfolio' }, styles: { backgroundColor: 'transparent', color: '#111827', fontWeight: '600', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '10px', borderWidth: '1px', borderColor: '#d1d5db' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-gradient',
    name: 'CTA: Vibrant Gradient',
    category: 'cta',
    description: 'Vibrant gradient background CTA with bold typography and contrasting button.',
    preview: 'bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900 p-4 text-center',
    tags: ['gradient', 'vibrant', 'bold'],
    style: 'bold',
    industry: ['startup', 'creative', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Gradient',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundImage: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 30%, #a855f7 60%, #d946ef 100%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'LIMITED TIME OFFER' }, styles: { fontSize: '12px', fontWeight: '700', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)', padding: { top: '6px', right: '16px', bottom: '6px', left: '16px' }, borderRadius: '9999px', letterSpacing: '1.5px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Unlock Your Potential Today' }, styles: { fontSize: '44px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Get 3 months free when you switch from any competitor. Offer ends soon.' }, styles: { fontSize: '18px', lineHeight: '1.5', color: 'rgba(255,255,255,0.85)' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Claim Your Discount', href: '#claim' }, styles: { backgroundColor: '#ffffff', color: '#4c1d95', fontWeight: '800', padding: { top: '16px', right: '40px', bottom: '16px', left: '40px' }, borderRadius: '12px', marginTop: '8px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-card',
    name: 'CTA: Bordered Card',
    category: 'cta',
    description: 'CTA inside a bordered card with subtle glow effect and centered content.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['card', 'bordered', 'glow'],
    style: 'modern',
    industry: ['technology', 'saas', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Card',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Card', styles: { padding: { top: '48px', right: '40px', bottom: '48px', left: '40px' }, borderRadius: '24px', borderWidth: '1px', borderColor: 'rgba(124, 58, 237, 0.3)', boxShadow: '0 0 80px rgba(124, 58, 237, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Icon', styles: { width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Icon Text', props: { text: '🚀' }, styles: { fontSize: '28px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Ready to Level Up?' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Experience the difference with a 14-day free trial. No commitments, cancel anytime.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '480px' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Your Free Trial', href: '#trial' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '12px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-newsletter',
    name: 'CTA: Newsletter Signup',
    category: 'cta',
    description: 'Newsletter signup CTA with email input field and subscribe button.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['newsletter', 'email', 'signup'],
    style: 'modern',
    industry: ['saas', 'media', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Newsletter',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Newsletter Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '560px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Icon', styles: { width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Icon', props: { text: '✉' }, styles: { fontSize: '24px', color: '#a78bfa' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Stay in the Loop' }, styles: { fontSize: '34px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Get weekly insights, product updates, and exclusive tips delivered straight to your inbox.' }, styles: { fontSize: '16px', lineHeight: '1.5', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Input Row', styles: { display: 'flex', flexDirection: 'row', gap: '0px', width: '100%', marginTop: '8px', borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Email Input', styles: { flex: '1', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '0px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Placeholder', props: { text: 'Enter your email address' }, styles: { fontSize: '15px', color: '#64748b' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '0px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Disclaimer', props: { text: 'No spam. Unsubscribe anytime. We respect your privacy.' }, styles: { fontSize: '12px', color: '#64748b' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-urgency',
    name: 'CTA: Urgency Countdown',
    category: 'cta',
    description: 'Urgency-driven CTA with countdown-style elements and scarcity messaging.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['urgency', 'countdown', 'scarcity'],
    style: 'bold',
    industry: ['ecommerce', 'saas', 'events'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Urgency',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Urgency Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: '⚡ ENDS IN 24 HOURS' }, styles: { fontSize: '12px', fontWeight: '700', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: { top: '6px', right: '16px', bottom: '6px', left: '16px' }, borderRadius: '9999px', letterSpacing: '1px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Don\'t Miss This Deal' }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff', lineHeight: '1.15' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Get 50% off all annual plans. This flash sale won\'t last — over 200 teams already claimed their discount.' }, styles: { fontSize: '17px', lineHeight: '1.5', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Countdown Blocks', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: ['23', '59', '47'].map((val, i) =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Timer ${['Hours','Minutes','Seconds'][i]}`, styles: { width: '72px', height: '72px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: val }, styles: { fontSize: '26px', fontWeight: '800', color: '#ef4444' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label', props: { text: ['HRS','MIN','SEC'][i] }, styles: { fontSize: '10px', fontWeight: '600', color: '#64748b' } }),
                    ],
                  })
                ),
              }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Claim 50% Off Now', href: '#claim' }, styles: { backgroundColor: '#ef4444', color: '#ffffff', fontWeight: '800', padding: { top: '16px', right: '40px', bottom: '16px', left: '40px' }, borderRadius: '12px', marginTop: '4px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtext', props: { text: 'No credit card required. 30-day money-back guarantee.' }, styles: { fontSize: '13px', color: '#64748b' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'cta-image-bg',
    name: 'CTA: Background Image Overlay',
    category: 'cta',
    description: 'CTA with background image, dark gradient overlay, and centered text content.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['image-bg', 'overlay', 'cinematic'],
    style: 'cinematic',
    industry: ['creative', 'agency', 'real-estate'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'CTA: Image Background',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%), url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '680px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'JOIN 500+ COMPANIES' }, styles: { fontSize: '12px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The Future of Work Starts Here' }, styles: { fontSize: '44px', fontWeight: '900', lineHeight: '1.15', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Empower your team with the tools they need to collaborate, innovate, and deliver exceptional results.' }, styles: { fontSize: '17px', lineHeight: '1.6', color: 'rgba(255,255,255,0.75)' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Buttons', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary', props: { text: 'Start Free Trial', href: '#start' }, styles: { backgroundColor: '#ffffff', color: '#000000', fontWeight: '800', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '12px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Secondary', props: { text: 'Watch Demo', href: '#demo' }, styles: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', fontWeight: '600', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.25)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
