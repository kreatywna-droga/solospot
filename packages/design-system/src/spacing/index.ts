/**
 * Spacing Systems — Complete Spacing Style Catalog
 *
 * Provides 20+ spacing configurations for consistent layout and rhythm.
 */

export interface SpacingStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    section: string;
    container: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const spacingStyles: SpacingStyle[] = [
  {
    id: 'spacing-compact',
    name: 'Compact',
    style: 'compact',
    description: 'Tight spacing for dense, information-rich interfaces',
    values: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '24px', container: '16px' },
    bestFor: ['dashboard', 'data', 'admin', 'forms', 'tables'],
    notRecommendedFor: ['luxury', 'editorial', 'hero'],
    industries: ['technology', 'saas', 'finance', 'data'],
    mood: ['modern', 'clean', 'professional', 'dense'],
    compatibility: ['cards-minimal', 'buttons-solid', 'radius-minimal'],
    preview: 'gap: 8px; padding: 12px;',
  },
  {
    id: 'spacing-balanced',
    name: 'Balanced',
    style: 'balanced',
    description: 'Standard balanced spacing for general UI',
    values: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px', xxl: '48px', section: '48px', container: '24px' },
    bestFor: ['all purposes', 'general UI', 'cards', 'buttons'],
    notRecommendedFor: ['compact', 'luxury', 'editorial'],
    industries: ['all'],
    mood: ['modern', 'clean', 'professional', 'balanced'],
    compatibility: ['cards-elevated', 'buttons-solid', 'radius-rounded'],
    preview: 'gap: 16px; padding: 24px;',
  },
  {
    id: 'spacing-airy',
    name: 'Airy',
    style: 'airy',
    description: 'Generous spacing for open, breathable designs',
    values: { xs: '12px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['creative', 'portfolio', 'landing', 'hero'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'photography', 'marketing'],
    mood: ['modern', 'creative', 'open', 'breathable'],
    compatibility: ['cards-asymmetric', 'buttons-gradient', 'radius-hero'],
    preview: 'gap: 24px; padding: 32px;',
  },
  {
    id: 'spacing-luxury',
    name: 'Luxury',
    style: 'luxury',
    description: 'Generous, refined spacing for premium designs',
    values: { xs: '16px', sm: '24px', md: '32px', lg: '48px', xl: '64px', xxl: '96px', section: '96px', container: '48px' },
    bestFor: ['luxury', 'premium', 'fashion', 'beauty'],
    notRecommendedFor: ['compact', 'minimal', 'brutalist'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'refined', 'premium'],
    compatibility: ['buttons-luxury', 'cards-luxury', 'radius-luxury'],
    preview: 'gap: 32px; padding: 48px;',
  },
  {
    id: 'spacing-tight',
    name: 'Tight',
    style: 'tight',
    description: 'Very tight spacing for minimal, dense interfaces',
    values: { xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '24px', section: '16px', container: '8px' },
    bestFor: ['minimal', 'flat', 'dashboard', 'forms'],
    notRecommendedFor: ['luxury', 'airy', 'editorial'],
    industries: ['technology', 'saas', 'minimal'],
    mood: ['minimal', 'clean', 'modern', 'flat'],
    compatibility: ['cards-minimal', 'buttons-minimal', 'radius-minimal'],
    preview: 'gap: 4px; padding: 8px;',
  },
  {
    id: 'spacing-expansive',
    name: 'Expansive',
    style: 'expansive',
    description: 'Very generous spacing for dramatic, open designs',
    values: { xs: '24px', sm: '32px', md: '48px', lg: '64px', xl: '96px', xxl: '128px', section: '128px', container: '64px' },
    bestFor: ['hero', 'landing', 'showcase', 'gallery'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'marketing', 'technology'],
    mood: ['modern', 'bold', 'impactful', 'open'],
    compatibility: ['buttons-gradient', 'cards-elevated', 'radius-hero'],
    preview: 'gap: 48px; padding: 64px;',
  },
  {
    id: 'spacing-editorial',
    name: 'Editorial',
    style: 'editorial',
    description: 'Classic editorial spacing for reading and publishing',
    values: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['editorial', 'publishing', 'magazine', 'news'],
    notRecommendedFor: ['compact', 'luxury', 'brutalist'],
    industries: ['media', 'publishing', 'news', 'editorial'],
    mood: ['editorial', 'classic', 'timeless', 'professional'],
    compatibility: ['buttons-editorial', 'cards-editorial', 'radius-editorial'],
    preview: 'gap: 16px; padding: 32px;',
  },
  {
    id: 'spacing-wellness',
    name: 'Wellness',
    style: 'wellness',
    description: 'Soft, organic spacing for wellness and nature',
    values: { xs: '12px', sm: '20px', md: '32px', lg: '48px', xl: '64px', xxl: '96px', section: '80px', container: '40px' },
    bestFor: ['wellness', 'nature', 'organic', 'yoga'],
    notRecommendedFor: ['compact', 'tech', 'brutalist'],
    industries: ['wellness', 'nature', 'eco', 'yoga'],
    mood: ['organic', 'natural', 'soft', 'calm'],
    compatibility: ['buttons-pill', 'cards-soft', 'radius-organic'],
    preview: 'gap: 20px; padding: 32px;',
  },
  {
    id: 'spacing-ecommerce',
    name: 'E-Commerce',
    style: 'ecommerce',
    description: 'Optimized spacing for e-commerce interfaces',
    values: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px', xxl: '48px', section: '48px', container: '24px' },
    bestFor: ['e-commerce', 'retail', 'shopping', 'product'],
    notRecommendedFor: ['luxury', 'editorial', 'airy'],
    industries: ['e-commerce', 'retail', 'shopping', 'product'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['buttons-solid', 'cards-image', 'radius-ecommerce'],
    preview: 'gap: 12px; padding: 16px;',
  },
  {
    id: 'spacing-dashboard',
    name: 'Dashboard',
    style: 'dashboard',
    description: 'Optimized spacing for dashboard and data interfaces',
    values: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '32px', container: '16px' },
    bestFor: ['dashboard', 'data', 'analytics', 'admin'],
    notRecommendedFor: ['luxury', 'airy', 'editorial'],
    industries: ['technology', 'saas', 'finance', 'data'],
    mood: ['modern', 'clean', 'professional', 'dense'],
    compatibility: ['cards-bordered', 'buttons-solid', 'radius-dashboard'],
    preview: 'gap: 8px; padding: 12px;',
  },
  {
    id: 'spacing-hero',
    name: 'Hero',
    style: 'hero',
    description: 'Generous spacing for hero sections and landing pages',
    values: { xs: '16px', sm: '24px', md: '48px', lg: '64px', xl: '96px', xxl: '128px', section: '128px', container: '64px' },
    bestFor: ['hero', 'landing', 'showcase', 'banner'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['marketing', 'technology', 'creative-agency'],
    mood: ['modern', 'bold', 'impactful', 'open'],
    compatibility: ['buttons-gradient', 'cards-elevated', 'radius-hero'],
    preview: 'gap: 48px; padding: 64px;',
  },
  {
    id: 'spacing-social',
    name: 'Social',
    style: 'social',
    description: 'Friendly spacing for social and community platforms',
    values: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px', xxl: '48px', section: '48px', container: '24px' },
    bestFor: ['social', 'community', 'messaging', 'chat'],
    notRecommendedFor: ['luxury', 'editorial', 'brutalist'],
    industries: ['social', 'community', 'messaging', 'chat'],
    mood: ['friendly', 'modern', 'warm', 'approachable'],
    compatibility: ['buttons-pill', 'cards-soft', 'radius-social'],
    preview: 'gap: 12px; padding: 16px;',
  },
  {
    id: 'spacing-education',
    name: 'Education',
    style: 'education',
    description: 'Clean, readable spacing for educational interfaces',
    values: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['education', 'learning', 'course', 'academy'],
    notRecommendedFor: ['luxury', 'brutalist', 'compact'],
    industries: ['education', 'learning', 'academy'],
    mood: ['modern', 'clean', 'professional', 'readable'],
    compatibility: ['buttons-solid', 'cards-bordered', 'radius-rounded'],
    preview: 'gap: 16px; padding: 24px;',
  },
  {
    id: 'spacing-finance',
    name: 'Finance',
    style: 'finance',
    description: 'Precise, professional spacing for financial interfaces',
    values: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '32px', container: '16px' },
    bestFor: ['finance', 'banking', 'investment', 'trading'],
    notRecommendedFor: ['luxury', 'airy', 'creative'],
    industries: ['finance', 'banking', 'investment', 'trading'],
    mood: ['professional', 'clean', 'modern', 'precise'],
    compatibility: ['buttons-solid', 'cards-elevated', 'radius-tech'],
    preview: 'gap: 8px; padding: 12px;',
  },
  {
    id: 'spacing-medical',
    name: 'Medical',
    style: 'medical',
    description: 'Clean, trustworthy spacing for medical interfaces',
    values: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['medical', 'healthcare', 'dental', 'pharmacy'],
    notRecommendedFor: ['luxury', 'brutalist', 'compact'],
    industries: ['medical', 'healthcare', 'dental', 'pharmacy'],
    mood: ['clean', 'trustworthy', 'professional', 'medical'],
    compatibility: ['buttons-outline', 'cards-soft', 'radius-medical'],
    preview: 'gap: 16px; padding: 24px;',
  },
  {
    id: 'spacing-creative',
    name: 'Creative',
    style: 'creative',
    description: 'Expressive, artistic spacing for creative interfaces',
    values: { xs: '16px', sm: '24px', md: '32px', lg: '48px', xl: '64px', xxl: '96px', section: '80px', container: '40px' },
    bestFor: ['creative', 'artistic', 'portfolio', 'gallery'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'art', 'design', 'photography'],
    mood: ['creative', 'expressive', 'artistic', 'bold'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-artistic'],
    preview: 'gap: 24px; padding: 32px;',
  },
  {
    id: 'spacing-restaurant',
    name: 'Restaurant',
    style: 'restaurant',
    description: 'Warm, inviting spacing for restaurant interfaces',
    values: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['restaurant', 'food', 'hospitality', 'cafe'],
    notRecommendedFor: ['luxury', 'brutalist', 'compact'],
    industries: ['restaurant', 'food', 'hospitality', 'cafe'],
    mood: ['warm', 'inviting', 'cozy', 'professional'],
    compatibility: ['buttons-outline', 'cards-soft', 'radius-soft'],
    preview: 'gap: 16px; padding: 24px;',
  },
  {
    id: 'spacing-tech',
    name: 'Tech',
    style: 'tech',
    description: 'Precise, modern spacing for technology interfaces',
    values: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', xxl: '32px', section: '32px', container: '16px' },
    bestFor: ['technology', 'saas', 'startup', 'fintech'],
    notRecommendedFor: ['luxury', 'airy', 'editorial'],
    industries: ['technology', 'saas', 'startup', 'fintech'],
    mood: ['tech', 'modern', 'clean', 'precise'],
    compatibility: ['buttons-solid', 'cards-glass', 'radius-tech'],
    preview: 'gap: 8px; padding: 12px;',
  },
  {
    id: 'spacing-minimal',
    name: 'Minimal',
    style: 'minimal',
    description: 'Ultra-minimal spacing for clean, simple interfaces',
    values: { xs: '2px', sm: '4px', md: '8px', lg: '12px', xl: '16px', xxl: '24px', section: '16px', container: '8px' },
    bestFor: ['minimal', 'flat', 'clean', 'modern'],
    notRecommendedFor: ['luxury', 'airy', 'editorial'],
    industries: ['technology', 'saas', 'minimal'],
    mood: ['minimal', 'clean', 'modern', 'flat'],
    compatibility: ['cards-minimal', 'buttons-minimal', 'radius-minimal'],
    preview: 'gap: 4px; padding: 8px;',
  },
  {
    id: 'spacing-fitness',
    name: 'Fitness',
    style: 'fitness',
    description: 'Energetic, bold spacing for fitness interfaces',
    values: { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '48px', xxl: '64px', section: '64px', container: '32px' },
    bestFor: ['fitness', 'sports', 'gym', 'activity'],
    notRecommendedFor: ['luxury', 'editorial', 'compact'],
    industries: ['fitness', 'sports', 'gym', 'activity'],
    mood: ['bold', 'energetic', 'active', 'modern'],
    compatibility: ['buttons-neon', 'cards-feature', 'radius-rounded'],
    preview: 'gap: 16px; padding: 24px;',
  },
];

export const getSpacingStyle = (id: string): SpacingStyle | undefined =>
  spacingStyles.find((s) => s.id === id);

export const getSpacingValues = (id: string) => {
  const style = getSpacingStyle(id);
  return style?.values;
};

export default spacingStyles;
