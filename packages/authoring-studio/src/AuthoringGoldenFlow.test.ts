import { describe, it, expect, beforeEach } from 'vitest';
import { AuthoringProject, createAuthoringProject } from './AuthoringProject';
import { TemplateEditor } from './TemplateAuthor';
import { ThemeEditor } from './ThemeAuthor';
import { ComponentEditor } from './ComponentAuthor';
import { AssetIntegration } from './AssetIntegration';
import { ValidationCenter } from './ValidationCenter';
import { MarketplacePublisher } from './MarketplacePublish';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';

describe('C10.4.9 Authoring Studio Golden Flow', () => {
  describe('Author → Publish → Install → Provision → Live Store', () => {
    it('should complete full authoring flow', async () => {
      const project = createAuthoringProject({
        name: 'Golden Flow Store',
        description: 'Test store',
        authorId: 'author-1',
        authorName: 'Test Author'
      });

      const workspace = {
        updateProject: () => {}
      } as unknown as Workspace;
      const draftManager = {} as DraftManager;

      const templateEditor = new TemplateEditor(project, workspace, draftManager);
      const themeEditor = new ThemeEditor(project, workspace, draftManager);
      const componentEditor = new ComponentEditor(project, workspace, draftManager);
      const assetIntegration = new AssetIntegration(project, workspace, draftManager);
      const validationCenter = new ValidationCenter(project, workspace, draftManager);
      const publisher = new MarketplacePublisher(project, workspace, draftManager);

      const page = templateEditor.createPage({ name: 'Home', slug: '/' });
      expect(page.id).toBeDefined();

      templateEditor.addSection(page.id, {
        type: 'hero',
        props: { title: 'Welcome' },
        slots: [],
        order: 0
      });

      themeEditor.setToken('colors', 'primary', '#7c3aed', 'color');
      themeEditor.setToken('colors', 'secondary', '#ec4899', 'color');
      themeEditor.setToken('colors', 'background', '#ffffff', 'color');
      themeEditor.setToken('colors', 'surface', '#f5f5f5', 'color');
      themeEditor.setToken('colors', 'text', '#000000', 'color');

      const component = componentEditor.createComponent({
        id: 'hero-banner',
        category: 'widget',
        displayName: 'Hero Banner'
      });
      componentEditor.addProp(component.id, {
        name: 'title',
        type: 'string',
        default: 'Welcome'
      });

      const validationResult = validationCenter.validate();
      expect(validationResult.success).toBe(true);

      const publishResult = await publisher.publish({
        author: { id: 'author-1', name: 'Test Author' },
        version: '1.0.0'
      });

      expect(publishResult.success).toBe(true);
      expect(publishResult.templateId).toBeDefined();
    });
  });

  describe('Cross-module integration', () => {
    it('should have consistent data between editors', () => {
      const project = createAuthoringProject({
        name: 'Integration Test',
        authorId: 'author-1',
        authorName: 'Test Author'
      });

      const workspace = {
        updateProject: () => {}
      } as unknown as Workspace;
      const draftManager = {} as DraftManager;

      const templateEditor = new TemplateEditor(project, workspace, draftManager);
      const componentEditor = new ComponentEditor(project, workspace, draftManager);

      const page = templateEditor.createPage({ name: 'Test Page' });
      const component = componentEditor.createComponent({
        id: 'test-component',
        category: 'atom',
        displayName: 'Test Component'
      });

      const templatePkg = templateEditor.toPackage();
      const componentPkg = componentEditor.toPackage();

      expect(templatePkg.pages).toBeDefined();
      expect(componentPkg.components['test-component']).toBeDefined();
    });
  });
});