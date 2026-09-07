import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type FAQSection = SectionTemplateItem & { category: 'faq' };

export const faqSections: FAQSection[] = [
  {
    id: 'faq-centered',
    name: 'Centered FAQ',
    category: 'faq',
    description: 'Centered FAQ section with expandable accordion items.',
    preview: 'bg-[#090912] p-4 text-center',
    tags: ['centered', 'accordion', 'clean'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      const faqs = [
        { q: 'How does the free trial work?', a: 'Start a 14-day free trial with full access to all features. No credit card required. Cancel anytime.' },
        { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or downgrade your plan at any time from your account settings.' },
        { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and wire transfers for annual plans.' },
        { q: 'Is there a setup fee?', a: 'No, there are no setup fees. You can start using the platform immediately after signing up.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: Centered',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'FAQ Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '36px',
              maxWidth: '700px',
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
                    props: { text: 'Frequently Asked Questions' },
                    styles: {
                      fontSize: '34px',
                      fontWeight: '800',
                      color: '#ffffff',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Subtext',
                    props: { text: 'Everything you need to know about our platform.' },
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
                label: 'FAQ Items',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  width: '100%',
                },
                children: faqs.flatMap((faq, i) => [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: faq.q,
                    styles: {
                      padding: { top: '20px', right: '0px', bottom: '20px', left: '0px' },
                      borderBottom: i < faqs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      textAlign: 'left',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Question',
                        props: { text: faq.q },
                        styles: {
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#ffffff',
                        },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Answer',
                        props: { text: faq.a },
                        styles: {
                          fontSize: '14px',
                          color: '#94a3b8',
                          lineHeight: '1.6',
                          margin: { top: '8px', right: '0px', bottom: '0px', left: '0px' },
                        },
                      }),
                    ],
                  }),
                ]),
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'faq-2col',
    name: '2 Column FAQ',
    category: 'faq',
    description: 'FAQ split into two columns for dense information display.',
    preview: 'bg-[#080811] p-4',
    tags: ['2-column', 'dense', 'organized'],
    style: 'modern',
    industry: ['business', 'consulting', 'enterprise'],
    createNode: () => {
      const leftFaqs = [
        { q: 'What industries do you serve?', a: 'We work with technology, healthcare, finance, education, and e-commerce businesses of all sizes.' },
        { q: 'How long does implementation take?', a: 'Most projects are completed within 2-4 weeks depending on complexity and scope.' },
        { q: 'Do you offer ongoing support?', a: 'Yes, all plans include 24/7 email support and premium plans include dedicated account managers.' },
      ];
      const rightFaqs = [
        { q: 'What is your pricing model?', a: 'We offer flexible monthly and annual pricing. Annual plans save up to 20%.' },
        { q: 'Can I integrate with existing tools?', a: 'Yes, we support 200+ integrations including Slack, Zapier, Salesforce, and more.' },
        { q: 'Is my data secure?', a: 'We are SOC 2 Type II certified with end-to-end encryption and GDPR compliance.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: 2 Column',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#080811',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'FAQ Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Got Questions? We Have Answers' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '800',
                  color: '#ffffff',
                  textAlign: 'center',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: '2 Column Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '48px',
                },
                children: [leftFaqs, rightFaqs].map((colFaqs) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'FAQ Column',
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px',
                    },
                    children: colFaqs.flatMap((faq, i) => [
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: faq.q,
                        styles: {
                          padding: { top: '18px', right: '0px', bottom: '18px', left: '0px' },
                          borderBottom: i < colFaqs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Question',
                            props: { text: faq.q },
                            styles: { fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Answer',
                            props: { text: faq.a },
                            styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' },
                          }),
                        ],
                      }),
                    ]),
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
    id: 'faq-minimal',
    name: 'Minimal FAQ',
    category: 'faq',
    description: 'Clean minimal FAQ on white background with thin dividers.',
    preview: 'bg-white p-4',
    tags: ['minimal', 'clean', 'white'],
    style: 'minimal',
    industry: ['consulting', 'finance', 'legal'],
    createNode: () => {
      const faqs = [
        { q: 'What services do you provide?', a: 'We offer strategic consulting, digital transformation, and technology implementation services for enterprises.' },
        { q: 'How do you pricing structure work?', a: 'Our pricing is project-based with transparent quotes provided after an initial discovery session.' },
        { q: 'What is your typical engagement length?', a: 'Engagements range from 4-week assessments to 12-month transformation programs.' },
        { q: 'Do you work with startups?', a: 'While our focus is enterprise, we selectively work with high-growth startups preparing for scale.' },
        { q: 'What regions do you cover?', a: 'We serve clients globally with offices in New York, London, Singapore, and Sydney.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: Minimal',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#ffffff',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal FAQ',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              maxWidth: '700px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Questions & Answers' },
                styles: {
                  fontSize: '30px',
                  fontWeight: '700',
                  color: '#111827',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'FAQ List',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                },
                children: faqs.flatMap((faq, i) => [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: faq.q,
                    styles: {
                      padding: { top: '20px', right: '0px', bottom: '20px', left: '0px' },
                      borderBottom: i < faqs.length - 1 ? '1px solid #f3f4f6' : 'none',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Question',
                        props: { text: faq.q },
                        styles: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Answer',
                        props: { text: faq.a },
                        styles: { fontSize: '14px', color: '#6b7280', lineHeight: '1.6' },
                      }),
                    ],
                  }),
                ]),
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'faq-bordered',
    name: 'Bordered FAQ',
    category: 'faq',
    description: 'FAQ items with individual border cards and distinct separation.',
    preview: 'bg-[#06060c] p-4',
    tags: ['bordered', 'cards', 'separated'],
    style: 'modern',
    industry: ['technology', 'saas', 'gaming'],
    createNode: () => {
      const faqs = [
        { q: 'How do I get started?', a: 'Sign up for free, complete the onboarding wizard, and import your existing data in minutes.' },
        { q: 'Can I invite my team?', a: 'Yes, all plans support unlimited team members with role-based access controls.' },
        { q: 'What analytics are included?', a: 'Real-time dashboards, conversion tracking, cohort analysis, and custom report builder.' },
        { q: 'Is there an API?', a: 'Yes, our RESTful API with comprehensive documentation and SDKs for Python, Node.js, and Go.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: Bordered',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#06060c',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bordered FAQ',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '36px',
              maxWidth: '800px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Frequently Asked Questions' },
                styles: {
                  fontSize: '34px',
                  fontWeight: '800',
                  color: '#ffffff',
                  textAlign: 'center',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'FAQ Cards',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  width: '100%',
                },
                children: faqs.map((faq) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: faq.q,
                    styles: {
                      padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' },
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.08)',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Question',
                        props: { text: faq.q },
                        styles: { fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Answer',
                        props: { text: faq.a },
                        styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' },
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
    id: 'faq-sidebar',
    name: 'FAQ with Sidebar Image',
    category: 'faq',
    description: 'FAQ items alongside a supporting sidebar image.',
    preview: 'bg-[#0a0a14] p-4',
    tags: ['sidebar', 'image', 'split'],
    style: 'modern',
    industry: ['marketing', 'agency', 'real-estate'],
    createNode: () => {
      const faqs = [
        { q: 'How do I list my property?', a: 'Create an account, upload photos, set your price, and your listing goes live within 24 hours.' },
        { q: 'What are the fees?', a: 'We charge a small 2.5% success fee only when your property is sold. No upfront costs.' },
        { q: 'Do you offer staging services?', a: 'Yes, our partner network includes professional stagers and photographers in major cities.' },
        { q: 'Can I track performance?', a: 'Access real-time analytics including views, inquiries, and conversion metrics in your dashboard.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: Sidebar',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Sidebar Layout',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '48px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              alignItems: 'flex-start',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'FAQ Column',
                styles: {
                  width: '55%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Heading',
                    props: { text: 'Common Questions' },
                    styles: {
                      fontSize: '30px',
                      fontWeight: '800',
                      color: '#ffffff',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'FAQ Items',
                    styles: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0px',
                    },
                    children: faqs.flatMap((faq, i) => [
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: faq.q,
                        styles: {
                          padding: { top: '18px', right: '0px', bottom: '18px', left: '0px' },
                          borderBottom: i < faqs.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        },
                        children: [
                          createBuilderNode({
                            id: generateNodeId('heading'),
                            type: 'heading',
                            label: 'Question',
                            props: { text: faq.q },
                            styles: { fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' },
                          }),
                          createBuilderNode({
                            id: generateNodeId('text'),
                            type: 'text',
                            label: 'Answer',
                            props: { text: faq.a },
                            styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' },
                          }),
                        ],
                      }),
                    ]),
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Sidebar Image',
                styles: {
                  width: '45%',
                  position: 'sticky',
                  top: '24px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Support Image',
                    props: { src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80', alt: 'FAQ support' },
                    styles: {
                      width: '100%',
                      height: '420px',
                      objectFit: 'cover',
                      borderRadius: '16px',
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
  {
    id: 'faq-grid',
    name: 'FAQ in Grid Cards',
    category: 'faq',
    description: 'FAQ items displayed as individual grid cards.',
    preview: 'bg-[#090912] p-4',
    tags: ['grid', 'cards', 'organized'],
    style: 'modern',
    industry: ['saas', 'technology', 'education'],
    createNode: () => {
      const faqs = [
        { q: 'What platforms do you support?', a: 'Web, iOS, Android, and Progressive Web Apps out of the box.' },
        { q: 'Is there a learning curve?', a: 'Our intuitive interface gets most users productive within the first hour.' },
        { q: 'Do you offer custom development?', a: 'Yes, our professional services team can build custom features and integrations.' },
        { q: 'What about data migration?', a: 'We provide free data migration tools and dedicated support for seamless transitions.' },
        { q: 'Can I white-label the platform?', a: 'Enterprise plans include full white-labeling with custom domains and branding.' },
        { q: 'What uptime do you guarantee?', a: '99.99% uptime SLA backed by credit compensation for any downtime.' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'FAQ: Grid',
        styles: {
          padding: { top: '72px', right: '24px', bottom: '72px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Grid FAQ',
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
                    props: { text: 'Help Center' },
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
                    props: { text: 'Quick answers to help you get the most out of our platform.' },
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
                label: 'FAQ Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  width: '100%',
                },
                children: faqs.map((faq) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: faq.q,
                    styles: {
                      width: 'calc(33.333% - 14px)',
                      padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '14px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('heading'),
                        type: 'heading',
                        label: 'Question',
                        props: { text: faq.q },
                        styles: { fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.3' },
                      }),
                      createBuilderNode({
                        id: generateNodeId('text'),
                        type: 'text',
                        label: 'Answer',
                        props: { text: faq.a },
                        styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' },
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
