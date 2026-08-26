'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';
import { Link2, Link2Off } from 'lucide-react';

/**
 * SpacingWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Spacing editor widget for padding/margin properties.
 * Renders 4 side inputs with link/unlink toggle.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const SIDE_SHORTS: Record<string, string> = { top: 'T', right: 'R', bottom: 'B', left: 'L' };

interface SpacingShape {
  top: number;
  right: number;
  bottom: number;
  left: number;
  linked: boolean;
}

const defaultSpacing: SpacingShape = { top: 0, right: 0, bottom: 0, left: 0, linked: true };

function parseSpacing(value: unknown): SpacingShape {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      top: typeof v.top === 'number' ? v.top : defaultSpacing.top,
      right: typeof v.right === 'number' ? v.right : defaultSpacing.right,
      bottom: typeof v.bottom === 'number' ? v.bottom : defaultSpacing.bottom,
      left: typeof v.left === 'number' ? v.left : defaultSpacing.left,
      linked: typeof v.linked === 'boolean' ? v.linked : defaultSpacing.linked,
    };
  }
  return defaultSpacing;
}

const SpacingWidget: React.FC<WidgetProps<SpacingShape>> = ({ value, onChange }) => {
  const spacing = parseSpacing(value);

  const toggleLink = () => {
    const wasLinked = spacing.linked;
    if (wasLinked) {
      onChange({ ...spacing, linked: false });
    } else {
      const avg = spacing.top || spacing.right || spacing.bottom || spacing.left || 0;
      onChange({ ...spacing, top: avg, right: avg, bottom: avg, left: avg, linked: true });
    }
  };

  const handleSideChange = (side: string, raw: string) => {
    const num = parseInt(raw, 10);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(0, Math.min(9999, num));

    if (spacing.linked) {
      onChange({ ...spacing, top: clamped, right: clamped, bottom: clamped, left: clamped });
    } else {
      onChange({ ...spacing, [side]: clamped });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={labelClass}>Spacing</span>
        <button
          onClick={toggleLink}
          className={`p-1 rounded transition-colors ${
            spacing.linked
              ? 'text-violet-400 hover:text-violet-300 bg-violet-500/10'
              : 'text-slate-500 hover:text-white bg-white/5'
          }`}
          title={spacing.linked ? 'Unlink sides' : 'Link all sides'}
        >
          {spacing.linked
            ? <Link2 className="w-3.5 h-3.5" />
            : <Link2Off className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {SIDES.map((side) => {
          const val = spacing[side];
          return (
            <div key={side} className="relative">
              <input
                type="number"
                value={val}
                min={0}
                max={9999}
                onChange={(e) => handleSideChange(side, e.target.value)}
                className={`${inputBaseClass} text-center font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                {SIDE_SHORTS[side]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SpacingWidget);

