export interface MockSection {
  id: string;
  type: string;
  props: Record<string, any>;
  childrenIds?: string[];
}

export const MOCK_SECTIONS: Record<string, MockSection> = {
  heroBanner: {
    id: 'sec_hero_01',
    type: 'HeroBannerSection',
    props: {
      title: 'Welcome to OneKoszyk Demo Store',
      subtitle: 'Build amazing e-commerce experiences in seconds.',
      ctaText: 'Shop Now',
    },
  },
  featuredProducts: {
    id: 'sec_products_01',
    type: 'ProductGridSection',
    props: {
      columns: 3,
      showPrice: true,
      category: 'featured',
    },
  },
};
