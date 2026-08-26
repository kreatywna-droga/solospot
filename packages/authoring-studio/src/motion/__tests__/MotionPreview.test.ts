import { describe, expect, it } from 'vitest';
import { createBuilderDocument, type BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { CanvasRenderSurface } from '../../rendering/CanvasRenderSurface';
import { MotionPreviewConnector } from '../MotionPreviewConnector';

describe('MotionPreviewConnector Integration (S13 ETAP 6)', () => {
  const sampleDoc: BuilderDocument = createBuilderDocument({
    id: 'doc_motion_preview',
    pages: [
      {
        id: 'p1',
        name: 'Home',
        slug: '/',
        isHome: true,
        seo: { title: 'Motion Preview' },
        sections: [
          {
            id: 'node_path_target',
            type: 'rect',
            label: 'Path Target',
            order: 0,
            props: { x: 0, y: 0, width: 50, height: 50 },
            children: [],
            visible: true,
            locked: false,
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

  it('renders preview frames with registered motion paths and declarative constraints', () => {
    const surface = new CanvasRenderSurface(mockCtx, 1920, 1080);
    const connector = new MotionPreviewConnector(sampleDoc, surface);

    connector.registerMotionPath('node_path_target', {
      id: 'p1',
      orientToPath: true,
      waypoints: [
        { id: 'w0', position: { x: 0, y: 0 } },
        { id: 'w1', position: { x: 400, y: 300 } },
      ],
    });

    connector.registerConstraints('node_path_target', [
      { id: 'c1', type: 'position-clamp', positionClamp: { minX: 0, maxX: 500, minY: 0, maxY: 500 } },
    ]);

    const result = connector.renderMotionFrame(500, []);
    expect(result.frameIndex).toBe(30);
    expect(result.commands.length).toBeGreaterThan(0);

    connector.destroy();
  });
});
