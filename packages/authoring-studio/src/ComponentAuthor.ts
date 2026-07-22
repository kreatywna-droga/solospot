import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { ComponentManifest, ComponentPropsSchema, ComponentCategory } from '../../component-runtime/src/ComponentTypes';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export interface AuthoredComponent {
  id: string;
  manifest: ComponentManifest;
  props: Record<string, unknown>;
  slots: ComponentSlot[];
  events: ComponentEvent[];
}

export interface ComponentSlot {
  name: string;
  allowedTypes: string[];
  min?: number;
  max?: number;
}

export interface ComponentEvent {
  name: string;
  type: string;
  handlers?: Record<string, unknown>;
}

export interface PropDefinition {
  name: string;
  type: ComponentPropsSchema['type'];
  required?: boolean;
  default?: unknown;
  options?: unknown[];
  description?: string;
  group?: string;
}

export class ComponentEditor {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {
    this.currentProject = project;
  }

  createComponent(params: {
    id: string;
    category: ComponentCategory;
    displayName: string;
    description?: string;
  }): AuthoredComponent {
    const component: AuthoredComponent = {
      id: params.id,
      manifest: {
        id: params.id,
        version: '1.0.0',
        category: params.category,
        displayName: params.displayName,
        description: params.description,
        propsSchema: {},
        runtime: { loader: async () => ({ default: () => null }) }
      },
      props: {},
      slots: [],
      events: []
    };

    const updatedComponents = {
      ...(this.currentProject.components as Record<string, AuthoredComponent>),
      [params.id]: component
    };

    this.currentProject = {
      ...this.currentProject,
      components: updatedComponents
    };

    this.workspace.updateProject(this.currentProject);
    return component;
  }

  addProp(componentId: string, prop: PropDefinition): void {
    const component = (this.currentProject.components as Record<string, AuthoredComponent>)?.[componentId];
    if (!component) return;

    const updatedComponent: AuthoredComponent = {
      ...component,
      manifest: {
        ...component.manifest,
        propsSchema: {
          ...component.manifest.propsSchema,
          [prop.name]: {
            type: prop.type,
            required: prop.required,
            default: prop.default,
            options: prop.options
          }
        }
      }
    };

    const updatedComponents = {
      ...(this.currentProject.components as Record<string, AuthoredComponent>),
      [componentId]: updatedComponent
    };

    this.currentProject = {
      ...this.currentProject,
      components: updatedComponents
    };

    this.workspace.updateProject(this.currentProject);
  }

  addSlot(componentId: string, slot: ComponentSlot): void {
    const component = (this.currentProject.components as Record<string, AuthoredComponent>)?.[componentId];
    if (!component) return;

    const updatedComponent: AuthoredComponent = {
      ...component,
      slots: [...component.slots, slot]
    };

    const updatedComponents = {
      ...(this.currentProject.components as Record<string, AuthoredComponent>),
      [componentId]: updatedComponent
    };

    this.currentProject = {
      ...this.currentProject,
      components: updatedComponents
    };

    this.workspace.updateProject(this.currentProject);
  }

  addEvent(componentId: string, event: ComponentEvent): void {
    const component = (this.currentProject.components as Record<string, AuthoredComponent>)?.[componentId];
    if (!component) return;

    const updatedComponent: AuthoredComponent = {
      ...component,
      events: [...component.events, event]
    };

    const updatedComponents = {
      ...(this.currentProject.components as Record<string, AuthoredComponent>),
      [componentId]: updatedComponent
    };

    this.currentProject = {
      ...this.currentProject,
      components: updatedComponents
    };

    this.workspace.updateProject(this.currentProject);
  }

  getComponent(id: string): AuthoredComponent | undefined {
    return (this.currentProject.components as Record<string, AuthoredComponent>)?.[id];
  }

  getAllComponents(): Record<string, AuthoredComponent> {
    return this.currentProject.components as Record<string, AuthoredComponent> || {};
  }

  updateManifest(componentId: string, manifest: ComponentManifest): void {
    const component = (this.currentProject.components as Record<string, AuthoredComponent>)?.[componentId];
    if (!component) return;

    const updatedComponent: AuthoredComponent = {
      ...component,
      manifest
    };

    const updatedComponents = {
      ...(this.currentProject.components as Record<string, AuthoredComponent>),
      [componentId]: updatedComponent
    };

    this.currentProject = {
      ...this.currentProject,
      components: updatedComponents
    };

    this.workspace.updateProject(this.currentProject);
  }

  toPackage(): TemplateManifestData {
    return {
      manifest: this.currentProject.manifest,
      pages: this.currentProject.template,
      sections: {},
      components: this.currentProject.components,
      themes: this.currentProject.theme,
      assets: this.currentProject.assets,
      commerce: this.currentProject.commerce,
      runtime: this.currentProject.runtime
    };
  }
}