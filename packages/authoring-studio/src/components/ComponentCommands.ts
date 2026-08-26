/**
 * ComponentCommands.ts — Sprint S32 Component System Undoable Commands
 *
 * Provides undoable commands for applying component presets, switching variants,
 * inserting slot nodes, and removing slot nodes.
 *
 * All operations execute immutably via transformNodeInDocument (calling touchDocument)
 * and update the BuilderDocument SSOT.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { createSectionNode, touchDocument } from '../../../builder-core/src/BuilderDocument';
import { ComponentPresetRegistry } from './ComponentPresetRegistry';
import {
  validateSlotChildInsertion,
  validateSlotChildRemoval,
} from './ComponentSlotComposition';

export interface ComponentCommandResult {
  readonly success: boolean;
  readonly doc: BuilderDocument;
  readonly commandName: string;
  readonly error?: string;
}

function transformNodeInDocument(
  doc: BuilderDocument,
  nodeId: string,
  transform: (node: SectionNode) => SectionNode
): BuilderDocument {
  const updateSections = (sections: ReadonlyArray<SectionNode>): SectionNode[] => {
    return sections.map((sec) => {
      let current = sec;
      if (current.id === nodeId) {
        current = transform(current);
      }
      if (current.children && current.children.length > 0) {
        current = {
          ...current,
          children: updateSections(current.children),
        };
      }
      return current;
    });
  };

  const updatedDoc: BuilderDocument = {
    ...doc,
    pages: doc.pages.map((page) => ({
      ...page,
      sections: updateSections(page.sections),
    })),
  };

  return touchDocument(updatedDoc);
}

export class ApplyComponentPresetCommand {
  readonly name = 'Apply Component Preset';

  constructor(
    private readonly nodeId: string,
    private readonly presetId: string,
    private readonly variantId?: string,
    private readonly registry: ComponentPresetRegistry = new ComponentPresetRegistry()
  ) {}

  public execute(doc: BuilderDocument): ComponentCommandResult {
    const preset = this.registry.getPreset(this.presetId);
    if (!preset) {
      return { success: false, doc, commandName: this.name, error: `Preset '${this.presetId}' not found` };
    }

    const activeVariantId = this.variantId ?? preset.defaultVariantId;
    const variant = preset.variants.find((v) => v.id === activeVariantId) ?? preset.variants[0];

    const updatedDoc = transformNodeInDocument(doc, this.nodeId, (node: SectionNode) => {
      const mergedProps = {
        ...preset.defaultProps,
        ...variant.overrideProps,
        ...node.props,
        componentId: preset.id,
        variant: variant.id,
        layoutStyle: {
          ...(preset.defaultLayoutStyle ?? {}),
          ...(variant.overrideLayoutStyle ?? {}),
          ...((node.props.layoutStyle as Record<string, unknown>) ?? {}),
        },
        layoutConstraints: {
          ...(preset.defaultLayoutConstraints ?? {}),
          ...(variant.overrideLayoutConstraints ?? {}),
          ...((node.props.layoutConstraints as Record<string, unknown>) ?? {}),
        },
        responsiveOverrides: {
          ...(preset.defaultResponsiveOverrides ?? {}),
          ...((node.props.responsiveOverrides as Record<string, unknown>) ?? {}),
        },
      };

      return {
        ...node,
        props: mergedProps,
      };
    });

    return { success: true, doc: updatedDoc, commandName: `${this.name} (${preset.name})` };
  }
}

export class SetComponentVariantCommand {
  readonly name = 'Set Component Variant';

  constructor(
    private readonly nodeId: string,
    private readonly variantId: string,
    private readonly registry: ComponentPresetRegistry = new ComponentPresetRegistry()
  ) {}

  public execute(doc: BuilderDocument): ComponentCommandResult {
    let targetComponentId: string | undefined;

    const findNode = (nodes: readonly SectionNode[]): SectionNode | undefined => {
      for (const n of nodes) {
        if (n.id === this.nodeId) return n;
        if (n.children) {
          const res = findNode(n.children);
          if (res) return res;
        }
      }
      return undefined;
    };

    for (const page of doc.pages) {
      const found = findNode(page.sections);
      if (found) {
        targetComponentId = found.props?.componentId as string;
        break;
      }
    }

    if (!targetComponentId) {
      return { success: false, doc, commandName: this.name, error: `Node '${this.nodeId}' has no component preset attached` };
    }

    const preset = this.registry.getPreset(targetComponentId);
    if (!preset) {
      return { success: false, doc, commandName: this.name, error: `Preset '${targetComponentId}' not found` };
    }

    const variant = preset.variants.find((v) => v.id === this.variantId);
    if (!variant) {
      return { success: false, doc, commandName: this.name, error: `Variant '${this.variantId}' not found on preset '${targetComponentId}'` };
    }

    const updatedDoc = transformNodeInDocument(doc, this.nodeId, (node: SectionNode) => {
      const mergedProps = {
        ...node.props,
        ...variant.overrideProps,
        variant: variant.id,
        layoutStyle: {
          ...((node.props.layoutStyle as Record<string, unknown>) ?? {}),
          ...(variant.overrideLayoutStyle ?? {}),
        },
        layoutConstraints: {
          ...((node.props.layoutConstraints as Record<string, unknown>) ?? {}),
          ...(variant.overrideLayoutConstraints ?? {}),
        },
      };

      return {
        ...node,
        props: mergedProps,
      };
    });

    return { success: true, doc: updatedDoc, commandName: `${this.name} (${variant.name})` };
  }
}

export interface InsertSlotChildParams {
  readonly id: string;
  readonly type: string;
  readonly label?: string;
  readonly props?: Record<string, unknown>;
}

export class InsertSlotNodeCommand {
  readonly name = 'Insert Slot Node';

  constructor(
    private readonly parentNodeId: string,
    private readonly slotName: string,
    private readonly childParams: InsertSlotChildParams,
    private readonly registry: ComponentPresetRegistry = new ComponentPresetRegistry()
  ) {}

  public execute(doc: BuilderDocument): ComponentCommandResult {
    let parentNode: SectionNode | undefined;

    const findNode = (nodes: readonly SectionNode[]): SectionNode | undefined => {
      for (const n of nodes) {
        if (n.id === this.parentNodeId) return n;
        if (n.children) {
          const res = findNode(n.children);
          if (res) return res;
        }
      }
      return undefined;
    };

    for (const page of doc.pages) {
      const found = findNode(page.sections);
      if (found) {
        parentNode = found;
        break;
      }
    }

    if (!parentNode) {
      return { success: false, doc, commandName: this.name, error: `Parent node '${this.parentNodeId}' not found` };
    }

    const validation = validateSlotChildInsertion(parentNode, this.slotName, this.childParams.type, this.registry);
    if (!validation.valid) {
      return { success: false, doc, commandName: this.name, error: validation.reason };
    }

    const childNode = createSectionNode({
      id: this.childParams.id,
      type: this.childParams.type,
      label: this.childParams.label ?? `SlotChild_${this.childParams.id}`,
      props: {
        ...(this.childParams.props ?? {}),
        slotName: this.slotName,
      },
    });

    const updatedDoc = transformNodeInDocument(doc, this.parentNodeId, (node: SectionNode) => {
      const existingChildren = node.children ?? [];
      return {
        ...node,
        children: [...existingChildren, childNode],
      };
    });

    return { success: true, doc: updatedDoc, commandName: `${this.name} (${this.slotName})` };
  }
}

export class RemoveSlotNodeCommand {
  readonly name = 'Remove Slot Node';

  constructor(
    private readonly parentNodeId: string,
    private readonly childNodeId: string,
    private readonly registry: ComponentPresetRegistry = new ComponentPresetRegistry()
  ) {}

  public execute(doc: BuilderDocument): ComponentCommandResult {
    let parentNode: SectionNode | undefined;
    let targetChild: SectionNode | undefined;

    const findNode = (nodes: readonly SectionNode[]): SectionNode | undefined => {
      for (const n of nodes) {
        if (n.id === this.parentNodeId) return n;
        if (n.children) {
          const res = findNode(n.children);
          if (res) return res;
        }
      }
      return undefined;
    };

    for (const page of doc.pages) {
      const found = findNode(page.sections);
      if (found) {
        parentNode = found;
        targetChild = parentNode.children?.find((c) => c.id === this.childNodeId);
        break;
      }
    }

    if (!parentNode || !targetChild) {
      return { success: false, doc, commandName: this.name, error: `Parent '${this.parentNodeId}' or Child '${this.childNodeId}' not found` };
    }

    const slotName = targetChild.props?.slotName as string;
    if (slotName) {
      const validation = validateSlotChildRemoval(parentNode, slotName, this.registry);
      if (!validation.valid) {
        return { success: false, doc, commandName: this.name, error: validation.reason };
      }
    }

    const updatedDoc = transformNodeInDocument(doc, this.parentNodeId, (node: SectionNode) => {
      const existingChildren = node.children ?? [];
      return {
        ...node,
        children: existingChildren.filter((c: SectionNode) => c.id !== this.childNodeId),
      };
    });

    return { success: true, doc: updatedDoc, commandName: `${this.name} (${this.childNodeId})` };
  }
}
