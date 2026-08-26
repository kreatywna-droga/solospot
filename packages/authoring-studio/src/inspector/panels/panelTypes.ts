/**
 * panelTypes — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Shared types for inspector panels.
 * Panels render exclusively <PropertyField /> — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

import type * as React from 'react';
import type { PropertyFieldDefinition, Breakpoint } from '../registry/types';

/**
 * PanelProps — standard props every panel receives.
 * Panels are schema-driven: they receive field definitions from Agent 1's Registry
 * and render them via PropertyField (or their custom widget).
 */
export interface PanelProps {
  /** Field definitions from the registry for this panel's category. */
  fields: PropertyFieldDefinition[];
  /** Current property values keyed by field ID. */
  values: Record<string, unknown>;
  /** Called when a property value changes. */
  onChange: (key: string, value: unknown) => void;
  /** Active breakpoint for responsive editing. */
  breakpoint: Breakpoint;
/**
   * Render function for a single field.
   * Agent 1 provides this to connect to PropertyField.
   * When omitted, the panel resolves the widget via the Property Registry
   * (DECISION-042 — Inspector is a pure editing surface).
   */
  renderField?: (
    field: PropertyFieldDefinition,
    value: unknown,
    onChange: (val: unknown) => void,
  ) => React.ReactNode;
}

