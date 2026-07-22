import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentEditor, AuthoredComponent, PropDefinition } from './ComponentAuthor';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';

describe('ComponentEditor', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let editor: ComponentEditor;

  beforeEach(() => {
    project = {
      id: 'test-project',
      name: 'Test Project',
      manifest: { name: 'test', version: '1.0.0' },
      template: {},
      components: {},
      theme: {},
      assets: {},
      commerce: {},
      runtime: {}
    } as unknown as AuthoringProject;

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    editor = new ComponentEditor(project, workspace, draftManager);
  });

  describe('create component', () => {
    it('should create a component with manifest', () => {
      const component = editor.createComponent({
        id: 'button',
        category: 'atom',
        displayName: 'Button',
        description: 'A clickable button'
      });

      expect(component.id).toBe('button');
      expect(component.manifest.category).toBe('atom');
      expect(component.manifest.displayName).toBe('Button');
      expect(component.props).toEqual({});
      expect(component.slots).toEqual([]);
      expect(component.events).toEqual([]);
    });

    it('should register component in project', () => {
      editor.createComponent({
        id: 'header',
        category: 'widget',
        displayName: 'Header'
      });

      const component = editor.getComponent('header');
      expect(component).toBeDefined();
    });
  });

  describe('add props', () => {
    it('should add string prop', () => {
      editor.createComponent({ id: 'test-comp', category: 'atom', displayName: 'Test' });

      editor.addProp('test-comp', { name: 'label', type: 'string' });

      const component = editor.getComponent('test-comp');
      expect(component?.manifest.propsSchema.label).toEqual({ type: 'string' });
    });

    it('should add prop with default and required', () => {
      editor.createComponent({ id: 'test-comp', category: 'atom', displayName: 'Test' });

      editor.addProp('test-comp', {
        name: 'count',
        type: 'number',
        required: true,
        default: 0
      });

      const component = editor.getComponent('test-comp');
      expect(component?.manifest.propsSchema.count).toEqual({
        type: 'number',
        required: true,
        default: 0
      });
    });
  });

  describe('add slots', () => {
    it('should add slot to component', () => {
      editor.createComponent({ id: 'test-comp', category: 'widget', displayName: 'Test' });

      editor.addSlot('test-comp', { name: 'header', allowedTypes: ['text'] });

      const component = editor.getComponent('test-comp');
      expect(component?.slots).toHaveLength(1);
      expect(component?.slots[0].name).toBe('header');
    });
  });

  describe('add events', () => {
    it('should add event to component', () => {
      editor.createComponent({ id: 'test-comp', category: 'widget', displayName: 'Test' });

      editor.addEvent('test-comp', { name: 'onClick', type: 'click' });

      const component = editor.getComponent('test-comp');
      expect(component?.events).toHaveLength(1);
    });
  });

  describe('export to package', () => {
    it('should export components to package format', () => {
      editor.createComponent({ id: 'btn', category: 'atom', displayName: 'Button' });

      const pkg = editor.toPackage();

      expect(pkg.components['btn']).toBeDefined();
    });
  });
});