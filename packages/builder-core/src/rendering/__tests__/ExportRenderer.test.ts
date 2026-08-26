import { describe, it, expect } from 'vitest';
import { createBuilderDocument } from '../../BuilderDocument';
import { ExportPipeline } from '../ExportPipeline';
import { SpriteSheetGenerator } from '../SpriteSheets';

describe('ExportPipeline & Generators', () => {
  it('should generate frame sequences and thumbnails', () => {
    const doc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'test-store',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    const result = ExportPipeline.executeExport(doc, [], {
      durationMs: 1000,
      fps: 30,
      width: 640,
      height: 360,
      includeSpriteSheet: true,
      includePreviewFrames: true,
    });

    expect(result.sequence.metadata.totalFrames).toBe(30);
    expect(result.sequence.frames.length).toBe(30);
    expect(result.thumbnail).toBeDefined();
    expect(result.spriteSheet?.columns).toBe(10);
    expect(result.previewFrames?.length).toBe(5);
  });

  it('should calculate sprite sheet UV rects correctly', () => {
    const sheet = SpriteSheetGenerator.calculateMetadata(20, 100, 100, 5);
    expect(sheet.columns).toBe(5);
    expect(sheet.rows).toBe(4);
    expect(sheet.totalWidth).toBe(500);
    expect(sheet.totalHeight).toBe(400);
    expect(sheet.uvs[0].uMin).toBe(0);
    expect(sheet.uvs[0].uMax).toBe(0.2);
  });
});
