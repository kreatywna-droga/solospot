import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LivePreview } from './LivePreview';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';

describe('LivePreview', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let mockPreviewRuntime: PreviewRuntime;
  let livePreview: LivePreview;

  beforeEach(() => {
    project = {
      id: 'test-project',
      metadata: {
        id: 'test-project',
        name: 'Test Project',
        description: 'Test',
        authorId: 'author-1',
        authorName: 'Test Author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: [],
        license: 'MIT'
      },
      manifest: { name: 'test', version: '1.0.0', type: 'storefront', author: { name: 'test' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [] },
      template: {
        page1: { id: 'page1', name: 'Home', slug: '/', sections: [] }
      },
      components: {},
      theme: {
        colors: {
          primary: { name: 'primary', value: '#ff0000', type: 'color', category: 'primary' }
        }
      },
      assets: {},
      commerce: {},
      runtime: {},
      drafts: {} as AuthoringProject,
      history: [],
      draftStatus: 'clean',
      publishState: 'draft'
    } as unknown as AuthoringProject;

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    mockPreviewRuntime = {
      renderPage: () => Promise.resolve({ html: '<div>Test</div>', renderTimeMs: 10 } as PreviewRuntimeResult),
      renderSection: () => Promise.resolve({ html: '<section>Test</section>', renderTimeMs: 5 } as PreviewRuntimeResult),
      updateSession: vi.fn()
    } as unknown as PreviewRuntime;

    livePreview = new LivePreview(project, workspace, draftManager, mockPreviewRuntime);
  });

  describe('update preview', () => {
    it('should update session with project data', () => {
      livePreview.updatePreview({
        viewport: { width: 1440 }
      });

      expect(mockPreviewRuntime.updateSession).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render full preview', async () => {
      const result = await livePreview.render();

      expect(result.html).toBe('<div>Test</div>');
      expect(result.renderTimeMs).toBe(10);
    });

    it('should render section preview', async () => {
      const result = await livePreview.renderSection('page1', 'section1');

      expect(result.html).toBe('<section>Test</section>');
    });
  });

  describe('access runtime', () => {
    it('should expose preview runtime', () => {
      const runtime = livePreview.getPreviewRuntime();
      expect(runtime).toBeDefined();
    });
  });
});