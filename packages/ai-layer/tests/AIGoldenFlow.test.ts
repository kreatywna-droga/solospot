import { describe, it, expect, beforeEach } from 'vitest';
import { AIGoldenFlow, AIStoreResult } from '../src/AIGoldenFlow';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';

describe('AIGoldenFlow', () => {
  let goldenFlow: AIGoldenFlow;

  beforeEach(() => {
    const workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    const draftManager = {} as DraftManager;

    const previewRuntime = {
      renderPage: () => Promise.resolve({ html: '<div>AI Store</div>', renderTimeMs: 20 } as PreviewRuntimeResult),
      renderSection: () => Promise.resolve({ html: '<section>Section</section>', renderTimeMs: 5 } as PreviewRuntimeResult),
      updateSession: () => {}
    } as unknown as PreviewRuntime;

    goldenFlow = new AIGoldenFlow(workspace, draftManager, previewRuntime);
  });

  describe('create store from prompt', () => {
    it('should create store from furniture prompt', async () => {
      const result = await goldenFlow.createStoreFromPrompt('Create a furniture store');

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
    });

    it('should create store from Polish prompt', async () => {
      const result = await goldenFlow.createStoreFromPrompt('Stwórz sklep z meblami');

      expect(result.success).toBe(true);
    });
  });
});