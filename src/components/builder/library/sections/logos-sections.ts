import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type LogoSection = SectionTemplateItem & { category: 'logos' };

export const logoSections: LogoSection[] = [
  {
    id: 'logos-row',
    name: 'Logo Row',
    category: 'logos',
    description: 'Single row of 6 company name placeholders with subtle styling.',
    preview: 'bg-[#090912] p-4 text-center',
    tags: ['row', 'simple', 'social-proof'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Row',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' },
          backgroundColor: '#090912',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Logo Row Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Eyebrow',
                props: { text: 'TRUSTED BY INDUSTRY LEADERS' },
                styles: {
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#64748b',
                  letterSpacing: '2px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Logos Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '24px',
                  width: '100%',
                },
                children: [
                  'Stripe', 'Vercel', 'Notion', 'Linear', 'Figma', 'Slack',
                ].map((name) =>
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: name,
                    props: { text: name },
                    styles: {
                      fontSize: '18px',
                      fontWeight: '700',
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.5px',
                    },
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'logos-grid',
    name: 'Logo Grid',
    category: 'logos',
    description: 'Two rows of logos in a balanced grid layout.',
    preview: 'bg-[#080811] p-4 text-center',
    tags: ['grid', 'balanced', 'social-proof'],
    style: 'modern',
    industry: ['business', 'consulting', 'technology'],
    createNode: () => {
      const logosRow1 = ['Shopify', 'AWS', 'Google Cloud', 'Microsoft'];
      const logosRow2 = ['HubSpot', 'Salesforce', 'Zendesk', 'Intercom'];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Grid',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#080811',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Grid Content',
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
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Section Heading',
                props: { text: 'Powering the Best Teams Worldwide' },
                styles: {
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Logos Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '28px',
                  width: '100%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Row 1',
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      gap: '20px',
                    },
                    children: logosRow1.map((name) =>
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: name,
                        props: { text: name },
                        styles: {
                          fontSize: '16px',
                          fontWeight: '700',
                          color: 'rgba(255,255,255,0.25)',
                        },
                      })
                    ),
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Row 2',
                    styles: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      gap: '20px',
                    },
                    children: logosRow2.map((name) =>
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: name,
                        props: { text: name },
                        styles: {
                          fontSize: '16px',
                          fontWeight: '700',
                          color: 'rgba(255,255,255,0.25)',
                        },
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
  {
    id: 'logos-minimal',
    name: 'Minimal Text Logos',
    category: 'logos',
    description: 'Minimal text-based logos with clean separator lines.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'text', 'clean'],
    style: 'minimal',
    industry: ['architecture', 'consulting', 'finance'],
    createNode: () => {
      const partners = ['Deloitte', 'Goldman Sachs', 'McKinsey', 'JP Morgan', 'Bain'];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Minimal',
        styles: {
          padding: { top: '56px', right: '24px', bottom: '56px', left: '24px' },
          backgroundColor: '#ffffff',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Logos',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '28px',
              maxWidth: '900px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Eyebrow',
                props: { text: 'OUR PARTNERS' },
                styles: {
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#9ca3af',
                  letterSpacing: '3px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Partners Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0px',
                  width: '100%',
                },
                children: partners.flatMap((name, i) => {
                  const items: BuilderNode[] = [
                    createBuilderNode({
                      id: generateNodeId('text'),
                      type: 'text',
                      label: name,
                      props: { text: name },
                      styles: {
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#9ca3af',
                        padding: { top: '0px', right: '24px', bottom: '0px', left: '24px' },
                      },
                    }),
                  ];
                  if (i < partners.length - 1) {
                    items.push(
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Divider',
                        props: { text: '|' },
                        styles: {
                          fontSize: '14px',
                          color: '#e5e7eb',
                        },
                      })
                    );
                  }
                  return items;
                }),
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'logos-dark',
    name: 'Dark Background Logos',
    category: 'logos',
    description: 'Logos on dark background with bordered card styling.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['dark', 'bordered', 'cards'],
    style: 'dark',
    industry: ['technology', 'saas', 'gaming'],
    createNode: () => {
      const brands = ['Anthropic', 'OpenAI', 'Meta', 'Nvidia', 'Tesla', 'SpaceX'];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Dark',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Dark Logos Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '36px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Backed by the Best' },
                styles: {
                  fontSize: '30px',
                  fontWeight: '700',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Logos Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  width: '100%',
                },
                children: brands.map((name) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: name,
                    styles: {
                      padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' },
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.08)',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: name,
                        props: { text: name },
                        styles: {
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'rgba(255,255,255,0.4)',
                        },
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
  {
    id: 'logos-centered',
    name: 'Centered Logo Row with Heading',
    category: 'logos',
    description: 'Centered logo row with prominent heading and subtext.',
    preview: 'bg-gradient-to-b from-[#0a0a14] to-[#06060c] p-4 text-center',
    tags: ['centered', 'heading', 'prominent'],
    style: 'modern',
    industry: ['startup', 'saas', 'marketing'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Centered',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundImage: 'linear-gradient(180deg, #0a0a14 0%, #06060c 100%)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Centered Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
              maxWidth: '900px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Heading Block',
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
                    label: 'Heading',
                    props: { text: 'Join 2,000+ Companies Growing With Us' },
                    styles: {
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#ffffff',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtext',
                    props: { text: 'From startups to enterprises, teams choose us to scale faster.' },
                    styles: {
                      fontSize: '16px',
                      color: '#94a3b8',
                    },
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Logo Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '40px',
                  flexWrap: 'wrap',
                },
                children: ['Spotify', 'Airbnb', 'Netflix', 'Discord', 'Figma'].map((name) =>
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: name,
                    props: { text: name },
                    styles: {
                      fontSize: '20px',
                      fontWeight: '700',
                      color: 'rgba(255,255,255,0.2)',
                    },
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'logos-scrolling',
    name: 'Scrolling Logos',
    category: 'logos',
    description: 'Horizontal scrolling logos with gradient fade on edges.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['scrolling', 'horizontal', 'animated'],
    style: 'modern',
    industry: ['technology', 'saas', 'media'],
    createNode: () => {
      const scrollingLogos = [
        'Product Hunt', 'TechCrunch', 'Forbes', 'Bloomberg', 'Wired',
        'The Verge', 'VentureBeat', 'Fast Company',
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Logos: Scrolling',
        styles: {
          padding: { top: '60px', right: '0px', bottom: '60px', left: '0px' },
          backgroundColor: '#0a0a14',
          textAlign: 'center',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Scrolling Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Eyebrow',
                props: { text: 'AS FEATURED IN' },
                styles: {
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#64748b',
                  letterSpacing: '2px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Scroll Track',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '48px',
                  width: '100%',
                  padding: { top: '16px', right: '48px', bottom: '16px', left: '48px' },
                },
                children: scrollingLogos.map((name) =>
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: name,
                    props: { text: name },
                    styles: {
                      fontSize: '17px',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.2)',
                      whiteSpace: 'nowrap',
                    },
                  })
                ),
              }),
            ],
          }),
        ],
      });
    },
  },
];
