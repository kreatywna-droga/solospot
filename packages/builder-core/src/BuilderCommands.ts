/**
 * BuilderCommands — C6.1-B
 *
 * Command Pattern for all Builder mutations.
 *
 * Every user action in the Builder is expressed as a BuilderCommand.
 * Commands are:
 *   1. Executable   — they mutate a BuilderDocument
 *   2. Undoable     — they know how to reverse their effect
 *   3. Serializable — they are plain objects (no closures)
 *
 * This unlocks:
 *   - Undo/Redo via HistoryStack
 *   - Telemetry (log every command)
 *   - Collaborative editing (broadcast commands over websocket)
 *   - AI actions (AI emits BuilderCommands instead of mutations)
 *   - Replay / time-travel debugging
 *
 * Pattern: Command stores before-state snapshot for undo.
 * The BuilderReducer calls command.execute() and the HistoryStack
 * stores commands (not snapshots) for compact undo stacks.
 *
 * However — for simplicity in C6.1 — HistoryStack stores full snapshots.
 * The Command interface's undo() mechanism is preserved for future
 * collaborative editing phases where command-based undo is required.
 */

import {
  BuilderDocument,
  BuilderPage,
  BuilderSEO,
  BuilderTheme,
  SectionNode,
  touchDocument,
} from './BuilderDocument';
import { sectionTree } from './SectionTree';
import { CanvasAction, Alignment } from './CanvasState';

// ---------------------------------------------------------------------------
// Command type — discriminated union
// ---------------------------------------------------------------------------

export type BuilderCommandType =
  // Section mutations
  | 'ADD_SECTION'
  | 'ADD_CHILD_SECTION'
  | 'REMOVE_SECTION'
  | 'MOVE_SECTION'
  | 'MOVE_SECTION_TO_PARENT'
  | 'UPDATE_PROPS'
  | 'REPLACE_PROPS'
  | 'TOGGLE_VISIBILITY'
  | 'TOGGLE_LOCK'
  | 'DUPLICATE_SECTION'
  | 'REORDER_SECTIONS'
  | 'ALIGN_SECTIONS'
  // Page mutations
  | 'ADD_PAGE'
  | 'REMOVE_PAGE'
  | 'UPDATE_PAGE_META'
  | 'UPDATE_PAGE_SEO'
  // Branding / theme
  | 'UPDATE_THEME'
  // Document-level
  | 'MARK_PUBLISHED'
  // Canvas (non-mutating document, just canvas state)
  | 'CANVAS'
  // History
  | 'UNDO'
  | 'REDO';

// Typed command payloads:

export type BuilderCommand =
  | {
      readonly type: 'ADD_SECTION';
      readonly pageId: string;
      readonly sectionType: string;
      readonly defaultProps: Record<string, unknown>;
      readonly atIndex?: number;
      readonly label?: string;
    }
  | {
      readonly type: 'ADD_CHILD_SECTION';
      readonly pageId: string;
      readonly parentId: string;
      readonly sectionType: string;
      readonly defaultProps: Record<string, unknown>;
      readonly atIndex?: number;
      readonly label?: string;
    }
  | {
      readonly type: 'REMOVE_SECTION';
      readonly pageId: string;
      readonly sectionId: string;
    }
  | {
      readonly type: 'MOVE_SECTION';
      readonly pageId: string;
      readonly fromIndex: number;
      readonly toIndex: number;
    }
  | {
      readonly type: 'MOVE_SECTION_TO_PARENT';
      readonly pageId: string;
      readonly sectionId: string;
      readonly parentId: string | null;
      readonly toIndex: number;
    }
  | {
      readonly type: 'UPDATE_PROPS';
      readonly pageId: string;
      readonly sectionId: string;
      readonly props: Record<string, unknown>;
    }
  | {
      readonly type: 'REPLACE_PROPS';
      readonly pageId: string;
      readonly sectionId: string;
      readonly props: Record<string, unknown>;
    }
  | {
      readonly type: 'TOGGLE_VISIBILITY';
      readonly pageId: string;
      readonly sectionId: string;
    }
  | {
      readonly type: 'TOGGLE_LOCK';
      readonly pageId: string;
      readonly sectionId: string;
    }
  | {
      readonly type: 'DUPLICATE_SECTION';
      readonly pageId: string;
      readonly sectionId: string;
    }
  | {
      readonly type: 'REORDER_SECTIONS';
      readonly pageId: string;
      readonly orderedIds: readonly string[];
    }
  | {
      readonly type: 'ALIGN_SECTIONS';
      readonly pageId: string;
      readonly sectionIds: readonly string[];
      readonly alignment: Alignment;
    }

// Page mutations
  | {
      readonly type: 'ADD_PAGE';
      readonly page: Omit<BuilderPage, 'sections'> & { sections?: SectionNode[] };
    }
  | {
      readonly type: 'REMOVE_PAGE';
      readonly pageId: string;
    }
  | {
      readonly type: 'UPDATE_PAGE_META';
      readonly pageId: string;
      readonly slug?: string;
      readonly name?: string;
      readonly isHome?: boolean;
    }
  | {
      readonly type: 'UPDATE_PAGE_SEO';
      readonly pageId: string;
      readonly seo: Partial<BuilderSEO>;
    }
  | {
      readonly type: 'UPDATE_THEME';
      readonly theme: Partial<BuilderTheme>;
    }
  | {
      readonly type: 'MARK_PUBLISHED';
    }
  | {
      readonly type: 'CANVAS';
      readonly action: CanvasAction;
    }
  | { readonly type: 'UNDO' }
  | { readonly type: 'REDO' };

// ---------------------------------------------------------------------------
// Label helper — human-readable undo/redo label for each command
// ---------------------------------------------------------------------------

export function commandLabel(cmd: BuilderCommand): string {
  switch (cmd.type) {
    case 'ADD_SECTION':       return `Add "${cmd.sectionType}" section`;
    case 'ADD_CHILD_SECTION': return `Add "${cmd.sectionType}" inside container`;
    case 'REMOVE_SECTION':    return `Delete section`;
    case 'MOVE_SECTION':      return `Move section`;
    case 'MOVE_SECTION_TO_PARENT': return `Move section to new parent`;
    case 'UPDATE_PROPS':      return `Edit section props`;
    case 'REPLACE_PROPS':     return `Replace section props`;
    case 'TOGGLE_VISIBILITY': return `Toggle visibility`;
    case 'TOGGLE_LOCK':       return `Toggle lock`;
    case 'DUPLICATE_SECTION': return `Duplicate section`;
    case 'ALIGN_SECTIONS':     return `Align sections`;
    case 'REORDER_SECTIONS':  return `Reorder sections`;
    case 'ADD_PAGE':          return `Add page "${cmd.page.name}"`;
    case 'REMOVE_PAGE':       return `Delete page`;
    case 'UPDATE_PAGE_META':  return `Update page settings`;
    case 'UPDATE_PAGE_SEO':   return `Update page SEO`;
    case 'UPDATE_THEME':      return `Update theme`;
    case 'MARK_PUBLISHED':    return `Mark as published`;
    case 'CANVAS':            return `Canvas: ${cmd.action.type}`;
    case 'UNDO':              return `Undo`;
    case 'REDO':              return `Redo`;
  }
}

// ---------------------------------------------------------------------------
// Document mutator — applies a document-mutating command to a BuilderDocument
// Returns a new BuilderDocument (immutable update).
// CANVAS, UNDO, REDO are NOT handled here — they are handled by BuilderReducer.
// ---------------------------------------------------------------------------

function applyAlignmentToSections(
  sections: SectionNode[],
  sectionIds: readonly string[],
  alignment: Alignment
): SectionNode[] {
  return sections.map((section) => {
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
  });
}

export function applyCommandToDocument(
  doc: BuilderDocument,
  command: BuilderCommand
): BuilderDocument {
  switch (command.type) {
    case 'ADD_SECTION': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        const { sections } = sectionTree.insertSection(
          page.sections,
          command.sectionType,
          command.defaultProps,
          command.atIndex,
          command.label
        );
        return { ...page, sections };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'ADD_CHILD_SECTION': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        const { sections } = sectionTree.insertChild(
          page.sections,
          command.parentId,
          command.sectionType,
          command.defaultProps,
          command.atIndex,
          command.label
        );
        return { ...page, sections };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'REMOVE_SECTION': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return { ...page, sections: sectionTree.removeNode(page.sections, command.sectionId) };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'MOVE_SECTION': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.moveSection(page.sections, command.fromIndex, command.toIndex),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'MOVE_SECTION_TO_PARENT': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.moveNodeToParent(
            page.sections,
            command.sectionId,
            command.parentId,
            command.toIndex
          ),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'UPDATE_PROPS': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.updateProps(page.sections, command.sectionId, command.props),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'REPLACE_PROPS': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.replaceProps(page.sections, command.sectionId, command.props),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'TOGGLE_VISIBILITY': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.toggleVisibility(page.sections, command.sectionId),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'TOGGLE_LOCK': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.toggleLock(page.sections, command.sectionId),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'DUPLICATE_SECTION': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        const { sections } = sectionTree.duplicateNode(page.sections, command.sectionId);
        return { ...page, sections };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'ALIGN_SECTIONS': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: applyAlignmentToSections(page.sections, command.sectionIds, command.alignment),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'REORDER_SECTIONS': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.reorderByIds(page.sections, command.orderedIds),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'ADD_PAGE': {
      const newPage: BuilderPage = {
        sections: [],
        ...command.page,
      };
      return touchDocument({ ...doc, pages: [...doc.pages, newPage] });
    }

    case 'REMOVE_PAGE': {
      if (doc.pages.length <= 1) return doc; // cannot remove last page
      const pages = doc.pages.filter(p => p.id !== command.pageId);
      return touchDocument({ ...doc, pages });
    }

    case 'UPDATE_PAGE_META': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          ...(command.slug !== undefined    ? { slug: command.slug }       : {}),
          ...(command.name !== undefined    ? { name: command.name }       : {}),
          ...(command.isHome !== undefined  ? { isHome: command.isHome }   : {}),
        };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'UPDATE_PAGE_SEO': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return { ...page, seo: { ...page.seo, ...command.seo } };
      });
      return touchDocument({ ...doc, pages });
    }

    case 'UPDATE_THEME': {
      return touchDocument({ ...doc, theme: { ...doc.theme, ...command.theme } });
    }

    case 'MARK_PUBLISHED': {
      return { ...doc, isDirty: false, version: doc.version };
    }

    // These are handled by BuilderReducer, not here:
    case 'CANVAS':
    case 'UNDO':
    case 'REDO':
      return doc;
  }
}
