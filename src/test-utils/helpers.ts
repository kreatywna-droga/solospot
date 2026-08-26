/**
 * Test Helpers & Assertions — TECH-003 Test Infrastructure Consolidation
 *
 * Reusable test helpers for Node & React SSR environments.
 */

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Renders a React element to static HTML string.
 */
export function renderToHtml(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

/**
 * Asserts that a rendered HTML string contains expected substrings.
 */
export function expectHtmlToContain(html: string, expectedSubstrings: string[]): void {
  for (const str of expectedSubstrings) {
    if (!html.includes(str)) {
      throw new Error(`Expected HTML markup to contain string "${str}", but it was missing.\nMarkup: ${html}`);
    }
  }
}

/**
 * Creates a no-operation callback suitable for mock prop handlers.
 */
export const noop = (): void => {};

/**
 * Delays execution for specified milliseconds in async test environments.
 */
export async function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
