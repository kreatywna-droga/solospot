// LayoutEngine.ts
// C7.5: Builder Pro — layout engine (alignment, distribution, snapping)

import { BuilderDocument } from './BuilderDocument';
import { BuilderCommand } from './BuilderCommands';
import { Alignment } from './CanvasState';
import { GridSystem } from './GridSystem';

export function createAlignCommand(options: {
  readonly document: BuilderDocument;
  readonly pageId: string;
  readonly sectionIds: readonly string[];
  readonly alignment: Alignment;
}): BuilderCommand {
  return {
    type: 'ALIGN_SECTIONS',
    pageId: options.pageId,
    sectionIds: options.sectionIds,
    alignment: options.alignment,
  };
}

export function computeAlignment(
  sections: ReadonlyArray<{ x: number; y: number; width: number; height: number }>,
  alignment: Alignment
): ReadonlyArray<{ x: number; y: number; width: number; height: number }> {
  if (sections.length === 0) return sections;

  switch (alignment) {
    case 'LEFT':
      return sections.map(s => ({ ...s, x: 0 }));
    case 'CENTER':
      return sections.map(s => ({ ...s, x: 50, align: 'center' as const }));
    case 'RIGHT':
      return sections.map(s => ({ ...s, x: 100, align: 'right' as const }));
    case 'STRETCH':
      return sections.map(s => ({ ...s, width: 100, align: 'stretch' as const }));
    case 'TOP':
      return sections.map(s => ({ ...s, y: 0 }));
    case 'MIDDLE': {
      const minY = Math.min(...sections.map(s => s.y));
      const maxY = Math.max(...sections.map(s => s.y + s.height));
      const centerY = (minY + maxY) / 2;
      return sections.map(s => ({ ...s, y: centerY - s.height / 2, valign: 'middle' as const }));
    }
    case 'BOTTOM': {
      const maxY = Math.max(...sections.map(s => s.y + s.height));
      return sections.map(s => ({ ...s, y: maxY - s.height, valign: 'bottom' as const }));
    }
    case 'DISTRIBUTE_HORIZONTAL': {
      const totalWidth = sections.reduce((sum, s) => sum + s.width, 0);
      const availableWidth = 100 - totalWidth;
      const gap = sections.length > 1 ? availableWidth / (sections.length - 1) : 0;
      let currentX = 0;
      return sections.map(s => {
        const next = { ...s, x: currentX };
        currentX += s.width + gap;
        return next;
      });
    }
    case 'DISTRIBUTE_VERTICAL': {
      const totalHeight = sections.reduce((sum, s) => sum + s.height, 0);
      const availableHeight = 100 - totalHeight;
      const gap = sections.length > 1 ? availableHeight / (sections.length - 1) : 0;
      let currentY = 0;
      return sections.map(s => {
        const next = { ...s, y: currentY };
        currentY += s.height + gap;
        return next;
      });
    }
    case 'EQUAL_HEIGHT': {
      const maxHeight = Math.max(...sections.map(s => s.height));
      return sections.map(s => ({ ...s, height: maxHeight }));
    }
    case 'EQUAL_WIDTH': {
      const maxWidth = Math.max(...sections.map(s => s.width));
      return sections.map(s => ({ ...s, width: maxWidth }));
    }
    default:
      return sections;
  }
}
