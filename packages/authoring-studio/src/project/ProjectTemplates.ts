/**
 * ProjectTemplates.ts — Sprint S5 Project Templates Registry (ETAP 4)
 *
 * Template definitions for new project creation from the Welcome Screen / Startup UX.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { createBuilderDocument } from '../../../builder-core/src/BuilderDocument';

export interface ProjectTemplate {
  readonly templateId: string;
  readonly name: string;
  readonly description: string;
  readonly category: 'blank' | 'ecommerce' | 'portfolio' | 'landing';
  readonly previewImageUrl?: string;
}

export const STANDARD_PROJECT_TEMPLATES: ReadonlyArray<ProjectTemplate> = [
  {
    templateId: 'tpl-blank',
    name: 'Blank Project',
    description: 'Start with an empty canvas',
    category: 'blank',
  },
  {
    templateId: 'tpl-ecommerce',
    name: 'E-Commerce Store',
    description: 'Full product listing and cart layout',
    category: 'ecommerce',
  },
  {
    templateId: 'tpl-portfolio',
    name: 'Portfolio',
    description: 'Showcase your work with an animated gallery',
    category: 'portfolio',
  },
  {
    templateId: 'tpl-landing',
    name: 'Landing Page',
    description: 'High-converting landing page with hero animation',
    category: 'landing',
  },
];

export function instantiateTemplate(
  template: ProjectTemplate,
  projectId: string,
  tenantId: string,
  authorId: string
): BuilderDocument {
  return createBuilderDocument({
    id: projectId,
    tenantId,
    metadata: {
      storeName: template.name,
      storeSlug: template.templateId,
      locale: 'en',
      currency: 'USD',
      description: template.description,
    },
  });
}
