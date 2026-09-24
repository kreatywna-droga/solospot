/**
 * Hero Styles — Complete Hero Style Catalog
 *
 * Provides 15+ hero section configurations for landing pages.
 */

export interface HeroStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    layout: string;
    alignment: string;
    minHeight: string;
    paddingTop: string;
    paddingBottom: string;
    backgroundType: string;
    contentMaxWidth: string;
    headingSize: string;
    subheadingSize: string;
    ctaStyle: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const heroStyles: HeroStyle[] = [
  {
    id: 'hero-centered',
    name: 'Centered',
    style: 'centered',
    description: 'Centered hero with headline, subheadline, and CTA',
    values: { layout: 'centered', alignment: 'center', minHeight: '80vh', paddingTop: '128px', paddingBottom: '128px', backgroundType: 'gradient', contentMaxWidth: '800px', headingSize: '4rem', subheadingSize: '1.5rem', ctaStyle: 'solid' },
    bestFor: ['landing pages', 'showcase', 'cta'],
    notRecommendedFor: ['dashboard', 'forms', 'compact'],
    industries: ['technology', 'saas', 'marketing'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-gradient', 'buttons-gradient', 'radius-hero'],
    preview: 'text-align: center; min-height: 80vh;',
  },
  {
    id: 'hero-left',
    name: 'Left Aligned',
    style: 'left',
    description: 'Left-aligned hero with image on right',
    values: { layout: 'split', alignment: 'left', minHeight: '80vh', paddingTop: '64px', paddingBottom: '64px', backgroundType: 'solid', contentMaxWidth: '600px', headingSize: '3.5rem', subheadingSize: '1.25rem', ctaStyle: 'solid' },
    bestFor: ['product', 'about', 'services'],
    notRecommendedFor: ['minimal', 'editorial', 'gallery'],
    industries: ['technology', 'saas', 'corporate'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'buttons-solid', 'radius-rounded'],
    preview: 'text-align: left; min-height: 80vh;',
  },
  {
    id: 'hero-right',
    name: 'Right Aligned',
    style: 'right',
    description: 'Right-aligned hero with image on left',
    values: { layout: 'split', alignment: 'right', minHeight: '80vh', paddingTop: '64px', paddingBottom: '64px', backgroundType: 'solid', contentMaxWidth: '600px', headingSize: '3.5rem', subheadingSize: '1.25rem', ctaStyle: 'solid' },
    bestFor: ['product', 'about', 'services'],
    notRecommendedFor: ['minimal', 'editorial', 'gallery'],
    industries: ['technology', 'saas', 'corporate'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'buttons-solid', 'radius-rounded'],
    preview: 'text-align: right; min-height: 80vh;',
  },
  {
    id: 'hero-full-bleed',
    name: 'Full Bleed',
    style: 'full-bleed',
    description: 'Edge-to-edge hero with full background image',
    values: { layout: 'centered', alignment: 'center', minHeight: '100vh', paddingTop: '0', paddingBottom: '0', backgroundType: 'image', contentMaxWidth: '800px', headingSize: '5rem', subheadingSize: '1.5rem', ctaStyle: 'gradient' },
    bestFor: ['landing', 'showcase', 'portfolio'],
    notRecommendedFor: ['compact', 'dashboard', 'forms'],
    industries: ['creative-agency', 'photography', 'travel'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-image', 'buttons-gradient', 'radius-none'],
    preview: 'min-height: 100vh; width: 100%;',
  },
  {
    id: 'hero-dashboard',
    name: 'Dashboard',
    style: 'dashboard',
    description: 'Compact hero for dashboard interfaces',
    values: { layout: 'centered', alignment: 'center', minHeight: '40vh', paddingTop: '32px', paddingBottom: '32px', backgroundType: 'solid', contentMaxWidth: '600px', headingSize: '2rem', subheadingSize: '1rem', ctaStyle: 'solid' },
    bestFor: ['dashboard', 'admin', 'data'],
    notRecommendedFor: ['landing', 'hero', 'showcase'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['backgrounds-light', 'buttons-solid', 'radius-minimal'],
    preview: 'min-height: 40vh; text-align: center;',
  },
  {
    id: 'hero-luxury',
    name: 'Luxury',
    style: 'luxury',
    description: 'Premium luxury hero with elegant typography',
    values: { layout: 'centered', alignment: 'center', minHeight: '90vh', paddingTop: '128px', paddingBottom: '128px', backgroundType: 'gradient', contentMaxWidth: '700px', headingSize: '4.5rem', subheadingSize: '1.5rem', ctaStyle: 'luxury' },
    bestFor: ['luxury', 'fashion', 'beauty', 'hotel'],
    notRecommendedFor: ['minimal', 'tech', 'brutalist'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'premium', 'refined'],
    compatibility: ['backgrounds-luxury', 'buttons-luxury', 'radius-luxury'],
    preview: 'min-height: 90vh; text-align: center;',
  },
  {
    id: 'hero-dark',
    name: 'Dark',
    style: 'dark',
    description: 'Dark hero for dramatic contrast',
    values: { layout: 'centered', alignment: 'center', minHeight: '90vh', paddingTop: '128px', paddingBottom: '128px', backgroundType: 'dark', contentMaxWidth: '800px', headingSize: '4rem', subheadingSize: '1.5rem', ctaStyle: 'gradient' },
    bestFor: ['tech', 'gaming', 'creative', 'luxury'],
    notRecommendedFor: ['light', 'medical', 'education'],
    industries: ['technology', 'gaming', 'creative-agency'],
    mood: ['dark', 'modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-dark', 'buttons-gradient', 'radius-tech'],
    preview: 'min-height: 90vh; background: #1A1A2E;',
  },
  {
    id: 'hero-minimal',
    name: 'Minimal',
    style: 'minimal',
    description: 'Ultra-minimal hero with lots of whitespace',
    values: { layout: 'centered', alignment: 'center', minHeight: '60vh', paddingTop: '96px', paddingBottom: '96px', backgroundType: 'solid', contentMaxWidth: '600px', headingSize: '3rem', subheadingSize: '1.25rem', ctaStyle: 'outline' },
    bestFor: ['minimal', 'clean', 'modern', 'professional'],
    notRecommendedFor: ['dramatic', 'luxury', 'creative'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['minimal', 'clean', 'modern', 'professional'],
    compatibility: ['backgrounds-minimal', 'buttons-minimal', 'radius-minimal'],
    preview: 'min-height: 60vh; text-align: center;',
  },
  {
    id: 'hero-creative',
    name: 'Creative',
    style: 'creative',
    description: 'Bold creative hero with vibrant colors',
    values: { layout: 'centered', alignment: 'center', minHeight: '80vh', paddingTop: '80px', paddingBottom: '80px', backgroundType: 'gradient', contentMaxWidth: '700px', headingSize: '4rem', subheadingSize: '1.5rem', ctaStyle: 'gradient' },
    bestFor: ['creative', 'artistic', 'marketing', 'agency'],
    notRecommendedFor: ['minimal', 'corporate', 'medical'],
    industries: ['creative-agency', 'marketing', 'art'],
    mood: ['creative', 'bold', 'expressive', 'vibrant'],
    compatibility: ['backgrounds-creative', 'buttons-gradient', 'radius-artistic'],
    preview: 'min-height: 80vh; text-align: center;',
  },
  {
    id: 'hero-editorial',
    name: 'Editorial',
    style: 'editorial',
    description: 'Classic editorial hero for publishing',
    values: { layout: 'narrow', alignment: 'left', minHeight: '70vh', paddingTop: '96px', paddingBottom: '96px', backgroundType: 'solid', contentMaxWidth: '700px', headingSize: '3.5rem', subheadingSize: '1.25rem', ctaStyle: 'outline' },
    bestFor: ['editorial', 'publishing', 'magazine', 'news'],
    notRecommendedFor: ['creative', 'luxury', 'gaming'],
    industries: ['media', 'publishing', 'news', 'editorial'],
    mood: ['editorial', 'classic', 'timeless', 'professional'],
    compatibility: ['backgrounds-solid', 'buttons-editorial', 'radius-editorial'],
    preview: 'min-height: 70vh; text-align: left;',
  },
  {
    id: 'hero-tech',
    name: 'Tech',
    style: 'tech',
    description: 'Technology-themed hero with futuristic elements',
    values: { layout: 'centered', alignment: 'center', minHeight: '80vh', paddingTop: '80px', paddingBottom: '80px', backgroundType: 'gradient', contentMaxWidth: '700px', headingSize: '4rem', subheadingSize: '1.5rem', ctaStyle: 'gradient' },
    bestFor: ['technology', 'saas', 'fintech', 'startup'],
    notRecommendedFor: ['luxury', 'editorial', 'organic'],
    industries: ['technology', 'saas', 'fintech', 'startup'],
    mood: ['tech', 'modern', 'futuristic', 'clean'],
    compatibility: ['backgrounds-tech', 'buttons-gradient', 'radius-tech'],
    preview: 'min-height: 80vh; text-align: center;',
  },
  {
    id: 'hero-medical',
    name: 'Medical',
    style: 'medical',
    description: 'Clean, trustworthy medical hero',
    values: { layout: 'centered', alignment: 'center', minHeight: '70vh', paddingTop: '80px', paddingBottom: '80px', backgroundType: 'gradient', contentMaxWidth: '700px', headingSize: '3rem', subheadingSize: '1.25rem', ctaStyle: 'outline' },
    bestFor: ['medical', 'healthcare', 'dental', 'pharmacy'],
    notRecommendedFor: ['luxury', 'creative', 'gaming'],
    industries: ['medical', 'healthcare', 'dental', 'pharmacy'],
    mood: ['clean', 'trustworthy', 'professional', 'medical'],
    compatibility: ['backgrounds-medical', 'buttons-outline', 'radius-medical'],
    preview: 'min-height: 70vh; text-align: center;',
  },
  {
    id: 'hero-restaurant',
    name: 'Restaurant',
    style: 'restaurant',
    description: 'Warm, inviting restaurant hero',
    values: { layout: 'centered', alignment: 'center', minHeight: '80vh', paddingTop: '80px', paddingBottom: '80px', backgroundType: 'image', contentMaxWidth: '700px', headingSize: '3.5rem', subheadingSize: '1.25rem', ctaStyle: 'outline' },
    bestFor: ['restaurant', 'food', 'hospitality', 'cafe'],
    notRecommendedFor: ['dark', 'tech', 'minimal'],
    industries: ['restaurant', 'food', 'hospitality', 'cafe'],
    mood: ['warm', 'inviting', 'appetizing', 'cozy'],
    compatibility: ['backgrounds-restaurant', 'buttons-outline', 'radius-soft'],
    preview: 'min-height: 80vh; text-align: center;',
  },
  {
    id: 'hero-fitness',
    name: 'Fitness',
    style: 'fitness',
    description: 'Energetic fitness hero',
    values: { layout: 'centered', alignment: 'center', minHeight: '80vh', paddingTop: '80px', paddingBottom: '80px', backgroundType: 'gradient', contentMaxWidth: '700px', headingSize: '4rem', subheadingSize: '1.5rem', ctaStyle: 'neon' },
    bestFor: ['fitness', 'sports', 'gym', 'activity'],
    notRecommendedFor: ['luxury', 'editorial', 'minimal'],
    industries: ['fitness', 'sports', 'gym', 'activity'],
    mood: ['bold', 'energetic', 'active', 'modern'],
    compatibility: ['backgrounds-gradient', 'buttons-neon', 'radius-rounded'],
    preview: 'min-height: 80vh; text-align: center;',
  },
  {
    id: 'hero-ecommerce',
    name: 'E-Commerce',
    style: 'ecommerce',
    description: 'Product-focused e-commerce hero',
    values: { layout: 'split', alignment: 'left', minHeight: '70vh', paddingTop: '64px', paddingBottom: '64px', backgroundType: 'solid', contentMaxWidth: '600px', headingSize: '3.5rem', subheadingSize: '1.25rem', ctaStyle: 'solid' },
    bestFor: ['e-commerce', 'retail', 'shopping', 'product'],
    notRecommendedFor: ['minimal', 'editorial', 'luxury'],
    industries: ['e-commerce', 'retail', 'shopping', 'product'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['backgrounds-light', 'buttons-solid', 'radius-ecommerce'],
    preview: 'min-height: 70vh; text-align: left;',
  },
];

export const getHeroStyle = (id: string): HeroStyle | undefined =>
  heroStyles.find((h) => h.id === id);

export const getHeroValues = (id: string) => {
  const style = getHeroStyle(id);
  return style?.values;
};

export default heroStyles;
