import { describe, it, expect, beforeEach } from 'vitest';
import { ContentAssistant } from '../src/ContentAssistant';
import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';

describe('ContentAssistant', () => {
  let assistant: ContentAssistant;

  beforeEach(() => {
    assistant = new ContentAssistant();
  });

  describe('content generation', () => {
    it('should generate content for furniture store', () => {
      const content = assistant.generateForStoreType('furniture');

      expect(content.headline).toContain('Furniture');
      expect(content.seoTitle).toBeDefined();
    });

    it('should generate content for fashion store', () => {
      const content = assistant.generateForStoreType('fashion');

      expect(content.headline).toContain('Style');
    });

    it('should generate default for unknown type', () => {
      const content = assistant.generateForStoreType('unknown');

      expect(content.headline).toBe('Welcome to Our Store');
    });
  });

  describe('apply to page', () => {
    it('should apply content to project', () => {
      const project: AuthoringProject = {
        id: 'test',
        metadata: { id: 'test', name: 'Test', description: '', authorId: '', authorName: '', createdAt: '', updatedAt: '', version: '1.0.0', tags: [], license: '' },
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: 'storefront', description: '', author: { name: '' }, license: '', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
        template: {
          home: { id: 'home', slug: '/', name: 'Home', sections: [{ id: 'hero', props: {} }] }
        },
        components: {},
        theme: {},
        assets: {},
        commerce: {},
        runtime: {},
        drafts: {} as AuthoringProject,
        history: [],
        draftStatus: 'clean',
        publishState: 'draft'
      } as AuthoringProject;

      const content = assistant.generateForStoreType('furniture');
      const updated = assistant.applyToPage(project, 'home', content);

      expect((updated.template as Record<string, { sections: { props: { headline: string } }[] }>)['home'].sections[0].props.headline).toBe(content.headline);
    });
  });
});