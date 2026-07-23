import type { TemplateDefinition } from '../TemplateTypes'

const restaurant: TemplateDefinition = {
  slug: 'restaurant',
  name: 'Restaurant Template',
  category: 'food',
  description: 'Profesjonalna strona dla restauracji, kawiarni i barów. Menu, rezerwacje, galeria dań i dostawa.',
  price: 69900,
  currency: 'PLN',
  previewImage: '/templates/restaurant/preview.jpg',
  screenshots: [
    '/templates/restaurant/screenshot-1.jpg',
    '/templates/restaurant/screenshot-2.jpg',
    '/templates/restaurant/screenshot-3.jpg',
  ],
  liveDemoUrl: '/preview/restaurant-demo',
  includes: [
    'Pełny design (Home, Menu, O nas, Rezerwacje, Kontakt)',
    '6 dań w menu z opisami, cenami i kategoriami',
    'Branding: ciemny motyw, elegancka typografia, logo placeholder',
    'System rezerwacji stolików online',
    'Konfiguracja płatności (Stripe, BLIK, przelew)',
    'SEO-ready: meta tags, sitemap, Open Graph',
    'Responsywny design mobile-first',
    'Dashboard zarządzania menu i rezerwacjami',
  ],
  features: [
    'Design inspirowany włoską kuchnią',
    'Menu z kategoriami i cenami',
    'System rezerwacji stolików',
    'Galeria dań',
    'Opinie gości',
    'Mapa i godziny otwarcia',
  ],
  theme: {
    primaryColor: '#2d3436',
    secondaryColor: '#e17055',
    font: 'Lora',
    description: 'Gdzie smak spotyka tradycję',
  },
  pages: [
    {
      id: 'home',
      slug: '',
      name: 'Strona główna',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
        { id: 'hero', type: 'hero', label: 'Hero', config: { title: 'Smaki Italii', subtitle: 'Autentyczna kuchnia włoska w sercu miasta', cta: 'Zobacz menu', image: '' } },
        { id: 'about', type: 'content', label: 'O nas', config: { title: 'Nasza historia', body: 'Od 1998 roku serwujemy najlepszą pizzę w mieście...' } },
        { id: 'menu-highlights', type: 'product-grid', label: 'Polecane dania', config: { title: 'Szef poleca', count: 4 } },
        { id: 'gallery', type: 'gallery', label: 'Sala restauracji', config: { } },
        { id: 'testimonials', type: 'testimonials', label: 'Opinie', config: { title: 'Co mówią nasi goście' } },
        { id: 'contact', type: 'contact', label: 'Kontakt', config: { title: 'Zarezerwuj stolik', email: 'kontakt@solospot.pl', address: 'ul. Marszałkowska 85, Warszawa' } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: { columns: ['Menu', 'Godziny otwarcia', 'Kontakt', 'Social'] } },
      ],
    },
    {
      id: 'menu',
      slug: 'menu',
      name: 'Menu',
      sections: [
        { id: 'navbar', type: 'navbar', label: 'Nawigacja', config: { style: 'dark', sticky: true } },
        { id: 'menu-full', type: 'product-grid', label: 'Pełne menu', config: { title: 'Nasze Menu', count: 0 } },
        { id: 'footer', type: 'footer', label: 'Stopka', config: {} },
      ],
    },
  ],
  products: [
    { name: 'Pizza Margherita', description: 'Sos pomidorowy, mozzarella, bazylia', price: 3900, images: ['https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Pizza Pepperoni', description: 'Sos pomidorowy, mozzarella, pepperoni, oregano', price: 4500, images: ['https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Makaron Carbonara', description: 'Spaghetti, guanciale, jajko, parmezan, pieprz', price: 4200, images: ['https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Lasagne Bolognese', description: 'Klasyczna lasagne z sosem bolońskim i beszamelem', price: 4600, images: ['https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Sałatka Caprese', description: 'Mozzarella, pomidor, bazylia, oliwa z oliwek', price: 2800, images: ['https://images.unsplash.com/photo-1592417817098-8f3d6ef23a8c?auto=format&fit=crop&w=800&q=80'] },
    { name: 'Tiramisu', description: 'Klasyczny włoski deser z mascarpone i kawą', price: 2200, images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'] },
  ],
}

export default restaurant
