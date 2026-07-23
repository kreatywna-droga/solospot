import type { TemplateDefinition } from '../TemplateTypes'

const digital: TemplateDefinition = {
  slug: 'digital',
  name: 'Digital Products Store',
  category: 'digital',
  description: 'Nowoczesny sklep produktów cyfrowych. Idealny dla kursów online, e-booków, szablonów, oprogramowania i assetów.',
  price: 59900,
  currency: 'PLN',
  previewImage: '/templates/digital/preview.jpg',
  screenshots: [
    '/templates/digital/screenshot-1.jpg',
    '/templates/digital/screenshot-2.jpg',
    '/templates/digital/screenshot-3.jpg',
  ],
  liveDemoUrl: '/preview/digital-demo',
  includes: [
    'Pełny design (Home, Produkty, Kursy, Blog, Kontakt)',
    '6 produktów cyfrowych z opisami, cenami i kategoriami',
    'Branding: ciemny motyw tech, nowoczesna typografia, logo placeholder',
    'Konfiguracja płatności (Stripe, BLIK, przelew) + natychmiastowy download',
    'SEO-ready: meta tags, sitemap, Open Graph, JSON-LD',
    'Responsywny design mobile-first',
    'Dashboard zarządzania produktami cyfrowymi',
    'Automatyczne dostarczanie plików po zakupie',
  ],
  features: [
    'Czysty, nowoczesny design',
    'Prezentacja produktów cyfrowych',
    'Sekcja kursów online',
    'System subskrypcji',
    'Blog z content marketingiem',
    'Responsywny i szybki',
  ],
  theme: {
    primaryColor: '#0f172a',
    secondaryColor: '#3b82f6',
    font: 'Inter',
    description: 'Cyfrowe produkty, które zmieniają biznes',
  },
  pages: [
    {
      id: 'home',
      slug: '',
      name: 'Strona główna',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'transparent', sticky: true } },
        { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Cyfrowe narzędzia', subtitle: 'Zwiększ produktywność swojego biznesu', cta: 'Zobacz produkty', image: '' } },
        { id: 'featured-products', type: 'product-grid', label: 'Produkty', config: { title: 'Popularne produkty', count: 6 } },
        { id: 'categories', type: 'category-grid', label: 'Kategorie', config: { items: ['Kursy online', 'Szablony', 'E-booki', 'Narzędzia AI'] } },
        { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Zaufali nam' } },
        { id: 'newsletter', type: 'newsletter', label: 'Newsletter', config: { title: 'Wiedza na Twój email', cta: 'Dołącz' } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Produkty', 'Zasoby', 'Firma', 'Social'] } },
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
    { name: 'Kurs: Marketing Digital 2026', description: 'Kompleksowy kurs marketingu cyfrowego od podstaw do zaawansowanych strategii', price: 29900, images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Szablon: SaaS Landing Page', description: 'Profesjonalny szablon strony głównej dla startupów SaaS', price: 9900, images: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80'] },
    { name: 'E-book: Automatyzacja Biznesu', description: 'Praktyczny przewodnik po automatyzacji procesów w małej firmie', price: 4900, images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Pack: UI Components 500+', description: 'Kolekcja gotowych komponentów UI dla React i Next.js', price: 14900, images: ['https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Kurs: Next.js od Zera', description: 'Naucz się budować nowoczesne aplikacje w Next.js 16', price: 19900, images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Tool: AI Content Generator', description: 'Narzędzie AI do generowania treści marketingowych', price: 39900, images: ['https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80'] },
  ],
}

export default digital
