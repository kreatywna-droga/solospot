/**
 * Canonical Inspector control system — ONE system for every surface.
 *
 * Surfaces (PhaseThreeInspector, ContextualSettingsPanel, DesignInspector,
 * QuickToolbar, StylePanel, PropsPanel, widgets) must import from here instead
 * of defining local slider/color/unit/shadow/four-side controls.
 */

export { SmoothSlider, type SmoothSliderProps } from './SmoothSlider';
export { UnitInput, type UnitInputProps } from './UnitInput';
export { ColorControl, toHexForPicker, type ColorControlProps } from './ColorControl';
export { GradientControl, type GradientControlProps } from './GradientControl';
export { ShadowEditor, type ShadowEditorProps } from './ShadowEditor';
export { FourSideEditor, type FourSideEditorProps, type FourSide } from './FourSideEditor';
export { SelectInput, type SelectInputProps } from './SelectInput';
export { NumberInput, type NumberInputProps } from './NumberInput';
export { IconToggleGroup, type IconToggleGroupProps } from './IconToggleGroup';
export { parseBoxShadow, buildBoxShadow, type BoxShadowValue } from './boxShadow';
export {
  DEFAULT_GRADIENT,
  buildLinearGradient,
  parseLinearGradient,
  parseLinearGradientOrDefault,
  isGradientCss,
  isLinearGradientCss,
  type LinearGradientValue,
  type GradientStop,
} from './gradient';
export { parseUnitValue, formatUnitValue, type ParsedUnitValue } from './unitValue';
export { inputCls, unitInputCls, unitSelectCls, goldAccent } from './inputStyles';
