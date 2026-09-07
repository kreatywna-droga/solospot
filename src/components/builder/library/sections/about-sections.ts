import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type AboutSection = SectionTemplateItem & { category: 'about' };

export const aboutSections: AboutSection[] = [
  {
    id: 'about-story',
    name: 'Story About',
    category: 'about',
    description: 'Image left, story text right. Clean dark background with narrative flow.',
    preview: 'bg-[#07070e] p-4 flex gap-4 items-center',
    tags: ['story', 'image-left', 'two-column'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Story',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#07070e' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Story Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Image Column', styles: { width: '48%', display: 'flex', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Story Image', props: { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', alt: 'Our story' }, styles: { width: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Text Column', styles: { width: '52%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR STORY' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Born From a Simple Idea' }, styles: { fontSize: '38px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Paragraph 1', props: { text: 'In 2018, two engineers sat in a cramped garage with one shared frustration: building digital products was painfully slow, expensive, and fragmented. Tools were disjointed, collaboration was an afterthought, and shipping meant weeks of waiting.' }, styles: { fontSize: '15px', lineHeight: '1.7', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Paragraph 2', props: { text: 'So we built the platform we wished existed — one unified workspace where teams could design, build, and launch together without friction.' }, styles: { fontSize: '15px', lineHeight: '1.7', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Read Full Story', props: { text: 'Read Full Story', href: '#story' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'about-mission',
    name: 'Mission Statement',
    category: 'about',
    description: 'Centered mission statement with supporting image below.',
    preview: 'bg-[#07070e] p-4 text-center',
    tags: ['mission', 'centered', 'statement'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Mission',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#07070e', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Mission Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '780px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR MISSION' }, styles: { fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Mission Headline', props: { text: 'Empowering Every Creator to Build Without Limits' }, styles: { fontSize: '42px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Mission Text', props: { text: 'We believe the tools of creation should be accessible to everyone. Our mission is to eliminate the barriers between imagination and reality, giving every team the power to bring bold ideas to life with speed and confidence.' }, styles: { fontSize: '17px', lineHeight: '1.7', color: '#94a3b8', maxWidth: '660px' } }),
              createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Mission Image', props: { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80', alt: 'Team mission' }, styles: { width: '100%', borderRadius: '16px', marginTop: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'about-timeline',
    name: 'Company Timeline',
    category: 'about',
    description: 'Timeline layout showcasing company milestones and growth.',
    preview: 'bg-[#07070e] p-4',
    tags: ['timeline', 'milestones', 'history'],
    createNode: () => {
      const milestones = [
        { year: '2018', title: 'Founded', desc: 'Started in a garage with two engineers and a shared dream.' },
        { year: '2019', title: 'Seed Round', desc: 'Raised $2.5M to build the core platform.' },
        { year: '2021', title: '1,000 Users', desc: 'Reached our first thousand active teams.' },
        { year: '2023', title: 'Series A', desc: 'Raised $18M and expanded to 50+ employees.' },
        { year: '2025', title: 'Global Launch', desc: 'Expanded to 40 countries with enterprise clients.' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Timeline',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#07070e' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Timeline Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR JOURNEY' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Milestones That Define Us' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Timeline Items', styles: { display: 'flex', flexDirection: 'column', gap: '0px', width: '100%', position: 'relative' },
                children: milestones.map((m, i) =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: `Milestone ${m.year}`, styles: { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '24px', width: '100%', paddingBottom: i < milestones.length - 1 ? '32px' : '0px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Year Marker', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Year', props: { text: m.year }, styles: { fontSize: '18px', fontWeight: '800', color: '#7c3aed' } }),
                          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Dot', styles: { width: '12px', height: '12px', backgroundColor: '#7c3aed', borderRadius: '9999px', marginTop: '8px' } }),
                          i < milestones.length - 1 ? createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Line', styles: { width: '2px', height: '60px', backgroundColor: 'rgba(124,58,237,0.3)', marginTop: '8px' } }) : createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Spacer', styles: {} }),
                        ],
                      }),
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Content', styles: { display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '2px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: m.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: m.desc }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' } }),
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
    id: 'about-values',
    name: 'Values Grid',
    category: 'about',
    description: 'Grid of company values with icons and descriptions.',
    preview: 'bg-[#07070e] p-4',
    tags: ['values', 'grid', 'icons'],
    createNode: () => {
      const values = [
        { icon: '🎯', title: 'Purpose-Driven', desc: 'Every decision we make is guided by our core purpose: empowering creators worldwide.' },
        { icon: '🚀', title: 'Move Fast', desc: 'Speed is a feature. We ship relentlessly and optimize for velocity at every level.' },
        { icon: '🤝', title: 'Radical Trust', desc: 'We trust our people to do extraordinary work without bureaucracy or micromanagement.' },
        { icon: '💡', title: 'Relentless Curiosity', desc: 'We question assumptions, explore unknowns, and find better ways through experimentation.' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Values',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#07070e' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Values Wrapper', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'WHAT WE BELIEVE' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Our Core Values' }, styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Values Grid', styles: { display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', width: '100%' },
                children: values.map(v =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: v.title, styles: { width: 'calc(50% - 12px)', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.06)', padding: { top: '28px', right: '28px', bottom: '28px', left: '28px' }, display: 'flex', flexDirection: 'column', gap: '12px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Icon', props: { text: v.icon }, styles: { fontSize: '28px' } }),
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: v.title }, styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: v.desc }, styles: { fontSize: '14px', lineHeight: '1.6', color: '#94a3b8' } }),
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
    id: 'about-team-inline',
    name: 'Team Inline',
    category: 'about',
    description: 'About text with small team member photos displayed inline.',
    preview: 'bg-[#07070e] p-4',
    tags: ['team', 'inline', 'photos'],
    createNode: () => {
      const members = [
        { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80', name: 'Alex' },
        { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80', name: 'Maria' },
        { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80', name: 'James' },
        { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80', name: 'Emma' },
        { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80', name: 'David' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Team Inline',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#07070e' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Inline Wrapper', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Text Content', styles: { width: '55%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'WHO WE ARE' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'The People Behind the Product' }, styles: { fontSize: '36px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'We are designers, engineers, and dreamers united by a shared obsession with craft. Our team spans 12 countries, bringing diverse perspectives to every problem we solve.' }, styles: { fontSize: '15px', lineHeight: '1.7', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Meet the Team', props: { text: 'Meet the Full Team', href: '#team' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '10px' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Team Photos', styles: { width: '45%', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' },
                children: members.map(m =>
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: m.name, styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: m.name, props: { src: m.src, alt: m.name }, styles: { width: '72px', height: '72px', borderRadius: '9999px', objectFit: 'cover' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Name', props: { text: m.name }, styles: { fontSize: '12px', color: '#cbd5e1', fontWeight: '600' } }),
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
    id: 'about-split-image',
    name: 'Split Image About',
    category: 'about',
    description: 'Large image right, text left with stats.',
    preview: 'bg-[#07070e] p-4 flex gap-4 items-center',
    tags: ['split', 'stats', 'image-right'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Split Image',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#07070e' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Split Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '48px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Left Content', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '24px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'ABOUT US' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'We Build the Future of Work' }, styles: { fontSize: '38px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Our platform empowers teams to create, collaborate, and ship at unprecedented speed. We are redefining what it means to build digital products together.' }, styles: { fontSize: '15px', lineHeight: '1.7', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Stats Row', styles: { display: 'flex', gap: '32px', marginTop: '8px' },
                    children: [
                      { num: '150+', label: 'Team Members' },
                      { num: '40+', label: 'Countries' },
                      { num: '10K+', label: 'Teams Served' },
                    ].map(s =>
                      createBuilderNode({ id: generateNodeId('container'), type: 'container', label: s.label, styles: { display: 'flex', flexDirection: 'column', gap: '4px' },
                        children: [
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Number', props: { text: s.num }, styles: { fontSize: '28px', fontWeight: '800', color: '#7c3aed' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Label', props: { text: s.label }, styles: { fontSize: '13px', color: '#64748b', fontWeight: '500' } }),
                        ],
                      })
                    ),
                  }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Right Image', styles: { width: '50%', display: 'flex', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'About Image', props: { src: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80', alt: 'Our work' }, styles: { width: '100%', borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'about-minimal',
    name: 'Minimal About',
    category: 'about',
    description: 'Clean minimal about section with white background.',
    preview: 'bg-white p-4 text-center',
    tags: ['minimal', 'white', 'clean'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Minimal',
        styles: { padding: { top: '90px', right: '24px', bottom: '90px', left: '24px' }, backgroundColor: '#ffffff', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Minimal Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '680px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Simple Ideas, Powerful Results' }, styles: { fontSize: '40px', fontWeight: '800', lineHeight: '1.2', color: '#111827', letterSpacing: '-0.5px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'We strip away complexity so you can focus on what matters. Our approach is rooted in clarity, simplicity, and an unwavering commitment to quality.' }, styles: { fontSize: '17px', lineHeight: '1.7', color: '#6b7280' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Divider', styles: { width: '48px', height: '3px', backgroundColor: '#111827', borderRadius: '2px', marginTop: '8px', marginBottom: '8px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Quote', props: { text: '"Less is more. Simplicity is the ultimate sophistication."' }, styles: { fontSize: '16px', fontStyle: 'italic', color: '#9ca3af', lineHeight: '1.6' } }),
              createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'CTA', props: { text: 'Learn More', href: '#about' }, styles: { backgroundColor: '#111827', color: '#ffffff', fontWeight: '700', padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' }, borderRadius: '8px', marginTop: '8px' } }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'about-fullwidth-image',
    name: 'Full Width Image About',
    category: 'about',
    description: 'Full width background image with text overlay.',
    preview: 'bg-[#07070e] p-4 text-center',
    tags: ['fullwidth', 'background', 'overlay'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'About: Full Width Image',
        styles: { padding: { top: '120px', right: '24px', bottom: '120px', left: '24px' }, backgroundImage: 'linear-gradient(180deg, rgba(7,7,14,0.85) 0%, rgba(7,7,14,0.92) 100%), url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Overlay Content', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'ABOUT THE COMPANY' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Where Vision Meets Execution' }, styles: { fontSize: '48px', fontWeight: '900', lineHeight: '1.1', color: '#ffffff', letterSpacing: '-1px' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'We are not just building software. We are crafting the infrastructure for the next generation of digital experiences — fast, reliable, and beautifully simple.' }, styles: { fontSize: '18px', lineHeight: '1.7', color: 'rgba(255,255,255,0.75)', maxWidth: '640px' } }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Button Group', styles: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Primary CTA', props: { text: 'Our Mission', href: '#mission' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '10px' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Secondary CTA', props: { text: 'Meet the Team', href: '#team' }, styles: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0', fontWeight: '600', padding: { top: '14px', right: '28px', bottom: '14px', left: '28px' }, borderRadius: '10px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.15)' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
];
