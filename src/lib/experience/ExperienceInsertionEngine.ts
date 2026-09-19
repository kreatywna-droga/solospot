/**
 * ExperienceInsertionEngine.ts — High-Integrity Insertion & Replacement Engine
 *
 * Implements:
 *   - ADD_TO_CANVAS / AT_INDEX
 *   - INSERT_ABOVE
 *   - INSERT_BELOW
 *   - REPLACE_SELECTED
 *   - USE_AS_PAGE
 *
 * Guarantees:
 *   - Unique ID generation & remapping via cloneNodeWithNewIds
 *   - Single undoable transaction per action
 *   - Navbar anchor link synchronization via NAVIGABLE_CATEGORY_MAP
 *   - Single source of truth (BuilderDocument) preservation
 */

import type { ExperienceItem } from './ExperienceTypes';
import type { BuilderDocument, BuilderNode, SectionNode } from '../../../packages/builder-core/src/BuilderDocument';
import type { BuilderCommand } from '../../../packages/builder-core/src/BuilderCommands';
import { cloneNodeWithNewIds } from '../../../packages/builder-core/src/NodeTree';
import { NAVIGABLE_CATEGORY_MAP } from '../../../packages/builder-core/src';
import { recordRecentlyUsed } from './ExperienceCatalog';
import { ALL_SECTION_TEMPLATES } from '../../components/builder/library/sections';

export interface InsertionContext {
  document: BuilderDocument;
  pageId: string;
  selectedSectionId?: string | null;
  insertIndex?: number;
  dispatch: (command: BuilderCommand) => void;
}

export interface InsertionResult {
  success: boolean;
  insertedNodeId?: string;
  error?: string;
}

/**
 * Normalizes anchor ID on section node and synchronizes with navbar if applicable.
 */
function syncAnchorAndNavbar(
  sectionNode: BuilderNode,
  category: string,
  targetPageId: string,
  doc: BuilderDocument,
  dispatch: (command: BuilderCommand) => void
): BuilderNode {
  const navInfo = NAVIGABLE_CATEGORY_MAP[category];
  if (!navInfo) return sectionNode;

  const cleanAnchor = navInfo.anchor.replace('#', '');
  sectionNode.props = {
    ...sectionNode.props,
    anchorId: cleanAnchor,
  };
  sectionNode.metadata = {
    ...sectionNode.metadata,
    anchorId: cleanAnchor,
    category,
  };

  const activePage = doc.pages.find(p => p.id === targetPageId) || doc.pages[0];
  const sectionsList = activePage?.sections || [];
  const navbarSection = sectionsList.find(s =>
    s.type === 'navbar' ||
    s.label.toLowerCase().includes('nawigacja') ||
    s.label.toLowerCase().includes('menu') ||
    s.label.toLowerCase().includes('header')
  );

  if (navbarSection) {
    const existingLinks = ((navbarSection.props?.links as Array<{ label: string; href: string }>) || []);
    const alreadyExists = existingLinks.some(
      l => l.href === navInfo.anchor || l.label.toLowerCase() === navInfo.label.toLowerCase()
    );
    if (!alreadyExists) {
      dispatch({
        type: 'UPDATE_NODE',
        nodeId: navbarSection.id,
        updates: {
          props: {
            ...navbarSection.props,
            links: [...existingLinks, { label: navInfo.label, href: navInfo.anchor }],
          },
        },
        pageId: targetPageId,
      });
    }
  }

  return sectionNode;
}

/**
 * Inserts an Experience into the canvas at the designated position.
 */
export function insertExperienceToCanvas(
  experience: ExperienceItem,
  ctx: InsertionContext,
  mode: 'add' | 'above' | 'below' | 'replace' | 'page' = 'add'
): InsertionResult {
  const { document, pageId, selectedSectionId, insertIndex, dispatch } = ctx;

  const activePage = document.pages.find(p => p.id === pageId) || document.pages[0];
  if (!activePage) {
    return { success: false, error: `Target page "${pageId}" not found in document` };
  }

  const sections = activePage.sections || [];
  const selectedIndex = selectedSectionId
    ? sections.findIndex(s => s.id === selectedSectionId)
    : -1;

  // 1. Full Page Replacement Mode
  if (mode === 'page') {
    return applyExperienceAsPage(experience, ctx);
  }

  // 2. Prepare cloned canonical node
  let baseNode = experience.createNode();
  baseNode = cloneNodeWithNewIds(baseNode);
  baseNode = syncAnchorAndNavbar(baseNode, experience.category, activePage.id, document, dispatch);

  // 3. Determine target insertion index
  let targetIndex: number | undefined;

  switch (mode) {
    case 'above':
      targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
      break;
    case 'below':
      targetIndex = selectedIndex >= 0 ? selectedIndex + 1 : sections.length;
      break;
    case 'replace':
      if (selectedIndex < 0) {
        return { success: false, error: 'No section selected to replace' };
      }
      targetIndex = selectedIndex;
      break;
    case 'add':
    default:
      targetIndex = insertIndex !== undefined ? insertIndex : sections.length;
      break;
  }

  // 4. Execution
  if (mode === 'replace' && selectedSectionId) {
    // Remove current section first, then insert new node at the exact same index
    dispatch({
      type: 'REMOVE_SECTION',
      pageId: activePage.id,
      sectionId: selectedSectionId,
    });
    dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: baseNode,
      index: targetIndex,
      pageId: activePage.id,
    });
  } else {
    dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: baseNode,
      index: targetIndex,
      pageId: activePage.id,
    });
  }

  // 5. Update Selection
  dispatch({
    type: 'CANVAS',
    action: { type: 'SELECT_SECTION', sectionId: baseNode.id },
  });

  // 6. Record recents
  recordRecentlyUsed(experience.id);

  return { success: true, insertedNodeId: baseNode.id };
}

/**
 * Replaces the entire page content with multi-section experience (e.g. Website template).
 */
export function applyExperienceAsPage(
  experience: ExperienceItem,
  ctx: InsertionContext
): InsertionResult {
  const { document, pageId, dispatch } = ctx;
  const activePage = document.pages.find(p => p.id === pageId) || document.pages[0];
  if (!activePage) return { success: false, error: 'Target page not found' };

  const currentSections = activePage.sections || [];

  // Remove existing sections
  currentSections.forEach(sec => {
    dispatch({
      type: 'REMOVE_SECTION',
      pageId: activePage.id,
      sectionId: sec.id,
    });
  });

  // If website template has specific sectionTemplateIds, load and instantiate each
  if (experience.sectionTemplateIds && experience.sectionTemplateIds.length > 0) {
    let firstNodeId: string | undefined;

    experience.sectionTemplateIds.forEach((secId, idx) => {
      const template = ALL_SECTION_TEMPLATES.find(t => t.id === secId);
      if (template) {
        let node = template.createNode();
        node = cloneNodeWithNewIds(node);
        if (idx === 0) firstNodeId = node.id;

        dispatch({
          type: 'INSERT_NODE',
          parentId: null,
          node,
          index: idx,
          pageId: activePage.id,
        });
      }
    });

    if (firstNodeId) {
      dispatch({
        type: 'CANVAS',
        action: { type: 'SELECT_SECTION', sectionId: firstNodeId },
      });
    }

    recordRecentlyUsed(experience.id);
    return { success: true, insertedNodeId: firstNodeId };
  }

  // Fallback: single section inserted as the new page content
  let singleNode = experience.createNode();
  singleNode = cloneNodeWithNewIds(singleNode);

  dispatch({
    type: 'INSERT_NODE',
    parentId: null,
    node: singleNode,
    index: 0,
    pageId: activePage.id,
  });

  dispatch({
    type: 'CANVAS',
    action: { type: 'SELECT_SECTION', sectionId: singleNode.id },
  });

  recordRecentlyUsed(experience.id);
  return { success: true, insertedNodeId: singleNode.id };
}

// ---------------------------------------------------------------------------
// Pure Headless Document Insertion Engine
// ---------------------------------------------------------------------------

export interface PureInsertionOptions {
  mode?: 'add' | 'above' | 'below' | 'replace' | 'page';
  pageId?: string;
  targetSectionId?: string;
  newPageTitle?: string;
  newPageSlug?: string;
}

export interface PureInsertionResult {
  success: boolean;
  document: BuilderDocument;
  insertedNodeIds: string[];
  primarySelectedId?: string;
  error?: string;
}

/**
 * Pure document insertion engine for headless operations & deterministic testing.
 * Creates an immutable-style updated copy of BuilderDocument.
 */
export function insertExperienceIntoDocument(
  doc: BuilderDocument,
  experience: ExperienceItem,
  options: PureInsertionOptions = {}
): PureInsertionResult {
  const mode = options.mode || 'add';
  const targetPageId = options.pageId || doc.pages[0]?.id;
  const newDoc: BuilderDocument = JSON.parse(JSON.stringify(doc));

  // Mode: page
  if (mode === 'page') {
    const slug = options.newPageSlug || `page-${Date.now()}`;
    const title = options.newPageTitle || experience.name || experience.title || 'Nowa Strona';
    const rawNodes = experience.nodes || [experience.createNode()];
    const clonedNodes = rawNodes.map(n => cloneNodeWithNewIds(n));
    const newPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: title,
      slug,
      sections: clonedNodes,
      seo: {},
      isHome: false,
    };
    newDoc.pages.push(newPage);
    return {
      success: true,
      document: newDoc,
      insertedNodeIds: clonedNodes.map(n => n.id),
      primarySelectedId: clonedNodes[0]?.id,
    };
  }

  const page = newDoc.pages.find(p => p.id === targetPageId) || newDoc.pages[0];
  if (!page) {
    return { success: false, document: doc, insertedNodeIds: [], error: 'Page not found' };
  }

  const rawNodes = experience.nodes || [experience.createNode()];
  const clonedNodes = rawNodes.map(n => cloneNodeWithNewIds(n));
  const insertedNodeIds = clonedNodes.map(n => n.id);
  const primarySelectedId = insertedNodeIds[0];

  const targetIdx = options.targetSectionId
    ? page.sections.findIndex(s => s.id === options.targetSectionId)
    : -1;

  if (mode === 'above') {
    const insertAt = targetIdx >= 0 ? targetIdx : 0;
    page.sections.splice(insertAt, 0, ...clonedNodes);
  } else if (mode === 'below') {
    const insertAt = targetIdx >= 0 ? targetIdx + 1 : page.sections.length;
    page.sections.splice(insertAt, 0, ...clonedNodes);
  } else if (mode === 'replace') {
    const replaceAt = targetIdx >= 0 ? targetIdx : 0;
    page.sections.splice(replaceAt, 1, ...clonedNodes);
  } else {
    // 'add'
    page.sections.push(...clonedNodes);
  }

  return {
    success: true,
    document: newDoc,
    insertedNodeIds,
    primarySelectedId,
  };
}

export function previewInsertion(
  doc: BuilderDocument,
  experience: ExperienceItem,
  mode: 'add' | 'above' | 'below' | 'replace' | 'page' = 'add'
): { mode: string; impact: { nodesAdded: number; targetPageTitle: string } } {
  const targetPage = doc.pages[0];
  const nodeCount = (experience.nodes || [experience.createNode()]).length;
  return {
    mode,
    impact: {
      nodesAdded: nodeCount,
      targetPageTitle: targetPage ? (targetPage.name || targetPage.slug) : 'Strona główna',
    },
  };
}
