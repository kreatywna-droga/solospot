import type { TemplateDefinition } from '../TemplateTypes'

const beauty: TemplateDefinition = {
  slug: 'beauty',
  name: 'Beauty Store',
  category: 'beauty',
  description: 'Nowoczesny sklep kosmetyczny z delikatnym, kobiecym designem. Idealny dla marek kosmetyków, SPA i wellness.',
  price: 79900,
  currency: 'PLN',
  previewImage: '/templates/beauty/preview.jpg',
  screenshots: [
    '/templates/beauty/screenshot-1.jpg',
    '/templates/beauty/screenshot-2.jpg',
    '/templates/beauty/screenshot-3.jpg',
  ],
  liveDemoUrl: '/preview/beauty-demo',
  includes: [
    'Pełny design sklepu (Home, Produkty, O nas, Kontakt)',
    '6 produktów demo z opisami i cenami',
    'Branding: pastelowe kolory, elegancka typografia, logo placeholder',
    'Konfiguracja płatności (Stripe, BLIK, przelew)',
    'SEO-ready: meta tags, sitemap, Open Graph',
    'Responsywny design mobile-first',
    'Dashboard zarządzania produktami',
    'Automatyczne emaile zamówień',
  ],
  features: [
    'Delikatny design w pastelowych kolorach',
    'Prezentacja produktów z kategoriami',
    'Sekcja przed/po',
    'Blog beauty',
    'System rezerwacji wizyty',
    'Newsletter z poradami',
  ],
  theme: {
    primaryColor: '#f8c8dc',
    secondaryColor: '#9b59b6',
    font: 'Playfair Display',
    description: 'Kosmetyczny sklep z duszą',
  },
  pages: [
    {
      id: 'home',
      slug: '',
      name: 'Strona główna',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'transparent', sticky: true } },
        { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Piękno naturalne', subtitle: 'Odkryj moc natury w codziennej pielęgnacji', cta: 'Zobacz produkty', image: '' } },
        { id: 'featured-products', type: 'product-grid', label: 'Bestsellery', config: { title: 'Nasze bestsellery', count: 6 } },
        { id: 'categories', type: 'category-grid', label: 'Kategorie', config: { items: ['Pielęgnacja twarzy', 'Makijaż', 'Pielęgnacja włosów', 'Zapachy'] } },
        { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Co mówią nasze klientki' } },
        { id: 'newsletter', type: 'newsletter', label: 'Newsletter', config: { title: 'Porady beauty na Twój email', cta: 'Zapisz się' } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Produkty', 'O nas', 'Pomoc', 'Social'] } },
      ],
    },
    {
      id: 'products',
      slug: 'produkty',
      name: 'Produkty',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
        { id: 'product-listing', type: 'product-grid', label: 'Wszystkie produkty', config: { title: 'Wszystkie produkty', count: 0 } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: {} },
      ],
    },
  ],
  products: [
    { name: 'Krem Przeciwzmarszczkowy', description: 'Zaawansowany krem z kwasem hialuronowym', price: 12900, images: [] },
    { name: 'Serum Witaminowe', description: 'Serum z witaminą C rozjaśniające cerę', price: 8900, images: [] },
    { name: 'Peeling Kwasowy', description: 'Delikatny peeling kwasowy do twarzy', price: 7900, images: [] },
    { name: 'Maska Nawilżająca', description: 'Maska w płachcie z ekstraktem z aloesu', price: 2900, images: [] },
    { name: 'Olejek Do Demakijażu', description: 'Olejek micelarny do demakijażu oczu i twarzy', price: 5900, images: [] },
    { name: 'Perfumy Floral', description: 'Kwiatowe perfumy z nutą jaśminu i róży', price: 24900, images: [] },
  ],
}

export default beauty
