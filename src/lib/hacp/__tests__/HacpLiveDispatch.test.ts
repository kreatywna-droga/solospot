import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { BuilderCommand } from '../../../../packages/builder-core/src';

describe('HacpBridge — Live Dispatch for Design System', () => {
  let bridge: HacpBridge;
  let mockDoc: any;
  let liveDispatch: vi.MockedFn<(command: BuilderCommand) => void>;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();
    liveDispatch = vi.fn();
    bridge.setLiveDispatch(liveDispatch as any);
    mockDoc = {
      id: 'test-store',
      tenantId: 'tenant-test',
      theme: {
        primaryColor: '#D9A86C',
        secondaryColor: '#F2C27F',
        backgroundColor: '#090910',
        font: 'Inter',
        appliedStylePackId: null,
        tokens: {},
      },
      pages: [
        {
          id: 'page-1',
          sections: [
            {
              id: 'sec-1',
              type: 'section',
              label: 'Hero',
              styles: {},
              props: {},
              children: [],
              order: 0,
              visible: true,
            },
          ],
        },
      ],
    };
  });

  it('apply_design_style dispatches UPDATE_THEME to live context', async () => {
    const toolCall = {
      id: 'tool-1',
      name: 'apply_design_style',
      arguments: { stylePackId: 'sp-medical-clean' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).toHaveBeenCalledTimes(1);
    expect(liveDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_THEME',
        theme: expect.objectContaining({
          primaryColor: expect.any(String),
          font: expect.any(String),
        }),
      })
    );
  });

  it('apply_color_palette dispatches UPDATE_THEME to live context', async () => {
    const toolCall = {
      id: 'tool-2',
      name: 'apply_color_palette',
      arguments: { paletteId: 'mono-black-white' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).toHaveBeenCalledTimes(1);
    expect(liveDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_THEME',
        theme: expect.objectContaining({
          primaryColor: '#000000',
          secondaryColor: '#333333',
          backgroundColor: '#FFFFFF',
        }),
      })
    );
  });

  it('apply_typography dispatches UPDATE_THEME to live context', async () => {
    const toolCall = {
      id: 'tool-3',
      name: 'apply_typography',
      arguments: { typographyId: 'typography-modern-minimal' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).toHaveBeenCalledTimes(1);
    expect(liveDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_THEME',
        theme: expect.objectContaining({
          font: expect.any(String),
        }),
      })
    );
  });

  it('apply_font dispatches UPDATE_THEME to live context', async () => {
    const toolCall = {
      id: 'tool-4',
      name: 'apply_font',
      arguments: { fontId: 'inter' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).toHaveBeenCalledTimes(1);
    expect(liveDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_THEME',
        theme: expect.objectContaining({
          font: 'Inter',
        }),
      })
    );
  });

  it('apply_design_combination dispatches UPDATE_THEME to live context', async () => {
    const toolCall = {
      id: 'tool-5',
      name: 'apply_design_combination',
      arguments: { combinationId: 'comb-001' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).toHaveBeenCalledTimes(1);
    expect(liveDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UPDATE_THEME',
        theme: expect.objectContaining({
          primaryColor: expect.any(String),
        }),
      })
    );
  });

  it('does not dispatch when liveDispatch is not set', async () => {
    bridge.setLiveDispatch(null as any);
    const toolCall = {
      id: 'tool-6',
      name: 'apply_design_style',
      arguments: { stylePackId: 'sp-medical-clean' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(liveDispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch when verification fails', async () => {
    const toolCall = {
      id: 'tool-7',
      name: 'apply_design_style',
      arguments: { stylePackId: 'nonexistent-pack' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, 'page-1');

    expect(result.status).toBe('FAILED');
    expect(result.verification.passed).toBe(false);
    expect(liveDispatch).not.toHaveBeenCalled();
  });
});
