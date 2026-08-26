/**
 * Breakpoint — Sprint 7.1 UI Layer tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 * Verifies breakpoint UI components are pure presentation.
 *
 * NOTE: This is a .ts file (per Sprint 7.1 convention), so JSX is written
 * using React.createElement to remain valid TypeScript.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';

import { BreakpointIcon } from '../breakpoint/BreakpointIcon';
import { BreakpointSwitcher } from '../breakpoint/BreakpointSwitcher';
import { BreakpointIndicator } from '../breakpoint/BreakpointIndicator';

const noop = () => {};

// ---------------------------------------------------------------------------
// BreakpointIcon
// ---------------------------------------------------------------------------

describe('BreakpointIcon', () => {
  it('renders svg with data-testid for desktop', () => {
    const html = renderToStaticMarkup(React.createElement(BreakpointIcon, { breakpoint: 'desktop' }));
    expect(html).toContain('data-testid="breakpoint-icon-desktop"');
    expect(html).toContain('<svg');
  });

  it('renders svg for tablet and mobile', () => {
    expect(renderToStaticMarkup(React.createElement(BreakpointIcon, { breakpoint: 'tablet' }))).toContain('breakpoint-icon-tablet');
    expect(renderToStaticMarkup(React.createElement(BreakpointIcon, { breakpoint: 'mobile' }))).toContain('breakpoint-icon-mobile');
  });

  it('respects size prop', () => {
    const html = renderToStaticMarkup(React.createElement(BreakpointIcon, { breakpoint: 'desktop', size: 20 }));
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
  });
});

// ---------------------------------------------------------------------------
// BreakpointSwitcher
// ---------------------------------------------------------------------------

describe('BreakpointSwitcher', () => {
  it('renders three breakpoint buttons by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreakpointSwitcher, { active: 'desktop', onChange: noop })
    );
    expect(html).toContain('data-testid="breakpoint-switcher"');
    expect(html).toContain('data-testid="breakpoint-desktop"');
    expect(html).toContain('data-testid="breakpoint-tablet"');
    expect(html).toContain('data-testid="breakpoint-mobile"');
  });

  it('marks every button with aria-pressed', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreakpointSwitcher, { active: 'tablet', onChange: noop })
    );
    expect(html).toContain('aria-pressed="false"');
  });

  it('does not invoke onChange during SSR', () => {
    const onChange = vi.fn();
    renderToStaticMarkup(React.createElement(BreakpointSwitcher, { active: 'desktop', onChange }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// BreakpointIndicator
// ---------------------------------------------------------------------------

describe('BreakpointIndicator', () => {
  it('renders indicator with breakpoint data attribute', () => {
    const html = renderToStaticMarkup(React.createElement(BreakpointIndicator, { breakpoint: 'mobile' }));
    expect(html).toContain('data-testid="breakpoint-indicator"');
    expect(html).toContain('data-breakpoint="mobile"');
  });

  it('renders default label', () => {
    expect(renderToStaticMarkup(React.createElement(BreakpointIndicator, { breakpoint: 'desktop' }))).toContain('Desktop');
    expect(renderToStaticMarkup(React.createElement(BreakpointIndicator, { breakpoint: 'tablet' }))).toContain('Tablet');
    expect(renderToStaticMarkup(React.createElement(BreakpointIndicator, { breakpoint: 'mobile' }))).toContain('Mobile');
  });

  it('renders custom label override', () => {
    const html = renderToStaticMarkup(React.createElement(BreakpointIndicator, { breakpoint: 'tablet', label: 'Tab' }));
    expect(html).toContain('Tab');
  });
});

