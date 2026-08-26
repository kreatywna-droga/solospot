import { describe, it, expect } from 'vitest';
import {
  createTemplateLibraryState,
  validateAnimationTemplate,
  registerTemplate,
  instantiateTemplateTimeline,
  type AnimationTemplate,
} from '../AnimationTemplateLibrary';

const mockTemplate: AnimationTemplate = {
  id: 'tmpl-hero-intro',
  title: 'Hero Section Intro',
  description: 'Entrance animation for hero banners',
  author: 'Studio Team',
  version: '1.0.0',
  preview: {
    thumbnailRatio: '16:9',
    recommendedNodeType: 'hero',
    sampleDurationMs: 1200,
  },
  templateTimeline: {
    id: 'tl-tmpl-hero',
    targetNodeId: 'node-tmpl',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip-1',
        name: 'Hero Fade',
        duration: 1000,
        delay: 0,
        tracks: [
          {
            id: 'tr-1',
            propertyKey: 'opacity',
            keyframes: [{ id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } }],
          },
        ],
      },
    ],
  },
};

describe('AnimationTemplateLibrary (PM41, ETAP 4 & DECISION-072)', () => {
  it('stores animation templates as pure data definitions (DECISION-072)', () => {
    const report = validateAnimationTemplate(mockTemplate);
    expect(report.isValid).toBe(true);

    let state = createTemplateLibraryState();
    state = registerTemplate(state, mockTemplate);

    expect(state.templates).toHaveLength(1);
    expect(state.templates[0].title).toBe('Hero Section Intro');
  });

  it('instantiates an AnimationTimeline for a target node ID from a template', () => {
    const timeline = instantiateTemplateTimeline(mockTemplate, 'sec-hero-actual');

    expect(timeline.targetNodeId).toBe('sec-hero-actual');
    expect(timeline.id).toContain('tmpl-hero-intro');
    expect(timeline.clips[0].name).toBe('Hero Fade');
  });
});
