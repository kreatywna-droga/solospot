/**
 * Card Systems — 20+ Card Style Systems
 *
 * Each system defines: STRUCTURE, PADDING, RADIUS, BORDER, SHADOW,
 * BACKGROUND, TYPOGRAPHY, IMAGE TREATMENT, CONTENT RULES.
 */

import type { ColorPalette } from '../colors/colorPalettes';
import type { TypographySystem } from '../typography/typographySystems';

export type CardStyleName =
  | 'Minimal' | 'Bordered' | 'Elevated' | 'Soft' | 'Glass'
  | 'Luxury' | 'Dark' | 'Gradient' | 'Image' | 'Portfolio'
  | 'Editorial' | 'Magazine' | 'Horizontal' | 'Vertical'
  | 'Asymmetric' | 'Feature' | 'Service' | 'Testimonial'
  | 'Product' | 'Pricing';

export interface CardSystem {
  id: string;
  name: string;
  styleName: CardStyleName;
  structure: string;
  padding: string;
  radius: string;
  border: string;
  shadow: string;
  background: string;
  typography: string;
  imageTreatment: string;
  contentRules: string[];
  metadata: {
    bestIndustries: string[];
    goodUseCases: string[];
    badUseCases: string[];
    antiPatterns: string[];
  };
  preview: {
    title: string;
    description: string;
    image?: string;
    style: Record<string, string>;
  };
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

function createCardSystem(
  id: string,
  name: string,
  styleName: CardStyleName,
  structure: string,
  padding: string,
  radius: string,
  border: string,
  shadow: string,
  background: string,
  typography: string,
  imageTreatment: string,
  contentRules: string[],
  metadata: CardSystem['metadata'],
  tags: string[] = []
): CardSystem {
  const now = Date.now();
  return {
    id,
    name,
    styleName,
    structure,
    padding,
    radius,
    border,
    shadow,
    background,
    typography,
    imageTreatment,
    contentRules,
    metadata,
    preview: {
      title: 'Card Title',
      description: 'This is a sample card description demonstrating the card style.',
      style: { background, border, shadow, radius },
    },
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
  };
}

// ============================================================
// MINIMAL CARDS
// ============================================================

export const minimalCards: CardSystem = createCardSystem(
  'cards-minimal',
  'Minimal',
  'Minimal',
  'flat', '16px', '0px', '1px solid #E5E7EB', 'none',
  '#FFFFFF', 'Inter', 'none',
  ['clean layout', 'simple content', 'balanced whitespace'],
  { bestIndustries: ['technology','general'], goodUseCases: ['dashboards','lists'], badUseCases: ['luxury','creative'], antiPatterns: ['too plain','no visual hierarchy'] },
  ['minimal','clean','flat']
);

// ============================================================
// BORDERED CARDS
// ============================================================

export const borderedCards: CardSystem = createCardSystem(
  'cards-bordered',
  'Bordered',
  'Bordered',
  'flat', '20px', '8px', '2px solid #E5E7EB', 'none',
  '#FFFFFF', 'Inter', 'rounded',
  ['clear boundaries', 'structured content', 'consistent borders'],
  { bestIndustries: ['technology','corporate'], goodUseCases: ['forms','lists','dashboards'], badUseCases: ['luxury','editorial'], antiPatterns: ['too many borders','visual noise'] },
  ['bordered','structured','clean']
);

// ============================================================
// ELEVATED CARDS
// ============================================================

export const elevatedCards: CardSystem = createCardSystem(
  'cards-elevated',
  'Elevated',
  'Elevated',
  'layered', '24px', '12px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'rounded',
  ['depth','hierarchy','focus'],
  { bestIndustries: ['technology','general'], goodUseCases: ['dashboards','landing pages','UI'], badUseCases: ['minimal','editorial'], antiPatterns: ['too much elevation','visual clutter'] },
  ['elevated','depth','modern']
);

// ============================================================
// SOFT CARDS
// ============================================================

export const softCards: CardSystem = createCardSystem(
  'cards-soft',
  'Soft',
  'Soft',
  'layered', '24px', '16px', '1px solid #E5E7EB', '0 2px 8px rgba(0,0,0,0.05)',
  '#F9FAFB', 'Inter', 'rounded',
  ['gentle','approachable','warm'],
  { bestIndustries: ['wellness','lifestyle','healthcare'], goodUseCases: ['wellness sites','lifestyle'], badUseCases: ['tech','corporate'], antiPatterns: ['too soft for tech','low contrast'] },
  ['soft','gentle','warm']
);

// ============================================================
// GLASS CARDS
// ============================================================

export const glassCards: CardSystem = createCardSystem(
  'cards-glass',
  'Glass',
  'Glass',
  'layered', '24px', '16px', '1px solid rgba(255,255,255,0.2)', '0 8px 32px rgba(0,0,0,0.1)',
  'rgba(255,255,255,0.1)', 'Inter', 'rounded',
  ['modern','glassmorphism','premium'],
  { bestIndustries: ['technology','creative'], goodUseCases: ['glassmorphism UIs','dark themes'], badUseCases: ['accessibility','readability'], antiPatterns: ['poor readability','accessibility issues'] },
  ['glass','glassmorphism','modern']
);

// ============================================================
// LUXURY CARDS
// ============================================================

export const luxuryCards: CardSystem = createCardSystem(
  'cards-luxury',
  'Luxury',
  'Luxury',
  'layered', '32px', '0px', '2px solid #D4A843', '0 8px 24px rgba(212,168,67,0.2)',
  '#0A0A0A', 'Playfair Display', 'framed',
  ['elegant','refined','premium'],
  { bestIndustries: ['luxury','fashion','beauty'], goodUseCases: ['luxury branding','high-end'], badUseCases: ['tech','casual'], antiPatterns: ['too ornate','overuse'] },
  ['luxury','elegant','refined']
);

// ============================================================
// DARK CARDS
// ============================================================

export const darkCards: CardSystem = createCardSystem(
  'cards-dark',
  'Dark',
  'Dark',
  'layered', '24px', '12px', '1px solid #333333', '0 4px 12px rgba(0,0,0,0.3)',
  '#1A1A1A', 'Inter', 'rounded',
  ['contrast','modern','sleek'],
  { bestIndustries: ['technology','gaming'], goodUseCases: ['dark themes','gaming'], badUseCases: ['luxury','editorial'], antiPatterns: ['poor readability','accessibility issues'] },
  ['dark','modern','sleek']
);

// ============================================================
// GRADIENT CARDS
// ============================================================

export const gradientCards: CardSystem = createCardSystem(
  'cards-gradient',
  'Gradient',
  'Gradient',
  'layered', '24px', '16px', 'none', '0 4px 16px rgba(0,0,0,0.15)',
  'linear-gradient(135deg, #667eea, #764ba2)', 'Inter', 'rounded',
  ['vibrant','modern','eye-catching'],
  { bestIndustries: ['creative','marketing'], goodUseCases: ['creative sites','marketing'], badUseCases: ['luxury','editorial'], antiPatterns: ['poor text contrast','overuse'] },
  ['gradient','vibrant','modern']
);

// ============================================================
// IMAGE CARDS
// ============================================================

export const imageCards: CardSystem = createCardSystem(
  'cards-image',
  'Image',
  'Image',
  'full-bleed', '0px', '0px', 'none', 'none',
  '#000000', 'Inter', 'full-bleed',
  ['visual impact','immersive','storytelling'],
  { bestIndustries: ['photography','portfolio','travel'], goodUseCases: ['portfolio','photography','travel'], badUseCases: ['corporate','minimal'], antiPatterns: ['too much image','no content'] },
  ['image','visual','immersive']
);

// ============================================================
// PORTFOLIO CARDS
// ============================================================

export const portfolioCards: CardSystem = createCardSystem(
  'cards-portfolio',
  'Portfolio',
  'Portfolio',
  'grid', '24px', '12px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'rounded',
  ['grid layout','visual showcase','project highlights'],
  { bestIndustries: ['creative','design','photography'], goodUseCases: ['portfolio','creative agencies','design'], badUseCases: ['corporate','minimal'], antiPatterns: ['too many projects','no focus'] },
  ['portfolio','creative','design']
);

// ============================================================
// EDITORIAL CARDS
// ============================================================

export const editorialCards: CardSystem = createCardSystem(
  'cards-editorial',
  'Editorial',
  'Editorial',
  'text-heavy', '32px', '0px', 'none', 'none',
  '#FFFFFF', 'Crimson Pro', 'none',
  ['long-form content','readable','classic'],
  { bestIndustries: ['publishing','media','literary'], goodUseCases: ['editorial','publishing','magazines'], badUseCases: ['tech','gaming'], antiPatterns: ['too plain','no visual interest'] },
  ['editorial','classic','literary']
);

// ============================================================
// MAGAZINE CARDS
// ============================================================

export const magazineCards: CardSystem = createCardSystem(
  'cards-magazine',
  'Magazine',
  'Magazine',
  'multi-column', '24px', '8px', '1px solid #E5E7EB', '0 2px 8px rgba(0,0,0,0.05)',
  '#FFFFFF', 'Playfair Display', 'rounded',
  ['multi-column','visual hierarchy','magazine layout'],
  { bestIndustries: ['media','publishing','fashion'], goodUseCases: ['magazines','media','fashion'], badUseCases: ['tech','minimal'], antiPatterns: ['too busy','no focus'] },
  ['magazine','media','fashion']
);

// ============================================================
// HORIZONTAL CARDS
// ============================================================

export const horizontalCards: CardSystem = createCardSystem(
  'cards-horizontal',
  'Horizontal',
  'Horizontal',
  'horizontal', '20px', '12px', '1px solid #E5E7EB', '0 2px 8px rgba(0,0,0,0.05)',
  '#FFFFFF', 'Inter', 'rounded',
  ['side-by-side','efficient','compact'],
  { bestIndustries: ['technology','general'], goodUseCases: ['lists','dashboards','feeds'], badUseCases: ['luxury','editorial'], antiPatterns: ['too wide','poor mobile'] },
  ['horizontal','compact','efficient']
);

// ============================================================
// VERTICAL CARDS
// ============================================================

export const verticalCards: CardSystem = createCardSystem(
  'cards-vertical',
  'Vertical',
  'Vertical',
  'vertical', '24px', '12px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'rounded',
  ['stacked','structured','readable'],
  { bestIndustries: ['technology','general'], goodUseCases: ['lists','dashboards','feeds'], badUseCases: ['luxury','editorial'], antiPatterns: ['too tall','poor mobile'] },
  ['vertical','stacked','structured']
);

// ============================================================
// ASYMMETRIC CARDS
// ============================================================

export const asymmetricCards: CardSystem = createCardSystem(
  'cards-asymmetric',
  'Asymmetric',
  'Asymmetric',
  'irregular', '24px', '16px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'cropped',
  ['dynamic','creative','unconventional'],
  { bestIndustries: ['creative','design','art'], goodUseCases: ['creative sites','design'], badUseCases: ['corporate','minimal'], antiPatterns: ['too chaotic','poor readability'] },
  ['asymmetric','creative','dynamic']
);

// ============================================================
// FEATURE CARDS
// ============================================================

export const featureCards: CardSystem = createCardSystem(
  'cards-feature',
  'Feature',
  'Feature',
  'icon-focused', '32px', '16px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.05)',
  '#FFFFFF', 'Inter', 'rounded',
  ['icon emphasis','feature highlights','callouts'],
  { bestIndustries: ['technology','SaaS'], goodUseCases: ['feature sections','SaaS','landing pages'], badUseCases: ['luxury','editorial'], antiPatterns: ['too many features','no focus'] },
  ['feature','icon','callout']
);

// ============================================================
// SERVICE CARDS
// ============================================================

export const serviceCards: CardSystem = createCardSystem(
  'cards-service',
  'Service',
  'Service',
  'service-focused', '24px', '12px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.05)',
  '#FFFFFF', 'Inter', 'rounded',
  ['service descriptions','pricing','features'],
  { bestIndustries: ['technology','SaaS','consulting'], goodUseCases: ['service pages','consulting'], badUseCases: ['luxury','editorial'], antiPatterns: ['too many services','no focus'] },
  ['service','consulting','SaaS']
);

// ============================================================
// TESTIMONIAL CARDS
// ============================================================

export const testimonialCards: CardSystem = createCardSystem(
  'cards-testimonial',
  'Testimonial',
  'Testimonial',
  'quote-focused', '32px', '16px', 'none', '0 2px 8px rgba(0,0,0,0.05)',
  '#F9FAFB', 'Crimson Pro', 'none',
  ['quotes','social proof','reviews'],
  { bestIndustries: ['general','marketing','hospitality'], goodUseCases: ['testimonials','reviews','social proof'], badUseCases: ['luxury','tech'], antiPatterns: ['too many testimonials','no credibility'] },
  ['testimonial','social','proof']
);

// ============================================================
// PRODUCT CARDS
// ============================================================

export const productCards: CardSystem = createCardSystem(
  'cards-product',
  'Product',
  'Product',
  'product-focused', '24px', '12px', '1px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'rounded',
  ['product images','pricing','descriptions'],
  { bestIndustries: ['e-commerce','retail'], goodUseCases: ['product listings','e-commerce'], badUseCases: ['luxury','editorial'], antiPatterns: ['too many products','no focus'] },
  ['product','e-commerce','retail']
);

// ============================================================
// PRICING CARDS
// ============================================================

export const pricingCards: CardSystem = createCardSystem(
  'cards-pricing',
  'Pricing',
  'Pricing',
  'pricing-focused', '32px', '16px', '2px solid #E5E7EB', '0 4px 12px rgba(0,0,0,0.1)',
  '#FFFFFF', 'Inter', 'none',
  ['pricing tiers','feature lists','CTAs'],
  { bestIndustries: ['SaaS','technology'], goodUseCases: ['pricing pages','SaaS'], badUseCases: ['luxury','editorial'], antiPatterns: ['too many tiers','confusing'] },
  ['pricing','SaaS','technology']
);

// ============================================================
// COMBINED CATALOG
// ============================================================

export const cardSystems: CardSystem[] = [
  minimalCards,
  borderedCards,
  elevatedCards,
  softCards,
  glassCards,
  luxuryCards,
  darkCards,
  gradientCards,
  imageCards,
  portfolioCards,
  editorialCards,
  magazineCards,
  horizontalCards,
  verticalCards,
  asymmetricCards,
  featureCards,
  serviceCards,
  testimonialCards,
  productCards,
  pricingCards,
];
