import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type TestimonialSection = SectionTemplateItem & { category: 'testimonials' };

export const testimonialSections: TestimonialSection[] = [
  {
    id: 'testimonials-cards',
    name: 'Testimonials: 3 Star Cards',
    category: 'testimonials',
    description: 'Three testimonial cards with star ratings, author avatars, and attribution details.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['cards', 'stars', 'social-proof'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      const secId = generateNodeId('section');
      const gridId = generateNodeId('container');
      const testimonials = [
        { name: 'Sarah Mitchell', role: 'CTO, Brightwave', quote: '"This platform transformed our entire development workflow. We shipped 3x faster in the first quarter alone."', avatar: 'https://i.pravatar.cc/80?img=1' },
        { name: 'David Park', role: 'Founder, Nexora', quote: '"The best investment we made this year. Our team productivity increased by 280% after onboarding."', avatar: 'https://i.pravatar.cc/80?img=3' },
        { name: 'Emily Rodriguez', role: 'VP Engineering, Strata', quote: '"Incredible reliability and speed. We haven\'t had a single deployment issue in eight months."', avatar: 'https://i.pravatar.cc/80?img=5' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Testimonials: Cards',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'TESTIMONIALS' }, styles: { fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Loved by Teams Worldwide' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'See why thousands of teams choose us to power their growth.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: gridId, type: 'container', label: 'Cards Grid', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: testimonials.map((t) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Testimonial: ${t.name}`, styles: { width: '33.33%', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '18px', color: '#fbbf24' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: t.quote }, styles: { fontSize: '15px', lineHeight: '1.6', color: '#e2e8f0', fontStyle: 'italic' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author Row', styles: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Avatar', props: { src: t.avatar, alt: t.name }, styles: { width: '44px', height: '44px', borderRadius: '9999px' } }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author Info', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: t.name }, styles: { fontSize: '14px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: t.role }, styles: { fontSize: '12px', color: '#94a3b8' } }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-carousel',
    name: 'Testimonials: Single Carousel',
    category: 'testimonials',
    description: 'Single large testimonial display with dot navigation indicators.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['carousel', 'single', 'large'],
    style: 'modern',
    industry: ['saas', 'consulting', 'business'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Carousel',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Carousel Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote Icon', props: { text: '❝' }, styles: { fontSize: '60px', color: '#7c3aed', lineHeight: '1' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Quote', props: { text: '"Switching to this platform was the single best decision we made last year. Revenue grew 4x within six months."' }, styles: { fontSize: '28px', fontWeight: '700', lineHeight: '1.4', color: '#ffffff', fontStyle: 'italic' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '20px', color: '#fbbf24' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author Name', props: { text: 'James Whitfield' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author Role', props: { text: 'CEO, Horizon Digital' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dots', styles: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dot Active', styles: { width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: '#7c3aed' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dot 2', styles: { width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.15)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dot 3', styles: { width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.15)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-grid-4',
    name: 'Testimonials: 4-Card Grid',
    category: 'testimonials',
    description: 'Four compact testimonial cards in a 2x2 grid layout with quotes and names.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['grid', '4-cards', 'compact'],
    style: 'modern',
    industry: ['technology', 'startup', 'ecommerce'],
    createNode: () => {
      const testimonials = [
        { name: 'Olivia Chen', role: 'Product Lead', quote: '"Effortless to set up and a joy to use daily. Our entire team adopted it within a week."' },
        { name: 'Marcus Brown', role: 'Head of Growth', quote: '"The analytics alone are worth the price. We finally have visibility into what actually converts."' },
        { name: 'Lisa Andersen', role: 'Creative Director', quote: '"Beautiful interface, rock-solid performance. It feels like it was designed specifically for us."' },
        { name: 'Raj Patel', role: 'Engineering Manager', quote: '"We cut our infrastructure costs by 60% while improving load times across all our properties."' },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Grid 4',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'What Our Customers Say' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Real feedback from real teams building the future.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Grid 2x2', styles: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', maxWidth: '1000px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: testimonials.map((t) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Quote: ${t.name}`, styles: { width: 'calc(50% - 10px)', padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '14px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '16px', color: '#fbbf24' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: t.quote }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author', props: { text: `${t.name} — ${t.role}` }, styles: { fontSize: '12px', fontWeight: '600', color: '#a78bfa', marginTop: '4px' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-minimal',
    name: 'Testimonials: Minimal Quotes',
    category: 'testimonials',
    description: 'Clean minimal testimonial quotes on white background with subtle styling.',
    preview: 'bg-white p-4 flex gap-2',
    tags: ['minimal', 'white', 'clean'],
    style: 'minimal',
    industry: ['consulting', 'architecture', 'legal'],
    createNode: () => {
      const testimonials = [
        { quote: '"Their attention to detail and commitment to quality exceeded every expectation we had."', name: 'Catherine Wells', role: 'Partner, Wells & Associates' },
        { quote: '"Professional, responsive, and incredibly skilled. They delivered a product that truly represents our brand."', name: 'Thomas Grant', role: 'Director, Grant Media' },
        { quote: '"From concept to launch, the experience was seamless. We saw measurable results within the first month."', name: 'Natalie Brooks', role: 'Marketing Lead, Elevate Co.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Minimal',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#ffffff', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', maxWidth: '500px', margin: { top: '0px', right: 'auto', bottom: '56px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Client Stories' }, styles: { fontSize: '36px', fontWeight: '800', color: '#111827' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Trusted by industry leaders worldwide.' }, styles: { fontSize: '16px', color: '#6b7280' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Quotes List', styles: { display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: testimonials.map((t) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Quote: ${t.name}`, styles: { display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', paddingBottom: '40px', borderWidth: '0px', borderBottomWidth: '1px', borderColor: '#e5e7eb' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: t.quote }, styles: { fontSize: '18px', lineHeight: '1.6', color: '#1f2937', fontStyle: 'italic' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author Row', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: t.name }, styles: { fontSize: '15px', fontWeight: '700', color: '#111827' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: t.role }, styles: { fontSize: '13px', color: '#9ca3af' } }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-video',
    name: 'Testimonials: Video Quote',
    category: 'testimonials',
    description: 'Video testimonial with dark overlay, play button, and text description beside it.',
    preview: 'bg-[#06060c] p-4 flex gap-4',
    tags: ['video', 'media', 'large'],
    style: 'cinematic',
    industry: ['creative', 'agency', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Video',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Split Layout', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Video Side', styles: { width: '55%', position: 'relative', borderRadius: '20px', overflow: 'hidden' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Video Thumbnail', props: { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80', alt: 'Video testimonial' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Play Button', styles: { position: 'absolute', top: '50%', left: '50%', width: '72px', height: '72px', borderRadius: '9999px', backgroundColor: 'rgba(124, 58, 237, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Play Icon', props: { text: '▶' }, styles: { fontSize: '24px', color: '#ffffff', marginLeft: '4px' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Text Side', styles: { width: '45%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'VIDEO TESTIMONIAL' }, styles: { fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '20px', color: '#fbbf24' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Quote', props: { text: '"The onboarding was so smooth, we were live in under 48 hours. No other platform comes close."' }, styles: { fontSize: '24px', fontWeight: '700', lineHeight: '1.4', color: '#ffffff', fontStyle: 'italic' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author', props: { text: 'Jessica Lane — VP Operations, CloudSync' }, styles: { fontSize: '14px', color: '#a78bfa', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Watch Full Video', props: { text: 'Watch Full Video', href: '#video' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontWeight: '600', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.12)', marginTop: '8px', alignSelf: 'flex-start' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-sidebar',
    name: 'Testimonials: Sidebar with Image',
    category: 'testimonials',
    description: 'Sidebar layout with author photo on left and testimonial quote and details on right.',
    preview: 'bg-[#06060c] p-4 flex gap-3',
    tags: ['sidebar', 'image', 'portrait'],
    style: 'modern',
    industry: ['consulting', 'finance', 'business'],
    createNode: () => {
      const testimonials = [
        { name: 'Robert Dawson', role: 'CFO, Vertex Capital', quote: '"A game-changer for our financial reporting. We save 20+ hours every month on manual reconciliation."', avatar: 'https://i.pravatar.cc/80?img=8' },
        { name: 'Sophia Laurent', role: 'Director, Atlas Partners', quote: '"Reliable, scalable, and the support team is phenomenal. They treat us like a true partner."', avatar: 'https://i.pravatar.cc/80?img=9' },
        { name: 'Kevin Hartley', role: 'CEO, Pinnacle Group', quote: '"We evaluated 12 solutions. This was the clear winner. Three years later, still the right choice."', avatar: 'https://i.pravatar.cc/80?img=11' },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Sidebar',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Trusted by Industry Leaders' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Hear from the people who rely on us every day.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Sidebar List', styles: { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: testimonials.map((t) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Testimonial: ${t.name}`, styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', padding: { top: '24px', right: '28px', bottom: '24px', left: '28px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Avatar', props: { src: t.avatar, alt: t.name }, styles: { width: '64px', height: '64px', borderRadius: '9999px', flexShrink: '0' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Content', styles: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '16px', color: '#fbbf24' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: t.quote }, styles: { fontSize: '15px', lineHeight: '1.5', color: '#e2e8f0', fontStyle: 'italic' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Author', props: { text: `${t.name} — ${t.role}` }, styles: { fontSize: '13px', fontWeight: '600', color: '#a78bfa' } }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-logo-quote',
    name: 'Testimonials: Company Logo + Quote',
    category: 'testimonials',
    description: 'Testimonials displayed with company logo placeholders, quote text, and author info.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['logo', 'corporate', 'brand'],
    style: 'modern',
    industry: ['enterprise', 'saas', 'b2b'],
    createNode: () => {
      const testimonials = [
        { company: 'ACME Corp', quote: '"Reduced our time-to-market by 60%. The team loved how intuitive the interface is."', name: 'Frank Morrison', role: 'CTO, ACME Corp' },
        { company: 'Zenith Labs', quote: '"Enterprise-grade security with startup-level agility. Exactly what we needed for compliance."', name: 'Diana Xu', role: 'Head of Engineering, Zenith Labs' },
        { company: 'NovaStar', quote: '"Our conversion rate jumped from 2.1% to 5.8% in the first quarter after implementation."', name: 'Peter Olsen', role: 'VP Marketing, NovaStar' },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Logo Quote',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Trusted by Leading Companies' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Join hundreds of organizations that rely on our platform.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Testimonials Row', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: testimonials.map((t) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Testimonial: ${t.company}`, styles: { width: '33.33%', padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Logo Placeholder', styles: { width: '80px', height: '32px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Logo Text', props: { text: t.company }, styles: { fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '16px', color: '#fbbf24' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: t.quote }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', fontStyle: 'italic' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: t.name }, styles: { fontSize: '13px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: t.role }, styles: { fontSize: '12px', color: '#94a3b8' } }),
                    ],
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'testimonials-featured',
    name: 'Testimonials: Featured Large',
    category: 'testimonials',
    description: 'One large featured testimonial with full-width layout and prominent author attribution.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['featured', 'large', 'hero-style'],
    style: 'bold',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Testimonials: Featured',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundColor: '#06060c', backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Featured Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '860px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote Mark', props: { text: '❝' }, styles: { fontSize: '72px', color: '#7c3aed', lineHeight: '1' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Featured Quote', props: { text: '"This isn\'t just a tool — it\'s a competitive advantage. Our team has never been more productive or more aligned."' }, styles: { fontSize: '32px', fontWeight: '700', lineHeight: '1.4', color: '#ffffff', fontStyle: 'italic' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Stars', props: { text: '★★★★★' }, styles: { fontSize: '22px', color: '#fbbf24' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author Card', styles: { display: 'flex', alignItems: 'center', gap: '16px', padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' }, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Avatar', props: { src: 'https://i.pravatar.cc/80?img=12', alt: 'Michael Torres' }, styles: { width: '56px', height: '56px', borderRadius: '9999px' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Author Info', styles: { display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: 'Michael Torres' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'CEO, ScaleUp Technologies' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
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
];
