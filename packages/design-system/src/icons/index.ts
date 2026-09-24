/**
 * Icon Systems — Complete Icon Style Catalog
 *
 * Provides 15+ icon configurations for consistent visual language.
 */

export interface IconStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    strokeWidth: string;
    size: string;
    color: string;
    fill: string;
    borderRadius: string;
    hoverEffect: string;
    animation: string;
    library: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const iconStyles: IconStyle[] = [
  {
    id: 'icon-outline',
    name: 'Outline',
    style: 'outline',
    description: 'Clean outline icons for modern UI',
    values: { strokeWidth: '2px', size: '24px', color: '#64748B', fill: 'none', borderRadius: '4px', hoverEffect: 'color', animation: 'none', library: 'Lucide' },
    bestFor: ['navigation', 'ui', 'modern', 'clean'],
    notRecommendedFor: ['luxury', 'editorial', 'brutalist'],
    industries: ['technology', 'saas', 'medical', 'education'],
    mood: ['modern', 'clean', 'minimal', 'professional'],
    compatibility: ['buttons-outline', 'cards-soft', 'radius-rounded'],
    preview: 'stroke-width: 2px; fill: none;',
  },
  {
    id: 'icon-filled',
    name: 'Filled',
    style: 'filled',
    description: 'Solid filled icons for bold UI',
    values: { strokeWidth: '0px', size: '24px', color: '#3B82F6', fill: 'currentColor', borderRadius: '4px', hoverEffect: 'scale', animation: 'none', library: 'Heroicons' },
    bestFor: ['navigation', 'ui', 'buttons', 'badges'],
    notRecommendedFor: ['minimal', 'editorial', 'luxury'],
    industries: ['technology', 'saas', 'marketing'],
    mood: ['modern', 'bold', 'clean', 'professional'],
    compatibility: ['buttons-solid', 'cards-elevated', 'radius-rounded'],
    preview: 'fill: currentColor;',
  },
  {
    id: 'icon-duotone',
    name: 'Duotone',
    style: 'duotone',
    description: 'Duotone icons with two-tone color',
    values: { strokeWidth: '1.5px', size: '24px', color: '#6366F1', fill: 'rgba(99,102,241,0.2)', borderRadius: '4px', hoverEffect: 'color', animation: 'none', library: 'Phosphor' },
    bestFor: ['ui', 'navigation', 'modern', 'creative'],
    notRecommendedFor: ['minimal', 'editorial', 'brutalist'],
    industries: ['technology', 'creative-agency', 'marketing'],
    mood: ['modern', 'creative', 'tech', 'clean'],
    compatibility: ['buttons-gradient', 'cards-elevated', 'radius-rounded'],
    preview: 'stroke-width: 1.5px; fill: rgba(99,102,241,0.2);',
  },
  {
    id: 'icon-luxury',
    name: 'Luxury',
    style: 'luxury',
    description: 'Elegant luxury icons with gold accents',
    values: { strokeWidth: '1.5px', size: '28px', color: '#D4A843', fill: 'none', borderRadius: '2px', hoverEffect: 'glow', animation: 'none', library: 'Custom' },
    bestFor: ['luxury', 'fashion', 'beauty', 'hotel'],
    notRecommendedFor: ['tech', 'minimal', 'brutalist'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'premium', 'refined'],
    compatibility: ['buttons-luxury', 'cards-luxury', 'radius-luxury'],
    preview: 'stroke-width: 1.5px; color: #D4A843;',
  },
  {
    id: 'icon-brutalist',
    name: 'Brutalist',
    style: 'brutalist',
    description: 'Bold, heavy-brushed icons for edgy design',
    values: { strokeWidth: '3px', size: '32px', color: '#1A1A1A', fill: 'none', borderRadius: '0px', hoverEffect: 'none', animation: 'none', library: 'Custom' },
    bestFor: ['brutalist', 'edgy', 'bold', 'counter-culture'],
    notRecommendedFor: ['luxury', 'minimal', 'medical'],
    industries: ['gaming', 'music', 'art'],
    mood: ['brutalist', 'bold', 'edgy', 'aggressive'],
    compatibility: ['buttons-brutalist', 'cards-bordered', 'radius-brutalist'],
    preview: 'stroke-width: 3px; border-radius: 0px;',
  },
  {
    id: 'icon-minimal',
    name: 'Minimal',
    style: 'minimal',
    description: 'Ultra-minimal line icons for clean UI',
    values: { strokeWidth: '1px', size: '16px', color: '#94A3B8', fill: 'none', borderRadius: '2px', hoverEffect: 'color', animation: 'none', library: 'Lucide' },
    bestFor: ['minimal', 'clean', 'modern', 'dashboard'],
    notRecommendedFor: ['luxury', 'creative', 'brutalist'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['minimal', 'clean', 'modern', 'flat'],
    compatibility: ['buttons-minimal', 'cards-minimal', 'radius-minimal'],
    preview: 'stroke-width: 1px; size: 16px;',
  },
  {
    id: 'icon-creative',
    name: 'Creative',
    style: 'creative',
    description: 'Expressive, artistic icons for creative UI',
    values: { strokeWidth: '2px', size: '32px', color: '#FF6B35', fill: 'none', borderRadius: '8px', hoverEffect: 'scale', animation: 'bounce', library: 'Custom' },
    bestFor: ['creative', 'artistic', 'marketing', 'agency'],
    notRecommendedFor: ['minimal', 'corporate', 'medical'],
    industries: ['creative-agency', 'marketing', 'art'],
    mood: ['creative', 'bold', 'expressive', 'vibrant'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-artistic'],
    preview: 'stroke-width: 2px; color: #FF6B35;',
  },
  {
    id: 'icon-editorial',
    name: 'Editorial',
    style: 'editorial',
    description: 'Classic editorial icons for publishing',
    values: { strokeWidth: '1.5px', size: '24px', color: '#1E293B', fill: 'none', borderRadius: '2px', hoverEffect: 'none', animation: 'none', library: 'Custom' },
    bestFor: ['editorial', 'publishing', 'magazine', 'news'],
    notRecommendedFor: ['creative', 'luxury', 'tech'],
    industries: ['media', 'publishing', 'news', 'editorial'],
    mood: ['editorial', 'classic', 'timeless', 'professional'],
    compatibility: ['buttons-editorial', 'cards-editorial', 'radius-editorial'],
    preview: 'stroke-width: 1.5px; color: #1E293B;',
  },
  {
    id: 'icon-tech',
    name: 'Tech',
    style: 'tech',
    description: 'Angular, precise icons for technology UI',
    values: { strokeWidth: '1.5px', size: '24px', color: '#0066CC', fill: 'none', borderRadius: '4px', hoverEffect: 'color', animation: 'none', library: 'Phosphor' },
    bestFor: ['technology', 'saas', 'fintech', 'startup'],
    notRecommendedFor: ['luxury', 'editorial', 'organic'],
    industries: ['technology', 'saas', 'fintech', 'startup'],
    mood: ['tech', 'modern', 'futuristic', 'clean'],
    compatibility: ['buttons-solid', 'cards-glass', 'radius-tech'],
    preview: 'stroke-width: 1.5px; color: #0066CC;',
  },
  {
    id: 'icon-organic',
    name: 'Organic',
    style: 'organic',
    description: 'Soft, rounded icons for wellness and nature',
    values: { strokeWidth: '2px', size: '28px', color: '#34D399', fill: 'none', borderRadius: '50%', hoverEffect: 'scale', animation: 'none', library: 'Custom' },
    bestFor: ['wellness', 'nature', 'eco', 'organic'],
    notRecommendedFor: ['tech', 'luxury', 'brutalist'],
    industries: ['wellness', 'nature', 'eco', 'food'],
    mood: ['organic', 'natural', 'soft', 'warm'],
    compatibility: ['buttons-pill', 'cards-soft', 'radius-organic'],
    preview: 'stroke-width: 2px; border-radius: 50%;',
  },
  {
    id: 'icon-neon',
    name: 'Neon',
    style: 'neon',
    description: 'Glowing neon icons for cyber designs',
    values: { strokeWidth: '2px', size: '28px', color: '#06B6D4', fill: 'none', borderRadius: '4px', hoverEffect: 'glow', animation: 'pulse', library: 'Custom' },
    bestFor: ['cyber', 'neon', 'gaming', 'futuristic'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['gaming', 'technology', 'futuristic'],
    mood: ['cyber', 'neon', 'futuristic', 'bold'],
    compatibility: ['buttons-neon', 'cards-dark', 'backgrounds-dark'],
    preview: 'stroke-width: 2px; color: #06B6D4;',
  },
  {
    id: 'icon-social',
    name: 'Social',
    style: 'social',
    description: 'Friendly, approachable icons for social platforms',
    values: { strokeWidth: '2px', size: '24px', color: '#64748B', fill: 'none', borderRadius: '50%', hoverEffect: 'scale', animation: 'none', library: 'Lucide' },
    bestFor: ['social', 'community', 'messaging', 'chat'],
    notRecommendedFor: ['luxury', 'editorial', 'brutalist'],
    industries: ['social', 'community', 'messaging', 'chat'],
    mood: ['friendly', 'modern', 'warm', 'approachable'],
    compatibility: ['buttons-pill', 'cards-soft', 'radius-social'],
    preview: 'stroke-width: 2px; border-radius: 50%;',
  },
  {
    id: 'icon-ecommerce',
    name: 'E-Commerce',
    style: 'ecommerce',
    description: 'Clean, functional icons for e-commerce',
    values: { strokeWidth: '2px', size: '24px', color: '#3B82F6', fill: 'none', borderRadius: '4px', hoverEffect: 'color', animation: 'none', library: 'Heroicons' },
    bestFor: ['e-commerce', 'retail', 'shopping', 'product'],
    notRecommendedFor: ['luxury', 'editorial', 'creative'],
    industries: ['e-commerce', 'retail', 'shopping', 'product'],
    mood: ['modern', 'clean', 'professional', 'friendly'],
    compatibility: ['buttons-solid', 'cards-product', 'radius-ecommerce'],
    preview: 'stroke-width: 2px; color: #3B82F6;',
  },
  {
    id: 'icon-luxury-gold',
    name: 'Luxury Gold',
    style: 'luxury-gold',
    description: 'Gold-accented luxury icons',
    values: { strokeWidth: '1.5px', size: '32px', color: '#D4A843', fill: 'rgba(212,168,67,0.1)', borderRadius: '2px', hoverEffect: 'glow', animation: 'none', library: 'Custom' },
    bestFor: ['luxury', 'fashion', 'beauty', 'hotel'],
    notRecommendedFor: ['tech', 'minimal', 'brutalist'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'premium', 'refined'],
    compatibility: ['buttons-luxury', 'cards-luxury', 'radius-luxury'],
    preview: 'stroke-width: 1.5px; color: #D4A843;',
  },
  {
    id: 'icon-medical',
    name: 'Medical',
    style: 'medical',
    description: 'Clean, trustworthy medical icons',
    values: { strokeWidth: '2px', size: '24px', color: '#0066CC', fill: 'none', borderRadius: '4px', hoverEffect: 'color', animation: 'none', library: 'Heroicons' },
    bestFor: ['medical', 'healthcare', 'dental', 'pharmacy'],
    notRecommendedFor: ['luxury', 'creative', 'gaming'],
    industries: ['medical', 'healthcare', 'dental', 'pharmacy'],
    mood: ['clean', 'trustworthy', 'professional', 'medical'],
    compatibility: ['buttons-outline', 'cards-soft', 'radius-medical'],
    preview: 'stroke-width: 2px; color: #0066CC;',
  },
];

export const getIconStyle = (id: string): IconStyle | undefined =>
  iconStyles.find((i) => i.id === id);

export const getIconValues = (id: string) => {
  const style = getIconStyle(id);
  return style?.values;
};

export default iconStyles;
