import { describe, expect, it } from 'vitest';
import { IDENTITY_MATRIX_3D, RenderFrame } from '../../../../builder-core/src/rendering/RenderFrame';
import { matrix3DTo2DAffine, RenderCommandCompiler } from '../RenderCommandCompiler';

describe('RenderCommandCompiler (S11)', () => {
  it('correctly downcasts 3D Matrix4 to 2D Affine Matrix [a,b,c,d,e,f]', () => {
    const affine = matrix3DTo2DAffine(IDENTITY_MATRIX_3D);
    expect(affine).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('compiles RenderFrame nodes into clean RendererCommand list', () => {
    const mockFrame: RenderFrame = {
      id: 'frame_0_0',
      contextId: 'ctx_1',
      frameIndex: 0,
      timestampMs: 0,
      renderTimeMs: 1.5,
      nodes: new Map([
        [
          'node_rect',
          {
            nodeId: 'node_rect',
            type: 'rect',
            order: 1,
            computedProps: { backgroundColor: '#3b82f6', borderRadius: 8 },
            transformMatrix: IDENTITY_MATRIX_3D,
            opacity: 1.0,
            visible: true,
            bounds: { x: 10, y: 10, width: 200, height: 100 },
            isDirty: false,
          },
        ],
        [
          'node_text',
          {
            nodeId: 'node_text',
            type: 'text',
            order: 2,
            computedProps: { text: 'Title Text', color: '#ffffff', fontSize: 24 },
            transformMatrix: IDENTITY_MATRIX_3D,
            opacity: 0.9,
            visible: true,
            bounds: { x: 20, y: 20, width: 180, height: 30 },
            isDirty: false,
          },
        ],
        [
          'node_hidden',
          {
            nodeId: 'node_hidden',
            type: 'rect',
            order: 3,
            computedProps: {},
            transformMatrix: IDENTITY_MATRIX_3D,
            opacity: 1.0,
            visible: false,
            bounds: { x: 0, y: 0, width: 10, height: 10 },
            isDirty: false,
          },
        ],
      ]),
      nodeOrder: ['node_rect', 'node_text', 'node_hidden'],
      dirtyRegions: [],
      isCached: false,
    };

    const commands = RenderCommandCompiler.compile(mockFrame);

    expect(commands[0].type).toBe('CLEAR');
    // Hidden node should be skipped
    const drawCommands = commands.filter(
      (c) => c.type === 'DRAW_RECT' || c.type === 'DRAW_TEXT' || c.type === 'DRAW_IMAGE'
    );
    expect(drawCommands.length).toBe(2);

    expect(drawCommands[0].type).toBe('DRAW_RECT');
    expect((drawCommands[0] as any).nodeId).toBe('node_rect');

    expect(drawCommands[1].type).toBe('DRAW_TEXT');
    expect((drawCommands[1] as any).nodeId).toBe('node_text');
    expect((drawCommands[1] as any).text).toBe('Title Text');
  });
});
