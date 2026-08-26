import { describe, it, expect } from 'vitest';
import {
  validateImportData,
  importAnimationToNode,
} from '../AnimationImportPipeline';
import { exportAnimationTimeline } from '../AnimationExportPipeline';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-import',
    tenantId: 'tenant-imp',
    metadata: { storeName: 'Import Test', storeSlug: 'imp', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-imp',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-target-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-import-src',
  targetNodeId: 'sec-original',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade',
      duration: 500,
      delay: 0,
      tracks: [
        {
          id: 'tr-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 500, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('AnimationImportPipeline (PM41, ETAP 2 & DECISION-070)', () => {
  it('validates import payload format and version compatibility (DECISION-070)', () => {
    const exportData = exportAnimationTimeline(mockTimeline);
    const report = validateImportData(exportData);

    expect(report.isValid).toBe(true);
    expect(report.isCompatibleVersion).toBe(true);

    const invalidReport = validateImportData('{ invalid json }');
    expect(invalidReport.isValid).toBe(false);
  });

  it('safely imports timeline DTO into BuilderDocument SSOT for target node', () => {
    let doc = buildDoc();
    const exportData = exportAnimationTimeline(mockTimeline);

    const { updatedDoc, importedTimeline, report } = importAnimationToNode(
      doc,
      'sec-target-node',
      exportData
    );

    expect(report.isValid).toBe(true);
    expect(importedTimeline.targetNodeId).toBe('sec-target-node');

    const boundTimeline = inspectNodeAnimation(updatedDoc, 'sec-target-node')!;
    expect(boundTimeline).toBeDefined();
    expect(boundTimeline.clips[0].name).toBe('Fade');
  });
});
