import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load templates from the template registry
const templates = [
  {
    slug: 'fashion-pro',
    name: 'Fashion Store Pro',
    category: 'fashion',
    description: 'Elegancki sklep modowy z nowoczesnym designem. Gotowy do sprzedaży odzieży, akcesoriów i obuwia.',
    price: 149900,
    currency: 'PLN',
    preview_image: '/templates/fashion-pro/preview.jpg',
    screenshots: [
      '/templates/fashion-pro/screenshot-1.jpg',
      '/templates/fashion-pro/screenshot-2.jpg',
      '/templates/fashion-pro/screenshot-3.jpg',
    ],
    live_demo_url: '/preview/fashion-pro-demo',
    includes: [
      'Pełny design sklepu (Home, Produkty, O nas, Kontakt)',
      '8 produktów demo z opisami i cenami',
      'Branding: ciemny design, elegancka typografia, logo placeholder',
      'Konfiguracja płatności (Stripe, BLIK, przelew)',
      'SEO-ready: meta tagi, sitemap, Open Graph',
      'Responsywny design mobile-first',
      'Dashboard zarządzania produktami',
      'Automatyczne emaile zamówień',
    ],
    features: [
      'Elegancki design w ciemnych tonach',
      'Prezentacja produktów z kategoriami',
      'Lookbook / Galeria inspirująca',
      'Blog modowy',
      'System powiadomień o nowościach',
      'Newsletter z kodami rabatowymi',
    ],
    theme_config: {
      primaryColor: '#1a1a2e',
      secondaryColor: '#e94560',
      font: 'Poppins',
      description: 'Elegancki sklep modowy z nutą nowoczesności',
    },
    page_structure: [
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
      { name: 'Elegancka Sukienka Wieczorowa', description: 'Klasyczna czarna sukienka wieczorowa z koronkowymi rękawami', price: 29900, currency: 'PLN', images: [] },
      { name: 'Marynarka Garniturowa Slim Fit', description: 'Nowoczesna marynarka w kolorze granatowym', price: 49900, currency: 'PLN', images: [] },
      { name: 'Torebka Skórzana Premium', description: 'Ręcznie robiona torebka ze skóry naturalnej', price: 34900, currency: 'PLN', images: [] },
      { name: 'Buty Oxfordy Brązowe', description: 'Klasyczne buty oxford z brązowej skóry', price: 39900, currency: 'PLN', images: [] },
      { name: 'Apaszka Jedwabna', description: 'Jedwabna apaszka w kwiatowy wzór', price: 9900, currency: 'PLN', images: [] },
      { name: 'Pasek Skórzany', description: 'Skórzany pasek z automatyczną klamrą', price: 15900, currency: 'PLN', images: [] },
      { name: 'Sweter Wełniany', description: 'Ciepły wełniany sweter w kolorze kremowym', price: 19900, currency: 'PLN', images: [] },
      { name: 'Zegarek Klasyczny', description: 'Elegancki zegarek na skórzanym pasku', price: 59900, currency: 'PLN', images: [] },
    ],
  },
  {
    slug: 'beauty',
    name: 'Beauty Store',
    category: 'beauty',
    description: 'Nowoczesny sklep kosmetyczny z delikatnym, kobiecym designem. Idealny dla marek kosmetyków, SPA i wellness.',
    price: 79900,
    currency: 'PLN',
    preview_image: '/templates/beauty/preview.jpg',
    screenshots: [
      '/templates/beauty/screenshot-1.jpg',
      '/templates/beauty/screenshot-2.jpg',
      '/templates/beauty/screenshot-3.jpg',
    ],
    live_demo_url: '/preview/beauty-demo',
    includes: [
      'Pełny design sklepu (Home, Produkty, O nas, Kontakt)',
      '6 produktów demo z opisami i cenami',
      'Branding: pastelowe kolory, elegancka typografia, logo placeholder',
      'Konfiguracja płatności (Stripe, BLIK, przelew)',
      'SEO-ready: meta tagi, sitemap, Open Graph',
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
    theme_config: {
      primaryColor: '#f8c8dc',
      secondaryColor: '#9b59b6',
      font: 'Playfair Display',
      description: 'Kosmetyczny sklep z duszą',
    },
    page_structure: [
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
      { name: 'Krem Przeciwzmarszczkowy', description: 'Zaawansowany krem z kwasem hialuronowym', price: 12900, currency: 'PLN', images: [] },
      { name: 'Serum Witaminowe', description: 'Serum z witaminą C rozjaśniające cerę', price: 8900, currency: 'PLN', images: [] },
      { name: 'Peeling Kwasowy', description: 'Delikatny peeling kwasowy do twarzy', price: 7900, currency: 'PLN', images: [] },
      { name: 'Maska Nawilżająca', description: 'Maska w płachcie z ekstraktem z aloesu', price: 2900, currency: 'PLN', images: [] },
      { name: 'Olejek Do Demakijażu', description: 'Olejek micelarny do demakijażu oczu i twarzy', price: 5900, currency: 'PLN', images: [] },
      { name: 'Perfumy Floral', description: 'Kwiatowe perfumy z nutą jaśminu i róży', price: 24900, currency: 'PLN', images: [] },
    ],
  },
  {
    slug: 'restaurant',
    name: 'Restaurant Pro',
    category: 'restaurant',
    description: 'Nowoczesny system zamówień online dla restauracji. Menu, rezerwacje, dostawa i zabranie w jednym miejscu.',
    price: 199900,
    currency: 'PLN',
    preview_image: '/templates/restaurant/preview.jpg',
    screenshots: [
      '/templates/restaurant/screenshot-1.jpg',
      '/templates/restaurant/screenshot-2.jpg',
      '/templates/restaurant/screenshot-3.jpg',
    ],
    live_demo_url: '/preview/restaurant-demo',
    includes: [
      'Pełny design sklepu (Menu, Rezerwacje, O nas, Kontakt)',
      '12 dań demo z opisami, cenami i alergenami',
      'Branding: ciepły design, apetyczna typografia, logo placeholder',
      'Konfiguracja płatności (Stripe, BLIK, przelew, gotówka)',
      'SEO-ready: meta tagi, sitemap, Open Graph',
      'Responsywny design mobile-first',
      'Dashboard zarządzania menu i zamówieniami',
      'Automatyczne potwierdzenia zamówień i rezerwacji',
      'System stref dostawy i godzin otwarcia',
    ],
    features: [
      'Interaktywne menu z kategoriami',
      'System rezerwacji stolików',
      'Zamówienia na miejscu / na wynos / dostawa',
      'Alergeny i wartości odżywcze',
      'Program lojalnościowy',
      'Integracja z systemami POS',
    ],
    theme_config: {
      primaryColor: '#8b4513',
      secondaryColor: '#d4a574',
      font: 'Playfair Display',
      description: 'Restauracja, która smakuje jak w domu',
    },
    page_structure: [
      {
        id: 'home',
        slug: '',
        name: 'Strona główna',
        sections: [
          { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'transparent', sticky: true } },
          { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Smak, który zostaje w pamięci', subtitle: 'Autentyczna kuchnia z lokalnych produktów', cta: 'Zobacz menu', image: '' } },
          { id: 'featured-dishes', type: 'product-grid', label: 'Dania dnia', config: { title: 'Polecane przez szefa', count: 6 } },
          { id: 'categories', type: 'category-grid', label: 'Kategorie', config: { items: ['Przystawki', 'Zupy', 'Dania główne', 'Desery', 'Napoje'] } },
          { id: 'reservations', type: 'content', label: 'Rezerwacje', config: { body: 'Zarezerwuj stół online...' } },
          { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Co mówią goście' } },
          { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Menu', 'Rezerwacje', 'Dostawa', 'Kontakt'] } },
        ],
      },
      {
        id: 'menu',
        slug: 'menu',
        name: 'Menu',
        sections: [
          { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
          { id: 'menu-listing', type: 'product-grid', label: 'Pełne menu', config: { title: 'Pełne menu', count: 0 } },
          { id: 'footer', type: 'footer', label: 'Stopka', config: {} },
        ],
      },
    ],
    products: [
      { name: 'Zupa Pomidorowa z Ryżem', description: 'Klasyczna zupa pomidorowa z ryżem i śmietaną', price: 1800, currency: 'PLN', images: [] },
      { name: 'Rosół z Makaronem', description: 'Tradycyjny rosół z makaronem nitkowym', price: 1600, currency: 'PLN', images: [] },
      { name: 'Schabowy z Ziemniakami', description: 'Kotlet schabowy, ziemniaki, surówka', price: 3200, currency: 'PLN', images: [] },
      { name: 'Pierogi Ruskie', description: 'Pierogi z twarogiem, ziemniakami i cebulą', price: 2400, currency: 'PLN', images: [] },
      { name: 'Sernik na Chłodno', description: 'Kremowy sernik z czekoladą', price: 1200, currency: 'PLN', images: [] },
      { name: 'Kompot Owocowy', description: 'Domowy kompot z owoców sezonowych', price: 800, currency: 'PLN', images: [] },
      { name: 'Tatar Wołowy', description: 'Świeży tatar z jajkiem, kaparami i cebulą', price: 3800, currency: 'PLN', images: [] },
      { name: 'Łosoś Pieczony', description: 'Filet z łososia z warzywami grillowanymi', price: 4500, currency: 'PLN', images: [] },
      { name: 'Risotto Grzybowe', description: 'Kremowe risotto z grzybami leśnymi', price: 3400, currency: 'PLN', images: [] },
      { name: 'Tiramisu', description: 'Włoski deser z kawą i mascarpone', price: 1400, currency: 'PLN', images: [] },
      { name: 'Piwo Rzemieślnicze', description: 'Lokalne piwo rzemieślnicze 0.5L', price: 1200, currency: 'PLN', images: [] },
      { name: 'Wino Czerwone', description: 'Szlachetne wino czerwone 150ml', price: 1800, currency: 'PLN', images: [] },
    ],
  },
  {
    slug: 'digital',
    name: 'Digital Products',
    category: 'digital',
    description: 'Sklep do sprzedaży produktów cyfrowych: e-booki, kursy, szablony, licencje. Automatyczna dostawa po płatności.',
    price: 99900,
    currency: 'PLN',
    preview_image: '/templates/digital/preview.jpg',
    screenshots: [
      '/templates/digital/screenshot-1.jpg',
      '/templates/digital/screenshot-2.jpg',
      '/templates/digital/screenshot-3.jpg',
    ],
    live_demo_url: '/preview/digital-demo',
    includes: [
      'Pełny design sklepu (Home, Produkty, Biblioteka, Konto)',
      '4 produkty cyfrowe demo (e-book, kurs, szablon, licencja)',
      'Branding: nowoczesny design, czysta typografia, logo placeholder',
      'Konfiguracja płatności (Stripe, BLIK, przelew)',
      'SEO-ready: meta tagi, sitemap, Open Graph',
      'Responsywny design mobile-first',
      'Dashboard zarządzania produktami cyfrowymi',
      'Automatyczna dostawa plików po płatności',
      'System licencji i kodów aktywacyjnych',
    ],
    features: [
      'Automatyczna dostawa plików',
      'Generowanie kodów licencyjnych',
      'Biblioteka pobrań dla klienta',
      'Subskrypcje i membership',
      'Affiliate program',
      'Analytics sprzedaży',
    ],
    theme_config: {
      primaryColor: '#0f172a',
      secondaryColor: '#3b82f6',
      font: 'Inter',
      description: 'Nowoczesny sklep produktów cyfrowych',
    },
    page_structure: [
      {
        id: 'home',
        slug: '',
        name: 'Strona główna',
        sections: [
          { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
          { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Produkty cyfrowe od ręki', subtitle: 'Kup, pobieraj, ucz się natychmiast', cta: 'Zobacz ofertę', image: '' } },
          { id: 'featured-products', type: 'product-grid', label: 'Polecane', config: { title: 'Najpopularniejsze', count: 4 } },
          { id: 'categories', type: 'category-grid', label: 'Kategorie', config: { items: ['E-booki', 'Kursy wideo', 'Szablony', 'Licencje'] } },
          { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Zaufali nam' } },
          { id: 'newsletter', type: 'newsletter', label: 'Newsletter', config: { title: 'Nowe produkty na Twój email', cta: 'Zapisz się' } },
          { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Produkty', 'Pomoc', 'Licencje', 'Social'] } },
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
        id: 'library',
        slug: 'biblioteka',
        name: 'Moja biblioteka',
        sections: [
          { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
          { id: 'library-content', type: 'content', label: 'Biblioteka', config: { body: 'Twoje zakupione produkty...' } },
          { id: 'footer', type: 'footer', label: 'Stopka', config: {} },
        ],
      },
    ],
    products: [
      { name: 'E-book: Mistrzostwo React', description: 'Kompleksowy przewodnik po React 19', price: 8900, currency: 'PLN', images: [] },
      { name: 'Kurs: TypeScript od Zera', description: '15h wideo, ćwiczenia, certyfikat', price: 29900, currency: 'PLN', images: [] },
      { name: 'Szablon: SaaS Starter Kit', description: 'Gotowy boilerplate Next.js + Supabase + Stripe', price: 14900, currency: 'PLN', images: [] },
      { name: 'Licencja: Komponenty UI Pro', description: '50+ komponentów React + Tailwind', price: 19900, currency: 'PLN', images: [] },
    ],
  },
]

async function seedTemplates() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'

  if (supabaseUrl.includes('dummy') || serviceKey.includes('dummy')) {
    console.log('Supabase not configured - skipping seed')
    console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run seed')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  for (const template of templates) {
    console.log(`Seeding template: ${template.slug}...`)

    const { error } = await supabase
      .from('templates')
      .upsert({
        slug: template.slug,
        name: template.name,
        category: template.category,
        description: template.description,
        price: template.price,
        currency: template.currency,
        preview_image: template.preview_image,
        screenshots: template.screenshots,
        live_demo_url: template.live_demo_url,
        includes: template.includes,
        features: template.features,
        theme_config: template.theme_config,
        page_structure: template.page_structure,
        products: template.products,
      }, {
        onConflict: 'slug',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Error seeding ${template.slug}:`, error)
    } else {
      console.log(`✓ Seeded ${template.slug}`)
    }
  }

  console.log('Done!')
}

seedTemplates().catch(console.error)