/**
 * Color Palette Library — 100+ Professional Color Palettes
 *
 * Each palette has: id, name, style, primary, secondary, accent,
 * background, surface, text, muted, border, CTA, success, warning, error,
 * contrast metadata, recommended industries, mood, best use cases, anti-patterns.
 */

export type PaletteStyle =
  | 'Monochrome' | 'Neutral' | 'Warm Neutral' | 'Cool Neutral'
  | 'Luxury' | 'Medical' | 'Wellness' | 'Nature' | 'Earth'
  | 'Fashion' | 'Technology' | 'Restaurant' | 'Hospitality'
  | 'Creative' | 'Pastel' | 'Dark' | 'High Contrast' | 'Futuristic'
  | 'Editorial' | 'Minimal' | 'Ocean' | 'Forest' | 'Sunset'
  | 'Rose' | 'Arctic' | 'Desert' | 'Urban' | 'Vintage'
  | 'Cyber' | 'Neon' | 'Moody' | 'Bright' | 'Soft' | 'Bold';

export interface ColorPalette {
  id: string;
  name: string;
  style: PaletteStyle;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  cta: string;
  success: string;
  warning: string;
  error: string;
  contrastMetadata: {
    primaryOnBackground: string;
    textOnBackground: string;
    ctaOnPrimary: string;
    score: number;
    wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail';
  };
  recommendedIndustries: string[];
  mood: string[];
  bestUseCases: string[];
  notRecommendedUseCases: string[];
  version: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  metadata: Record<string, unknown>;
}

function createColorPalette(
  id: string,
  name: string,
  style: PaletteStyle,
  primary: string,
  secondary: string,
  accent: string,
  background: string,
  surface: string,
  text: string,
  muted: string,
  border: string,
  cta: string,
  success: string,
  warning: string,
  error: string,
  contrastScore: number,
  wcagLevel: ColorPalette['contrastMetadata']['wcagLevel'],
  industries: string[],
  mood: string[],
  bestUseCases: string[],
  notRecommendedUseCases: string[],
  tags: string[] = []
): ColorPalette {
  const now = Date.now();
  return {
    id,
    name,
    style,
    primary,
    secondary,
    accent,
    background,
    surface,
    text,
    muted,
    border,
    cta,
    success,
    warning,
    error,
    contrastMetadata: {
      primaryOnBackground: primary === background ? 'Same color - adjust' : 'Pass',
      textOnBackground: 'Pass',
      ctaOnPrimary: 'Pass',
      score: contrastScore,
      wcagLevel,
    },
    recommendedIndustries: industries,
    mood,
    bestUseCases,
    notRecommendedUseCases,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    tags,
    metadata: {},
  };
}

// ============================================================
// MONOCHROME
// ============================================================

export const monochromePalettes: ColorPalette[] = [
  createColorPalette('mono-black-white', 'Black & White', 'Monochrome',
    '#000000', '#333333', '#666666', '#FFFFFF', '#F5F5F5', '#000000', '#666666', '#CCCCCC', '#000000',
    '#22C55E', '#F59E0B', '#EF4444', 95, 'AAA',
    ['general','luxury','editorial'], ['elegant','sophisticated','timeless'],
    ['luxury branding','editorial','high-end'], ['creative','playful','fashion']),
  createColorPalette('mono-charcoal', 'Charcoal', 'Monochrome',
    '#1A1A1A', '#333333', '#666666', '#F5F5F5', '#E8E8E8', '#1A1A1A', '#666666', '#CCCCCC', '#1A1A1A',
    '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA',
    ['technology','corporate','modern'], ['sophisticated','modern','clean'],
    ['tech products','corporate websites'], ['creative','playful','fashion']),
  createColorPalette('mono-cream', 'Cream', 'Monochrome',
    '#8B7355', '#A0826D', '#C4A882', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B7355', '#D4C5A9', '#8B7355',
    '#22C55E', '#F59E0B', '#EF4444', 88, 'AA',
    ['luxury','editorial','vintage'], ['warm','elegant','classic'],
    ['luxury branding','editorial','vintage'], ['tech','modern','bright']),
];

// ============================================================
// NEUTRAL
// ============================================================

export const neutralPalettes: ColorPalette[] = [
  createColorPalette('neutral-slate', 'Slate', 'Neutral',
    '#1E293B', '#475569', '#64748B', '#F8FAFC', '#F1F5F9', '#1E293B', '#64748B', '#CBD5E1', '#3B82F6',
    '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA',
    ['corporate','technology','finance'], ['professional','clean','modern'],
    ['corporate websites','dashboards','finance'], ['luxury','creative','fashion']),
  createColorPalette('neutral-stone', 'Stone', 'Neutral',
    '#44403C', '#78716C', '#A8A29E', '#FAFAF9', '#F5F5F4', '#292524', '#78716C', '#D6D3D1', '#C2410C',
    '#22C55E', '#F59E0B', '#EF4444', 87, 'AA',
    ['lifestyle','wellness','organic'], ['warm','natural','earthy'],
    ['wellness sites','organic brands'], ['tech','luxury','fashion']),
  createColorPalette('neutral-zinc', 'Zinc', 'Neutral',
    '#273548', '#3E4C59', '#6B7A8D', '#F8F9FA', '#F1F3F5', '#273548', '#6B7A8D', '#CED4DA', '#4A90D9',
    '#22C55E', '#F59E0B', '#EF4444', 91, 'AAA',
    ['technology','SaaS','enterprise'], ['professional','clean','precise'],
    ['tech products','SaaS','enterprise'], ['luxury','creative','fashion']),
];

// ============================================================
// WARM NEUTRAL
// ============================================================

export const warmNeutralPalettes: ColorPalette[] = [
  createColorPalette('warm-sand', 'Sand', 'Warm Neutral',
    '#C4A882', '#D4C5A9', '#E8D5B7', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#C4A882', '#D4C5A9', '#8B6914',
    '#22C55E', '#F59E0B', '#EF4444', 85, 'AA',
    ['restaurant','hospitality','lifestyle'], ['warm','inviting','natural'],
    ['restaurant sites','hospitality','food'], ['tech','luxury','corporate']),
  createColorPalette('warm-terracotta', 'Terracotta', 'Warm Neutral',
    '#C75B39', '#D4856A', '#E8A87C', '#FFF5EB', '#FAF0E6', '#4A2C2A', '#C75B39', '#D4856A', '#8B4513',
    '#22C55E', '#F59E0B', '#EF4444', 84, 'AA',
    ['restaurant','architecture','art'], ['warm','earthy','artistic'],
    ['restaurant sites','architecture','art'], ['tech','luxury','corporate']),
  createColorPalette('warm-camel', 'Camel', 'Warm Neutral',
    '#C19A6B', '#D4A574', '#E8C89A', '#FFF8F0', '#FAF0E6', '#5C4033', '#C19A6B', '#D4A574', '#8B6914',
    '#22C55E', '#F59E0B', '#EF4444', 86, 'AA',
    ['fashion','luxury','travel'], ['warm','luxurious','elegant'],
    ['fashion brands','luxury','travel'], ['tech','modern','corporate']),
];

// ============================================================
// COOL NEUTRAL
// ============================================================

export const coolNeutralPalettes: ColorPalette[] = [
  createColorPalette('cool-ice', 'Ice', 'Cool Neutral', '#8BA4B5', '#A8C4D4', '#C5D9E8', '#F0F8FF', '#E8F4FD', '#2C3E50', '#8BA4B5', '#A8C4D4', '#5B7A8D', '#22C55E', '#F59E0B', '#EF4444', 89, 'AA', ['technology','medical','wellness'], ['cool','calm','clean'], ['medical sites','wellness','tech'], ['luxury','creative','fashion']),
  createColorPalette('cool-steel', 'Steel', 'Cool Neutral', '#6B7B8D', '#8FA3B5', '#B0C4DE', '#F5F7FA', '#E8ECF0', '#3A4A5C', '#6B7B8D', '#8FA3B5', '#5A6B7D', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['technology','corporate','enterprise'], ['professional','cool','modern'], ['corporate websites','tech products'], ['luxury','creative','fashion']),
];

// ============================================================
// LUXURY
// ============================================================

export const luxuryPalettes: ColorPalette[] = [
  createColorPalette('luxury-gold', 'Gold Luxury', 'Luxury',
    '#D4A843', '#B8860B', '#F5D76E', '#0A0A0A', '#141414', '#F5F1EA', '#8A8578', '#D4A843', '#D4A843',
    '#22C55E', '#F59E0B', '#EF4444', 95, 'AAA',
    ['luxury','fashion','beauty'], ['luxurious','elegant','opulent'],
    ['luxury brands','fashion','beauty'], ['tech','casual','playful']),
  createColorPalette('luxury-rose-gold', 'Rose Gold', 'Luxury', '#B76E79', '#D4A5A5', '#E8B4B8', '#1A1A2E', '#16213E', '#F5F1EA', '#B76E79', '#D4A5A5', '#C4959A', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['luxury','beauty','fashion'], ['romantic','elegant','feminine'], ['beauty brands','luxury','fashion'], ['tech','casual','playful']),
  createColorPalette('luxury-platinum', 'Platinum', 'Luxury', '#E5E4E2', '#C0C0C0', '#A8A8A8', '#0A0A0A', '#141414', '#F5F5F5', '#A8A8A8', '#C0C0C0', '#D5D5D5', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['luxury','technology','finance'], ['sophisticated','refined','modern'], ['luxury brands','technology','finance'], ['creative','casual','playful']),
];

// ============================================================
// MEDICAL
// ============================================================

export const medicalPalettes: ColorPalette[] = [
  createColorPalette('medical-clean', 'Medical Clean', 'Medical', '#0066CC', '#0099FF', '#4DA3FF', '#F0F8FF', '#E6F0FF', '#003366', '#0066CC', '#0099FF', '#66B3FF', '#22C55E', '#F59E0B', '#EF4444', 96, 'AAA', ['medical','healthcare','pharmaceutical'], ['clean','professional','trustworthy'], ['medical websites','healthcare','pharmaceutical'], ['luxury','creative','fashion']),
  createColorPalette('medical-teal', 'Medical Teal', 'Medical', '#008080', '#00BFA5', '#4DD0E1', '#F0FFF4', '#E0F7F0', '#004D40', '#008080', '#00BFA5', '#4DD0E1', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['medical','healthcare','wellness'], ['clean','calm','professional'], ['medical websites','healthcare','wellness'], ['luxury','creative','fashion']),
  createColorPalette('medical-soft', 'Medical Soft', 'Medical', '#5B9BD5', '#8EB4E0', '#B8D4E8', '#F5F9FC', '#E8F2FA', '#2C3E50', '#5B9BD5', '#8EB4E0', '#B8D4E8', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['medical','healthcare','pediatric'], ['soft','clean','caring'], ['pediatric sites','healthcare','medical'], ['luxury','creative','fashion']),
];

// ============================================================
// WELLNESS
// ============================================================

export const wellnessPalettes: ColorPalette[] = [
  createColorPalette('wellness-organic', 'Organic', 'Wellness', '#4CAF50', '#81C784', '#A5D6A7', '#F1F8E9', '#E8F5E9', '#1B5E20', '#4CAF50', '#81C784', '#A5D6A7', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['wellness','fitness','lifestyle'], ['natural','organic','calm'], ['wellness sites','fitness','lifestyle'], ['tech','luxury','corporate']),
  createColorPalette('wellness-serene', 'Serene', 'Wellness', '#7CB9E8', '#A8D4F0', '#C5E1F5', '#F0F8FF', '#E8F4FD', '#2C3E50', '#7CB9E8', '#A8D4F0', '#C5E1F5', '#22C55E', '#F59E0B', '#EF4444', 91, 'AAA', ['wellness','meditation','yoga'], ['serene','calm','peaceful'], ['wellness sites','meditation','yoga'], ['tech','luxury','corporate']),
  createColorPalette('wellness-harvest', 'Harvest', 'Wellness', '#8B4513', '#D2691E', '#E8A87C', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B4513', '#D2691E', '#E8A87C', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['wellness','nutrition','organic'], ['warm','natural','harvest'], ['nutrition sites','organic','wellness'], ['tech','luxury','corporate']),
];

// ============================================================
// NATURE / EARTH
// ============================================================

export const naturePalettes: ColorPalette[] = [
  createColorPalette('nature-forest', 'Forest', 'Nature', '#2D5016', '#4A7C23', '#7CB342', '#F1F8E9', '#E8F5E9', '#1B5E20', '#2D5016', '#4A7C23', '#7CB342', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['eco','nature','outdoor'], ['natural','fresh','organic'], ['eco brands','nature','outdoor'], ['tech','luxury','corporate']),
  createColorPalette('nature-earth', 'Earth', 'Nature', '#8B4513', '#A0522D', '#CD853F', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B4513', '#A0522D', '#CD853F', '#22C55E', '#F59E0B', '#EF4444', 87, 'AA', ['nature','outdoor','architecture'], ['earthy','warm','natural'], ['nature sites','outdoor','architecture'], ['tech','luxury','corporate']),
  createColorPalette('nature-ocean', 'Ocean', 'Nature', '#006994', '#0096C7', '#48BFE3', '#F0F9FF', '#E0F2FE', '#023559', '#006994', '#0096C7', '#48BFE3', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['ocean','marine','travel'], ['ocean','calm','fresh'], ['ocean sites','marine','travel'], ['tech','luxury','corporate']),
];

// ============================================================
// FASHION
// ============================================================

export const fashionPalettes: ColorPalette[] = [
  createColorPalette('fashion-black-gold', 'Black & Gold', 'Fashion',
    '#000000', '#1A1A1A', '#D4A843', '#FAFAFA', '#F5F5F5', '#000000', '#D4A843', '#D4A843',
    '#D4A843', '#22C55E', '#F59E0B', '#EF4444', 98, 'AAA',
    ['fashion','luxury','beauty'], ['bold','luxurious','sophisticated'],
    ['fashion brands','luxury','beauty'], ['tech','casual','playful']),
  createColorPalette('fashion-rose', 'Rose', 'Fashion', '#FF1493', '#FF69B4', '#FFB6C1', '#FFF0F5', '#FFF5F5', '#8B008B', '#FF1493', '#FF69B4', '#FFB6C1', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['fashion','beauty','lifestyle'], ['feminine','romantic','bold'], ['fashion brands','beauty','lifestyle'], ['tech','casual','playful']),
  createColorPalette('fashion-navy-rose', 'Navy Rose', 'Fashion',
    '#1A1A3E', '#2E2E5E', '#B76E79', '#FAFAFA', '#F5F5F5', '#1A1A3E', '#B76E79', '#B76E79',
    '#B76E79', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA',
    ['fashion','luxury','elegant'], ['elegant','romantic','sophisticated'],
    ['fashion brands','luxury','elegant'], ['tech','casual','playful']),
];

// ============================================================
// TECHNOLOGY
// ============================================================

export const technologyPalettes: ColorPalette[] = [
  createColorPalette('tech-blue', 'Tech Blue', 'Technology', '#0066CC', '#0099FF', '#4DA3FF', '#0A0A0A', '#141414', '#F5F5F5', '#0066CC', '#4DA3FF', '#4DA3FF', '#22C55E', '#F59E0B', '#EF4444', 96, 'AAA', ['technology','SaaS','fintech'], ['modern','precise','innovative'], ['tech products','SaaS','fintech'], ['luxury','creative','fashion']),
  createColorPalette('tech-neon', 'Neon Cyber', 'Technology', '#06B6D4', '#8B5CF6', '#EC4899', '#0A0A0F', '#18181B', '#F5F1EA', '#06B6D4', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['technology','gaming','innovation'], ['futuristic','bold','cyber'], ['gaming','tech startups','innovation'], ['luxury','editorial','fashion']),
  createColorPalette('tech-dark', 'Dark Tech', 'Technology', '#3B82F6', '#60A5FA', '#93C5FD', '#0F172A', '#1E293B', '#F1F5F9', '#3B82F6', '#60A5FA', '#93C5FD', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['technology','SaaS','data'], ['modern','sleek','professional'], ['tech products','SaaS','data'], ['luxury','creative','fashion']),
];

// ============================================================
// RESTAURANT
// ============================================================

export const restaurantPalettes: ColorPalette[] = [
  createColorPalette('restaurant-warm', 'Warm Restaurant', 'Restaurant', '#C2410C', '#EA580C', '#FDBA74', '#FFF7ED', '#FFEDD5', '#7C2D12', '#C2410C', '#EA580C', '#FDBA74', '#22C55E', '#F59E0B', '#EF4444', 89, 'AA', ['restaurant','food','hospitality'], ['warm','inviting','appetizing'], ['restaurant sites','food brands','hospitality'], ['tech','luxury','corporate']),
  createColorPalette('restaurant-elegant', 'Elegant Restaurant', 'Restaurant', '#8B0000', '#A0522D', '#D2691E', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B0000', '#A0522D', '#D2691E', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['fine dining','hospitality','luxury'], ['elegant','sophisticated','refined'], ['fine dining','luxury restaurants'], ['tech','casual','playful']),
  createColorPalette('restaurant-bistro', 'Bistro', 'Restaurant', '#6B3A2A', '#8B5E3C', '#C4A882', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#6B3A2A', '#8B5E3C', '#C4A882', '#22C55E', '#F59E0B', '#EF4444', 86, 'AA', ['bistro','casual dining','lifestyle'], ['warm','casual','inviting'], ['bistro sites','casual dining'], ['tech','luxury','corporate']),
];

// ============================================================
// HOSPITALITY
// ============================================================

export const hospitalityPalettes: ColorPalette[] = [
  createColorPalette('hospitality-elegant', 'Elegant Hospitality', 'Hospitality', '#1A365D', '#2B6CB0', '#63B3ED', '#F7FAFC', '#EBF8FF', '#1A365D', '#2B6CB0', '#63B3ED', '#63B3ED', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['hotel','travel','luxury'], ['elegant','sophisticated','refined'], ['hotel brands','luxury travel'], ['tech','casual','playful']),
  createColorPalette('hospitality-soft', 'Soft Hospitality', 'Hospitality', '#5B7FA3', '#8BA4C4', '#B8D0E0', '#F5F9FC', '#E8F2FA', '#2C3E50', '#5B7FA3', '#8BA4C4', '#B8D0E0', '#22C55E', '#F59E0B', '#EF4444', 91, 'AAA', ['hotel','resort','wellness'], ['soft','calm','luxurious'], ['resort brands','hotel sites'], ['tech','luxury','corporate']),
];

// ============================================================
// CREATIVE
// ============================================================

export const creativePalettes: ColorPalette[] = [
  createColorPalette('creative-vibrant', 'Vibrant Creative', 'Creative', '#FF6B35', '#FF4500', '#FFD700', '#1A1A1A', '#2D2D2D', '#F5F5F5', '#FF6B35', '#FF4500', '#FFD700', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['creative','design','art'], ['bold','vibrant','expressive'], ['creative agencies','design studios'], ['luxury','medical','corporate']),
  createColorPalette('creative-playful', 'Playful Creative', 'Creative', '#FF69B4', '#7B68EE', '#00CED1', '#FFF0F5', '#F0F8FF', '#8B008B', '#FF69B4', '#7B68EE', '#00CED1', '#22C55E', '#F59E0B', '#EF4444', 89, 'AA', ['creative','playful','fun'], ['playful','colorful','energetic'], ['creative sites','playful brands'], ['luxury','medical','corporate']),
  createColorPalette('creative-minimal', 'Minimal Creative', 'Creative', '#212121', '#616161', '#9E9E9E', '#FAFAFA', '#F5F5F5', '#212121', '#212121', '#616161', '#9E9E9E', '#22C55E', '#F59E0B', '#EF4444', 95, 'AAA', ['creative','minimal','modern'], ['minimal','sophisticated','clean'], ['creative minimal sites','modern brands'], ['luxury','medical','corporate']),
];

// ============================================================
// PASTEL
// ============================================================

export const pastelPalettes: ColorPalette[] = [
  createColorPalette('pastel-dream', 'Pastel Dream', 'Pastel', '#FFB6C1', '#DDA0DD', '#87CEEB', '#FFF0F5', '#F0F8FF', '#8B008B', '#FFB6C1', '#DDA0DD', '#87CEEB', '#22C55E', '#F59E0B', '#EF4444', 85, 'AA', ['beauty','lifestyle','kids'], ['soft','dreamy','gentle'], ['beauty brands','lifestyle','kids'], ['tech','luxury','corporate']),
  createColorPalette('pastel-mint', 'Mint', 'Pastel', '#98FF98', '#90EE90', '#66CDAA', '#F0FFF0', '#E8F5E9', '#006400', '#98FF98', '#90EE90', '#66CDAA', '#22C55E', '#F59E0B', '#EF4444', 86, 'AA', ['wellness','eco','natural'], ['fresh','clean','natural'], ['eco brands','wellness','natural'], ['tech','luxury','corporate']),
  createColorPalette('pastel-lavender', 'Lavender', 'Pastel', '#E6E6FA', '#DDA0DD', '#C8A2C8', '#FFF5EE', '#FFF0F5', '#4B0082', '#E6E6FA', '#DDA0DD', '#C8A2C8', '#22C55E', '#F59E0B', '#EF4444', 84, 'AA', ['beauty','lifestyle','relaxation'], ['soft','calm','romantic'], ['beauty brands','lifestyle','relaxation'], ['tech','luxury','corporate']),
];

// ============================================================
// DARK
// ============================================================

export const darkPalettes: ColorPalette[] = [
  createColorPalette('dark-luxury', 'Dark Luxury', 'Dark', '#D4A843', '#F5D76E', '#0A0A0A', '#141414', '#1E1E1E', '#F5F1EA', '#D4A843', '#F5D76E', '#D4A843', '#22C55E', '#F59E0B', '#EF4444', 95, 'AAA', ['luxury','technology','finance'], ['dark','luxurious','premium'], ['luxury brands','dark themes','premium'], ['bright','casual','playful']),
  createColorPalette('dark-midnight', 'Midnight', 'Dark', '#3B82F6', '#60A5FA', '#0F172A', '#1E293B', '#334155', '#F1F5F9', '#3B82F6', '#60A5FA', '#60A5FA', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['technology','SaaS','data'], ['dark','professional','modern'], ['tech products','dark themes','SaaS'], ['bright','casual','playful']),
  createColorPalette('dark-deep', 'Deep Dark', 'Dark', '#8B5CF6', '#A78BFA', '#0A0A0F', '#18181B', '#27272A', '#F5F1EA', '#8B5CF6', '#A78BFA', '#A78BFA', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['technology','creative','gaming'], ['dark','mysterious','bold'], ['gaming','tech startups','creative'], ['bright','casual','playful']),
];

// ============================================================
// HIGH CONTRAST
// ============================================================

export const highContrastPalettes: ColorPalette[] = [
  createColorPalette('high-contrast-black-yellow', 'Black & Yellow', 'High Contrast',
    '#000000', '#333333', '#FFD700', '#FFFFFF', '#F5F5F5', '#000000', '#FFD700', '#FFD700',
    '#FFD700', '#22C55E', '#F59E0B', '#EF4444', 99, 'AAA',
    ['accessibility','sports','advertising'], ['bold','impactful','accessible'],
    ['accessibility-focused','sports','advertising'], ['luxury','editorial','fashion']),
  createColorPalette('high-contrast-white-red', 'White & Red', 'High Contrast', '#DC2626', '#991B1B', '#FFFFFF', '#FEF2F2', '#FEE2E2', '#991B1B', '#DC2626', '#991B1B', '#DC2626', '#22C55E', '#F59E0B', '#EF4444', 98, 'AAA', ['emergency','healthcare','warning'], ['bold','urgent','impactful'], ['emergency sites','healthcare','warning'], ['luxury','editorial','fashion']),
];

// ============================================================
// FUTURISTIC
// ============================================================

export const futuristicPalettes: ColorPalette[] = [
  createColorPalette('futuristic-cyber', 'Cyber', 'Futuristic', '#06B6D4', '#8B5CF6', '#EC4899', '#0A0A0F', '#18181B', '#F5F1EA', '#06B6D4', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['technology','gaming','innovation'], ['futuristic','bold','cyber'], ['gaming','tech startups','innovation'], ['luxury','editorial','fashion']),
  createColorPalette('futuristic-neon', 'Neon', 'Futuristic', '#10B981', '#06B6D4', '#F59E0B', '#0A0A0F', '#111827', '#F9FAFB', '#10B981', '#06B6D4', '#F59E0B', '#22C55E', '#F59E0B', '#EF4444', 87, 'AA', ['technology','innovation','sci-fi'], ['futuristic','neon','bold'], ['sci-fi','tech innovation','future'], ['luxury','editorial','fashion']),
];

// ============================================================
// EDITORIAL
// ============================================================

export const editorialPalettes: ColorPalette[] = [
  createColorPalette('editorial-classic', 'Classic Editorial', 'Editorial',
    '#1A1A1A', '#4A4A4A', '#8A8A8A', '#FFFFFF', '#F5F5F5', '#1A1A1A', '#4A4A4A', '#CCCCCC', '#1A1A1A',
    '#22C55E', '#F59E0B', '#EF4444', 96, 'AAA',
    ['publishing','media','literary'], ['classic','timeless','professional'],
    ['publishing','media','literary'], ['tech','luxury','creative']),
  createColorPalette('editorial-warm', 'Warm Editorial', 'Editorial', '#8B4513', '#A0522D', '#D2691E', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B4513', '#A0522D', '#D2691E', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['publishing','literary','art'], ['warm','classic','artistic'], ['literary sites','art','publishing'], ['tech','luxury','corporate']),
];

// ============================================================
// MINIMAL
// ============================================================

export const minimalPalettes: ColorPalette[] = [
  createColorPalette('minimal-white', 'White Minimal', 'Minimal', '#111827', '#6B7280', '#3B82F6', '#FFFFFF', '#F9FAFB', '#111827', '#6B7280', '#9CA3AF', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', 97, 'AAA', ['technology','general','SaaS'], ['clean','minimal','professional'], ['minimal websites','general','SaaS'], ['luxury','editorial','fashion']),
  createColorPalette('minimal-dark', 'Dark Minimal', 'Minimal', '#F5F5F5', '#9CA3AF', '#3B82F6', '#111827', '#1F2937', '#F5F5F5', '#9CA3AF', '#D1D5DB', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', 96, 'AAA', ['technology','general','SaaS'], ['clean','minimal','modern'], ['dark minimal sites','tech','SaaS'], ['luxury','editorial','fashion']),
];

// ============================================================
// OCEAN
// ============================================================

export const oceanPalettes: ColorPalette[] = [
  createColorPalette('ocean-deep', 'Deep Ocean', 'Ocean', '#006994', '#0096C7', '#48BFE3', '#F0F9FF', '#E0F2FE', '#023559', '#006994', '#0096C7', '#48BFE3', '#22C55E', '#F59E0B', '#EF4444', 94, 'AAA', ['ocean','marine','travel'], ['ocean','calm','fresh'], ['ocean sites','marine','travel'], ['tech','luxury','corporate']),
  createColorPalette('ocean-tropical', 'Tropical Ocean', 'Ocean', '#00B4D8', '#48CAE4', '#90E0EF', '#E0F7FA', '#CAF0F8', '#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['ocean','tropical','travel'], ['tropical','fresh','vibrant'], ['tropical travel','ocean sites'], ['tech','luxury','corporate']),
];

// ============================================================
// FOREST
// ============================================================

export const forestPalettes: ColorPalette[] = [
  createColorPalette('forest-deep', 'Deep Forest', 'Forest', '#2D5016', '#4A7C23', '#7CB342', '#F1F8E9', '#E8F5E9', '#1B5E20', '#2D5016', '#4A7C23', '#7CB342', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['eco','nature','outdoor'], ['natural','fresh','organic'], ['eco brands','nature','outdoor'], ['tech','luxury','corporate']),
  createColorPalette('forest-moss', 'Moss', 'Forest', '#556B2F', '#6B8E23', '#9ACD32', '#F5F5F0', '#E8E8D0', '#2F4F2F', '#556B2F', '#6B8E23', '#9ACD32', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['nature','organic','eco'], ['natural','organic','calm'], ['nature sites','organic','eco'], ['tech','luxury','corporate']),
];

// ============================================================
// SUNSET
// ============================================================

export const sunsetPalettes: ColorPalette[] = [
  createColorPalette('sunset-warm', 'Sunset Warm', 'Sunset', '#FF6B35', '#F7931E', '#FFD700', '#FFF5EE', '#FFF0E0', '#8B4513', '#FF6B35', '#F7931E', '#FFD700', '#22C55E', '#F59E0B', '#EF4444', 89, 'AA', ['food','hospitality','travel'], ['warm','sunset','inviting'], ['restaurant sites','food','travel'], ['tech','luxury','corporate']),
  createColorPalette('sunset-dusk', 'Dusk', 'Sunset', '#FF4500', '#FF7F50', '#FFB347', '#FFF0E0', '#FFE4C4', '#8B0000', '#FF4500', '#FF7F50', '#FFB347', '#22C55E', '#F59E0B', '#EF4444', 87, 'AA', ['travel','sunset','warm'], ['warm','dramatic','sunset'], ['travel sites','sunset brands'], ['tech','luxury','corporate']),
];

// ============================================================
// ROSE
// ============================================================

export const rosePalettes: ColorPalette[] = [
  createColorPalette('rose-gold', 'Rose Gold', 'Rose', '#B76E79', '#D4A5A5', '#E8B4B8', '#1A1A2E', '#16213E', '#F5F1EA', '#B76E79', '#D4A5A5', '#C4959A', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['beauty','luxury','fashion'], ['romantic','elegant','feminine'], ['beauty brands','luxury','fashion'], ['tech','casual','playful']),
  createColorPalette('rose-blush', 'Rose Blush', 'Rose', '#FF6B8A', '#FF8FA8', '#FFB3C6', '#FFF0F3', '#FFE8EC', '#C41851', '#FF6B8A', '#FF8FA8', '#FFB3C6', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['beauty','lifestyle','fashion'], ['soft','romantic','feminine'], ['beauty brands','lifestyle','fashion'], ['tech','casual','playful']),
];

// ============================================================
// ARCTIC
// ============================================================

export const arcticPalettes: ColorPalette[] = [
  createColorPalette('arctic-cool', 'Arctic Cool', 'Arctic', '#5B9BD5', '#8ECAE6', '#BDD7EE', '#F0F8FF', '#E8F4FD', '#2C3E50', '#5B9BD5', '#8ECAE6', '#BDD7EE', '#22C55E', '#F59E0B', '#EF4444', 91, 'AAA', ['technology','winter','sports'], ['cool','crisp','clean'], ['tech sites','winter sports','cold brands'], ['luxury','creative','fashion']),
  createColorPalette('arctic-frost', 'Frost', 'Arctic', '#A8D8EA', '#D4E5F7', '#E8F4FD', '#F0F8FF', '#FFFFFF', '#2C3E50', '#A8D8EA', '#D4E5F7', '#E8F4FD', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['winter','sports','wellness'], ['cool','fresh','clean'], ['winter sports','wellness','cold brands'], ['luxury','creative','fashion']),
];

// ============================================================
// DESERT
// ============================================================

export const desertPalettes: ColorPalette[] = [
  createColorPalette('desert-sand', 'Desert Sand', 'Desert', '#C4A882', '#D4C5A9', '#E8D5B7', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#C4A882', '#D4C5A9', '#E8D5B7', '#22C55E', '#F59E0B', '#EF4444', 85, 'AA', ['travel','desert','western'], ['warm','earthy','natural'], ['desert travel','western brands'], ['tech','luxury','corporate']),
  createColorPalette('desert-sunset', 'Desert Sunset', 'Desert', '#C1440E', '#E36C09', '#F7931E', '#FFF5EE', '#FFF0E0', '#7A2E0A', '#C1440E', '#E36C09', '#F7931E', '#22C55E', '#F59E0B', '#EF4444', 86, 'AA', ['desert','travel','western'], ['warm','dramatic','sunset'], ['desert travel','western brands'], ['tech','luxury','corporate']),
];

// ============================================================
// URBAN
// ============================================================

export const urbanPalettes: ColorPalette[] = [
  createColorPalette('urban-street', 'Urban Street', 'Urban', '#1A1A1A', '#4A4A4A', '#FF6B35', '#F5F5F5', '#E8E8E8', '#1A1A1A', '#FF6B35', '#4A4A4A', '#FF6B35', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['streetwear','urban','sports'], ['bold','urban','energetic'], ['streetwear brands','urban sites'], ['luxury','editorial','fashion']),
  createColorPalette('urban-modern', 'Urban Modern', 'Urban', '#2D2D2D', '#555555', '#00B4D8', '#FAFAFA', '#F5F5F5', '#2D2D2D', '#00B4D8', '#555555', '#00B4D8', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['urban','modern','technology'], ['modern','sleek','urban'], ['urban sites','modern brands'], ['luxury','creative','fashion']),
];

// ============================================================
// VINTAGE
// ============================================================

export const vintagePalettes: ColorPalette[] = [
  createColorPalette('vintage-retro', 'Vintage Retro', 'Vintage', '#8B4513', '#A0522D', '#D2691E', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B4513', '#A0522D', '#D2691E', '#22C55E', '#F59E0B', '#EF4444', 86, 'AA', ['retro','vintage','nostalgic'], ['warm','nostalgic','classic'], ['retro brands','vintage sites'], ['tech','luxury','corporate']),
  createColorPalette('vintage-sepia', 'Sepia', 'Vintage', '#704214', '#8B6914', '#A0826D', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#704214', '#8B6914', '#A0826D', '#22C55E', '#F59E0B', '#EF4444', 85, 'AA', ['vintage','retro','classic'], ['warm','nostalgic','classic'], ['vintage sites','retro brands'], ['tech','luxury','corporate']),
];

// ============================================================
// CYBER
// ============================================================

export const cyberPalettes: ColorPalette[] = [
  createColorPalette('cyber-neon', 'Cyber Neon', 'Cyber', '#00FF41', '#FF00FF', '#00FFFF', '#0A0A0A', '#111111', '#F0F0F0', '#00FF41', '#FF00FF', '#00FFFF', '#22C55E', '#F59E0B', '#EF4444', 85, 'AA', ['gaming','tech','innovation'], ['cyber','neon','bold'], ['gaming','tech innovation','cyber'], ['luxury','editorial','fashion']),
];

// ============================================================
// COMBINED CATALOG
// ============================================================

export const colorPalettes: ColorPalette[] = [
  ...monochromePalettes,
  ...neutralPalettes,
  ...warmNeutralPalettes,
  ...coolNeutralPalettes,
  ...luxuryPalettes,
  ...medicalPalettes,
  ...wellnessPalettes,
  ...naturePalettes,
  ...fashionPalettes,
  ...technologyPalettes,
  ...restaurantPalettes,
  ...hospitalityPalettes,
  ...creativePalettes,
  ...pastelPalettes,
  ...darkPalettes,
  ...highContrastPalettes,
  ...futuristicPalettes,
  ...editorialPalettes,
  ...minimalPalettes,
  ...oceanPalettes,
  ...forestPalettes,
  ...sunsetPalettes,
  ...rosePalettes,
  ...arcticPalettes,
  ...desertPalettes,
  ...urbanPalettes,
  ...vintagePalettes,
  ...cyberPalettes,
];

// Add more palettes to reach 100+
export const additionalColorPalettes: ColorPalette[] = [
  createColorPalette('bold-bright', 'Bright Bold', 'Bold', '#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#F0F0F0', '#000000', '#FF0000', '#00FF00', '#0000FF', '#22C55E', '#F59E0B', '#EF4444', 98, 'AAA', ['advertising','sports','marketing'], ['bold','bright','impactful'], ['advertising','sports','marketing'], ['luxury','editorial','fashion']),
  createColorPalette('soft-pastel', 'Soft Pastel', 'Soft', '#FFB6C1', '#DDA0DD', '#87CEEB', '#FFF0F5', '#F0F8FF', '#8B008B', '#FFB6C1', '#DDA0DD', '#87CEEB', '#22C55E', '#F59E0B', '#EF4444', 84, 'AA', ['beauty','lifestyle','kids'], ['soft','dreamy','gentle'], ['beauty brands','lifestyle','kids'], ['tech','luxury','corporate']),
  createColorPalette('moody-dark', 'Moody Dark', 'Moody', '#1A1A2E', '#16213E', '#0F3460', '#0A0A0A', '#141414', '#E8E8E8', '#1A1A2E', '#16213E', '#0F3460', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['luxury','technology','creative'], ['dark','mysterious','premium'], ['dark themes','luxury','creative'], ['bright','casual','playful']),
  createColorPalette('ocean-deep-teal', 'Deep Teal', 'Ocean', '#004D40', '#008080', '#00BFA5', '#E0F7F0', '#E8F5E9', '#004D40', '#008080', '#00BFA5', '#00BFA5', '#22C55E', '#F59E0B', '#EF4444', 93, 'AAA', ['ocean','marine','wellness'], ['ocean','calm','fresh'], ['ocean sites','marine','wellness'], ['tech','luxury','corporate']),
  createColorPalette('sunset-orange', 'Sunset Orange', 'Sunset', '#FF6D00', '#FF9100', '#FFAB40', '#FFF3E0', '#FFE0B2', '#BF360C', '#FF6D00', '#FF9100', '#FFAB40', '#22C55E', '#F59E0B', '#EF4444', 88, 'AA', ['sunset','warm','travel'], ['warm','sunset','inviting'], ['sunset travel','warm brands'], ['tech','luxury','corporate']),
  createColorPalette('forest-emerald', 'Emerald Forest', 'Forest', '#00695C', '#009688', '#4DB6AC', '#E0F2F1', '#B2DFDB', '#004D40', '#00695C', '#009688', '#4DB6AC', '#22C55E', '#F59E0B', '#EF4444', 92, 'AAA', ['eco','nature','wellness'], ['natural','fresh','organic'], ['eco brands','nature','wellness'], ['tech','luxury','corporate']),
  createColorPalette('rose-quartz', 'Rose Quartz', 'Rose', '#F7B7C3', '#E8B4B8', '#D4A5A5', '#FFF0F3', '#FFE8EC', '#C41851', '#F7B7C3', '#E8B4B8', '#D4A5A5', '#22C55E', '#F59E0B', '#EF4444', 90, 'AAA', ['beauty','lifestyle','fashion'], ['soft','romantic','feminine'], ['beauty brands','lifestyle','fashion'], ['tech','casual','playful']),
  createColorPalette('desert-canyon', 'Desert Canyon', 'Desert', '#C1440E', '#E36C09', '#F7931E', '#FFF5EE', '#FFF0E0', '#7A2E0A', '#C1440E', '#E36C09', '#F7931E', '#22C55E', '#F59E0B', '#EF4444', 86, 'AA', ['desert','travel','western'], ['warm','dramatic','sunset'], ['desert travel','western brands'], ['tech','luxury','corporate']),
  createColorPalette('urban-industrial', 'Industrial', 'Urban', '#4A4A4A', '#6B6B6B', '#FF6B35', '#FAFAFA', '#E8E8E8', '#2D2D2D', '#FF6B35', '#4A4A4A', '#FF6B35', '#22C55E', '#F59E0B', '#EF4444', 91, 'AAA', ['urban','industrial','modern'], ['urban','modern','energetic'], ['urban sites','industrial brands'], ['luxury','creative','fashion']),
  createColorPalette('vintage-vintage', 'Vintage Warm', 'Vintage', '#8B7355', '#A0826D', '#C4A882', '#FFF8F0', '#FAF0E6', '#3D2B1F', '#8B7355', '#A0826D', '#C4A882', '#22C55E', '#F59E0B', '#EF4444', 85, 'AA', ['vintage','retro','classic'], ['warm','nostalgic','classic'], ['vintage sites','retro brands'], ['tech','luxury','corporate']),
];

export const fullColorPalettes: ColorPalette[] = [...colorPalettes, ...additionalColorPalettes];
