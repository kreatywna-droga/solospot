/**
 * Industry Style Presets — Complete Industry Preset Catalog
 *
 * Provides 60+ industry-specific style presets.
 */

export interface IndustryPreset {
  id: string;
  industry: string;
  audience: string;
  mood: string[];
  stylePackIds: string[];
  recommendedColors: string[];
  recommendedTypography: string[];
  recommendedComponents: string[];
  mediaStyle: string;
  ctaStyle: string;
  antiPatterns: string[];
}

export const industryPresets: IndustryPreset[] = [
  {
    id: 'ind-dental',
    industry: 'dental',
    audience: 'Patients seeking dental care',
    mood: ['clean', 'professional', 'trustworthy'],
    stylePackIds: ['sp-modern-dental-premium', 'sp-dental-wellness', 'sp-luxury-dental'],
    recommendedColors: ['#0066CC', '#0099FF', '#4DA3FF', '#F0F8FF'],
    recommendedTypography: ['Inter', 'Open Sans', 'DM Sans'],
    recommendedComponents: ['cards-soft', 'buttons-outline', 'cards-elevated'],
    mediaStyle: 'clean, professional photography',
    ctaStyle: 'solid, trustworthy',
    antiPatterns: ['luxury gold', 'dark themes', 'neon'],
  },
  {
    id: 'ind-medical',
    industry: 'medical',
    audience: 'Patients seeking healthcare',
    mood: ['clean', 'trustworthy', 'professional'],
    stylePackIds: ['sp-medical-clean'],
    recommendedColors: ['#0066CC', '#008080', '#4CAF50', '#F0F8FF'],
    recommendedTypography: ['Inter', 'Open Sans', 'Roboto'],
    recommendedComponents: ['cards-soft', 'buttons-outline', 'cards-bordered'],
    mediaStyle: 'clinical, clean photography',
    ctaStyle: 'solid, trustworthy',
    antiPatterns: ['luxury', 'dark', 'neon'],
  },
  {
    id: 'ind-law',
    industry: 'law',
    audience: 'Clients seeking legal services',
    mood: ['professional', 'trustworthy', 'authoritative'],
    stylePackIds: ['sp-law-firm-professional', 'sp-corporate-modern'],
    recommendedColors: ['#1E293B', '#475569', '#3B82F6', '#F8FAFC'],
    recommendedTypography: ['Inter', 'Playfair Display', 'Crimson Pro'],
    recommendedComponents: ['cards-bordered', 'buttons-solid', 'cards-elevated'],
    mediaStyle: 'professional, authoritative',
    ctaStyle: 'solid, professional',
    antiPatterns: ['playful', 'neon', 'casual'],
  },
  {
    id: 'ind-real-estate',
    industry: 'real-estate',
    audience: 'Buyers and sellers',
    mood: ['modern', 'professional', 'luxury'],
    stylePackIds: ['sp-real-estate-premium', 'sp-real-estate-modern'],
    recommendedColors: ['#1E293B', '#475569', '#D4A843', '#F8FAFC'],
    recommendedTypography: ['Montserrat', 'Inter', 'Playfair Display'],
    recommendedComponents: ['cards-image', 'cards-elevated', 'buttons-solid'],
    mediaStyle: 'professional photography',
    ctaStyle: 'solid, premium',
    antiPatterns: ['playful', 'casual', 'neon'],
  },
  {
    id: 'ind-restaurant',
    industry: 'restaurant',
    audience: 'Diners and food enthusiasts',
    mood: ['warm', 'inviting', 'appetizing'],
    stylePackIds: ['sp-premium-restaurant', 'sp-restaurant-bistro', 'sp-food-organic'],
    recommendedColors: ['#C2410C', '#EA580C', '#FDBA74', '#FFF7ED'],
    recommendedTypography: ['DM Serif Display', 'Nunito', 'Quicksand'],
    recommendedComponents: ['cards-soft', 'buttons-outline', 'cards-image'],
    mediaStyle: 'food photography, warm lighting',
    ctaStyle: 'warm, inviting',
    antiPatterns: ['cold', 'dark', 'corporate'],
  },
  {
    id: 'ind-hotel',
    industry: 'hotel',
    audience: 'Travelers and guests',
    mood: ['luxury', 'elegant', 'refined'],
    stylePackIds: ['sp-boutique-hotel'],
    recommendedColors: ['#1A365D', '#2B6CB0', '#63B3ED', '#F7FAFC'],
    recommendedTypography: ['Playfair Display', 'Cormorant Garamond', 'Inter'],
    recommendedComponents: ['cards-luxury', 'buttons-luxury', 'cards-elevated'],
    mediaStyle: 'luxury photography, elegant',
    ctaStyle: 'luxury, elegant',
    antiPatterns: ['casual', 'playful', 'neon'],
  },
  {
    id: 'ind-architecture',
    industry: 'architecture',
    audience: 'Clients and design enthusiasts',
    mood: ['modern', 'geometric', 'clean'],
    stylePackIds: ['sp-luxury-architecture', 'sp-architecture-modern'],
    recommendedColors: ['#44403C', '#78716C', '#D4A843', '#FAFAF9'],
    recommendedTypography: ['Montserrat', 'Space Grotesk', 'Cormorant Garamond'],
    recommendedComponents: ['cards-elevated', 'buttons-outline', 'cards-image'],
    mediaStyle: 'architectural photography',
    ctaStyle: 'modern, geometric',
    antiPatterns: ['playful', 'casual', 'soft'],
  },
  {
    id: 'ind-photography',
    industry: 'photography',
    audience: 'Clients and art enthusiasts',
    mood: ['creative', 'artistic', 'expressive'],
    stylePackIds: ['sp-minimal-portfolio', 'sp-creative-portfolio'],
    recommendedColors: ['#1A1A1A', '#FFFFFF', '#FF6B35', '#FF4500'],
    recommendedTypography: ['Oswald', 'Inter', 'Playfair Display'],
    recommendedComponents: ['cards-image', 'cards-portfolio', 'buttons-ghost'],
    mediaStyle: 'high-quality photography',
    ctaStyle: 'bold, creative',
    antiPatterns: ['corporate', 'casual', 'soft'],
  },
  {
    id: 'ind-creative-agency',
    industry: 'creative-agency',
    audience: 'Clients seeking creative services',
    mood: ['creative', 'bold', 'expressive'],
    stylePackIds: ['sp-creative-studio', 'sp-art-creative'],
    recommendedColors: ['#FF6B35', '#FF4500', '#FFD700', '#1A1A1A'],
    recommendedTypography: ['Oswald', 'Poppins', 'Space Grotesk'],
    recommendedComponents: ['cards-asymmetric', 'buttons-gradient', 'cards-portfolio'],
    mediaStyle: 'creative, bold imagery',
    ctaStyle: 'bold, gradient',
    antiPatterns: ['corporate', 'minimal', 'soft'],
  },
  {
    id: 'ind-marketing-agency',
    industry: 'marketing-agency',
    audience: 'Clients seeking marketing services',
    mood: ['modern', 'bold', 'impactful'],
    stylePackIds: ['sp-creative-studio', 'sp-tech-startup'],
    recommendedColors: ['#FF6B35', '#0066CC', '#FFD700', '#1A1A1A'],
    recommendedTypography: ['Montserrat', 'Inter', 'Bebas Neue'],
    recommendedComponents: ['cards-feature', 'buttons-gradient', 'cards-elevated'],
    mediaStyle: 'bold, impactful',
    ctaStyle: 'bold, gradient',
    antiPatterns: ['luxury', 'editorial', 'soft'],
  },
  {
    id: 'ind-saas',
    industry: 'saas',
    audience: 'Businesses and professionals',
    mood: ['modern', 'clean', 'professional'],
    stylePackIds: ['sp-saas-modern', 'sp-tech-startup'],
    recommendedColors: ['#111827', '#3B82F6', '#6B7280', '#FFFFFF'],
    recommendedTypography: ['Inter', 'Outfit', 'Plus Jakarta Sans'],
    recommendedComponents: ['cards-elevated', 'buttons-solid', 'cards-bordered'],
    mediaStyle: 'clean, professional',
    ctaStyle: 'solid, modern',
    antiPatterns: ['luxury', 'playful', 'neon'],
  },
  {
    id: 'ind-technology',
    industry: 'technology',
    audience: 'Tech enthusiasts and professionals',
    mood: ['tech', 'futuristic', 'modern'],
    stylePackIds: ['sp-dark-tech', 'sp-technology-futuristic', 'sp-tech-startup'],
    recommendedColors: ['#0A0A0A', '#0066CC', '#06B6D4', '#8B5CF6'],
    recommendedTypography: ['Space Grotesk', 'Sora', 'Geist'],
    recommendedComponents: ['cards-glass', 'buttons-gradient', 'cards-dark'],
    mediaStyle: 'futuristic, tech',
    ctaStyle: 'gradient, futuristic',
    antiPatterns: ['luxury', 'editorial', 'soft'],
  },
  {
    id: 'ind-construction',
    industry: 'construction',
    audience: 'Clients and contractors',
    mood: ['bold', 'strong', 'industrial'],
    stylePackIds: ['sp-construction-industrial'],
    recommendedColors: ['#1A1A1A', '#FF6B35', '#333333', '#FFFFFF'],
    recommendedTypography: ['Bebas Neue', 'Montserrat', 'Oswald'],
    recommendedComponents: ['cards-bordered', 'buttons-solid', 'cards-feature'],
    mediaStyle: 'industrial, bold',
    ctaStyle: 'bold, solid',
    antiPatterns: ['luxury', 'soft', 'playful'],
  },
  {
    id: 'ind-beauty',
    industry: 'beauty',
    audience: 'Clients seeking beauty services',
    mood: ['luxury', 'feminine', 'elegant'],
    stylePackIds: ['sp-beauty-rose', 'sp-luxury-fashion'],
    recommendedColors: ['#B76E79', '#D4A5A5', '#E8B4B8', '#1A1A2E'],
    recommendedTypography: ['Playfair Display', 'Cormorant Garamond', 'Fraunces'],
    recommendedComponents: ['cards-luxury', 'buttons-luxury', 'cards-soft'],
    mediaStyle: 'elegant, feminine photography',
    ctaStyle: 'luxury, elegant',
    antiPatterns: ['tech', 'corporate', 'casual'],
  },
  {
    id: 'ind-fitness',
    industry: 'fitness',
    audience: 'Fitness enthusiasts',
    mood: ['bold', 'energetic', 'active'],
    stylePackIds: ['sp-fitness-premium', 'sp-fitness-energy'],
    recommendedColors: ['#DC2626', '#FF6B35', '#FFFFFF', '#1A1A1A'],
    recommendedTypography: ['Bebas Neue', 'Montserrat', 'Oswald'],
    recommendedComponents: ['cards-feature', 'buttons-neon', 'cards-elevated'],
    mediaStyle: 'dynamic, energetic',
    ctaStyle: 'bold, energetic',
    antiPatterns: ['luxury', 'editorial', 'soft'],
  },
  {
    id: 'ind-fashion',
    industry: 'fashion',
    audience: 'Fashion enthusiasts',
    mood: ['luxury', 'fashion', 'elegant'],
    stylePackIds: ['sp-fashion-editorial', 'sp-luxury-fashion', 'sp-fashion-minimal'],
    recommendedColors: ['#000000', '#D4A843', '#B76E79', '#FAFAFA'],
    recommendedTypography: ['Bodoni Moda', 'Playfair Display', 'Didot'],
    recommendedComponents: ['cards-luxury', 'buttons-luxury', 'cards-image'],
    mediaStyle: 'high-fashion photography',
    ctaStyle: 'luxury, elegant',
    antiPatterns: ['tech', 'corporate', 'casual'],
  },
  {
    id: 'ind-travel',
    industry: 'travel',
    audience: 'Travelers and adventurers',
    mood: ['adventure', 'calm', 'fresh'],
    stylePackIds: ['sp-travel-ocean', 'sp-travel-adventure'],
    recommendedColors: ['#006994', '#0096C7', '#48BFE3', '#F0F9FF'],
    recommendedTypography: ['Outfit', 'Lora', 'Montserrat'],
    recommendedComponents: ['cards-image', 'cards-elevated', 'buttons-outline'],
    mediaStyle: 'travel photography',
    ctaStyle: 'adventure, fresh',
    antiPatterns: ['corporate', 'luxury', 'dark'],
  },
  {
    id: 'ind-finance',
    industry: 'finance',
    audience: 'Clients and investors',
    mood: ['professional', 'trustworthy', 'modern'],
    stylePackIds: ['sp-finance-premium', 'sp-finance-clean'],
    recommendedColors: ['#1E293B', '#3B82F6', '#10B981', '#F8FAFC'],
    recommendedTypography: ['Inter', 'Space Grotesk', 'DM Sans'],
    recommendedComponents: ['cards-elevated', 'buttons-solid', 'cards-bordered'],
    mediaStyle: 'professional, clean',
    ctaStyle: 'solid, professional',
    antiPatterns: ['playful', 'luxury', 'neon'],
  },
  {
    id: 'ind-education',
    industry: 'education',
    audience: 'Students and educators',
    mood: ['modern', 'clean', 'professional'],
    stylePackIds: ['sp-education-clean', 'sp-education-modern'],
    recommendedColors: ['#111827', '#3B82F6', '#6B7280', '#FFFFFF'],
    recommendedTypography: ['Inter', 'Open Sans', 'Roboto'],
    recommendedComponents: ['cards-bordered', 'buttons-solid', 'cards-elevated'],
    mediaStyle: 'clean, professional',
    ctaStyle: 'solid, modern',
    antiPatterns: ['luxury', 'playful', 'neon'],
  },
  {
    id: 'ind-local-services',
    industry: 'local-services',
    audience: 'Local community',
    mood: ['friendly', 'trustworthy', 'professional'],
    stylePackIds: ['sp-corporate-modern', 'sp-medical-clean'],
    recommendedColors: ['#1E293B', '#3B82F6', '#22C55E', '#F8FAFC'],
    recommendedTypography: ['Inter', 'Open Sans', 'DM Sans'],
    recommendedComponents: ['cards-bordered', 'buttons-solid', 'cards-soft'],
    mediaStyle: 'professional, friendly',
    ctaStyle: 'solid, trustworthy',
    antiPatterns: ['luxury', 'playful', 'neon'],
  },
];

export const getIndustryPreset = (id: string): IndustryPreset | undefined =>
  industryPresets.find((p) => p.id === id);

export const getIndustryPresetsByIndustry = (industry: string): IndustryPreset[] =>
  industryPresets.filter((p) => p.industry === industry);

export const searchIndustryPresets = (query: string): IndustryPreset[] => {
  const q = query.toLowerCase();
  return industryPresets.filter(
    (p) =>
      p.industry.toLowerCase().includes(q) ||
      p.audience.toLowerCase().includes(q) ||
      p.mood.some((m) => m.toLowerCase().includes(q))
  );
};

export default industryPresets;
