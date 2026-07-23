import type { TemplateDefinition } from '../TemplateTypes'

const fashionPro: TemplateDefinition = {
  slug: 'fashion-pro',
  name: 'Fashion Store Pro',
  category: 'fashion',
  description: 'Profesjonalny sklep modowy z eleganckim designem. Idealny dla marek odzieżowych, butików i akcesoriów.',
  price: 99900,
  currency: 'PLN',
  previewImage: '/templates/fashion-pro/preview.jpg',
  screenshots: [
    '/templates/fashion-pro/screenshot-1.jpg',
    '/templates/fashion-pro/screenshot-2.jpg',
    '/templates/fashion-pro/screenshot-3.jpg',
  ],
  liveDemoUrl: '/preview/fashion-pro-demo',
  includes: [
    'Pełny design sklepu (Home, Produkty, O nas, Kontakt)',
    '8 produktów demo z opisami i cenami',
    'Branding: kolory, czcionki, logo placeholder',
    'Konfiguracja płatności (Stripe, BLIK, przelew)',
    'SEO-ready: meta tags, sitemap, Open Graph',
    'Responsywny design mobile-first',
    'Dashboard zarządzania produktami',
    'Automatyczne emaile zamówień',
  ],
  features: [
    'Elegancki design z dużym hero bannerem',
    'Siatka produktów z filtrami',
    'Galeria lookbook',
    'Opinie klientów',
    'Newsletter section',
    'Responsywny navbar i footer',
  ],
  theme: {
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    font: 'Poppins',
    description: 'Elegancki sklep modowy z nutą nowoczesności',
  },
  pages: [
    {
      id: 'home',
      slug: '',
      name: 'Strona główna',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'transparent', sticky: true } },
        { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Nowa kolekcja', subtitle: 'Odkryj najnowsze trendy', cta: 'Zobacz kolekcję', image: '' } },
        { id: 'categories', type: 'category-grid', label: 'Kategorie', config: { items: ['Sukienki', 'Garnitury', 'Akcesoria', 'Buty'] } },
        { id: 'featured-products', type: 'product-grid', label: 'Polecane produkty', config: { title: 'Najpopularniejsze', count: 8 } },
        { id: 'gallery', type: 'gallery', label: 'Lookbook', config: { title: 'Inspiracje', images: [] } },
        { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Co mówią klienci' } },
        { id: 'newsletter', type: 'newsletter', label: 'Newsletter', config: { title: 'Bądź na bieżąco', cta: 'Zapisz się' } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Sklep', 'Pomoc', 'Kontakt', 'Social'] } },
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
    {
      id: 'about',
      slug: 'o-nas',
      name: 'O nas',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
        { id: 'about-hero', type: 'hero', label: 'Hero', config: { title: 'Nasza historia', subtitle: 'Poznaj naszą misję', image: '' } },
        { id: 'about-content', type: 'content', label: 'Treść', config: { body: 'Jesteśmy pasjonatami mody...' } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: {} },
      ],
    },
  ],
  products: [
    { name: 'Elegancka Sukienka Wieczorowa', description: 'Klasyczna czarna sukienka wieczorowa z koronkowymi rękawami', price: 29900, images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Marynarka Garniturowa Slim Fit', description: 'Nowoczesna marynarka w kolorze granatowym', price: 49900, images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Torebka Skórzana Premium', description: 'Ręcznie robiona torebka ze skóry naturalnej', price: 34900, images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Buty Oxfordy Brązowe', description: 'Klasyczne buty oxford z brązowej skóry', price: 39900, images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Apaszka Jedwabna', description: 'Jedwabna apaszka w kwiatowy wzór', price: 9900, images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Pasek Skórzany', description: 'Skórzany pasek z automatyczną klamrą', price: 15900, images: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Sweter Wełniany', description: 'Ciepły wełniany sweter w kolorze kremowym', price: 19900, images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Zegarek Klasyczny', description: 'Elegancki zegarek na skórzanym pasku', price: 59900, images: ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'] },
  ],
}

export default fashionPro
