import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type StatsSection = SectionTemplateItem & { category: 'stats' };

export const statsSections: StatsSection[] = [
  {
    id: 'stats-4-col',
    name: '4 Column Stats',
    category: 'stats',
    description: 'Four stat numbers displayed in equal columns with labels.',
    preview: 'bg-[#090912] p-4 text-center',
    tags: ['4-column', 'numbers', 'data'],
    style: 'modern',
    industry: ['saas', 'technology', 'finance'],
    createNode: () => {
      const stats = [
        { number: '12M+', label: 'Active Users' },
        { number: '99.99%', label: 'Uptime SLA' },
        { number: '180+', label: 'Countries Served' },
        { number: '4.9/5', label: 'Customer Rating' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: 4 Column',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Stats Container',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: stats.map((stat) =>
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: stat.label,
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  width: '25%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Number',
                    props: { text: stat.number },
                    styles: {
                      fontSize: '42px',
                      fontWeight: '900',
                      color: '#7c3aed',
                      lineHeight: '1',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Label',
                    props: { text: stat.label },
                    styles: {
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#94a3b8',
                    },
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
    id: 'stats-3-center',
    name: '3 Centered Stats',
    category: 'stats',
    description: 'Three centered stats with section heading above.',
    preview: 'bg-[#080811] p-4 text-center',
    tags: ['3-column', 'centered', 'heading'],
    style: 'modern',
    industry: ['business', 'consulting', 'marketing'],
    createNode: () => {
      const stats = [
        { number: '$4.2B', label: 'Revenue Processed' },
        { number: '850K', label: 'Projects Completed' },
        { number: '32ms', label: 'Avg Response Time' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: 3 Centered',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#080811',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Stats Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '48px',
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
                    props: { text: 'Performance at Scale' },
                    styles: {
                      fontSize: '36px',
                      fontWeight: '800',
                      color: '#ffffff',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtext',
                    props: { text: 'Numbers that demonstrate our commitment to excellence.' },
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
                label: 'Stats Row',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: '60px',
                },
                children: stats.map((stat) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: stat.label,
                    styles: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      minWidth: '200px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Number',
                        props: { text: stat.number },
                        styles: {
                          fontSize: '48px',
                          fontWeight: '900',
                          color: '#ffffff',
                          lineHeight: '1',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Label',
                        props: { text: stat.label },
                        styles: {
                          fontSize: '15px',
                          color: '#64748b',
                          fontWeight: '500',
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
    id: 'stats-with-bg',
    name: 'Stats Over Background',
    category: 'stats',
    description: 'Stats overlaid on a background image with dark gradient.',
    preview: 'bg-gradient-to-r from-violet-950 to-slate-900 p-4 text-center',
    tags: ['background', 'overlay', 'image'],
    style: 'bold',
    industry: ['real-estate', 'automotive', 'architecture'],
    createNode: () => {
      const stats = [
        { number: '250+', label: 'Properties Sold' },
        { number: '$1.8B', label: 'Total Value' },
        { number: '98%', label: 'Client Satisfaction' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: Background',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundImage: 'linear-gradient(135deg, rgba(30,5,51,0.92) 0%, rgba(15,23,42,0.88) 100%), url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Stats Overlay',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '48px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: stats.flatMap((stat, i) => {
              const items: BuilderNode[] = [
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: stat.label,
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flex: '1',
                  },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('heading'),
                      type: 'heading',
                      label: 'Number',
                      props: { text: stat.number },
                      styles: {
                        fontSize: '44px',
                        fontWeight: '900',
                        color: '#ffffff',
                        lineHeight: '1',
                      },
                    }),
                    createBuilderNode({
                      id: generateNodeId('text'),
                      type: 'text',
                      label: 'Label',
                      props: { text: stat.label },
                      styles: {
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'rgba(255,255,255,0.6)',
                      },
                    }),
                  ],
                }),
              ];
              if (i < stats.length - 1) {
                items.push(
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Divider',
                    props: { text: '|' },
                    styles: {
                      fontSize: '28px',
                      color: 'rgba(255,255,255,0.15)',
                      fontWeight: '300',
                    },
                  })
                );
              }
              return items;
            }),
          }),
        ],
      });
    },
  },
  {
    id: 'stats-minimal',
    name: 'Minimal Stats',
    category: 'stats',
    description: 'Minimal stats with clean dividers on white background.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'clean', 'white'],
    style: 'minimal',
    industry: ['consulting', 'finance', 'legal'],
    createNode: () => {
      const stats = [
        { number: '15+', label: 'Years Experience' },
        { number: '340', label: 'Team Members' },
        { number: '50M', label: 'Records Managed' },
        { number: '24/7', label: 'Support Available' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: Minimal',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#ffffff',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Stats',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: stats.flatMap((stat, i) => {
              const items: BuilderNode[] = [
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: stat.label,
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: { top: '0px', right: '32px', bottom: '0px', left: '32px' },
                    flex: '1',
                  },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('heading'),
                      type: 'heading',
                      label: 'Number',
                      props: { text: stat.number },
                      styles: {
                        fontSize: '36px',
                        fontWeight: '800',
                        color: '#111827',
                        lineHeight: '1',
                      },
                    }),
                    createBuilderNode({
                      id: generateNodeId('text'),
                      type: 'text',
                      label: 'Label',
                      props: { text: stat.label },
                      styles: {
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#9ca3af',
                      },
                    }),
                  ],
                }),
              ];
              if (i < stats.length - 1) {
                items.push(
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Divider',
                    props: { text: '' },
                    styles: {
                      width: '1px',
                      height: '48px',
                      backgroundColor: '#e5e7eb',
                    },
                  })
                );
              }
              return items;
            }),
          }),
        ],
      });
    },
  },
  {
    id: 'stats-gradient',
    name: 'Stats with Gradient Cards',
    category: 'stats',
    description: 'Stats displayed in gradient-bordered cards with glow effect.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['gradient', 'cards', 'glow'],
    style: 'bold',
    industry: ['startup', 'saas', 'technology'],
    createNode: () => {
      const stats = [
        { number: '10x', label: 'Faster Deployment', color: '#7c3aed' },
        { number: '99.9%', label: 'Accuracy Rate', color: '#06b6d4' },
        { number: '500K', label: 'API Calls / Day', color: '#f59e0b' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: Gradient Cards',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Gradient Stats',
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
                label: 'Heading',
                props: { text: 'Built for Performance' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '800',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Cards Row',
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
                      flex: '1',
                      padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
                      borderRadius: '16px',
                      backgroundImage: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}08 100%)`,
                      borderWidth: '1px',
                      borderColor: `${stat.color}30`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Number',
                        props: { text: stat.number },
                        styles: {
                          fontSize: '40px',
                          fontWeight: '900',
                          color: stat.color,
                          lineHeight: '1',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Label',
                        props: { text: stat.label },
                        styles: {
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#94a3b8',
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
    id: 'stats-icon',
    name: 'Stats with Icons',
    category: 'stats',
    description: 'Stats with icon elements above each number.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['icons', 'visual', 'data'],
    style: 'modern',
    industry: ['saas', 'technology', 'marketing'],
    createNode: () => {
      const stats = [
        { icon: '📊', number: '2.4M', label: 'Data Points Analyzed' },
        { icon: '⚡', number: '< 50ms', label: 'Avg Latency' },
        { icon: '🔒', number: 'SOC 2', label: 'Certified Security' },
        { icon: '🌍', number: '42', label: 'Edge Locations' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Stats: Icons',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#0a0a14',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Icon Stats',
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
                    label: 'Heading',
                    props: { text: 'Enterprise-Grade Infrastructure' },
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
                    props: { text: 'The technical backbone your business deserves.' },
                    styles: {
                      fontSize: '15px',
                      color: '#94a3b8',
                    },
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Stats Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '24px',
                  justifyContent: 'center',
                },
                children: stats.map((stat) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: stat.label,
                    styles: {
                      width: 'calc(25% - 18px)',
                      minWidth: '180px',
                      padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '14px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Icon',
                        props: { text: stat.icon },
                        styles: { fontSize: '28px' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Number',
                        props: { text: stat.number },
                        styles: {
                          fontSize: '28px',
                          fontWeight: '800',
                          color: '#ffffff',
                          lineHeight: '1',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Label',
                        props: { text: stat.label },
                        styles: {
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#94a3b8',
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
];
