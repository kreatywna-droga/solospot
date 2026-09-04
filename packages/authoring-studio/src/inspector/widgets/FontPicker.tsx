'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Sparkles } from 'lucide-react';
import {
  GOOGLE_FONTS_CATALOG,
  FontCategory,
  FontItem,
  loadGoogleFont,
} from '../../../../builder-core/src/fonts/FontCatalog';

export interface FontPickerProps {
  value?: string;
  onChange: (fontFamily: string) => void;
  className?: string;
}

const CATEGORIES: { id: FontCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'monospace', label: 'Mono' },
  { id: 'handwriting', label: 'Script' },
];

export const FontPicker: React.FC<FontPickerProps> = ({
  value = 'Inter',
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FontCategory | 'all'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load current font on mount and whenever value changes
  useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredFonts = useMemo(() => {
    return GOOGLE_FONTS_CATALOG.filter((f) => {
      const matchesCat = category === 'all' || f.category === category;
      const matchesSearch =
        !search.trim() || f.family.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, category]);

  const handleSelect = (font: FontItem) => {
    loadGoogleFont(font.family);
    onChange(font.family);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0e0e1a] border border-white/10 hover:border-violet-500/50 rounded px-2.5 py-1.5 text-xs text-white transition-all text-left group"
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="truncate font-medium"
            style={{ fontFamily: `'${value}', sans-serif` }}
          >
            {value}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 shrink-0 ml-1 transition-transform" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#080812] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col w-72 max-w-[calc(100vw-20px)] animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 border-b border-white/10 bg-[#0a0a16]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj czcionki (100+ fontów)..."
                className="w-full bg-[#121224] border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/80"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase whitespace-nowrap transition-colors ${
                    category === cat.id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-white/5 space-y-0.5">
            {filteredFonts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Nie znaleziono czcionki &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = value.toLowerCase() === font.family.toLowerCase();
                return (
                  <button
                    key={font.family}
                    type="button"
                    onMouseEnter={() => loadGoogleFont(font.family)}
                    onClick={() => handleSelect(font)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors group ${
                      isSelected
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'hover:bg-white/5 text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div
                        className="text-sm truncate"
                        style={{ fontFamily: `'${font.family}', ${font.fallback}` }}
                      >
                        {font.family}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <span>{font.category}</span>
                        {font.popular && (
                          <span className="flex items-center gap-0.5 text-amber-400/80 font-medium">
                            <Sparkles className="w-2.5 h-2.5" /> Popularny
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-1.5 bg-[#05050c] border-t border-white/5 text-[9px] text-slate-500 flex justify-between items-center">
            <span>Dostępnych: {filteredFonts.length} fontów</span>
            <span className="text-violet-400/80 font-mono">Google Fonts</span>
          </div>
        </div>
      )}
    </div>
  );
};
