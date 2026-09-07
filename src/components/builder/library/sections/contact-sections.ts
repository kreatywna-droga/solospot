import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type ContactSection = SectionTemplateItem & { category: 'contact' };

export const contactSections: ContactSection[] = [
  {
    id: 'contact-simple',
    name: 'Simple Contact',
    category: 'contact',
    description: 'Centered contact section with headline, email button, and subtle background.',
    preview: 'bg-[#0a0a14] p-4 text-center',
    tags: ['centered', 'email', 'minimal', 'clean'],
    style: 'modern',
    industry: ['saas', 'startup', 'technology'],
    createNode: () => {
      const secId = generateNodeId('section');
      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Contact: Simple',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0a0a14',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Contact Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '600px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'GET IN TOUCH' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: "Let's Build Something Great Together" }, styles: { fontSize: '40px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Have a question or a project in mind? We\'d love to hear from you. Reach out and let\'s start a conversation.' }, styles: { fontSize: '16px', lineHeight: '1.6', color: '#94a3b8', maxWidth: '480px' } }),
              createBuilderNode({
                id: generateNodeId('button'),
                type: 'button',
                label: 'Email CTA',
                props: { text: 'hello@example.com', href: 'mailto:hello@example.com' },
                styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' }, borderRadius: '12px' },
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'contact',
    description: 'Full contact form with name, email, subject, and message fields on a dark background.',
    preview: 'bg-[#0c0c1d] p-4 text-left',
    tags: ['form', 'fields', 'detailed', 'lead'],
    style: 'modern',
    industry: ['business', 'consulting', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Contact: Form',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0c0c1d',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Form Grid',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px',
              maxWidth: '700px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Send Us a Message' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Fill out the form below and we\'ll get back to you within 24 hours.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Form Fields',
                styles: { display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Name + Email Row',
                    styles: { display: 'flex', gap: '16px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name Field', props: { text: 'Full Name' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#94a3b8', fontSize: '14px' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email Field', props: { text: 'Email Address' }, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#94a3b8', fontSize: '14px' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subject Field', props: { text: 'Subject' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#94a3b8', fontSize: '14px', width: '100%' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Message Field', props: { text: 'Your message...' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '14px', right: '16px', bottom: '14px', left: '16px' }, color: '#94a3b8', fontSize: '14px', width: '100%', minHeight: '120px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Submit', props: { text: 'Send Message', href: '#send' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '8px', width: '100%', textAlign: 'center' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'contact-split',
    name: 'Split Contact',
    category: 'contact',
    description: 'Two-column layout with contact form on the left and office info on the right.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4',
    tags: ['split', 'two-column', 'info', 'form'],
    style: 'modern',
    industry: ['business', 'consulting', 'corporate'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Contact: Split',
        styles: {
          padding: { top: '80px', right: '40px', bottom: '80px', left: '40px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Split Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '60px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
              alignItems: 'flex-start',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left - Form',
                styles: { width: '55%', display: 'flex', flexDirection: 'column', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Send a Message' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: 'Your Name' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '12px', right: '16px', bottom: '12px', left: '16px' }, color: '#64748b', fontSize: '14px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'Email Address' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '12px', right: '16px', bottom: '12px', left: '16px' }, color: '#64748b', fontSize: '14px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Message', props: { text: 'Your Message' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '12px', right: '16px', bottom: '12px', left: '16px' }, color: '#64748b', fontSize: '14px', minHeight: '100px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Submit', props: { text: 'Send Message', href: '#send' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '8px', marginTop: '4px' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right - Info',
                styles: { width: '45%', display: 'flex', flexDirection: 'column', gap: '28px', padding: { top: '0px', right: '0px', bottom: '0px', left: '20px' } },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Info Title', props: { text: 'Our Office' }, styles: { fontSize: '24px', fontWeight: '700', color: '#ffffff' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Address Block',
                    styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Address Label', props: { text: 'Address' }, styles: { fontSize: '13px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Address', props: { text: '123 Innovation Drive\nSan Francisco, CA 94107' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Phone Block',
                    styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Phone Label', props: { text: 'Phone' }, styles: { fontSize: '13px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phone', props: { text: '+1 (415) 555-0132' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Hours Block',
                    styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Hours Label', props: { text: 'Hours' }, styles: { fontSize: '13px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Hours', props: { text: 'Monday – Friday: 9:00 AM – 6:00 PM\nSaturday: 10:00 AM – 4:00 PM' }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
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
    id: 'contact-map',
    name: 'Contact with Map',
    category: 'contact',
    description: 'Contact details paired with a map placeholder image for location context.',
    preview: 'bg-[#090912] p-4 text-left',
    tags: ['map', 'location', 'address', 'visual'],
    style: 'modern',
    industry: ['real-estate', 'local-business', 'hospitality'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Contact: Map',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Map Layout',
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
                label: 'Top - Info Bar',
                styles: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Find Us' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Quick Contact',
                    styles: { display: 'flex', gap: '24px', alignItems: 'center' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phone', props: { text: '+1 (415) 555-0132' }, styles: { fontSize: '14px', color: '#a78bfa', fontWeight: '600' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'hello@company.com' }, styles: { fontSize: '14px', color: '#94a3b8' } }),
                    ],
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Content Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '32px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Details Column',
                    styles: { width: '35%', display: 'flex', flexDirection: 'column', gap: '24px' },
                    children: [
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Location Detail',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Label', props: { text: 'LOCATION' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1.5px' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Address', props: { text: '456 Market Street\nSan Francisco, CA 94105' }, styles: { fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' } }),
                        ],
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Contact Detail',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Label', props: { text: 'CONTACT' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1.5px' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Contact Info', props: { text: 'Phone: +1 (415) 555-0132\nEmail: hello@company.com' }, styles: { fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' } }),
                        ],
                      }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Hours Detail',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Label', props: { text: 'HOURS' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1.5px' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Hours', props: { text: 'Mon–Fri: 9AM–6PM\nSat: 10AM–4PM\nSun: Closed' }, styles: { fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' } }),
                        ],
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Map Column',
                    styles: { width: '65%', display: 'flex', alignItems: 'stretch' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Map Placeholder', props: { src: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80', alt: 'Map location' }, styles: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' } }),
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
    id: 'contact-minimal',
    name: 'Minimal Contact',
    category: 'contact',
    description: 'Clean minimal contact with just essential details and a single CTA.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'clean', 'white', 'elegant'],
    style: 'minimal',
    industry: ['architecture', 'design', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Contact: Minimal',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#ffffff',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              maxWidth: '500px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Contact' }, styles: { fontSize: '42px', fontWeight: '800', color: '#111827', letterSpacing: '-1px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Address', props: { text: '123 Design Street\nNew York, NY 10001' }, styles: { fontSize: '15px', color: '#6b7280', lineHeight: '1.7' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Phone', props: { text: '+1 (212) 555-0199' }, styles: { fontSize: '15px', color: '#6b7280' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email', props: { text: 'studio@example.com' }, styles: { fontSize: '15px', color: '#6b7280' } }),
              createBuilderNode({
                id: generateNodeId('button'),
                type: 'button',
                label: 'CTA',
                props: { text: 'Schedule a Call', href: '#call' },
                styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '600', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '8px' },
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'contact-cards',
    name: 'Contact Cards',
    category: 'contact',
    description: 'Three contact info cards (email, phone, address) with icons and hover effects.',
    preview: 'bg-[#0c0c1d] p-4 flex gap-4',
    tags: ['cards', 'three-column', 'info', 'icon'],
    style: 'modern',
    industry: ['technology', 'saas', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Contact: Cards',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0c0c1d',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Cards Layout',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '48px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Contact Information' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Choose the way that works best for you.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Cards Grid',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px', width: '100%' },
                children: [
                  {
                    icon: '✉',
                    title: 'Email Us',
                    detail: 'hello@company.com',
                    sub: 'We reply within 24 hours',
                  },
                  {
                    icon: '📞',
                    title: 'Call Us',
                    detail: '+1 (415) 555-0132',
                    sub: 'Mon–Fri, 9AM–6PM',
                  },
                  {
                    icon: '📍',
                    title: 'Visit Us',
                    detail: '123 Innovation Drive',
                    sub: 'San Francisco, CA 94107',
                  },
                ].map((card) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: card.title,
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      padding: { top: '32px', right: '24px', bottom: '32px', left: '24px' },
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Icon', props: { text: card.icon }, styles: { fontSize: '32px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: card.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Detail', props: { text: card.detail }, styles: { fontSize: '15px', color: '#a78bfa', fontWeight: '600' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Sub', props: { text: card.sub }, styles: { fontSize: '13px', color: '#64748b' } }),
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
