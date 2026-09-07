import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../../packages/builder-core/src';
import type { SectionTemplateItem } from '../SectionTemplatesData';

type ProductSection = SectionTemplateItem & { category: 'products' };

export const productSections: ProductSection[] = [
  {
    id: 'products-grid-3',
    name: 'Product Grid — 3 Columns',
    category: 'products',
    description: 'Three product cards in a row with images, names, prices, and add-to-cart buttons.',
    preview: 'bg-[#06060c] p-4',
    tags: ['grid', 'ecommerce', 'cards'],
    style: 'modern',
    industry: ['ecommerce', 'fashion', 'beauty'],
    createNode: () => {
      const products = [
        { name: 'Minimal Leather Watch', price: '$189', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
        { name: 'Wireless Pro Headphones', price: '$299', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
        { name: 'Smart Fitness Tracker', price: '$149', img: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Products: 3 Grid',
        styles: { padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' }, backgroundColor: '#06060c', textAlign: 'center' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Header', styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '600px', margin: { top: '0px', right: 'auto', bottom: '40px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Featured Products' }, styles: { fontSize: '36px', fontWeight: '700', color: '#ffffff' } }),
              createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Subtitle', props: { text: 'Handpicked items our customers love most.' }, styles: { fontSize: '15px', color: '#94a3b8' } }),
            ],
          }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Products Grid', styles: { display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: products.map(p => createBuilderNode({ id: generateNodeId('container'), type: 'container', label: p.name, styles: { width: '33.33%', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderWidth: '1px', borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
              children: [
                createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Product Image', props: { src: p.img, alt: p.name }, styles: { width: '100%', height: '220px', objectFit: 'cover', borderRadius: '0px' } }),
                createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Product Info', styles: { padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' }, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
                  children: [
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: p.name }, styles: { fontSize: '16px', fontWeight: '700', color: '#ffffff' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Price', props: { text: p.price }, styles: { fontSize: '18px', fontWeight: '800', color: '#a78bfa' } }),
                    createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Add to Cart', props: { text: 'Add to Cart', href: '#cart' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '600', padding: { top: '10px', right: '20px', bottom: '10px', left: '20px' }, borderRadius: '8px', fontSize: '13px' } }),
                  ],
                }),
              ],
            })),
          }),
        ],
      });
    },
  },
  {
    id: 'products-featured',
    name: 'Featured Product Showcase',
    category: 'products',
    description: 'Large featured product with details, specifications, and purchase button.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4 items-center',
    tags: ['featured', 'showcase', 'single-product'],
    style: 'modern',
    industry: ['technology', 'ecommerce'],
    createNode: () => {
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Products: Featured',
        styles: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' }, backgroundColor: '#0a0a14' },
        children: [
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Featured Grid', styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '60px', maxWidth: '1100px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: [
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Image', styles: { width: '50%' },
                children: [
                  createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Product', props: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Featured product' }, styles: { width: '100%', borderRadius: '20px', boxShadow: '0 20px 60px rgba(124,58,237,0.2)' } }),
                ],
              }),
              createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Details', styles: { width: '50%', display: 'flex', flexDirection: 'column', gap: '16px' },
                children: [
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Badge', props: { text: 'BEST SELLER' }, styles: { fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '2px' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: 'Minimal Leather Watch' }, styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff' } }),
                  createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Description', props: { text: 'Handcrafted from premium Italian leather with Swiss movement. Water-resistant to 50m.' }, styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' } }),
                  createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Price', props: { text: '$189.00' }, styles: { fontSize: '32px', fontWeight: '900', color: '#a78bfa' } }),
                  createBuilderNode({ id: generateNodeId('button'), type: 'button', label: 'Buy', props: { text: 'Add to Cart', href: '#cart' }, styles: { backgroundColor: '#7c3aed', color: '#ffffff', fontWeight: '700', padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' }, borderRadius: '12px' } }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'products-carousel',
    name: 'Product Carousel',
    category: 'products',
    description: 'Horizontal scrolling product cards with navigation dots.',
    preview: 'bg-[#06060c] p-4',
    tags: ['carousel', 'scrolling', 'horizontal'],
    style: 'modern',
    industry: ['ecommerce', 'fashion'],
    createNode: () => {
      const products = [
        { name: 'Leather Wallet', price: '$79', img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80' },
        { name: 'Sunglasses Pro', price: '$159', img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80' },
        { name: 'Running Shoes', price: '$199', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
        { name: 'Backpack Elite', price: '$129', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Products: Carousel',
        styles: { padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' }, backgroundColor: '#06060c' },
        children: [
          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Trending Now' }, styles: { fontSize: '32px', fontWeight: '700', color: '#ffffff', textAlign: 'center', margin: { top: '0px', right: '0px', bottom: '32px', left: '0px' } } }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Products Row', styles: { display: 'flex', flexDirection: 'row', gap: '20px', maxWidth: '1200px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' }, overflow: 'hidden' },
            children: products.map(p => createBuilderNode({ id: generateNodeId('container'), type: 'container', label: p.name, styles: { minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '10px' },
              children: [
                createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image', props: { src: p.img, alt: p.name }, styles: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' } }),
                createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: p.name }, styles: { fontSize: '14px', fontWeight: '600', color: '#ffffff' } }),
                createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Price', props: { text: p.price }, styles: { fontSize: '16px', fontWeight: '800', color: '#a78bfa' } }),
              ],
            })),
          }),
        ],
      });
    },
  },
  {
    id: 'products-minimal',
    name: 'Minimal Product List',
    category: 'products',
    description: 'Clean minimal product list with images and details in rows.',
    preview: 'bg-white p-4',
    tags: ['minimal', 'list', 'clean'],
    style: 'minimal',
    industry: ['fashion', 'interior-design'],
    createNode: () => {
      const products = [
        { name: 'Ceramic Vase Set', price: '$65', desc: 'Handmade artisan ceramics', img: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80' },
        { name: 'Linen Throw Blanket', price: '$89', desc: 'Premium Belgian linen', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' },
      ];
      return createSectionNode({
        id: generateNodeId('section'), type: 'section', label: 'Products: Minimal List',
        styles: { padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' }, backgroundColor: '#ffffff' },
        children: [
          createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Title', props: { text: 'Our Collection' }, styles: { fontSize: '32px', fontWeight: '700', color: '#111827', textAlign: 'center', margin: { top: '0px', right: '0px', bottom: '40px', left: '0px' } } }),
          createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Products', styles: { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' } },
            children: products.map(p => createBuilderNode({ id: generateNodeId('container'), type: 'container', label: p.name, styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '24px', padding: { top: '16px', right: '0px', bottom: '16px', left: '0px' }, borderBottom: '1px solid #e5e7eb' },
              children: [
                createBuilderNode({ id: generateNodeId('image'), type: 'image', label: 'Image', props: { src: p.img, alt: p.name }, styles: { width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px' } }),
                createBuilderNode({ id: generateNodeId('container'), type: 'container', label: 'Info', styles: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1' },
                  children: [
                    createBuilderNode({ id: generateNodeId('heading'), type: 'heading', label: 'Name', props: { text: p.name }, styles: { fontSize: '18px', fontWeight: '700', color: '#111827' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Desc', props: { text: p.desc }, styles: { fontSize: '14px', color: '#6b7280' } }),
                    createBuilderNode({ id: generateNodeId('text'), type: 'text', label: 'Price', props: { text: p.price }, styles: { fontSize: '20px', fontWeight: '800', color: '#111827' } }),
                  ],
                }),
              ],
            })),
          }),
        ],
      });
    },
  },
];
