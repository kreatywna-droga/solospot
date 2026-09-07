import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type FeatureSection = SectionTemplateItem & { category: 'features' };

export const featureSections: FeatureSection[] = [
  // 1. features-3-cards
  {
    id: 'features-3-cards',
    name: 'Features: 3 Icon Cards',
    category: 'features',
    badge: 'Popular',
    description: 'Three feature cards with large emoji icons, titles, and descriptions on a dark background.',
    preview: 'bg-[#06060c] p-4 flex gap-2 justify-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const cardsGrid = generateNodeId('container');

      const cards = [
        { icon: '⚡', title: 'Lightning Performance', desc: 'Optimized for Core Web Vitals with sub-500ms load times and instant page transitions.' },
        { icon: '🎨', title: 'Visual Editor 2.0', desc: 'Drag-and-drop interface with real-time previews, responsive controls, and pixel-perfect placement.' },
        { icon: '💳', title: 'Integrated Payments', desc: 'Accept cards, Apple Pay, Google Pay, and regional methods with automated invoicing.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: 3 Cards',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: headerCont,
            type: 'container',
            label: 'Section Header',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              maxWidth: '640px',
              margin: { top: '0px', right: 'auto', bottom: '52px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Badge',
                props: { text: 'POWERFUL FEATURES' },
                styles: {
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#a78bfa',
                  backgroundColor: 'rgba(167,139,250,0.1)',
                  padding: { top: '6px', right: '14px', bottom: '6px', left: '14px' },
                  borderRadius: '9999px',
                  letterSpacing: '1.5px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Section Title',
                props: { text: 'Everything you need to build stunning websites' },
                styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: '1.15' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Section Subtitle',
                props: { text: 'A complete toolkit designed to help you launch faster and scale without limits.' },
                styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '520px' },
              }),
            ],
          }),
          createBuilderNode({
            id: cardsGrid,
            type: 'container',
            label: 'Cards Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '24px',
              maxWidth: '1140px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: cards.map((card) =>
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: card.title,
                styles: {
                  width: '33.33%',
                  padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '16px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Card Icon',
                    props: { text: card.icon },
                    styles: { fontSize: '40px', fontWeight: '400', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Card Title',
                    props: { text: card.title },
                    styles: { fontSize: '19px', fontWeight: '700', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Card Description',
                    props: { text: card.desc },
                    styles: { fontSize: '14px', lineHeight: '1.55', color: '#94a3b8' },
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },

  // 2. features-4-grid
  {
    id: 'features-4-grid',
    name: 'Features: 2x2 Grid',
    category: 'features',
    description: 'Four feature cards in a 2x2 grid layout with subtle hover-ready backgrounds.',
    preview: 'bg-[#06060c] p-4 grid grid-cols-2 gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const outerCont = generateNodeId('container');
      const grid = generateNodeId('container');

      const features = [
        { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption, SSO, and role-based access controls.' },
        { icon: '📊', title: 'Advanced Analytics', desc: 'Real-time dashboards with funnel tracking, cohort analysis, and custom event reporting.' },
        { icon: '🌐', title: 'Global CDN', desc: 'Content delivered from 200+ edge locations worldwide for blazing fast page loads.' },
        { icon: '🔄', title: 'Auto Scaling', desc: 'Infrastructure scales automatically to handle traffic spikes without manual intervention.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: 4 Grid',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outerCont,
            type: 'container',
            label: 'Header + Grid Wrapper',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '1080px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              gap: '48px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Section Title',
                    props: { text: 'Built for modern teams' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Section Subtitle',
                    props: { text: 'Four pillars of reliability powering your digital presence.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: grid,
                type: 'container',
                label: '2x2 Grid - Top Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  width: '100%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Top Left',
                    styles: {
                      width: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                    },
                    children: features.slice(0, 2).map((f) =>
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: f.title,
                        styles: {
                          padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '14px',
                          borderWidth: '1px',
                          borderColor: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '12px',
                          textAlign: 'left',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Icon',
                            props: { text: f.icon },
                            styles: { fontSize: '28px', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Feature Title',
                            props: { text: f.title },
                            styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Feature Description',
                            props: { text: f.desc },
                            styles: { fontSize: '14px', lineHeight: '1.55', color: '#94a3b8' },
                          }),
                        ],
                      })
                    ),
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Top Right',
                    styles: {
                      width: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                    },
                    children: features.slice(2, 4).map((f) =>
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: f.title,
                        styles: {
                          padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '14px',
                          borderWidth: '1px',
                          borderColor: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '12px',
                          textAlign: 'left',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Icon',
                            props: { text: f.icon },
                            styles: { fontSize: '28px', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Feature Title',
                            props: { text: f.title },
                            styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Feature Description',
                            props: { text: f.desc },
                            styles: { fontSize: '14px', lineHeight: '1.55', color: '#94a3b8' },
                          }),
                        ],
                      })
                    ),
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 3. features-with-image
  {
    id: 'features-with-image',
    name: 'Features: List with Image',
    category: 'features',
    description: 'Feature checklist on the left with a large product screenshot on the right.',
    preview: 'bg-[#06060c] p-4 flex gap-3 items-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const grid = generateNodeId('container');

      const items = [
        { icon: '✓', text: 'Drag-and-drop page builder with 50+ pre-built sections' },
        { icon: '✓', text: 'SEO optimization tools with automated meta tags and sitemaps' },
        { icon: '✓', text: 'Built-in A/B testing to maximize conversion rates' },
        { icon: '✓', text: 'One-click deployment to global CDN with SSL certificates' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: List + Image',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
        },
        children: [
          createBuilderNode({
            id: grid,
            type: 'container',
            label: 'Split Layout',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '56px',
              maxWidth: '1140px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Features List',
                styles: {
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Badge',
                    props: { text: 'WHY CHOOSE US' },
                    styles: {
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#a78bfa',
                      letterSpacing: '1.5px',
                      margin: { top: '0px', right: '0px', bottom: '8px', left: '0px' },
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Section Title',
                    props: { text: 'A platform that grows with your ambition' },
                    styles: { fontSize: '34px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', margin: { top: '0px', right: '0px', bottom: '20px', left: '0px' } },
                  }),
                  ...items.map((item) =>
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: `Check: ${item.text.slice(0, 30)}`,
                      styles: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: { top: '10px', right: '0px', bottom: '10px', left: '0px' },
                      },
                      children: [
                        createBuilderNode({
                          id: generateNodeId('text'),
                          type: 'text',
                          label: 'Check Icon',
                          props: { text: item.icon },
                          styles: {
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#22c55e',
                            backgroundColor: 'rgba(34,197,94,0.1)',
                            padding: { top: '2px', right: '8px', bottom: '2px', left: '8px' },
                            borderRadius: '8px',
                          },
                        }),
                        createBuilderNode({
                          id: generateNodeId('text'),
                          type: 'text',
                          label: 'Check Text',
                          props: { text: item.text },
                          styles: { fontSize: '15px', lineHeight: '1.5', color: '#cbd5e1' },
                        }),
                      ],
                    })
                  ),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Image Column',
                styles: {
                  width: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Product Screenshot',
                    props: {
                      src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
                      alt: 'Platform dashboard preview',
                    },
                    styles: {
                      width: '100%',
                      borderRadius: '16px',
                      boxShadow: '0 20px 60px -12px rgba(0,0,0,0.5)',
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 4. features-bento
  {
    id: 'features-bento',
    name: 'Features: Bento Grid',
    category: 'features',
    badge: 'Trending',
    description: 'Asymmetric bento box layout with varying card sizes for visual hierarchy.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const bento = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Bento Grid',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + Bento',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '44px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Explore what makes us different' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'A thoughtfully crafted experience across every touchpoint.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: bento,
                type: 'container',
                label: 'Bento Top Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '16px',
                  width: '100%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Large Left Card',
                    styles: {
                      width: '66.66%',
                      padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                      backgroundColor: 'rgba(124,58,237,0.12)',
                      borderRadius: '18px',
                      borderWidth: '1px',
                      borderColor: 'rgba(124,58,237,0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      textAlign: 'left',
                      minHeight: '320px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Feature Title',
                        props: { text: 'AI-Powered Design' },
                        styles: { fontSize: '26px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Feature Description',
                        props: { text: 'Our engine analyzes millions of design patterns to suggest layouts, color palettes, and typography that convert.' },
                        styles: { fontSize: '14px', lineHeight: '1.55', color: '#c4b5fd' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Right Stack',
                    styles: {
                      width: '33.33%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Top Right Card',
                        styles: {
                          padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '16px',
                          borderWidth: '1px',
                          borderColor: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          textAlign: 'left',
                          minHeight: '152px',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Icon',
                            props: { text: '🚀' },
                            styles: { fontSize: '28px', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: 'Zero Downtime Deployments' },
                            styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: 'Ship updates instantly with rolling deployments and instant rollback support.' },
                            styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' },
                          }),
                        ],
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Bottom Right Card',
                        styles: {
                          padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '16px',
                          borderWidth: '1px',
                          borderColor: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          textAlign: 'left',
                          minHeight: '152px',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Icon',
                            props: { text: '📱' },
                            styles: { fontSize: '28px', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: 'Mobile-First Responsive' },
                            styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: 'Every component adapts seamlessly across phones, tablets, and desktops.' },
                            styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Wide Bottom Card',
                styles: {
                  width: '100%',
                  padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '16px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Bottom Text',
                    styles: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: 'Built-in Collaboration Tools' },
                        styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Description',
                        props: { text: 'Real-time cursors, commenting, and version history so your entire team stays in sync.' },
                        styles: { fontSize: '14px', color: '#94a3b8' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('button'),
                    type: 'button',
                    label: 'Learn More',
                    props: { text: 'See How It Works', href: '#collab' },
                    styles: {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      fontWeight: '600',
                      padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
                      borderRadius: '10px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // 5. features-tabs
  {
    id: 'features-tabs',
    name: 'Features: Horizontal Tabs',
    category: 'features',
    description: 'Tabbed feature explorer with horizontal icon tabs and content panel below.',
    preview: 'bg-[#06060c] p-4 flex flex-col gap-2 items-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const tabRow = generateNodeId('container');
      const contentPanel = generateNodeId('container');

      const tabs = [
        { icon: '⚡', label: 'Speed' },
        { icon: '🛡️', label: 'Security' },
        { icon: '📈', label: 'Analytics' },
        { icon: '🔧', label: 'Integrations' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Tabbed',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Tabbed Features',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Explore our feature set' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Click through each category to discover what powers your growth.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: tabRow,
                type: 'container',
                label: 'Tab Buttons',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  padding: { top: '6px', right: '6px', bottom: '6px', left: '6px' },
                  borderRadius: '14px',
                },
                children: tabs.map((tab, i) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: `Tab: ${tab.label}`,
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '8px',
                      padding: { top: '10px', right: '18px', bottom: '10px', left: '18px' },
                      borderRadius: '10px',
                      backgroundColor: i === 0 ? 'rgba(124,58,237,0.3)' : 'transparent',
                      borderWidth: i === 0 ? '1px' : '0px',
                      borderColor: i === 0 ? 'rgba(124,58,237,0.5)' : 'transparent',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Tab Icon',
                        props: { text: tab.icon },
                        styles: { fontSize: '16px', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Tab Label',
                        props: { text: tab.label },
                        styles: { fontSize: '14px', fontWeight: '600', color: i === 0 ? '#ffffff' : '#94a3b8' },
                      }),
                    ],
                  })
                ),
              }),
              createBuilderNode({
                id: contentPanel,
                type: 'container',
                label: 'Tab Content Panel',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '32px',
                  width: '100%',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '18px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Tab Image',
                    styles: { width: '45%' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Feature Screenshot',
                        props: {
                          src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80',
                          alt: 'Speed analytics dashboard',
                        },
                        styles: { width: '100%', borderRadius: '12px' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Tab Text',
                    styles: {
                      width: '55%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Feature Title',
                        props: { text: 'Blazing-Fast Performance' },
                        styles: { fontSize: '26px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Feature Description',
                        props: { text: 'Edge-optimized CDN, lazy loading, and intelligent caching ensure your pages load in under 300ms on every device and network condition.' },
                        styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'CTA',
                        props: { text: 'Explore Speed Tools', href: '#speed' },
                        styles: {
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          fontWeight: '700',
                          padding: { top: '10px', right: '22px', bottom: '10px', left: '22px' },
                          borderRadius: '10px',
                        },
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

  // 6. features-timeline
  {
    id: 'features-timeline',
    name: 'Features: Vertical Timeline',
    category: 'features',
    description: 'Step-by-step vertical timeline with numbered markers and connecting lines.',
    preview: 'bg-[#06060c] p-4 flex flex-col items-center gap-1',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');

      const steps = [
        { num: '01', title: 'Sign Up & Connect', desc: 'Create your account in seconds and connect your domain with one-click DNS setup.' },
        { num: '02', title: 'Design Your Vision', desc: 'Use the visual editor to craft pages with pre-built sections, animations, and custom fonts.' },
        { num: '03', title: 'Launch & Optimize', desc: 'Go live instantly and let our AI engine continuously optimize layout and content for conversions.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Timeline',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Timeline Wrapper',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              maxWidth: '640px',
              margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Title',
                props: { text: 'From idea to live in three steps' },
                styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Subtitle',
                props: { text: 'A streamlined process designed to get you launched without the complexity.' },
                styles: { fontSize: '16px', color: '#94a3b8' },
              }),
            ],
          }),
          ...steps.map((step, i) =>
            createBuilderNode({
              id: generateNodeId('container'),
              type: 'container',
              label: `Step ${step.num}`,
              styles: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '24px',
                maxWidth: '640px',
                margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
                width: '100%',
              },
              children: [
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: 'Timeline Marker',
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0px',
                    width: '48px',
                  },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('heading'),
                      type: 'heading',
                      label: 'Step Number',
                      props: { text: step.num },
                      styles: {
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#a78bfa',
                        backgroundColor: 'rgba(167,139,250,0.15)',
                        padding: { top: '6px', right: '10px', bottom: '6px', left: '10px' },
                        borderRadius: '10px',
                      },
                    }),
                    ...(i < steps.length - 1
                      ? [
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Connector',
                            props: { text: '│' },
                            styles: {
                              fontSize: '24px',
                              color: 'rgba(167,139,250,0.2)',
                              lineHeight: '1',
                              margin: { top: '4px', right: '0px', bottom: '0px', left: '0px' },
                            },
                          }),
                        ]
                      : []),
                  ],
                }),
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: 'Step Content',
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                    padding: { top: '2px', right: '0px', bottom: '32px', left: '0px' },
                  },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('heading'),
                      type: 'heading',
                      label: 'Step Title',
                      props: { text: step.title },
                      styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' },
                    }),
                    createBuilderNode({
                      id: generateNodeId('text'),
                      type: 'text',
                      label: 'Step Description',
                      props: { text: step.desc },
                      styles: { fontSize: '14px', lineHeight: '1.55', color: '#94a3b8' },
                    }),
                  ],
                }),
              ],
            })
          ),
        ],
      });
    },
  },

  // 7. features-icon-left
  {
    id: 'features-icon-left',
    name: 'Features: Icon Left Rows',
    category: 'features',
    description: 'Horizontal feature rows with icons on the left and content on the right.',
    preview: 'bg-[#06060c] p-4 flex flex-col gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const list = generateNodeId('container');

      const rows = [
        { icon: '⚡', title: 'Instant Deployment', desc: 'Push to production in one click. No build queues, no CI/CD pipelines to configure.' },
        { icon: '🔒', title: 'Bank-Grade Security', desc: 'Every site gets automatic SSL, DDoS protection, and enterprise firewall rules.' },
        { icon: '🌍', title: 'Global Edge Network', desc: 'Content cached at 200+ PoPs worldwide for sub-200ms Time to First Byte.' },
        { icon: '📐', title: 'Pixel-Perfect Control', desc: 'Advanced spacing, typography, and responsive breakpoint controls at your fingertips.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Icon Rows',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + List',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
              maxWidth: '860px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Why teams choose our platform' },
                    styles: { fontSize: '34px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Purpose-built features that remove friction from every step of your workflow.' },
                    styles: { fontSize: '15px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: list,
                type: 'container',
                label: 'Feature Rows',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  width: '100%',
                },
                children: rows.map((row, i) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: row.title,
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: '20px',
                      padding: { top: '24px', right: '0px', bottom: '24px', left: '0px' },
                      borderWidth: i < rows.length - 1 ? '1px' : '0px',
                      borderColor: 'rgba(255,255,255,0.06)',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Row Icon',
                        props: { text: row.icon },
                        styles: {
                          fontSize: '24px',
                          color: '#ffffff',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: { top: '10px', right: '14px', bottom: '10px', left: '14px' },
                          borderRadius: '12px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Row Content',
                        styles: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          textAlign: 'left',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Row Title',
                            props: { text: row.title },
                            styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Row Description',
                            props: { text: row.desc },
                            styles: { fontSize: '14px', lineHeight: '1.55', color: '#94a3b8' },
                          }),
                        ],
                      }),
                    ],
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },

  // 8. features-card-hover
  {
    id: 'features-card-hover',
    name: 'Features: Gradient Border Cards',
    category: 'features',
    badge: 'Creative',
    description: 'Feature cards with gradient borders and glowing hover effect on dark background.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const grid = generateNodeId('container');

      const cards = [
        { icon: '🧩', title: 'Modular Architecture', desc: 'Compose pages from reusable blocks that snap together with consistent spacing and typography.' },
        { icon: '🎬', title: 'Animation Engine', desc: 'Add scroll-triggered animations, parallax effects, and micro-interactions without code.' },
        { icon: '🔍', title: 'SEO Command Center', desc: 'Manage meta tags, structured data, Open Graph images, and sitemaps from a single dashboard.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Gradient Cards',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + Grid',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '48px',
              maxWidth: '1140px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Tools that empower creativity' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Professional-grade capabilities wrapped in an intuitive interface.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: grid,
                type: 'container',
                label: 'Gradient Cards',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '24px',
                  width: '100%',
                },
                children: cards.map((card) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: card.title,
                    styles: {
                      width: '33.33%',
                      padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' },
                      borderRadius: '18px',
                      backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(217,70,239,0.08))',
                      borderWidth: '1px',
                      borderColor: 'rgba(167,139,250,0.2)',
                      boxShadow: '0 0 30px -10px rgba(124,58,237,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      textAlign: 'center',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Icon',
                        props: { text: card.icon },
                        styles: { fontSize: '36px', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: card.title },
                        styles: { fontSize: '19px', fontWeight: '700', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Description',
                        props: { text: card.desc },
                        styles: { fontSize: '14px', lineHeight: '1.55', color: '#c4b5fd' },
                      }),
                    ],
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },

  // 9. features-split
  {
    id: 'features-split',
    name: 'Features: Two Column Split',
    category: 'features',
    description: 'Two balanced columns each containing a set of features with icons.',
    preview: 'bg-[#06060c] p-4 flex gap-3',
    createNode: () => {
      const secId = generateNodeId('section');
      const splitGrid = generateNodeId('container');

      const leftFeatures = [
        { icon: '📊', title: 'Real-Time Dashboard', desc: 'Monitor traffic, revenue, and conversions as they happen.' },
        { icon: '🧪', title: 'A/B Testing Suite', desc: 'Run split tests on headlines, layouts, and CTAs with statistical significance tracking.' },
        { icon: '🔔', title: 'Smart Notifications', desc: 'Get alerted on traffic spikes, checkout failures, and inventory changes instantly.' },
      ];

      const rightFeatures = [
        { icon: '🎨', title: 'Custom Themes', desc: 'Start from 100+ designer-crafted templates or build from scratch with CSS variables.' },
        { icon: '🔗', title: 'API Integrations', desc: 'Connect to Zapier, HubSpot, Slack, and 300+ tools via webhooks and REST APIs.' },
        { icon: '📦', title: 'Inventory Sync', desc: 'Automatic stock tracking across channels with low-inventory alerts and restock automation.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Split Columns',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Header',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '640px',
              margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Title',
                props: { text: 'Everything under one roof' },
                styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Subtitle',
                props: { text: 'A dual-column showcase of the tools that set us apart.' },
                styles: { fontSize: '16px', color: '#94a3b8' },
              }),
            ],
          }),
          createBuilderNode({
            id: splitGrid,
            type: 'container',
            label: 'Split Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Column',
                styles: {
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                },
                children: leftFeatures.map((f) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: f.title,
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '16px',
                      padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.025)',
                      borderRadius: '14px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Icon',
                        props: { text: f.icon },
                        styles: { fontSize: '24px', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Text',
                        styles: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: f.title },
                            styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: f.desc },
                            styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' },
                          }),
                        ],
                      }),
                    ],
                  })
                ),
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Column',
                styles: {
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                },
                children: rightFeatures.map((f) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: f.title,
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '16px',
                      padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.025)',
                      borderRadius: '14px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Icon',
                        props: { text: f.icon },
                        styles: { fontSize: '24px', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Text',
                        styles: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: f.title },
                            styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: f.desc },
                            styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' },
                          }),
                        ],
                      }),
                    ],
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },

  // 10. features-minimal
  {
    id: 'features-minimal',
    name: 'Features: Minimal Text List',
    category: 'features',
    description: 'Clean, minimal text-based feature list on white background with subtle dividers.',
    preview: 'bg-white p-4 flex flex-col gap-1',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const list = generateNodeId('container');

      const items = [
        { num: '01', title: 'No Code Required', desc: 'Build professional pages by dragging, dropping, and configuring visual components.' },
        { num: '02', title: 'Lightning-Fast Hosting', desc: 'Global CDN with edge caching delivers your content in under 200ms worldwide.' },
        { num: '03', title: 'Built-In Analytics', desc: 'Track visitors, conversions, and revenue without third-party analytics tools.' },
        { num: '04', title: '24/7 Priority Support', desc: 'Dedicated support team available around the clock via chat, email, and phone.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Minimal',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#ffffff',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + List',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '44px',
              maxWidth: '780px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Overline',
                    props: { text: 'FEATURES' },
                    styles: { fontSize: '12px', fontWeight: '700', color: '#6366f1', letterSpacing: '2px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Simple by design, powerful by nature' },
                    styles: { fontSize: '34px', fontWeight: '800', color: '#111827', lineHeight: '1.2' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Four principles that guide every feature we build.' },
                    styles: { fontSize: '16px', color: '#6b7280' },
                  }),
                ],
              }),
              createBuilderNode({
                id: list,
                type: 'container',
                label: 'Feature List',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  width: '100%',
                },
                children: items.map((item, i) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: item.title,
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: '24px',
                      padding: { top: '28px', right: '0px', bottom: '28px', left: '0px' },
                      borderWidth: i < items.length - 1 ? '1px' : '0px',
                      borderColor: '#e5e7eb',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Number',
                        props: { text: item.num },
                        styles: {
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#6366f1',
                          backgroundColor: '#eef2ff',
                          padding: { top: '6px', right: '10px', bottom: '6px', left: '10px' },
                          borderRadius: '8px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Text',
                        styles: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          textAlign: 'left',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: item.title },
                            styles: { fontSize: '18px', fontWeight: '700', color: '#111827' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: item.desc },
                            styles: { fontSize: '14px', lineHeight: '1.55', color: '#6b7280' },
                          }),
                        ],
                      }),
                    ],
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },

  // 11. features-numbers
  {
    id: 'features-numbers',
    name: 'Features: Statistics & Numbers',
    category: 'features',
    badge: 'Data-Driven',
    description: 'Large hero-style numbers with descriptions to showcase key metrics and impact.',
    preview: 'bg-[#06060c] p-4 flex gap-3 justify-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');
      const statsGrid = generateNodeId('container');

      const stats = [
        { number: '99.9%', label: 'Uptime SLA', desc: 'Enterprise-grade reliability backed by our infrastructure guarantee.' },
        { number: '<300ms', label: 'Avg. Load Time', desc: 'Edge-optimized delivery keeps your pages lightning fast everywhere.' },
        { number: '50M+', label: 'Pages Served', desc: 'Trusted by thousands of businesses to deliver content at scale.' },
        { number: '4.9/5', label: 'Customer Rating', desc: 'Consistently top-rated by users across G2, Capterra, and Trustpilot.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: Numbers',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + Stats',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '52px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'Numbers that speak for themselves' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Performance metrics that prove our commitment to excellence.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: statsGrid,
                type: 'container',
                label: 'Stats Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '24px',
                  width: '100%',
                },
                children: stats.map((stat) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: stat.label,
                    styles: {
                      width: '25%',
                      padding: { top: '32px', right: '20px', bottom: '32px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.025)',
                      borderRadius: '16px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      textAlign: 'center',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Big Number',
                        props: { text: stat.number },
                        styles: {
                          fontSize: '42px',
                          fontWeight: '900',
                          color: '#a78bfa',
                          lineHeight: '1',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Metric Label',
                        props: { text: stat.label },
                        styles: { fontSize: '15px', fontWeight: '700', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Metric Description',
                        props: { text: stat.desc },
                        styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' },
                      }),
                    ],
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },

  // 12. features-saas
  {
    id: 'features-saas',
    name: 'Features: SaaS Product Showcase',
    category: 'features',
    badge: 'New',
    description: 'SaaS-style feature cards with product screenshots and capability descriptions.',
    preview: 'bg-[#06060c] p-4 flex flex-col gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const outer = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Features: SaaS Showcase',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: outer,
            type: 'container',
            label: 'Header + Features',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '48px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Badge',
                    props: { text: 'PRODUCT' },
                    styles: {
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#a78bfa',
                      backgroundColor: 'rgba(167,139,250,0.1)',
                      padding: { top: '6px', right: '14px', bottom: '6px', left: '14px' },
                      borderRadius: '9999px',
                      letterSpacing: '1.5px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'See the product in action' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtitle',
                    props: { text: 'Three core modules that handle the entire website lifecycle.' },
                    styles: { fontSize: '16px', color: '#94a3b8' },
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Feature Row 1',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '48px',
                  width: '100%',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '20px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Image 1',
                    styles: { width: '50%' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Dashboard Screenshot',
                        props: {
                          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80',
                          alt: 'Analytics dashboard',
                        },
                        styles: { width: '100%', borderRadius: '12px' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Text 1',
                    styles: {
                      width: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Module Title',
                        props: { text: 'Visual Editor' },
                        styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Module Description',
                        props: { text: 'Drag, drop, and customize every element with a real-time visual canvas. No code required, yet infinitely extensible for developers.' },
                        styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'CTA',
                        props: { text: 'Try the Editor', href: '#editor' },
                        styles: {
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          fontWeight: '700',
                          padding: { top: '10px', right: '22px', bottom: '10px', left: '22px' },
                          borderRadius: '10px',
                          margin: { top: '4px', right: '0px', bottom: '0px', left: '0px' },
                        },
                      }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Feature Row 2',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '48px',
                  width: '100%',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '20px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Text 2',
                    styles: {
                      width: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Module Title',
                        props: { text: 'Growth Analytics' },
                        styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Module Description',
                        props: { text: 'Understand your audience with funnel analysis, heatmaps, and cohort tracking. Make data-driven decisions without leaving the platform.' },
                        styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'CTA',
                        props: { text: 'View Analytics', href: '#analytics' },
                        styles: {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          fontWeight: '700',
                          padding: { top: '10px', right: '22px', bottom: '10px', left: '22px' },
                          borderRadius: '10px',
                          borderWidth: '1px',
                          borderColor: 'rgba(255,255,255,0.1)',
                          margin: { top: '4px', right: '0px', bottom: '0px', left: '0px' },
                        },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Image 2',
                    styles: { width: '50%' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Analytics Screenshot',
                        props: {
                          src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80',
                          alt: 'Analytics charts',
                        },
                        styles: { width: '100%', borderRadius: '12px' },
                      }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Feature Row 3',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '48px',
                  width: '100%',
                  padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' },
                  backgroundColor: 'rgba(255,255,255,0.025)',
                  borderRadius: '20px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.06)',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Image 3',
                    styles: { width: '50%' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Deployment Screenshot',
                        props: {
                          src: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=700&q=80',
                          alt: 'Deployment pipeline',
                        },
                        styles: { width: '100%', borderRadius: '12px' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Feature Text 3',
                    styles: {
                      width: '50%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Module Title',
                        props: { text: 'One-Click Deploy' },
                        styles: { fontSize: '24px', fontWeight: '800', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Module Description',
                        props: { text: 'Push changes to production instantly with zero-downtime deployments, automatic rollbacks, and preview environments for every pull request.' },
                        styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'CTA',
                        props: { text: 'See Deployment', href: '#deploy' },
                        styles: {
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          fontWeight: '700',
                          padding: { top: '10px', right: '22px', bottom: '10px', left: '22px' },
                          borderRadius: '10px',
                          margin: { top: '4px', right: '0px', bottom: '0px', left: '0px' },
                        },
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
];
