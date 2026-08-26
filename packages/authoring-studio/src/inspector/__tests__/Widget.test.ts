/**
 * Widget — Sprint 7.1 UI Layer tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 * Verifies widgets are pure presentation and render correct markup.
 *
 * NOTE: This is a .ts file (per Sprint 7.1 convention), so JSX is written
 * using React.createElement to remain valid TypeScript.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import type { PropertyFieldDefinition } from '../registry/types';

import TextWidget from '../widgets/TextWidget';
import TextareaWidget from '../widgets/TextareaWidget';
import NumberWidget from '../widgets/NumberWidget';
import RangeWidget from '../widgets/RangeWidget';
import ColorWidget from '../widgets/ColorWidget';
import SelectWidget from '../widgets/SelectWidget';
import BooleanWidget from '../widgets/BooleanWidget';
import RadioWidget from '../widgets/RadioWidget';
import SpacingWidget from '../widgets/SpacingWidget';
import BorderWidget from '../widgets/BorderWidget';
import ShadowWidget from '../widgets/ShadowWidget';
import TypographyWidget from '../widgets/TypographyWidget';
import LinkWidget from '../widgets/LinkWidget';
import ImageWidget from '../widgets/ImageWidget';
import { WidgetField } from '../widgets/WidgetField';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeField(overrides: Partial<PropertyFieldDefinition> = {}): PropertyFieldDefinition {
  return {
    id: 'test-field',
    label: 'Test Field',
    description: 'Test description',
    defaultValue: undefined,
    validation: () => ({ valid: true }),
    widget: 'text',
    category: 'layout',
    ...overrides,
  };
}

const noop = () => {};

// ---------------------------------------------------------------------------
// WidgetField
// ---------------------------------------------------------------------------

describe('WidgetField', () => {
  it('renders label and description', () => {
    const html = renderToStaticMarkup(
      React.createElement(WidgetField, {
        field: makeField(),
        children: React.createElement('span', { 'data-testid': 'child' }, 'child'),
      })
    );
    expect(html).toContain('Test Field');
    expect(html).toContain('Test description');
    expect(html).toContain('child');
  });

  it('renders inline variant when inline=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(WidgetField, {
        field: makeField(),
        inline: true,
        children: React.createElement('span', null, 'toggle'),
      })
    );
    expect(html).toContain('flex items-center justify-between');
  });
});

// ---------------------------------------------------------------------------
// TextWidget
// ---------------------------------------------------------------------------

describe('TextWidget', () => {
  it('renders input with value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextWidget, { value: 'hello', onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('type="text"');
    expect(html).toContain('value="hello"');
  });

  it('renders placeholder from field', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextWidget, { value: '', onChange: noop, field: makeField({ placeholder: 'Enter name' }), breakpoint: 'desktop' })
    );
    expect(html).toContain('Enter name');
  });
});

// ---------------------------------------------------------------------------
// TextareaWidget
// ---------------------------------------------------------------------------

describe('TextareaWidget', () => {
  it('renders textarea with value', () => {
    const html = renderToStaticMarkup(
      React.createElement(TextareaWidget, { value: 'line1\nline2', onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('<textarea');
    expect(html).toContain('line1');
  });
});

// ---------------------------------------------------------------------------
// NumberWidget
// ---------------------------------------------------------------------------

describe('NumberWidget', () => {
  it('renders number input with numeric value', () => {
    const html = renderToStaticMarkup(
      React.createElement(NumberWidget, { value: 42, onChange: noop, field: makeField({ min: 0, max: 100, step: 2 }), breakpoint: 'desktop' })
    );
    expect(html).toContain('type="number"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="100"');
    expect(html).toContain('step="2"');
  });

  it('renders unit suffix', () => {
    const html = renderToStaticMarkup(
      React.createElement(NumberWidget, { value: 42, onChange: noop, field: makeField({ unit: 'px' }), breakpoint: 'desktop' })
    );
    expect(html).toContain('px');
  });
});

// ---------------------------------------------------------------------------
// RangeWidget
// ---------------------------------------------------------------------------

describe('RangeWidget', () => {
  it('renders range input with min/max/step', () => {
    const html = renderToStaticMarkup(
      React.createElement(RangeWidget, { value: 50, onChange: noop, field: makeField({ min: 0, max: 100, step: 5 }), breakpoint: 'desktop' })
    );
    expect(html).toContain('type="range"');
    expect(html).toContain('max="100"');
    expect(html).toContain('step="5"');
  });
});

// ---------------------------------------------------------------------------
// ColorWidget
// ---------------------------------------------------------------------------

describe('ColorWidget', () => {
  it('renders color and text inputs', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorWidget, { value: '#ff0000', onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('type="color"');
    expect(html).toContain('value="#ff0000"');
  });

  it('falls back to default color when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(ColorWidget, { value: '', onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('#6366f1');
  });
});

// ---------------------------------------------------------------------------
// SelectWidget
// ---------------------------------------------------------------------------

describe('SelectWidget', () => {
  it('renders select with options from field', () => {
    const html = renderToStaticMarkup(
      React.createElement(SelectWidget, {
        value: 'b',
        onChange: noop,
        field: makeField({ options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] }),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('<select');
    expect(html).toContain('A');
    expect(html).toContain('B');
  });
});

// ---------------------------------------------------------------------------
// BooleanWidget
// ---------------------------------------------------------------------------

describe('BooleanWidget', () => {
  it('renders toggle with on state', () => {
    const html = renderToStaticMarkup(
      React.createElement(BooleanWidget, { value: true, onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });

  it('renders toggle with off state', () => {
    const html = renderToStaticMarkup(
      React.createElement(BooleanWidget, { value: false, onChange: noop, field: makeField(), breakpoint: 'desktop' })
    );
    expect(html).toContain('aria-checked="false"');
  });
});

// ---------------------------------------------------------------------------
// RadioWidget
// ---------------------------------------------------------------------------

describe('RadioWidget', () => {
  it('renders radio options and selects current value', () => {
    const html = renderToStaticMarkup(
      React.createElement(RadioWidget, {
        value: 'b',
        onChange: noop,
        field: makeField({ options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] }),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('type="radio"');
    expect(html).toContain('A');
    expect(html).toContain('B');
  });
});

// ---------------------------------------------------------------------------
// SpacingWidget
// ---------------------------------------------------------------------------

describe('SpacingWidget', () => {
  it('renders 4 side inputs', () => {
    const html = renderToStaticMarkup(
      React.createElement(SpacingWidget, {
        value: { top: 1, right: 2, bottom: 3, left: 4, linked: false },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('type="number"');
    expect(html).toContain('>T<');
    expect(html).toContain('>R<');
    expect(html).toContain('>B<');
    expect(html).toContain('>L<');
  });
});

// ---------------------------------------------------------------------------
// BorderWidget
// ---------------------------------------------------------------------------

describe('BorderWidget', () => {
  it('renders style select, width input and color inputs', () => {
    const html = renderToStaticMarkup(
      React.createElement(BorderWidget, {
        value: { borderStyle: 'solid', borderWidth: { value: 2, unit: 'px' }, borderColor: '#ff0000' },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('Solid');
    expect(html).toContain('Dashed');
    expect(html).toContain('type="color"');
  });
});

// ---------------------------------------------------------------------------
// ShadowWidget
// ---------------------------------------------------------------------------

describe('ShadowWidget', () => {
  it('renders shadow controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShadowWidget, {
        value: { offsetX: 0, offsetY: 4, blur: 6, spread: 0, color: '#00000040', inset: false },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('Blur');
    expect(html).toContain('Spread');
    expect(html).toContain('type="color"');
  });
});

// ---------------------------------------------------------------------------
// TypographyWidget
// ---------------------------------------------------------------------------

describe('TypographyWidget', () => {
  it('renders typography controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(TypographyWidget, {
        value: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0, textAlign: 'left', textTransform: 'none' },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('Font family');
    expect(html).toContain('Inter');
    expect(html).toContain('Weight');
    expect(html).toContain('Line height');
  });
});

// ---------------------------------------------------------------------------
// LinkWidget
// ---------------------------------------------------------------------------

describe('LinkWidget', () => {
  it('renders link controls', () => {
    const html = renderToStaticMarkup(
      React.createElement(LinkWidget, {
        value: { href: '/about', target: '_self', rel: '', title: '' },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('URL');
    expect(html).toContain('/about');
    expect(html).toContain('Open in');
  });
});

// ---------------------------------------------------------------------------
// ImageWidget
// ---------------------------------------------------------------------------

describe('ImageWidget', () => {
  it('renders image controls and src', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImageWidget, {
        value: { src: 'https://example.com/a.jpg', alt: 'A', objectFit: 'cover' },
        onChange: noop,
        field: makeField(),
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('https://example.com/a.jpg');
    expect(html).toContain('Source URL');
    expect(html).toContain('Alt text');
  });
});

