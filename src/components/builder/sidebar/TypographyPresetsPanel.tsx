'use client';

import React from 'react';
import { Type, Heading1, Heading2, Heading3, Quote, AlignLeft, Tag, FileText } from 'lucide-react';
import { NodeStyles } from '../../../../packages/builder-core/src/BuilderDocument';

export interface TypographyPreset {
  id: string;
  name: string;
  category: 'headings' | 'body' | 'special';
  type: 'heading' | 'text';
  icon: React.ElementType;
  defaultText: string;
  styles: Partial<NodeStyles>;
  previewStyle: React.CSSProperties;
}

export const TYPOGRAPHY_PRESETS: readonly TypographyPreset[] = [
  {
    id: 'hero-title',
    name: 'Hero Title',
    category: 'headings',
    type: 'heading',
    icon: Heading1,
    defaultText: 'Główny Tytuł Sekcji',
    styles: {
      fontSize: '56px',
      fontWeight: '800',
      lineHeight: '1.1',
      letterSpacing: '-1.5px',
      color: '#ffffff',
      margin: { top: '0px', right: '0px', bottom: '16px', left: '0px' },
    },
    previewStyle: { fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' },
  },
  {
    id: 'heading-1',
    name: 'Nagłówek H1',
    category: 'headings',
    type: 'heading',
    icon: Heading1,
    defaultText: 'Nagłówek Poziomu 1',
    styles: {
      fontSize: '40px',
      fontWeight: '700',
      lineHeight: '1.2',
      letterSpacing: '-1px',
      color: '#ffffff',
      margin: { top: '0px', right: '0px', bottom: '12px', left: '0px' },
    },
    previewStyle: { fontSize: '18px', fontWeight: 700 },
  },
  {
    id: 'heading-2',
    name: 'Nagłówek H2',
    category: 'headings',
    type: 'heading',
    icon: Heading2,
    defaultText: 'Podtytuł Sekcji H2',
    styles: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.25',
      letterSpacing: '-0.5px',
      color: '#ffffff',
      margin: { top: '0px', right: '0px', bottom: '10px', left: '0px' },
    },
    previewStyle: { fontSize: '16px', fontWeight: 700 },
  },
  {
    id: 'heading-3',
    name: 'Nagłówek H3',
    category: 'headings',
    type: 'heading',
    icon: Heading3,
    defaultText: 'Tytuł Grupy H3',
    styles: {
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.3',
      color: '#ffffff',
      margin: { top: '0px', right: '0px', bottom: '8px', left: '0px' },
    },
    previewStyle: { fontSize: '14px', fontWeight: 600 },
  },
  {
    id: 'subheading',
    name: 'Subheading',
    category: 'headings',
    type: 'text',
    icon: Type,
    defaultText: 'Wprowadzenie do sekcji lub kluczowy opis tematu.',
    styles: {
      fontSize: '20px',
      fontWeight: '500',
      lineHeight: '1.4',
      color: '#94a3b8',
      margin: { top: '0px', right: '0px', bottom: '16px', left: '0px' },
    },
    previewStyle: { fontSize: '13px', fontWeight: 500, color: '#94a3b8' },
  },
  {
    id: 'paragraph',
    name: 'Akapit Tekstu',
    category: 'body',
    type: 'text',
    icon: AlignLeft,
    defaultText: 'Opisuj zalety oferty, funkcje produktu i informacje pomocne dla klientów w prosty i czytelny sposób.',
    styles: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '1.6',
      color: '#cbd5e1',
      margin: { top: '0px', right: '0px', bottom: '16px', left: '0px' },
    },
    previewStyle: { fontSize: '12px', fontWeight: 400, color: '#cbd5e1' },
  },
  {
    id: 'quote',
    name: 'Cytat / Wyróżnienie',
    category: 'special',
    type: 'text',
    icon: Quote,
    defaultText: '„Sukces e-commerce wymaga precyzji w każdym detalu.”',
    styles: {
      fontSize: '18px',
      fontWeight: '400',
      lineHeight: '1.5',
      color: '#e2e8f0',
      borderLeft: '3px solid #8b5cf6',
      padding: { top: '4px', right: '0px', bottom: '4px', left: '16px' },
      margin: { top: '0px', right: '0px', bottom: '16px', left: '0px' },
    },
    previewStyle: { fontSize: '12px', fontStyle: 'italic', borderLeft: '2px solid #8b5cf6', paddingLeft: '8px' },
  },
  {
    id: 'caption',
    name: 'Podpis (Caption)',
    category: 'body',
    type: 'text',
    icon: FileText,
    defaultText: 'Ilustracja 1: Prezentacja produktu na platformie SoloSpot',
    styles: {
      fontSize: '12px',
      fontWeight: '400',
      lineHeight: '1.4',
      color: '#64748b',
    },
    previewStyle: { fontSize: '11px', color: '#64748b' },
  },
  {
    id: 'label',
    name: 'Etykieta / Badge',
    category: 'special',
    type: 'text',
    icon: Tag,
    defaultText: 'NOWOŚĆ 2026',
    styles: {
      fontSize: '11px',
      fontWeight: '700',
      letterSpacing: '1px',
      color: '#a78bfa',
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      padding: { top: '4px', right: '8px', bottom: '4px', left: '8px' },
      borderRadius: '4px',
      display: 'inline-block',
    },
    previewStyle: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', color: '#a78bfa' },
  },
  {
    id: 'custom-text',
    name: 'Dowolny Tekst',
    category: 'body',
    type: 'text',
    icon: Type,
    defaultText: 'Kliknij dwukrotnie, aby edytować tekst...',
    styles: {
      fontSize: '16px',
      fontWeight: '400',
      color: '#ffffff',
    },
    previewStyle: { fontSize: '12px', color: '#ffffff' },
  },
];

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
                  <Icon className="w-4 h-4" />
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
