import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type PortfolioSection = SectionTemplateItem & { category: 'portfolio' };

export const portfolioSections: PortfolioSection[] = [
  {
    id: 'portfolio-grid',
    name: 'Project Cards Grid',
    category: 'portfolio',
    description: 'Grid of project cards with thumbnail, title, and category tag.',
    preview: 'bg-[#090912] p-4',
    tags: ['grid', 'cards', 'standard'],
    style: 'modern',
    industry: ['agency', 'technology', 'design'],
    createNode: () => {
      const projects = [
        { title: 'E-Commerce Rebrand', category: 'Branding', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80' },
        { title: 'Mobile Banking App', category: 'UI/UX Design', src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80' },
        { title: 'SaaS Dashboard', category: 'Web App', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' },
        { title: 'AI Analytics Platform', category: 'Product Design', src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80' },
        { title: 'Real Estate Portal', category: 'Full Stack', src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80' },
        { title: 'Health & Fitness App', category: 'Mobile', src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Grid',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Portfolio Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
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
                    label: 'Heading',
                    props: { text: 'Our Latest Work' },
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
                    props: { text: 'A curated selection of projects we are proud of.' },
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
                label: 'Projects Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '24px',
                  width: '100%',
                },
                children: projects.map((project) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: project.title,
                    styles: {
                      width: 'calc(33.333% - 16px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Thumbnail',
                        props: { src: project.src, alt: project.title },
                        styles: {
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Category',
                        props: { text: project.category },
                        styles: {
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#7c3aed',
                          letterSpacing: '0.5px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: project.title },
                        styles: {
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#ffffff',
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
    id: 'portfolio-featured',
    name: 'Featured Project + Grid',
    category: 'portfolio',
    description: 'One large featured project above a smaller project grid.',
    preview: 'bg-[#080811] p-4',
    tags: ['featured', 'hero', 'hierarchy'],
    style: 'modern',
    industry: ['agency', 'architecture', 'design'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Featured',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#080811',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Featured Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Featured Work' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '700',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Featured Project',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '24px',
                  width: '100%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Featured Image',
                    props: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80', alt: 'Featured project' },
                    styles: {
                      width: '60%',
                      height: '360px',
                      objectFit: 'cover',
                      borderRadius: '16px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Featured Info',
                    styles: {
                      width: '40%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '14px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Category',
                        props: { text: 'WEB PLATFORM' },
                        styles: {
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#7c3aed',
                          letterSpacing: '2px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: 'NovaPay — Next-Gen Payment Gateway' },
                        styles: {
                          fontSize: '28px',
                          fontWeight: '800',
                          color: '#ffffff',
                          lineHeight: '1.2',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Description',
                        props: { text: 'A complete redesign of the payment processing platform, resulting in a 45% increase in conversion rates.' },
                        styles: {
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#94a3b8',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('button'),
                        type: 'button',
                        label: 'View Project',
                        props: { text: 'View Case Study', href: '#case-study' },
                        styles: {
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          fontWeight: '700',
                          padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
                          borderRadius: '10px',
                          alignSelf: 'flex-start',
                        },
                      }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'More Projects Grid',
                styles: {
                  display: 'flex',
                  gap: '20px',
                  width: '100%',
                },
                children: [
                  { title: 'CloudSync Dashboard', cat: 'SaaS', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' },
                  { title: 'Wellness Tracker', cat: 'Mobile', src: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80' },
                  { title: 'Smart Home Hub', cat: 'IoT', src: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80' },
                ].map((p) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: p.title,
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Thumbnail',
                        props: { src: p.src, alt: p.title },
                        styles: {
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Category',
                        props: { text: p.cat },
                        styles: { fontSize: '11px', fontWeight: '600', color: '#7c3aed', letterSpacing: '1px' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: p.title },
                        styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' },
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
    id: 'portfolio-minimal',
    name: 'Minimal Text Portfolio',
    category: 'portfolio',
    description: 'Minimal text-based portfolio with clean list layout.',
    preview: 'bg-white p-4',
    tags: ['minimal', 'text', 'list'],
    style: 'minimal',
    industry: ['consulting', 'architecture', 'editorial'],
    createNode: () => {
      const projects = [
        { title: 'Meridian Office Complex', year: '2025', category: 'Architecture' },
        { title: 'Vertex Financial Rebrand', year: '2025', category: 'Branding' },
        { title: 'Lumina Art Gallery Website', year: '2024', category: 'Web Design' },
        { title: 'Apex Startup Accelerator', year: '2024', category: 'Product Design' },
        { title: 'Zenith Wellness App', year: '2024', category: 'Mobile' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Minimal',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#ffffff',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Portfolio',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '800px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Selected Projects' },
                styles: {
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#111827',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Project List',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                },
                children: projects.flatMap((project, i) => {
                  const items: BuilderNode[] = [
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: project.title,
                      styles: {
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: { top: '20px', right: '0px', bottom: '20px', left: '0px' },
                        borderBottom: i < projects.length - 1 ? '1px solid #e5e7eb' : 'none',
                      },
                      children: [
                        createBuilderNode({
                          id: generateNodeId('heading'),
                          type: 'heading',
                          label: 'Title',
                          props: { text: project.title },
                          styles: {
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#111827',
                          },
                        }),
                        createBuilderNode({
                          id: generateNodeId('container'),
                          type: 'container',
                          label: 'Meta',
                          styles: {
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '16px',
                          },
                          children: [
                            createBuilderNode({
                              id: generateNodeId('text'),
                              type: 'text',
                              label: 'Category',
                              props: { text: project.category },
                              styles: {
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#9ca3af',
                              },
                            }),
                            createBuilderNode({
                              id: generateNodeId('text'),
                              type: 'text',
                              label: 'Year',
                              props: { text: project.year },
                              styles: {
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#d1d5db',
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ];
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
    id: 'portfolio-fullwidth',
    name: 'Full Width Project Cards',
    category: 'portfolio',
    description: 'Full width project cards stacked vertically.',
    preview: 'bg-[#0a0a14] p-4',
    tags: ['fullwidth', 'stacked', 'large'],
    style: 'modern',
    industry: ['agency', 'creative', 'technology'],
    createNode: () => {
      const projects = [
        {
          title: 'Stellar Fintech Platform',
          desc: 'A next-generation financial platform with real-time analytics.',
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80',
          cat: 'FinTech',
        },
        {
          title: 'Horizon Travel Experience',
          desc: 'Immersive travel booking with AI-powered recommendations.',
          src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&q=80',
          cat: 'Travel',
        },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Full Width',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Full Width Portfolio',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Case Studies' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '700',
                  color: '#ffffff',
                },
              }),
              ...projects.flatMap((project) => [
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: project.title,
                  styles: {
                    width: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderWidth: '1px',
                    borderColor: 'rgba(255,255,255,0.06)',
                  },
                  children: [
                    createBuilderNode({
                      id: generateNodeId('image'),
                      type: 'image',
                      label: 'Project Image',
                      props: { src: project.src, alt: project.title },
                      styles: {
                        width: '100%',
                        height: '340px',
                        objectFit: 'cover',
                      },
                    }),
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: 'Project Info',
                      styles: {
                        padding: { top: '24px', right: '28px', bottom: '28px', left: '28px' },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      },
                      children: [
                        createBuilderNode({
                          id: generateNodeId('text'),
                          type: 'text',
                          label: 'Category',
                          props: { text: project.cat },
                          styles: { fontSize: '12px', fontWeight: '600', color: '#7c3aed', letterSpacing: '1px' },
                        }),
                        createBuilderNode({
                          id: generateNodeId('heading'),
                          type: 'heading',
                          label: 'Title',
                          props: { text: project.title },
                          styles: { fontSize: '24px', fontWeight: '700', color: '#ffffff' },
                        }),
                        createBuilderNode({
                          id: generateNodeId('text'),
                          type: 'text',
                          label: 'Description',
                          props: { text: project.desc },
                          styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' },
                        }),
                      ],
                    }),
                  ],
                }),
              ]),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'portfolio-filterable',
    name: 'Filterable Portfolio',
    category: 'portfolio',
    description: 'Portfolio with filter tab bar above the project grid.',
    preview: 'bg-[#090912] p-4',
    tags: ['filterable', 'tabs', 'interactive'],
    style: 'modern',
    industry: ['agency', 'design', 'marketing'],
    createNode: () => {
      const filters = ['All', 'Web Design', 'Branding', 'Mobile', 'UI/UX'];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Filterable',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Filterable Content',
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
                props: { text: 'Our Portfolio' },
                styles: {
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Filter Tabs',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  justifyContent: 'center',
                },
                children: filters.map((f, i) =>
                  createBuilderNode({
                    id: generateNodeId('button'),
                    type: 'button',
                    label: f,
                    props: { text: f, href: '#' },
                    styles: {
                      backgroundColor: i === 0 ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                      color: i === 0 ? '#ffffff' : '#94a3b8',
                      fontWeight: '600',
                      fontSize: '13px',
                      padding: { top: '8px', right: '20px', bottom: '8px', left: '20px' },
                      borderRadius: '9999px',
                      borderWidth: i === 0 ? 'none' : '1px',
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                  })
                ),
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Projects Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  width: '100%',
                },
                children: [
                  { title: 'Nexus Web Platform', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80' },
                  { title: 'Prism Brand Identity', src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80' },
                  { title: 'Pulse Health App', src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80' },
                  { title: 'Orbit CRM Dashboard', src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' },
                  { title: 'Spark E-Commerce', src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' },
                  { title: 'Wave Social Platform', src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80' },
                ].map((p) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: p.title,
                    styles: {
                      width: 'calc(33.333% - 14px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Thumbnail',
                        props: { src: p.src, alt: p.title },
                        styles: {
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: p.title },
                        styles: {
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#e2e8f0',
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
    id: 'portfolio-case-study',
    name: 'Case Study Layout',
    category: 'portfolio',
    description: 'Detailed case study layout with metrics, image, and description.',
    preview: 'bg-[#080811] p-4',
    tags: ['case-study', 'detailed', 'metrics'],
    style: 'modern',
    industry: ['agency', 'consulting', 'technology'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Case Study',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#080811',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Case Study Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
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
                  gap: '12px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Eyebrow',
                    props: { text: 'CASE STUDY' },
                    styles: { fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Title',
                    props: { text: 'How NovaPay Increased Conversion by 45%' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Summary',
                    props: { text: 'A complete UX overhaul of the checkout flow that transformed user drop-off into revenue growth.' },
                    styles: { fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' },
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('image'),
                type: 'image',
                label: 'Case Study Image',
                props: { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80', alt: 'Case study preview' },
                styles: {
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: '16px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Metrics',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '24px',
                },
                children: [
                  { number: '+45%', label: 'Conversion Rate' },
                  { number: '-60%', label: 'Bounce Rate' },
                  { number: '3.2x', label: 'Revenue Growth' },
                ].map((m) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: m.label,
                    styles: {
                      flex: '1',
                      padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '14px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Number',
                        props: { text: m.number },
                        styles: { fontSize: '32px', fontWeight: '900', color: '#7c3aed' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Label',
                        props: { text: m.label },
                        styles: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' },
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
    id: 'portfolio-mosaic',
    name: 'Mosaic Portfolio',
    category: 'portfolio',
    description: 'Mosaic layout with mixed image and text cards.',
    preview: 'bg-[#0a0a14] p-4',
    tags: ['mosaic', 'mixed', 'creative'],
    style: 'creative',
    industry: ['creative', 'photography', 'art'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Mosaic',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Mosaic Content',
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
                props: { text: 'Creative Portfolio' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '700',
                  color: '#ffffff',
                  textAlign: 'center',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Mosaic Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  width: '100%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Image 1',
                    props: { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80', alt: 'Mosaic 1' },
                    styles: { width: 'calc(50% - 8px)', height: '260px', objectFit: 'cover', borderRadius: '12px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Text Card 1',
                    styles: {
                      width: 'calc(25% - 12px)',
                      padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
                      backgroundColor: '#7c3aed',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '8px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: 'Brand Strategy' },
                        styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Desc',
                        props: { text: 'Complete identity system for a tech startup.' },
                        styles: { fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' },
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Image 2',
                    props: { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', alt: 'Mosaic 2' },
                    styles: { width: 'calc(25% - 12px)', height: '260px', objectFit: 'cover', borderRadius: '12px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Image 3',
                    props: { src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80', alt: 'Mosaic 3' },
                    styles: { width: 'calc(25% - 12px)', height: '260px', objectFit: 'cover', borderRadius: '12px' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Text Card 2',
                    styles: {
                      width: 'calc(50% - 8px)',
                      padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '10px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Title',
                        props: { text: 'Digital Experience' },
                        styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Desc',
                        props: { text: 'Interactive web platform with immersive 3D product visualizations and real-time customization.' },
                        styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' },
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
  {
    id: 'portfolio-side-by-side',
    name: 'Alternating Side by Side',
    category: 'portfolio',
    description: 'Alternating left/right project layouts for scrolling showcase.',
    preview: 'bg-[#090912] p-4',
    tags: ['alternating', 'side-by-side', 'scroll'],
    style: 'modern',
    industry: ['agency', 'consulting', 'architecture'],
    createNode: () => {
      const projects = [
        {
          title: 'Quantum Computing Research Hub',
          desc: 'An interactive data visualization platform for quantum computing research teams.',
          src: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
          cat: 'Web Platform',
        },
        {
          title: 'EcoVerse Sustainability Dashboard',
          desc: 'Real-time environmental monitoring with actionable insights for enterprise sustainability.',
          src: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
          cat: 'Dashboard',
        },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Portfolio: Side by Side',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Side by Side Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '56px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Project Showcase' },
                styles: {
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#ffffff',
                  textAlign: 'center',
                },
              }),
              ...projects.flatMap((project, i) => {
                const isReversed = i % 2 === 1;
                return [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: project.title,
                    styles: {
                      display: 'flex',
                      flexDirection: isReversed ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: '48px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Project Image',
                        props: { src: project.src, alt: project.title },
                        styles: {
                          width: '55%',
                          height: '340px',
                          objectFit: 'cover',
                          borderRadius: '16px',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Project Info',
                        styles: {
                          width: '45%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Category',
                            props: { text: project.cat.toUpperCase() },
                            styles: { fontSize: '11px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Title',
                            props: { text: project.title },
                            styles: { fontSize: '28px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Description',
                            props: { text: project.desc },
                            styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('button'),
                            type: 'button',
                            label: 'View Project',
                            props: { text: 'View Project', href: '#' },
                            styles: {
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: '#e2e8f0',
                              fontWeight: '600',
                              padding: { top: '10px', right: '24px', bottom: '10px', left: '24px' },
                              borderRadius: '10px',
                              borderWidth: '1px',
                              borderColor: 'rgba(255,255,255,0.12)',
                              alignSelf: 'flex-start',
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ];
              }),
            ],
          }),
        ],
      });
    },
  },
];
