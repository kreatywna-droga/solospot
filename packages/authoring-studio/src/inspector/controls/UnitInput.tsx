'use client';

/**
 * UnitInput — canonical numeric input + unit select + optional SmoothSlider.
 *
 * - Number field: local draft while typing; commits on blur / Enter (single
 *   history entry per edit session), live value stays consistent with slider.
 * - Unit select: commits immediately.
 * - Slider: SmoothSlider — live DOM preview during drag, single commit on pointerup.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SmoothSlider } from './SmoothSlider';
import { parseUnitValue, formatUnitValue } from './unitValue';
import { unitInputCls, unitSelectCls } from './inputStyles';

export interface UnitInputProps {
  value?: string;
  onChange: (v: string) => void;
  /** Called while typing / during slider drag for immediate DOM preview */
  onLivePreview?: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** When true, renders a SmoothSlider + numeric input pair sharing the same value */
  slider?: boolean;
  /** Default unit appended when no unit is detected (default: 'px'; '' = unitless ratio) */
  defaultUnit?: string;
}

export const UnitInput: React.FC<UnitInputProps> = ({
  value,
  onChange,
  onLivePreview,
  placeholder = '0',
  min,
  max,
  step,
  slider,
  defaultUnit = 'px',
}) => {
  const parsed = parseUnitValue(value, defaultUnit);
  const { number: numVal, hasNumber } = parsed;
  const detectedUnit = parsed.unit;

  const [unit, setUnit] = useState(detectedUnit);
  const [draft, setDraft] = useState(hasNumber ? String(numVal) : '');
  const [focused, setFocused] = useState(false);
  const lastEmitted = useRef(value ?? '');

  useEffect(() => {
    const p = parseUnitValue(value, defaultUnit);
    setUnit(p.unit);
    if (!focused) {
      setDraft(p.hasNumber ? String(p.number) : '');
      lastEmitted.current = value ?? '';
    }
  }, [value, defaultUnit, focused]);

  const commit = useCallback(
    (num: string, u: string) => {
      if (!num) {
        if (lastEmitted.current !== '') {
          lastEmitted.current = '';
          onChange('');
        }
        return;
      }
      const next = formatUnitValue(num, u !== undefined ? u : defaultUnit);
      if (next !== lastEmitted.current) {
        lastEmitted.current = next;
        onChange(next);
      }
    },
    [onChange, defaultUnit],
  );

  const handleDraftChange = (raw: string) => {
    setDraft(raw);
    const preview = raw ? formatUnitValue(raw, unit) : '';
    onLivePreview?.(preview);
  };

  const commitDraft = () => {
    commit(draft.trim(), unit);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(draft.trim(), unit);
    }
  };

  const handleSliderChange = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    const activeUnit = unit !== undefined ? unit : defaultUnit;
    const next = formatUnitValue(rounded, activeUnit);
    setDraft(String(rounded));
    if (next !== lastEmitted.current) {
      lastEmitted.current = next;
      onChange(next);
    }
  };

  const handleSliderLivePreview = (n: number) => {
    const rounded = Math.round(n * 100) / 100;
    const activeUnit = unit !== undefined ? unit : defaultUnit;
    setDraft(String(rounded));
    onLivePreview?.(formatUnitValue(rounded, activeUnit));
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex">
        <input
          type="number"
          value={draft}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          onFocus={() => setFocused(true)}
          onChange={(e) => handleDraftChange(e.target.value)}
          onBlur={() => {
            commitDraft();
            setFocused(false);
          }}
          onKeyDown={handleKeyDown}
          className={unitInputCls}
        />
        <select
          value={unit}
          onChange={(e) => {
            const nextUnit = e.target.value;
            setUnit(nextUnit);
            commit(draft.trim(), nextUnit);
          }}
          className={unitSelectCls}
        >
          <option value="">—</option>
          <option>px</option>
          <option>%</option>
          <option>rem</option>
          <option>em</option>
          <option>vw</option>
          <option>vh</option>
          <option>fr</option>
          <option>auto</option>
        </select>
      </div>
      {slider && min !== undefined && max !== undefined && (
        <SmoothSlider
          min={min}
          max={max}
          step={step ?? 1}
          value={hasNum(numVal) ? Math.min(max, Math.max(min, numVal)) : min}
          onChange={handleSliderChange}
          onLivePreview={handleSliderLivePreview}
          unit={unit}
        />
      )}
    </div>
  );
};

function hasNum(n: number): boolean {
  return !Number.isNaN(n);
}

export default UnitInput;
