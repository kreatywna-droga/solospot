'use client';

/**
 * SelectInput — canonical dropdown (ONE system).
 */

import React from 'react';
import { inputCls } from './inputStyles';

export interface SelectInputProps {
  value?: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options }) => (
  <select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputCls} cursor-pointer`}
  >
    <option value="">—</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export default SelectInput;
