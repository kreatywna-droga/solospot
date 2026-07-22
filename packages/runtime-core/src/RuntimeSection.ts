export interface RuntimeSection {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly props: Record<string, unknown>;
  readonly order: number;
  readonly visible: boolean;
}

export interface RuntimePage {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly sections: ReadonlyArray<RuntimeSection>;
}

export interface RuntimeNavigation {
  readonly label: string;
  readonly href: string;
  readonly children?: ReadonlyArray<RuntimeNavigation>;
}

export interface RuntimeSEO {
  readonly title?: string;
  readonly description?: string;
  readonly ogImage?: string;
  readonly canonicalUrl?: string;
  readonly robots?: string;
  readonly jsonLdSchema?: Record<string, unknown>;
}

export function createRuntimeSection(
  id: string,
  type: string,
  label: string,
  props: Record<string, unknown> = {},
  order: number = 0,
  visible: boolean = true
): RuntimeSection {
  return {
    id,
    type,
    label,
    props,
    order,
    visible,
  };
}

export function createRuntimePage(
  id: string,
  slug: string,
  name: string,
  sections: ReadonlyArray<RuntimeSection> = []
): RuntimePage {
  return {
    id,
    slug,
    name,
    sections,
  };
}

export function sortSections(sections: ReadonlyArray<RuntimeSection>): ReadonlyArray<RuntimeSection> {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function filterVisibleSections(sections: ReadonlyArray<RuntimeSection>): ReadonlyArray<RuntimeSection> {
  return sections.filter(s => s.visible);
}