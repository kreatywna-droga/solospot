/**
 * SitePlanTypes.ts — Autonomous Website Generation Data Model
 *
 * Defines the SitePlan structure: a structured plan that bridges
 * natural-language brief → sequential HACP tool calls → complete website.
 *
 * SitePlan is the "blueprint" — not a new document model.
 * It maps directly to existing Builder commands (ADD_SECTION, UPDATE_PROPS, INSERT_NODE, etc.).
 */

// ── Industry & Purpose ──────────────────────────────────────────────

export type Industry =
  | 'restaurant'
  | 'school'
  | 'gym'
  | 'dentist'
  | 'law'
  | 'realestate'
  | 'saas'
  | 'agency'
  | 'portfolio'
  | 'ecommerce'
  | 'nonprofit'
  | 'clinic'
  | 'salon'
  | 'tech'
  | 'education'
  | 'fitness'
  | 'beauty'
  | 'other';

export type SitePurpose =
  | 'lead-generation'
  | 'portfolio'
  | 'informational'
  | 'booking'
  | 'ecommerce'
  | 'landing-page'
  | 'blog'
  | 'community';

// ── Design System ───────────────────────────────────────────────────

export interface DesignSystem {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
}

// ── Content Model ───────────────────────────────────────────────────

export interface TextContent {
  heading?: string;
  subheading?: string;
  description?: string;
  cta?: string;
  ctaHref?: string;
  items?: Array<{ label: string; description?: string }>;
}

export interface ImageSlot {
  id: string;
  role: 'hero' | 'feature' | 'team' | 'product' | 'background' | 'icon';
  query?: string;
  fallbackColor?: string;
  resolvedUrl?: string;
}

// ── Section Plan ────────────────────────────────────────────────────

export type SectionRole =
  | 'hero'
  | 'features'
  | 'about'
  | 'testimonials'
  | 'cta'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'footer'
  | 'navbar'
  | 'gallery'
  | 'team'
  | 'stats'
  | 'logos'
  | 'newsletter'
  | 'services'
  | 'portfolio'
  | 'products'
  | 'blog'
  | 'content';

export interface SectionPlan {
  id: string;
  role: SectionRole;
  label: string;
  templateType: string;
  content: TextContent;
  images: ImageSlot[];
  styles: Record<string, unknown>;
  nodes?: NodePlan[];
  experienceConfig?: Record<string, unknown>;
}

export interface NodePlan {
  id: string;
  type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'divider' | 'spacer' | 'grid' | 'container';
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  children?: NodePlan[];
}

// ── Site Plan ───────────────────────────────────────────────────────

export interface SitePlan {
  purpose: SitePurpose;
  industry: Industry;
  sections: SectionPlan[];
  designSystem: DesignSystem;
  pages: Array<{
    id: string;
    name: string;
    purpose: string;
    sections: string[];
  }>;
  metadata: {
    title: string;
    description: string;
    language: string;
    generatedAt: string;
  };
}

// ── Generation State ────────────────────────────────────────────────

export type GenerationPhase =
  | 'idle'
  | 'planning'
  | 'design-system'
  | 'sections'
  | 'content'
  | 'assets'
  | 'responsive'
  | 'verification'
  | 'complete'
  | 'error';

export interface GenerationSession {
  id: string;
  brief: string;
  plan: SitePlan | null;
  phase: GenerationPhase;
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  toolsExecuted: number;
  commandsGenerated: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  primaryColor: '#D9A86C',
  secondaryColor: '#F2C27F',
  accentColor: '#E8B98A',
  backgroundColor: '#080B10',
  surfaceColor: '#12151C',
  textColor: '#F5F5F5',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  borderRadius: '12px',
};

export const INDUSTRY_DEFAULTS: Record<Industry, Partial<SitePlan>> = {
  restaurant: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#C0392B', secondaryColor: '#E74C3C' },
  },
  school: {
    purpose: 'informational',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#2980B9', secondaryColor: '#3498DB' },
  },
  gym: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E74C3C', secondaryColor: '#C0392B' },
  },
  dentist: {
    purpose: 'booking',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#1ABC9C', secondaryColor: '#16A085' },
  },
  law: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#2C3E50', secondaryColor: '#34495E' },
  },
  realestate: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#D9A86C', secondaryColor: '#F2C27F' },
  },
  saas: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#8E44AD', secondaryColor: '#9B59B6' },
  },
  agency: {
    purpose: 'portfolio',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E67E22', secondaryColor: '#F39C12' },
  },
  portfolio: {
    purpose: 'portfolio',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#1ABC9C', secondaryColor: '#16A085' },
  },
  ecommerce: {
    purpose: 'ecommerce',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E74C3C', secondaryColor: '#C0392B' },
  },
  nonprofit: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#27AE60', secondaryColor: '#2ECC71' },
  },
  clinic: {
    purpose: 'booking',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#2980B9', secondaryColor: '#3498DB' },
  },
  salon: {
    purpose: 'booking',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E91E63', secondaryColor: '#F06292' },
  },
  tech: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#3498DB', secondaryColor: '#2980B9' },
  },
  education: {
    purpose: 'informational',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#2980B9', secondaryColor: '#3498DB' },
  },
  fitness: {
    purpose: 'lead-generation',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E74C3C', secondaryColor: '#C0392B' },
  },
  beauty: {
    purpose: 'booking',
    designSystem: { ...DEFAULT_DESIGN_SYSTEM, primaryColor: '#E91E63', secondaryColor: '#F06292' },
  },
  other: {
    purpose: 'informational',
    designSystem: DEFAULT_DESIGN_SYSTEM,
  },
};

// ── Common Section Templates ────────────────────────────────────────

export const SECTION_TEMPLATES: Record<SectionRole, string> = {
  hero: 'hero',
  features: 'feature-grid',
  about: 'content',
  testimonials: 'testimonials',
  cta: 'cta',
  pricing: 'pricing',
  faq: 'faq',
  contact: 'content',
  footer: 'footer',
  navbar: 'navbar',
  gallery: 'gallery',
  team: 'content',
  stats: 'stats',
  logos: 'logos',
  newsletter: 'newsletter',
  services: 'feature-grid',
  portfolio: 'gallery',
  products: 'product-grid',
  blog: 'blog',
  content: 'content',
};
