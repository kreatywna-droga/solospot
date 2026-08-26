/**
 * Panels Barrel Export — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * All panels are pure presentation: they render exclusively via
 * InspectorPanelFields (which maps to PropertyField through Agent 1's bridge).
 * No business logic, no switch(type), no registry logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export { InspectorPanelFields } from './InspectorPanelFields';
export type { InspectorPanelFieldsProps } from './InspectorPanelFields';
export type { PanelProps } from './panelTypes';
export { DynamicPropertyPanel } from './DynamicPropertyPanel';
export type { DynamicPropertyPanelProps } from './DynamicPropertyPanel';
export { toPropertyFieldDefinition, toPropertyFieldDefinitions } from './schemaAdapter';
export { AppearancePanel } from './AppearancePanel';
export { LayoutPanel } from './LayoutPanel';
export { TypographyPanel } from './TypographyPanel';
export { SpacingPanel } from './SpacingPanel';
export { BorderPanel } from './BorderPanel';
export { ShadowPanel } from './ShadowPanel';
export { AnimationPanel } from './AnimationPanel';
export { createAnimationPanelAdapterState, validateAnimationFieldValue } from './AnimationPanelAdapter';
export type { AnimationPanelAdapterState } from './AnimationPanelAdapter';
export { AdvancedPanel } from './AdvancedPanel';

