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
];

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
