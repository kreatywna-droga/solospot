/**
 * LayoutCommands.ts — Sprint S29 Layout Commands for HistoryStack<BuilderDocument>
 *
 * Undoable command classes following the S28 command pattern:
 *   execute(doc) → new BuilderDocument; caller pushes the result into the existing
 *   createHistoryStack<BuilderDocument>. S29 creates NO history stack of its own.
 *
 * Immutable editing helpers: setLayoutStyle / setLayoutConstraint / removeLayoutConstraint
 * return new SectionNode instances; document updates reuse S28's canonical
 * updateNodeInDocument (which delegates to touchDocument = dirty tracking).
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { updateNodeInDocument } from '../responsive/ResponsiveOverrideEngine';
import {
  DEFAULT_LAYOUT_STYLE,
  type LayoutStyle,
} from './LayoutModel';
import {
  createLayoutConstraints,
  DEFAULT_LAYOUT_CONSTRAINTS,
  type LayoutConstraints,
  type LayoutSizing,
} from './ConstraintModel';

export interface LayoutCommand {
  readonly name: string;
  execute(doc: BuilderDocument): BuilderDocument;
  undo(doc: BuilderDocument): BuilderDocument;
}

export type LayoutConstraintKey =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'centerX'
  | 'centerY'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'maxWidth'
  | 'minHeight'
  | 'maxHeight'
  | 'aspectRatio';

// ---------------------------------------------------------------------------
// Immutable node editing helpers
// ---------------------------------------------------------------------------

export function readLayoutStyle(node: SectionNode): LayoutStyle | undefined {
  const props = node.props as Record<string, unknown>;
  return props.layoutStyle as LayoutStyle | undefined;
}

export function readLayoutConstraints(node: SectionNode): LayoutConstraints | undefined {
  const props = node.props as Record<string, unknown>;
  return props.layoutConstraints as LayoutConstraints | undefined;
}

/**
 * Returns a new SectionNode with `props.layoutStyle` merged over defaults.
 */
export function setLayoutStyle(node: SectionNode, stylePartial: Partial<LayoutStyle>): SectionNode {
  const current = readLayoutStyle(node);
  const nextStyle: LayoutStyle = {
    ...DEFAULT_LAYOUT_STYLE,
    ...(current ?? {}),
    ...stylePartial,
  };
  return {
    ...node,
    props: {
      ...node.props,
      layoutStyle: nextStyle,
    },
  };
}

/**
 * Returns a new SectionNode with `props.layoutConstraints` merged over defaults.
 */
export function setLayoutConstraint(
  node: SectionNode,
  constraintPartial: Partial<Omit<LayoutConstraints, 'sizing'>> & {
    sizing?: Partial<LayoutSizing>;
  }
): SectionNode {
  const current = readLayoutConstraints(node) ?? DEFAULT_LAYOUT_CONSTRAINTS;
  const nextConstraints: LayoutConstraints = {
    ...current,
    ...constraintPartial,
    sizing: {
      ...current.sizing,
      ...(constraintPartial.sizing ?? {}),
    },
  };
  return {
    ...node,
    props: {
      ...node.props,
      layoutConstraints: nextConstraints,
    },
  };
}

/**
 * Returns a new SectionNode with a single constraint key removed.
 * The `sizing` key can never be removed (structural invariant).
 */
export function removeLayoutConstraint(
  node: SectionNode,
  key: LayoutConstraintKey
): SectionNode {
  const current = readLayoutConstraints(node);
  if (!current) {
    return node;
  }
  const copy = { ...current } as Record<string, unknown>;
  delete copy[key];
  return {
    ...node,
    props: {
      ...node.props,
      layoutConstraints: createLayoutConstraints(
        copy as Partial<Omit<LayoutConstraints, 'sizing'>> & {
          sizing?: Partial<LayoutSizing>;
        }
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * Sets (or creates) the layout style of a node. Undo restores the previous
 * layoutStyle value (or removes it when the node had none).
 */
export class SetLayoutStyleCommand implements LayoutCommand {
  public readonly name: string;
  private previousStyle: LayoutStyle | undefined;

  constructor(
    public readonly nodeId: string,
    public readonly stylePartial: Partial<LayoutStyle>
  ) {
    this.name = `Set Layout Style on Node "${nodeId}"`;
  }

  public execute(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }
    this.previousStyle = readLayoutStyle(targetNode);
    return updateNodeInDocument(doc, setLayoutStyle(targetNode, this.stylePartial));
  }

  public undo(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }
    const restored: SectionNode = {
      ...targetNode,
      props:
        this.previousStyle === undefined
          ? withoutPropKey(targetNode, 'layoutStyle')
          : {
              ...targetNode.props,
              layoutStyle: this.previousStyle,
            },
    };
    return updateNodeInDocument(doc, restored);
  }
}

/**
 * Sets (creates/updates) layout constraints on a node.
 */
export class SetLayoutConstraintCommand implements LayoutCommand {
  public readonly name: string;
  private previousConstraints: LayoutConstraints | undefined;

  constructor(
    public readonly nodeId: string,
    public readonly constraintPartial: Partial<Omit<LayoutConstraints, 'sizing'>> & {
      sizing?: Partial<LayoutSizing>;
    }
  ) {
    this.name = `Set Layout Constraint on Node "${nodeId}"`;
  }

  public execute(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }
    this.previousConstraints = readLayoutConstraints(targetNode);
    return updateNodeInDocument(doc, setLayoutConstraint(targetNode, this.constraintPartial));
  }

  public undo(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }
    const restored: SectionNode = {
      ...targetNode,
      props:
        this.previousConstraints === undefined
          ? withoutPropKey(targetNode, 'layoutConstraints')
          : {
              ...targetNode.props,
              layoutConstraints: this.previousConstraints,
            },
    };
    return updateNodeInDocument(doc, restored);
  }
}

/**
 * Removes a single layout constraint key from a node.
 */
export class RemoveLayoutConstraintCommand implements LayoutCommand {
  public readonly name: string;
  private previousValue: unknown;
  private hadConstraint = false;

  constructor(
    public readonly nodeId: string,
    public readonly key: LayoutConstraintKey
  ) {
    this.name = `Remove Layout Constraint (${key}) from Node "${nodeId}"`;
  }

  public execute(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }
    const current = readLayoutConstraints(targetNode);
    this.hadConstraint = current !== undefined && current[this.key] !== undefined;
    this.previousValue = current?.[this.key];
    return updateNodeInDocument(doc, removeLayoutConstraint(targetNode, this.key));
  }

  public undo(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode || !this.hadConstraint) {
      return doc;
    }
    return updateNodeInDocument(
      doc,
      setLayoutConstraint(
        targetNode,
        { [this.key]: this.previousValue } as Partial<
          Omit<LayoutConstraints, 'sizing'>
        > & { sizing?: Partial<LayoutSizing> }
      )
    );
  }
}

// ---------------------------------------------------------------------------
// Document / property helpers
// ---------------------------------------------------------------------------

function withoutPropKey(node: SectionNode, key: string): Record<string, unknown> {
  const props = { ...node.props };
  delete props[key];
  return props;
}

function findNodeInDocument(doc: BuilderDocument, nodeId: string): SectionNode | undefined {
  for (const page of doc.pages) {
    const found = searchSections(page.sections as ReadonlyArray<SectionNode>, nodeId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function searchSections(
  sections: ReadonlyArray<SectionNode>,
  nodeId: string
): SectionNode | undefined {
  for (const section of sections) {
    if (section.id === nodeId) {
      return section;
    }
    if (section.children.length > 0) {
      const child = searchSections(section.children as ReadonlyArray<SectionNode>, nodeId);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}