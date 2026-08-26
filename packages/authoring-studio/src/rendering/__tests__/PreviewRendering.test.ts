import { describe, expect, it } from 'vitest';
import { createBuilderDocument, type BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../CanvasRenderSurface';
import { PreviewRendererConnector } from '../PreviewRendererConnector';
import { RenderedFrameExporter } from '../RenderedFrameExporter';

describe('Preview Rendering Integration & Export Bridge (S11 ETAP 5 & 7)', () => {
  const sampleDoc: BuilderDocument = createBuilderDocument({
    id: 'doc_s11_test',
    pages: [
      {
        id: 'page_home',
        name: 'Home',
        slug: '/',
        isHome: true,
        seo: { title: 'Home' },
        sections: [
          {
            id: 'hero_section',
            type: 'hero',
            label: 'Hero Header',
            order: 0,
            visible: true,
            locked: false,
            props: {
              x: 0,
              y: 0,
              width: 1920,
              height: 500,
              backgroundColor: '#0f172a',
            },
            children: [
              {
                id: 'hero_title',
                type: 'text',
                label: 'Title',
                order: 1,
                visible: true,
                locked: false,
                children: [],
                props: {
                  x: 100,
                  y: 100,
                  width: 600,
                  height: 80,
                  text: 'Visual Rendering Backend Active',
                  color: '#38bdf8',
                  fontSize: 32,
                },
              },
            ],
          },
        ],
      },
    ],
  });

  const mockCtx = {
    save: () => {},
    restore: () => {},
    setTransform: () => {},
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    beginPath: () => {},
    rect: () => {},
    clip: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    clearRect: () => {},
  };

  it('renders playhead position through PreviewRendererConnector cleanly', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const connector = new PreviewRendererConnector(sampleDoc, surface);

    const result1 = connector.renderPlayheadTime(0, []);
    expect(result1.frameIndex).toBe(0);
    expect(result1.commands.length).toBeGreaterThan(0);
    expect(result1.isCached).toBe(false);
    expect(result1.message.type).toBe('RENDER_FRAME_UPDATE');

    // Second render at same timestamp should hit cache
    const result2 = connector.renderPlayheadTime(0, []);
    expect(result2.isCached).toBe(true);

    // Playhead change to 500ms
    const result3 = connector.renderPlayheadTime(500, []);
    expect(result3.frameIndex).toBe(30);

    connector.destroy();
  });

  it('exports rendered frames via RenderedFrameExporter without breaking PM41 contracts', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const backend = connectorGetBackend(sampleDoc, surface);

    const exportPackage = RenderedFrameExporter.exportRenderedFrames(
      sampleDoc,
      [],
      { durationMs: 200, fps: 10, width: 1920, height: 1080 },
      backend
    );

    expect(exportPackage.coreExport.sequence).toBeDefined();
    expect(exportPackage.compiledFrames.length).toBe(2);
    expect(exportPackage.compiledFrames[0].commands.length).toBeGreaterThan(0);
  });
});

function connectorGetBackend(doc: BuilderDocument, surface: CanvasRenderSurface) {
  const connector = new PreviewRendererConnector(doc, surface);
  return connector.getRenderer();
}
