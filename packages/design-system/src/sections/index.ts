/**
 * Section Styles — Complete Section Style Catalog
 *
 * Provides 20+ section configurations for consistent page layout.
 */

export interface SectionStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    paddingTop: string;
    paddingBottom: string;
    paddingLeft: string;
    paddingRight: string;
    marginTop: string;
    marginBottom: string;
    maxWidth: string;
    layout: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const sectionStyles: SectionStyle[] = [
  {
    id: 'section-clean',
    name: 'Clean',
    style: 'clean',
    description: 'Standard clean section with balanced padding',
    values: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '24px', paddingRight: '24px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['all purposes', 'general sections', 'content'],
    notRecommendedFor: ['hero', 'dramatic', 'full-bleed'],
    industries: ['all'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-solid', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 48px 24px; max-width: 1200px;',
  },
  {
    id: 'section-hero',
    name: 'Hero',
    style: 'hero',
    description: 'Large hero section with generous padding',
    values: { paddingTop: '128px', paddingBottom: '128px', paddingLeft: '64px', paddingRight: '64px', marginTop: '0', marginBottom: '0', maxWidth: '100%', layout: 'centered' },
    bestFor: ['hero sections', 'landing pages', 'showcase'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['marketing', 'technology', 'creative-agency'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-gradient', 'spacing-hero', 'radius-hero'],
    preview: 'padding: 128px 64px; max-width: 100%;',
  },
  {
    id: 'section-compact',
    name: 'Compact',
    style: 'compact',
    description: 'Tight section for dense content',
    values: { paddingTop: '24px', paddingBottom: '24px', paddingLeft: '16px', paddingRight: '16px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['dashboard', 'data', 'admin', 'forms'],
    notRecommendedFor: ['hero', 'airy', 'luxury'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['modern', 'clean', 'dense'],
    compatibility: ['backgrounds-solid', 'spacing-compact', 'radius-minimal'],
    preview: 'padding: 24px 16px; max-width: 1200px;',
  },
  {
    id: 'section-airy',
    name: 'Airy',
    style: 'airy',
    description: 'Generous section with lots of whitespace',
    values: { paddingTop: '80px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', marginTop: '0', marginBottom: '0', maxWidth: '1400px', layout: 'centered' },
    bestFor: ['creative', 'portfolio', 'landing', 'gallery'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'photography', 'marketing'],
    mood: ['modern', 'creative', 'open', 'breathable'],
    compatibility: ['backgrounds-light', 'spacing-airy', 'radius-rounded'],
    preview: 'padding: 80px 48px; max-width: 1400px;',
  },
  {
    id: 'section-luxury',
    name: 'Luxury',
    style: 'luxury',
    description: 'Premium luxury section with refined spacing',
    values: { paddingTop: '96px', paddingBottom: '96px', paddingLeft: '48px', paddingRight: '48px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['luxury', 'premium', 'fashion', 'beauty'],
    notRecommendedFor: ['compact', 'minimal', 'brutalist'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'refined', 'premium'],
    compatibility: ['backgrounds-luxury', 'spacing-luxury', 'radius-luxury'],
    preview: 'padding: 96px 48px; max-width: 1200px;',
  },
  {
    id: 'section-full-bleed',
    name: 'Full Bleed',
    style: 'full-bleed',
    description: 'Edge-to-edge section with no max-width',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '0', paddingRight: '0', marginTop: '0', marginBottom: '0', maxWidth: '100%', layout: 'full' },
    bestFor: ['hero', 'gallery', 'showcase', 'image'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'marketing', 'photography'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-image', 'spacing-expansive', 'radius-none'],
    preview: 'padding: 64px 0; max-width: 100%;',
  },
  {
    id: 'section-editorial',
    name: 'Editorial',
    style: 'editorial',
    description: 'Classic editorial section for reading',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '800px', layout: 'narrow' },
    bestFor: ['editorial', 'publishing', 'magazine', 'news'],
    notRecommendedFor: ['hero', 'creative', 'luxury'],
    industries: ['media', 'publishing', 'news', 'editorial'],
    mood: ['editorial', 'classic', 'timeless', 'professional'],
    compatibility: ['backgrounds-solid', 'spacing-editorial', 'radius-editorial'],
    preview: 'padding: 64px 32px; max-width: 800px;',
  },
  {
    id: 'section-split',
    name: 'Split',
    style: 'split',
    description: 'Two-column split section',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '48px', paddingRight: '48px', marginTop: '0', marginBottom: '0', maxWidth: '1400px', layout: 'split' },
    bestFor: ['features', 'about', 'services', 'team'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['technology', 'saas', 'corporate'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 48px; max-width: 1400px; display: grid;',
  },
  {
    id: 'section-stacked',
    name: 'Stacked',
    style: 'stacked',
    description: 'Vertically stacked section with cards',
    values: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '24px', paddingRight: '24px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'stacked' },
    bestFor: ['features', 'services', 'products', 'pricing'],
    notRecommendedFor: ['hero', 'airy', 'editorial'],
    industries: ['technology', 'saas', 'e-commerce'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-solid', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 48px 24px; max-width: 1200px; display: flex;',
  },
  {
    id: 'section-grid',
    name: 'Grid',
    style: 'grid',
    description: 'Grid-based section for multiple items',
    values: { paddingTop: '48px', paddingBottom: '48px', paddingLeft: '24px', paddingRight: '24px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'grid' },
    bestFor: ['gallery', 'portfolio', 'products', 'services'],
    notRecommendedFor: ['hero', 'editorial', 'compact'],
    industries: ['creative-agency', 'e-commerce', 'technology'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 48px 24px; max-width: 1200px; display: grid;',
  },
  {
    id: 'section-dark',
    name: 'Dark',
    style: 'dark',
    description: 'Dark section for dramatic contrast',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['hero', 'feature', 'cta', 'showcase'],
    notRecommendedFor: ['light', 'minimal', 'editorial'],
    industries: ['technology', 'creative-agency', 'gaming'],
    mood: ['dark', 'modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-dark', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 1200px; background: #1A1A2E;',
  },
  {
    id: 'section-light',
    name: 'Light',
    style: 'light',
    description: 'Light section for clean, readable content',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['content', 'about', 'services', 'features'],
    notRecommendedFor: ['dark', 'dramatic', 'luxury'],
    industries: ['corporate', 'medical', 'education', 'finance'],
    mood: ['modern', 'clean', 'professional', 'light'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 1200px; background: #F8FAFC;',
  },
  {
    id: 'section-gradient',
    name: 'Gradient',
    style: 'gradient',
    description: 'Gradient background section',
    values: { paddingTop: '80px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'centered' },
    bestFor: ['hero', 'cta', 'landing', 'showcase'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['technology', 'creative-agency', 'marketing'],
    mood: ['modern', 'bold', 'impactful', 'creative'],
    compatibility: ['backgrounds-gradient', 'spacing-airy', 'radius-hero'],
    preview: 'padding: 80px 48px; max-width: 1200px; background: gradient;',
  },
  {
    id: 'section-image',
    name: 'Image',
    style: 'image',
    description: 'Image-focused section',
    values: { paddingTop: '0', paddingBottom: '0', paddingLeft: '0', paddingRight: '0', marginTop: '0', marginBottom: '0', maxWidth: '100%', layout: 'full' },
    bestFor: ['gallery', 'portfolio', 'hero', 'showcase'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['photography', 'creative-agency', 'travel'],
    mood: ['modern', 'bold', 'impactful', 'creative'],
    compatibility: ['backgrounds-image', 'spacing-expansive', 'radius-none'],
    preview: 'padding: 0; max-width: 100%;',
  },
  {
    id: 'section-feature',
    name: 'Feature',
    style: 'feature',
    description: 'Feature-focused section with icons',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'grid' },
    bestFor: ['features', 'services', 'benefits', 'advantages'],
    notRecommendedFor: ['hero', 'editorial', 'compact'],
    industries: ['technology', 'saas', 'corporate'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 1200px; display: grid;',
  },
  {
    id: 'section-cta',
    name: 'CTA',
    style: 'cta',
    description: 'Call-to-action section',
    values: { paddingTop: '80px', paddingBottom: '80px', paddingLeft: '48px', paddingRight: '48px', marginTop: '0', marginBottom: '0', maxWidth: '800px', layout: 'centered' },
    bestFor: ['cta', 'conversion', 'signup', 'download'],
    notRecommendedFor: ['compact', 'dashboard', 'editorial'],
    industries: ['marketing', 'technology', 'saas'],
    mood: ['modern', 'bold', 'impactful', 'actionable'],
    compatibility: ['backgrounds-gradient', 'spacing-airy', 'radius-hero'],
    preview: 'padding: 80px 48px; max-width: 800px; text-align: center;',
  },
  {
    id: 'section-testimonial',
    name: 'Testimonial',
    style: 'testimonial',
    description: 'Testimonial and review section',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1000px', layout: 'centered' },
    bestFor: ['testimonials', 'reviews', 'social proof'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['all'],
    mood: ['modern', 'clean', 'professional', 'trustworthy'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-soft'],
    preview: 'padding: 64px 32px; max-width: 1000px;',
  },
  {
    id: 'section-pricing',
    name: 'Pricing',
    style: 'pricing',
    description: 'Pricing section with cards',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'grid' },
    bestFor: ['pricing', 'plans', 'packages'],
    notRecommendedFor: ['compact', 'dashboard', 'editorial'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 1200px; display: grid;',
  },
  {
    id: 'section-team',
    name: 'Team',
    style: 'team',
    description: 'Team member section',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'grid' },
    bestFor: ['team', 'about', 'people'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['corporate', 'technology', 'creative-agency'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 1200px; display: grid;',
  },
  {
    id: 'section-contact',
    name: 'Contact',
    style: 'contact',
    description: 'Contact form section',
    values: { paddingTop: '64px', paddingBottom: '64px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '600px', layout: 'centered' },
    bestFor: ['contact', 'form', 'inquiry'],
    notRecommendedFor: ['compact', 'dashboard', 'hero'],
    industries: ['all'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['backgrounds-light', 'spacing-balanced', 'radius-rounded'],
    preview: 'padding: 64px 32px; max-width: 600px;',
  },
  {
    id: 'section-creative',
    name: 'Creative',
    style: 'creative',
    description: 'Creative asymmetric section layout',
    values: { paddingTop: '72px', paddingBottom: '72px', paddingLeft: '32px', paddingRight: '32px', marginTop: '0', marginBottom: '0', maxWidth: '1200px', layout: 'asymmetric' },
    bestFor: ['creative', 'portfolio', 'showcase'],
    notRecommendedFor: ['forms', 'dashboard', 'pricing'],
    industries: ['creative-agency', 'photography', 'fashion'],
    mood: ['creative', 'bold', 'expressive'],
    compatibility: ['backgrounds-dark', 'spacing-loose', 'radius-sharp'],
    preview: 'padding: 72px 32px; max-width: 1200px; display: grid; grid-template-columns: 1.2fr 0.8fr;',
  },
];

export const getSectionStyle = (id: string): SectionStyle | undefined =>
  sectionStyles.find((s) => s.id === id);

export const getSectionValues = (id: string) => {
  const style = getSectionStyle(id);
  return style?.values;
};

export default sectionStyles;
