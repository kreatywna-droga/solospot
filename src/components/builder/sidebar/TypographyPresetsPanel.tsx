'use client';

import React from 'react';
import { Type, Heading1, Heading2, Heading3, Quote, AlignLeft, Tag, FileText } from 'lucide-react';
import { NodeStyles } from '../../../../packages/builder-core/src/BuilderDocument';

import { TYPOGRAPHY_PRESETS as TYPOGRAPHY_PRESETS_DATA, TypographyPreset as TypographyPresetDataType } from './TypographyPresetsData';

const ICON_MAP: Record<string, React.ElementType> = {
  Heading1, Heading2, Heading3, Type, AlignLeft, Quote, FileText, Tag,
};

export type TypographyPreset = TypographyPresetDataType;

export const TYPOGRAPHY_PRESETS: readonly TypographyPreset[] = TYPOGRAPHY_PRESETS_DATA.map((p) => ({
  ...p,
  icon: ICON_MAP[p.iconName || ''] || Type,
}));

interface TypographyPresetsPanelProps {
  onSelect: (preset: TypographyPreset) => void;
}

export const TypographyPresetsPanel: React.FC<TypographyPresetsPanelProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-1">
        Gotowe Elementy Typograficzne (Przeciągnij lub kliknij)
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {TYPOGRAPHY_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/solospot-component-type', preset.type);
                e.dataTransfer.setData('application/solospot-typography-preset', JSON.stringify(preset));
                e.dataTransfer.setData('text/plain', preset.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onSelect(preset)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/10 active:scale-[0.98] transition-all text-left group cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/25 group-hover:text-violet-300 transition-colors shrink-0">
                  {Icon ? <Icon className="w-4 h-4" /> : null}
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-semibold text-white truncate">{preset.name}</div>
                  <div
                    className="truncate mt-0.5"
                    style={preset.previewStyle}
                  >
                    {preset.defaultText}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
