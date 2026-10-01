/**
 * VisualLibraryContract — SSOT Data Contract for SoloSpot Visual Library items.
 *
 * Defines explicit operations (INSERT vs APPLY), compatible targets, drag-and-drop metadata,
 * fallback visual rendering specs, and execution pathways for Design System items.
 */

export type LibraryOperation = 'INSERT' | 'APPLY';
export type LibraryTarget = 'element' | 'section' | 'page' | 'theme';

export interface VisualLibraryItemContract {
  id: string;
  name: string;
  category: string;
  kind: string;
  supportedOperations: LibraryOperation[];
  allowedTargets: LibraryTarget[];
  description?: string;
  previewType: 'font' | 'font-pairing' | 'color' | 'button' | 'card' | 'icon' | 'image' | 'background' | 'section' | 'theme' | 'token';
  dragType?: string;
  dragPayload?: Record<string, unknown>;
}

/**
 * Returns supported operations and targets for any category in DesignSystemCatalog.
 */
export function getCategoryOperations(category: string): {
  operations: LibraryOperation[];
  targets: LibraryTarget[];
  canInsert: boolean;
  canApply: boolean;
} {
  switch (category) {
    case 'fonts':
    case 'font-pairings':
    case 'typography':
      return {
        operations: ['APPLY', 'INSERT'],
        targets: ['element', 'theme', 'page'],
        canInsert: true,
        canApply: true,
      };

    case 'buttons':
    case 'cards':
    case 'icons':
    case 'images':
      return {
        operations: category === 'icons' ? ['INSERT'] : ['INSERT', 'APPLY'],
        targets: ['element', 'section', 'theme'],
        canInsert: true,
        canApply: category !== 'icons',
      };

    case 'sections':
    case 'hero':
      return {
        operations: ['INSERT', 'APPLY'],
        targets: ['section', 'page'],
        canInsert: true,
        canApply: true,
      };

    case 'colors':
    case 'color-combinations':
    case 'backgrounds':
    case 'spacing':
    case 'radius':
    case 'shadows':
    case 'effects':
    case 'themes':
    case 'style-packs':
    case 'design-combinations':
    case 'industry-presets':
    case 'visual-languages':
      return {
        operations: ['APPLY'],
        targets: ['section', 'page', 'theme'],
        canInsert: false,
        canApply: true,
      };

    default:
      return {
        operations: ['APPLY'],
        targets: ['theme'],
        canInsert: false,
        canApply: true,
      };
  }
}

export function validateOperationTarget(
  category: string,
  operation: LibraryOperation,
  context: {
    document?: any;
    pageId?: string | null;
    target: LibraryTarget;
    targetId?: string | null;
    selectedNodeId?: string | null;
  }
): { valid: boolean; reason?: string } {
  const ops = getCategoryOperations(category);
  const targetId = context.targetId || context.selectedNodeId || null;
  const findNode = (nodes: any[], id: string): any | null => {
    for (const node of nodes || []) {
      if (node?.id === id) return node;
      const child = findNode(node?.children || [], id);
      if (child) return child;
    }
    return null;
  };
  const page = context.document?.pages?.find((entry: any) => entry?.id === context.pageId);

  if (!ops.operations.includes(operation)) {
    return { valid: false, reason: `${operation} nie jest obsługiwany dla kategorii "${category}"` };
  }
  if (!ops.targets.includes(context.target)) {
    return { valid: false, reason: `Cel "${context.target}" nie jest obsługiwany dla kategorii "${category}"` };
  }

  if (operation === 'INSERT') {
    const targetPageId = context.pageId || context.document?.pages?.[0]?.id;
    const targetPage = context.document?.pages?.find((entry: any) => entry?.id === targetPageId);
    if (!targetPageId || !targetPage) {
      return { valid: false, reason: 'Brak aktywnej strony docelowej w dokumencie' };
    }
    if (targetId && !findNode(targetPage.sections, targetId)) {
      return { valid: false, reason: 'Wybrany element docelowy nie istnieje na aktywnej stronie' };
    }
    return { valid: true };
  }

  if (operation === 'APPLY') {
    if (!context.document) {
      return { valid: false, reason: 'Brak aktywnego dokumentu BuilderDocument' };
    }
    if (context.target === 'page' && !page) {
      return { valid: false, reason: 'Strona docelowa nie istnieje w BuilderDocument' };
    }
    if (context.target === 'theme' && !context.document.theme) {
      return { valid: false, reason: 'Dokument nie zawiera motywu do zastosowania stylu' };
    }
    if (context.target === 'section' || context.target === 'element') {
      if (!page || !targetId) {
        return { valid: false, reason: 'Wybierz istniejący element docelowy' };
      }
      const targetNode = findNode(page.sections, targetId);
      if (!targetNode) {
        return { valid: false, reason: 'Wybrany element docelowy nie istnieje na aktywnej stronie' };
      }
      if (context.target === 'section' && !['section', 'hero', 'container'].includes(targetNode.type)) {
        return { valid: false, reason: 'Wybrany cel nie jest sekcją ani kontenerem' };
      }
    }
    return { valid: true };
  }

  return { valid: false, reason: 'Nieznana operacja biblioteki' };
}

