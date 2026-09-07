import { describe, test, expect } from 'bun:test';
import { resolveAssetToMutationPayload, applyAssetToNode } from './AssetResolver';
import type { UniversalAsset } from './AssetTypes';

describe('AssetResolver Unit Tests', () => {
  const mockImageAsset: UniversalAsset = {
    id: 'ss_img_999',
    provider: 'shutterstock',
    providerAssetId: 'ss_999',
    type: 'image',
    previewUrl: 'https://example.com/thumb.jpg',
    sourceUrl: 'https://example.com/full.jpg',
    title: 'Luxury Fashion Interior',
    author: 'Shutterstock Contributor',
    license: {
      licenseId: 'lic_ss_123',
      attributionRequired: false,
    },
  };

  test('resolves IMAGE slot correctly', () => {
    const payload = resolveAssetToMutationPayload(mockImageAsset, 'IMAGE');
    expect(payload.props).toBeDefined();
    expect(payload.props?.src).toBe('https://example.com/full.jpg');
    expect(payload.props?.alt).toBe('Luxury Fashion Interior');
    expect(payload.props?.assetMetadata?.provider).toBe('shutterstock');
    expect(payload.props?.assetMetadata?.licenseId).toBe('lic_ss_123');
  });

  test('resolves BACKGROUND_IMAGE slot correctly', () => {
    const payload = resolveAssetToMutationPayload(mockImageAsset, 'BACKGROUND_IMAGE');
    expect(payload.styles).toBeDefined();
    expect(payload.styles?.backgroundImage).toBe('url("https://example.com/full.jpg")');
    expect(payload.styles?.backgroundSize).toBe('cover');
    expect(payload.props?.bgAssetMetadata?.provider).toBe('shutterstock');
  });

  test('resolves BACKGROUND_VIDEO slot correctly', () => {
    const mockVideoAsset: UniversalAsset = {
      id: 'ss_vid_888',
      provider: 'shutterstock',
      providerAssetId: 'ss_888',
      type: 'video',
      previewUrl: 'https://example.com/video_preview.mp4',
      sourceUrl: 'https://example.com/video_full.mp4',
      title: 'Cinematic Loop',
      author: 'Shutterstock Motion',
    };

    const payload = resolveAssetToMutationPayload(mockVideoAsset, 'BACKGROUND_VIDEO');
    expect(payload.props).toBeDefined();
    expect(payload.props?.backgroundVideoUrl).toBe('https://example.com/video_full.mp4');
    expect(payload.props?.autoplay).toBe(true);
    expect(payload.props?.muted).toBe(true);
    expect(payload.props?.loop).toBe(true);
  });

  test('dispatches node update correctly', () => {
    const actions: any[] = [];
    const dispatch = (action: any) => actions.push(action);

    applyAssetToNode(dispatch, 'node_123', mockImageAsset, 'IMAGE');

    expect(actions.length).toBe(1);
    expect(actions[0].type).toBe('UPDATE_NODE');
    expect(actions[0].nodeId).toBe('node_123');
    expect(actions[0].updates.props.src).toBe('https://example.com/full.jpg');
  });
});
