import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type NavigationSection = SectionTemplateItem & { category: 'navigation' };

export const navigationSections: NavigationSection[] = [
  {
    id: 'nav-modern',
    name: 'Modern Navbar',
    category: 'navigation',
    description: 'Modern navigation bar with logo left, centered links, and CTA button right.',
    preview: 'bg-[#090912] p-4 flex items-center',
    tags: ['modern', 'centered-links', 'cta', 'clean'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Nav: Modern',
        styles: {
          padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
          backgroundColor: '#090912',
          borderBottomWidth: '1px',
          borderColor: 'rgba(255,255,255,0.06)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nav Content',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'WebFactor' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Nav Links',
                styles: { display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Features', props: { text: 'Features' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Pricing', props: { text: 'Pricing' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Docs', props: { text: 'Docs' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Blog', props: { text: 'Blog' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Nav Actions',
                styles: { display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Sign In', props: { text: 'Sign In' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Get Started', href: '#start' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '8px', fontSize: '13px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'nav-centered',
    name: 'Centered Logo Navbar',
    category: 'navigation',
    description: 'Navigation with centered logo, links on the left, and actions on the right.',
    preview: 'bg-white p-4 flex items-center',
    tags: ['centered', 'logo', 'balanced', 'symmetrical'],
    style: 'minimal',
    industry: ['architecture', 'design', 'luxury'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Nav: Centered',
        styles: {
          padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
          backgroundColor: '#ffffff',
          borderBottomWidth: '1px',
          borderColor: '#e5e7eb',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nav Content',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Links',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'center', width: '33%' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Work', props: { text: 'Work' }, styles: { fontSize: '13px', color: '#6b7280', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Services', props: { text: 'Services' }, styles: { fontSize: '13px', color: '#6b7280', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'About', props: { text: 'About' }, styles: { fontSize: '13px', color: '#6b7280', fontWeight: '500' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'STUDIO' }, styles: { fontSize: '18px', fontWeight: '800', color: '#111827', letterSpacing: '3px', width: '33%', textAlign: 'center' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Actions',
                styles: { display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', width: '33%', justifyContent: 'flex-end' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Contact', props: { text: 'Contact' }, styles: { fontSize: '13px', color: '#6b7280', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start a Project', href: '#contact' }, styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '600', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '6px', fontSize: '13px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'nav-minimal',
    name: 'Minimal Transparent Navbar',
    category: 'navigation',
    description: 'Transparent navigation with white text, suitable for overlaying hero images.',
    preview: 'bg-gradient-to-r from-gray-900 to-gray-800 p-4',
    tags: ['transparent', 'overlay', 'minimal', 'hero'],
    style: 'modern',
    industry: ['creative', 'agency', 'photography'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Nav: Minimal',
        styles: {
          padding: { top: '20px', right: '32px', bottom: '20px', left: '32px' },
          backgroundImage: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nav Content',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'APEX' }, styles: { fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '4px' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Nav Links',
                styles: { display: 'flex', flexDirection: 'row', gap: '36px', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Projects', props: { text: 'Projects' }, styles: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Studio', props: { text: 'Studio' }, styles: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Journal', props: { text: 'Journal' }, styles: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Contact', props: { text: 'Get in Touch', href: '#contact' }, styles: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', fontWeight: '600', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '9999px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.2)', fontSize: '13px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'nav-bold',
    name: 'Bold Navbar with CTA',
    category: 'navigation',
    description: 'Dark bold navbar with prominent CTA button and utility links.',
    preview: 'bg-[#0c0c1d] p-4 flex items-center',
    tags: ['bold', 'dark', 'cta', 'prominent'],
    style: 'bold',
    industry: ['technology', 'saas', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Nav: Bold',
        styles: {
          padding: { top: '16px', right: '24px', bottom: '16px', left: '24px' },
          backgroundColor: '#0c0c1d',
          borderBottomWidth: '2px',
          borderColor: '#7c3aed',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nav Content',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'NEXUS' }, styles: { fontSize: '20px', fontWeight: '900', color: '#ffffff' } }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Nav Links',
                styles: { display: 'flex', flexDirection: 'row', gap: '28px', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Platform', props: { text: 'Platform' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Solutions', props: { text: 'Solutions' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Enterprise', props: { text: 'Enterprise' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Pricing', props: { text: 'Pricing' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '600' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Actions',
                styles: { display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Login', props: { text: 'Login' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '600' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Start Free Trial', href: '#trial' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '10px', right: '24px', bottom: '10px', left: '24px' }, borderRadius: '8px', fontSize: '13px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'nav-split',
    name: 'Split Layout Navbar',
    category: 'navigation',
    description: 'Navigation with logo on the left half and centered links on the right half.',
    preview: 'bg-[#0a0a14] p-4 flex items-center',
    tags: ['split', 'two-column', 'asymmetric', 'unique'],
    style: 'modern',
    industry: ['business', 'consulting', 'enterprise'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Nav: Split',
        styles: {
          padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Nav Split Layout',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Left Half',
                styles: {
                  width: '40%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: { top: '20px', right: '32px', bottom: '20px', left: '32px' },
                  backgroundColor: '#7c3aed',
                },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Logo', props: { text: 'Vertex' }, styles: { fontSize: '20px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Right Half',
                styles: {
                  width: '60%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: { top: '0px', right: '32px', bottom: '0px', left: '32px' },
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Nav Links',
                    styles: { display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Services', props: { text: 'Services' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Work', props: { text: 'Work' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Team', props: { text: 'Team' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Contact', props: { text: 'Contact' }, styles: { fontSize: '14px', color: '#94a3b8', fontWeight: '500' } }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Book a Call', href: '#call' }, styles: { backgroundColor: 'transparent', color: '#7c3aed', fontWeight: '700', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '8px', borderWidth: '2px', borderColor: '#7c3aed', fontSize: '13px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
