import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type GallerySection = SectionTemplateItem & { category: 'gallery' };

export const gallerySections: GallerySection[] = [
  {
    id: 'gallery-masonry',
    name: 'Masonry Gallery',
    category: 'gallery',
    description: 'Masonry grid layout with varied image heights.',
    preview: 'bg-[#090912] p-4',
    tags: ['masonry', 'varied-height', 'grid'],
    style: 'modern',
    industry: ['photography', 'creative', 'fashion'],
    createNode: () => {
      const images = [
        { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', h: '280px' },
        { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80', h: '200px' },
        { src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80', h: '320px' },
        { src: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&q=80', h: '240px' },
        { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', h: '300px' },
        { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80', h: '220px' },
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Masonry',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#090912',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Masonry Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Our Work in Focus' },
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
                label: 'Masonry Grid',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '16px',
                  width: '100%',
                  alignItems: 'flex-start',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Column 1',
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    },
                    children: images.slice(0, 3).map((img) =>
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Gallery Image',
                        props: { src: img.src, alt: 'Gallery image' },
                        styles: {
                          width: '100%',
                          height: img.h,
                          objectFit: 'cover',
                          borderRadius: '12px',
                        },
                      })
                    ),
                  }),
                  createBuilderNode({
                    id: generateNodeId('container'),
                    type: 'container',
                    label: 'Column 2',
                    styles: {
                      flex: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      margin: { top: '40px', right: '0px', bottom: '0px', left: '0px' },
                    },
                    children: images.slice(3, 6).map((img) =>
                      createBuilderNode({
                        id: generateNodeId('image'),
                        type: 'image',
                        label: 'Gallery Image',
                        props: { src: img.src, alt: 'Gallery image' },
                        styles: {
                          width: '100%',
                          height: img.h,
                          objectFit: 'cover',
                          borderRadius: '12px',
                        },
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
    id: 'gallery-grid',
    name: 'Uniform Grid Gallery',
    category: 'gallery',
    description: 'Uniform grid of equal-sized image cards.',
    preview: 'bg-[#080811] p-4',
    tags: ['grid', 'uniform', 'equal'],
    style: 'modern',
    industry: ['photography', 'portfolio', 'ecommerce'],
    createNode: () => {
      const images = [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
        'https://images.unsplash.com/photo-1502481851512-e9e24292e4e0?w=600&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80',
        'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&q=80',
        'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=600&q=80',
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Grid',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#080811',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Grid Gallery',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Visual Stories' },
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
                label: 'Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  width: '100%',
                },
                children: images.map((src) =>
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Gallery Image',
                    props: { src, alt: 'Gallery image' },
                    styles: {
                      width: 'calc(33.333% - 11px)',
                      height: '240px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    },
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
    id: 'gallery-2col',
    name: '2 Column Gallery',
    category: 'gallery',
    description: 'Two column layout with large feature images.',
    preview: 'bg-[#0a0a14] p-4',
    tags: ['2-column', 'large', 'feature'],
    style: 'modern',
    industry: ['architecture', 'interior-design', 'photography'],
    createNode: () => {
      const images = [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
        'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80',
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: 2 Column',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#0a0a14',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: '2 Col Gallery',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '36px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Selected Projects' },
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
                label: '2 Col Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  width: '100%',
                },
                children: images.map((src) =>
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Project Image',
                    props: { src, alt: 'Project image' },
                    styles: {
                      width: 'calc(50% - 10px)',
                      height: '320px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                    },
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
    id: 'gallery-fullwidth',
    name: 'Full Width Gallery',
    category: 'gallery',
    description: 'Full width single hero image with overlay caption.',
    preview: 'bg-black p-4',
    tags: ['fullwidth', 'hero', 'overlay'],
    style: 'cinematic',
    industry: ['photography', 'travel', 'editorial'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Full Width',
        styles: {
          padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
          backgroundColor: '#000000',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Full Width Image',
            styles: {
              position: 'relative',
              width: '100%',
              height: '500px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('image'),
                type: 'image',
                label: 'Hero Image',
                props: {
                  src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80',
                  alt: 'Full width landscape',
                },
                styles: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Overlay Caption',
                styles: {
                  position: 'absolute',
                  bottom: '0px',
                  left: '0px',
                  right: '0px',
                  padding: { top: '60px', right: '40px', bottom: '32px', left: '40px' },
                  backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Caption',
                    props: { text: 'Summit Series — Patagonia 2026' },
                    styles: {
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff',
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
    id: 'gallery-bento',
    name: 'Bento Grid Gallery',
    category: 'gallery',
    description: 'Bento-style asymmetric grid with varied cell sizes.',
    preview: 'bg-[#06060c] p-4',
    tags: ['bento', 'asymmetric', 'modern'],
    style: 'modern',
    industry: ['technology', 'creative', 'agency'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Bento',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#06060c',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Bento Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '1000px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Explore Our Universe' },
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
                label: 'Bento Grid',
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
                    label: 'Large Image',
                    props: { src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', alt: 'Bento large' },
                    styles: {
                      width: 'calc(60% - 8px)',
                      height: '280px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Small Image',
                    props: { src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', alt: 'Bento small' },
                    styles: {
                      width: 'calc(40% - 8px)',
                      height: '280px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Medium Image',
                    props: { src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80', alt: 'Bento medium' },
                    styles: {
                      width: 'calc(40% - 8px)',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Medium Image',
                    props: { src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80', alt: 'Bento medium' },
                    styles: {
                      width: 'calc(60% - 8px)',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '14px',
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
    id: 'gallery-carousel',
    name: 'Horizontal Scroll Gallery',
    category: 'gallery',
    description: 'Horizontally scrolling gallery with peek effect.',
    preview: 'bg-[#0a0a14] p-4',
    tags: ['carousel', 'horizontal', 'scroll'],
    style: 'modern',
    industry: ['fashion', 'ecommerce', 'travel'],
    createNode: () => {
      const images = [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Carousel',
        styles: {
          padding: { top: '64px', right: '0px', bottom: '64px', left: '0px' },
          backgroundColor: '#0a0a14',
          overflow: 'hidden',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Carousel Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              gap: '28px',
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Featured Collection' },
                styles: {
                  fontSize: '30px',
                  fontWeight: '700',
                  color: '#ffffff',
                  padding: { top: '0px', right: '40px', bottom: '0px', left: '40px' },
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Scroll Track',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '20px',
                  padding: { top: '0px', right: '40px', bottom: '0px', left: '40px' },
                  overflow: 'hidden',
                },
                children: images.map((src) =>
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Carousel Image',
                    props: { src, alt: 'Carousel image' },
                    styles: {
                      width: '280px',
                      height: '280px',
                      objectFit: 'cover',
                      borderRadius: '14px',
                      flexShrink: '0',
                    },
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
    id: 'gallery-collage',
    name: 'Collage Gallery',
    category: 'gallery',
    description: 'Asymmetric collage layout with overlapping elements.',
    preview: 'bg-[#080811] p-4',
    tags: ['collage', 'asymmetric', 'overlapping'],
    style: 'creative',
    industry: ['creative', 'agency', 'art'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Collage',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#080811',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Collage Content',
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
                props: { text: 'Creative Showcase' },
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
                label: 'Collage Layout',
                styles: {
                  position: 'relative',
                  width: '100%',
                  height: '500px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Large Image',
                    props: { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', alt: 'Collage large' },
                    styles: {
                      position: 'absolute',
                      top: '0px',
                      left: '0px',
                      width: '55%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '16px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Medium Image',
                    props: { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', alt: 'Collage medium' },
                    styles: {
                      position: 'absolute',
                      top: '20px',
                      right: '0px',
                      width: '50%',
                      height: '55%',
                      objectFit: 'cover',
                      borderRadius: '16px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Small Image',
                    props: { src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80', alt: 'Collage small' },
                    styles: {
                      position: 'absolute',
                      bottom: '0px',
                      right: '40px',
                      width: '40%',
                      height: '45%',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
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
    id: 'gallery-minimal',
    name: 'Minimal White Gallery',
    category: 'gallery',
    description: 'Minimal gallery on clean white background with thin borders.',
    preview: 'bg-white p-4',
    tags: ['minimal', 'white', 'clean'],
    style: 'minimal',
    industry: ['architecture', 'design', 'consulting'],
    createNode: () => {
      const images = [
        'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80',
        'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&q=80',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80',
      ];

      return createSectionNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Gallery: Minimal White',
        styles: {
          padding: { top: '64px', right: '24px', bottom: '64px', left: '24px' },
          backgroundColor: '#ffffff',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('container'),
            type: 'container',
            label: 'Minimal Gallery',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Heading',
                props: { text: 'Workspace Gallery' },
                styles: {
                  fontSize: '30px',
                  fontWeight: '700',
                  color: '#111827',
                  textAlign: 'center',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Grid',
                styles: {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2px',
                  width: '100%',
                  backgroundColor: '#e5e7eb',
                },
                children: images.map((src) =>
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Gallery Image',
                    props: { src, alt: 'Gallery image' },
                    styles: {
                      width: 'calc(33.333% - 2px)',
                      height: '220px',
                      objectFit: 'cover',
                    },
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
