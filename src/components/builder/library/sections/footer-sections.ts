import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type FooterSection = SectionTemplateItem & { category: 'footer' };

export const footerSections: FooterSection[] = [
  {
    id: 'footer-modern',
    name: 'Modern Footer',
    category: 'footer',
    description: 'Clean modern footer with brand, navigation links, and copyright.',
    preview: 'bg-[#090912] p-4 text-left',
    tags: ['modern', 'links', 'copyright', 'clean'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Modern',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '32px', left: '24px' },
          backgroundColor: '#090912',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Footer Layout',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              gap: '40px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Brand',
                styles: { display: 'flex', flexDirection: 'column', gap: '12px', width: '30%' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Tagline', props: { text: 'Building the future of digital experiences, one component at a time.' }, styles: { fontSize: '13px', lineHeight: '1.6', color: '#64748b' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Links',
                styles: { display: 'flex', gap: '48px' },
                children: [
                  {
                    title: 'Product',
                    items: ['Features', 'Pricing', 'Changelog', 'Documentation'],
                  },
                  {
                    title: 'Company',
                    items: ['About', 'Blog', 'Careers', 'Contact'],
                  },
                  {
                    title: 'Legal',
                    items: ['Privacy', 'Terms', 'Security'],
                  },
                ].map((col) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: col.title,
                    styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: col.title }, styles: { fontSize: '13px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' } }),
                      ...col.items.map((item) =>
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: item, props: { text: item }, styles: { fontSize: '13px', color: '#64748b' } })
                      ),
                    ],
                  })
                ),
              }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bottom Bar',
            styles: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1100px',
              margin: { top: '40px', right: 'auto', bottom: '0px', left: 'auto' },
              paddingTop: '24px',
              borderTopWidth: '1px',
              borderColor: 'rgba(255,255,255,0.06)',
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 WebFactor. All rights reserved.' }, styles: { fontSize: '12px', color: '#475569' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Social', props: { text: 'Twitter  ·  GitHub  ·  LinkedIn' }, styles: { fontSize: '12px', color: '#475569' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-columns',
    name: '4-Column Footer',
    category: 'footer',
    description: 'Four-column footer with brand, product, resources, and company links.',
    preview: 'bg-[#0c0c1d] p-4 text-left',
    tags: ['columns', 'four-column', 'detailed', 'links'],
    style: 'modern',
    industry: ['technology', 'saas', 'business'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: 4 Columns',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '32px', left: '24px' },
          backgroundColor: '#0c0c1d',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Columns Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Brand Column',
                styles: { width: '30%', display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'The modern platform for building, launching, and scaling digital products with confidence.' }, styles: { fontSize: '13px', lineHeight: '1.6', color: '#64748b' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Social', props: { text: 'Twitter  ·  GitHub  ·  LinkedIn  ·  YouTube' }, styles: { fontSize: '12px', color: '#a78bfa', marginTop: '8px' } }),
                ],
              }),
              ...[
                {
                  title: 'Product',
                  items: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
                },
                {
                  title: 'Resources',
                  items: ['Documentation', 'API Reference', 'Guides', 'Templates', 'Community'],
                },
                {
                  title: 'Company',
                  items: ['About Us', 'Blog', 'Careers', 'Press Kit', 'Contact'],
                },
              ].map((col) =>
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: col.title,
                  styles: { width: '23.3%', display: 'flex', flexDirection: 'column', gap: '10px' },
                  children: [
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: col.title }, styles: { fontSize: '13px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px', marginBottom: '4px' } }),
                    ...col.items.map((item) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: item, props: { text: item }, styles: { fontSize: '13px', color: '#64748b' } })
                    ),
                  ],
                })
              ),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bottom',
            styles: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1100px',
              margin: { top: '40px', right: 'auto', bottom: '0px', left: 'auto' },
              paddingTop: '24px',
              borderTopWidth: '1px',
              borderColor: 'rgba(255,255,255,0.06)',
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 WebFactor. All rights reserved.' }, styles: { fontSize: '12px', color: '#475569' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Legal', props: { text: 'Privacy Policy  ·  Terms of Service  ·  Cookie Policy' }, styles: { fontSize: '12px', color: '#475569' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-minimal',
    name: 'Minimal Footer',
    category: 'footer',
    description: 'Minimal centered footer with just logo, links, and copyright in a single row.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'centered', 'clean', 'white'],
    style: 'minimal',
    industry: ['architecture', 'design', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Minimal',
        styles: {
          padding: { top: '40px', right: '24px', bottom: '40px', left: '24px' },
          backgroundColor: '#f9fafb',
          textAlign: 'center',
          borderTopWidth: '1px',
          borderColor: '#e5e7eb',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Footer',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '600px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'Studio' }, styles: { fontSize: '18px', fontWeight: '700', color: '#111827' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Links',
                styles: { display: 'flex', gap: '24px' },
                children: ['Work', 'About', 'Services', 'Contact'].map((link) =>
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: link, props: { text: link }, styles: { fontSize: '13px', color: '#6b7280' } })
                ),
              }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 Studio. All rights reserved.' }, styles: { fontSize: '12px', color: '#9ca3af' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-dark',
    name: 'Dark Footer',
    category: 'footer',
    description: 'Dark footer with social media links, navigation, and contact info.',
    preview: 'bg-black p-4 text-left',
    tags: ['dark', 'social', 'navigation', 'bold'],
    style: 'dark',
    industry: ['creative', 'agency', 'media'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Dark',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '32px', left: '24px' },
          backgroundColor: '#000000',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.08)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Dark Footer Layout',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              gap: '40px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Brand + Social',
                styles: { width: '35%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'BLACKBOX' }, styles: { fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Creative studio pushing the boundaries of digital design and interactive experiences.' }, styles: { fontSize: '13px', lineHeight: '1.6', color: '#6b7280' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Social Links',
                    styles: { display: 'flex', gap: '16px', marginTop: '4px' },
                    children: ['Twitter', 'Instagram', 'Dribbble', 'GitHub'].map((social) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: social, props: { text: social }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } })
                    ),
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Navigation',
                styles: { display: 'flex', gap: '48px' },
                children: [
                  {
                    title: 'Studio',
                    items: ['About', 'Work', 'Services', 'Careers'],
                  },
                  {
                    title: 'Connect',
                    items: ['Contact', 'Blog', 'Newsletter', 'Support'],
                  },
                ].map((col) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: col.title,
                    styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: col.title }, styles: { fontSize: '12px', fontWeight: '700', color: '#ffffff', letterSpacing: '1.5px', marginBottom: '4px' } }),
                      ...col.items.map((item) =>
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: item, props: { text: item }, styles: { fontSize: '13px', color: '#6b7280' } })
                      ),
                    ],
                  })
                ),
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Contact',
                styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Get in Touch' }, styles: { fontSize: '12px', fontWeight: '700', color: '#ffffff', letterSpacing: '1.5px', marginBottom: '4px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'hello@blackbox.studio' }, styles: { fontSize: '13px', color: '#6b7280' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phone', props: { text: '+1 (323) 555-0199' }, styles: { fontSize: '13px', color: '#6b7280' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Location', props: { text: 'Los Angeles, CA' }, styles: { fontSize: '13px', color: '#6b7280' } }),
                ],
              }),
            ],
          }),
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bottom',
            styles: {
              display: 'flex',
              justifyContent: 'space-between',
              maxWidth: '1100px',
              margin: { top: '40px', right: 'auto', bottom: '0px', left: 'auto' },
              paddingTop: '24px',
              borderTopWidth: '1px',
              borderColor: 'rgba(255,255,255,0.06)',
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 Blackbox Studio. All rights reserved.' }, styles: { fontSize: '12px', color: '#374151' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Legal', props: { text: 'Privacy  ·  Terms' }, styles: { fontSize: '12px', color: '#374151' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-newsletter',
    name: 'Footer with Newsletter',
    category: 'footer',
    description: 'Footer with a newsletter signup area at the top and standard links below.',
    preview: 'bg-[#0a0a14] p-4 text-left',
    tags: ['newsletter', 'signup', 'email', 'integrated'],
    style: 'modern',
    industry: ['saas', 'technology', 'media'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Newsletter',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '32px', left: '24px' },
          backgroundColor: '#0a0a14',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Footer Layout',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Newsletter Banner',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                  borderRadius: '16px',
                  padding: { top: '32px', right: '32px', bottom: '32px', left: '32px' },
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Newsletter Info',
                    styles: { display: 'flex', flexDirection: 'column', gap: '6px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Subscribe to our newsletter' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Get the latest updates, articles, and resources delivered to your inbox.' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Input Row',
                    styles: { display: 'flex', flexDirection: 'row', gap: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'your@email.com' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '12px', right: '14px', bottom: '12px', left: '14px' }, color: '#64748b', fontSize: '13px', minWidth: '240px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '20px', bottom: '12px', left: '20px' }, borderRadius: '8px' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Links Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Brand',
                    styles: { display: 'flex', flexDirection: 'column', gap: '10px', width: '30%' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '18px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Modern tools for modern teams. Build better, faster.' }, styles: { fontSize: '13px', color: '#64748b', lineHeight: '1.5' } }),
                    ],
                  }),
                  ...[
                    { title: 'Product', items: ['Features', 'Pricing', 'Docs'] },
                    { title: 'Company', items: ['About', 'Blog', 'Careers'] },
                    { title: 'Legal', items: ['Privacy', 'Terms', 'Cookies'] },
                  ].map((col) =>
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: col.title,
                      styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                      children: [
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: col.title }, styles: { fontSize: '12px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' } }),
                        ...col.items.map((item) =>
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: item, props: { text: item }, styles: { fontSize: '13px', color: '#64748b' } })
                        ),
                      ],
                    })
                  ),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bottom',
                styles: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '24px',
                  borderTopWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 WebFactor. All rights reserved.' }, styles: { fontSize: '12px', color: '#374151' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Social', props: { text: 'Twitter  ·  GitHub  ·  LinkedIn' }, styles: { fontSize: '12px', color: '#374151' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-compact',
    name: 'Compact Footer',
    category: 'footer',
    description: 'Single-row compact footer with logo, links, and copyright in one line.',
    preview: 'bg-[#0c0c1d] p-4 text-center',
    tags: ['compact', 'single-row', 'minimal', 'tight'],
    style: 'modern',
    industry: ['technology', 'saas', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Compact',
        styles: {
          padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
          backgroundColor: '#0c0c1d',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Compact Footer',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '16px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Links',
                styles: { display: 'flex', gap: '20px' },
                children: ['Features', 'Pricing', 'Blog', 'Contact'].map((link) =>
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: link, props: { text: link }, styles: { fontSize: '12px', color: '#64748b' } })
                ),
              }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 WebFactor' }, styles: { fontSize: '12px', color: '#374151' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-full',
    name: 'Full Footer',
    category: 'footer',
    description: 'Full-featured footer with logo, columns, newsletter, social links, and copyright.',
    preview: 'bg-[#090912] p-4 text-left',
    tags: ['full', 'comprehensive', 'newsletter', 'social'],
    style: 'modern',
    industry: ['enterprise', 'technology', 'business'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Footer: Full',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '32px', left: '24px' },
          backgroundColor: '#090912',
          borderTopWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Full Footer Layout',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Top Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '40px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Brand + Newsletter',
                    styles: { width: '35%', display: 'flex', flexDirection: 'column', gap: '20px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Tagline', props: { text: 'The all-in-one platform for modern digital teams.' }, styles: { fontSize: '13px', color: '#64748b', lineHeight: '1.5' } }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Newsletter Mini',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'NL Title', props: { text: 'Stay updated' }, styles: { fontSize: '13px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({
                            id: generateNodeId('container'),
                            type: 'container',
                            label: 'NL Input',
                            styles: { display: 'flex', gap: '6px' },
                            children: [
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'Email address' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: { top: '8px', right: '10px', bottom: '8px', left: '10px' }, color: '#64748b', fontSize: '12px' } }),
                              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Go', props: { text: '→', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '8px', right: '12px', bottom: '8px', left: '12px' }, borderRadius: '6px', fontSize: '12px' } }),
                            ],
                          }),
                        ],
                      }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Social', props: { text: 'Twitter  ·  GitHub  ·  LinkedIn  ·  YouTube' }, styles: { fontSize: '12px', color: '#a78bfa', marginTop: '4px' } }),
                    ],
                  }),
                  ...[
                    { title: 'Product', items: ['Features', 'Pricing', 'Integrations', 'Changelog', 'API'] },
                    { title: 'Resources', items: ['Documentation', 'Guides', 'Templates', 'Community', 'Status'] },
                    { title: 'Company', items: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
                    { title: 'Legal', items: ['Privacy', 'Terms', 'Security', 'Cookies', 'Licenses'] },
                  ].map((col) =>
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: col.title,
                      styles: { width: '16.25%', display: 'flex', flexDirection: 'column', gap: '8px' },
                      children: [
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: col.title }, styles: { fontSize: '12px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px', marginBottom: '4px' } }),
                        ...col.items.map((item) =>
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: item, props: { text: item }, styles: { fontSize: '12px', color: '#64748b' } })
                        ),
                      ],
                    })
                  ),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Bottom Bar',
                styles: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '24px',
                  borderTopWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Copyright', props: { text: '© 2026 WebFactor. All rights reserved.' }, styles: { fontSize: '12px', color: '#374151' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Made with', props: { text: 'Made with ♥ for modern teams' }, styles: { fontSize: '12px', color: '#374151' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
