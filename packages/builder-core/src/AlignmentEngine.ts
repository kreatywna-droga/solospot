// AlignmentEngine.ts
// C7: Builder Pro — alignment tools

import { BuilderDocument, createBuilderPage, createSectionNode } from './BuilderDocument';
import { BuilderCommand } from './BuilderCommands';
import { Alignment } from './CanvasState';

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

export function applyAlignCommand(document: BuilderDocument, command: BuilderCommand): BuilderDocument {
  if (command.type !== 'ALIGN_SECTIONS') {
    return document;
  }

  const { sectionIds, alignment } = command;
  if (sectionIds.length === 0) {
    return document;
  }

  const pages = document.pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => {
      if (!sectionIds.includes(section.id)) {
        return section;
      }

      const props = { ...section.props };

      switch (alignment) {
        case 'LEFT':
          props.x = 0;
          break;
        case 'CENTER':
          props.x = 50;
          props.align = 'center';
          break;
        case 'RIGHT':
          props.x = 100;
          props.align = 'right';
          break;
        case 'STRETCH':
          props.width = 100;
          props.align = 'stretch';
          break;
        case 'TOP':
          props.y = 0;
          break;
        case 'MIDDLE':
          props.y = 50;
          props.valign = 'middle';
          break;
        case 'BOTTOM':
          props.y = 100;
          props.valign = 'bottom';
          break;
        case 'DISTRIBUTE_HORIZONTAL':
        case 'DISTRIBUTE_VERTICAL':
        case 'EQUAL_HEIGHT':
        case 'EQUAL_WIDTH':
          break;
      }

      return { ...section, props };
    }),
  }));

  return { ...document, pages };
}
