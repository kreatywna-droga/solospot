import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type BlogSection = SectionTemplateItem & { category: 'blog' };

export const blogSections: BlogSection[] = [
  {
    id: 'blog-3-cards',
    name: '3 Blog Cards',
    category: 'blog',
    description: 'Three equal blog post cards in a row with image, title, excerpt, and read more.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4',
    tags: ['cards', 'three-column', 'grid', 'modern'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: 3 Cards',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0a0a14',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Blog Grid',
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
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Eyebrow', props: { text: 'OUR BLOG' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Latest Insights' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Cards Row',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px', width: '100%' },
                children: [
                  {
                    img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80',
                    title: 'The Future of Remote Work',
                    excerpt: 'How distributed teams are reshaping the modern workplace and what it means for productivity.',
                    date: 'Sep 3, 2026',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
                    title: 'Data-Driven Decisions',
                    excerpt: 'Why analytics matter more than ever and how to build a data-first culture in your organization.',
                    date: 'Aug 28, 2026',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
                    title: 'Scaling Your Startup',
                    excerpt: 'Lessons learned from growing from 10 to 100 employees without losing your culture.',
                    date: 'Aug 20, 2026',
                  },
                ].map((post) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: post.title,
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Thumbnail', props: { src: post.img, alt: post.title }, styles: { width: '100%', height: '200px', objectFit: 'cover' } }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Card Body',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px', padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' } },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Date', props: { text: post.date }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Read More', props: { text: 'Read More →' }, styles: { fontSize: '13px', color: '#a78bfa', fontWeight: '700', marginTop: '4px' } }),
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
    id: 'blog-featured',
    name: 'Featured Blog',
    category: 'blog',
    description: 'One large featured post on the left with two smaller posts stacked on the right.',
    preview: 'bg-[#090912] p-4 flex gap-4',
    tags: ['featured', 'asymmetric', 'highlight', 'editorial'],
    style: 'editorial',
    industry: ['magazine', 'media', 'editorial'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: Featured',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Featured Layout',
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
                label: 'Header Row',
                styles: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'From the Blog' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'View All', props: { text: 'View All Posts →' }, styles: { fontSize: '14px', color: '#a78bfa', fontWeight: '600' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Posts Grid',
                styles: { display: 'flex', flexDirection: 'row', gap: '24px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Featured Post',
                    styles: { width: '55%', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Featured Image', props: { src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80', alt: 'Featured post' }, styles: { width: '100%', height: '300px', objectFit: 'cover' } }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Featured Body',
                        styles: { display: 'flex', flexDirection: 'column', gap: '10px', padding: { top: '24px', right: '24px', bottom: '24px', left: '24px' } },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Category', props: { text: 'TECHNOLOGY' }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1.5px' } }),
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Why Every Business Needs a Digital Strategy in 2026' }, styles: { fontSize: '24px', fontWeight: '800', lineHeight: '1.3', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: 'Digital transformation is no longer optional. Here\'s how leading companies are adapting to stay ahead.' }, styles: { fontSize: '15px', color: '#94a3b8', lineHeight: '1.6' } }),
                        ],
                      }),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Side Posts',
                    styles: { width: '45%', display: 'flex', flexDirection: 'column', gap: '24px' },
                    children: [
                      {
                        img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80',
                        title: 'Building High-Performance Teams',
                        excerpt: 'Strategies for hiring, retaining, and developing top talent in competitive markets.',
                      },
                      {
                        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
                        title: 'The ROI of Good Design',
                        excerpt: 'How investing in design systems can save millions and accelerate your product roadmap.',
                      },
                    ].map((post) =>
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: post.title,
                        styles: { display: 'flex', flexDirection: 'row', gap: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', overflow: 'hidden', flex: '1' },
                        children: [
                          createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Thumbnail', props: { src: post.img, alt: post.title }, styles: { width: '40%', objectFit: 'cover' } }),
                          createBuilderNode({
                            id: generateNodeId('container'),
                            type: 'container',
                            label: 'Post Body',
                            styles: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: { top: '16px', right: '16px', bottom: '16px', left: '0px' }, width: '60%' },
                            children: [
                              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff', lineHeight: '1.3' } }),
                              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' } }),
                            ],
                          }),
                        ],
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
    id: 'blog-list',
    name: 'Blog List',
    category: 'blog',
    description: 'Vertical list of blog posts with thumbnail, title, excerpt, and metadata.',
    preview: 'bg-[#0c0c1d] p-4 text-left',
    tags: ['list', 'vertical', 'detailed', 'archive'],
    style: 'modern',
    industry: ['technology', 'business', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: List',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0c0c1d',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'List Layout',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
              maxWidth: '900px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: { display: 'flex', flexDirection: 'column', gap: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Recent Articles' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Thoughts, stories, and ideas from our team.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
                ],
              }),
              ...[
                {
                  img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80',
                  title: 'How We Reduced Load Times by 60%',
                  excerpt: 'A deep dive into the performance optimizations that transformed our web application.',
                  date: 'Sep 1, 2026',
                  readTime: '8 min read',
                },
                {
                  img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
                  title: 'Understanding Modern Analytics',
                  excerpt: 'From page views to event-driven data — how analytics have evolved and where they\'re going.',
                  date: 'Aug 25, 2026',
                  readTime: '6 min read',
                },
                {
                  img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80',
                  title: 'The Power of Team Retrospectives',
                  excerpt: 'Why regular reflection meetings are the secret weapon of high-performing engineering teams.',
                  date: 'Aug 18, 2026',
                  readTime: '5 min read',
                },
              ].map((post) =>
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: post.title,
                  styles: {
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '24px',
                    padding: { top: '24px', right: '0px', bottom: '24px', left: '0px' },
                    borderWidth: '0px 0px 1px 0px',
                    borderColor: 'rgba(255,255,255,0.06)',
                  },
                  children: [
                    createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Thumbnail', props: { src: post.img, alt: post.title }, styles: { width: '180px', height: '120px', objectFit: 'cover', borderRadius: '12px', flexShrink: '0' } }),
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: 'Post Info',
                      styles: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' },
                      children: [
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Meta', props: { text: `${post.date} · ${post.readTime}` }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                        createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' } }),
                      ],
                    }),
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
    id: 'blog-grid',
    name: 'Blog Grid',
    category: 'blog',
    description: 'Four blog posts in a 2x2 grid with uniform card styling.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4',
    tags: ['grid', '2x2', 'uniform', 'modern'],
    style: 'modern',
    industry: ['saas', 'technology', 'startup'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: Grid',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Grid Layout',
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
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Explore Our Articles' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Deep dives into design, development, and business strategy.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Grid',
                styles: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', width: '100%' },
                children: [
                  {
                    img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80',
                    title: 'Clean Code Principles',
                    excerpt: 'Writing maintainable code that your future self will thank you for.',
                    tag: 'Development',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80',
                    title: 'Design System Fundamentals',
                    excerpt: 'Building consistent, scalable UI components from the ground up.',
                    tag: 'Design',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
                    title: 'SEO in 2026',
                    excerpt: 'What\'s changed in search engine optimization and how to adapt your strategy.',
                    tag: 'Marketing',
                  },
                  {
                    img: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500&q=80',
                    title: 'Product-Led Growth',
                    excerpt: 'How to let your product drive acquisition, conversion, and retention.',
                    tag: 'Strategy',
                  },
                ].map((post) =>
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: post.title,
                    styles: {
                      width: 'calc(50% - 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    },
                    children: [
                      createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image', props: { src: post.img, alt: post.title }, styles: { width: '100%', height: '180px', objectFit: 'cover' } }),
                      createBuilderNode({
                        id: generateNodeId('container'),
                        type: 'container',
                        label: 'Body',
                        styles: { display: 'flex', flexDirection: 'column', gap: '8px', padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' } },
                        children: [
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Tag', props: { text: post.tag }, styles: { fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px' } }),
                          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '17px', fontWeight: '700', color: '#ffffff' } }),
                          createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' } }),
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
    id: 'blog-minimal',
    name: 'Minimal Blog',
    category: 'blog',
    description: 'Clean, minimal blog list with date, title, and brief description in a single row.',
    preview: 'bg-white p-4 text-left',
    tags: ['minimal', 'clean', 'white', 'editorial'],
    style: 'minimal',
    industry: ['architecture', 'design', 'consulting'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: Minimal',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#ffffff',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Layout',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
              maxWidth: '700px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Header',
                styles: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Journal' }, styles: { fontSize: '36px', fontWeight: '800', color: '#111827', letterSpacing: '-1px' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Reflections on design, craft, and building things that matter.' }, styles: { fontSize: '15px', color: '#6b7280' } }),
                ],
              }),
              ...[
                {
                  date: 'September 3, 2026',
                  title: 'On the Importance of Restraint',
                  excerpt: 'Why saying no to features is more important than saying yes. A meditation on product simplicity.',
                },
                {
                  date: 'August 27, 2026',
                  title: 'Lessons from a Decade of Design',
                  excerpt: 'Ten years of learning, failing, and iterating — the principles that actually stuck.',
                },
                {
                  date: 'August 15, 2026',
                  title: 'The Quiet Power of Typography',
                  excerpt: 'How the fonts we choose shape perception, mood, and readability more than we realize.',
                },
              ].map((post) =>
                createBuilderNode({
                  id: generateNodeId('container'),
                  type: 'container',
                  label: post.title,
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: { top: '24px', right: '0px', bottom: '24px', left: '0px' },
                    borderWidth: '0px 0px 1px 0px',
                    borderColor: '#e5e7eb',
                  },
                  children: [
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Date', props: { text: post.date }, styles: { fontSize: '12px', color: '#9ca3af', fontWeight: '500' } }),
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '22px', fontWeight: '700', color: '#111827', lineHeight: '1.3' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '15px', color: '#6b7280', lineHeight: '1.6' } }),
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
    id: 'blog-sidebar',
    name: 'Blog with Sidebar',
    category: 'blog',
    description: 'Blog posts on the left with a sidebar containing categories and recent posts.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4',
    tags: ['sidebar', 'two-column', 'categories', 'archive'],
    style: 'modern',
    industry: ['technology', 'saas', 'media'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Blog: Sidebar',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
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
              gap: '40px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Main Posts',
                styles: { width: '65%', display: 'flex', flexDirection: 'column', gap: '24px' },
                children: [
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Headline', props: { text: 'Blog' }, styles: { fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' } }),
                  ...[
                    {
                      img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
                      title: 'Mastering TypeScript Generics',
                      excerpt: 'A practical guide to writing flexible, reusable code with TypeScript\'s powerful generic system.',
                      date: 'Sep 2, 2026',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
                      title: 'Building Accessible Web Apps',
                      excerpt: 'Accessibility isn\'t optional — here\'s how to make your applications usable by everyone.',
                      date: 'Aug 30, 2026',
                    },
                    {
                      img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80',
                      title: 'Remote Team Communication',
                      excerpt: 'Tools and practices that keep distributed teams aligned and productive.',
                      date: 'Aug 24, 2026',
                    },
                  ].map((post) =>
                    createBuilderNode({
                      id: generateNodeId('container'),
                      type: 'container',
                      label: post.title,
                      styles: {
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                      },
                      children: [
                        createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image', props: { src: post.img, alt: post.title }, styles: { width: '100%', height: '200px', objectFit: 'cover' } }),
                        createBuilderNode({
                          id: generateNodeId('container'),
                          type: 'container',
                          label: 'Post Body',
                          styles: { display: 'flex', flexDirection: 'column', gap: '8px', padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' } },
                          children: [
                            createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Date', props: { text: post.date }, styles: { fontSize: '12px', color: '#a78bfa', fontWeight: '600' } }),
                            createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: post.title }, styles: { fontSize: '18px', fontWeight: '700', color: '#ffffff' } }),
                            createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Excerpt', props: { text: post.excerpt }, styles: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' } }),
                          ],
                        }),
                      ],
                    })
                  ),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Sidebar',
                styles: { width: '35%', display: 'flex', flexDirection: 'column', gap: '32px' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Categories Widget',
                    styles: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' } },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Widget Title', props: { text: 'Categories' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' } }),
                      ...['Technology', 'Design', 'Business', 'Development', 'Marketing'].map((cat) =>
                        createBuilderNode({ id: generateNodeId('text'), type: 'text', label: cat, props: { text: cat }, styles: { fontSize: '14px', color: '#94a3b8', padding: { top: '4px', right: '0px', bottom: '4px', left: '0px' }, borderWidth: '0px 0px 1px 0px', borderColor: 'rgba(255,255,255,0.06)' } })
                      ),
                    ],
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Newsletter Widget',
                    styles: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px', padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' } },
                    children: [
                      createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Subscribe' }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: 'Get the latest articles delivered to your inbox.' }, styles: { fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' } }),
                      createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Email Input', props: { text: 'Your email' }, styles: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: { top: '10px', right: '12px', bottom: '10px', left: '12px' }, color: '#64748b', fontSize: '13px' } }),
                      createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Subscribe', props: { text: 'Subscribe', href: '#subscribe' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '600', padding: { top: '10px', right: '16px', bottom: '10px', left: '16px' }, borderRadius: '8px', fontSize: '13px' } }),
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
];
