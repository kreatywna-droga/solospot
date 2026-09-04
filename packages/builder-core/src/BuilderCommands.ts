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
  BuilderNode,
  NodeStyles,
  touchDocument,
} from './BuilderDocument';
import { sectionTree } from './SectionTree';
import * as nodeTree from './NodeTree';
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
  | 'SET_SECTION_RESPONSIVE_PROP'
  | 'TOGGLE_VISIBILITY'
  | 'TOGGLE_LOCK'
  | 'DUPLICATE_SECTION'
  | 'REORDER_SECTIONS'
  | 'ALIGN_SECTIONS'
  // C17.1 Phase 1 — Hierarchical Node Commands
  | 'INSERT_NODE'
  | 'REMOVE_NODE'
  | 'MOVE_NODE'
  | 'DUPLICATE_NODE'
  | 'UPDATE_NODE'
  | 'SET_NODE_PROPS'
  | 'SET_NODE_STYLES'
  | 'SET_NODE_LOCKED'
  | 'SET_NODE_HIDDEN'
  // Page mutations
  | 'ADD_PAGE'
  | 'REMOVE_PAGE'
  | 'UPDATE_PAGE_META'
  | 'UPDATE_PAGE_SEO'
  | 'DUPLICATE_PAGE'
  | 'REORDER_PAGES'
  | 'SET_HOME_PAGE'
  // Branding / theme / tokens
  | 'UPDATE_THEME'
  | 'UPDATE_DESIGN_TOKENS'
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
      readonly type: 'SET_SECTION_RESPONSIVE_PROP';
      readonly pageId: string;
      readonly sectionId: string;
      readonly propName: string;
      readonly value: unknown;
      readonly breakpoint: string;
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

  // C17.1 Phase 1 — Hierarchical Node commands
  | {
      readonly type: 'INSERT_NODE';
      readonly parentId: string | null;
      readonly node: BuilderNode;
      readonly index?: number;
      readonly pageId?: string;
    }
  | {
      readonly type: 'REMOVE_NODE';
      readonly nodeId: string;
      readonly pageId?: string;
    }
  | {
      readonly type: 'MOVE_NODE';
      readonly nodeId: string;
      readonly targetParentId: string | null;
      readonly targetIndex?: number;
      readonly pageId?: string;
    }
  | {
      readonly type: 'DUPLICATE_NODE';
      readonly nodeId: string;
      readonly pageId?: string;
    }
  | {
      readonly type: 'UPDATE_NODE';
      readonly nodeId: string;
      readonly updates: Partial<BuilderNode>;
      readonly pageId?: string;
    }
  | {
      readonly type: 'SET_NODE_PROPS';
      readonly nodeId: string;
      readonly props: Record<string, unknown>;
      readonly pageId?: string;
    }
  | {
      readonly type: 'SET_NODE_STYLES';
      readonly nodeId: string;
      readonly styles: Partial<NodeStyles>;
      readonly pageId?: string;
    }
  | {
      readonly type: 'SET_NODE_LOCKED';
      readonly nodeId: string;
      readonly locked: boolean;
      readonly pageId?: string;
    }
  | {
      readonly type: 'SET_NODE_HIDDEN';
      readonly nodeId: string;
      readonly hidden: boolean;
      readonly pageId?: string;
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
      readonly type: 'DUPLICATE_PAGE';
      readonly pageId: string;
    }
  | {
      readonly type: 'REORDER_PAGES';
      readonly orderedPageIds: readonly string[];
    }
  | {
      readonly type: 'SET_HOME_PAGE';
      readonly pageId: string;
    }
  | {
      readonly type: 'UPDATE_PAGE_META';
      readonly pageId: string;
      readonly slug?: string;
      readonly name?: string;
      readonly isHome?: boolean;
      readonly folder?: string;
      readonly hidden?: boolean;
      readonly status?: 'published' | 'draft';
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
      readonly type: 'UPDATE_DESIGN_TOKENS';
      readonly tokens: NonNullable<BuilderTheme['tokens']>;
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
    case 'SET_SECTION_RESPONSIVE_PROP': return `Set responsive prop`;
    case 'TOGGLE_VISIBILITY': return `Toggle visibility`;
    case 'TOGGLE_LOCK':       return `Toggle lock`;
    case 'DUPLICATE_SECTION': return `Duplicate section`;
    case 'ALIGN_SECTIONS':     return `Align sections`;
    case 'REORDER_SECTIONS':  return `Reorder sections`;
    case 'INSERT_NODE':       return `Insert ${cmd.node.type}`;
    case 'REMOVE_NODE':       return `Delete ${cmd.nodeId}`;
    case 'MOVE_NODE':         return `Move node`;
    case 'DUPLICATE_NODE':    return `Duplicate node`;
    case 'UPDATE_NODE':       return `Update node`;
    case 'SET_NODE_PROPS':    return `Set node properties`;
    case 'SET_NODE_STYLES':   return `Set node styles`;
    case 'SET_NODE_LOCKED':   return cmd.locked ? `Lock node` : `Unlock node`;
    case 'SET_NODE_HIDDEN':   return cmd.hidden ? `Hide node` : `Show node`;
    case 'ADD_PAGE':          return `Add page "${cmd.page.name}"`;
    case 'REMOVE_PAGE':       return `Delete page`;
    case 'DUPLICATE_PAGE':    return `Duplicate page`;
    case 'REORDER_PAGES':     return `Reorder pages`;
    case 'SET_HOME_PAGE':     return `Set home page`;
    case 'UPDATE_PAGE_META':  return `Update page settings`;
    case 'UPDATE_PAGE_SEO':   return `Update page SEO`;
    case 'UPDATE_THEME':      return `Update theme`;
    case 'UPDATE_DESIGN_TOKENS': return `Update design tokens`;
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

    case 'SET_SECTION_RESPONSIVE_PROP': {
      const pages = doc.pages.map(page => {
        if (page.id !== command.pageId) return page;
        return {
          ...page,
          sections: sectionTree.updateResponsiveProps(
            page.sections,
            command.sectionId,
            command.propName,
            command.value,
            command.breakpoint
          ),
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

    // C17.1 Phase 1 — Hierarchical NodeTree command executions
    case 'INSERT_NODE': {
      return touchDocument(
        nodeTree.insertNode(
          doc,
          command.parentId,
          command.node,
          command.index,
          command.pageId
        )
      );
    }

    case 'REMOVE_NODE': {
      return touchDocument(nodeTree.removeNode(doc, command.nodeId));
    }

    case 'MOVE_NODE': {
      return touchDocument(
        nodeTree.moveNode(
          doc,
          command.nodeId,
          command.targetParentId,
          command.targetIndex
        )
      );
    }

    case 'DUPLICATE_NODE': {
      const result = nodeTree.duplicateNode(doc, command.nodeId);
      return touchDocument(result.doc);
    }

    case 'UPDATE_NODE': {
      return touchDocument(
        nodeTree.updateNode(doc, command.nodeId, command.updates)
      );
    }

    case 'SET_NODE_PROPS': {
      return touchDocument(
        nodeTree.setNodeProps(doc, command.nodeId, command.props)
      );
    }

    case 'SET_NODE_STYLES': {
      return touchDocument(
        nodeTree.setNodeStyles(doc, command.nodeId, command.styles)
      );
    }

    case 'SET_NODE_LOCKED': {
      return touchDocument(
        nodeTree.setNodeLocked(doc, command.nodeId, command.locked)
      );
    }

    case 'SET_NODE_HIDDEN': {
      return touchDocument(
        nodeTree.setNodeHidden(doc, command.nodeId, command.hidden)
      );
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

    case 'DUPLICATE_PAGE': {
      const targetPage = doc.pages.find(p => p.id === command.pageId);
      if (!targetPage) return doc;
      const newId = `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      // Deep clone sections with new IDs
      const cloneSections = (nodes: SectionNode[]): SectionNode[] =>
        nodes.map(n => ({
          ...n,
          id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          props: JSON.parse(JSON.stringify(n.props)),
          children: cloneSections(n.children ?? []),
        }));

      const duplicatedPage: BuilderPage = {
        ...targetPage,
        id: newId,
        name: `${targetPage.name} (Kopia)`,
        slug: `${targetPage.slug}-copy`,
        isHome: false,
        sections: cloneSections(targetPage.sections),
      };
      return touchDocument({ ...doc, pages: [...doc.pages, duplicatedPage] });
    }

    case 'REORDER_PAGES': {
      const pageMap = new Map(doc.pages.map(p => [p.id, p]));
      const newPages: BuilderPage[] = [];
      for (const id of command.orderedPageIds) {
        const page = pageMap.get(id);
        if (page) {
          newPages.push(page);
          pageMap.delete(id);
        }
      }
      // Add any remaining pages
      for (const remaining of pageMap.values()) {
        newPages.push(remaining);
      }
      return touchDocument({ ...doc, pages: newPages });
    }

    case 'SET_HOME_PAGE': {
      const pages = doc.pages.map(page => ({
        ...page,
        isHome: page.id === command.pageId,
      }));
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
          ...(command.folder !== undefined  ? { folder: command.folder }   : {}),
          ...(command.hidden !== undefined  ? { hidden: command.hidden }   : {}),
          ...(command.status !== undefined  ? { status: command.status }   : {}),
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

    case 'UPDATE_DESIGN_TOKENS': {
      const updatedTokens = {
        ...(doc.theme.tokens ?? {}),
        ...command.tokens,
      };
      return touchDocument({ ...doc, theme: { ...doc.theme, tokens: updatedTokens } });
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
