import { describe, it, expect } from 'vitest';
import {
  validateExportTimeline,
  exportAnimationTimeline,
  serializeExportDataToJSON,
} from '../AnimationExportPipeline';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-export-test',
  targetNodeId: 'sec-hero',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade In',
      duration: 800,
      delay: 0,
      tracks: [
        {
          id: 'tr-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 800, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('AnimationExportPipeline (PM41, ETAP 1 & DECISION-069)', () => {
  it('validates an AnimationTimeline DTO prior to exporting (DECISION-069)', () => {
    const report = validateExportTimeline(mockTimeline);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);

    const invalidReport = validateExportTimeline(null);
    expect(invalidReport.isValid).toBe(false);
  });

  it('generates an export package with manifest metadata', () => {
    const exportData = exportAnimationTimeline(mockTimeline, 'UnitTestExporter');

    expect(exportData.manifest.exporter).toBe('UnitTestExporter');
    expect(exportData.manifest.formatVersion).toBe('1.0.0');
    expect(exportData.manifest.timelineId).toBe('tl-export-test');
    expect(exportData.manifest.clipCount).toBe(1);
    expect(exportData.manifest.totalDurationMs).toBe(800);
    expect(exportData.timeline).toEqual(mockTimeline);
  });

  it('serializes export data to formatted JSON string', () => {
    const exportData = exportAnimationTimeline(mockTimeline);
    const jsonStr = serializeExportDataToJSON(exportData);

    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('UnitTestExporter');
    expect(jsonStr).toContain('tl-export-test');
  });
});
