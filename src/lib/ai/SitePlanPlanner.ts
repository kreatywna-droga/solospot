/**
 * SitePlanPlanner.ts — Deterministic SitePlan Generator
 *
 * Converts a natural-language brief into a structured SitePlan
 * using keyword analysis and industry templates.
 *
 * No LLM dependency — runs deterministically for reliability.
 */

import type {
  SitePlan,
  SectionPlan,
  TextContent,
  DesignSystem,
  Industry,
  SitePurpose,
  SectionRole,
  VisualDirection,
  ContentStrategy,
  AssetStrategy,
  ExperienceStrategy,
  ResponsiveStrategy,
  ConversionStrategy,
} from './SitePlanTypes';
import { DEFAULT_DESIGN_SYSTEM, INDUSTRY_DEFAULTS } from './SitePlanTypes';

// ── Brief Analysis ──────────────────────────────────────────────────

interface BriefAnalysis {
  industry: Industry;
  purpose: SitePurpose;
  language: string;
  title: string;
  sections: SectionRole[];
}

const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  restaurant: ['restaurant', 'restauracja', 'jedzenie', 'menu', 'kuchnia', 'food', 'dining', 'pizza', 'burger', 'sushi', 'cafe', 'kawiarnia'],
  school: ['school', 'szkoła', 'nauka', 'education', 'kurs', 'course', 'szkolenie', 'lekcja', 'teacher', 'nauczyciel'],
  gym: ['gym', 'siłownia', 'fitness', 'trening', 'training', 'workout', 'exercise', 'crossfit', 'personal trainer'],
  dentist: ['dentist', 'dentyst', 'stomatolog', 'dental', 'teeth', 'zęb', 'implant', 'ortodoncj', 'wybielan', 'gabinet dentyst', 'gabinetu dentyst'],
  law: ['law', 'prawo', 'kancelaria', 'lawyer', 'adwokat', 'legal', 'attorney', 'radca prawny'],
  realestate: ['real estate', 'nieruchomości', 'mieszkanie', 'dom', 'property', 'housing', 'apartment', 'biuro nieruchomości'],
  saas: ['saas', 'software', 'aplikacja', 'app', 'platform', 'dashboard', 'analytics', 'tool', 'narzędzie', 'crm', 'erp'],
  agency: ['agency', 'agencja', 'marketing', 'reklama', 'branding', 'design studio', 'twórczy', 'creative'],
  portfolio: ['portfolio', 'prace', 'showcase', 'gallery', 'projekty', '作品', 'demonstracja'],
  ecommerce: ['ecommerce', 'sklep', 'shop', 'store', 'produkt', 'product', 'sprzedaż', 'buy', 'kup'],
  nonprofit: ['nonprofit', 'fundacja', 'ngo', 'charytatywna', 'społeczna', 'community', 'wolontariat'],
  clinic: ['clinic', 'klinika', 'lekarska', 'medical', 'medycyna', 'doctor', 'lekarz', 'health', 'zdrowie'],
  salon: ['salon', 'fryzjer', 'hairdresser', 'beauty', 'uroda', 'makeup', 'nails', 'paznokcie', 'manicure'],
  tech: ['tech', 'technology', 'technologia', 'cyfrowa', 'digital', 'startup', 'innovation', 'innowacja'],
  education: ['education', 'edukacja', 'university', 'uczelnia', 'akademia', 'academy', 'learning'],
  fitness: ['fitness', 'zdrowie', 'health', 'wellness', 'trening', 'workout', 'wellness center'],
  beauty: ['beauty', 'uroda', 'kosmetyki', 'cosmetics', 'skincare', 'pielęgnacja', 'salon piękności'],
  other: [],
};

const PURPOSE_KEYWORDS: Record<SitePurpose, string[]> = {
  'lead-generation': ['kontakt', 'zapisz się', 'formularz', 'umów', 'zamów', 'klient', 'lead', 'conversion', 'conversion rate'],
  portfolio: ['portfolio', 'prace', 'showcase', 'gallery', 'demonstracja'],
  informational: ['informacje', 'o nas', 'about', 'blog', 'artykuły', 'wiedza', 'encyclopedia'],
  booking: ['booking', 'rezerwacja', 'umów wizytę', 'schedule', 'appointment', 'kalendarz'],
  ecommerce: ['sklep', 'shop', 'produkt', 'product', 'koszyk', 'cart', 'checkout'],
  'landing-page': ['landing', 'strona docelowa', 'reklama', 'kampania', 'campaign', 'promo'],
  blog: ['blog', 'artykuły', 'posts', 'wpisy', 'dziennik'],
  community: ['community', 'społeczność', 'forum', 'grupa', 'group', 'member', 'członek'],
};

// ── Section Templates ───────────────────────────────────────────────

function generateHeroContent(analysis: BriefAnalysis): TextContent {
  const heroes: Record<Industry, TextContent> = {
    restaurant: {
      heading: 'Smak, który zapada w pamięć',
      subheading: 'Autentyczna kuchnia przygotowana z pasją i świeżych składników',
      cta: 'Zobacz Menu',
    },
    school: {
      heading: 'Twoja przyszłość zaczyna się tutaj',
      subheading: 'Kształcimy liderów jutra przez innowacyjne metody nauczania',
      cta: 'Poznaj naszą ofertę',
    },
    gym: {
      heading: 'Zmień swoje ciało, zmień swoje życie',
      subheading: 'Profesjonalny trening i wsparcie na każdym etapie',
      cta: 'Rozpocznij trening',
    },
    dentist: {
      heading: 'Twój uśmiech to nasza pasja',
      subheading: 'Nowoczesna stomatologia i komfortowe leczenie',
      cta: 'Umów wizytę',
    },
    law: {
      heading: 'Profesjonalna pomoc prawna',
      subheading: 'Doświadczenie i zaangażowanie w każdej sprawie',
      cta: 'Skonsultuj sprawę',
    },
    realestate: {
      heading: 'Znajdź wymarzone miejsce',
      subheading: 'Oferujemy nieruchomości dopasowane do Twoich potrzeb',
      cta: 'Przeglądaj oferty',
    },
    saas: {
      heading: 'Zarządzaj sprawniej z naszą platformą',
      subheading: 'Wszystko czego potrzebujesz w jednym miejscu',
      cta: 'Wypróbuj za darmo',
    },
    agency: {
      heading: 'Tworzymy marki, które zapadają w pamięć',
      subheading: 'Kreatywne rozwiązania dla Twojego biznesu',
      cta: 'Zobacz nasze prace',
    },
    portfolio: {
      heading: 'Moje prace',
      subheading: 'Projekty, które tworzę z pasją i precyzją',
      cta: 'Zobacz więcej',
    },
    ecommerce: {
      heading: 'Odkryj naszą kolekcję',
      subheading: 'Produkty najwyższej jakości w atrakcyjnych cenach',
      cta: 'Kup teraz',
    },
    nonprofit: {
      heading: 'Razem możemy więcej',
      subheading: 'Dołącz do nas i zmieniaj świat na lepsze',
      cta: 'Wesprzyj nas',
    },
    clinic: {
      heading: 'Zdrowie w dobrych rękach',
      subheading: 'Profesjonalna opieka medyczna na najwyższym poziomie',
      cta: 'Umów wizytę',
    },
    salon: {
      heading: 'Odkryj swój styl',
      subheading: 'Profesjonalna pielęgnacja i relaks',
      cta: 'Zarezerwuj termin',
    },
    tech: {
      heading: 'Innowacje dla Twojego biznesu',
      subheading: 'Technologie przyszłości dostępne już dziś',
      cta: 'Dowiedz się więcej',
    },
    education: {
      heading: 'Wiedza to potęga',
      subheading: 'Odkrywaj nowe możliwości z nami',
      cta: 'Rozpocznij naukę',
    },
    fitness: {
      heading: 'Zadbaj o swoje zdrowie',
      subheading: 'Kompleksowe podejście do wellness',
      cta: 'Zacznij dziś',
    },
    beauty: {
      heading: 'Piękno w każdym detalu',
      subheading: 'Profesjonalne usługi beauty',
      cta: 'Umów się',
    },
    other: {
      heading: 'Witamy na naszej stronie',
      subheading: 'Poznaj naszą ofertę',
      cta: 'Dowiedz się więcej',
    },
  };
  return heroes[analysis.industry] || heroes.other;
}

function generateSections(analysis: BriefAnalysis): SectionPlan[] {
  const sections: SectionPlan[] = [];

  // 0. Header / Navigation (PHASE 4 — professional site always needs nav)
  sections.push({
    id: 'navbar-1',
    role: 'navbar',
    label: 'Nawigacja',
    templateType: 'navbar',
    content: {
      heading: analysis.title,
      items: [
        { label: 'Strona główna' },
        { label: 'Usługi' },
        { label: 'O nas' },
        { label: 'Opinie' },
        { label: 'Kontakt' },
      ],
      cta: analysis.purpose === 'booking' ? 'Umów wizytę' : 'Kontakt',
    },
    images: [],
    styles: {},
  });

  // 1. Hero
  sections.push({
    id: 'hero-1',
    role: 'hero',
    label: 'Sekcja hero',
    templateType: 'hero',
    content: generateHeroContent(analysis),
    images: [{ id: 'hero-img', role: 'hero', query: analysis.industry }],
    styles: {},
  });

  // 2. Features (always included)
  const featuresContent: Record<Industry, TextContent> = {
    restaurant: {
      heading: 'Dlaczego my?',
      items: [
        { label: 'Świeże składniki', description: 'Korzystamy wyłącznie z lokalnych, świeżych produktów' },
        { label: 'Szef kuchni', description: 'Doświadczony kucharz z pasją do gotowania' },
        { label: 'Szybka dostawa', description: 'Dostarczamy w ciągu 30 minut' },
        { label: 'Menu sezonowe', description: 'Zmieniamy menu zgodnie z porami roku' },
      ],
    },
    school: {
      heading: 'Nasze atuty',
      items: [
        { label: 'Doświadczeni pedagodzy', description: 'Nasi nauczyciele to eksperci w swoich dziedzinach' },
        { label: 'Małe grupy', description: 'Indywidualne podejście do każdego ucznia' },
        { label: 'Nowoczesne metody', description: 'Wykorzystujemy technologie w nauczaniu' },
        { label: 'Certyfikaty', description: 'Programy akredytowane międzynarodowo' },
      ],
    },
    gym: {
      heading: 'Co oferujemy',
      items: [
        { label: 'Sprzęt premium', description: 'Najnowocześniejszy sprzęt treningowy' },
        { label: 'Trenerzy personalni', description: 'Indywidualne plany treningowe' },
        { label: 'Grupy', description: 'Zajęcia grupowe dla każdego poziomu' },
        { label: 'Strefa relaksu', description: 'Sauna i strefa wypoczynku' },
      ],
    },
    dentist: {
      heading: 'Nasza oferta',
      items: [
        { label: 'Implantologia', description: 'Nowoczesne implanty stomatologiczne' },
        { label: 'Ortodoncja', description: 'Aparaty stałe i ruchome' },
        { label: 'Wybielanie', description: 'Profesjonalne wybielanie zębów' },
        { label: 'Bezbolesne leczenie', description: 'Gwarantujemy komfort podczas zabiegów' },
      ],
    },
    law: {
      heading: 'Specjalizacje',
      items: [
        { label: 'Prawo cywilne', description: 'Sprawy o odszkodowania i zadośćuczynienia' },
        { label: 'Prawo pracy', description: 'Ochrona praw pracowniczych' },
        { label: 'Prawo rodzinne', description: 'Rozwody, alimenty, opieka nad dziećmi' },
        { label: 'Prawo gospodarcze', description: 'Obsługa prawna firm' },
      ],
    },
    realestate: {
      heading: 'Dlaczego warto z nami?',
      items: [
        { label: 'Duży wybór', description: 'Tysiące nieruchomości w ofercie' },
        { label: 'Profesjonalna obsługa', description: 'Pomagamy na każdym etapie' },
        { label: 'Bezpieczne transakcje', description: 'Gwarantujemy bezpieczeństwo prawne' },
        { label: 'Finansowanie', description: 'Pomagamy w uzyskaniu kredytu' },
      ],
    },
    saas: {
      heading: 'Funkcje platformy',
      items: [
        { label: 'Dashboard', description: 'Przejrzysty panel zarządzania' },
        { label: 'Analityka', description: 'Zaawansowane raporty i wskaźniki' },
        { label: 'Integracje', description: 'Łącz się z ulubionymi narzędziami' },
        { label: 'Automatyzacja', description: 'Oszczędzaj czas dzięki automatyzacji' },
      ],
    },
    agency: {
      heading: 'Nasze usługi',
      items: [
        { label: 'Branding', description: 'Tworzymy spójne identyfikacje wizualne' },
        { label: 'Web Design', description: 'Nowoczesne strony internetowe' },
        { label: 'Marketing', description: 'Kampanie reklamowe i SEO' },
        { label: 'Social Media', description: 'Zarządzanie mediami społecznościowymi' },
      ],
    },
    portfolio: {
      heading: 'Umiejętności',
      items: [
        { label: 'Design', description: 'UI/UX, branding, grafika' },
        { label: 'Development', description: 'React, Next.js, TypeScript' },
        { label: 'Fotografia', description: 'Produktowa i portretowa' },
        { label: 'Motion', description: 'Animacje i wideo' },
      ],
    },
    ecommerce: {
      heading: 'Zalety zakupów',
      items: [
        { label: 'Szybka dostawa', description: 'Wysyłka w 24 godziny' },
        { label: 'Gwarancja', description: '30 dni na zwrot' },
        { label: 'Bezpieczeństwo', description: 'Bezpieczne płatności online' },
        { label: 'Wsparcie', description: 'Pomoc 7 dni w tygodniu' },
      ],
    },
    nonprofit: {
      heading: 'Nasza misja',
      items: [
        { label: 'Edukacja', description: 'Zapewniamy dostęp do wiedzy' },
        { label: 'Pomoc', description: 'Wspieramy potrzebujących' },
        { label: 'Środowisko', description: 'Chronimy planetę' },
        { label: 'Społeczność', description: 'Budujemy silne relacje' },
      ],
    },
    clinic: {
      heading: 'Nasze usługi',
      items: [
        { label: 'Diagnostyka', description: 'Nowoczesne badania diagnostyczne' },
        { label: 'Leczenie', description: 'Kompleksowa opieka medyczna' },
        { label: 'Profilaktyka', description: 'Programy zdrowotne' },
        { label: 'Specjaliści', description: 'Doświadczeni lekarze specjaliści' },
      ],
    },
    salon: {
      heading: 'Nasza oferta',
      items: [
        { label: 'Strzyżenie', description: 'Profesjonalne strzyżenie damskie i męskie' },
        { label: 'Koloryzacja', description: 'Najnowsze techniki koloryzacji' },
        { label: 'Pielęgnacja', description: 'Zabiegi regenerujące' },
        { label: 'Stylizacja', description: 'Okazje i na co dzień' },
      ],
    },
    tech: {
      heading: 'Nasze rozwiązania',
      items: [
        { label: 'Aplikacje webowe', description: 'Nowoczesne rozwiązania SaaS' },
        { label: 'Mobilne', description: 'Aplikacje iOS i Android' },
        { label: 'AI/ML', description: 'Sztuczna inteligencja dla biznesu' },
        { label: 'Chmura', description: 'Infrastruktura cloud-native' },
      ],
    },
    education: {
      heading: 'Dlaczego my?',
      items: [
        { label: 'Doświadczenie', description: 'Lata tradycji i ekspertyzy' },
        { label: 'Program', description: 'Nowoczesna podstawa programowa' },
        { label: 'Zajęcia dodatkowe', description: 'Bogata oferta pozalekcyjna' },
        { label: 'Wsparcie', description: 'Pomoc psychologa i pedagoga' },
      ],
    },
    fitness: {
      heading: 'Co oferujemy',
      items: [
        { label: 'Trening personalny', description: 'Indywidualne programy' },
        { label: 'Grupy', description: 'Zajęcia w małych grupach' },
        { label: 'Dieta', description: 'Plany żywieniowe' },
        { label: 'Regeneracja', description: 'Strefa relaksu i sauny' },
      ],
    },
    beauty: {
      heading: 'Nasze usługi',
      items: [
        { label: 'Paznokcie', description: 'Manicure i pedicure' },
        { label: 'Makijaż', description: 'Profesjonalny makijaż' },
        { label: 'Zabiegi', description: 'Pielęgnacja twarzy' },
        { label: 'Rzęsy', description: 'Przedłużanie i zagęszczanie' },
      ],
    },
    other: {
      heading: 'Nasza oferta',
      items: [
        { label: 'Usługa 1', description: 'Opis pierwszej usługi' },
        { label: 'Usługa 2', description: 'Opis drugiej usługi' },
        { label: 'Usługa 3', description: 'Opis trzeciej usługi' },
        { label: 'Usługa 4', description: 'Opis czwartej usługi' },
      ],
    },
  };

  sections.push({
    id: 'features-1',
    role: 'features',
    label: 'Funkcje / Atuty',
    templateType: 'feature-grid',
    content: featuresContent[analysis.industry] || featuresContent.other,
    images: [],
    styles: {},
  });

  // 3. About (for service industries)
  if (['restaurant', 'school', 'dentist', 'law', 'clinic', 'salon', 'gym', 'fitness', 'beauty'].includes(analysis.industry)) {
    sections.push({
      id: 'about-1',
      role: 'about',
      label: 'O nas',
      templateType: 'content',
      content: {
        heading: 'O nas',
        description: `Jesteśmy ${analysis.industry === 'restaurant' ? 'restauracją' : analysis.industry === 'school' ? 'szkołą' : analysis.industry === 'dentist' ? 'kliniką stomatologiczną' : analysis.industry === 'law' ? 'kancelarią prawną' : analysis.industry === 'clinic' ? 'kliniką' : analysis.industry === 'salon' ? 'salonem' : analysis.industry === 'gym' ? 'siłownią' : 'firmą'} z wieloletnim doświadczeniem. Naszą pasją jest ${analysis.industry === 'restaurant' ? 'gotowanie' : 'pomaganie naszym klientom'} i dążenie do doskonałości.`,
      },
      images: [{ id: 'about-img', role: 'team', query: analysis.industry }],
      styles: {},
    });
  }

  // 4. Testimonials
  if (['restaurant', 'school', 'dentist', 'law', 'clinic', 'salon', 'gym', 'saas', 'agency'].includes(analysis.industry)) {
    const dental = analysis.industry === 'dentist';
    sections.push({
      id: 'testimonials-1',
      role: 'testimonials',
      label: dental ? 'Opinie pacjentów' : 'Opinie klientów',
      templateType: 'testimonials',
      content: {
        heading: dental ? 'Co mówią nasi pacjenci' : 'Co mówią nasi klienci',
        items: dental
          ? [
              { label: 'Anna K.', description: 'Bezbolesne leczenie i miła obsługa. Polecam gabinet.' },
              { label: 'Marek T.', description: 'Profesjonalna implantologia — wróciłem do pełnego uśmiechu.' },
              { label: 'Ewa M.', description: 'Nowoczesny gabinet, punktualnie i komfortowo.' },
            ]
          : [
              { label: 'Anna K.', description: 'Świetna obsługa! Polecam każdemu.' },
              { label: 'Marek T.', description: 'Profesjonalna firma, szybka realizacja.' },
              { label: 'Ewa M.', description: 'Najlepsza firma w okolicy. Wracam regularnie.' },
            ],
      },
      images: [],
      styles: {},
    });
  }

  // 5. CTA (industry-aware heading)
  const ctaHeadings: Partial<Record<Industry, string>> = {
    dentist: 'Gotowy na zdrowy uśmiech?',
    clinic: 'Zadbaj o swoje zdrowie',
    restaurant: 'Zarezerwuj stolik już dziś',
    gym: 'Zacznij trening jeszcze dziś',
    law: 'Umów konsultację prawną',
    school: 'Zapisz się na zajęcia',
    ecommerce: 'Skorzystaj z oferty',
    salon: 'Umów się na wizytę',
  };
  sections.push({
    id: 'cta-1',
    role: 'cta',
    label: 'Wezwanie do działania',
    templateType: 'cta',
    content: {
      heading: ctaHeadings[analysis.industry] || 'Skontaktuj się z nami',
      subheading: analysis.purpose === 'booking'
        ? 'Umów wizytę już dziś'
        : analysis.purpose === 'ecommerce'
        ? 'Zamów teraz i odbierz rabat'
        : 'Skontaktuj się z nami',
      cta: analysis.purpose === 'booking' ? 'Umów wizytę' : analysis.purpose === 'ecommerce' ? 'Kup teraz' : 'Napisz do nas',
    },
    images: [],
    styles: {},
  });

  // 6. Footer
  sections.push({
    id: 'footer-1',
    role: 'footer',
    label: 'Stopka',
    templateType: 'footer',
    content: {
      heading: analysis.title,
      items: [
        { label: 'Kontakt' },
        { label: 'Polityka prywatności' },
        { label: 'Regulamin' },
      ],
    },
    images: [],
    styles: {},
  });

  return sections;
}

// ── Main Planner ────────────────────────────────────────────────────

/** Extract a clean brand/title from a brief (not the raw prompt). */
function extractSiteTitle(brief: string, industry: Industry): string {
  const industryTitles: Record<string, string> = {
    dentist: 'Nowoczesny gabinet dentystyczny',
    clinic: 'Klinika medyczna',
    restaurant: 'Restauracja',
    school: 'Szkoła',
    gym: 'Siłownia',
    law: 'Kancelaria prawna',
    realestate: 'Biuro nieruchomości',
    saas: 'Platforma SaaS',
    agency: 'Agencja kreatywna',
    ecommerce: 'Sklep internetowy',
    salon: 'Salon beauty',
  };
  const dla = brief.match(/\bdla\s+(?:nowoczesn\w*\s+|profesjonaln\w*\s+)?(.+?)(?:\.|,|$)/i);
  if (dla?.[1]) {
    const phrase = dla[1].trim().replace(/\s+/g, ' ').slice(0, 48);
    if (phrase.length >= 4) {
      return phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }
  }
  return industryTitles[industry] || brief.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Moja strona';
}

export function generateSitePlan(brief: string): SitePlan {
  const lowerBrief = brief.toLowerCase();

  // Detect industry (stem match: "dentyst" hits "dentystycznego")
  let detectedIndustry: Industry = 'other';
  let maxScore = 0;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter((kw) => lowerBrief.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedIndustry = industry as Industry;
    }
  }

  // Detect purpose; fall back to industry default when brief has no purpose signal
  let detectedPurpose: SitePurpose = 'informational';
  let purposeScore = 0;
  for (const [purpose, keywords] of Object.entries(PURPOSE_KEYWORDS)) {
    const score = keywords.filter((kw) => lowerBrief.includes(kw)).length;
    if (score > purposeScore) {
      purposeScore = score;
      detectedPurpose = purpose as SitePurpose;
    }
  }
  if (purposeScore === 0) {
    const industryDefault = INDUSTRY_DEFAULTS[detectedIndustry]?.purpose;
    if (industryDefault) detectedPurpose = industryDefault;
  }

  const title = extractSiteTitle(brief, detectedIndustry);

  // Build analysis
  const analysis: BriefAnalysis = {
    industry: detectedIndustry,
    purpose: detectedPurpose,
    language: 'pl',
    title,
    sections: [],
  };

  // Get industry defaults
  const defaults = INDUSTRY_DEFAULTS[detectedIndustry] || INDUSTRY_DEFAULTS.other;
  const designSystem: DesignSystem = {
    ...DEFAULT_DESIGN_SYSTEM,
    ...defaults.designSystem || {},
  };

  // Generate sections
  const sections = generateSections(analysis);

  // Default strategies for deterministic fallback
  const defaultContentStrategy: ContentStrategy = {
    toneOfVoice: 'professional',
    headlineStyle: 'bold',
    contentDensity: 'moderate',
    language: 'pl',
    useEmojis: false,
    ctaStrategy: 'primary-action',
  };

  const defaultAssetStrategy: AssetStrategy = {
    imageStyle: 'photography',
    imageMood: 'professional',
    iconStyle: 'outlined',
    useVideo: false,
  };

  const defaultExperienceStrategy: ExperienceStrategy = {
    useParallax: false,
    useScrollReveal: true,
    useMotion: true,
    useMeshGradient: false,
    useParticles: false,
    use3D: false,
    intensity: 'subtle',
  };

  const defaultResponsiveStrategy: ResponsiveStrategy = {
    mobileNavStyle: 'hamburger',
    mobileHeroLayout: 'stacked',
    mobileTypographyScale: 0.85,
    tabletBreakpoint: 768,
    mobileBreakpoint: 480,
  };

  const defaultConversionStrategy: ConversionStrategy = {
    primaryCTA: 'Dowiedz się więcej',
    primaryCTALocation: ['hero', 'footer'],
    trustSignals: ['Opinie klientów', 'Gwarancja jakości'],
    urgencyLevel: 'none',
  };

  return {
    purpose: detectedPurpose,
    industry: detectedIndustry,
    visualDirection: 'professional',
    designSystem,
    contentStrategy: defaultContentStrategy,
    assetStrategy: defaultAssetStrategy,
    experienceStrategy: defaultExperienceStrategy,
    responsiveStrategy: defaultResponsiveStrategy,
    conversionStrategy: defaultConversionStrategy,
    sections,
    pages: [{
      id: 'page-home',
      name: 'Strona główna',
      purpose: detectedPurpose,
      sections: sections.map((s) => s.id),
    }],
    metadata: {
      title,
      description: brief.slice(0, 160),
      language: 'pl',
      generatedAt: new Date().toISOString(),
      plannerType: 'deterministic',
    },
  };
}
