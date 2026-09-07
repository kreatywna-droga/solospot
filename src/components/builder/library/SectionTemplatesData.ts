import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';

export type SectionCategory =
  | 'all'
  | 'hero'
  | 'about'
  | 'features'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer';

export interface SectionTemplateItem {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  preview: string;
  badge?: string;
  createNode: () => BuilderNode;
}

export const SECTION_TEMPLATES: SectionTemplateItem[] = [
  // HERO
  {
    id: 'hero-centered',
    name: 'Klasyczny Wyśrodkowany Hero',
    category: 'hero',
    badge: 'Popularne',
    description: 'Mocny nagłówek, podtytuł, dwa przyciski akcji i subtelny gradient w tle.',
    preview: 'bg-gradient-to-b from-[#8B5CF6]/[0.15] to-[#06060c] p-4 text-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const contId = generateNodeId('container');
      const hId = generateNodeId('heading');
      const tId = generateNodeId('text');
      const b1Id = generateNodeId('button');
      const b2Id = generateNodeId('button');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Hero: Wyśrodkowany',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#090912',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: contId,
            type: 'container',
            label: 'Hero Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              maxWidth: '800px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: hId,
                type: 'heading',
                label: 'Tytuł Hero',
                props: { text: 'Nowoczesny E-Commerce Przyszłości' },
                styles: {
                  fontSize: '48px',
                  fontWeight: '800',
                  lineHeight: '1.15',
                  letterSpacing: '-1.5px',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: tId,
                type: 'text',
                label: 'Podtytuł',
                props: { text: 'Projektuj i skaluj swój sklep online z niespotykaną prędkością, bez barier technicznych.' },
                styles: {
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: '#94a3b8',
                  maxWidth: '620px',
                },
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Button Group',
                styles: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  margin: { top: '12px', right: '0px', bottom: '0px', left: '0px' },
                },
                children: [
                  createBuilderNode({
                    id: b1Id,
                    type: 'button',
                    label: 'Główny Przycisk',
                    props: { text: 'Rozpocznij Teraz', href: '#start' },
                    styles: {
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      fontWeight: '700',
                      padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' },
                      borderRadius: '12px',
                    },
                  }),
                  createBuilderNode({
                    id: b2Id,
                    type: 'button',
                    label: 'Przycisk Wtórny',
                    props: { text: 'Zobacz Demo', href: '#demo' },
                    styles: {
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#e2e8f0',
                      fontWeight: '600',
                      padding: { top: '12px', right: '24px', bottom: '12px', left: '24px' },
                      borderRadius: '12px',
                      borderWidth: '1px',
                      borderColor: 'rgba(255,255,255,0.12)',
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
    id: 'hero-split-image',
    name: 'Hero: Tekst + Obraz (Split 50/50)',
    category: 'hero',
    description: 'Dwukolumnowy układ z nagłówkiem i wezwaniem do działania po lewej, grafiką po prawej.',
    preview: 'bg-[#0a0a14] p-4 flex gap-4 items-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const gridId = generateNodeId('container');
      const colLeft = generateNodeId('container');
      const colRight = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Hero: Split Media',
        styles: {
          padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' },
          backgroundColor: '#07070f',
        },
        children: [
          createBuilderNode({
            id: gridId,
            type: 'container',
            label: 'Split Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '40px',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: colLeft,
                type: 'container',
                label: 'Lewa Kolumna',
                styles: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '16px',
                  width: '50%',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Badge',
                    props: { text: '⚡ WERSJA 2.0 JUŻ DOSTĘPNA' },
                    styles: {
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#a78bfa',
                      backgroundColor: 'rgba(167, 139, 250, 0.1)',
                      padding: { top: '6px', right: '12px', bottom: '6px', left: '12px' },
                      borderRadius: '9999px',
                      letterSpacing: '1px',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Nagłówek',
                    props: { text: 'Wszystko, czego potrzebujesz, by sprzedawać więcej' },
                    styles: {
                      fontSize: '42px',
                      fontWeight: '800',
                      lineHeight: '1.2',
                      color: '#ffffff',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Opis',
                    props: { text: 'Autonomiczna platforma integrująca zaawansowane studio kreacji, szybkie płatności i analitykę.' },
                    styles: {
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#94a3b8',
                    },
                  }),
                  createBuilderNode({
                    id: generateNodeId('button'),
                    type: 'button',
                    label: 'CTA',
                    props: { text: 'Zbuduj Sklep Za Darmo', href: '#register' },
                    styles: {
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      fontWeight: '700',
                      padding: { top: '14px', right: '32px', bottom: '14px', left: '32px' },
                      borderRadius: '12px',
                    },
                  }),
                ],
              }),
              createBuilderNode({
                id: colRight,
                type: 'container',
                label: 'Prawa Kolumna (Media)',
                styles: {
                  width: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Zdjęcie Hero',
                    props: {
                      src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
                      alt: 'SoloSpot Platform Presentation',
                    },
                    styles: {
                      width: '100%',
                      borderRadius: '20px',
                      boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)',
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
    id: 'hero-video-ambient',
    name: 'Hero: Wideo w Tle (Ambient)',
    category: 'hero',
    badge: 'Nowość',
    description: 'Dynamiczne wideo w tle z przyciemnieniem i wyrazistą typografią na pierwszym planie.',
    preview: 'bg-black p-4 text-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const contId = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Hero: Wideo Ambient',
        styles: {
          padding: { top: '110px', right: '24px', bottom: '110px', left: '24px' },
          backgroundColor: '#000000',
          videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
          videoAutoplay: true,
          videoLoop: true,
          videoMuted: true,
          overlayColor: '#050508',
          overlayOpacity: 0.6,
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: contId,
            type: 'container',
            label: 'Video Hero Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              maxWidth: '860px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Tytuł Filmowy',
                props: { text: 'Kreuj doznania, które zachwycają klientów' },
                styles: {
                  fontSize: '54px',
                  fontWeight: '900',
                  lineHeight: '1.1',
                  color: '#ffffff',
                },
              }),
              createBuilderNode({
                id: generateNodeId('button'),
                type: 'button',
                label: 'Przycisk Akcji',
                props: { text: 'Odkryj Możliwości', href: '#explore' },
                styles: {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: '800',
                  padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' },
                  borderRadius: '9999px',
                },
              }),
            ],
          }),
        ],
      });
    },
  },

  // FEATURES
  {
    id: 'features-3-cards',
    name: 'Cechy: 3 Karty z Ikonami',
    category: 'features',
    badge: 'Popularne',
    description: 'Nagłówek sekcji oraz 3 eleganckie karty wyróżniające kluczowe funkcje.',
    preview: 'bg-[#090912] p-4 flex gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const mainCont = generateNodeId('container');
      const cardsGrid = generateNodeId('container');

      const cardData = [
        { title: 'Błyskawiczna Prędkość', desc: 'Optymalizacja pod Core Web Vitals i czas ładowania poniżej 500ms.' },
        { title: 'Wizualny Edytor 2.0', desc: 'Intuicyjne przeciąganie elementów i natychmiastowy podgląd zmian.' },
        { title: 'Zintegrowane Płatności', desc: 'Obsługa BLIK, kart, Apple Pay i automatycznego fakturowania.' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Sekcja: 3 Cechy',
        styles: {
          padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: mainCont,
            type: 'container',
            label: 'Header Container',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '650px',
              margin: { top: '0px', right: 'auto', bottom: '48px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Tytuł Sekcji',
                props: { text: 'Dlaczego warto wybrać naszą platformę?' },
                styles: { fontSize: '36px', fontWeight: '700', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Podtytuł',
                props: { text: 'Wszystkie narzędzia w jednym miejscu, by Twój biznes rósł wykładniczo.' },
                styles: { fontSize: '15px', color: '#94a3b8' },
              }),
            ],
          }),
          createBuilderNode({
            id: cardsGrid,
            type: 'container',
            label: 'Cards Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '24px',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: cardData.map((card) =>
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: card.title,
                styles: {
                  width: '33.33%',
                  padding: { top: '28px', right: '24px', bottom: '28px', left: '24px' },
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '12px',
                  textAlign: 'left',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Tytuł Karty',
                    props: { text: card.title },
                    styles: { fontSize: '20px', fontWeight: '700', color: '#ffffff' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Opis Karty',
                    props: { text: card.desc },
                    styles: { fontSize: '14px', lineHeight: '1.5', color: '#94a3b8' },
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },

  // ABOUT
  {
    id: 'about-story',
    name: 'O Nas: Misja i Zdjęcie',
    category: 'about',
    description: 'Autentyczna historia Twojej marki ze zdjęciem zespołu lub pracowni.',
    preview: 'bg-[#080811] p-4 flex gap-3',
    createNode: () => {
      const secId = generateNodeId('section');
      const gridId = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Sekcja: O Nas',
        styles: {
          padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' },
          backgroundColor: '#07070e',
        },
        children: [
          createBuilderNode({
            id: gridId,
            type: 'container',
            label: 'About Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '48px',
              maxWidth: '1100px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Grafika O Nas',
                styles: { width: '45%' },
                children: [
                  createBuilderNode({
                    id: generateNodeId('image'),
                    type: 'image',
                    label: 'Zdjęcie Marki',
                    props: {
                      src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
                      alt: 'Nasz Zespół',
                    },
                    styles: { width: '100%', borderRadius: '16px' },
                  }),
                ],
              }),
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: 'Treść O Nas',
                styles: {
                  width: '55%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('heading'),
                    type: 'heading',
                    label: 'Nagłówek O Nas',
                    props: { text: 'Tworzymy rozwiązania z pasją do perfekcji' },
                    styles: { fontSize: '36px', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Paragraf 1',
                    props: { text: 'Naszą misją jest ułatwianie każdemu przedsiębiorcy budowy nowoczesnego wizerunku w sieci.' },
                    styles: { fontSize: '15px', lineHeight: '1.6', color: '#cbd5e1' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Paragraf 2',
                    props: { text: 'Wierzymy, że prostota i zaawansowana technologia mogą iść w parze bez kompromisów jakościowych.' },
                    styles: { fontSize: '15px', lineHeight: '1.6', color: '#94a3b8' },
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    },
  },

  // TESTIMONIALS
  {
    id: 'testimonials-cards',
    name: 'Opinie: 3 Recenzje Klientów',
    category: 'testimonials',
    badge: 'Zaufanie',
    description: 'Trzy wiarygodne opinie klientów z oceną gwiazdkową i cytatem.',
    preview: 'bg-[#06060d] p-4 flex gap-2',
    createNode: () => {
      const secId = generateNodeId('section');
      const gridId = generateNodeId('container');

      const reviews = [
        { author: 'Marta Kowalska', role: 'Właścicielka butiku', quote: '„SoloSpot pozwolił mi uruchomić profesjonalny sklep w 2 dni bez pomocy programisty!”' },
        { author: 'Piotr Wiśniewski', role: 'Dyrektor Marketingu', quote: '„Konwersja wzrosła o 42% dzięki niesamowitej szybkości i czystemu interfejsowi.”' },
        { author: 'Anna Zielińska', role: 'Architektka Wnętrz', quote: '„Wizualny edytor to po prostu poezja. Żadnego błądzenia w skomplikowanych opcjach.”' },
      ];

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Opinie Klientów',
        styles: {
          padding: { top: '70px', right: '24px', bottom: '70px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: generateNodeId('heading'),
            type: 'heading',
            label: 'Tytuł Sekcji',
            props: { text: 'Co mówią nasi klienci?' },
            styles: {
              fontSize: '34px',
              fontWeight: '700',
              color: '#ffffff',
              margin: { top: '0px', right: '0px', bottom: '40px', left: '0px' },
            },
          }),
          createBuilderNode({
            id: gridId,
            type: 'container',
            label: 'Testimonials Grid',
            styles: {
              display: 'flex',
              flexDirection: 'row',
              gap: '20px',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: reviews.map((rev) =>
              createBuilderNode({
                id: generateNodeId('container'),
                type: 'container',
                label: `Opinia: ${rev.author}`,
                styles: {
                  width: '33.33%',
                  padding: { top: '24px', right: '20px', bottom: '24px', left: '20px' },
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  borderWidth: '1px',
                  borderColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  textAlign: 'left',
                },
                children: [
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Gwiazdki',
                    props: { text: '★★★★★' },
                    styles: { fontSize: '18px', color: '#fbbf24' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Cytat',
                    props: { text: rev.quote },
                    styles: { fontSize: '14px', lineHeight: '1.5', color: '#e2e8f0', fontStyle: 'italic' },
                  }),
                  createBuilderNode({
                    id: generateNodeId('text'),
                    type: 'text',
                    label: 'Autor',
                    props: { text: `${rev.author} — ${rev.role}` },
                    styles: { fontSize: '12px', fontWeight: '600', color: '#a78bfa' },
                  }),
                ],
              })
            ),
          }),
        ],
      });
    },
  },

  // CTA
  {
    id: 'cta-banner',
    name: 'CTA: Nowoczesny Baner Gradientowy',
    category: 'cta',
    badge: 'Wysoka Konwersja',
    description: 'Przyciągający wzrok baner zachęcający do zakupu lub rejestracji.',
    preview: 'bg-gradient-to-r from-[#8B5CF6]/20 to-fuchsia-950/50 p-4 text-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const contId = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Sekcja: CTA Baner',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' },
          backgroundColor: '#090914',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: contId,
            type: 'container',
            label: 'CTA Card',
            styles: {
              padding: { top: '48px', right: '32px', bottom: '48px', left: '32px' },
              borderRadius: '24px',
              backgroundImage: 'linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(217, 70, 239, 0.25) 100%)',
              borderWidth: '1px',
              borderColor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              maxWidth: '900px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Tytuł CTA',
                props: { text: 'Gotowy na kolejny krok w Twoim biznesie?' },
                styles: { fontSize: '38px', fontWeight: '800', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Opis CTA',
                props: { text: 'Dołącz do setek zadowolonych twórców i zacznij sprzedawać już dziś.' },
                styles: { fontSize: '16px', color: '#e2e8f0', maxWidth: '560px' },
              }),
              createBuilderNode({
                id: generateNodeId('button'),
                type: 'button',
                label: 'Przycisk CTA',
                props: { text: 'Załóż Sklep Teraz — Za Darmo', href: '#join' },
                styles: {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: '800',
                  padding: { top: '14px', right: '36px', bottom: '14px', left: '36px' },
                  borderRadius: '12px',
                },
              }),
            ],
          }),
        ],
      });
    },
  },

  // CONTACT & FOOTER
  {
    id: 'contact-simple',
    name: 'Kontakt: Informacje i Formularz',
    category: 'contact',
    description: 'Przejrzysta sekcja kontaktowa z danymi adresowymi i wezwaniem do kontaktu.',
    preview: 'bg-[#080812] p-4 text-center',
    createNode: () => {
      const secId = generateNodeId('section');
      const contId = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Sekcja: Kontakt',
        styles: {
          padding: { top: '60px', right: '24px', bottom: '60px', left: '24px' },
          backgroundColor: '#06060c',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: contId,
            type: 'container',
            label: 'Contact Container',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              maxWidth: '600px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Nagłówek Kontakt',
                props: { text: 'Porozmawiajmy o Twoim projekcie' },
                styles: { fontSize: '32px', fontWeight: '700', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Opis Kontakt',
                props: { text: 'Masz pytania lub potrzebujesz wsparcia technicznego? Napisz do nas:' },
                styles: { fontSize: '15px', color: '#94a3b8' },
              }),
              createBuilderNode({
                id: generateNodeId('button'),
                type: 'button',
                label: 'Przycisk Email',
                props: { text: 'kontakt@solospot.pl', href: 'mailto:kontakt@solospot.pl' },
                styles: {
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: { top: '12px', right: '28px', bottom: '12px', left: '28px' },
                  borderRadius: '10px',
                },
              }),
            ],
          }),
        ],
      });
    },
  },
  {
    id: 'footer-modern',
    name: 'Stopka: Nowoczesna z Linkami',
    category: 'footer',
    description: 'Elegancka stopka z nazwą marki, prawami autorskimi i linkami.',
    preview: 'bg-[#040408] p-4 text-center border-t border-white/[0.08]',
    createNode: () => {
      const secId = generateNodeId('section');
      const contId = generateNodeId('container');

      return createSectionNode({
        id: secId,
        type: 'section',
        label: 'Stopka',
        styles: {
          padding: { top: '40px', right: '24px', bottom: '40px', left: '24px' },
          backgroundColor: '#040408',
          borderWidth: '1px',
          borderColor: 'rgba(255,255,255,0.08)',
          textAlign: 'center',
        },
        children: [
          createBuilderNode({
            id: contId,
            type: 'container',
            label: 'Footer Content',
            styles: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              maxWidth: '1200px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Prawa Autorskie',
                props: { text: '© 2026 SoloSpot. Wszystkie prawa zastrzeżone.' },
                styles: { fontSize: '13px', color: '#64748b' },
              }),
            ],
          }),
        ],
      });
    },
  },
];
