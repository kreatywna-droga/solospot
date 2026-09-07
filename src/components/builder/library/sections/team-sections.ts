import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type TeamSection = SectionTemplateItem & { category: 'team' };

export const teamSections: TeamSection[] = [
  {
    id: 'team-grid',
    name: 'Team Grid',
    category: 'team',
    description: '4 team member cards with photos, names, and roles in a grid layout.',
    preview: 'bg-[#06060c] p-4',
    tags: ['grid', 'cards', 'photos'],
    createNode: () => {
      const members = [
        { name: 'Sarah Chen', role: 'CEO & Co-Founder', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
        { name: 'Marcus Rivera', role: 'CTO', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
        { name: 'Emily Watson', role: 'Head of Design', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80' },
        { name: 'James Park', role: 'VP of Engineering', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Grid',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Team Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR TEAM' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Meet the People Driving Our Vision' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Grid', styles: { display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', width: '100%' },
                children: members.map(m =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: m.name, styles: { width: 'calc(25% - 18px)', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: m.name, props: { src: m.src, alt: m.name }, styles: { width: '100px', height: '100px', borderRadius: '9999px', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: m.name }, styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: m.role }, styles: { fontSize: '13px', color: '#94a3b8', fontWeight: '500' } }),
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
    id: 'team-cards',
    name: 'Team Cards',
    category: 'team',
    description: '3 larger team cards with bios and social links.',
    preview: 'bg-[#06060c] p-4',
    tags: ['cards', 'bios', 'large'],
    createNode: () => {
      const members = [
        { name: 'Sarah Chen', role: 'CEO & Co-Founder', bio: 'Former product lead at Stripe. Passionate about building tools that democratize technology for creators everywhere.', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
        { name: 'Marcus Rivera', role: 'CTO', bio: 'Distributed systems expert with 15 years of experience. Built infrastructure serving billions of requests at previous companies.', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
        { name: 'Emily Watson', role: 'Head of Design', bio: 'Award-winning designer. Previously led design at Figma. Believes in the power of simplicity and human-centered design.', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Cards',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Team Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'LEADERSHIP' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The Minds Behind the Mission' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Cards', styles: { display: 'flex', gap: '24px', justifyContent: 'center', width: '100%' },
                children: members.map(m =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: m.name, styles: { flex: '1', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: m.name, props: { src: m.src, alt: m.name }, styles: { width: '100%', height: '280px', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Card Body', styles: { padding: { top: '20px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '8px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: m.name }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: m.role }, styles: { fontSize: '13px', color: '#a78bfa', fontWeight: '600' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Bio', props: { text: m.bio }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#94a3b8', marginTop: '4px' } }),
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
  {
    id: 'team-minimal',
    name: 'Minimal Team',
    category: 'team',
    description: 'Minimal team member rows with white background.',
    preview: 'bg-white p-4',
    tags: ['minimal', 'rows', 'white', 'clean'],
    createNode: () => {
      const members = [
        { name: 'Sarah Chen', role: 'CEO & Co-Founder', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80' },
        { name: 'Marcus Rivera', role: 'CTO', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80' },
        { name: 'Emily Watson', role: 'Head of Design', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80' },
        { name: 'James Park', role: 'VP of Engineering', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80' },
        { name: 'Priya Sharma', role: 'Head of Growth', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Minimal',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#ffffff' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Team Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', maxWidth: '700px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Our Team' }, styles: { fontSize: '36px', fontWeight: '800', color: '#111827' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Talented people building something meaningful.' }, styles: { fontSize: '16px', color: '#6b7280' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Member List', styles: { display: 'flex', flexDirection: 'column', gap: '0px', width: '100%' },
                children: members.map((m, i) =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: m.name, styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', padding: { top: '20px', right: '0px', bottom: '20px', left: '0px' }, borderBottomWidth: i < members.length - 1 ? '1px' : '0px', borderColor: '#e5e7eb' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: m.name, props: { src: m.src, alt: m.name }, styles: { width: '56px', height: '56px', borderRadius: '9999px', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Info', styles: { display: 'flex', flexDirection: 'column', gap: '2px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: m.name }, styles: { fontSize: '16px', fontWeight: '700', color: '#111827' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: m.role }, styles: { fontSize: '13px', color: '#6b7280' } }),
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
  {
    id: 'team-centered',
    name: 'Centered Team',
    category: 'team',
    description: 'Centered team member with large photo and description.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['centered', 'featured', 'large-photo'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Centered',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Featured Member', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'FOUNDER SPOTLIGHT' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Founder Photo', props: { src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80', alt: 'Sarah Chen' }, styles: { width: '240px', height: '240px', borderRadius: '9999px', objectFit: 'cover', border: '4px solid rgba(124,58,237,0.4)' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Sarah Chen' }, styles: { fontSize: '28px', fontWeight: '800', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'CEO & Co-Founder' }, styles: { fontSize: '14px', color: '#a78bfa', fontWeight: '600' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Bio', props: { text: '"I started this company because I believed that the best products are built when the right tools meet the right team. Every day, I am inspired by what our customers create with our platform. This is just the beginning."' }, styles: { fontSize: '16px', lineHeight: '1.7', color: '#94a3b8', fontStyle: 'italic' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'View All Leaders', href: '#leaders' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'team-bento',
    name: 'Bento Grid Team',
    category: 'team',
    description: 'Bento-style grid layout for team members with varying card sizes.',
    preview: 'bg-[#06060c] p-4',
    tags: ['bento', 'grid', 'asymmetric'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Bento',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Bento Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR TEAM' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Creatives, Engineers, Visionaries' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Bento Grid', styles: { display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' },
                children: [
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Large Card', styles: { width: 'calc(50% - 8px)', height: '320px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Sarah', props: { src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80', alt: 'Sarah Chen' }, styles: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay', styles: { position: 'absolute', bottom: '0px', left: '0px', right: '0px', padding: { top: '40px', right: '24px', bottom: '20px', left: '24px' }, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Sarah Chen' }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'CEO & Co-Founder' }, styles: { fontSize: '13px', color: '#a78bfa', fontWeight: '600' } }),
                        ],
                      }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Small Stack', styles: { width: 'calc(50% - 8px)', display: 'flex', flexDirection: 'column', gap: '16px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Top Small', styles: { height: '152px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end' },
                        children: [
                          createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Marcus', props: { src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80', alt: 'Marcus Rivera' }, styles: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } }),
                          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay', styles: { position: 'absolute', bottom: '0px', left: '0px', right: '0px', padding: { top: '30px', right: '20px', bottom: '14px', left: '20px' }, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
                            children: [
                              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Marcus Rivera' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'CTO' }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                            ],
                          }),
                        ],
                      }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Bottom Small', styles: { height: '152px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end' },
                        children: [
                          createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Emily', props: { src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80', alt: 'Emily Watson' }, styles: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } }),
                          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay', styles: { position: 'absolute', bottom: '0px', left: '0px', right: '0px', padding: { top: '30px', right: '20px', bottom: '14px', left: '20px' }, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
                            children: [
                              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Emily Watson' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'Head of Design' }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Row Bottom', styles: { display: 'flex', gap: '16px', width: '100%' },
                    children: [
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'James', styles: { flex: '1', height: '180px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end' },
                        children: [
                          createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'James', props: { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', alt: 'James Park' }, styles: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } }),
                          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay', styles: { position: 'absolute', bottom: '0px', left: '0px', right: '0px', padding: { top: '30px', right: '20px', bottom: '14px', left: '20px' }, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
                            children: [
                              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'James Park' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'VP of Engineering' }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                            ],
                          }),
                        ],
                      }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Priya', styles: { flex: '1', height: '180px', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end' },
                        children: [
                          createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Priya', props: { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', alt: 'Priya Sharma' }, styles: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' } }),
                          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay', styles: { position: 'absolute', bottom: '0px', left: '0px', right: '0px', padding: { top: '30px', right: '20px', bottom: '14px', left: '20px' }, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' },
                            children: [
                              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Priya Sharma' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: 'Head of Growth' }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                            ],
                          }),
                        ],
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
    id: 'team-horizontal',
    name: 'Horizontal Scroll Team',
    category: 'team',
    description: 'Horizontal scrollable team cards with photos and roles.',
    preview: 'bg-[#06060c] p-4',
    tags: ['horizontal', 'scroll', 'cards'],
    createNode: () => {
      const members = [
        { name: 'Sarah Chen', role: 'CEO', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
        { name: 'Marcus Rivera', role: 'CTO', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
        { name: 'Emily Watson', role: 'Design Lead', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80' },
        { name: 'James Park', role: 'Engineering', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
        { name: 'Priya Sharma', role: 'Growth', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80' },
        { name: 'David Kim', role: 'Product', src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Horizontal',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Horizontal Wrapper', styles: { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR TEAM' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Meet the Crew' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Scroll Track', styles: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '8px', width: '100%' },
                children: members.map(m =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: m.name, styles: { minWidth: '220px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', flexShrink: '0' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: m.name, props: { src: m.src, alt: m.name }, styles: { width: '88px', height: '88px', borderRadius: '9999px', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: m.name }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: m.role }, styles: { fontSize: '13px', color: '#94a3b8' } }),
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
    id: 'team-office',
    name: 'Team Office',
    category: 'team',
    description: 'Team section with office background image.',
    preview: 'bg-[#06060c] p-4 text-center',
    tags: ['office', 'background', 'culture'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Office',
        styles: { padding: { top: '100px', right: '24px', bottom: '100px', left: '24px' }, backgroundImage: 'linear-gradient(180deg, rgba(6,6,12,0.88) 0%, rgba(6,6,12,0.95) 100%), url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Office Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR CULTURE' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Built on Passion, Driven by Purpose' }, styles: { fontSize: '42px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Our offices are more than workspaces — they are creative hubs where ideas collide, experiments thrive, and breakthroughs happen daily. We foster an environment of radical openness and relentless curiosity.' }, styles: { fontSize: '16px', lineHeight: '1.7', color: 'rgba(255,255,255,0.75)', maxWidth: '640px' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Team Row', styles: { display: 'flex', gap: '-12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&q=80',
                  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&q=80',
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&q=80',
                ].map((src, i) =>
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: `Team ${i}`, props: { src, alt: `Team member ${i}` }, styles: { width: '48px', height: '48px', borderRadius: '9999px', objectFit: 'cover', border: '2px solid #06060c', marginLeft: i > 0 ? '-12px' : '0px' } })
                ),
              }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Join Us', props: { text: 'Join Our Team', href: '#careers' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '10px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'team-leadership',
    name: 'Leadership Team',
    category: 'team',
    description: 'Leadership team with large photos and detailed bios.',
    preview: 'bg-[#06060c] p-4',
    tags: ['leadership', 'bios', 'executive'],
    createNode: () => {
      const leaders = [
        { name: 'Sarah Chen', role: 'CEO & Co-Founder', bio: 'Former product lead at Stripe. MBA from Stanford. Sarah has spent 12 years building products that scale to millions of users.', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80' },
        { name: 'Marcus Rivera', role: 'CTO & Co-Founder', bio: 'Former principal engineer at Netflix. Built distributed systems handling 200M+ requests per day. MIT Computer Science.', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80' },
        { name: 'Emily Watson', role: 'Head of Design', bio: 'Award-winning designer. Previously design director at Figma and Airbnb. Leads our product design and brand experience.', src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80' },
        { name: 'James Park', role: 'VP of Engineering', bio: 'Former engineering manager at Google. Expert in cloud infrastructure and developer tools. Leads our engineering organization.', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Team: Leadership',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Leadership Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'LEADERSHIP TEAM' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Visionary Leaders, Proven Track Records' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Leadership Grid', styles: { display: 'flex', flexWrap: 'wrap', gap: '24px', width: '100%' },
                children: leaders.map(l =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: l.name, styles: { width: 'calc(50% - 12px)', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'row' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: l.name, props: { src: l.src, alt: l.name }, styles: { width: '180px', height: 'auto', objectFit: 'cover', flexShrink: '0' } }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Bio Content', styles: { padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' }, display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: l.name }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Role', props: { text: l.role }, styles: { fontSize: '13px', color: '#a78bfa', fontWeight: '600' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Bio', props: { text: l.bio }, styles: { fontSize: '13px', lineHeight: '1.6', color: '#94a3b8', marginTop: '4px' } }),
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
];
