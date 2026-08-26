'use client';

import * as React from 'react';
import type { Breakpoint } from '../registry/types';

/**
 * BreakpointIcon — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Pure presentation icon for a breakpoint (desktop / tablet / mobile).
 * Renders an inline SVG — no jsdom, no browser-specific APIs.
 * No business logic, no inheritance logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

const PATHS: Record<Breakpoint, React.ReactNode> = {
  desktop: (
    <>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </>
  ),
  tablet: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
};

const LABELS: Record<Breakpoint, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

export interface BreakpointIconProps {
  /** Active breakpoint. */
  breakpoint: Breakpoint;
  /** Icon size in pixels. */
  size?: number;
}

/**
 * Presentational breakpoint icon.
 * Pure function of props — memoized.
 */
export const BreakpointIcon: React.FC<BreakpointIconProps> = ({ breakpoint, size = 14 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid={`breakpoint-icon-${breakpoint}`}
    >
      {PATHS[breakpoint]}
    </svg>
  );
};

export const BREAKPOINT_LABELS: Record<Breakpoint, string> = LABELS;

export default React.memo(BreakpointIcon);

