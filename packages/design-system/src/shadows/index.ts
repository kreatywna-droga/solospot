/**
 * Shadow Systems — Complete Shadow Style Catalog
 *
 * Provides 20+ shadow configurations for consistent elevation and depth.
 */

export interface ShadowStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    inner: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const shadowStyles: ShadowStyle[] = [
  {
    id: 'shadow-none',
    name: 'None',
    style: 'none',
    description: 'No shadow for flat designs',
    values: { sm: 'none', md: 'none', lg: 'none', xl: 'none', inner: 'none' },
    bestFor: ['flat design', 'minimal', 'modern'],
    notRecommendedFor: ['elevated', 'luxury', 'depth'],
    industries: ['technology', 'saas', 'minimal'],
    mood: ['modern', 'minimal', 'clean', 'flat'],
    compatibility: ['cards-minimal', 'buttons-minimal', 'backgrounds-solid'],
    preview: 'box-shadow: none;',
  },
  {
    id: 'shadow-soft',
    name: 'Soft',
    style: 'soft',
    description: 'Gentle shadow for subtle elevation',
    values: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 2px 4px rgba(0,0,0,0.06)', lg: '0 4px 8px rgba(0,0,0,0.08)', xl: '0 8px 16px rgba(0,0,0,0.1)', inner: 'inset 0 1px 2px rgba(0,0,0,0.05)' },
    bestFor: ['cards', 'buttons', 'modals', 'inputs'],
    notRecommendedFor: ['brutalist', 'luxury', 'dramatic'],
    industries: ['medical', 'wellness', 'education', 'dental'],
    mood: ['soft', 'clean', 'modern', 'friendly'],
    compatibility: ['cards-soft', 'buttons-outline', 'cards-elevated'],
    preview: 'box-shadow: 0 2px 4px rgba(0,0,0,0.06);',
  },
  {
    id: 'shadow-medium',
    name: 'Medium',
    style: 'medium',
    description: 'Standard shadow for general elevation',
    values: { sm: '0 2px 4px rgba(0,0,0,0.1)', md: '0 4px 8px rgba(0,0,0,0.12)', lg: '0 8px 16px rgba(0,0,0,0.14)', xl: '0 16px 32px rgba(0,0,0,0.16)', inner: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
    bestFor: ['cards', 'modals', 'dropdowns', 'menus'],
    notRecommendedFor: ['flat', 'minimal', 'brutalist'],
    industries: ['technology', 'saas', 'corporate', 'finance'],
    mood: ['modern', 'professional', 'clean'],
    compatibility: ['cards-elevated', 'buttons-solid', 'cards-bordered'],
    preview: 'box-shadow: 0 4px 8px rgba(0,0,0,0.12);',
  },
  {
    id: 'shadow-elevated',
    name: 'Elevated',
    style: 'elevated',
    description: 'Strong shadow for high elevation',
    values: { sm: '0 4px 8px rgba(0,0,0,0.15)', md: '0 8px 16px rgba(0,0,0,0.18)', lg: '0 16px 32px rgba(0,0,0,0.2)', xl: '0 32px 64px rgba(0,0,0,0.24)', inner: 'inset 0 4px 8px rgba(0,0,0,0.1)' },
    bestFor: ['modals', 'popovers', 'tooltips', 'floating'],
    notRecommendedFor: ['flat', 'minimal', 'soft'],
    industries: ['technology', 'creative-agency', 'marketing'],
    mood: ['modern', 'bold', 'impactful'],
    compatibility: ['cards-elevated', 'buttons-gradient', 'cards-asymmetric'],
    preview: 'box-shadow: 0 8px 16px rgba(0,0,0,0.18);',
  },
  {
    id: 'shadow-dramatic',
    name: 'Dramatic',
    style: 'dramatic',
    description: 'Very strong shadow for dramatic effect',
    values: { sm: '0 8px 16px rgba(0,0,0,0.25)', md: '0 16px 32px rgba(0,0,0,0.3)', lg: '0 32px 64px rgba(0,0,0,0.35)', xl: '0 64px 128px rgba(0,0,0,0.4)', inner: 'inset 0 8px 16px rgba(0,0,0,0.15)' },
    bestFor: ['hero', 'landing', 'showcase', 'featured'],
    notRecommendedFor: ['minimal', 'flat', 'soft'],
    industries: ['creative-agency', 'marketing', 'entertainment'],
    mood: ['bold', 'dramatic', 'impactful', 'modern'],
    compatibility: ['buttons-gradient', 'cards-elevated', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 16px 32px rgba(0,0,0,0.3);',
  },
  {
    id: 'shadow-luxury',
    name: 'Luxury',
    style: 'luxury',
    description: 'Refined shadow for premium designs',
    values: { sm: '0 2px 8px rgba(212,168,67,0.2)', md: '0 4px 16px rgba(212,168,67,0.25)', lg: '0 8px 32px rgba(212,168,67,0.3)', xl: '0 16px 64px rgba(212,168,67,0.35)', inner: 'inset 0 2px 4px rgba(212,168,67,0.1)' },
    bestFor: ['luxury', 'premium', 'elegant', 'fashion'],
    notRecommendedFor: ['brutalist', 'tech', 'minimal'],
    industries: ['fashion', 'hotel', 'beauty', 'luxury'],
    mood: ['luxury', 'elegant', 'premium', 'refined'],
    compatibility: ['buttons-luxury', 'cards-luxury', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 4px 16px rgba(212,168,67,0.25);',
  },
  {
    id: 'shadow-glass',
    name: 'Glass',
    style: 'glass',
    description: 'Frosted glass shadow for modern UI',
    values: { sm: '0 1px 2px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.06)', md: '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)', lg: '0 8px 16px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)', xl: '0 16px 32px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)', inner: 'inset 0 1px 2px rgba(255,255,255,0.1)' },
    bestFor: ['glass cards', 'glass modals', 'glass navigation'],
    notRecommendedFor: ['brutalist', 'flat', 'editorial'],
    industries: ['technology', 'saas', 'creative-agency'],
    mood: ['modern', 'tech', 'futuristic', 'clean'],
    compatibility: ['cards-glass', 'buttons-glass', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 4px 8px rgba(0,0,0,0.1);',
  },
  {
    id: 'shadow-dark',
    name: 'Dark',
    style: 'dark',
    description: 'Strong shadow for dark mode interfaces',
    values: { sm: '0 2px 4px rgba(0,0,0,0.4)', md: '0 4px 8px rgba(0,0,0,0.5)', lg: '0 8px 16px rgba(0,0,0,0.6)', xl: '0 16px 32px rgba(0,0,0,0.7)', inner: 'inset 0 2px 4px rgba(0,0,0,0.3)' },
    bestFor: ['dark mode', 'dark cards', 'dark modals'],
    notRecommendedFor: ['light', 'minimal', 'soft'],
    industries: ['technology', 'gaming', 'creative-agency'],
    mood: ['dark', 'modern', 'tech', 'futuristic'],
    compatibility: ['cards-dark', 'buttons-gradient', 'backgrounds-dark'],
    preview: 'box-shadow: 0 4px 8px rgba(0,0,0,0.5);',
  },
  {
    id: 'shadow-neon',
    name: 'Neon',
    style: 'neon',
    description: 'Glowing neon shadow for cyber designs',
    values: { sm: '0 0 4px rgba(0,255,255,0.5)', md: '0 0 8px rgba(0,255,255,0.5), 0 0 16px rgba(0,255,255,0.3)', lg: '0 0 16px rgba(0,255,255,0.5), 0 0 32px rgba(0,255,255,0.3)', xl: '0 0 32px rgba(0,255,255,0.5), 0 0 64px rgba(0,255,255,0.3)', inner: 'inset 0 0 4px rgba(0,255,255,0.3)' },
    bestFor: ['cyber', 'neon', 'gaming', 'futuristic'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['gaming', 'technology', 'futuristic'],
    mood: ['cyber', 'neon', 'futuristic', 'bold'],
    compatibility: ['buttons-neon', 'cards-dark', 'backgrounds-dark'],
    preview: 'box-shadow: 0 0 8px rgba(0,255,255,0.5);',
  },
  {
    id: 'shadow-brutalist',
    name: 'Brutalist',
    style: 'brutalist',
    description: 'Hard, angular shadow for brutalist designs',
    values: { sm: '4px 4px 0px rgba(0,0,0,0.3)', md: '8px 8px 0px rgba(0,0,0,0.3)', lg: '12px 12px 0px rgba(0,0,0,0.3)', xl: '16px 16px 0px rgba(0,0,0,0.3)', inner: 'inset 4px 4px 0px rgba(0,0,0,0.1)' },
    bestFor: ['brutalist', 'edgy', 'bold', 'counter-culture'],
    notRecommendedFor: ['luxury', 'soft', 'minimal'],
    industries: ['gaming', 'music', 'art'],
    mood: ['brutalist', 'bold', 'edgy', 'aggressive'],
    compatibility: ['buttons-brutalist', 'cards-bordered', 'backgrounds-solid'],
    preview: 'box-shadow: 8px 8px 0px rgba(0,0,0,0.3);',
  },
  {
    id: 'shadow-soft-glow',
    name: 'Soft Glow',
    style: 'soft-glow',
    description: 'Warm glow shadow for inviting designs',
    values: { sm: '0 0 4px rgba(255,107,53,0.3)', md: '0 0 8px rgba(255,107,53,0.3)', lg: '0 0 16px rgba(255,107,53,0.3)', xl: '0 0 32px rgba(255,107,53,0.3)', inner: 'inset 0 0 4px rgba(255,107,53,0.1)' },
    bestFor: ['creative', 'warm', 'inviting', 'lifestyle'],
    notRecommendedFor: ['tech', 'corporate', 'medical'],
    industries: ['creative-agency', 'lifestyle', 'food'],
    mood: ['warm', 'creative', 'inviting', 'soft'],
    compatibility: ['buttons-gradient', 'cards-soft', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 0 8px rgba(255,107,53,0.3);',
  },
  {
    id: 'shadow-inset',
    name: 'Inset',
    style: 'inset',
    description: 'Inset shadow for embedded elements',
    values: { sm: 'inset 0 2px 4px rgba(0,0,0,0.1)', md: 'inset 0 4px 8px rgba(0,0,0,0.12)', lg: 'inset 0 8px 16px rgba(0,0,0,0.14)', xl: 'inset 0 16px 32px rgba(0,0,0,0.16)', inner: 'inset 0 2px 4px rgba(0,0,0,0.1)' },
    bestFor: ['inputs', 'text areas', 'embedded', 'panels'],
    notRecommendedFor: ['elevated', 'floating', 'hero'],
    industries: ['technology', 'saas', 'finance'],
    mood: ['modern', 'clean', 'professional'],
    compatibility: ['cards-bordered', 'buttons-outline', 'inputs'],
    preview: 'box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);',
  },
  {
    id: 'shadow-multiple',
    name: 'Multiple',
    style: 'multiple',
    description: 'Multiple layered shadows for depth',
    values: { sm: '0 1px 2px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05)', md: '0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06)', lg: '0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.08)', xl: '0 8px 16px rgba(0,0,0,0.1), 0 16px 32px rgba(0,0,0,0.1)', inner: 'inset 0 1px 2px rgba(0,0,0,0.05), inset 0 2px 4px rgba(0,0,0,0.05)' },
    bestFor: ['cards', 'modals', 'elevated elements'],
    notRecommendedFor: ['flat', 'minimal', 'brutalist'],
    industries: ['technology', 'saas', 'corporate'],
    mood: ['modern', 'professional', 'clean'],
    compatibility: ['cards-elevated', 'buttons-solid', 'cards-bordered'],
    preview: 'box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.06);',
  },
  {
    id: 'shadow-colored',
    name: 'Colored',
    style: 'colored',
    description: 'Colored shadow for vibrant designs',
    values: { sm: '0 2px 4px rgba(59,130,246,0.3)', md: '0 4px 8px rgba(59,130,246,0.3)', lg: '0 8px 16px rgba(59,130,246,0.3)', xl: '0 16px 32px rgba(59,130,246,0.3)', inner: 'inset 0 2px 4px rgba(59,130,246,0.1)' },
    bestFor: ['creative', 'tech', 'marketing', 'saas'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['technology', 'creative-agency', 'marketing'],
    mood: ['modern', 'tech', 'creative', 'bold'],
    compatibility: ['buttons-gradient', 'cards-elevated', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 4px 8px rgba(59,130,246,0.3);',
  },
  {
    id: 'shadow-subtle',
    name: 'Subtle',
    style: 'subtle',
    description: 'Very subtle shadow for minimal elevation',
    values: { sm: '0 1px 1px rgba(0,0,0,0.04)', md: '0 1px 2px rgba(0,0,0,0.06)', lg: '0 2px 4px rgba(0,0,0,0.08)', xl: '0 4px 8px rgba(0,0,0,0.1)', inner: 'inset 0 1px 1px rgba(0,0,0,0.04)' },
    bestFor: ['minimal', 'flat', 'clean', 'modern'],
    notRecommendedFor: ['dramatic', 'elevated', 'luxury'],
    industries: ['technology', 'saas', 'education'],
    mood: ['minimal', 'clean', 'modern', 'flat'],
    compatibility: ['cards-minimal', 'buttons-minimal', 'backgrounds-solid'],
    preview: 'box-shadow: 0 1px 2px rgba(0,0,0,0.06);',
  },
  {
    id: 'shadow-hover',
    name: 'Hover',
    style: 'hover',
    description: 'Interactive hover shadow for buttons and cards',
    values: { sm: '0 2px 4px rgba(0,0,0,0.1)', md: '0 4px 8px rgba(0,0,0,0.12)', lg: '0 8px 16px rgba(0,0,0,0.14)', xl: '0 12px 24px rgba(0,0,0,0.16)', inner: 'inset 0 1px 2px rgba(0,0,0,0.06)' },
    bestFor: ['hover states', 'interactive elements', 'buttons'],
    notRecommendedFor: ['static', 'flat', 'brutalist'],
    industries: ['technology', 'saas', 'e-commerce'],
    mood: ['modern', 'interactive', 'friendly'],
    compatibility: ['buttons-solid', 'cards-elevated', 'buttons-outline'],
    preview: 'box-shadow: 0 4px 8px rgba(0,0,0,0.12);',
  },
  {
    id: 'shadow-active',
    name: 'Active',
    style: 'active',
    description: 'Pressed state shadow for interactive elements',
    values: { sm: '0 1px 2px rgba(0,0,0,0.15)', md: '0 2px 4px rgba(0,0,0,0.15)', lg: '0 4px 8px rgba(0,0,0,0.15)', xl: '0 8px 16px rgba(0,0,0,0.15)', inner: 'inset 0 2px 4px rgba(0,0,0,0.2)' },
    bestFor: ['active states', 'pressed buttons', 'toggled elements'],
    notRecommendedFor: ['hover', 'elevated', 'luxury'],
    industries: ['technology', 'saas', 'e-commerce'],
    mood: ['modern', 'interactive', 'professional'],
    compatibility: ['buttons-solid', 'cards-bordered', 'buttons-pill'],
    preview: 'box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);',
  },
  {
    id: 'shadow-ambient',
    name: 'Ambient',
    style: 'ambient',
    description: 'Soft ambient shadow for atmospheric designs',
    values: { sm: '0 0 20px rgba(0,0,0,0.05)', md: '0 0 40px rgba(0,0,0,0.08)', lg: '0 0 60px rgba(0,0,0,0.1)', xl: '0 0 80px rgba(0,0,0,0.12)', inner: 'inset 0 0 20px rgba(0,0,0,0.05)' },
    bestFor: ['atmospheric', 'hero', 'landing', 'showcase'],
    notRecommendedFor: ['flat', 'minimal', 'brutalist'],
    industries: ['creative-agency', 'marketing', 'technology'],
    mood: ['modern', 'atmospheric', 'soft', 'impactful'],
    compatibility: ['cards-elevated', 'buttons-gradient', 'backgrounds-gradient'],
    preview: 'box-shadow: 0 0 40px rgba(0,0,0,0.08);',
  },
  {
    id: 'shadow-neumorphic',
    name: 'Neumorphic',
    style: 'neumorphic',
    description: 'Soft inner and outer shadow for neumorphic design',
    values: { sm: '0 3px 6px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5)', md: '0 6px 12px rgba(0,0,0,0.1), inset 0 2px 2px rgba(255,255,255,0.5)', lg: '0 12px 24px rgba(0,0,0,0.1), inset 0 4px 4px rgba(255,255,255,0.5)', xl: '0 24px 48px rgba(0,0,0,0.1), inset 0 8px 8px rgba(255,255,255,0.5)', inner: 'inset 0 3px 6px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5)' },
    bestFor: ['neumorphic UI', 'soft interfaces', 'minimal'],
    notRecommendedFor: ['brutalist', 'luxury', 'dramatic'],
    industries: ['technology', 'saas', 'modern'],
    mood: ['modern', 'soft', 'minimal', 'clean'],
    compatibility: ['cards-soft', 'buttons-outline', 'backgrounds-solid'],
    preview: 'box-shadow: 0 6px 12px rgba(0,0,0,0.1), inset 0 2px 2px rgba(255,255,255,0.5);',
  },
];

export const getShadowStyle = (id: string): ShadowStyle | undefined =>
  shadowStyles.find((s) => s.id === id);

export const getShadowValues = (id: string) => {
  const style = getShadowStyle(id);
  return style?.values;
};

export default shadowStyles;
