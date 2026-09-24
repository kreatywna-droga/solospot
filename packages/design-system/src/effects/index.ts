/**
 * Visual Effects — Complete Effect Style Catalog
 *
 * Provides 15+ visual effect configurations for interactive and dynamic UI.
 */

export interface EffectStyle {
  id: string;
  name: string;
  style: string;
  description: string;
  values: {
    type: string;
    duration: string;
    easing: string;
    delay: string;
    iterationCount: string;
    direction: string;
    fillMode: string;
    trigger: string;
  };
  bestFor: string[];
  notRecommendedFor: string[];
  industries: string[];
  mood: string[];
  compatibility: string[];
  preview: string;
}

export const effectStyles: EffectStyle[] = [
  {
    id: 'effect-none',
    name: 'None',
    style: 'none',
    description: 'No visual effect',
    values: { type: 'none', duration: '0ms', easing: 'linear', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'none', trigger: 'none' },
    bestFor: ['minimal', 'clean', 'professional'],
    notRecommendedFor: ['creative', 'gaming', 'interactive'],
    industries: ['all'],
    mood: ['modern', 'minimal', 'clean', 'professional'],
    compatibility: ['all'],
    preview: 'animation: none;',
  },
  {
    id: 'effect-fade',
    name: 'Fade',
    style: 'fade',
    description: 'Smooth fade in/out effect',
    values: { type: 'fade', duration: '300ms', easing: 'ease-in-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'scroll' },
    bestFor: ['scroll reveal', 'transitions', 'modals', 'tooltips'],
    notRecommendedFor: ['brutalist', 'minimal', 'editorial'],
    industries: ['technology', 'saas', 'creative-agency'],
    mood: ['modern', 'clean', 'smooth', 'professional'],
    compatibility: ['cards-elevated', 'buttons-solid', 'radius-rounded'],
    preview: 'animation: fade 300ms ease-in-out;',
  },
  {
    id: 'effect-slide',
    name: 'Slide',
    style: 'slide',
    description: 'Slide in/out effect',
    values: { type: 'slide', duration: '400ms', easing: 'ease-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'scroll' },
    bestFor: ['navigation', 'menus', 'modals', 'toasts'],
    notRecommendedFor: ['minimal', 'editorial', 'luxury'],
    industries: ['technology', 'saas', 'creative-agency'],
    mood: ['modern', 'clean', 'dynamic', 'professional'],
    compatibility: ['cards-elevated', 'buttons-solid', 'radius-rounded'],
    preview: 'animation: slide 400ms ease-out;',
  },
  {
    id: 'effect-bounce',
    name: 'Bounce',
    style: 'bounce',
    description: 'Bouncing effect for playful UI',
    values: { type: 'bounce', duration: '500ms', easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', delay: '0ms', iterationCount: 'infinite', direction: 'alternate', fillMode: 'both', trigger: 'hover' },
    bestFor: ['buttons', 'notifications', 'playful UI', 'creative'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['creative-agency', 'marketing', 'gaming'],
    mood: ['playful', 'creative', 'bold', 'modern'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-rounded'],
    preview: 'animation: bounce 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);',
  },
  {
    id: 'effect-pulse',
    name: 'Pulse',
    style: 'pulse',
    description: 'Pulsing effect for attention-grabbing elements',
    values: { type: 'pulse', duration: '2000ms', easing: 'ease-in-out', delay: '0ms', iterationCount: 'infinite', direction: 'normal', fillMode: 'both', trigger: 'hover' },
    bestFor: ['cta', 'notifications', 'badges', 'neon'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['technology', 'gaming', 'creative-agency'],
    mood: ['modern', 'bold', 'impactful', 'neon'],
    compatibility: ['buttons-neon', 'cards-dark', 'backgrounds-dark'],
    preview: 'animation: pulse 2000ms ease-in-out infinite;',
  },
  {
    id: 'effect-glow',
    name: 'Glow',
    style: 'glow',
    description: 'Glowing effect for neon and futuristic UI',
    values: { type: 'glow', duration: '1000ms', easing: 'ease-in-out', delay: '0ms', iterationCount: 'infinite', direction: 'alternate', fillMode: 'both', trigger: 'hover' },
    bestFor: ['neon', 'cyber', 'futuristic', 'gaming'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['gaming', 'technology', 'futuristic'],
    mood: ['cyber', 'neon', 'futuristic', 'bold'],
    compatibility: ['buttons-neon', 'cards-dark', 'backgrounds-dark'],
    preview: 'animation: glow 1000ms ease-in-out infinite;',
  },
  {
    id: 'effect-shimmer',
    name: 'Shimmer',
    style: 'shimmer',
    description: 'Shimmer/skeleton loading effect',
    values: { type: 'shimmer', duration: '1500ms', easing: 'linear', delay: '0ms', iterationCount: 'infinite', direction: 'alternate', fillMode: 'both', trigger: 'load' },
    bestFor: ['loading', 'skeleton', 'placeholder', 'content'],
    notRecommendedFor: ['luxury', 'editorial', 'minimal'],
    industries: ['technology', 'saas', 'media'],
    mood: ['modern', 'clean', 'professional', 'dynamic'],
    compatibility: ['cards-elevated', 'buttons-solid', 'radius-rounded'],
    preview: 'animation: shimmer 1500ms linear infinite;',
  },
  {
    id: 'effect-rotate',
    name: 'Rotate',
    style: 'rotate',
    description: 'Rotation effect for icons and elements',
    values: { type: 'rotate', duration: '1000ms', easing: 'ease-in-out', delay: '0ms', iterationCount: 'infinite', direction: 'normal', fillMode: 'both', trigger: 'hover' },
    bestFor: ['loading', 'icons', 'creative', 'interactive'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['technology', 'creative-agency', 'gaming'],
    mood: ['modern', 'creative', 'dynamic', 'tech'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-rounded'],
    preview: 'animation: rotate 1000ms ease-in-out infinite;',
  },
  {
    id: 'effect-scale',
    name: 'Scale',
    style: 'scale',
    description: 'Scale up/down effect for hover states',
    values: { type: 'scale', duration: '200ms', easing: 'ease-in-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'hover' },
    bestFor: ['buttons', 'cards', 'images', 'interactive'],
    notRecommendedFor: ['editorial', 'luxury', 'brutalist'],
    industries: ['technology', 'saas', 'e-commerce'],
    mood: ['modern', 'clean', 'interactive', 'friendly'],
    compatibility: ['buttons-solid', 'cards-elevated', 'radius-rounded'],
    preview: 'animation: scale 200ms ease-in-out;',
  },
  {
    id: 'effect-flip',
    name: 'Flip',
    style: 'flip',
    description: 'Flip effect for cards and elements',
    values: { type: 'flip', duration: '600ms', easing: 'ease-in-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'hover' },
    bestFor: ['cards', 'gallery', 'portfolio', 'interactive'],
    notRecommendedFor: ['minimal', 'editorial', 'medical'],
    industries: ['creative-agency', 'e-commerce', 'technology'],
    mood: ['modern', 'creative', 'dynamic', 'interactive'],
    compatibility: ['cards-asymmetric', 'buttons-gradient', 'radius-rounded'],
    preview: 'animation: flip 600ms ease-in-out;',
  },
  {
    id: 'effect-morph',
    name: 'Morph',
    style: 'morph',
    description: 'Morphing effect for creative shapes',
    values: { type: 'morph', duration: '2000ms', easing: 'ease-in-out', delay: '0ms', iterationCount: 'infinite', direction: 'alternate', fillMode: 'both', trigger: 'load' },
    bestFor: ['creative', 'artistic', 'landing', 'hero'],
    notRecommendedFor: ['minimal', 'editorial', 'medical'],
    industries: ['creative-agency', 'marketing', 'art'],
    mood: ['creative', 'artistic', 'expressive', 'bold'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-artistic'],
    preview: 'animation: morph 2000ms ease-in-out infinite;',
  },
  {
    id: 'effect-parallax',
    name: 'Parallax',
    style: 'parallax',
    description: 'Parallax scrolling effect for depth',
    values: { type: 'parallax', duration: '1000ms', easing: 'ease-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'scroll' },
    bestFor: ['landing', 'hero', 'gallery', 'portfolio'],
    notRecommendedFor: ['minimal', 'dashboard', 'forms'],
    industries: ['creative-agency', 'marketing', 'technology'],
    mood: ['modern', 'bold', 'impactful', 'dynamic'],
    compatibility: ['backgrounds-image', 'section-hero', 'radius-rounded'],
    preview: 'animation: parallax 1000ms ease-out;',
  },
  {
    id: 'effect-elastic',
    name: 'Elastic',
    style: 'elastic',
    description: 'Elastic spring effect for playful UI',
    values: { type: 'elastic', duration: '600ms', easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'hover' },
    bestFor: ['buttons', 'cards', 'notifications', 'creative'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['creative-agency', 'marketing', 'gaming'],
    mood: ['playful', 'creative', 'bold', 'modern'],
    compatibility: ['buttons-gradient', 'cards-asymmetric', 'radius-rounded'],
    preview: 'animation: elastic 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55);',
  },
  {
    id: 'effect-glitch',
    name: 'Glitch',
    style: 'glitch',
    description: 'Glitch effect for cyber and retro designs',
    values: { type: 'glitch', duration: '500ms', easing: 'steps(2)', delay: '0ms', iterationCount: 'infinite', direction: 'alternate', fillMode: 'both', trigger: 'hover' },
    bestFor: ['cyber', 'gaming', 'retro', 'creative'],
    notRecommendedFor: ['luxury', 'editorial', 'medical'],
    industries: ['gaming', 'technology', 'creative-agency'],
    mood: ['cyber', 'glitch', 'retro', 'edgy'],
    compatibility: ['buttons-neon', 'cards-dark', 'backgrounds-dark'],
    preview: 'animation: glitch 500ms steps(2) infinite;',
  },
  {
    id: 'effect-ripple',
    name: 'Ripple',
    style: 'ripple',
    description: 'Ripple effect for click interactions',
    values: { type: 'ripple', duration: '400ms', easing: 'ease-out', delay: '0ms', iterationCount: '1', direction: 'normal', fillMode: 'both', trigger: 'click' },
    bestFor: ['buttons', 'cards', 'interactive', 'material'],
    notRecommendedFor: ['luxury', 'editorial', 'brutalist'],
    industries: ['technology', 'saas', 'material-design'],
    mood: ['modern', 'clean', 'interactive', 'professional'],
    compatibility: ['buttons-solid', 'cards-elevated', 'radius-rounded'],
    preview: 'animation: ripple 400ms ease-out;',
  },
];

export const getEffectStyle = (id: string): EffectStyle | undefined =>
  effectStyles.find((e) => e.id === id);

export const getEffectValues = (id: string) => {
  const style = getEffectStyle(id);
  return style?.values;
};

export default effectStyles;
