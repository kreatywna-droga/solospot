/**
 * ExperienceTypes.ts — SoloSpot Experience Library v2.0 Domain Model
 *
 * Pure data types for Experiences.
 * Zero UI imports, zero React code.
 */

import type { BuilderNode } from '../../../packages/builder-core/src/BuilderDocument';
import type { AssetSlotType } from '../assets/AssetTypes';

export type ExperienceType =
  | 'website'
  | 'hero'
  | 'section'
  | 'interactive'
  | 'background'
  | 'effect'
  | 'motion';

export type ExperienceSource = 'builtin' | 'user' | 'imported' | 'generated' | 'provider';

export type ExperienceMood =
  | 'dark'
  | 'light'
  | 'minimal'
  | 'editorial'
  | 'cinematic'
  | 'bold'
  | 'elegant'
  | 'futuristic'
  | 'playful'
  | 'corporate'
  | 'luxury'
  | 'creative'
  | 'vibrant'
  | 'modern';

export type ExperienceMotionLevel =
  | 'static'
  | 'subtle'
  | 'animated'
  | 'scroll'
  | 'interactive'
  | 'cinematic';

export type ExperienceIndustry =
  | 'saas'
  | 'agency'
  | 'portfolio'
  | 'ecommerce'
  | 'technology'
  | 'creative'
  | 'finance'
  | 'health'
  | 'hospitality'
  | 'education'
  | 'services'
  | 'product'
  | 'events'
  | 'restaurant'
  | 'general';

export interface AssetSlotDefinition {
  id: string;
  label: string;
  slotType: AssetSlotType;
  targetNodeId?: string;
  recommendedDimensions?: { width: number; height: number };
  description?: string;
}

export interface ExperienceCapabilityRequirements {
  backgroundVideo?: boolean;
  videoBackground?: boolean;
  scrollAnimation?: boolean;
  sticky?: boolean;
  gradient?: boolean;
  perspective3d?: boolean;
  assetSlots?: boolean;
  glassmorphism?: boolean;
  customLayout?: boolean;
}

export interface ExperienceItem {
  id: string;
  name: string;
  title?: string;
  type: ExperienceType;
  category: string; // e.g. 'hero', 'features', 'bento', 'interactive', 'background', etc.
  description: string;
  tagline?: string;
  badge?: string;
  source: ExperienceSource;
  author?: string;
  schemaVersion: string; // e.g. '2.0.0'
  contentVersion: string; // e.g. '2.0.0'
  mood?: ExperienceMood;
  motionLevel?: ExperienceMotionLevel;
  motion?: ExperienceMotionLevel;
  industry?: (ExperienceIndustry | string)[];
  tags: string[];
  previewClass?: string;
  capabilities?: ExperienceCapabilityRequirements;
  assetSlots?: AssetSlotDefinition[];
  createNode: () => BuilderNode;
  nodes?: BuilderNode[];
  sectionTemplateIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserExperiencePayload {
  name?: string;
  title?: string;
  description?: string;
  type?: ExperienceType;
  category?: string;
  mood?: ExperienceMood;
  motionLevel?: ExperienceMotionLevel;
  motion?: ExperienceMotionLevel;
  industry?: ExperienceIndustry | string;
  tags?: string[];
  node?: BuilderNode;
  nodes?: BuilderNode[];
}
