// ContainerSection.ts
// C7: Builder Pro — section nesting

import { RuntimeSection } from '../../runtime-core/src/RuntimeSection';

export interface ContainerSection extends RuntimeSection {
  readonly type: 'container';
  readonly children: ReadonlyArray<string>;
  readonly collapsed: boolean;
}

export function createContainerSection(params: {
  id: string;
  label: string;
  children?: ReadonlyArray<string>;
  collapsed?: boolean;
}): ContainerSection {
  return {
    id: params.id,
    type: 'container',
    label: params.label,
    props: {},
    order: 0,
    visible: true,
    children: params.children ?? [],
    collapsed: params.collapsed ?? false,
  };
}

export function validateNestingDepth(
  document: { pages: ReadonlyArray<{ sections: ReadonlyArray<{ id: string; parentId?: string }> }> },
  sectionId: string,
  maxDepth: number = 3
): boolean {
  let depth = 0;
  let currentId: string | undefined = sectionId;

  while (currentId) {
    for (const page of document.pages) {
      const section = page.sections.find((s) => s.id === currentId);
      if (section?.parentId) {
        depth++;
        currentId = section.parentId;
      } else {
        currentId = undefined;
      }
      break;
    }
  }

  return depth < maxDepth;
}
