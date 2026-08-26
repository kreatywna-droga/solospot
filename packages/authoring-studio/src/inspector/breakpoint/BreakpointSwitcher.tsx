'use client';

import * as React from 'react';
import type { Breakpoint } from '../registry/types';
import { BreakpointIcon } from './BreakpointIcon';

/**
 * BreakpointSwitcher — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Presentational breakpoint switcher (Desktop / Tablet / Mobile).
 * Pure UI — no responsive inheritance, no responsive value logic.
 * Controlled component: receives active breakpoint + on change callback.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export interface BreakpointSwitcherProps {
  /** Currently active breakpoint. */
  active: Breakpoint;
  /** Called when user clicks a breakpoint. */
  onChange: (breakpoint: Breakpoint) => void;
  /** Combined label for all breakpoints; override to reorder / limit. */
  breakpoints?: Breakpoint[];
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = ['desktop', 'tablet', 'mobile'];

const LABELS: Record<Breakpoint, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

/**
 * Presentational breakpoint switcher.
 * Pure function of props — memoized.
 */
export const BreakpointSwitcher: React.FC<BreakpointSwitcherProps> = ({
  active,
  onChange,
  breakpoints = DEFAULT_BREAKPOINTS,
}) => {
  return (
    <div
      className="breakpoint-switcher inline-flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5"
      role="group"
      aria-label="Breakpoint switcher"
      data-testid="breakpoint-switcher"
    >
      {breakpoints.map((bp) => (
        <button
          key={bp}
          onClick={() => onChange(bp)}
          className={`p-1 rounded transition-all flex items-center gap-1.5 ${
            active === bp
              ? 'bg-violet-500/20 text-violet-400'
              : 'text-slate-500 hover:text-white'
          }`}
          title={LABELS[bp]}
          aria-pressed={active === bp}
          data-testid={`breakpoint-${bp}`}
        >
          <BreakpointIcon breakpoint={bp} />
          <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider">
            {LABELS[bp]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(BreakpointSwitcher);

