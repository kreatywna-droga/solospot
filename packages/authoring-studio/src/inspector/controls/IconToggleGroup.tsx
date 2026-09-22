'use client';

/**
 * IconToggleGroup — canonical segmented icon toggle (ONE system).
 */

import React from 'react';

export interface IconToggleGroupProps<T extends string> {
  value?: T;
  onChange: (v: T) => void;
  options: { value: T; icon: React.ReactNode; title: string }[];
}

export function IconToggleGroup<T extends string>({ value, onChange, options }: IconToggleGroupProps<T>) {
  return (
    <div className="flex gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center p-1.5 rounded text-[11px] transition-colors ${
            value === opt.value
              ? 'bg-[#D9A86C]/20 text-[#F2C27F] border border-[#D9A86C]/40'
              : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

export default IconToggleGroup;
