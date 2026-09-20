import { describe, it, expect } from 'vitest';
import {
  hashString,
  matchAssetForSlot,
  autoFillTemplateNodes,
  computeVisualCompleteness,
} from '../DeterministicAssetMatcher';
import { getTemplateContentProfile } from '../TemplateContentProfiles';
import type { SemanticAssetSlot } from '../SemanticAssetSlots';
import type { BuilderNode } from '../../../../packages/builder-core/src';

describe('DeterministicAssetMatcher', () => {
  it('computes consistent, deterministic hash for strings', () => {
    const h1 = hashString('modern-saas::HERO_PRIMARY_IMAGE::node-123');
    const h2 = hashString('modern-saas::HERO_PRIMARY_IMAGE::node-123');
    const h3 = hashString('luxury-fashion::HERO_PRIMARY_IMAGE::node-123');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it('matches appropriate asset for a hero slot without Math.random', () => {
    const profile = getTemplateContentProfile('modern-saas');
    const slot: SemanticAssetSlot = {
      slotId: 'hero-slot',
      canonicalType: 'HERO_PRIMARY_IMAGE',
      nodeId: 'node-hero',
      nodeType: 'image',
      targetProperty: 'src',
      categoryRequirement: 'tech',
      preferredOrientation: 'landscape',
      description: 'Hero Image',
      isFilled: false,
      isPlaceholder: true,
    };
    const used = new Set<string>();
    const asset1 = matchAssetForSlot(slot, profile, used);
    expect(asset1).toBeDefined();
    expect(asset1?.id).toBe('ast-tec-001'); // Defined heroAssetId for modern-saas
  });

  it('prevents duplicate assets across multiple slots in the same section', () => {
    const profile = getTemplateContentProfile('consulting');
    const used = new Set<string>();

    const slot1: SemanticAssetSlot = {
      slotId: 'team-1',
      canonicalType: 'TEAM_PORTRAIT_01',
      nodeId: 'node-team-1',
      nodeType: 'image',
      targetProperty: 'src',
      categoryRequirement: 'people',
      preferredOrientation: 'portrait',
      description: 'Team 1',
      isFilled: false,
      isPlaceholder: true,
    };
    const slot2: SemanticAssetSlot = {
      slotId: 'team-2',
      canonicalType: 'TEAM_PORTRAIT_02',
      nodeId: 'node-team-2',
      nodeType: 'image',
      targetProperty: 'src',
      categoryRequirement: 'people',
      preferredOrientation: 'portrait',
      description: 'Team 2',
      isFilled: false,
      isPlaceholder: true,
    };

    const asset1 = matchAssetForSlot(slot1, profile, used);
    const asset2 = matchAssetForSlot(slot2, profile, used);

    expect(asset1).toBeDefined();
    expect(asset2).toBeDefined();
    expect(asset1?.id).not.toBe(asset2?.id);
  });

  it('autofills placeholder nodes and increases visual completeness score to 100%', () => {
    const testNode: BuilderNode = {
      id: 'sec-1',
      type: 'section',
      label: 'Hero Section',
      props: {},
      styles: {},
      visible: true,
      locked: false,
      order: 0,
      children: [
        {
          id: 'img-hero',
          type: 'image',
          label: 'Hero Image',
          props: { src: 'https://via.placeholder.com/800x600' },
          styles: {},
          visible: true,
          locked: false,
          order: 0,
          children: [],
        },
        {
          id: 'img-team-1',
          type: 'image',
          label: 'Team Member 1',
          props: { src: '' },
          styles: {},
          visible: true,
          locked: false,
          order: 1,
          children: [],
        },
      ],
    };

    const initialScore = computeVisualCompleteness([testNode]);
    expect(initialScore.score).toBe(0);
    expect(initialScore.placeholderSlots).toBe(2);

    const result = autoFillTemplateNodes([testNode], 'modern-saas');
    expect(result.filledCount).toBe(2);

    const postScore = computeVisualCompleteness(result.nodes);
    expect(postScore.score).toBe(100);
    expect(postScore.filledSlots).toBe(2);
    expect(postScore.placeholderSlots).toBe(0);

    // Verify original testNode was not mutated
    expect(testNode.children[0].props.src).toBe('https://via.placeholder.com/800x600');
    expect(testNode.children[1].props.src).toBe('');

    // Verify cloned result nodes have genuine Unsplash URLs
    expect(result.nodes[0].children[0].props.src).toContain('images.unsplash.com');
    expect(result.nodes[0].children[1].props.src).toContain('images.unsplash.com');
  });
});
