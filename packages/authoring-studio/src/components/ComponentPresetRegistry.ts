/**
 * ComponentPresetRegistry.ts — Sprint S32 Component Preset Catalog & Registry
 *
 * Manages builtin and custom component preset definitions (Hero Card, Feature Grid, Navbar, CallToAction, Testimonial).
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import { createComponentPreset, type ComponentPreset } from './ComponentPresetModel';

export const BUILTIN_COMPONENT_PRESETS: ReadonlyArray<ComponentPreset> = [
  createComponentPreset({
    id: 'hero-card',
    category: 'section',
    name: 'Hero Card Preset',
    description: 'Hero section card with title, subtitle, image and action slot',
    defaultProps: {
      title: 'Welcome to WEB FACTOR Studio',
      subtitle: 'Build high-performance responsive web applications',
      width: 1200,
      height: 500,
    },
    defaultLayoutStyle: {
      mode: 'auto',
      direction: 'horizontal',
      gap: 20,
      paddingTop: 40,
      paddingRight: 40,
      paddingBottom: 40,
      paddingLeft: 40,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    defaultResponsiveOverrides: {
      mobile: { gap: 8, padding: 16, flexDirection: 'column' },
    },
    variants: [
      {
        id: 'primary',
        name: 'Primary Hero',
        overrideProps: { themeStyle: 'hero-primary' },
        overrideLayoutStyle: { gap: 24 },
      },
      {
        id: 'compact',
        name: 'Compact Hero',
        overrideProps: { themeStyle: 'hero-compact' },
        overrideLayoutStyle: { gap: 12, paddingTop: 20, paddingBottom: 20 },
      },
    ],
    defaultVariantId: 'primary',
    slots: [
      {
        name: 'action-slot',
        label: 'Action Buttons',
        allowedTypes: ['button', 'link'],
        minChildren: 0,
        maxChildren: 2,
      },
    ],
  }),

  createComponentPreset({
    id: 'feature-grid',
    category: 'section',
    name: 'Feature Grid Preset',
    description: '3-column feature grid layout with card slots',
    defaultProps: {
      columns: 3,
      width: 1200,
      height: 400,
    },
    defaultLayoutStyle: {
      mode: 'auto',
      direction: 'horizontal',
      gap: 16,
      wrap: true,
      alignItems: 'stretch',
    },
    defaultResponsiveOverrides: {
      mobile: { gap: 8, flexDirection: 'column' },
    },
    variants: [
      {
        id: 'grid-3col',
        name: '3 Columns',
        overrideProps: { columns: 3 },
      },
      {
        id: 'grid-2col',
        name: '2 Columns',
        overrideProps: { columns: 2 },
      },
    ],
    defaultVariantId: 'grid-3col',
    slots: [
      {
        name: 'features-slot',
        label: 'Feature Items',
        allowedTypes: ['card', 'section'],
        minChildren: 1,
        maxChildren: 6,
      },
    ],
  }),

  createComponentPreset({
    id: 'call-to-action',
    category: 'section',
    name: 'Call to Action Preset',
    description: 'Conversion CTA banner with message and target button slot',
    defaultProps: {
      heading: 'Ready to Publish Your Store?',
      buttonText: 'Get Started Now',
      width: 1000,
      height: 250,
    },
    defaultLayoutStyle: {
      mode: 'auto',
      direction: 'vertical',
      gap: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    variants: [
      {
        id: 'centered',
        name: 'Centered CTA',
        overrideProps: { textAlign: 'center' },
      },
      {
        id: 'left-aligned',
        name: 'Left Aligned CTA',
        overrideProps: { textAlign: 'left' },
        overrideLayoutStyle: { alignItems: 'start' },
      },
    ],
    defaultVariantId: 'centered',
    slots: [
      {
        name: 'cta-slot',
        label: 'CTA Buttons',
        allowedTypes: ['button', 'input'],
        minChildren: 1,
        maxChildren: 3,
      },
    ],
  }),
];

export class ComponentPresetRegistry {
  private readonly presetsMap: Map<string, ComponentPreset>;

  constructor(initialPresets: ReadonlyArray<ComponentPreset> = BUILTIN_COMPONENT_PRESETS) {
    this.presetsMap = new Map();
    for (const preset of initialPresets) {
      this.presetsMap.set(preset.id, preset);
    }
  }

  public getPreset(id: string): ComponentPreset | undefined {
    return this.presetsMap.get(id);
  }

  public getAllPresets(): ReadonlyArray<ComponentPreset> {
    return Array.from(this.presetsMap.values());
  }

  public registerPreset(preset: ComponentPreset): ComponentPresetRegistry {
    const nextMap = new Map(this.presetsMap);
    nextMap.set(preset.id, preset);
    return new ComponentPresetRegistry(Array.from(nextMap.values()));
  }

  public unregisterPreset(id: string): ComponentPresetRegistry {
    const nextMap = new Map(this.presetsMap);
    nextMap.delete(id);
    return new ComponentPresetRegistry(Array.from(nextMap.values()));
  }
}
