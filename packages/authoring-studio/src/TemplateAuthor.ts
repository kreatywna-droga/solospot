import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { TemplateManifestData, TemplateManifest } from '../../template-package/src/TemplateManifest';

export interface TemplatePage {
  id: string;
  name: string;
  slug: string;
  sections: TemplateSection[];
  layout: TemplateLayout;
}

export interface TemplateSection {
  id: string;
  type: string;
  props: Record<string, unknown>;
  slots: Slot[];
  order: number;
}

export interface TemplateLayout {
  type: 'sidebar' | 'header-footer' | 'full-width';
  zones: string[];
}

export interface Slot {
  id: string;
  name: string;
  required: boolean;
  allowedTypes: string[];
}

export class TemplateEditor {
  constructor(
    private readonly project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {}

  createPage(params: { name: string; slug?: string }): TemplatePage {
    const page: TemplatePage = {
      id: `page-${Date.now()}`,
      name: params.name,
      slug: params.slug || '',
      sections: [],
      layout: { type: 'header-footer', zones: ['header', 'main', 'footer'] }
    };

    const updatedProject: AuthoringProject = {
      ...this.project,
      template: {
        ...this.project.template,
        [page.id]: page
      }
    };

    this.workspace.updateProject(updatedProject);
    return page;
  }

  addSection(pageId: string, section: Omit<TemplateSection, 'id'>): TemplateSection | null {
    const page = this.project.template[pageId] as TemplatePage | undefined;
    if (!page) return null;

    const newSection: TemplateSection = {
      ...section,
      id: `section-${Date.now()}`
    };

    const updatedPage: TemplatePage = {
      ...page,
      sections: [...page.sections, newSection]
    };

    const updatedProject: AuthoringProject = {
      ...this.project,
      template: {
        ...this.project.template,
        [pageId]: updatedPage
      }
    };

    this.workspace.updateProject(updatedProject);
    return newSection;
  }

  removeSection(pageId: string, sectionId: string): boolean {
    const page = this.project.template[pageId] as TemplatePage | undefined;
    if (!page) return false;

    const updatedPage: TemplatePage = {
      ...page,
      sections: page.sections.filter((s: TemplateSection) => s.id !== sectionId)
    };

    const updatedProject: AuthoringProject = {
      ...this.project,
      template: {
        ...this.project.template,
        [pageId]: updatedPage
      }
    };

    this.workspace.updateProject(updatedProject);
    return true;
  }

  toPackage(): TemplateManifestData {
    return {
      manifest: this.project.manifest,
      pages: this.project.template as TemplateManifestData['pages'],
      sections: {},
      components: this.project.components,
      themes: this.project.theme,
      assets: this.project.assets,
      commerce: this.project.commerce,
      runtime: this.project.runtime
    };
  }
}

export const templateEditor = new TemplateEditor(
  {} as AuthoringProject,
  {} as Workspace,
  {} as DraftManager
);