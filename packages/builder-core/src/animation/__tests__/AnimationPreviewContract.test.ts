import { describe, it, expect } from 'vitest';
import {
  createScrollMessage,
  createHoverMessage,
  createClickMessage,
  createIntersectionMessage,
  createViewportResizeMessage,
} from '../AnimationPreviewContract';

describe('AnimationPreviewContract', () => {
  it('creates serializable scroll message', () => {
    const msg = createScrollMessage(250, 0.25, 1000);
    expect(msg.type).toBe('SCROLL_EVENT');
    expect(msg.scrollY).toBe(250);
    expect(msg.progress).toBe(0.25);
    expect(msg.timestamp).toBe(1000);
  });

  it('creates serializable hover message', () => {
    const msg = createHoverMessage('btn-hero', true, 1200);
    expect(msg.type).toBe('HOVER_EVENT');
    expect(msg.hoveredNodeIds).toEqual(['btn-hero']);
    expect(msg.activeHoverNodeId).toBe('btn-hero');
    expect(msg.isHovered).toBe(true);
  });

  it('creates serializable click message', () => {
    const msg = createClickMessage('btn-buy', 1500);
    expect(msg.type).toBe('CLICK_EVENT');
    expect(msg.clickedNodeId).toBe('btn-buy');
    expect(msg.isClicked).toBe(true);
  });

  it('creates serializable intersection message', () => {
    const msg = createIntersectionMessage('section-features', 0.8, 1800);
    expect(msg.type).toBe('INTERSECTION_EVENT');
    expect(msg.targetNodeId).toBe('section-features');
    expect(msg.visibilityRatio).toBe(0.8);
  });

  it('creates serializable viewport resize message', () => {
    const msg = createViewportResizeMessage(1440, 900, 2000);
    expect(msg.type).toBe('VIEWPORT_RESIZE_EVENT');
    expect(msg.width).toBe(1440);
    expect(msg.height).toBe(900);
  });
});
