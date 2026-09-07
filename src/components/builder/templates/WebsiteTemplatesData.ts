import React from 'react';

export interface WebsiteTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  iconName: string;
  icon?: React.ElementType;
  sectionTemplateIds: string[];
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'landing-page',
    name: 'Strona Docelowa (Landing Page)',
    tagline: 'Maksymalna konwersja dla produktów i SaaS',
    description: 'Hero wyśrodkowany, 3 karty korzyści, opinie klientów, baner CTA oraz profesjonalna stopka.',
    badge: 'Rekomendowane',
    iconName: 'Sparkles',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-centered', 'features-3-cards', 'testimonials-cards', 'cta-banner', 'footer-modern'],
  },
  {
    id: 'business',
    name: 'Firma & Usługi (Business)',
    tagline: 'Wiarygodny wizerunek nowoczesnej firmy',
    description: 'Hero z grafiką split, sekcja O Nas z misją, cechy oferty, formularz kontaktowy i stopka.',
    badge: 'Popularne',
    iconName: 'Briefcase',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-split-image', 'about-story', 'features-3-cards', 'contact-simple', 'footer-modern'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio / Twórca',
    tagline: 'Wyeksponuj swoje projekty i osiągnięcia',
    description: 'Hero filmowe, sekcja O Mnie, opinie zadowolonych klientów, kontakt i stopka.',
    iconName: 'Camera',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-video-ambient', 'about-story', 'testimonials-cards', 'contact-simple', 'footer-modern'],
  },
  {
    id: 'agency',
    name: 'Agencja Kreatywna',
    tagline: 'Prezentacja usług o wysokiej estetyce',
    description: 'Hero z grafiką split, sekcja O Nas, 3 cechy/usługi, opinie klientów i CTA.',
    iconName: 'Palette',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-split-image', 'features-3-cards', 'about-story', 'cta-banner', 'footer-modern'],
  },
  {
    id: 'restaurant',
    name: 'Restauracja / Kawiarnia',
    tagline: 'Smakowite menu i atmosfera lokalu',
    description: 'Hero z klimatycznym tłem, historia lokalu, opinie gości i kontakt rezerwacyjny.',
    iconName: 'Utensils',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-video-ambient', 'about-story', 'testimonials-cards', 'contact-simple', 'footer-modern'],
  },
  {
    id: 'store',
    name: 'Sklep E-Commerce',
    tagline: 'Szybki start sprzedaży produktów online',
    description: 'Hero banner z przyciskiem do zakupów, 3 zalety sklepu, opinie i wezwanie do akcji.',
    badge: 'Sklep',
    iconName: 'ShoppingBag',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-centered', 'features-3-cards', 'testimonials-cards', 'cta-banner', 'footer-modern'],
  },
  {
    id: 'creative',
    name: 'Kreatywna Strona Wizualna',
    tagline: 'Dla marek ceniących odważny styl',
    description: 'Hero filmowe w pełnej szerokości, sekcja O Nas, baner CTA i nowoczesna stopka.',
    iconName: 'Palette',
    icon: (() => null) as any,
    sectionTemplateIds: ['hero-video-ambient', 'about-story', 'cta-banner', 'footer-modern'],
  },
  {
    id: 'blank',
    name: 'Czysta Strona (Od zera)',
    tagline: 'Pełna swoboda projektowania od podstaw',
    description: 'Rozpocznij z pustą kanwą i dodawaj sekcje oraz komponenty według własnego pomysłu.',
    iconName: 'FilePlus',
    icon: (() => null) as any,
    sectionTemplateIds: [],
  },
];
