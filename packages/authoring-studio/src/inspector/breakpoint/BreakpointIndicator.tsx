'use client';

import * as React from 'react';
import type { Breakpoint } from '../registry/types';
import { BreakpointIcon } from './BreakpointIcon';

/**
 * BreakpointIndicator — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Presentational current-breakpoint badge.
 * Uses the active breakpoint to display an icon + label. Pure UI.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export interface BreakpointIndicatorProps {
  /** Current breakpoint. */
  breakpoint: Breakpoint;
  /** Optional custom label override (e.g. localized). */
  label?: string;
}

const DEFAULT_LABELS: Record<Breakpoint, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

const STYLES: Record<Breakpoint, string> = {
  desktop: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  tablet: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  mobile: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

/**
 * Presentational breakpoint indicator.
 * Pure function of props — memoized.
 */
export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({
  breakpoint,
  label,
}) => {
  const text = label ?? DEFAULT_LABELS[breakpoint];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${STYLES[breakpoint]}`}
      data-testid="breakpoint-indicator"
      data-breakpoint={breakpoint}
    >
      <BreakpointIcon breakpoint={breakpoint} size={11} />
      {text}
    </span>
  );
};

export default React.memo(BreakpointIndicator);

