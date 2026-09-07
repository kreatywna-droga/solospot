import {
  BuilderNode,
  SectionNode,
  createBuilderNode,
  createSectionNode,
  generateNodeId,
} from '../../../../packages/builder-core/src';

import { ALL_SECTION_TEMPLATES } from './sections';

export type SectionCategory =
  | 'all'
  | 'hero'
  | 'about'
  | 'features'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'footer'
  | 'team'
  | 'logos'
  | 'stats'
  | 'portfolio'
  | 'blog'
  | 'newsletter'
  | 'navigation'
  | 'products';

export interface SectionTemplateItem {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  preview: string;
  badge?: string;
  tags?: string[];
  style?: string;
  industry?: string[];
  createNode: () => BuilderNode;
}

export const SECTION_TEMPLATES: SectionTemplateItem[] = ALL_SECTION_TEMPLATES;
