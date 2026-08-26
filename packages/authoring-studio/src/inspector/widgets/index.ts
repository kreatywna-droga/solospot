/**
 * Widgets Barrel Export — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * All widgets are UI-only components implementing WidgetComponent (FC<WidgetProps>).
 * They do NOT register themselves with any Registry — Agent 1 does that.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export { WidgetField } from './WidgetField';
export type { WidgetFieldProps } from './WidgetField';
export {
  inputBaseClass,
  labelClass,
  inlineLabelClass,
  descriptionClass,
  errorClass,
  toDisplayString,
  toDisplayNumber,
  toDisplayBoolean,
} from './WidgetShared';

export { default as TextWidget } from './TextWidget';
export { default as TextareaWidget } from './TextareaWidget';
export { default as NumberWidget } from './NumberWidget';
export { default as RangeWidget } from './RangeWidget';
export { default as ColorWidget } from './ColorWidget';
export { default as SelectWidget } from './SelectWidget';
export { default as BooleanWidget } from './BooleanWidget';
export { default as RadioWidget } from './RadioWidget';
export { default as SpacingWidget } from './SpacingWidget';
export { default as BorderWidget } from './BorderWidget';
export { default as ShadowWidget } from './ShadowWidget';
export { default as TypographyWidget } from './TypographyWidget';
export { default as LinkWidget } from './LinkWidget';
export { default as ImageWidget } from './ImageWidget';

