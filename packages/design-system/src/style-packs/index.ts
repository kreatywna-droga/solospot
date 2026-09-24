/**
 * Style Packs — Complete Style Pack Catalog
 *
 * Provides 50+ pre-composed style packs combining all design elements.
 */

export interface StylePack {
  id: string;
  name: string;
  description: string;
  industry: string;
  mood: string[];
  style: string;
  tags: string[];
  typographyId: string;
  colorPaletteId: string;
  buttonSystemId: string;
  cardSystemId: string;
  radiusId: string;
  shadowId: string;
  backgroundId: string;
  spacingId: string;
  sectionStyleId: string;
  heroStyleId: string;
  imageTreatmentId: string;
  iconStyleId: string;
  effectId: string;
  compatibleWith: string[];
  notRecommendedWith: string[];
  preview: Record<string, string>;
  version: string;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export const stylePacks: StylePack[] = [
  {
    id: 'sp-modern-dental-premium',
    name: 'Modern Dental Premium',
    description: 'Clean, professional dental style',
    industry: 'dental',
    mood: ['modern', 'clean', 'professional'],
    style: 'Modern Minimal',
    tags: ['dental', 'medical', 'clean'],
    typographyId: 'typography-modern-minimal',
    colorPaletteId: 'mono-black-white',
    buttonSystemId: 'buttons-solid',
    cardSystemId: 'cards-minimal',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-medium',
    backgroundId: 'background-solid',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-clean',
    heroStyleId: 'hero-centered',
    imageTreatmentId: 'image-natural',
    iconStyleId: 'icon-outline',
    effectId: 'effect-none',
    compatibleWith: ['typography-modern-minimal', 'mono-black-white', 'buttons-solid', 'cards-minimal'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-medical-clean',
    name: 'Medical Clean',
    description: 'Trustworthy medical design',
    industry: 'medical',
    mood: ['medical', 'clean', 'trustworthy'],
    style: 'Medical Clean',
    tags: ['medical', 'healthcare', 'clean'],
    typographyId: 'typography-medical-clean',
    colorPaletteId: 'medical-clean',
    buttonSystemId: 'buttons-outline',
    cardSystemId: 'cards-soft',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-soft',
    backgroundId: 'background-solid',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-clean',
    heroStyleId: 'hero-centered',
    imageTreatmentId: 'image-natural',
    iconStyleId: 'icon-outline',
    effectId: 'effect-none',
    compatibleWith: ['typography-medical-clean', 'medical-clean', 'buttons-outline', 'cards-soft'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-dental-wellness',
    name: 'Dental Wellness',
    description: 'Wellness-focused dental design',
    industry: 'dental',
    mood: ['wellness', 'soft', 'organic'],
    style: 'Wellness',
    tags: ['dental', 'wellness', 'organic'],
    typographyId: 'typography-wellness',
    colorPaletteId: 'wellness-organic',
    buttonSystemId: 'buttons-pill',
    cardSystemId: 'cards-soft',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-soft',
    backgroundId: 'background-solid',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-clean',
    heroStyleId: 'hero-centered',
    imageTreatmentId: 'image-natural',
    iconStyleId: 'icon-outline',
    effectId: 'effect-none',
    compatibleWith: ['typography-wellness', 'wellness-organic', 'buttons-pill', 'cards-soft'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-luxury-dental',
    name: 'Luxury Dental',
    description: 'Premium luxury dental design',
    industry: 'dental',
    mood: ['luxury', 'elegant', 'premium'],
    style: 'Luxury Editorial',
    tags: ['dental', 'luxury', 'premium'],
    typographyId: 'typography-luxury-editorial',
    colorPaletteId: 'luxury-gold',
    buttonSystemId: 'buttons-luxury',
    cardSystemId: 'cards-luxury',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-luxury',
    backgroundId: 'background-solid',
    spacingId: 'spacing-luxury',
    sectionStyleId: 'section-luxury',
    heroStyleId: 'hero-luxury',
    imageTreatmentId: 'image-framed',
    iconStyleId: 'icon-luxury',
    effectId: 'effect-none',
    compatibleWith: ['typography-luxury-editorial', 'luxury-gold', 'buttons-luxury', 'cards-luxury'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-dark-tech',
    name: 'Dark Tech',
    description: 'Futuristic dark technology style',
    industry: 'technology',
    mood: ['dark', 'tech', 'futuristic'],
    style: 'Tech Modern',
    tags: ['technology', 'dark', 'tech'],
    typographyId: 'typography-tech-modern',
    colorPaletteId: 'dark-luxury',
    buttonSystemId: 'buttons-gradient',
    cardSystemId: 'cards-dark',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-medium',
    backgroundId: 'background-dark',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-dark',
    heroStyleId: 'hero-dark',
    imageTreatmentId: 'image-modern',
    iconStyleId: 'icon-tech',
    effectId: 'effect-glow',
    compatibleWith: ['typography-tech-modern', 'dark-luxury', 'buttons-gradient', 'cards-dark'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#1A1A2E' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-saas-modern',
    name: 'SaaS Modern',
    description: 'Clean SaaS design',
    industry: 'saas',
    mood: ['modern', 'clean', 'professional'],
    style: 'Modern Minimal',
    tags: ['saas', 'technology', 'modern'],
    typographyId: 'typography-modern-minimal',
    colorPaletteId: 'minimal-white',
    buttonSystemId: 'buttons-solid',
    cardSystemId: 'cards-elevated',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-medium',
    backgroundId: 'background-solid',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-clean',
    heroStyleId: 'hero-centered',
    imageTreatmentId: 'image-natural',
    iconStyleId: 'icon-outline',
    effectId: 'effect-none',
    compatibleWith: ['typography-modern-minimal', 'minimal-white', 'buttons-solid', 'cards-elevated'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-creative-studio',
    name: 'Creative Studio',
    description: 'Bold creative agency style',
    industry: 'creative-agency',
    mood: ['creative', 'bold', 'expressive'],
    style: 'Creative Studio',
    tags: ['creative', 'bold', 'expressive'],
    typographyId: 'typography-creative-studio',
    colorPaletteId: 'creative-vibrant',
    buttonSystemId: 'buttons-gradient',
    cardSystemId: 'cards-asymmetric',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-elevated',
    backgroundId: 'background-gradient',
    spacingId: 'spacing-airy',
    sectionStyleId: 'section-creative',
    heroStyleId: 'hero-creative',
    imageTreatmentId: 'image-full-bleed',
    iconStyleId: 'icon-creative',
    effectId: 'effect-bounce',
    compatibleWith: ['typography-creative-studio', 'creative-vibrant', 'buttons-gradient', 'cards-asymmetric'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FF6B35' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-luxury-architecture',
    name: 'Luxury Architecture',
    description: 'Elegant architecture design',
    industry: 'architecture',
    mood: ['luxury', 'modern', 'geometric'],
    style: 'Luxury Editorial',
    tags: ['architecture', 'luxury', 'modern'],
    typographyId: 'typography-luxury-editorial',
    colorPaletteId: 'luxury-gold',
    buttonSystemId: 'buttons-outline',
    cardSystemId: 'cards-elevated',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-luxury',
    backgroundId: 'background-solid',
    spacingId: 'spacing-luxury',
    sectionStyleId: 'section-luxury',
    heroStyleId: 'hero-luxury',
    imageTreatmentId: 'image-framed',
    iconStyleId: 'icon-luxury',
    effectId: 'effect-none',
    compatibleWith: ['typography-luxury-editorial', 'luxury-gold', 'buttons-outline', 'cards-elevated'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-fashion-editorial',
    name: 'Fashion Editorial',
    description: 'High-fashion editorial style',
    industry: 'fashion',
    mood: ['fashion', 'luxury', 'editorial'],
    style: 'Fashion Editorial',
    tags: ['fashion', 'luxury', 'editorial'],
    typographyId: 'typography-fashion-editorial',
    colorPaletteId: 'fashion-black-gold',
    buttonSystemId: 'buttons-luxury',
    cardSystemId: 'cards-luxury',
    radiusId: 'radius-sharp',
    shadowId: 'shadow-luxury',
    backgroundId: 'background-solid',
    spacingId: 'spacing-luxury',
    sectionStyleId: 'section-luxury',
    heroStyleId: 'hero-luxury',
    imageTreatmentId: 'image-framed',
    iconStyleId: 'icon-luxury',
    effectId: 'effect-none',
    compatibleWith: ['typography-fashion-editorial', 'fashion-black-gold', 'buttons-luxury', 'cards-luxury'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFFFFF' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {},
  },
  {
    id: 'sp-premium-restaurant',
    name: 'Premium Restaurant',
    description: 'Elegant restaurant design',
    industry: 'restaurant',
    mood: ['warm', 'elegant', 'inviting'],
    style: 'Sunset Warm',
    tags: ['restaurant', 'food', 'hospitality'],
    typographyId: 'typography-sunset-warm',
    colorPaletteId: 'restaurant-warm',
    buttonSystemId: 'buttons-outline',
    cardSystemId: 'cards-soft',
    radiusId: 'radius-rounded',
    shadowId: 'shadow-soft',
    backgroundId: 'background-solid',
    spacingId: 'spacing-balanced',
    sectionStyleId: 'section-clean',
    heroStyleId: 'hero-restaurant',
    imageTreatmentId: 'image-natural',
    iconStyleId: 'icon-outline',
    effectId: 'effect-none',
    compatibleWith: ['typography-sunset-warm', 'restaurant-warm', 'buttons-outline', 'cards-soft'],
    notRecommendedWith: [],
    preview: { h1: 'The Quick Brown Fox', h2: 'Subheading Text', body: 'Sample body text', button: 'Click Here', card: 'Card Title', background: '#FFF7ED' },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
metadata: {},
  },
  {
    "id": "sp-dental-1",
    "name": "Dental Signature",
    "description": "Signature style pack for Dental industry",
    "industry": "dental",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "dental",
      "industry",
      "mega"
    ],
    "typographyId": "typography-modern-minimal",
    "colorPaletteId": "medical-clean",
    "buttonSystemId": "buttons-solid",
    "cardSystemId": "cards-minimal",
    "radiusId": "radius-rounded",
    "shadowId": "shadow-none",
    "backgroundId": "background-solid",
    "spacingId": "spacing-compact",
    "sectionStyleId": "section-clean",
    "heroStyleId": "hero-centered",
    "imageTreatmentId": "image-natural",
    "iconStyleId": "icon-outline",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-modern-minimal",
      "medical-clean",
      "buttons-solid",
      "cards-minimal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Dental Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-dental-2",
    "name": "Dental Premium",
    "description": "Premium style pack for Dental industry",
    "industry": "dental",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "dental",
      "industry",
      "mega"
    ],
    "typographyId": "typography-luxury-editorial",
    "colorPaletteId": "medical-teal",
    "buttonSystemId": "buttons-outline",
    "cardSystemId": "cards-bordered",
    "radiusId": "radius-sharp",
    "shadowId": "shadow-soft",
    "backgroundId": "background-gradient",
    "spacingId": "spacing-balanced",
    "sectionStyleId": "section-hero",
    "heroStyleId": "hero-left",
    "imageTreatmentId": "image-rounded",
    "iconStyleId": "icon-filled",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-luxury-editorial",
      "medical-teal",
      "buttons-outline",
      "cards-bordered"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Dental Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-dental-3",
    "name": "Dental Studio",
    "description": "Studio style pack for Dental industry",
    "industry": "dental",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "dental",
      "industry",
      "mega"
    ],
    "typographyId": "typography-premium-corporate",
    "colorPaletteId": "medical-mint",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-elevated",
    "radiusId": "radius-pill",
    "shadowId": "shadow-medium",
    "backgroundId": "background-dark",
    "spacingId": "spacing-airy",
    "sectionStyleId": "section-compact",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-premium-corporate",
      "medical-mint",
      "buttons-ghost",
      "cards-elevated"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Dental Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-medical-1",
    "name": "Medical Signature",
    "description": "Signature style pack for Medical industry",
    "industry": "medical",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "medical",
      "industry",
      "mega"
    ],
    "typographyId": "typography-luxury-editorial",
    "colorPaletteId": "medical-clean",
    "buttonSystemId": "buttons-outline",
    "cardSystemId": "cards-bordered",
    "radiusId": "radius-sharp",
    "shadowId": "shadow-soft",
    "backgroundId": "background-gradient",
    "spacingId": "spacing-balanced",
    "sectionStyleId": "section-hero",
    "heroStyleId": "hero-left",
    "imageTreatmentId": "image-rounded",
    "iconStyleId": "icon-filled",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-luxury-editorial",
      "medical-clean",
      "buttons-outline",
      "cards-bordered"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Medical Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-medical-2",
    "name": "Medical Premium",
    "description": "Premium style pack for Medical industry",
    "industry": "medical",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "medical",
      "industry",
      "mega"
    ],
    "typographyId": "typography-premium-corporate",
    "colorPaletteId": "medical-teal",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-elevated",
    "radiusId": "radius-pill",
    "shadowId": "shadow-medium",
    "backgroundId": "background-dark",
    "spacingId": "spacing-airy",
    "sectionStyleId": "section-compact",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-premium-corporate",
      "medical-teal",
      "buttons-ghost",
      "cards-elevated"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Medical Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-medical-3",
    "name": "Medical Studio",
    "description": "Studio style pack for Medical industry",
    "industry": "medical",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "medical",
      "industry",
      "mega"
    ],
    "typographyId": "typography-medical-clean",
    "colorPaletteId": "medical-mint",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-soft",
    "radiusId": "radius-soft",
    "shadowId": "shadow-elevated",
    "backgroundId": "background-light",
    "spacingId": "spacing-luxury",
    "sectionStyleId": "section-airy",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-medical-clean",
      "medical-mint",
      "buttons-text",
      "cards-soft"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Medical Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-law-1",
    "name": "Law Firm Signature",
    "description": "Signature style pack for Law Firm industry",
    "industry": "law",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "law",
      "industry",
      "mega"
    ],
    "typographyId": "typography-premium-corporate",
    "colorPaletteId": "neutral-slate",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-elevated",
    "radiusId": "radius-pill",
    "shadowId": "shadow-medium",
    "backgroundId": "background-dark",
    "spacingId": "spacing-airy",
    "sectionStyleId": "section-compact",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-premium-corporate",
      "neutral-slate",
      "buttons-ghost",
      "cards-elevated"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Law Firm Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-law-2",
    "name": "Law Firm Premium",
    "description": "Premium style pack for Law Firm industry",
    "industry": "law",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "law",
      "industry",
      "mega"
    ],
    "typographyId": "typography-medical-clean",
    "colorPaletteId": "editorial-classic",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-soft",
    "radiusId": "radius-soft",
    "shadowId": "shadow-elevated",
    "backgroundId": "background-light",
    "spacingId": "spacing-luxury",
    "sectionStyleId": "section-airy",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-medical-clean",
      "editorial-classic",
      "buttons-text",
      "cards-soft"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Law Firm Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-law-3",
    "name": "Law Firm Studio",
    "description": "Studio style pack for Law Firm industry",
    "industry": "law",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "law",
      "industry",
      "mega"
    ],
    "typographyId": "typography-tech-modern",
    "colorPaletteId": "mono-charcoal",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-glass",
    "radiusId": "radius-circle",
    "shadowId": "shadow-dramatic",
    "backgroundId": "background-pattern",
    "spacingId": "spacing-tight",
    "sectionStyleId": "section-luxury",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-tech-modern",
      "mono-charcoal",
      "buttons-pill",
      "cards-glass"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Law Firm Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-realestate-1",
    "name": "Real Estate Signature",
    "description": "Signature style pack for Real Estate industry",
    "industry": "real-estate",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "real-estate",
      "industry",
      "mega"
    ],
    "typographyId": "typography-medical-clean",
    "colorPaletteId": "warm-sand",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-soft",
    "radiusId": "radius-soft",
    "shadowId": "shadow-elevated",
    "backgroundId": "background-light",
    "spacingId": "spacing-luxury",
    "sectionStyleId": "section-airy",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-medical-clean",
      "warm-sand",
      "buttons-text",
      "cards-soft"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Real Estate Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-realestate-2",
    "name": "Real Estate Premium",
    "description": "Premium style pack for Real Estate industry",
    "industry": "real-estate",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "real-estate",
      "industry",
      "mega"
    ],
    "typographyId": "typography-tech-modern",
    "colorPaletteId": "neutral-clay",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-glass",
    "radiusId": "radius-circle",
    "shadowId": "shadow-dramatic",
    "backgroundId": "background-pattern",
    "spacingId": "spacing-tight",
    "sectionStyleId": "section-luxury",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-tech-modern",
      "neutral-clay",
      "buttons-pill",
      "cards-glass"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Real Estate Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-realestate-3",
    "name": "Real Estate Studio",
    "description": "Studio style pack for Real Estate industry",
    "industry": "real-estate",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "real-estate",
      "industry",
      "mega"
    ],
    "typographyId": "typography-creative-studio",
    "colorPaletteId": "luxury-onyx",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-luxury",
    "radiusId": "radius-asymmetric",
    "shadowId": "shadow-luxury",
    "backgroundId": "background-image",
    "spacingId": "spacing-expansive",
    "sectionStyleId": "section-full-bleed",
    "heroStyleId": "hero-luxury",
    "imageTreatmentId": "image-blur",
    "iconStyleId": "icon-minimal",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-creative-studio",
      "luxury-onyx",
      "buttons-square",
      "cards-luxury"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Real Estate Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-restaurant-1",
    "name": "Restaurant Signature",
    "description": "Signature style pack for Restaurant industry",
    "industry": "restaurant",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "restaurant",
      "industry",
      "mega"
    ],
    "typographyId": "typography-tech-modern",
    "colorPaletteId": "restaurant-warm",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-glass",
    "radiusId": "radius-circle",
    "shadowId": "shadow-dramatic",
    "backgroundId": "background-pattern",
    "spacingId": "spacing-tight",
    "sectionStyleId": "section-luxury",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-tech-modern",
      "restaurant-warm",
      "buttons-pill",
      "cards-glass"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Restaurant Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-restaurant-2",
    "name": "Restaurant Premium",
    "description": "Premium style pack for Restaurant industry",
    "industry": "restaurant",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "restaurant",
      "industry",
      "mega"
    ],
    "typographyId": "typography-creative-studio",
    "colorPaletteId": "restaurant-sage",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-luxury",
    "radiusId": "radius-asymmetric",
    "shadowId": "shadow-luxury",
    "backgroundId": "background-image",
    "spacingId": "spacing-expansive",
    "sectionStyleId": "section-full-bleed",
    "heroStyleId": "hero-luxury",
    "imageTreatmentId": "image-blur",
    "iconStyleId": "icon-minimal",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-creative-studio",
      "restaurant-sage",
      "buttons-square",
      "cards-luxury"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Restaurant Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-restaurant-3",
    "name": "Restaurant Studio",
    "description": "Studio style pack for Restaurant industry",
    "industry": "restaurant",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "restaurant",
      "industry",
      "mega"
    ],
    "typographyId": "typography-fashion-editorial",
    "colorPaletteId": "restaurant-elegant",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-dark",
    "radiusId": "radius-hero",
    "shadowId": "shadow-glass",
    "backgroundId": "background-minimal",
    "spacingId": "spacing-editorial",
    "sectionStyleId": "section-editorial",
    "heroStyleId": "hero-dark",
    "imageTreatmentId": "image-grayscale",
    "iconStyleId": "icon-creative",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-fashion-editorial",
      "restaurant-elegant",
      "buttons-rounded",
      "cards-dark"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Restaurant Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-hotel-1",
    "name": "Hotel Signature",
    "description": "Signature style pack for Hotel industry",
    "industry": "hotel",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "hotel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-creative-studio",
    "colorPaletteId": "luxury-onyx",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-luxury",
    "radiusId": "radius-asymmetric",
    "shadowId": "shadow-luxury",
    "backgroundId": "background-image",
    "spacingId": "spacing-expansive",
    "sectionStyleId": "section-full-bleed",
    "heroStyleId": "hero-luxury",
    "imageTreatmentId": "image-blur",
    "iconStyleId": "icon-minimal",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-creative-studio",
      "luxury-onyx",
      "buttons-square",
      "cards-luxury"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Hotel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-hotel-2",
    "name": "Hotel Premium",
    "description": "Premium style pack for Hotel industry",
    "industry": "hotel",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "hotel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-fashion-editorial",
    "colorPaletteId": "hospitality-brass",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-dark",
    "radiusId": "radius-hero",
    "shadowId": "shadow-glass",
    "backgroundId": "background-minimal",
    "spacingId": "spacing-editorial",
    "sectionStyleId": "section-editorial",
    "heroStyleId": "hero-dark",
    "imageTreatmentId": "image-grayscale",
    "iconStyleId": "icon-creative",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-fashion-editorial",
      "hospitality-brass",
      "buttons-rounded",
      "cards-dark"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Hotel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-hotel-3",
    "name": "Hotel Studio",
    "description": "Studio style pack for Hotel industry",
    "industry": "hotel",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "hotel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-architectural",
    "colorPaletteId": "hospitality-elegant",
    "buttonSystemId": "buttons-minimal",
    "cardSystemId": "cards-gradient",
    "radiusId": "radius-minimal",
    "shadowId": "shadow-dark",
    "backgroundId": "background-luxury",
    "spacingId": "spacing-wellness",
    "sectionStyleId": "section-split",
    "heroStyleId": "hero-minimal",
    "imageTreatmentId": "image-vintage",
    "iconStyleId": "icon-editorial",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-architectural",
      "hospitality-elegant",
      "buttons-minimal",
      "cards-gradient"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Hotel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-architecture-1",
    "name": "Architecture Signature",
    "description": "Signature style pack for Architecture industry",
    "industry": "architecture",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "architecture",
      "industry",
      "mega"
    ],
    "typographyId": "typography-fashion-editorial",
    "colorPaletteId": "neutral-stone",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-dark",
    "radiusId": "radius-hero",
    "shadowId": "shadow-glass",
    "backgroundId": "background-minimal",
    "spacingId": "spacing-editorial",
    "sectionStyleId": "section-editorial",
    "heroStyleId": "hero-dark",
    "imageTreatmentId": "image-grayscale",
    "iconStyleId": "icon-creative",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-fashion-editorial",
      "neutral-stone",
      "buttons-rounded",
      "cards-dark"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Architecture Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-architecture-2",
    "name": "Architecture Premium",
    "description": "Premium style pack for Architecture industry",
    "industry": "architecture",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "architecture",
      "industry",
      "mega"
    ],
    "typographyId": "typography-architectural",
    "colorPaletteId": "mono-charcoal",
    "buttonSystemId": "buttons-minimal",
    "cardSystemId": "cards-gradient",
    "radiusId": "radius-minimal",
    "shadowId": "shadow-dark",
    "backgroundId": "background-luxury",
    "spacingId": "spacing-wellness",
    "sectionStyleId": "section-split",
    "heroStyleId": "hero-minimal",
    "imageTreatmentId": "image-vintage",
    "iconStyleId": "icon-editorial",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-architectural",
      "mono-charcoal",
      "buttons-minimal",
      "cards-gradient"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Architecture Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-architecture-3",
    "name": "Architecture Studio",
    "description": "Studio style pack for Architecture industry",
    "industry": "architecture",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "architecture",
      "industry",
      "mega"
    ],
    "typographyId": "typography-wellness",
    "colorPaletteId": "minimal-warm-grey",
    "buttonSystemId": "buttons-luxury",
    "cardSystemId": "cards-image",
    "radiusId": "radius-luxury",
    "shadowId": "shadow-neon",
    "backgroundId": "background-medical",
    "spacingId": "spacing-ecommerce",
    "sectionStyleId": "section-stacked",
    "heroStyleId": "hero-creative",
    "imageTreatmentId": "image-circular",
    "iconStyleId": "icon-tech",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-wellness",
      "minimal-warm-grey",
      "buttons-luxury",
      "cards-image"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Architecture Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-photography-1",
    "name": "Photography Signature",
    "description": "Signature style pack for Photography industry",
    "industry": "photography",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "photography",
      "industry",
      "mega"
    ],
    "typographyId": "typography-architectural",
    "colorPaletteId": "mono-black-white",
    "buttonSystemId": "buttons-minimal",
    "cardSystemId": "cards-gradient",
    "radiusId": "radius-minimal",
    "shadowId": "shadow-dark",
    "backgroundId": "background-luxury",
    "spacingId": "spacing-wellness",
    "sectionStyleId": "section-split",
    "heroStyleId": "hero-minimal",
    "imageTreatmentId": "image-vintage",
    "iconStyleId": "icon-editorial",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-architectural",
      "mono-black-white",
      "buttons-minimal",
      "cards-gradient"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Photography Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-photography-2",
    "name": "Photography Premium",
    "description": "Premium style pack for Photography industry",
    "industry": "photography",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "photography",
      "industry",
      "mega"
    ],
    "typographyId": "typography-wellness",
    "colorPaletteId": "minimal-white",
    "buttonSystemId": "buttons-luxury",
    "cardSystemId": "cards-image",
    "radiusId": "radius-luxury",
    "shadowId": "shadow-neon",
    "backgroundId": "background-medical",
    "spacingId": "spacing-ecommerce",
    "sectionStyleId": "section-stacked",
    "heroStyleId": "hero-creative",
    "imageTreatmentId": "image-circular",
    "iconStyleId": "icon-tech",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-wellness",
      "minimal-white",
      "buttons-luxury",
      "cards-image"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Photography Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-photography-3",
    "name": "Photography Studio",
    "description": "Studio style pack for Photography industry",
    "industry": "photography",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "photography",
      "industry",
      "mega"
    ],
    "typographyId": "typography-bold-marketing",
    "colorPaletteId": "minimal-dark",
    "buttonSystemId": "buttons-glass",
    "cardSystemId": "cards-portfolio",
    "radiusId": "radius-brutalist",
    "shadowId": "shadow-brutalist",
    "backgroundId": "background-creative",
    "spacingId": "spacing-dashboard",
    "sectionStyleId": "section-grid",
    "heroStyleId": "hero-editorial",
    "imageTreatmentId": "image-card",
    "iconStyleId": "icon-organic",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-bold-marketing",
      "minimal-dark",
      "buttons-glass",
      "cards-portfolio"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Photography Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-creativeagency-1",
    "name": "Creative Agency Signature",
    "description": "Signature style pack for Creative Agency industry",
    "industry": "creative-agency",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "creative-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-wellness",
    "colorPaletteId": "creative-vibrant",
    "buttonSystemId": "buttons-luxury",
    "cardSystemId": "cards-image",
    "radiusId": "radius-luxury",
    "shadowId": "shadow-neon",
    "backgroundId": "background-medical",
    "spacingId": "spacing-ecommerce",
    "sectionStyleId": "section-stacked",
    "heroStyleId": "hero-creative",
    "imageTreatmentId": "image-circular",
    "iconStyleId": "icon-tech",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-wellness",
      "creative-vibrant",
      "buttons-luxury",
      "cards-image"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Creative Agency Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-creativeagency-2",
    "name": "Creative Agency Premium",
    "description": "Premium style pack for Creative Agency industry",
    "industry": "creative-agency",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "creative-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-bold-marketing",
    "colorPaletteId": "creative-acid",
    "buttonSystemId": "buttons-glass",
    "cardSystemId": "cards-portfolio",
    "radiusId": "radius-brutalist",
    "shadowId": "shadow-brutalist",
    "backgroundId": "background-creative",
    "spacingId": "spacing-dashboard",
    "sectionStyleId": "section-grid",
    "heroStyleId": "hero-editorial",
    "imageTreatmentId": "image-card",
    "iconStyleId": "icon-organic",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-bold-marketing",
      "creative-acid",
      "buttons-glass",
      "cards-portfolio"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Creative Agency Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-creativeagency-3",
    "name": "Creative Agency Studio",
    "description": "Studio style pack for Creative Agency industry",
    "industry": "creative-agency",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "creative-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-dark-premium",
    "colorPaletteId": "bold-bright",
    "buttonSystemId": "buttons-gradient",
    "cardSystemId": "cards-editorial",
    "radiusId": "radius-organic",
    "shadowId": "shadow-soft-glow",
    "backgroundId": "background-tech",
    "spacingId": "spacing-hero",
    "sectionStyleId": "section-dark",
    "heroStyleId": "hero-tech",
    "imageTreatmentId": "image-hero",
    "iconStyleId": "icon-neon",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-dark-premium",
      "bold-bright",
      "buttons-gradient",
      "cards-editorial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Creative Agency Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-marketingagency-1",
    "name": "Marketing Signature",
    "description": "Signature style pack for Marketing industry",
    "industry": "marketing-agency",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "marketing-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-bold-marketing",
    "colorPaletteId": "tech-blue",
    "buttonSystemId": "buttons-glass",
    "cardSystemId": "cards-portfolio",
    "radiusId": "radius-brutalist",
    "shadowId": "shadow-brutalist",
    "backgroundId": "background-creative",
    "spacingId": "spacing-dashboard",
    "sectionStyleId": "section-grid",
    "heroStyleId": "hero-editorial",
    "imageTreatmentId": "image-card",
    "iconStyleId": "icon-organic",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-bold-marketing",
      "tech-blue",
      "buttons-glass",
      "cards-portfolio"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Marketing Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-marketingagency-2",
    "name": "Marketing Premium",
    "description": "Premium style pack for Marketing industry",
    "industry": "marketing-agency",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "marketing-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-dark-premium",
    "colorPaletteId": "creative-vibrant",
    "buttonSystemId": "buttons-gradient",
    "cardSystemId": "cards-editorial",
    "radiusId": "radius-organic",
    "shadowId": "shadow-soft-glow",
    "backgroundId": "background-tech",
    "spacingId": "spacing-hero",
    "sectionStyleId": "section-dark",
    "heroStyleId": "hero-tech",
    "imageTreatmentId": "image-hero",
    "iconStyleId": "icon-neon",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-dark-premium",
      "creative-vibrant",
      "buttons-gradient",
      "cards-editorial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Marketing Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-marketingagency-3",
    "name": "Marketing Studio",
    "description": "Studio style pack for Marketing industry",
    "industry": "marketing-agency",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "marketing-agency",
      "industry",
      "mega"
    ],
    "typographyId": "typography-soft-organic",
    "colorPaletteId": "sunset-orange",
    "buttonSystemId": "buttons-neon",
    "cardSystemId": "cards-magazine",
    "radiusId": "radius-tech",
    "shadowId": "shadow-inset",
    "backgroundId": "background-restaurant",
    "spacingId": "spacing-social",
    "sectionStyleId": "section-light",
    "heroStyleId": "hero-medical",
    "imageTreatmentId": "image-product",
    "iconStyleId": "icon-social",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-soft-organic",
      "sunset-orange",
      "buttons-neon",
      "cards-magazine"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Marketing Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-saas-1",
    "name": "SaaS Signature",
    "description": "Signature style pack for SaaS industry",
    "industry": "saas",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "saas",
      "industry",
      "mega"
    ],
    "typographyId": "typography-dark-premium",
    "colorPaletteId": "tech-blue",
    "buttonSystemId": "buttons-gradient",
    "cardSystemId": "cards-editorial",
    "radiusId": "radius-organic",
    "shadowId": "shadow-soft-glow",
    "backgroundId": "background-tech",
    "spacingId": "spacing-hero",
    "sectionStyleId": "section-dark",
    "heroStyleId": "hero-tech",
    "imageTreatmentId": "image-hero",
    "iconStyleId": "icon-neon",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-dark-premium",
      "tech-blue",
      "buttons-gradient",
      "cards-editorial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "SaaS Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-saas-2",
    "name": "SaaS Premium",
    "description": "Premium style pack for SaaS industry",
    "industry": "saas",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "saas",
      "industry",
      "mega"
    ],
    "typographyId": "typography-soft-organic",
    "colorPaletteId": "tech-slate-indigo",
    "buttonSystemId": "buttons-neon",
    "cardSystemId": "cards-magazine",
    "radiusId": "radius-tech",
    "shadowId": "shadow-inset",
    "backgroundId": "background-restaurant",
    "spacingId": "spacing-social",
    "sectionStyleId": "section-light",
    "heroStyleId": "hero-medical",
    "imageTreatmentId": "image-product",
    "iconStyleId": "icon-social",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-soft-organic",
      "tech-slate-indigo",
      "buttons-neon",
      "cards-magazine"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "SaaS Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-saas-3",
    "name": "SaaS Studio",
    "description": "Studio style pack for SaaS industry",
    "industry": "saas",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "saas",
      "industry",
      "mega"
    ],
    "typographyId": "typography-neo-futuristic",
    "colorPaletteId": "minimal-white",
    "buttonSystemId": "buttons-editorial",
    "cardSystemId": "cards-horizontal",
    "radiusId": "radius-editorial",
    "shadowId": "shadow-multiple",
    "backgroundId": "background-ocean",
    "spacingId": "spacing-education",
    "sectionStyleId": "section-gradient",
    "heroStyleId": "hero-restaurant",
    "imageTreatmentId": "image-portrait",
    "iconStyleId": "icon-ecommerce",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-neo-futuristic",
      "minimal-white",
      "buttons-editorial",
      "cards-horizontal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "SaaS Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-technology-1",
    "name": "Technology Signature",
    "description": "Signature style pack for Technology industry",
    "industry": "technology",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "technology",
      "industry",
      "mega"
    ],
    "typographyId": "typography-soft-organic",
    "colorPaletteId": "tech-dark",
    "buttonSystemId": "buttons-neon",
    "cardSystemId": "cards-magazine",
    "radiusId": "radius-tech",
    "shadowId": "shadow-inset",
    "backgroundId": "background-restaurant",
    "spacingId": "spacing-social",
    "sectionStyleId": "section-light",
    "heroStyleId": "hero-medical",
    "imageTreatmentId": "image-product",
    "iconStyleId": "icon-social",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-soft-organic",
      "tech-dark",
      "buttons-neon",
      "cards-magazine"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Technology Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-technology-2",
    "name": "Technology Premium",
    "description": "Premium style pack for Technology industry",
    "industry": "technology",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "technology",
      "industry",
      "mega"
    ],
    "typographyId": "typography-neo-futuristic",
    "colorPaletteId": "tech-neon",
    "buttonSystemId": "buttons-editorial",
    "cardSystemId": "cards-horizontal",
    "radiusId": "radius-editorial",
    "shadowId": "shadow-multiple",
    "backgroundId": "background-ocean",
    "spacingId": "spacing-education",
    "sectionStyleId": "section-gradient",
    "heroStyleId": "hero-restaurant",
    "imageTreatmentId": "image-portrait",
    "iconStyleId": "icon-ecommerce",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-neo-futuristic",
      "tech-neon",
      "buttons-editorial",
      "cards-horizontal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Technology Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-technology-3",
    "name": "Technology Studio",
    "description": "Studio style pack for Technology industry",
    "industry": "technology",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "technology",
      "industry",
      "mega"
    ],
    "typographyId": "typography-editorial-classic",
    "colorPaletteId": "tech-slate-indigo",
    "buttonSystemId": "buttons-solid",
    "cardSystemId": "cards-vertical",
    "radiusId": "radius-futuristic",
    "shadowId": "shadow-colored",
    "backgroundId": "background-forest",
    "spacingId": "spacing-finance",
    "sectionStyleId": "section-image",
    "heroStyleId": "hero-fitness",
    "imageTreatmentId": "image-landscape",
    "iconStyleId": "icon-luxury-gold",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-editorial-classic",
      "tech-slate-indigo",
      "buttons-solid",
      "cards-vertical"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Technology Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-construction-1",
    "name": "Construction Signature",
    "description": "Signature style pack for Construction industry",
    "industry": "construction",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "construction",
      "industry",
      "mega"
    ],
    "typographyId": "typography-neo-futuristic",
    "colorPaletteId": "urban-graphite-orange",
    "buttonSystemId": "buttons-editorial",
    "cardSystemId": "cards-horizontal",
    "radiusId": "radius-editorial",
    "shadowId": "shadow-multiple",
    "backgroundId": "background-ocean",
    "spacingId": "spacing-education",
    "sectionStyleId": "section-gradient",
    "heroStyleId": "hero-restaurant",
    "imageTreatmentId": "image-portrait",
    "iconStyleId": "icon-ecommerce",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-neo-futuristic",
      "urban-graphite-orange",
      "buttons-editorial",
      "cards-horizontal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Construction Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-construction-2",
    "name": "Construction Premium",
    "description": "Premium style pack for Construction industry",
    "industry": "construction",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "construction",
      "industry",
      "mega"
    ],
    "typographyId": "typography-editorial-classic",
    "colorPaletteId": "urban-industrial",
    "buttonSystemId": "buttons-solid",
    "cardSystemId": "cards-vertical",
    "radiusId": "radius-futuristic",
    "shadowId": "shadow-colored",
    "backgroundId": "background-forest",
    "spacingId": "spacing-finance",
    "sectionStyleId": "section-image",
    "heroStyleId": "hero-fitness",
    "imageTreatmentId": "image-landscape",
    "iconStyleId": "icon-luxury-gold",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-editorial-classic",
      "urban-industrial",
      "buttons-solid",
      "cards-vertical"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Construction Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-construction-3",
    "name": "Construction Studio",
    "description": "Studio style pack for Construction industry",
    "industry": "construction",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "construction",
      "industry",
      "mega"
    ],
    "typographyId": "typography-brutalist",
    "colorPaletteId": "high-contrast-black-yellow",
    "buttonSystemId": "buttons-outline",
    "cardSystemId": "cards-asymmetric",
    "radiusId": "radius-social",
    "shadowId": "shadow-subtle",
    "backgroundId": "background-sunset",
    "spacingId": "spacing-medical",
    "sectionStyleId": "section-feature",
    "heroStyleId": "hero-ecommerce",
    "imageTreatmentId": "image-modern",
    "iconStyleId": "icon-medical",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-brutalist",
      "high-contrast-black-yellow",
      "buttons-outline",
      "cards-asymmetric"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Construction Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-beauty-1",
    "name": "Beauty Signature",
    "description": "Signature style pack for Beauty industry",
    "industry": "beauty",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "beauty",
      "industry",
      "mega"
    ],
    "typographyId": "typography-editorial-classic",
    "colorPaletteId": "rose-quartz",
    "buttonSystemId": "buttons-solid",
    "cardSystemId": "cards-vertical",
    "radiusId": "radius-futuristic",
    "shadowId": "shadow-colored",
    "backgroundId": "background-forest",
    "spacingId": "spacing-finance",
    "sectionStyleId": "section-image",
    "heroStyleId": "hero-fitness",
    "imageTreatmentId": "image-landscape",
    "iconStyleId": "icon-luxury-gold",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-editorial-classic",
      "rose-quartz",
      "buttons-solid",
      "cards-vertical"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Beauty Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-beauty-2",
    "name": "Beauty Premium",
    "description": "Premium style pack for Beauty industry",
    "industry": "beauty",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "beauty",
      "industry",
      "mega"
    ],
    "typographyId": "typography-brutalist",
    "colorPaletteId": "pastel-dream",
    "buttonSystemId": "buttons-outline",
    "cardSystemId": "cards-asymmetric",
    "radiusId": "radius-social",
    "shadowId": "shadow-subtle",
    "backgroundId": "background-sunset",
    "spacingId": "spacing-medical",
    "sectionStyleId": "section-feature",
    "heroStyleId": "hero-ecommerce",
    "imageTreatmentId": "image-modern",
    "iconStyleId": "icon-medical",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-brutalist",
      "pastel-dream",
      "buttons-outline",
      "cards-asymmetric"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Beauty Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-beauty-3",
    "name": "Beauty Studio",
    "description": "Studio style pack for Beauty industry",
    "industry": "beauty",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "beauty",
      "industry",
      "mega"
    ],
    "typographyId": "typography-elegant-serif",
    "colorPaletteId": "fashion-rose",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-feature",
    "radiusId": "radius-ecommerce",
    "shadowId": "shadow-hover",
    "backgroundId": "background-rose",
    "spacingId": "spacing-creative",
    "sectionStyleId": "section-cta",
    "heroStyleId": "hero-centered",
    "imageTreatmentId": "image-natural",
    "iconStyleId": "icon-outline",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-elegant-serif",
      "fashion-rose",
      "buttons-ghost",
      "cards-feature"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Beauty Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fitness-1",
    "name": "Fitness Signature",
    "description": "Signature style pack for Fitness industry",
    "industry": "fitness",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "fitness",
      "industry",
      "mega"
    ],
    "typographyId": "typography-brutalist",
    "colorPaletteId": "bold-bright",
    "buttonSystemId": "buttons-outline",
    "cardSystemId": "cards-asymmetric",
    "radiusId": "radius-social",
    "shadowId": "shadow-subtle",
    "backgroundId": "background-sunset",
    "spacingId": "spacing-medical",
    "sectionStyleId": "section-feature",
    "heroStyleId": "hero-ecommerce",
    "imageTreatmentId": "image-modern",
    "iconStyleId": "icon-medical",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-brutalist",
      "bold-bright",
      "buttons-outline",
      "cards-asymmetric"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fitness Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fitness-2",
    "name": "Fitness Premium",
    "description": "Premium style pack for Fitness industry",
    "industry": "fitness",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "fitness",
      "industry",
      "mega"
    ],
    "typographyId": "typography-elegant-serif",
    "colorPaletteId": "tech-neon",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-feature",
    "radiusId": "radius-ecommerce",
    "shadowId": "shadow-hover",
    "backgroundId": "background-rose",
    "spacingId": "spacing-creative",
    "sectionStyleId": "section-cta",
    "heroStyleId": "hero-centered",
    "imageTreatmentId": "image-natural",
    "iconStyleId": "icon-outline",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-elegant-serif",
      "tech-neon",
      "buttons-ghost",
      "cards-feature"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fitness Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fitness-3",
    "name": "Fitness Studio",
    "description": "Studio style pack for Fitness industry",
    "industry": "fitness",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "fitness",
      "industry",
      "mega"
    ],
    "typographyId": "typography-friendly-rounded",
    "colorPaletteId": "urban-street",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-service",
    "radiusId": "radius-dashboard",
    "shadowId": "shadow-active",
    "backgroundId": "background-arctic",
    "spacingId": "spacing-restaurant",
    "sectionStyleId": "section-testimonial",
    "heroStyleId": "hero-left",
    "imageTreatmentId": "image-rounded",
    "iconStyleId": "icon-filled",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-friendly-rounded",
      "urban-street",
      "buttons-text",
      "cards-service"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fitness Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fashion-1",
    "name": "Fashion Signature",
    "description": "Signature style pack for Fashion industry",
    "industry": "fashion",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "fashion",
      "industry",
      "mega"
    ],
    "typographyId": "typography-elegant-serif",
    "colorPaletteId": "fashion-black-gold",
    "buttonSystemId": "buttons-ghost",
    "cardSystemId": "cards-feature",
    "radiusId": "radius-ecommerce",
    "shadowId": "shadow-hover",
    "backgroundId": "background-rose",
    "spacingId": "spacing-creative",
    "sectionStyleId": "section-cta",
    "heroStyleId": "hero-centered",
    "imageTreatmentId": "image-natural",
    "iconStyleId": "icon-outline",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-elegant-serif",
      "fashion-black-gold",
      "buttons-ghost",
      "cards-feature"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fashion Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fashion-2",
    "name": "Fashion Premium",
    "description": "Premium style pack for Fashion industry",
    "industry": "fashion",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "fashion",
      "industry",
      "mega"
    ],
    "typographyId": "typography-friendly-rounded",
    "colorPaletteId": "fashion-sand",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-service",
    "radiusId": "radius-dashboard",
    "shadowId": "shadow-active",
    "backgroundId": "background-arctic",
    "spacingId": "spacing-restaurant",
    "sectionStyleId": "section-testimonial",
    "heroStyleId": "hero-left",
    "imageTreatmentId": "image-rounded",
    "iconStyleId": "icon-filled",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-friendly-rounded",
      "fashion-sand",
      "buttons-text",
      "cards-service"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fashion Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-fashion-3",
    "name": "Fashion Studio",
    "description": "Studio style pack for Fashion industry",
    "industry": "fashion",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "fashion",
      "industry",
      "mega"
    ],
    "typographyId": "typography-technical-monospace",
    "colorPaletteId": "fashion-rose",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-testimonial",
    "radiusId": "radius-landing",
    "shadowId": "shadow-ambient",
    "backgroundId": "background-desert",
    "spacingId": "spacing-tech",
    "sectionStyleId": "section-pricing",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-technical-monospace",
      "fashion-rose",
      "buttons-pill",
      "cards-testimonial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Fashion Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-travel-1",
    "name": "Travel Signature",
    "description": "Signature style pack for Travel industry",
    "industry": "travel",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "travel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-friendly-rounded",
    "colorPaletteId": "ocean-deep",
    "buttonSystemId": "buttons-text",
    "cardSystemId": "cards-service",
    "radiusId": "radius-dashboard",
    "shadowId": "shadow-active",
    "backgroundId": "background-arctic",
    "spacingId": "spacing-restaurant",
    "sectionStyleId": "section-testimonial",
    "heroStyleId": "hero-left",
    "imageTreatmentId": "image-rounded",
    "iconStyleId": "icon-filled",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-friendly-rounded",
      "ocean-deep",
      "buttons-text",
      "cards-service"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Travel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-travel-2",
    "name": "Travel Premium",
    "description": "Premium style pack for Travel industry",
    "industry": "travel",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "travel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-technical-monospace",
    "colorPaletteId": "ocean-nordic",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-testimonial",
    "radiusId": "radius-landing",
    "shadowId": "shadow-ambient",
    "backgroundId": "background-desert",
    "spacingId": "spacing-tech",
    "sectionStyleId": "section-pricing",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-technical-monospace",
      "ocean-nordic",
      "buttons-pill",
      "cards-testimonial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Travel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-travel-3",
    "name": "Travel Studio",
    "description": "Studio style pack for Travel industry",
    "industry": "travel",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "travel",
      "industry",
      "mega"
    ],
    "typographyId": "typography-minimalist",
    "colorPaletteId": "sunset-warm",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-product",
    "radiusId": "radius-artistic",
    "shadowId": "shadow-neumorphic",
    "backgroundId": "background-urban",
    "spacingId": "spacing-minimal",
    "sectionStyleId": "section-team",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-minimalist",
      "sunset-warm",
      "buttons-square",
      "cards-product"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Travel Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-finance-1",
    "name": "Finance Signature",
    "description": "Signature style pack for Finance industry",
    "industry": "finance",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "finance",
      "industry",
      "mega"
    ],
    "typographyId": "typography-technical-monospace",
    "colorPaletteId": "neutral-slate",
    "buttonSystemId": "buttons-pill",
    "cardSystemId": "cards-testimonial",
    "radiusId": "radius-landing",
    "shadowId": "shadow-ambient",
    "backgroundId": "background-desert",
    "spacingId": "spacing-tech",
    "sectionStyleId": "section-pricing",
    "heroStyleId": "hero-right",
    "imageTreatmentId": "image-full-bleed",
    "iconStyleId": "icon-duotone",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-technical-monospace",
      "neutral-slate",
      "buttons-pill",
      "cards-testimonial"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Finance Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-finance-2",
    "name": "Finance Premium",
    "description": "Premium style pack for Finance industry",
    "industry": "finance",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "finance",
      "industry",
      "mega"
    ],
    "typographyId": "typography-minimalist",
    "colorPaletteId": "tech-slate-indigo",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-product",
    "radiusId": "radius-artistic",
    "shadowId": "shadow-neumorphic",
    "backgroundId": "background-urban",
    "spacingId": "spacing-minimal",
    "sectionStyleId": "section-team",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-minimalist",
      "tech-slate-indigo",
      "buttons-square",
      "cards-product"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Finance Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-finance-3",
    "name": "Finance Studio",
    "description": "Studio style pack for Finance industry",
    "industry": "finance",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "finance",
      "industry",
      "mega"
    ],
    "typographyId": "typography-high-contrast",
    "colorPaletteId": "cool-steel",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-pricing",
    "radiusId": "radius-medical",
    "shadowId": "shadow-none",
    "backgroundId": "background-vintage",
    "spacingId": "spacing-fitness",
    "sectionStyleId": "section-contact",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-high-contrast",
      "cool-steel",
      "buttons-rounded",
      "cards-pricing"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Finance Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-education-1",
    "name": "Education Signature",
    "description": "Signature style pack for Education industry",
    "industry": "education",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "education",
      "industry",
      "mega"
    ],
    "typographyId": "typography-minimalist",
    "colorPaletteId": "tech-slate-indigo",
    "buttonSystemId": "buttons-square",
    "cardSystemId": "cards-product",
    "radiusId": "radius-artistic",
    "shadowId": "shadow-neumorphic",
    "backgroundId": "background-urban",
    "spacingId": "spacing-minimal",
    "sectionStyleId": "section-team",
    "heroStyleId": "hero-full-bleed",
    "imageTreatmentId": "image-framed",
    "iconStyleId": "icon-luxury",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-minimalist",
      "tech-slate-indigo",
      "buttons-square",
      "cards-product"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Education Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-education-2",
    "name": "Education Premium",
    "description": "Premium style pack for Education industry",
    "industry": "education",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "education",
      "industry",
      "mega"
    ],
    "typographyId": "typography-high-contrast",
    "colorPaletteId": "medical-clean",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-pricing",
    "radiusId": "radius-medical",
    "shadowId": "shadow-none",
    "backgroundId": "background-vintage",
    "spacingId": "spacing-fitness",
    "sectionStyleId": "section-contact",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-high-contrast",
      "medical-clean",
      "buttons-rounded",
      "cards-pricing"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Education Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-education-3",
    "name": "Education Studio",
    "description": "Studio style pack for Education industry",
    "industry": "education",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "education",
      "industry",
      "mega"
    ],
    "typographyId": "typography-pastel-dream",
    "colorPaletteId": "pastel-mint",
    "buttonSystemId": "buttons-minimal",
    "cardSystemId": "cards-minimal",
    "radiusId": "radius-rounded",
    "shadowId": "shadow-soft",
    "backgroundId": "background-solid",
    "spacingId": "spacing-compact",
    "sectionStyleId": "section-clean",
    "heroStyleId": "hero-luxury",
    "imageTreatmentId": "image-blur",
    "iconStyleId": "icon-minimal",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-pastel-dream",
      "pastel-mint",
      "buttons-minimal",
      "cards-minimal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Education Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-localservices-1",
    "name": "Local Services Signature",
    "description": "Signature style pack for Local Services industry",
    "industry": "local-services",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Signature",
    "tags": [
      "local-services",
      "industry",
      "mega"
    ],
    "typographyId": "typography-high-contrast",
    "colorPaletteId": "neutral-stone",
    "buttonSystemId": "buttons-rounded",
    "cardSystemId": "cards-pricing",
    "radiusId": "radius-medical",
    "shadowId": "shadow-none",
    "backgroundId": "background-vintage",
    "spacingId": "spacing-fitness",
    "sectionStyleId": "section-contact",
    "heroStyleId": "hero-dashboard",
    "imageTreatmentId": "image-overlay",
    "iconStyleId": "icon-brutalist",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-high-contrast",
      "neutral-stone",
      "buttons-rounded",
      "cards-pricing"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Local Services Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-localservices-2",
    "name": "Local Services Premium",
    "description": "Premium style pack for Local Services industry",
    "industry": "local-services",
    "mood": [
      "professional",
      "modern",
      "trusted"
    ],
    "style": "Premium",
    "tags": [
      "local-services",
      "industry",
      "mega"
    ],
    "typographyId": "typography-pastel-dream",
    "colorPaletteId": "warm-sand",
    "buttonSystemId": "buttons-minimal",
    "cardSystemId": "cards-minimal",
    "radiusId": "radius-rounded",
    "shadowId": "shadow-soft",
    "backgroundId": "background-solid",
    "spacingId": "spacing-compact",
    "sectionStyleId": "section-clean",
    "heroStyleId": "hero-luxury",
    "imageTreatmentId": "image-blur",
    "iconStyleId": "icon-minimal",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-pastel-dream",
      "warm-sand",
      "buttons-minimal",
      "cards-minimal"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Local Services Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  },
  {
    "id": "sp-localservices-3",
    "name": "Local Services Studio",
    "description": "Studio style pack for Local Services industry",
    "industry": "local-services",
    "mood": [
      "professional",
      "modern"
    ],
    "style": "Studio",
    "tags": [
      "local-services",
      "industry",
      "mega"
    ],
    "typographyId": "typography-ocean-clean",
    "colorPaletteId": "medical-clean",
    "buttonSystemId": "buttons-luxury",
    "cardSystemId": "cards-bordered",
    "radiusId": "radius-sharp",
    "shadowId": "shadow-medium",
    "backgroundId": "background-gradient",
    "spacingId": "spacing-balanced",
    "sectionStyleId": "section-hero",
    "heroStyleId": "hero-dark",
    "imageTreatmentId": "image-grayscale",
    "iconStyleId": "icon-creative",
    "effectId": "effect-none",
    "compatibleWith": [
      "typography-ocean-clean",
      "medical-clean",
      "buttons-luxury",
      "cards-bordered"
    ],
    "notRecommendedWith": [],
    "preview": {
      "h1": "Local Services Heading",
      "h2": "Subheading",
      "body": "Sample body",
      "button": "CTA",
      "card": "Card",
      "background": "#FFFFFF"
    },
    "version": "1.0.0",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "metadata": {}
  }];

export const fullStylePacks: StylePack[] = stylePacks;

export const getStylePack = (id: string): StylePack | undefined =>
  stylePacks.find((p) => p.id === id);

export const getStylePacksByIndustry = (industry: string): StylePack[] =>
  stylePacks.filter((p) => p.industry === industry);

export const getStylePacksByMood = (mood: string): StylePack[] =>
  stylePacks.filter((p) => p.mood.includes(mood));

export const searchStylePacks = (query: string): StylePack[] => {
  const q = query.toLowerCase();
  return stylePacks.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.industry.toLowerCase().includes(q) ||
      p.mood.some((m) => m.toLowerCase().includes(q))
  );
};

export default stylePacks;
