import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type PricingSection = SectionTemplateItem & { category: 'pricing' };

export const pricingSections: PricingSection[] = [
  {
    id: 'pricing-3-tier',
    name: 'Pricing: 3 Tiers',
    category: 'pricing',
    description: 'Three pricing tier cards for Starter, Pro, and Enterprise plans with feature lists.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['3-tier', 'standard', 'comparison'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      const tiers = [
        { name: 'Starter', price: '$29', period: '/mo', desc: 'Perfect for small teams getting started.', features: ['5 team members', '10GB storage', 'Basic analytics', 'Email support'], highlight: false },
        { name: 'Pro', price: '$79', period: '/mo', desc: 'Best for growing businesses.', features: ['Unlimited members', '100GB storage', 'Advanced analytics', 'Priority support', 'Custom integrations'], highlight: true },
        { name: 'Enterprise', price: '$199', period: '/mo', desc: 'For large-scale organizations.', features: ['Everything in Pro', 'Unlimited storage', 'Dedicated account manager', 'SSO & SAML', '99.99% SLA'], highlight: false },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: 3 Tiers',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'PRICING' }, styles: { fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Simple, Transparent Pricing' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'No hidden fees. Cancel anytime. Start with a free trial.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Tiers Grid', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: '33.33%', padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' }, backgroundColor: tier.highlight ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.03)', borderRadius: '20px', borderWidth: '1px', borderColor: tier.highlight ? '#7c3aed' : 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' },
                children: [
                  ...(tier.highlight ? [createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Popular Badge', props: { text: 'MOST POPULAR' }, styles: { fontSize: '11px', fontWeight: '700', color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.2)', padding: { top: '4px', right: '12px', bottom: '4px', left: '12px' }, borderRadius: '9999px', letterSpacing: '1px' } })] : []),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan Name', props: { text: tier.name }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: tier.price }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: tier.period }, styles: { fontSize: '16px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: tier.desc }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: tier.highlight ? 'Start Free Trial' : 'Get Started', href: '#start' }, styles: { backgroundColor: tier.highlight ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px', width: '100%', borderWidth: tier.highlight ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.12)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Feature: ${f}`, styles: { display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Check', props: { text: '✓' }, styles: { fontSize: '14px', color: '#22c55e', fontWeight: '700' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature', props: { text: f }, styles: { fontSize: '14px', color: '#cbd5e1' } }),
                        ],
                      })
                    ),
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
    id: 'pricing-4-tier',
    name: 'Pricing: 4 Tiers',
    category: 'pricing',
    description: 'Four pricing tiers in a compact horizontal layout for comprehensive plan comparison.',
    preview: 'bg-[#06060c] p-4 flex gap-2',
    tags: ['4-tier', 'comprehensive', 'compact'],
    style: 'modern',
    industry: ['saas', 'technology', 'enterprise'],
    createNode: () => {
      const tiers = [
        { name: 'Free', price: '$0', desc: 'For individuals', features: ['1 user', '1GB storage', 'Community support'] },
        { name: 'Starter', price: '$19', desc: 'For small teams', features: ['5 users', '20GB storage', 'Email support'] },
        { name: 'Growth', price: '$49', desc: 'For scaling teams', features: ['25 users', '100GB storage', 'Priority support'] },
        { name: 'Enterprise', price: 'Custom', desc: 'For organizations', features: ['Unlimited users', 'Unlimited storage', 'Dedicated support'] },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: 4 Tiers',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Choose Your Plan' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Start free and scale as you grow. No credit card required.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Tiers Row', styles: { display: 'flex', flexDirection: 'row', gap: '20px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier, i) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: '25%', padding: { top: '28px', right: '20px', bottom: '28px', left: '20px' }, backgroundColor: i === 2 ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: i === 2 ? '#7c3aed' : 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan', props: { text: tier.name }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '2px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: tier.price }, styles: { fontSize: '36px', fontWeight: '900', color: '#ffffff' } }),
                      ...(tier.price !== 'Custom' ? [createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '14px', color: '#94a3b8' } })] : []),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: tier.desc }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: tier.price === 'Custom' ? 'Contact Sales' : 'Get Started', href: '#start' }, styles: { backgroundColor: i === 2 ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '600', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '8px', width: '100%', fontSize: '13px', borderWidth: i === 2 ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.1)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: `Feature`, props: { text: `✓  ${f}` }, styles: { fontSize: '13px', color: '#cbd5e1', textAlign: 'left' } })
                    ),
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
    id: 'pricing-comparison',
    name: 'Pricing: Comparison Table',
    category: 'pricing',
    description: 'Full pricing comparison table with feature rows and plan columns.',
    preview: 'bg-[#06060c] p-4',
    tags: ['comparison', 'table', 'detailed'],
    style: 'modern',
    industry: ['saas', 'enterprise', 'technology'],
    createNode: () => {
      const plans = ['Starter', 'Pro', 'Enterprise'];
      const features = [
        { name: 'Team Members', vals: ['5', '25', 'Unlimited'] },
        { name: 'Storage', vals: ['10GB', '100GB', 'Unlimited'] },
        { name: 'API Access', vals: ['Limited', 'Full', 'Full + Custom'] },
        { name: 'Analytics', vals: ['Basic', 'Advanced', 'Advanced + BI'] },
        { name: 'Support', vals: ['Email', 'Priority', 'Dedicated'] },
        { name: 'SSO / SAML', vals: ['—', '—', '✓'] },
        { name: 'Custom Integrations', vals: ['—', '✓', '✓'] },
        { name: 'SLA', vals: ['99.9%', '99.95%', '99.99%'] },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Comparison',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Compare Plans' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Find the perfect plan for your team\'s needs.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Table', styles: { maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' }, borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Table Header', styles: { display: 'flex', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' } },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature Col Header', props: { text: 'Feature' }, styles: { width: '40%', fontSize: '14px', fontWeight: '700', color: '#94a3b8', textAlign: 'left' } }),
                  ...plans.map((p) => createBuilderNode({ id: generateNodeId('text'), type: 'text', label: `${p} Header`, props: { text: p }, styles: { width: '20%', fontSize: '14px', fontWeight: '700', color: '#ffffff', textAlign: 'center' } })),
                ],
              }),
              ...features.map((feat, fi) =>
                createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Row: ${feat.name}`, styles: { display: 'flex', flexDirection: 'row', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, backgroundColor: fi % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderTopWidth: '1px', borderTopColor: 'rgba(255,255,255,0.06)' },
                  children: [
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature Name', props: { text: feat.name }, styles: { width: '40%', fontSize: '14px', color: '#cbd5e1', textAlign: 'left' } }),
                    ...feat.vals.map((v, vi) => createBuilderNode({ id: generateNodeId('text'), type: 'text', label: `${plans[vi]} Value`, props: { text: v }, styles: { width: '20%', fontSize: '14px', color: v === '—' ? '#475569' : '#e2e8f0', textAlign: 'center', fontWeight: vi === 1 ? '600' : '400' } })),
                  ],
                })
              ),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'pricing-toggle',
    name: 'Pricing: Monthly / Yearly Toggle',
    category: 'pricing',
    description: 'Pricing cards with a monthly/yearly billing toggle and savings badge.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['toggle', 'billing', 'savings'],
    style: 'modern',
    industry: ['saas', 'subscription', 'technology'],
    createNode: () => {
      const tiers = [
        { name: 'Individual', monthly: '$19', yearly: '$15', features: ['1 user', '10GB storage', 'Basic analytics'] },
        { name: 'Team', monthly: '$49', yearly: '$39', features: ['10 users', '50GB storage', 'Advanced analytics', 'Priority support'] },
        { name: 'Business', monthly: '$99', yearly: '$79', features: ['Unlimited users', '200GB storage', 'Custom analytics', 'Dedicated manager'] },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Toggle',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '40px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Plans That Scale With You' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Save up to 20% with annual billing.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Toggle', styles: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: { top: '6px', right: '6px', bottom: '6px', left: '6px' }, borderRadius: '9999px', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Monthly Label', props: { text: 'Monthly' }, styles: { fontSize: '14px', fontWeight: '600', color: '#94a3b8', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' } } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Toggle Knob', styles: { width: '44px', height: '24px', borderRadius: '9999px', backgroundColor: '#7c3aed', position: 'relative' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Yearly Label', props: { text: 'Yearly' }, styles: { fontSize: '14px', fontWeight: '600', color: '#ffffff', padding: { top: '8px', right: '16px', bottom: '8px', left: '16px' } } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Save Badge', props: { text: 'SAVE 20%' }, styles: { fontSize: '10px', fontWeight: '700', color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: { top: '3px', right: '8px', bottom: '3px', left: '8px' }, borderRadius: '9999px', letterSpacing: '0.5px' } }),
                ],
              }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Cards Row', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1000px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier, i) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: '33.33%', padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' }, backgroundColor: i === 1 ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: i === 1 ? '#7c3aed' : 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan', props: { text: tier.name }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Yearly', props: { text: tier.yearly }, styles: { fontSize: '40px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo billed yearly' }, styles: { fontSize: '13px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Monthly Price', props: { text: `Billed monthly: ${tier.monthly}/mo` }, styles: { fontSize: '12px', color: '#64748b' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Free Trial', href: '#start' }, styles: { backgroundColor: i === 1 ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', width: '100%', borderWidth: i === 1 ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.1)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature', props: { text: `✓  ${f}` }, styles: { fontSize: '13px', color: '#cbd5e1', textAlign: 'left' } })
                    ),
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
    id: 'pricing-minimal',
    name: 'Pricing: Minimal White',
    category: 'pricing',
    description: 'Clean minimal pricing cards on white background with elegant typography.',
    preview: 'bg-white p-4 flex gap-2',
    tags: ['minimal', 'white', 'clean'],
    style: 'minimal',
    industry: ['consulting', 'agency', 'architecture'],
    createNode: () => {
      const tiers = [
        { name: 'Essentials', price: '$49', desc: 'For freelancers', features: ['3 projects', '5GB storage', 'Email support'] },
        { name: 'Professional', price: '$129', desc: 'For agencies', features: ['Unlimited projects', '50GB storage', 'Priority support', 'API access'], highlight: true },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Minimal',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#ffffff', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '500px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Pricing' }, styles: { fontSize: '38px', fontWeight: '800', color: '#111827' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Choose a plan that fits your workflow.' }, styles: { fontSize: '16px', color: '#6b7280' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Cards Row', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: '50%', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, backgroundColor: tier.highlight ? '#111827' : '#f9fafb', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan', props: { text: tier.name }, styles: { fontSize: '20px', fontWeight: '700', color: tier.highlight ? '#ffffff' : '#111827' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: tier.price }, styles: { fontSize: '44px', fontWeight: '900', color: tier.highlight ? '#ffffff' : '#111827' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '15px', color: tier.highlight ? '#94a3b8' : '#6b7280' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: tier.desc }, styles: { fontSize: '14px', color: tier.highlight ? '#94a3b8' : '#6b7280' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Get Started', href: '#start' }, styles: { backgroundColor: tier.highlight ? '#ffffff' : '#111827', color: tier.highlight ? '#111827' : '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px', width: '100%' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature', props: { text: `✓  ${f}` }, styles: { fontSize: '14px', color: tier.highlight ? '#cbd5e1' : '#4b5563', textAlign: 'left' } })
                    ),
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
    id: 'pricing-featured',
    name: 'Pricing: Featured Tier',
    category: 'pricing',
    description: 'Pricing with one prominently featured/recommended tier elevated above the others.',
    preview: 'bg-[#06060c] p-4 flex gap-3 items-center',
    tags: ['featured', 'recommended', 'elevated'],
    style: 'bold',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      const tiers = [
        { name: 'Basic', price: '$29', desc: 'For individuals', features: ['3 users', '10GB storage', 'Basic support'] },
        { name: 'Professional', price: '$79', desc: 'For growing teams', features: ['15 users', '100GB storage', 'Priority support', 'API access', 'Custom domain'], featured: true },
        { name: 'Enterprise', price: '$199', desc: 'For organizations', features: ['Unlimited users', '500GB storage', 'Dedicated manager'] },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Featured',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Pick the Right Plan' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Everything you need to build, grow, and scale.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Tiers', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: tier.featured ? '36%' : '32%', padding: tier.featured ? { top: '40px', right: '28px', bottom: '40px', left: '28px' } : { top: '28px', right: '24px', bottom: '28px', left: '24px' }, backgroundColor: tier.featured ? '#7c3aed' : 'rgba(255,255,255,0.03)', borderRadius: '20px', borderWidth: tier.featured ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', transform: tier.featured ? 'scale(1.05)' : 'scale(1)', boxShadow: tier.featured ? '0 25px 60px rgba(124, 58, 237, 0.4)' : 'none' },
                children: [
                  ...(tier.featured ? [createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'RECOMMENDED' }, styles: { fontSize: '11px', fontWeight: '700', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.2)', padding: { top: '4px', right: '12px', bottom: '4px', left: '12px' }, borderRadius: '9999px', letterSpacing: '1px' } })] : []),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan', props: { text: tier.name }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: tier.price }, styles: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '14px', color: tier.featured ? 'rgba(255,255,255,0.7)' : '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: tier.desc }, styles: { fontSize: '14px', color: tier.featured ? 'rgba(255,255,255,0.8)' : '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Get Started', href: '#start' }, styles: { backgroundColor: tier.featured ? '#ffffff' : 'rgba(255,255,255,0.06)', color: tier.featured ? '#7c3aed' : '#ffffff', fontWeight: '700', padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' }, borderRadius: '10px', width: '100%', borderWidth: tier.featured ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.12)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature', props: { text: `✓  ${f}` }, styles: { fontSize: '13px', color: tier.featured ? 'rgba(255,255,255,0.9)' : '#cbd5e1', textAlign: 'left' } })
                    ),
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
    id: 'pricing-enterprise',
    name: 'Pricing: Enterprise Contact',
    category: 'pricing',
    description: 'Enterprise-focused pricing with prominent contact sales CTA and custom plan details.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['enterprise', 'contact-sales', 'custom'],
    style: 'modern',
    industry: ['enterprise', 'b2b', 'saas'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Enterprise',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'ENTERPRISE' }, styles: { fontSize: '12px', fontWeight: '700', color: '#f59e0b', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Built for Enterprise Scale' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Custom solutions tailored to your organization\'s unique requirements.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Enterprise Card', styles: { padding: { top: '40px', right: '40px', bottom: '40px', left: '40px' }, borderRadius: '20px', backgroundImage: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)', borderWidth: '1px', borderColor: 'rgba(245, 158, 11, 0.2)', maxWidth: '900px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Enterprise Features Grid', styles: { display: 'flex', flexDirection: 'row', gap: '32px', marginBottom: '32px' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Col 1', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Feature 1 Title', props: { text: 'Unlimited Everything' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature 1 Desc', props: { text: 'No limits on users, storage, API calls, or bandwidth. Scale without constraints.' }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Feature 2 Title', props: { text: '99.99% Uptime SLA' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature 2 Desc', props: { text: 'Guaranteed uptime with financial credits. Built on redundant infrastructure.' }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Col 2', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Feature 3 Title', props: { text: 'Dedicated Support' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature 3 Desc', props: { text: 'Named account manager, 24/7 phone support, and custom onboarding.' }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Feature 4 Title', props: { text: 'SSO & Compliance' }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature 4 Desc', props: { text: 'SAML SSO, SOC 2 Type II, GDPR compliance, and custom data residency.' }, styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'CTA Row', styles: { display: 'flex', gap: '12px', justifyContent: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Contact Sales', props: { text: 'Contact Sales', href: '#contact' }, styles: { backgroundColor: '#f59e0b', color: '#000000', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'View Docs', props: { text: 'View Documentation', href: '#docs' }, styles: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontWeight: '600', padding: { top: '14px', right: '24px', bottom: '14px', left: '24px' }, borderRadius: '12px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.12)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'pricing-simple',
    name: 'Pricing: Simple Two-Tier',
    category: 'pricing',
    description: 'Simple side-by-side two-tier pricing for quick decision making.',
    preview: 'bg-[#06060c] p-4 flex gap-3',
    tags: ['simple', '2-tier', 'quick'],
    style: 'modern',
    industry: ['startup', 'saas', 'freelance'],
    createNode: () => {
      const tiers = [
        { name: 'Free', price: '$0', desc: 'Perfect for trying things out.', features: ['1 project', 'Basic features', 'Community support', '1GB storage'], highlight: false },
        { name: 'Pro', price: '$39', desc: 'For serious professionals.', features: ['Unlimited projects', 'All features', 'Priority support', '100GB storage', 'Custom domain', 'Analytics dashboard'], highlight: true },
      ];

      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Pricing: Simple',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '500px', margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Start Free, Go Pro' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'No complex tiers. Just two plans to choose from.' }, styles: { fontSize: '16px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Cards', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: tiers.map((tier) =>
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Tier: ${tier.name}`, styles: { width: '50%', padding: { top: '32px', right: '28px', bottom: '32px', left: '28px' }, backgroundColor: tier.highlight ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.03)', borderRadius: '20px', borderWidth: '1px', borderColor: tier.highlight ? '#7c3aed' : 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Plan', props: { text: tier.name }, styles: { fontSize: '22px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Price', styles: { display: 'flex', alignItems: 'baseline', gap: '4px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Amount', props: { text: tier.price }, styles: { fontSize: '48px', fontWeight: '900', color: '#ffffff' } }),
                      ...(tier.price !== '$0' ? [createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Period', props: { text: '/mo' }, styles: { fontSize: '15px', color: '#94a3b8' } })] : []),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: tier.desc }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: tier.highlight ? 'Upgrade to Pro' : 'Get Started Free', href: '#start' }, styles: { backgroundColor: tier.highlight ? '#7c3aed' : 'rgba(255,255,255,0.06)', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '12px', width: '100%', borderWidth: tier.highlight ? '0px' : '1px', borderColor: 'rgba(255,255,255,0.12)' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Features', styles: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' },
                    children: tier.features.map((f) =>
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Feature', props: { text: `✓  ${f}` }, styles: { fontSize: '14px', color: '#cbd5e1', textAlign: 'left' } })
                    ),
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },
];
