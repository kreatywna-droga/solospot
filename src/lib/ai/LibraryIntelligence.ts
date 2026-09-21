/**
 * LibraryIntelligence.ts — AI-Facing Library Discovery & Inspection Tools
 *
 * Provides searchable access to:
 * - Experience Library (270+ experiences)
 * - Section Library (20+ categories)
 * - Website Templates
 * - Typography Presets
 * - Design Presets
 * - Asset Library (via UniversalAssetLibrary)
 *
 * Each function returns compact, AI-consumable data.
 * Zero UI imports — pure data architecture.
 */

import type { ExperienceItem, ExperienceType, ExperienceMood, ExperienceMotionLevel } from '../experience/ExperienceTypes';
import { searchExperiences, getExperienceById, BUILTIN_EXPERIENCES, getUserExperiences } from '../experience/ExperienceCatalog';

// ── Experience Search & Inspection ──────────────────────────────────

export interface ExperienceSearchResult {
  id: string;
  name: string;
  type: ExperienceType;
  category: string;
  description: string;
  badge?: string;
  mood?: string;
  motionLevel?: string;
  industry?: string[];
  tags: string[];
  source: string;
}

export interface ExperienceInspection {
  id: string;
  name: string;
  type: ExperienceType;
  category: string;
  description: string;
  tagline?: string;
  badge?: string;
  mood?: string;
  motionLevel?: string;
  industry?: string[];
  tags: string[];
  source: string;
  author?: string;
  hasAssetSlots: boolean;
  assetSlotCount: number;
  hasRuntimeConfig: boolean;
  hasCapabilityRequirements: boolean;
  recommendedUseCases: string[];
}

export function searchExperienceLibrary(options: {
  query?: string;
  type?: ExperienceType | 'all';
  category?: string;
  mood?: ExperienceMood | 'all';
  motionLevel?: ExperienceMotionLevel | 'all';
  industry?: string;
  limit?: number;
}): ExperienceSearchResult[] {
  const results = searchExperiences({
    query: options.query,
    type: options.type,
    category: options.category,
    mood: options.mood,
    motionLevel: options.motionLevel,
    industry: options.industry,
  });

  return results.slice(0, options.limit || 20).map(exp => ({
    id: exp.id,
    name: exp.name,
    type: exp.type,
    category: exp.category,
    description: exp.description,
    badge: exp.badge,
    mood: exp.mood,
    motionLevel: exp.motionLevel || exp.motion,
    industry: exp.industry,
    tags: exp.tags,
    source: exp.source,
  }));
}

export function inspectExperience(experienceId: string): ExperienceInspection | null {
  const exp = getExperienceById(experienceId);
  if (!exp) return null;

  const useCases = inferUseCases(exp);

  return {
    id: exp.id,
    name: exp.name,
    type: exp.type,
    category: exp.category,
    description: exp.description,
    tagline: exp.tagline,
    badge: exp.badge,
    mood: exp.mood,
    motionLevel: exp.motionLevel || exp.motion,
    industry: exp.industry,
    tags: exp.tags,
    source: exp.source,
    author: exp.author,
    hasAssetSlots: Boolean(exp.assetSlots && exp.assetSlots.length > 0),
    assetSlotCount: exp.assetSlots?.length || 0,
    hasRuntimeConfig: Boolean(exp.runtimeConfig),
    hasCapabilityRequirements: Boolean(exp.capabilities),
    recommendedUseCases: useCases,
  };
}

export function getExperienceCategories(): Array<{ category: string; count: number; types: string[] }> {
  const categories = new Map<string, Set<string>>();
  for (const exp of BUILTIN_EXPERIENCES) {
    if (!categories.has(exp.category)) {
      categories.set(exp.category, new Set());
    }
    categories.get(exp.category)!.add(exp.type);
  }

  return Array.from(categories.entries()).map(([cat, types]) => ({
    category: cat,
    count: BUILTIN_EXPERIENCES.filter(e => e.category === cat).length,
    types: Array.from(types),
  }));
}

export function getExperienceMoods(): Array<{ mood: string; count: number }> {
  const moods = new Map<string, number>();
  for (const exp of BUILTIN_EXPERIENCES) {
    if (exp.mood) {
      moods.set(exp.mood, (moods.get(exp.mood) || 0) + 1);
    }
  }
  return Array.from(moods.entries()).map(([mood, count]) => ({ mood, count }));
}

export function getExperienceIndustries(): Array<{ industry: string; count: number }> {
  const industries = new Map<string, number>();
  for (const exp of BUILTIN_EXPERIENCES) {
    if (exp.industry) {
      for (const ind of exp.industry) {
        industries.set(ind, (industries.get(ind) || 0) + 1);
      }
    }
  }
  return Array.from(industries.entries()).map(([industry, count]) => ({ industry, count }));
}

// ── Section Library ────────────────────────────────────────────────

export interface SectionSearchResult {
  id: string;
  name: string;
  category: string;
  description: string;
  badge?: string;
  style?: string;
  tags: string[];
}

export function searchSectionLibrary(options: {
  query?: string;
  category?: string;
  limit?: number;
}): SectionSearchResult[] {
  // Import section templates dynamically
  const { ALL_SECTION_TEMPLATES } = require('../../components/builder/library/sections');

  let results = ALL_SECTION_TEMPLATES || [];

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter((s: any) =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }

  if (options.category) {
    results = results.filter((s: any) => s.category === options.category);
  }

  return results.slice(0, options.limit || 20).map((s: any) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    badge: s.badge,
    style: s.style,
    tags: s.tags || [],
  }));
}

export function getSectionCategories(): Array<{ category: string; count: number }> {
  const { ALL_SECTION_TEMPLATES } = require('../../components/builder/library/sections');
  const categories = new Map<string, number>();
  for (const s of ALL_SECTION_TEMPLATES || []) {
    categories.set(s.category, (categories.get(s.category) || 0) + 1);
  }
  return Array.from(categories.entries()).map(([category, count]) => ({ category, count }));
}

// ── Website Templates ──────────────────────────────────────────────

export interface WebsiteTemplateResult {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  badge?: string;
  style?: string;
  industry?: string[];
  tags: string[];
}

export function searchWebsiteTemplates(options: {
  query?: string;
  industry?: string;
  limit?: number;
}): WebsiteTemplateResult[] {
  const { WEBSITE_TEMPLATES } = require('../../components/builder/templates/WebsiteTemplatesData');

  let results = WEBSITE_TEMPLATES || [];

  if (options.query) {
    const q = options.query.toLowerCase();
    results = results.filter((t: any) =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tagline?.toLowerCase().includes(q) ||
      t.tags?.some((tag: string) => tag.toLowerCase().includes(q))
    );
  }

  if (options.industry) {
    results = results.filter((t: any) =>
      t.industry?.some((i: string) => i.toLowerCase().includes(options.industry!.toLowerCase()))
    );
  }

  return results.slice(0, options.limit || 10).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    tagline: t.tagline,
    badge: t.badge,
    style: t.style,
    industry: t.industry,
    tags: t.tags || [],
  }));
}

// ── Typography Presets ─────────────────────────────────────────────

export interface TypographyPreset {
  name: string;
  fontFamily: string;
  category: string;
  description: string;
}

export function getTypographyPresets(): TypographyPreset[] {
  return [
    { name: 'Inter — Clean Modern', fontFamily: 'Inter', category: 'sans-serif', description: 'Clean, modern sans-serif for UI and body text' },
    { name: 'Playfair Display — Luxury Serif', fontFamily: 'Playfair Display', category: 'serif', description: 'Elegant serif for luxury and editorial' },
    { name: 'Space Grotesk — Tech', fontFamily: 'Space Grotesk', category: 'sans-serif', description: 'Geometric sans-serif for tech and SaaS' },
    { name: 'DM Sans — Friendly', fontFamily: 'DM Sans', category: 'sans-serif', description: 'Friendly, rounded sans-serif' },
    { name: 'Crimson Pro — Editorial', fontFamily: 'Crimson Pro', category: 'serif', description: 'Classic serif for editorial and long-form' },
    { name: 'Sora — Futuristic', fontFamily: 'Sora', category: 'sans-serif', description: 'Futuristic geometric sans-serif' },
    { name: 'Cormorant Garamond — Elegant', fontFamily: 'Cormorant Garamond', category: 'serif', description: 'Elegant, high-contrast serif' },
    { name: 'Outfit — Versatile', fontFamily: 'Outfit', category: 'sans-serif', description: 'Versatile geometric sans-serif' },
    { name: 'Fraunces — Distinctive', fontFamily: 'Fraunces', category: 'serif', description: 'Distinctive display serif with soft axes' },
    { name: 'Manrope — Professional', fontFamily: 'Manrope', category: 'sans-serif', description: 'Professional semi-rounded sans-serif' },
  ];
}

// ── Design Presets ─────────────────────────────────────────────────

export interface DesignPreset {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  font: string;
  description: string;
  category: string;
}

export function getDesignPresets(): DesignPreset[] {
  return [
    {
      name: 'Premium Dark Gold',
      primaryColor: '#D9A86C', secondaryColor: '#F2C27F', accentColor: '#E8B86D',
      backgroundColor: '#0A0A0F', surfaceColor: '#141419', textColor: '#F5F1EA',
      mutedColor: '#8A8578', font: 'Inter',
      description: 'Luxury dark theme with gold accents', category: 'luxury',
    },
    {
      name: 'Clean White Minimal',
      primaryColor: '#111827', secondaryColor: '#6B7280', accentColor: '#3B82F6',
      backgroundColor: '#FFFFFF', surfaceColor: '#F9FAFB', textColor: '#111827',
      mutedColor: '#9CA3AF', font: 'Inter',
      description: 'Clean, minimal white theme', category: 'minimal',
    },
    {
      name: 'Deep Navy Professional',
      primaryColor: '#1E3A5F', secondaryColor: '#4A90D9', accentColor: '#60A5FA',
      backgroundColor: '#0F172A', surfaceColor: '#1E293B', textColor: '#F1F5F9',
      mutedColor: '#94A3B8', font: 'Inter',
      description: 'Professional navy blue theme', category: 'corporate',
    },
    {
      name: 'Warm Earth Tones',
      primaryColor: '#B45309', secondaryColor: '#D97706', accentColor: '#F59E0B',
      backgroundColor: '#FFFBEB', surfaceColor: '#FEF3C7', textColor: '#78350F',
      mutedColor: '#A16207', font: 'DM Sans',
      description: 'Warm, earthy and inviting', category: 'warm',
    },
    {
      name: 'Neon Cyber',
      primaryColor: '#06B6D4', secondaryColor: '#8B5CF6', accentColor: '#EC4899',
      backgroundColor: '#0A0A0F', surfaceColor: '#18181B', textColor: '#F5F1EA',
      mutedColor: '#71717A', font: 'Sora',
      description: 'Futuristic neon cyber theme', category: 'futuristic',
    },
    {
      name: 'Forest Green Natural',
      primaryColor: '#059669', secondaryColor: '#10B981', accentColor: '#34D399',
      backgroundColor: '#F0FDF4', surfaceColor: '#DCFCE7', textColor: '#14532D',
      mutedColor: '#16A34A', font: 'Outfit',
      description: 'Natural green theme for eco and health', category: 'natural',
    },
  ];
}

// ── Helpers ────────────────────────────────────────────────────────

function inferUseCases(exp: ExperienceItem): string[] {
  const useCases: string[] = [];

  if (exp.mood === 'luxury' || exp.mood === 'elegant') {
    useCases.push('luxury brands', 'high-end products', 'premium services');
  }
  if (exp.mood === 'futuristic' || exp.mood === 'bold') {
    useCases.push('tech startups', 'SaaS products', 'innovation');
  }
  if (exp.mood === 'corporate' || exp.mood === 'minimal') {
    useCases.push('corporate websites', 'B2B services', 'professional firms');
  }
  if (exp.mood === 'creative' || exp.mood === 'playful') {
    useCases.push('creative portfolios', 'agencies', 'design studios');
  }
  if (exp.mood === 'editorial' || exp.mood === 'cinematic') {
    useCases.push('editorial content', 'photography', 'media');
  }
  if (exp.type === 'interactive') {
    useCases.push('engaging landing pages', 'product showcases');
  }
  if (exp.type === 'background') {
    useCases.push('section backgrounds', 'hero areas', 'visual interest');
  }
  if (exp.type === 'effect') {
    useCases.push('visual effects', 'attention-grabbing elements');
  }
  if (exp.type === 'motion') {
    useCases.push('animated sections', 'dynamic content');
  }

  return useCases.length > 0 ? useCases : ['general purpose'];
}
