/**
 * Image Treatments — Complete Image Style Catalog
 *
 * Provides 15+ image treatment configurations for consistent visual styling.
 */

export interface ImageTreatmentStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    borderRadius: string;
    objectFit: string;
    objectPosition: string;
    overlay: string;
    filter: string;
    shadow: string;
    hoverEffect: string;
    aspectRatio: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const imageTreatmentStyles: ImageTreatmentStyle[] = [
  {
    id: 'image-natural',
    name: 'Natural',
    style: 'natural',
    description: 'Natural, unedited image treatment',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['general', 'product', 'lifestyle', 'nature'],
    notRecommendedFor: ['editorial', 'luxury', 'creative'],
    industries: ['all'],
    mood: ['modern', 'clean', 'natural'],
    compatibility: ['cards-image', 'backgrounds-image', 'radius-rounded'],
    preview: 'border-radius: 8px; object-fit: cover;',
  },
  {
    id: 'image-rounded',
    name: 'Rounded',
    style: 'rounded',
    description: 'Rounded corners for friendly images',
    values: { borderRadius: '16px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['cards', 'gallery', 'portfolio', 'social'],
    notRecommendedFor: ['editorial', 'luxury', 'brutalist'],
    industries: ['technology', 'creative-agency', 'social'],
    mood: ['modern', 'friendly', 'clean'],
    compatibility: ['cards-image', 'backgrounds-light', 'radius-rounded'],
    preview: 'border-radius: 16px; object-fit: cover;',
  },
  {
    id: 'image-full-bleed',
    name: 'Full Bleed',
    style: 'full-bleed',
    description: 'Edge-to-edge image with no border radius',
    values: { borderRadius: '0px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-none', hoverEffect: 'none', aspectRatio: '16/9' },
    bestFor: ['hero', 'landing', 'gallery', 'showcase'],
    notRecommendedFor: ['cards', 'forms', 'compact'],
    industries: ['creative-agency', 'photography', 'travel'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-image', 'section-full-bleed', 'radius-none'],
    preview: 'border-radius: 0px; object-fit: cover;',
  },
  {
    id: 'image-framed',
    name: 'Framed',
    style: 'framed',
    description: 'Framed image with border and shadow',
    values: { borderRadius: '4px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-medium', hoverEffect: 'shadow', aspectRatio: '4/3' },
    bestFor: ['editorial', 'portfolio', 'gallery', 'luxury'],
    notRecommendedFor: ['minimal', 'modern', 'tech'],
    industries: ['fashion', 'photography', 'editorial', 'luxury'],
    mood: ['editorial', 'classic', 'luxury', 'elegant'],
    compatibility: ['cards-editorial', 'backgrounds-solid', 'radius-sharp'],
    preview: 'border-radius: 4px; border: 2px solid #E2E8F0;',
  },
  {
    id: 'image-overlay',
    name: 'Overlay',
    style: 'overlay',
    description: 'Image with color overlay for dramatic effect',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'rgba(0,0,0,0.5)', filter: 'none', shadow: 'shadow-elevated', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['hero', 'landing', 'cta', 'showcase'],
    notRecommendedFor: ['minimal', 'editorial', 'forms'],
    industries: ['marketing', 'creative-agency', 'technology'],
    mood: ['modern', 'bold', 'impactful', 'dramatic'],
    compatibility: ['backgrounds-gradient', 'buttons-gradient', 'radius-hero'],
    preview: 'border-radius: 8px; overlay: rgba(0,0,0,0.5);',
  },
  {
    id: 'image-blur',
    name: 'Blur',
    style: 'blur',
    description: 'Blurred background image for depth',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'blur(8px)', shadow: 'shadow-none', hoverEffect: 'none', aspectRatio: '16/9' },
    bestFor: ['background', 'hero', 'atmospheric', 'landing'],
    notRecommendedFor: ['editorial', 'forms', 'compact'],
    industries: ['technology', 'creative-agency', 'marketing'],
    mood: ['modern', 'atmospheric', 'soft', 'impactful'],
    compatibility: ['backgrounds-gradient', 'cards-elevated', 'radius-rounded'],
    preview: 'filter: blur(8px);',
  },
  {
    id: 'image-grayscale',
    name: 'Grayscale',
    style: 'grayscale',
    description: 'Grayscale image for minimalist, editorial look',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'grayscale(100%)', shadow: 'shadow-soft', hoverEffect: 'color', aspectRatio: '16/9' },
    bestFor: ['editorial', 'minimal', 'luxury', 'fashion'],
    notRecommendedFor: ['creative', 'tech', 'fitness'],
    industries: ['fashion', 'editorial', 'luxury', 'minimal'],
    mood: ['minimal', 'editorial', 'luxury', 'classic'],
    compatibility: ['cards-editorial', 'backgrounds-light', 'radius-rounded'],
    preview: 'filter: grayscale(100%);',
  },
  {
    id: 'image-vintage',
    name: 'Vintage',
    style: 'vintage',
    description: 'Vintage-filtered image for retro feel',
    values: { borderRadius: '4px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'sepia(50%) contrast(1.2)', shadow: 'shadow-soft', hoverEffect: 'none', aspectRatio: '4/3' },
    bestFor: ['retro', 'vintage', 'nostalgic', 'creative'],
    notRecommendedFor: ['modern', 'tech', 'minimal'],
    industries: ['retro', 'vintage', 'creative', 'lifestyle'],
    mood: ['retro', 'vintage', 'nostalgic', 'warm'],
    compatibility: ['cards-soft', 'backgrounds-vintage', 'radius-soft'],
    preview: 'filter: sepia(50%) contrast(1.2);',
  },
  {
    id: 'image-circular',
    name: 'Circular',
    style: 'circular',
    description: 'Circular image for avatars and icons',
    values: { borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '1/1' },
    bestFor: ['avatars', 'icons', 'team', 'social'],
    notRecommendedFor: ['landscape', 'editorial', 'hero'],
    industries: ['social', 'media', 'creative-agency', 'team'],
    mood: ['modern', 'friendly', 'creative'],
    compatibility: ['cards-image', 'backgrounds-light', 'radius-circle'],
    preview: 'border-radius: 50%;',
  },
  {
    id: 'image-card',
    name: 'Card',
    style: 'card',
    description: 'Image styled for card display',
    values: { borderRadius: '12px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-medium', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['cards', 'gallery', 'portfolio', 'product'],
    notRecommendedFor: ['hero', 'editorial', 'minimal'],
    industries: ['e-commerce', 'creative-agency', 'technology'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['cards-image', 'backgrounds-light', 'radius-rounded'],
    preview: 'border-radius: 12px; object-fit: cover;',
  },
  {
    id: 'image-hero',
    name: 'Hero',
    style: 'hero',
    description: 'Large hero image treatment',
    values: { borderRadius: '0px', objectFit: 'cover', objectPosition: 'center', overlay: 'rgba(0,0,0,0.3)', filter: 'none', shadow: 'shadow-none', hoverEffect: 'none', aspectRatio: '21/9' },
    bestFor: ['hero', 'landing', 'showcase', 'banner'],
    notRecommendedFor: ['cards', 'forms', 'compact'],
    industries: ['marketing', 'creative-agency', 'technology'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['backgrounds-image', 'section-hero', 'radius-none'],
    preview: 'border-radius: 0px; object-fit: cover;',
  },
  {
    id: 'image-product',
    name: 'Product',
    style: 'product',
    description: 'Clean product image treatment',
    values: { borderRadius: '8px', objectFit: 'contain', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '1/1' },
    bestFor: ['e-commerce', 'product', 'retail', 'shopping'],
    notRecommendedFor: ['editorial', 'luxury', 'creative'],
    industries: ['e-commerce', 'retail', 'shopping', 'product'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['cards-product', 'backgrounds-light', 'radius-rounded'],
    preview: 'border-radius: 8px; object-fit: contain;',
  },
  {
    id: 'image-portrait',
    name: 'Portrait',
    style: 'portfolio',
    description: 'Portrait-oriented image for portfolio',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '3/4' },
    bestFor: ['portfolio', 'photography', 'art', 'gallery'],
    notRecommendedFor: ['landscape', 'e-commerce', 'minimal'],
    industries: ['photography', 'creative-agency', 'art', 'portfolio'],
    mood: ['creative', 'artistic', 'expressive', 'modern'],
    compatibility: ['cards-portfolio', 'backgrounds-light', 'radius-rounded'],
    preview: 'border-radius: 8px; aspect-ratio: 3/4;',
  },
  {
    id: 'image-landscape',
    name: 'Landscape',
    style: 'landscape',
    description: 'Landscape-oriented image for headers',
    values: { borderRadius: '8px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-soft', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['headers', 'hero', 'landing', 'gallery'],
    notRecommendedFor: ['portrait', 'minimal', 'editorial'],
    industries: ['travel', 'photography', 'creative-agency'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['cards-image', 'backgrounds-image', 'radius-rounded'],
    preview: 'border-radius: 8px; aspect-ratio: 16/9;',
  },
  {
    id: 'image-modern',
    name: 'Modern',
    style: 'modern',
    description: 'Modern image treatment with clean lines',
    values: { borderRadius: '16px', objectFit: 'cover', objectPosition: 'center', overlay: 'none', filter: 'none', shadow: 'shadow-elevated', hoverEffect: 'scale', aspectRatio: '16/9' },
    bestFor: ['technology', 'saas', 'modern', 'creative'],
    notRecommendedFor: ['editorial', 'vintage', 'brutalist'],
    industries: ['technology', 'saas', 'creative-agency'],
    mood: ['modern', 'tech', 'clean', 'futuristic'],
    compatibility: ['cards-glass', 'backgrounds-tech', 'radius-tech'],
    preview: 'border-radius: 16px; object-fit: cover;',
  },
];

export const getImageTreatmentStyle = (id: string): ImageTreatmentStyle | undefined =>
  imageTreatmentStyles.find((i) => i.id === id);

export const getImageTreatmentValues = (id: string) => {
  const style = getImageTreatmentStyle(id);
  return style?.values;
};

export default imageTreatmentStyles;
