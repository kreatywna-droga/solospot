'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  X, Search, Plus, LayoutDashboard, UserCheck, Star, Sparkles,
  CreditCard, HelpCircle, ArrowRight, Mail, Compass, Grid, Layers,
  ChevronRight, ChevronLeft, CheckCircle2, Eye, Monitor, Tablet, Smartphone,
} from 'lucide-react';
import { useBuilder } from '../state/BuilderProvider';
import { SectionPreviewRenderer, ScaleToFitContainer } from './SectionPreviewRenderer';
import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
  NAVIGABLE_CATEGORY_MAP,
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
  // -------------------------------------------------------------------------
  // HERO (5 Variations)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // FEATURES (3-Column Cards & Grid)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // ABOUT (Story & Mission)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // TESTIMONIALS (Opinie)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // CTA (Wezwanie do Działania)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // CONTACT & FOOTER
  // -------------------------------------------------------------------------
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
              maxWidth: '800px',
              margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
            },
            children: [
              createBuilderNode({
                id: generateNodeId('heading'),
                type: 'heading',
                label: 'Nazwa Marki',
                props: { text: 'SOLOSPOT' },
                styles: { fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: '#ffffff' },
              }),
              createBuilderNode({
                id: generateNodeId('text'),
                type: 'text',
                label: 'Copyright',
                props: { text: '© 2026 SoloSpot Platform. Wszelkie prawa zastrzeżone.' },
                styles: { fontSize: '13px', color: '#64748b' },
              }),
            ],
          }),
        ],
      });
    },
  },
];

export const CATEGORIES: { id: SectionCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'Wszystkie', icon: Grid },
  { id: 'hero', label: 'Hero Banners', icon: LayoutDashboard },
  { id: 'about', label: 'O Nas', icon: UserCheck },
  { id: 'features', label: 'Cechy & Zalety', icon: Sparkles },
  { id: 'services', label: 'Usługi', icon: Compass },
  { id: 'gallery', label: 'Galeria', icon: Grid },
  { id: 'testimonials', label: 'Opinie', icon: Star },
  { id: 'pricing', label: 'Cennik', icon: CreditCard },
  { id: 'faq', label: 'Pytania FAQ', icon: HelpCircle },
  { id: 'cta', label: 'Wezwanie CTA', icon: ArrowRight },
  { id: 'contact', label: 'Kontakt', icon: Mail },
  { id: 'footer', label: 'Stopka', icon: Layers },
];

export interface SectionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  insertIndex?: number;
  sections?: SectionNode[];
  onInserted?: (newSectionId: string) => void;
}

export function SectionLibraryModal({ isOpen, onClose, insertIndex, sections, onInserted }: SectionLibraryModalProps) {
  const { dispatch, canvas, document: builderDoc } = useBuilder();
  const [selectedCategory, setSelectedCategory] = useState<SectionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalTemplate, setPreviewModalTemplate] = useState<SectionTemplateItem | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const predecessor = insertIndex !== undefined && insertIndex > 0 ? sections?.[insertIndex - 1]?.label || `Sekcja #${insertIndex}` : null;
  const successor = insertIndex !== undefined && sections && insertIndex < sections.length ? sections?.[insertIndex]?.label || `Sekcja #${insertIndex + 1}` : null;

  // Cache template nodes so tree creation runs once per template
  const templateNodes = useMemo(() => {
    const map = new Map<string, BuilderNode>();
    SECTION_TEMPLATES.forEach(t => {
      map.set(t.id, t.createNode());
    });
    return map;
  }, []);

  const getTemplateNode = (template: SectionTemplateItem): BuilderNode => {
    return templateNodes.get(template.id) || template.createNode();
  };

  const filteredTemplates = useMemo(() => {
    return SECTION_TEMPLATES.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const handleSelectTemplate = (template: SectionTemplateItem) => {
    const targetPageId = canvas.selectedPageId || builderDoc.pages[0]?.id;
    if (!targetPageId) return;

    const newSectionNode = template.createNode();
    const navInfo = NAVIGABLE_CATEGORY_MAP[template.category];

    if (navInfo) {
      const cleanAnchor = navInfo.anchor.replace('#', '');
      newSectionNode.props = {
        ...newSectionNode.props,
        anchorId: cleanAnchor,
      };
      newSectionNode.metadata = {
        ...newSectionNode.metadata,
        anchorId: cleanAnchor,
        category: template.category,
      };

      const activePage = builderDoc.pages.find(p => p.id === targetPageId) || builderDoc.pages[0];
      const sectionsList = activePage?.sections || [];
      const navbarSection = sectionsList.find(s =>
        s.type === 'navbar' ||
        s.label.toLowerCase().includes('nawigacja') ||
        s.label.toLowerCase().includes('menu') ||
        s.label.toLowerCase().includes('header')
      );

      if (navbarSection) {
        const existingLinks = ((navbarSection.props?.links as Array<{ label: string; href: string }>) || []);
        const alreadyExists = existingLinks.some(
          l => l.href === navInfo.anchor || l.label.toLowerCase() === navInfo.label.toLowerCase()
        );
        if (!alreadyExists) {
          dispatch({
            type: 'UPDATE_NODE',
            nodeId: navbarSection.id,
            updates: {
              props: {
                ...navbarSection.props,
                links: [...existingLinks, { label: navInfo.label, href: navInfo.anchor }],
              },
            },
            pageId: targetPageId,
          });
        }
      }
    }

    dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: newSectionNode,
      index: insertIndex !== undefined ? insertIndex : undefined,
      pageId: targetPageId,
    });

    dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: newSectionNode.id },
    });

    if (onInserted) {
      onInserted(newSectionNode.id);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
        <div
          className="w-full max-w-6xl max-h-[90vh] bg-[#1a1a20] border border-[#2D2D32] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#141418]">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-[#A78BFA]" />
                <span>Wizualna Biblioteka Sekcji</span>
                <span className="text-xs font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  {SECTION_TEMPLATES.length} gotowych layoutów
                </span>
                {insertIndex !== undefined && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-[#A78BFA] font-medium border border-violet-500/30">
                    Wstawianie na pozycji #{insertIndex + 1}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {insertIndex !== undefined ? (
                  <span className="text-[#A78BFA] font-medium">
                    Nowa sekcja zostanie wstawiona {predecessor && successor ? `pomiędzy "${predecessor}" a "${successor}"` : predecessor ? `po sekcji "${predecessor}"` : successor ? `przed sekcją "${successor}"` : 'na początku strony'}.
                  </span>
                ) : (
                  'Wybierz wizualnie dopracowaną sekcję i wstaw ją bezpośrednio do swojej strony.'
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2D2D32] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Categories Bar */}
          <div className="p-4 border-b border-[#27272A] bg-[#18181e] flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj sekcji po nazwie, typie lub przeznaczeniu (np. Hero, Produkty, Cennik, Opinie)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#22222a] border border-[#3F3F46]/50 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="relative flex items-center">
              <button
                onClick={() => scrollCategories('left')}
                className="p-1.5 rounded-lg bg-[#22222a] hover:bg-[#2D2D32] border border-[#3F3F46]/40 text-zinc-400 hover:text-white mr-1.5 flex-shrink-0 transition-colors"
                title="Przewiń kategorie w lewo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={categoryScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1 scrollbar-none flex-1"
              >
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400'
                          : 'bg-[#22222a] text-zinc-400 hover:text-white hover:bg-[#2B2B36] border border-[#3F3F46]/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => scrollCategories('right')}
                className="p-1.5 rounded-lg bg-[#22222a] hover:bg-[#2D2D32] border border-[#3F3F46]/40 text-zinc-400 hover:text-white ml-1.5 flex-shrink-0 transition-colors"
                title="Przewiń kategorie w prawo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Templates Visual Grid */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 text-center gap-3">
                <LayoutDashboard className="w-12 h-12 text-slate-600" />
                <p className="text-base font-bold text-zinc-300">Nie znaleziono sekcji</p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Spróbuj wpisać inną frazę wyszukiwania lub przełącz na inną kategorię z paska powyżej.
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const node = getTemplateNode(template);
                return (
                  <div
                    key={template.id}
                    className="group relative rounded-2xl bg-[#141418] border border-[#27272A] hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-950/20 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-4 pb-3 flex items-start justify-between gap-2 border-b border-[#22222a] bg-[#1a1a22]">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                            {template.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                          {template.description}
                        </p>
                      </div>
                      {template.badge && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 whitespace-nowrap">
                          {template.badge}
                        </span>
                      )}
                    </div>

                    {/* Scale-To-Fit Real Visual Preview */}
                    <div
                      className="relative w-full cursor-pointer overflow-hidden group/preview bg-[#090910] p-2"
                      onClick={() => setPreviewModalTemplate(template)}
                    >
                      <ScaleToFitContainer targetWidth={1200} maxHeight={210}>
                        <SectionPreviewRenderer sectionNode={node} />
                      </ScaleToFitContainer>

                      {/* Hover Overlay with Action Triggers */}
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/40 flex items-center gap-1.5 transition-transform active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Wstaw sekcję</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModalTemplate(template);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-violet-300" />
                          <span>Podgląd</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 py-3 bg-[#16161c] border-t border-[#22222a] flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                        {template.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewModalTemplate(template)}
                          className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Podgląd</span>
                        </button>
                        <button
                          onClick={() => handleSelectTemplate(template)}
                          className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded-md border border-violet-500/20"
                        >
                          <span>Wstaw</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Large Detailed Preview Modal */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-6xl max-h-[92vh] bg-[#141418] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#1a1a20]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{previewModalTemplate.name}</h2>
                  {previewModalTemplate.badge && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {previewModalTemplate.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{previewModalTemplate.description}</p>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center gap-1 bg-[#0e0e14] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'desktop' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (1280px)</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'tablet' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    previewViewport === 'mobile' ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPreviewModalTemplate(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Live Section Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#090910] flex items-center justify-center min-h-[420px]">
              <ScaleToFitContainer
                targetWidth={previewViewport === 'desktop' ? 1280 : previewViewport === 'tablet' ? 768 : 375}
                maxHeight={560}
                className="shadow-2xl border border-white/10"
                interactiveVideo={true}
              >
                <SectionPreviewRenderer sectionNode={getTemplateNode(previewModalTemplate)} />
              </ScaleToFitContainer>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272A] bg-[#1a1a20]">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-mono text-violet-400 uppercase font-semibold">{previewModalTemplate.category}</span>
                <span>•</span>
                <span>Rzeczywisty układ i stylowanie SoloSpot Canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Zamknij podgląd
                </button>
                <button
                  onClick={() => {
                    handleSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Wstaw tę sekcję do strony</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
