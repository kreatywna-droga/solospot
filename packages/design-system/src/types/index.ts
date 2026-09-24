/**
 * Design System & Style Library — Core Types
 * 
 * Foundational type definitions for the entire design system.
 * All catalog items share these base interfaces.
 */

import type { FontCategory } from '../../../builder-core/src/fonts/FontCatalog';

// ============================================================
// Base Types — Every catalog item extends these
// ============================================================

export interface BaseCatalogItem {
  id: string;                    // Stable, unique identifier
  name: string;                  // Human-readable name
  category: string;              // High-level category
  subcategory?: string;          // Optional sub-category
  description: string;           // Description of the item
  version: string;               // Semantic version
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  tags: string[];                // Searchable tags
  metadata: Record<string, unknown>; // Extensible metadata
}

export interface Previewable {
  preview: PreviewData;
}

export interface PreviewData {
  // Visual preview configuration
  h1?: PreviewText;
  h2?: PreviewText;
  body?: PreviewText;
  button?: PreviewButton;
  card?: PreviewCard;
  background?: PreviewBackground;
  colorCombination?: PreviewColorCombo;
  // Raw data for custom rendering
  rawData?: Record<string, unknown>;
}

export interface PreviewText {
  text: string;
  style?: Record<string, unknown>;
}

export interface PreviewButton {
  label: string;
  variant: 'primary' | 'secondary' | 'tertiary' | 'cta' | 'link';
  style?: Record<string, unknown>;
}

export interface PreviewCard {
  title: string;
  description: string;
  image?: string;
  style?: Record<string, unknown>;
}

export interface PreviewBackground {
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  value: string;
  style?: Record<string, unknown>;
}

export interface PreviewColorCombo {
  background: string;
  text: string;
  accent: string;
}

// ============================================================
// Compatibility Types
// ============================================================

export interface CompatibilityRule {
  compatibleWith: string[];      // IDs of compatible items
  notRecommendedWith: string[];  // IDs of incompatible items
  rules: CompatibilityCondition[];
}

export interface CompatibilityCondition {
  type: 'requires' | 'excludes' | 'recommends' | 'warns';
  targetCategory: string;
  targetIds?: string[];
  message?: string;
  severity: 'info' | 'warning' | 'error';
}

export interface CompatibilityReport {
  itemId: string;
  checkedAgainst: string[];
  compatible: string[];
  incompatible: string[];
  warnings: CompatibilityWarning[];
  score: number; // 0-100
}

export interface CompatibilityWarning {
  type: 'missing_requirement' | 'conflict' | 'suboptimal';
  message: string;
  relatedItemId?: string;
}

// ============================================================
// Search & Filter Types
// ============================================================

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  style?: string;
  industry?: string;
  mood?: string;
  tags?: string[];
  useCase?: string;
  keyword?: string;
  sortBy?: 'name' | 'popularity' | 'recent' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: FacetCount[];
  styles: FacetCount[];
  industries: FacetCount[];
  moods: FacetCount[];
  tags: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// ============================================================
// Usage & Recommendation Types
// ============================================================

export interface UsageGuidance {
  bestUseCases: string[];
  notRecommendedUseCases: string[];
  recommendedIndustries: string[];
  antiPatterns: string[];
  tips: string[];
}

export interface RecommendationContext {
  industry?: string;
  mood?: string;
  style?: string;
  existingItems?: string[];
  userIntent?: string;
}

// ============================================================
// Versioning & Dependency Types
// ============================================================

export interface VersionedDependency {
  itemId: string;
  version: string;
  required: boolean;
}

export interface VersionedItem extends BaseCatalogItem {
  dependencies: VersionedDependency[];
  changelog: VersionChange[];
}

export interface VersionChange {
  version: string;
  date: number;
  changes: string[];
  breaking: boolean;
}

// ============================================================
// HACP Integration Types
// ============================================================

export interface HACPSearchTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  returns: string;
}

export interface HACPApplyTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  returns: string;
}

export interface HACPCapabilityCorridor {
  searchTools: HACPSearchTool[];
  applyTools: HACPApplyTool[];
  inspectTools: HACPSearchTool[];
  constraints: HACPConstraint[];
}

export interface HACPConstraint {
  type: 'read_only' | 'mutation_requires_verification' | 'no_random_selection' | 'compatibility_required';
  description: string;
}

// ============================================================
// Builder Integration Types
// ============================================================

export interface StyleApplication {
  stylePackId: string;
  targetDocumentId: string;
  options: StyleApplicationOptions;
  result: StyleApplicationResult;
}

export interface StyleApplicationOptions {
  preserveStructure: boolean;
  overrideExisting: boolean;
  applyTo: ('typography' | 'colors' | 'buttons' | 'cards' | 'radius' | 'shadows' | 'background' | 'spacing' | 'sections' | 'hero' | 'images' | 'icons' | 'effects')[];
  previewOnly?: boolean;
}

export interface StyleApplicationResult {
  success: boolean;
  applied: string[];
  skipped: string[];
  conflicts: StyleConflict[];
  warnings: string[];
  previewDocument?: unknown; // BuilderDocument for preview
}

export interface StyleConflict {
  property: string;
  existingValue: unknown;
  newValue: unknown;
  resolution: 'kept_existing' | 'applied_new' | 'merged' | 'manual';
}

// ============================================================
// Industry & Mood Types
// ============================================================

export type IndustryType = 
  | 'dental' | 'medical' | 'law' | 'real-estate' | 'restaurant' 
  | 'hotel' | 'architecture' | 'photography' | 'creative-agency' 
  | 'marketing-agency' | 'saas' | 'technology' | 'construction' 
  | 'beauty' | 'fitness' | 'fashion' | 'travel' | 'finance' 
  | 'education' | 'local-services' | 'custom';

export type MoodType = 
  | 'modern' | 'luxury' | 'minimal' | 'editorial' | 'corporate' 
  | 'creative' | 'tech' | 'wellness' | 'medical' | 'fashion' 
  | 'architecture' | 'restaurant' | 'portfolio' | 'saas' 
  | 'brutalist' | 'dark' | 'bright' | 'warm' | 'cool' 
  | 'playful' | 'serious' | 'elegant' | 'bold' | 'soft';

export type StyleCategory = 
  | 'modern' | 'luxury' | 'editorial' | 'corporate' | 'creative' 
  | 'tech' | 'minimal' | 'wellness' | 'medical' | 'fashion' 
  | 'architecture' | 'restaurant' | 'portfolio' | 'saas' 
  | 'brutalist' | 'dark' | 'high-contrast' | 'futuristic' | 'organic';

export interface IndustryPreset {
  industry: IndustryType;
  audience: string;
  mood: MoodType;
  stylePackIds: string[];
  recommendedColors: string[];
  recommendedTypography: string[];
  recommendedComponents: string[];
  mediaStyle: string;
  ctaStyle: string;
  antiPatterns: string[];
}

// ============================================================
// Export all types
// ============================================================

export type {
  FontCategory,
};