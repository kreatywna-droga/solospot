import { describe, it, expect, beforeEach } from 'vitest';
import { AIValidationPreview } from '../src/AIValidationPreview';
import { ValidationCenter } from '../../authoring-studio/src/ValidationCenter';
import { LivePreview } from '../../authoring-studio/src/LivePreview';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { AuthoringProject, createAuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

describe('AIValidationPreview', () => {
  let validationPreview: AIValidationPreview;

  beforeEach(() => {
    const project = createAuthoringProject({
      name: 'Test Project',
      authorId: 'a1',
      authorName: 'Author'
    });

    const workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    const draftManager = {} as DraftManager;

    const mockPreviewRuntime = {
      renderPage: () => Promise.resolve({ html: '<div>Preview</div>', renderTimeMs: 10 } as PreviewRuntimeResult),
      renderSection: () => Promise.resolve({ html: '<section>Section</section>', renderTimeMs: 5 } as PreviewRuntimeResult),
      updateSession: () => {}
    } as unknown as PreviewRuntime;

    const validationCenter = new ValidationCenter(project, workspace, draftManager);
    const livePreview = new LivePreview(project, workspace, draftManager, mockPreviewRuntime);

    validationPreview = new AIValidationPreview(validationCenter, livePreview);
  });

  describe('validate and preview', () => {
    it('should validate project and return preview', async () => {
      const project = createAuthoringProject({
        name: 'Test',
        authorId: 'a1',
        authorName: 'A'
      });

      const result = await validationPreview.validateAndPreview(project);

      expect(result.valid).toBe(true);
      expect(result.previewHtml).toBeDefined();
    });
  });

  describe('validation status', () => {
    it('should return validation result', () => {
      const project = createAuthoringProject({
        name: 'Test',
        authorId: 'a1',
        authorName: 'A'
      });

      const result = validationPreview.getValidationStatus(project);

      expect(result.success).toBe(true);
    });
  });
});