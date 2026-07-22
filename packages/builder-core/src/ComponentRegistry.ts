/**
 * ComponentRegistry — C6.1-A
 *
 * Editor-side component catalogue.  Every component that appears in the Builder's
 * insertion palette MUST be registered here with a full PropSchema.
 *
 * ARCHITECTURAL NOTE:
 *   This is parallel to (not extending) runtime-core's SectionRegistry.
 *   Runtime cares about rendering. The Builder registry cares about:
 *     - What props does this component accept?
 *     - How should the props panel render them?
 *     - What is the default state?
 *     - Which category does this appear under in the palette?
 *
 *   The `type` field is the shared key that connects the two registries.
 *   No other coupling exists.
 */

// ---------------------------------------------------------------------------
// Prop schema — schema-driven UI generation
// ---------------------------------------------------------------------------

export type PropSchemaType =
  | 'string'        // single-line text
  | 'text'          // multi-line / richtext
  | 'number'        // numeric input
  | 'boolean'       // toggle
  | 'color'         // color picker
  | 'image'         // asset picker (URL or upload)
  | 'asset'         // generic asset (image, video, svg)
  | 'select'        // enum dropdown
  | 'multiselect'   // multi-value enum
  | 'array'         // repeatable sub-schema
  | 'object';       // nested prop group

export interface PropSchemaBase {
  readonly key: string;
  readonly label: string;
  readonly type: PropSchemaType;
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly description?: string;
  readonly group?: string;              // logical grouping in props panel
  readonly hidden?: boolean;            // exists in schema but not shown in UI
}

export interface StringPropSchema extends PropSchemaBase {
  readonly type: 'string' | 'text';
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export interface NumberPropSchema extends PropSchemaBase {
  readonly type: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;              // e.g. 'px', '%', 'rem'
}

export interface SelectPropSchema extends PropSchemaBase {
  readonly type: 'select' | 'multiselect';
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: unknown }>;
}

export interface ArrayPropSchema extends PropSchemaBase {
  readonly type: 'array';
  readonly itemSchema: ReadonlyArray<PropSchema>;  // schema for each array item
  readonly maxItems?: number;
  readonly minItems?: number;
}

export interface ObjectPropSchema extends PropSchemaBase {
  readonly type: 'object';
  readonly fields: ReadonlyArray<PropSchema>;
}

export type PropSchema =
  | StringPropSchema
  | NumberPropSchema
  | SelectPropSchema
  | ArrayPropSchema
  | ObjectPropSchema
  | PropSchemaBase;  // covers color, image, asset, boolean

// ---------------------------------------------------------------------------
// Component descriptor
// ---------------------------------------------------------------------------

export interface ComponentDescriptor {
  readonly type: string;             // shared key with SectionRenderer.type in runtime-core
  readonly label: string;            // human-readable: "Hero Banner"
  readonly category: string;         // palette category: 'Hero', 'Products', 'Navigation', 'Layout'
  readonly icon: string;             // icon name (lucide) or inline SVG string
  readonly schema: ReadonlyArray<PropSchema>;
  readonly defaultProps: Record<string, unknown>;
  readonly thumbnail?: string;       // base64 or URL for palette card preview
  readonly previewable: boolean;     // can render live preview in builder
  readonly allowChildren: boolean;   // if true, SectionNode.children[] is active (container)
  readonly maxChildren?: number;     // undefined = unlimited
  readonly tags?: ReadonlyArray<string>; // for search/filter
}

// ---------------------------------------------------------------------------
// Registry interface
// ---------------------------------------------------------------------------

export interface BuilderComponentRegistry {
  register(descriptor: ComponentDescriptor): BuilderComponentRegistry;
  unregister(type: string): boolean;
  get(type: string): ComponentDescriptor | undefined;
  getAll(): ReadonlyArray<ComponentDescriptor>;
  getByCategory(): ReadonlyMap<string, ReadonlyArray<ComponentDescriptor>>;
  has(type: string): boolean;
  search(query: string): ReadonlyArray<ComponentDescriptor>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBuilderComponentRegistry(): BuilderComponentRegistry {
  const store = new Map<string, ComponentDescriptor>();

  return {
    register(descriptor) {
      store.set(descriptor.type, descriptor);
      return this;
    },

    unregister(type) {
      return store.delete(type);
    },

    get(type) {
      return store.get(type);
    },

    getAll() {
      return Array.from(store.values());
    },

    getByCategory() {
      const byCategory = new Map<string, ComponentDescriptor[]>();
      for (const descriptor of store.values()) {
        const existing = byCategory.get(descriptor.category) ?? [];
        existing.push(descriptor);
        byCategory.set(descriptor.category, existing);
      }
      // sort within each category by label
      for (const [cat, items] of byCategory) {
        byCategory.set(cat, [...items].sort((a, b) => a.label.localeCompare(b.label)));
      }
      return byCategory as ReadonlyMap<string, ReadonlyArray<ComponentDescriptor>>;
    },

    has(type) {
      return store.has(type);
    },

    search(query) {
      const q = query.toLowerCase().trim();
      if (!q) return this.getAll();
      return Array.from(store.values()).filter(d =>
        d.label.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.tags?.some(t => t.toLowerCase().includes(q))
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Helper — build a simple prop schema quickly
// ---------------------------------------------------------------------------

export function stringProp(params: Omit<StringPropSchema, 'type'>): StringPropSchema {
  return { type: 'string', ...params };
}

export function textProp(params: Omit<StringPropSchema, 'type'>): StringPropSchema {
  return { type: 'text', ...params };
}

export function colorProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'color', ...params };
}

export function imageProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'image', ...params };
}

export function booleanProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'boolean', ...params };
}

export function selectProp(
  params: Omit<SelectPropSchema, 'type'>
): SelectPropSchema {
  return { type: 'select', ...params };
}

export function numberProp(params: Omit<NumberPropSchema, 'type'>): NumberPropSchema {
  return { type: 'number', ...params };
}

export function arrayProp(params: Omit<ArrayPropSchema, 'type'>): ArrayPropSchema {
  return { type: 'array', ...params };
}
