/**
 * PropertyRegistry — C16.7 Property Field Renderer Registry (Sprint 4.5)
 *
 * Plugin-extensible registry for property field renderers.
 * Replaces the switch(schema.type) pattern in PropertyField.tsx.
 *
 * Architecture:
 *   PropertyRegistry.register('string', StringField)
 *   PropertyRegistry.register('gradient', GradientField)  ← plugin adds this
 *   PropertyRegistry.get('gradient') → GradientField
 *
 * Benefits:
 *   - Zero changes to PropertyField when adding new field types
 *   - Plugins can register custom renderers (gradient, font, richtext, etc.)
 *   - Each renderer is a standard React component
 *   - Fallback renderer for unknown/unregistered types
 *
 * DESIGN DECISIONS:
 *   - This is a pure interface + factory — no React dependency
 *   - React components are registered externally (by app or plugin)
 *   - Default fallback renderer can be set via setFallback()
 *   - Fail-fast: get() returns undefined if not registered
 */

import type { PropSchema } from './ComponentRegistry';

// ---------------------------------------------------------------------------
// Field Renderer — the contract every field component must satisfy
// ---------------------------------------------------------------------------

export interface FieldRendererProps {
  /** The PropSchema describing this field */
  readonly schema: PropSchema;
  /** Current value */
  readonly value: unknown;
  /** Called when value changes */
  readonly onChange: (key: string, value: unknown) => void;
  /** Optional validation error message */
  readonly error?: string | null;
}

/**
 * A FieldRenderer is any React component that accepts FieldRendererProps.
 * This could be a function component, a class component, or a memo'd wrapper.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldRenderer = React.ComponentType<FieldRendererProps>;

// ---------------------------------------------------------------------------
// Registry interface
// ---------------------------------------------------------------------------

export interface PropertyFieldRegistry {
  /**
   * Register a renderer for a given schema type.
   * Returns the registry for chaining.
   */
  register(type: string, renderer: FieldRenderer): PropertyFieldRegistry;

  /**
   * Remove a renderer registration.
   * Returns true if the type was registered and removed.
   */
  unregister(type: string): boolean;

  /**
   * Get the renderer for a given schema type.
   * Returns undefined if no renderer is registered.
   */
  get(type: string): FieldRenderer | undefined;

  /**
   * Check if a renderer is registered for a given type.
   */
  has(type: string): boolean;

  /**
   * Get all registered type → renderer entries.
   */
  entries(): ReadonlyArray<[string, FieldRenderer]>;

  /**
   * Set a fallback renderer used when no renderer is registered for a type.
   * If no fallback is set, get() returns undefined for unknown types.
   */
  setFallback(renderer: FieldRenderer | null): void;

  /**
   * Get the current fallback renderer.
   */
  getFallback(): FieldRenderer | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPropertyFieldRegistry(): PropertyFieldRegistry {
  const store = new Map<string, FieldRenderer>();
  let fallback: FieldRenderer | null = null;

  return {
    register(type, renderer) {
      if (!type || typeof type !== 'string') {
        throw new Error(`PropertyRegistry.register() requires a valid type string, got "${String(type)}"`);
      }
      store.set(type, renderer);
      return this;
    },

    unregister(type) {
      return store.delete(type);
    },

    get(type) {
      return store.get(type) ?? fallback ?? undefined;
    },

    has(type) {
      return store.has(type);
    },

    entries() {
      return Array.from(store.entries());
    },

    setFallback(renderer) {
      fallback = renderer;
    },

    getFallback() {
      return fallback;
    },
  };
}

