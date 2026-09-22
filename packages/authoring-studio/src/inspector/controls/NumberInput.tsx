'use client';

/**
 * NumberInput — canonical plain numeric input (ONE system).
 * Used for semantic numbers (z-index etc.) — no unit, no slider.
 */

import React from 'react';
import { inputCls } from './inputStyles';

export interface NumberInputProps {
  value?: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}) => (
  <input
    type="number"
    value={value ?? ''}
    min={min}
    max={max}
    step={step}
    placeholder={placeholder}
    onChange={(e) => {
      const n = parseFloat(e.target.value);
      if (!Number.isNaN(n)) onChange(n);
    }}
    className={inputCls}
  />
);

export default NumberInput;
