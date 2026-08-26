/**
 * ResponsiveCommands.ts — Sprint S28 Responsive Commands for HistoryStack<BuilderDocument>
 *
 * Provides undoable command classes for setting, removing, and toggling responsive
 * property overrides on BuilderDocument nodes.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { BreakpointId } from './ResponsiveValueModel';
import type { NodePropertyOverride } from './ResponsiveOverrideEngine';
import {
  getNodeResponsiveOverrides,
  setNodeResponsiveOverride,
  removeNodeResponsiveOverride,
  updateNodeInDocument,
} from './ResponsiveOverrideEngine';

export interface ResponsiveCommand {
  readonly name: string;
  execute(doc: BuilderDocument): BuilderDocument;
  undo(doc: BuilderDocument): BuilderDocument;
}

/**
 * Command to set or update a per-breakpoint property override on a target node.
 */
export class SetBreakpointOverrideCommand implements ResponsiveCommand {
  public readonly name: string;
  private previousOverrides: Record<string, any> | undefined;

  constructor(
    public readonly nodeId: string,
    public readonly breakpointId: BreakpointId,
    public readonly override: Partial<NodePropertyOverride>
  ) {
    this.name = `Set Responsive Override (${breakpointId}) on Node "${nodeId}"`;
  }

  public execute(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }

    this.previousOverrides = getNodeResponsiveOverrides(targetNode);
    const updatedNode = setNodeResponsiveOverride(targetNode, this.breakpointId, this.override);
    return updateNodeInDocument(doc, updatedNode);
  }

  public undo(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode || !this.previousOverrides) {
      return doc;
    }

    const restoredNode: SectionNode = {
      ...targetNode,
      props: {
        ...((targetNode.props as Record<string, any>) ?? {}),
        responsiveOverrides: this.previousOverrides,
      },
    };

    return updateNodeInDocument(doc, restoredNode);
  }
}

/**
 * Command to remove a per-breakpoint property override from a target node.
 */
export class RemoveBreakpointOverrideCommand implements ResponsiveCommand {
  public readonly name: string;
  private previousOverrideForBreakpoint: NodePropertyOverride | undefined;

  constructor(
    public readonly nodeId: string,
    public readonly breakpointId: BreakpointId
  ) {
    this.name = `Remove Responsive Override (${breakpointId}) from Node "${nodeId}"`;
  }

  public execute(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode) {
      return doc;
    }

    const currentOverrides = getNodeResponsiveOverrides(targetNode);
    this.previousOverrideForBreakpoint = currentOverrides[this.breakpointId];

    const updatedNode = removeNodeResponsiveOverride(targetNode, this.breakpointId);
    return updateNodeInDocument(doc, updatedNode);
  }

  public undo(doc: BuilderDocument): BuilderDocument {
    const targetNode = findNodeInDocument(doc, this.nodeId);
    if (!targetNode || !this.previousOverrideForBreakpoint) {
      return doc;
    }

    const updatedNode = setNodeResponsiveOverride(
      targetNode,
      this.breakpointId,
      this.previousOverrideForBreakpoint
    );
    return updateNodeInDocument(doc, updatedNode);
  }
}

/**
 * Helper to locate a SectionNode by ID inside a BuilderDocument.
 */
function findNodeInDocument(doc: BuilderDocument, nodeId: string): SectionNode | undefined {
  for (const page of doc.pages) {
    const found = searchSections(page.sections as ReadonlyArray<SectionNode>, nodeId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function searchSections(sections: ReadonlyArray<SectionNode>, nodeId: string): SectionNode | undefined {
  for (const sec of sections) {
    if (sec.id === nodeId) {
      return sec;
    }
    if (sec.children && sec.children.length > 0) {
      const child = searchSections(sec.children as ReadonlyArray<SectionNode>, nodeId);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
}
