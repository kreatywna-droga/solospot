import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type ServiceSection = SectionTemplateItem & { category: 'services' };

export const serviceSections: ServiceSection[] = [
  {
    id: 'services-3-cards',
    name: 'Services: 3 Cards with Pricing',
    category: 'services',
    description: 'Three service cards featuring icon, title, description, and price on a dark background.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['cards', 'pricing', 'icons', '3-column'],
    style: 'modern',
    industry: ['saas', 'agency', 'technology'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const cardsGrid = generateNodeId('container');

      const services = [
        { icon: '⚡', title: 'Starter Plan', desc: 'Perfect for small projects. Includes basic analytics, 5 GB storage, and email support.', price: '$29/mo' },
        { icon: '🚀', title: 'Professional', desc: 'For growing teams. Advanced analytics, 50 GB storage, priority support, and API access.', price: '$79/mo' },
        { icon: '🏢', title: 'Enterprise', desc: 'Full-scale solution. Unlimited storage, dedicated account manager, custom integrations.', price: '$199/mo' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: 3 Cards',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '640px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Section Title', props: { text: 'Choose the Right Plan for You' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Section Subtitle', props: { text: 'Flexible pricing that scales with your business. No hidden fees, cancel anytime.' }, styles: { fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' } }),
            ],
          }),
          createBuilderNode({
            id: cardsGrid, type: 'container', label: 'Cards Grid',
            styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: services.map((svc) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: svc.title,
                styles: { width: '33.33%', padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Icon', props: { text: svc.icon }, styles: { fontSize: '40px', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: svc.title }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: svc.desc }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Price', props: { text: svc.price }, styles: { fontSize: '28px', fontWeight: '800', color: '#a78bfa', marginTop: '8px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Get Started', href: '#get-started' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px', marginTop: '8px' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'services-grid-4',
    name: 'Services: 4-Column Grid',
    category: 'services',
    description: 'Four services displayed in a grid with icons and descriptions on a dark background.',
    preview: 'bg-[#090912] p-4 grid grid-cols-2 gap-2',
    tags: ['grid', '4-column', 'icons', 'minimal'],
    style: 'modern',
    industry: ['technology', 'startup', 'saas'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const gridCont = generateNodeId('container');

      const items = [
        { icon: '🎨', title: 'UI/UX Design', desc: 'Crafting intuitive interfaces that delight users and drive engagement across every touchpoint.' },
        { icon: '⚙️', title: 'Development', desc: 'Scalable, performant applications built with modern frameworks and best practices.' },
        { icon: '📊', title: 'Analytics', desc: 'Data-driven insights to optimize conversion funnels and maximize your ROI.' },
        { icon: '🔒', title: 'Security', desc: 'Enterprise-grade protection with SOC2 compliance and continuous vulnerability monitoring.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: 4-Grid',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#090912', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Our Core Services' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'End-to-end solutions designed to accelerate your digital transformation.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: gridCont, type: 'container', label: 'Services Grid',
            styles: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: items.map((item) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: item.title,
                styles: { width: 'calc(25% - 15px)', padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' }, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '14px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Icon', props: { text: item.icon }, styles: { fontSize: '36px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: item.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: item.desc }, styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'services-list',
    name: 'Services: Horizontal Rows',
    category: 'services',
    description: 'Horizontal service rows with icon on the left and text on the right, dark background.',
    preview: 'bg-[#080811] p-4 flex flex-col gap-2',
    tags: ['list', 'rows', 'horizontal', 'clean'],
    style: 'minimal',
    industry: ['consulting', 'business', 'agency'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const listCont = generateNodeId('container');

      const rows = [
        { icon: '📋', title: 'Strategy & Consulting', desc: 'We analyze your business goals and craft a tailored roadmap for digital success.' },
        { icon: '🛠️', title: 'Custom Development', desc: 'From MVPs to full-scale platforms, we build robust software that performs at scale.' },
        { icon: '📈', title: 'Growth Marketing', desc: 'Data-backed campaigns that drive qualified leads and measurable revenue growth.' },
        { icon: '🤝', title: 'Ongoing Support', desc: 'Dedicated account management with 24/7 priority support and quarterly reviews.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: List',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#080811' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'What We Deliver' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Comprehensive services built to transform ideas into market-leading products.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: listCont, type: 'container', label: 'Service Rows',
            styles: { display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: rows.map((row, i) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: row.title,
                styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', padding: { top: '24px', right: '0px', bottom: '24px', left: '0px' }, borderWidth: i < rows.length - 1 ? '1px' : '0px', borderColor: 'rgba(255,255,255,0.06)', borderBottomStyle: 'solid' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Icon', props: { text: row.icon }, styles: { fontSize: '32px', width: '48px', textAlign: 'center', flexShrink: '0' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Text Group',
                    styles: { display: 'flex', flexDirection: 'column', gap: '6px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: row.title }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: row.desc }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
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
    id: 'services-pricing-cards',
    name: 'Services: Pricing Tiers',
    category: 'services',
    description: 'Service cards with detailed pricing tiers, feature lists, and highlighted recommended plan.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['pricing', 'tiers', 'features', 'cards'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const cardsCont = generateNodeId('container');

      const tiers = [
        { name: 'Basic', price: '$19', period: '/mo', features: ['5 Projects', '10 GB Storage', 'Email Support', 'Basic Analytics'], highlighted: false },
        { name: 'Pro', price: '$49', period: '/mo', features: ['Unlimited Projects', '100 GB Storage', 'Priority Support', 'Advanced Analytics', 'API Access'], highlighted: true },
        { name: 'Business', price: '$99', period: '/mo', features: ['Everything in Pro', '500 GB Storage', 'Dedicated Manager', 'Custom Integrations', 'SLA Guarantee'], highlighted: false },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Pricing',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Simple, Transparent Pricing' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Start free and upgrade as you grow. All plans include a 14-day trial.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: cardsCont, type: 'container', label: 'Pricing Cards',
            styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1000px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' }, alignItems: 'stretch' },
            children: tiers.map((tier) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: tier.name,
                styles: { width: '33.33%', padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' }, backgroundColor: tier.highlighted ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: tier.highlighted ? '2px' : '1px', borderColor: tier.highlighted ? '#7c3aed' : 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', position: 'relative' },
                children: [
                  ...(tier.highlighted ? [createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'MOST POPULAR' }, styles: { fontSize: '10px', fontWeight: '700', color: '#7c3aed', letterSpacing: '1.5px', backgroundColor: 'rgba(124,58,237,0.2)', padding: { top: '4px', right: '12px', bottom: '4px', left: '12px' }, borderRadius: '9999px' } })] : []),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: tier.name }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Price Group',
                    styles: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Price', props: { text: tier.price }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: tier.period }, styles: { fontSize: '14px', color: '#64748b' } }),
                    ],
                  }),
                  ...tier.features.map((f) =>
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: f, props: { text: `✓  ${f}` }, styles: { fontSize: '13px', color: '#cbd5e1', width: '100%', textAlign: 'left' } })
                  ),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Choose Plan', href: '#choose' }, styles: { backgroundColor: tier.highlighted ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', borderWidth: tier.highlighted ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.12)', marginTop: '8px', width: '100%' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'services-icon-top',
    name: 'Services: Icon Centered Top',
    category: 'services',
    description: 'Icon centered above title and description in column card layout, dark background.',
    preview: 'bg-[#0a0a14] p-4 flex gap-2',
    tags: ['icon-top', 'centered', 'columns', 'elegant'],
    style: 'modern',
    industry: ['agency', 'creative', 'consulting'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const gridCont = generateNodeId('container');

      const items = [
        { icon: '💡', title: 'Innovation Lab', desc: 'Rapid prototyping and concept validation to bring your vision to life in weeks, not months.' },
        { icon: '🌐', title: 'Digital Presence', desc: 'End-to-end brand strategy, web design, and content creation that resonates with your audience.' },
        { icon: '📱', title: 'Mobile First', desc: 'Native and cross-platform mobile applications optimized for performance and user experience.' },
        { icon: '☁️', title: 'Cloud Infrastructure', desc: 'Auto-scaling cloud architecture with 99.99% uptime SLA and global CDN distribution.' },
        { icon: '🤖', title: 'AI Integration', desc: 'Smart automation and machine learning solutions that give your business a competitive edge.' },
        { icon: '🛡️', title: 'Compliance', desc: 'GDPR, HIPAA, and SOC2 compliance auditing with actionable remediation plans.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Icon Top',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#0a0a14', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Built for Modern Businesses' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Six pillars of excellence that drive measurable results for every client.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: gridCont, type: 'container', label: 'Services Grid',
            styles: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '24px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: items.map((item) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: item.title,
                styles: { width: 'calc(33.33% - 16px)', padding: { top: '32px', right: '20px', bottom: '32px', left: '20px' }, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Icon Circle', styles: { width: '64px', height: '64px', borderRadius: '9999px', backgroundColor: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                    children: [createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Icon', props: { text: item.icon }, styles: { fontSize: '28px' } })],
                  }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: item.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: item.desc }, styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
  {
    id: 'services-with-image',
    name: 'Services: List with Image',
    category: 'services',
    description: 'Service list alongside a large feature image on a dark background.',
    preview: 'bg-[#080811] p-4 flex gap-3 items-center',
    tags: ['image', 'split', 'list', 'feature'],
    style: 'modern',
    industry: ['technology', 'saas', 'business'],
    createNode: () => {
      const secId = generateNodeId('section');
      const gridCont = generateNodeId('container');

      const points = [
        { icon: '🎯', title: 'Precision Targeting', desc: 'Reach the right audience at the right time with AI-powered campaign optimization.' },
        { icon: '📊', title: 'Real-Time Dashboards', desc: 'Monitor every metric that matters with live dashboards and automated reporting.' },
        { icon: '🔄', title: 'Seamless Integration', desc: 'Connect with 200+ tools including Salesforce, HubSpot, Stripe, and Slack.' },
        { icon: '🚀', title: 'One-Click Deploy', desc: 'Push updates to production instantly with zero-downtime deployments and rollback.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: With Image',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#080811' },
        children: [
          createBuilderNode({
            id: gridCont, type: 'container', label: 'Split Layout',
            styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: 'Services List',
                styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '28px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Everything You Need to Scale' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2', marginBottom: '8px' } }),
                  ...points.map((pt) =>
                    createBuilderNode({
                      id: generateNodeId('container'), type: 'container', label: pt.title,
                      styles: { display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start' },
                      children: [
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Icon', props: { text: pt.icon }, styles: { fontSize: '24px', width: '36px', textAlign: 'center', flexShrink: '0', marginTop: '2px' } }),
                        createBuilderNode({
                          id: generateNodeId('container'), type: 'container', label: 'Text',
                          styles: { display: 'flex', flexDirection: 'column', gap: '4px' },
                          children: [
                            createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: pt.title }, styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' } }),
                            createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: pt.desc }, styles: { fontSize: '13px', lineHeight: '1.5', color: '#94a3b8' } }),
                          ],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: 'Image Side',
                styles: { width: '50%', display: 'flex', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Feature Image', props: { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', alt: 'Dashboard analytics' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'services-steps',
    name: 'Services: Numbered Process Steps',
    category: 'services',
    description: 'Numbered service process steps showing a clear workflow on a dark background.',
    preview: 'bg-[#06060c] p-4 flex flex-col gap-2',
    tags: ['steps', 'process', 'numbered', 'workflow'],
    style: 'modern',
    industry: ['consulting', 'agency', 'business'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const stepsCont = generateNodeId('container');

      const steps = [
        { num: '01', title: 'Discovery & Audit', desc: 'We deep-dive into your business, market position, and technical landscape to identify opportunities.' },
        { num: '02', title: 'Strategy & Roadmap', desc: 'A detailed action plan with milestones, deliverables, and timelines tailored to your goals.' },
        { num: '03', title: 'Design & Prototype', desc: 'Interactive prototypes and design systems that validate concepts before a single line of code.' },
        { num: '04', title: 'Build & Launch', desc: 'Agile development sprints with continuous testing, culminating in a seamless production launch.' },
        { num: '05', title: 'Optimize & Scale', desc: 'Post-launch monitoring, A/B testing, and performance tuning to maximize your investment.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Steps',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'How We Work' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'A proven five-step process that turns ambitious ideas into shipped products.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: stepsCont, type: 'container', label: 'Steps List',
            styles: { display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: steps.map((step, i) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: step.title,
                styles: { display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start', padding: { top: '28px', right: '0px', bottom: '28px', left: '0px' }, borderWidth: i < steps.length - 1 ? '1px' : '0px', borderColor: 'rgba(255,255,255,0.06)', borderBottomStyle: 'solid' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: step.num }, styles: { fontSize: '32px', fontWeight: '900', color: '#7c3aed', width: '56px', textAlign: 'center', flexShrink: '0' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Text Group',
                    styles: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: step.title }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: step.desc }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
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
    id: 'services-comparison',
    name: 'Services: Side-by-Side Comparison',
    category: 'services',
    description: 'Side by side comparison of two service tiers with feature checkmarks.',
    preview: 'bg-[#0a0a14] p-4 flex gap-2',
    tags: ['comparison', 'vs', 'two-column', 'features'],
    style: 'modern',
    industry: ['saas', 'technology', 'business'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const compCont = generateNodeId('container');

      const leftFeatures = ['5 team members', '10 GB storage', 'Email support', 'Basic analytics', 'API access (read-only)'];
      const rightFeatures = ['Unlimited members', '500 GB storage', '24/7 priority support', 'Advanced analytics & AI', 'Full API access', 'Custom integrations', 'Dedicated success manager'];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Comparison',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#0a0a14', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Standard vs Premium' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'See exactly what you get with each plan so you can choose with confidence.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: compCont, type: 'container', label: 'Comparison Columns',
            styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' }, alignItems: 'stretch' },
            children: [
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: 'Standard Plan',
                styles: { width: '50%', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan Name', props: { text: 'Standard' }, styles: { fontSize: '24px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Price',
                    styles: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: '$29' }, styles: { fontSize: '40px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '14px', color: '#64748b' } }),
                    ],
                  }),
                  ...leftFeatures.map((f) =>
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: f, props: { text: `✓  ${f}` }, styles: { fontSize: '14px', color: '#cbd5e1', width: '100%', textAlign: 'left' } })
                  ),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Standard', href: '#standard' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.12)', marginTop: '8px', width: '100%' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: 'Premium Plan',
                styles: { width: '50%', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: '16px', borderWidth: '2px', borderColor: '#7c3aed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'RECOMMENDED' }, styles: { fontSize: '10px', fontWeight: '700', color: '#7c3aed', letterSpacing: '1.5px', backgroundColor: 'rgba(124,58,237,0.2)', padding: { top: '4px', right: '12px', bottom: '4px', left: '12px' }, borderRadius: '9999px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan Name', props: { text: 'Premium' }, styles: { fontSize: '24px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Price',
                    styles: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: '$79' }, styles: { fontSize: '40px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '14px', color: '#64748b' } }),
                    ],
                  }),
                  ...rightFeatures.map((f) =>
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: f, props: { text: `✓  ${f}` }, styles: { fontSize: '14px', color: '#cbd5e1', width: '100%', textAlign: 'left' } })
                  ),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Premium', href: '#premium' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', marginTop: '8px', width: '100%' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'services-minimal-list',
    name: 'Services: Minimal Clean List',
    category: 'services',
    description: 'Clean minimal service list with dividers on a white background.',
    preview: 'bg-white p-4 flex flex-col gap-2',
    tags: ['minimal', 'clean', 'white', 'list'],
    style: 'minimal',
    industry: ['architecture', 'interior-design', 'consulting', 'legal'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const listCont = generateNodeId('container');

      const items = [
        { num: '01', title: 'Initial Consultation', desc: 'A comprehensive discussion to understand your vision, requirements, and project scope.' },
        { num: '02', title: 'Concept Development', desc: 'Multiple design directions presented with mood boards, wireframes, and detailed proposals.' },
        { num: '03', title: 'Refinement & Details', desc: 'Iterative feedback cycles to perfect every element until it exceeds your expectations.' },
        { num: '04', title: 'Final Delivery', desc: 'Polished assets, documentation, and handoff with full ownership and ongoing support options.' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Minimal List',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#ffffff' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Our Process' }, styles: { fontSize: '36px', fontWeight: '800', color: '#111827' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'A meticulous four-step approach that ensures flawless execution every time.' }, styles: { fontSize: '16px', color: '#6b7280' } }),
            ],
          }),
          createBuilderNode({
            id: listCont, type: 'container', label: 'Process List',
            styles: { display: 'flex', flexDirection: 'column', gap: '0px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: items.map((item, i) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: item.title,
                styles: { display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'flex-start', padding: { top: '28px', right: '0px', bottom: '28px', left: '0px' }, borderWidth: i < items.length - 1 ? '1px' : '0px', borderColor: '#e5e7eb', borderBottomStyle: 'solid' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: item.num }, styles: { fontSize: '28px', fontWeight: '900', color: '#d1d5db', width: '48px', textAlign: 'center', flexShrink: '0' } }),
                  createBuilderNode({
                    id: generateNodeId('container'), type: 'container', label: 'Text Group',
                    styles: { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: item.title }, styles: { fontSize: '20px', fontWeight: '700', color: '#111827' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: item.desc }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#6b7280' } }),
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
    id: 'services-card-gradient',
    name: 'Services: Gradient Background Cards',
    category: 'services',
    description: 'Service cards with gradient backgrounds and modern styling on a dark background.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['gradient', 'cards', 'colorful', 'modern'],
    style: 'bold',
    industry: ['startup', 'saas', 'creative'],
    createNode: () => {
      const secId = generateNodeId('section');
      const headerCont = generateNodeId('container');
      const gridCont = generateNodeId('container');

      const cards = [
        { title: 'Brand Strategy', desc: 'Define your identity, voice, and market positioning to stand out in crowded markets.', gradient: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.1) 100%)', accent: '#a78bfa' },
        { title: 'Product Design', desc: 'User-centered design that transforms complex workflows into intuitive experiences.', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(244,114,182,0.1) 100%)', accent: '#f472b6' },
        { title: 'Full-Stack Dev', desc: 'Robust, scalable applications built with cutting-edge technology and rigorous testing.', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(96,165,250,0.1) 100%)', accent: '#60a5fa' },
        { title: 'Growth Engine', desc: 'Data-driven marketing systems that compound growth month over month.', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(74,222,128,0.1) 100%)', accent: '#4ade80' },
      ];

      return createSectionNode({
        id: secId, type: 'section', label: 'Services: Gradient Cards',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({
            id: headerCont, type: 'container', label: 'Header',
            styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Services That Drive Results' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'A full spectrum of creative and technical services under one roof.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({
            id: gridCont, type: 'container', label: 'Gradient Cards Grid',
            styles: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: cards.map((card) =>
              createBuilderNode({
                id: generateNodeId('container'), type: 'container', label: card.title,
                styles: { width: 'calc(50% - 10px)', padding: { top: '36px', right: '28px', bottom: '36px', left: '28px' }, backgroundImage: card.gradient, borderRadius: '18px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', textAlign: 'left' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: card.title }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: card.desc }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Learn More', props: { text: 'Learn More →', href: '#learn' }, styles: { backgroundColor: 'transparent', color: card.accent, fontWeight: '700', padding: { top: '8px', right: '0px', bottom: '8px', left: '0px' }, borderRadius: '0px', marginTop: '8px' } }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
];
