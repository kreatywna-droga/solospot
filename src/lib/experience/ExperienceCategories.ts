/**
 * ExperienceCategories.ts — Taxonomy and Metadata Constants for Experience Library v2.0
 *
 * Pure data module — zero React components.
 * Icons are referenced by string ID and resolved dynamically by presentation layer.
 */

import type { ExperienceType, ExperienceMood, ExperienceMotionLevel } from './ExperienceTypes';

export interface ExperienceCategoryDef {
  id: string;
  label: string;
  iconId: string;
  description: string;
  typeFilter?: ExperienceType;
}

export const PRIMARY_EXPERIENCE_TYPES: { id: ExperienceType; label: string; iconId: string; description: string }[] = [
  { id: 'website', label: 'Websites', iconId: 'LayoutDashboard', description: 'Complete multi-section websites with full visual polish' },
  { id: 'hero', label: 'Heroes', iconId: 'Sparkles', description: 'Impactful, conversion-focused hero sections' },
  { id: 'section', label: 'Sections', iconId: 'Grid', description: 'Modular building blocks from features to pricing & footers' },
  { id: 'interactive', label: 'Interactive', iconId: 'MousePointerClick', description: 'Sticky storytelling, carousels, and scrollytelling' },
  { id: 'background', label: 'Backgrounds', iconId: 'Image', description: 'Atmospheric video, mesh, and dynamic ambient layers' },
  { id: 'effect', label: 'Visual Effects', iconId: 'Wand2', description: 'Glassmorphism, glow orbs, spotlights, and ambient noise' },
  { id: 'motion', label: '3D & Motion', iconId: 'Layers3D', description: 'CSS 3D perspective grids, floating stages, and spatial motion' },
];

export const EXPERIENCE_CATEGORIES: ExperienceCategoryDef[] = [
  { id: 'all', label: 'All', iconId: 'Grid', description: 'All available experiences' },
  { id: 'my-experiences', label: 'My Experiences', iconId: 'BookmarkCheck', description: 'Custom experiences saved by you' },
  { id: 'favorites', label: 'Favorites', iconId: 'Star', description: 'Experiences you have starred' },
  { id: 'website', label: 'Full Websites', iconId: 'Globe', description: 'Entire turnkey landing pages and web experiences', typeFilter: 'website' },
  { id: 'hero', label: 'Heroes', iconId: 'Sparkles', description: 'Cinematic, split, and typography hero sections', typeFilter: 'hero' },
  { id: 'interactive', label: 'Interactive', iconId: 'MousePointerClick', description: 'Dynamic carousels, sliders, and sticky showcases', typeFilter: 'interactive' },
  { id: 'background', label: 'Backgrounds', iconId: 'Image', description: 'Aurora meshes, video backgrounds, and ambient layers', typeFilter: 'background' },
  { id: 'effect', label: 'Effects & Visuals', iconId: 'Wand2', description: 'Glass, glow, grain, and spotlight visual accents', typeFilter: 'effect' },
  { id: 'motion', label: '3D & Motion', iconId: 'Layers3D', description: 'Spatial 3D transforms, depth layers, and tilt cards', typeFilter: 'motion' },
  { id: 'features', label: 'Features & Bento', iconId: 'Boxes', description: 'Product feature showcases and modern bento grids', typeFilter: 'section' },
  { id: 'services', label: 'Services', iconId: 'Compass', description: 'Service listings, offerings, and value propositions', typeFilter: 'section' },
  { id: 'pricing', label: 'Pricing', iconId: 'CreditCard', description: 'Tiers, feature comparisons, and plan tables', typeFilter: 'section' },
  { id: 'testimonials', label: 'Testimonials', iconId: 'Quote', description: 'Social proof, client reviews, and testimonials', typeFilter: 'section' },
  { id: 'gallery', label: 'Galleries', iconId: 'Images', description: 'Visual portfolios, image collages, and masonry grids', typeFilter: 'section' },
  { id: 'team', label: 'Team', iconId: 'Users', description: 'Leadership, contributor grids, and member bios', typeFilter: 'section' },
  { id: 'stats', label: 'Stats & Metrics', iconId: 'BarChart3', description: 'Numbers, performance indicators, and company metrics', typeFilter: 'section' },
  { id: 'cta', label: 'Calls to Action', iconId: 'ArrowRight', description: 'High-converting action cards and banners', typeFilter: 'section' },
  { id: 'faq', label: 'FAQ', iconId: 'HelpCircle', description: 'Accordion answers and structured help content', typeFilter: 'section' },
  { id: 'contact', label: 'Contact', iconId: 'Mail', description: 'Inquiry forms, locations, and booking modules', typeFilter: 'section' },
  { id: 'footer', label: 'Footers', iconId: 'Layers', description: 'Multi-column footers, links, and branding anchors', typeFilter: 'section' },
];

export const EXPERIENCE_MOODS: { id: ExperienceMood | 'all'; label: string }[] = [
  { id: 'all', label: 'All Moods' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'playful', label: 'Playful' },
  { id: 'corporate', label: 'Corporate' },
];

export const EXPERIENCE_MOTION_LEVELS: { id: ExperienceMotionLevel | 'all'; label: string }[] = [
  { id: 'all', label: 'All Motion' },
  { id: 'static', label: 'Static' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'animated', label: 'Animated' },
  { id: 'scroll', label: 'Scroll-driven' },
  { id: 'interactive', label: 'Interactive' },
  { id: 'cinematic', label: 'Cinematic' },
];

export const EXPERIENCE_INDUSTRIES = [
  'All',
  'SaaS',
  'Agency',
  'Portfolio',
  'E-Commerce',
  'Technology',
  'Creative',
  'Finance',
  'Health',
  'Hospitality',
  'Restaurant',
  'Education',
  'Services',
  'Product',
  'Events',
];
